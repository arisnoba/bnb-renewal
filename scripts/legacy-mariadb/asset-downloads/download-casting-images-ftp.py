from __future__ import annotations

import argparse
import json
import os
import posixpath
import subprocess
from dataclasses import dataclass
from datetime import datetime, timezone
from ftplib import FTP, FTP_TLS
from pathlib import Path
from typing import Any


DEFAULT_CONFIG_PATHS = [
    "config/profile-image-ftp-sources.json",
    "config/profile-image-ftp-sources.template.json",
]

SOURCE_BY_DB = {
    "baewoo": "art",
    "bnbuniv": "exam",
    "kidscenter": "kids",
    "bnbhighteen": "highteen",
}


@dataclass
class FTPSource:
    name: str
    host: str
    username: str
    password: str
    root_dir: str
    port: int
    passive: bool
    timeout_seconds: int
    use_tls: bool


class FTPPool:
    def __init__(self, sources: dict[str, FTPSource]) -> None:
        self._sources = sources
        self._connections: dict[str, FTP] = {}

    def close(self) -> None:
        for client in self._connections.values():
            try:
                client.quit()
            except Exception:
                try:
                    client.close()
                except Exception:
                    pass
        self._connections.clear()

    def download(self, entry: dict[str, Any], project_root: Path, dry_run: bool) -> dict[str, Any]:
        source_name = SOURCE_BY_DB.get(str(entry["sourceDb"]))

        if not source_name:
            return {**entry, "status": "failed", "error": "unknown source DB"}

        source = self._sources.get(source_name)

        if not source:
            return {**entry, "status": "failed", "error": f"missing FTP source: {source_name}"}

        remote_file = str(entry["remotePath"]).lstrip("/")
        relative_dir = posixpath.dirname(remote_file)
        file_name = posixpath.basename(remote_file)
        local_path = project_root / str(entry["localPath"])

        if local_path.exists() and not dry_run:
            return {
                **entry,
                "bytes": local_path.stat().st_size,
                "ftpSource": source.name,
                "status": "skipped",
            }

        attempts: list[str] = []

        try:
            client = self._get_client(source)
        except Exception as exc:  # noqa: BLE001
            return {**entry, "status": "failed", "error": f"connect failed: {exc}"}

        for candidate_dir in candidate_dirs_for_bo_table(str(entry["boTable"])):
            absolute_dir = resolve_candidate_dir(source.root_dir, candidate_dir, relative_dir)
            absolute_file = posixpath.join(absolute_dir, file_name)

            try:
                client.cwd(absolute_dir)
                size = int(client.size(file_name) or 0)
                client.cwd(source.root_dir)

                if dry_run:
                    return {
                        **entry,
                        "bytes": size,
                        "ftpRemotePath": absolute_file,
                        "ftpSource": source.name,
                        "status": "planned",
                    }

                local_path.parent.mkdir(parents=True, exist_ok=True)

                with local_path.open("wb") as handle:
                    client.cwd(absolute_dir)
                    client.retrbinary(f"RETR {file_name}", handle.write)
                    client.cwd(source.root_dir)

                return {
                    **entry,
                    "bytes": local_path.stat().st_size,
                    "ftpRemotePath": absolute_file,
                    "ftpSource": source.name,
                    "status": "downloaded",
                }
            except Exception as exc:  # noqa: BLE001
                attempts.append(f"{absolute_file}: {exc}")
                self._reset_connection(source.name)
                try:
                    client = self._get_client(source)
                except Exception as connect_exc:  # noqa: BLE001
                    attempts.append(f"reconnect failed: {connect_exc}")
                    break

        return {**entry, "attempts": attempts, "status": "failed"}

    def _get_client(self, source: FTPSource) -> FTP:
        client = self._connections.get(source.name)

        if client is not None and getattr(client, "sock", None) is not None:
            return client

        if client is not None:
            self._reset_connection(source.name)

        ftp_cls = FTP_TLS if source.use_tls else FTP
        client = ftp_cls()
        client.connect(source.host, source.port, timeout=source.timeout_seconds)
        client.login(source.username, source.password)
        client.set_pasv(source.passive)

        if isinstance(client, FTP_TLS):
            client.prot_p()

        client.cwd(source.root_dir)
        self._connections[source.name] = client
        return client

    def _reset_connection(self, source_name: str) -> None:
        client = self._connections.pop(source_name, None)

        if client is None:
            return

        try:
            client.quit()
        except Exception:
            try:
                client.close()
            except Exception:
                pass


