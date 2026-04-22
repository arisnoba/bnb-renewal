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

TEACHER_CANDIDATE_DIRS = [
    "/web/data/teacher",
    "/data/teacher",
    "/teacher",
]

IMAGE_COLUMNS = [
    "profile_image_path",
    "photo_image1",
    "photo_image2",
    "photo_image3",
    "photo_image4",
    "photo_image5",
    "photo_image6",
]


@dataclass
class FTPSource:
    name: str
    host: str
    username: str
    password: str
    root_dir: str
    candidate_dirs: list[str]
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

    def download(self, entry: dict[str, Any], project_root: Path, dry_run: bool, force: bool) -> dict[str, Any]:
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

        if local_path.exists() and not dry_run and not force:
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

        for candidate_dir in source.candidate_dirs:
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
    entries = read_teacher_entries(project_root, include_drafts=args.include_drafts)

    if args.limit != "all":
        entries = entries[: args.limit]

    pool = FTPPool(sources)
    results: list[dict[str, Any]] = []

    try:
        for entry in entries:
            results.append(pool.download(entry, project_root, args.dry_run, args.force))
    finally:
        pool.close()

    output = {
        "dryRun": args.dry_run,
        "entries": entries,
        "generatedAt": now_iso(),
        "outputRoot": "public/legacy/teachers",
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
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--include-drafts", action="store_true")
    parser.add_argument("--limit", default="all")
    parser.add_argument("--output", default="tmp/legacy-assets/teacher-image-download-report.json")
    args = parser.parse_args()

    if args.limit != "all":
        args.limit = int(args.limit)

        if args.limit <= 0:
            raise ValueError("--limit 값은 양수 또는 all 이어야 합니다.")

    return args


def read_teacher_entries(project_root: Path, include_drafts: bool) -> list[dict[str, Any]]:
    status_sql = "" if include_drafts else "WHERE status = 'published'"
    sql = f"""
SELECT
  id,
  source_db,
  source_table,
  source_id,
  slug,
  name,
  profile_image_path,
  photo_image1,
  photo_image2,
  photo_image3,
  photo_image4,
  photo_image5,
  photo_image6,
  gallery
FROM bnb_legacy_work.teachers
{status_sql}
ORDER BY status = 'published' DESC, display_order, id;
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

        if len(parts) != 14:
            continue

        (
            work_id,
            source_db,
            source_table,
            source_id,
            slug,
            name,
            profile_image_path,
            photo_image1,
            photo_image2,
            photo_image3,
            photo_image4,
            photo_image5,
            photo_image6,
            gallery_json,
        ) = parts
        values_by_column = {
            "profile_image_path": profile_image_path,
            "photo_image1": photo_image1,
            "photo_image2": photo_image2,
            "photo_image3": photo_image3,
            "photo_image4": photo_image4,
            "photo_image5": photo_image5,
            "photo_image6": photo_image6,
        }

        for column, raw_path in values_by_column.items():
            image_path = to_image_path(raw_path)

            if image_path:
                entries.append(to_entry(work_id, source_db, source_table, source_id, slug, name, column, image_path))

        for index, image_path in enumerate(read_gallery_paths(gallery_json), start=1):
            entries.append(
                to_entry(work_id, source_db, source_table, source_id, slug, name, f"gallery{index}", image_path)
            )

    return dedupe_entries(entries)


def read_gallery_paths(value: str) -> list[str]:
    value = none_if_null(value)

    if not value:
        return []

    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return []

    if not isinstance(parsed, list):
        return []

    paths: list[str] = []

    for item in parsed:
        if not isinstance(item, dict):
            continue

        image_path = to_image_path(item.get("path"))

        if image_path:
            paths.append(image_path)

    return paths


def to_entry(
    work_id: str,
    source_db: str,
    source_table: str,
    source_id: str,
    slug: str,
    name: str,
    column: str,
    image_path: str,
) -> dict[str, Any]:
    return {
        "collection": "teachers",
        "column": column,
        "localPath": f"public/legacy/teachers/{source_db}/{source_table}/{image_path}",
        "name": name,
        "remotePath": f"web/data/teacher/{image_path}",
        "slug": slug,
        "sourceDb": source_db,
        "sourceId": parse_int(source_id),
        "sourcePath": image_path,
        "sourceTable": source_table,
        "sourceUrl": source_url(source_db, image_path),
        "workId": parse_int(work_id),
    }


def to_image_path(value: Any) -> str | None:
    path = none_if_null(str(value or ""))

    if not path or path.startswith(("http://", "https://")):
        return None

    path = path.lstrip("/")

    if not path.lower().endswith((".avif", ".bmp", ".gif", ".jpg", ".jpeg", ".png", ".svg", ".webp")):
        return None

    return path


def dedupe_entries(entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[tuple[str, str, str]] = set()
    deduped: list[dict[str, Any]] = []

    for entry in entries:
        key = (str(entry["sourceDb"]), str(entry["sourceTable"]), str(entry["sourcePath"]))

        if key in seen:
            continue

        seen.add(key)
        deduped.append(entry)

    return deduped


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
            candidate_dirs=list(
                src.get(
                    "teacherCandidateDirs",
                    defaults.get("teacherCandidateDirs", TEACHER_CANDIDATE_DIRS),
                )
            ),
            port=int(src.get("port", defaults.get("port", 21))),
            passive=bool(src.get("passive", defaults.get("passive", True))),
            timeout_seconds=int(src.get("timeoutSeconds", defaults.get("timeoutSeconds", 30))),
            use_tls=bool(src.get("useTls", defaults.get("useTls", False))),
        )
        sources[source.name] = source

    if not sources:
        raise ValueError("사용 가능한 FTP source가 없습니다.")

    return sources


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


def source_url(source_db: str, image_path: str) -> str:
    host_by_db = {
        "baewoo": "https://www.baewoo.co.kr",
        "bnbuniv": "https://www.baewoo.kr:443",
        "kidscenter": "https://www.baewoo.net",
        "bnbhighteen": "https://www.baewoo.me",
    }
    host = host_by_db.get(source_db, "https://www.baewoo.co.kr")
    return f"{host}/web/data/teacher/{image_path}"


def parse_int(value: str) -> int:
    try:
        return int(value)
    except ValueError:
        return 0


def none_if_null(value: str) -> str | None:
    value = value.strip()
    return None if value in {"", "NULL", "\\N"} else value


def build_totals(results: list[dict[str, Any]]) -> dict[str, Any]:
    total_bytes = sum(
        int(result.get("bytes") or 0)
        for result in results
        if result["status"] in {"downloaded", "planned", "skipped"}
    )

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
