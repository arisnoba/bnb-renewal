from __future__ import annotations

import argparse
import json
import os
import posixpath
from dataclasses import dataclass
from datetime import datetime, timezone
from ftplib import FTP, FTP_TLS
from pathlib import Path
from typing import Any


DEFAULT_CONFIG_PATHS = [
    "config/profile-image-ftp-sources.json",
    "config/profile-image-ftp-sources.template.json",
]

TEACHER_CANDIDATE_DIRS = [
    "/web/data/teacher",
    "/data/teacher",
    "/teacher",
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
    def __init__(self, sources: list[FTPSource]) -> None:
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

    def download_first_available(
        self,
        entry: dict[str, Any],
        project_root: Path,
        dry_run: bool,
    ) -> dict[str, Any]:
        attempts: list[dict[str, str]] = []
        remote_path = str(entry["ftpRemotePath"]).lstrip("/")
        relative_dir = posixpath.dirname(remote_path)
        file_name = posixpath.basename(remote_path)

        for source in self._sources:
            for candidate_dir in source.candidate_dirs:
                try:
                    client = self._get_client(source)
                except Exception as exc:  # noqa: BLE001
                    attempts.append({"source": source.name, "status": f"connect-failed: {exc}"})
                    break

                absolute_dir = resolve_candidate_dir(source.root_dir, candidate_dir, relative_dir)
                absolute_file = posixpath.join(absolute_dir, file_name)

                try:
                    client.cwd(absolute_dir)
                    size = client.size(file_name)
                    client.cwd(source.root_dir)

                    result = {
                        "bytes": int(size or 0),
                        "collection": entry["collection"],
                        "column": entry["column"],
                        "ftpRemotePath": absolute_file,
                        "ftpSource": source.name,
                        "id": entry["id"],
                        "localPath": entry["localPath"],
                        "normalizedUrl": entry["normalizedUrl"],
                        "sourcePath": entry["sourcePath"],
                        "status": "planned" if dry_run else "downloaded",
                        "title": entry.get("title"),
                    }

                    if dry_run:
                        return result

                    local_path = project_root / str(entry["localPath"])
                    local_path.parent.mkdir(parents=True, exist_ok=True)

                    with local_path.open("wb") as handle:
                        client.cwd(absolute_dir)
                        client.retrbinary(f"RETR {file_name}", handle.write)
                        client.cwd(source.root_dir)

                    result["bytes"] = local_path.stat().st_size
                    return result
                except Exception as exc:  # noqa: BLE001
                    attempts.append(
                        {
                            "source": source.name,
                            "status": f"missing-or-failed: {absolute_file}: {exc}",
                        }
                    )
                    self._reset_connection(source.name)

        return {
            "attempts": attempts,
            "collection": entry.get("collection"),
            "column": entry.get("column"),
            "id": entry.get("id"),
            "localPath": entry.get("localPath"),
            "normalizedUrl": entry.get("normalizedUrl"),
            "sourcePath": entry.get("sourcePath"),
            "status": "failed",
            "title": entry.get("title"),
        }

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
    manifest = load_manifest(project_root, args.manifest_path)
    sources = build_sources(config)
    pool = FTPPool(sources)
    entries = manifest["entries"]

    if args.limit != "all":
        entries = entries[: args.limit]

    results: list[dict[str, Any]] = []

    try:
        for entry in entries:
            results.append(pool.download_first_available(entry, project_root, args.dry_run))
    finally:
        pool.close()

    totals = build_totals(results)
    output = {
        "dryRun": args.dry_run,
        "generatedAt": now_iso(),
        "manifestPath": args.manifest_path,
        "results": results,
        "totals": totals,
    }

    output_path = project_root / args.output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2))

    print(
        json.dumps(
            {
                "downloaded": totals["downloaded"],
                "dryRun": args.dry_run,
                "failed": totals["failed"],
                "outputPath": args.output,
                "planned": totals["planned"],
                "totalBytes": totals["totalBytes"],
                "totalMiB": totals["totalMiB"],
                "total": totals["total"],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config-path")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--limit", default="all")
    parser.add_argument("--manifest-path", default="tmp/c0/teacher-image-manifest.json")
    parser.add_argument("--output", default="tmp/c0/teacher-image-download-report.json")
    args = parser.parse_args()

    if args.limit != "all":
        args.limit = int(args.limit)

        if args.limit <= 0:
            raise ValueError("--limit 값은 양수 또는 all 이어야 합니다.")

    return args


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


def load_manifest(project_root: Path, manifest_path: str) -> dict[str, Any]:
    manifest_file = project_root / manifest_path

    if not manifest_file.exists():
        raise FileNotFoundError(f"manifest 파일이 없습니다: {manifest_file}")

    parsed = json.loads(manifest_file.read_text())

    if not isinstance(parsed.get("entries"), list):
        raise ValueError("manifest 형식이 잘못되었습니다.")

    return parsed


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


def build_sources(config: dict[str, Any]) -> list[FTPSource]:
    defaults = config.get("defaults", {})
    sources: list[FTPSource] = []

    for src in config.get("sources", []):
        if not src.get("enabled", True):
            continue

        password_env = str(src.get("passwordEnv", "")).strip()
        password = os.environ.get(password_env, "") if password_env else ""

        if not password:
            raise ValueError(f"{src.get('name')} 비밀번호 환경변수가 비어 있습니다: {password_env}")

        sources.append(
            FTPSource(
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
        )

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


def build_totals(results: list[dict[str, Any]]) -> dict[str, Any]:
    total_bytes = sum(int(result.get("bytes") or 0) for result in results if result["status"] in {"downloaded", "planned"})

    return {
        "downloaded": sum(1 for result in results if result["status"] == "downloaded"),
        "failed": sum(1 for result in results if result["status"] == "failed"),
        "planned": sum(1 for result in results if result["status"] == "planned"),
        "total": len(results),
        "totalBytes": total_bytes,
        "totalMiB": round(total_bytes / 1024 / 1024, 3),
    }


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


if __name__ == "__main__":
    main()