def main() -> None:
    args = parse_args()
    project_root = Path.cwd()
    load_env_local(project_root / ".env.local")
    config = load_config(project_root, args.config_path)
    sources = build_sources(config)
    entries = read_casting_entries(project_root)

    if args.limit != "all":
        entries = entries[: args.limit]

    pool = FTPPool(sources)
    results: list[dict[str, Any]] = []

    try:
        for entry in entries:
            results.append(pool.download(entry, project_root, args.dry_run))
    finally:
        pool.close()

    output = {
        "dryRun": args.dry_run,
        "entries": entries,
        "generatedAt": now_iso(),
        "outputRoot": "public/legacy/castings",
        "results": results,
        "totals": build_totals(results),
    }

    output_path = project_root / args.output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2))

    print(json.dumps(output["totals"] | {"outputPath": args.output}, ensure_ascii=False, indent=2))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config-path")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", default="all")
    parser.add_argument("--output", default="tmp/legacy-assets/casting-image-download-report.json")
    args = parser.parse_args()

    if args.limit != "all":
        args.limit = int(args.limit)

        if args.limit <= 0:
            raise ValueError("--limit 값은 양수 또는 all 이어야 합니다.")

    return args


def read_casting_entries(project_root: Path) -> list[dict[str, Any]]:
    sql = r"""
SELECT
  c.id,
  c.source_db,
  c.source_table,
  c.source_id,
  c.slug,
  c.person_name,
  REPLACE(c.source_table, 'g5_write_', '') AS bo_table,
  f.bf_no,
  f.bf_source,
  f.bf_file,
  f.bf_filesize
FROM bnb_legacy_work.castings c
JOIN (
  SELECT 'baewoo' AS source_db, bo_table, wr_id, bf_no, bf_source, bf_file, bf_filesize FROM baewoo.g5_board_file
  UNION ALL
  SELECT 'bnbuniv', bo_table, wr_id, bf_no, bf_source, bf_file, bf_filesize FROM bnbuniv.g5_board_file
  UNION ALL
  SELECT 'kidscenter', bo_table, wr_id, bf_no, bf_source, bf_file, bf_filesize FROM kidscenter.g5_board_file
  UNION ALL
  SELECT 'bnbhighteen', bo_table, wr_id, bf_no, bf_source, bf_file, bf_filesize FROM bnbhighteen.g5_board_file
) f
  ON f.source_db = c.source_db
  AND f.bo_table = REPLACE(c.source_table, 'g5_write_', '')
  AND f.wr_id = c.source_id
WHERE NULLIF(TRIM(f.bf_file), '') IS NOT NULL
ORDER BY c.id, f.bf_no;
""".strip()
    output = subprocess.check_output(
        [
            "docker",
            "compose",
            "exec",
            "-T",
            "legacy-mariadb",
            "mariadb",
            "-uroot",
            "-proot",
            "--batch",
            "--raw",
            "--skip-column-names",
            "-e",
            sql,
        ],
        cwd=project_root,
        text=True,
    )
    entries: list[dict[str, Any]] = []

    for line in output.splitlines():
        parts = line.split("\t")

        if len(parts) != 11:
            continue

        (
            work_id,
            source_db,
            source_table,
            source_id,
            slug,
            person_name,
            bo_table,
            bf_no,
            bf_source,
            bf_file,
            bf_filesize,
        ) = parts
        local_path = f"public/legacy/castings/{source_db}/{bo_table}/{source_id}/{bf_file}"

        entries.append(
            {
                "boTable": bo_table,
                "bytesInDb": parse_int(bf_filesize),
                "collection": "castings",
                "fileNo": parse_int(bf_no),
                "localPath": local_path,
                "originalName": none_if_null(bf_source),
                "personName": person_name,
                "remotePath": f"web/data/file/{bo_table}/{bf_file}",
                "slug": slug,
                "sourceDb": source_db,
                "sourceId": parse_int(source_id),
                "sourceTable": source_table,
                "sourceUrl": source_url(source_db, bo_table, bf_file),
                "workId": parse_int(work_id),
            }
        )

    return entries


