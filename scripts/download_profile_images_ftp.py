from __future__ import annotations

import argparse
import json
import os
import posixpath
from dataclasses import dataclass
from datetime import datetime, timezone
from ftplib import FTP, FTP_TLS, all_errors
from pathlib import Path
from typing import Any


DEFAULT_CONFIG_PATHS = [
    "config/profile-image-ftp-sources.json",
    "config/profile-image-ftp-sources.template.json",
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
        remote_path: str,
        local_path: Path,
        source_id: int,
        dry_run: bool,
    ) -> dict[str, Any]:
        attempts: list[dict[str, str]] = []

        for source in self._sources:
            for candidate_dir in source.candidate_dirs:
                try:
                    client = self._get_client(source)
                except Exception as exc:  # noqa: BLE001
                    attempts.append({"source": source.name, "status": f"connect-failed: {exc}"})
                    break

                absolute_dir = resolve_candidate_dir(source.root_dir, candidate_dir)
                file_name = posixpath.basename(remote_path)
                absolute_file = posixpath.join(absolute_dir, file_name)

                try:
                    client.cwd(absolute_dir)
                    if dry_run:
                        client.size(file_name)
                        client.cwd(source.root_dir)
                        return {
                            "ftpSource": source.name,
                            "localPath": str(local_path),
                            "publicPath": build_public_path(local_path),
                            "remotePath": absolute_file,
                            "sourceId": source_id,
                            "status": "planned",
                        }

                    local_path.parent.mkdir(parents=True, exist_ok=True)
                    with local_path.open("wb") as handle:
                        client.retrbinary(f"RETR {file_name}", handle.write)
                    client.cwd(source.root_dir)

                    return {
                        "ftpSource": source.name,
                        "localPath": str(local_path),
                        "publicPath": build_public_path(local_path),
                        "remotePath": absolute_file,
                        "sourceId": source_id,
                        "status": "downloaded",
                    }
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
            "sourceId": source_id,
            "status": "failed",
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
    success_state_path = project_root / config["successStatePath"]
    report_path = project_root / config["reportPath"]
    download_root = project_root / config["downloadRoot"]

    success_state = load_json_file(success_state_path, default={"downloadedAt": "", "entries": []})
    previous_entries = {
        int(entry["sourceId"]): entry
        for entry in success_state.get("entries", [])
        if isinstance(entry, dict) and "sourceId" in entry
    }

    sources = build_sources(config)
    pool = FTPPool(sources)

    results: list[dict[str, Any]] = []
    success_entries: list[dict[str, Any]] = []

    try:
        entries = manifest["entries"]
        if args.limit != "all":
            entries = entries[: args.limit]

        for entry in entries:
            source_id = int(entry["sourceId"])
            target_path = project_root / "public" / entry["publicPath"].lstrip("/")
            previous = previous_entries.get(source_id)

            if (
                previous
                and Path(previous["localPath"]).exists()
                and not args.force
            ):
                result = dict(previous)
                result["status"] = "skipped-existing"
                results.append(result)
                success_entries.append(previous)
                continue

            result = pool.download_first_available(
                remote_path=entry["remotePath"],
                local_path=target_path,
                source_id=source_id,
                dry_run=args.dry_run,
            )

            if result["status"] in {"downloaded", "planned"}:
                result["publicPath"] = entry["publicPath"]
                results.append(result)
                if not args.dry_run:
                    success_entries.append(
                        {
                            "ftpSource": result["ftpSource"],
                            "localPath": result["localPath"],
                            "publicPath": entry["publicPath"],
                            "remotePath": result["remotePath"],
                            "sourceId": source_id,
                        }
                    )
                continue

            result["publicPath"] = entry["publicPath"]
            result["remotePath"] = entry["remotePath"]
            results.append(result)

        report_path.parent.mkdir(parents=True, exist_ok=True)
        report = {
            "dryRun": args.dry_run,
            "generatedAt": now_iso(),
            "results": results,
            "total": len(results),
        }
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2))

        if not args.dry_run:
            merged_entries = merge_success_entries(previous_entries, success_entries)
            success_state_path.parent.mkdir(parents=True, exist_ok=True)
            success_state_path.write_text(
                json.dumps(
                    {
                        "downloadedAt": now_iso(),
                        "entries": merged_entries,
                    },
                    ensure_ascii=False,
                    indent=2,
                )
            )
    finally:
        pool.close()

    print(
        json.dumps(
            {
                "configPath": config["_configPath"],
                "dryRun": args.dry_run,
                "downloadRoot": str(download_root),
                "failed": sum(1 for result in results if result["status"] == "failed"),
                "reportPath": str(report_path),
                "successStatePath": str(success_state_path),
                "succeeded": sum(
                    1 for result in results if result["status"] in {"downloaded", "planned", "skipped-existing"}
                ),
                "total": len(results),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config-path")
    parser.add_argument(
        "--manifest-path",
        default="tmp/profile-image-manifest.json",
    )
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--limit", default="all")
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
        raise FileNotFoundError(
            f"manifest 파일이 없습니다: {manifest_file}. 먼저 `npm run profiles:images:manifest`를 실행하세요."
        )

    parsed = json.loads(manifest_file.read_text())
    entries = parsed.get("entries")
    if not isinstance(entries, list):
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
                candidate_dirs=list(src.get("candidateDirs", defaults.get("candidateDirs", []))),
                port=int(src.get("port", defaults.get("port", 21))),
                passive=bool(src.get("passive", defaults.get("passive", True))),
                timeout_seconds=int(src.get("timeoutSeconds", defaults.get("timeoutSeconds", 30))),
                use_tls=bool(src.get("useTls", defaults.get("useTls", False))),
            )
        )

    if not sources:
        raise ValueError("사용 가능한 FTP source가 없습니다.")

    return sources


def resolve_candidate_dir(root_dir: str, candidate_dir: str) -> str:
    normalized_root = posixpath.normpath(root_dir)
    normalized_candidate = posixpath.normpath(candidate_dir)

    if normalized_candidate.startswith(normalized_root):
        return normalized_candidate

    root_basename = posixpath.basename(normalized_root.rstrip("/"))
    candidate_prefix = f"/{root_basename}/"

    if root_basename and normalized_candidate.startswith(candidate_prefix):
        suffix = normalized_candidate[len(candidate_prefix) :]
        return posixpath.normpath(posixpath.join(normalized_root, suffix))

    return posixpath.normpath(posixpath.join(normalized_root, normalized_candidate.lstrip("/")))


def load_json_file(file_path: Path, default: dict[str, Any]) -> dict[str, Any]:
    if not file_path.exists():
        return default
    return json.loads(file_path.read_text())


def merge_success_entries(
    previous_entries: dict[int, dict[str, Any]],
    new_entries: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    merged = dict(previous_entries)
    for entry in new_entries:
        merged[int(entry["sourceId"])] = entry
    return [merged[key] for key in sorted(merged)]


def build_public_path(local_path: Path) -> str:
    try:
        relative = local_path.relative_to(Path.cwd() / "public")
    except ValueError:
        return "/" + local_path.name
    return "/" + relative.as_posix()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


if __name__ == "__main__":
    main()