def load_config(project_root: Path, explicit_path: str | None) -> dict[str, Any]:
    candidate_paths = [explicit_path] if explicit_path else DEFAULT_CONFIG_PATHS

    for candidate in candidate_paths:
        if not candidate:
            continue

        file_path = project_root / candidate

        if file_path.exists():
            config = json.loads(file_path.read_text())
            config["_configPath"] = str(file_path)
            return config

    raise FileNotFoundError("FTP 설정 파일을 찾지 못했습니다.")


def load_env_local(file_path: Path) -> None:
    if not file_path.exists():
        return

    for raw_line in file_path.read_text().splitlines():
        line = raw_line.strip()

        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")

        if key and key not in os.environ:
            os.environ[key] = value


def build_sources(config: dict[str, Any]) -> dict[str, FTPSource]:
    defaults = config.get("defaults", {})
    sources: dict[str, FTPSource] = {}

    for src in config.get("sources", []):
        if not src.get("enabled", True):
            continue

        password_env = str(src.get("passwordEnv", "")).strip()
        password = os.environ.get(password_env, "") if password_env else ""

        if not password:
            raise ValueError(f"{src.get('name')} 비밀번호 환경변수가 비어 있습니다: {password_env}")

        source = FTPSource(
            name=str(src["name"]),
            host=str(src["host"]),
            username=str(src["username"]),
            password=password,
            root_dir=str(src.get("rootDir", "/")),
            port=int(src.get("port", defaults.get("port", 21))),
            passive=bool(src.get("passive", defaults.get("passive", True))),
            timeout_seconds=int(src.get("timeoutSeconds", defaults.get("timeoutSeconds", 30))),
            use_tls=bool(src.get("useTls", defaults.get("useTls", False))),
        )
        sources[source.name] = source

    if not sources:
        raise ValueError("사용 가능한 FTP source가 없습니다.")

    return sources


def candidate_dirs_for_bo_table(bo_table: str) -> list[str]:
    return [
        f"/web/data/file/{bo_table}",
        f"/data/file/{bo_table}",
        f"/file/{bo_table}",
        f"/{bo_table}",
    ]


def resolve_candidate_dir(root_dir: str, candidate_dir: str, relative_dir: str) -> str:
    normalized_root = posixpath.normpath(root_dir)
    normalized_candidate = posixpath.normpath(candidate_dir)
    normalized_relative = posixpath.normpath(relative_dir)

    if normalized_relative.startswith(normalized_candidate.lstrip("/")):
        relative_suffix = normalized_relative[len(normalized_candidate.lstrip("/")) :].lstrip("/")
    else:
        relative_suffix = normalized_relative

    if normalized_candidate.startswith(normalized_root):
        base = normalized_candidate
    else:
        root_basename = posixpath.basename(normalized_root.rstrip("/"))
        candidate_prefix = f"/{root_basename}/"

        if root_basename and normalized_candidate.startswith(candidate_prefix):
            suffix = normalized_candidate[len(candidate_prefix) :]
            base = posixpath.normpath(posixpath.join(normalized_root, suffix))
        else:
            base = posixpath.normpath(posixpath.join(normalized_root, normalized_candidate.lstrip("/")))

    return posixpath.normpath(posixpath.join(base, relative_suffix))


def source_url(source_db: str, bo_table: str, file_name: str) -> str:
    host_by_db = {
        "baewoo": "https://www.baewoo.co.kr",
        "bnbuniv": "https://www.baewoo.kr:443",
        "kidscenter": "https://www.baewoo.net",
        "bnbhighteen": "https://www.baewoo.me",
    }
    host = host_by_db.get(source_db, "https://www.baewoo.co.kr")
    return f"{host}/web/data/file/{bo_table}/{file_name}"


def parse_int(value: str) -> int:
    try:
        return int(value)
    except ValueError:
        return 0


def none_if_null(value: str) -> str | None:
    value = value.strip()
    return None if value in {"", "NULL", "\\N"} else value


def build_totals(results: list[dict[str, Any]]) -> dict[str, Any]:
    total_bytes = sum(int(result.get("bytes") or 0) for result in results if result["status"] in {"downloaded", "planned", "skipped"})

    return {
        "downloaded": sum(1 for result in results if result["status"] == "downloaded"),
        "failed": sum(1 for result in results if result["status"] == "failed"),
        "planned": sum(1 for result in results if result["status"] == "planned"),
        "skipped": sum(1 for result in results if result["status"] == "skipped"),
        "total": len(results),
        "totalBytes": total_bytes,
        "totalMiB": round(total_bytes / 1024 / 1024, 3),
    }


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


if __name__ == "__main__":
    main()
