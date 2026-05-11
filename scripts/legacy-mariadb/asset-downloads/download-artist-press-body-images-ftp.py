from __future__ import annotations

import argparse
import html
import importlib.util
import json
import os
import posixpath
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


SHARED_SCRIPT_PATH = Path(__file__).with_name("download-work-table-assets-ftp.py")
IMAGE_SRC_RE = re.compile(r"<img\b[^>]*\ssrc=[\"']([^\"']+)[\"']", re.IGNORECASE)
IMAGE_EXTENSION_RE = re.compile(r"\.(?:avif|bmp|gif|jpe?g|png|svg|webp)$", re.IGNORECASE)

HOST_BY_DB = {
    "baewoo": "https://www.baewoo.co.kr",
    "bnbuniv": "https://www.baewoo.kr",
    "kidscenter": "https://www.baewoo.net",
    "bnbhighteen": "https://www.baewoo.me",
}

DB_BY_HOST = {
    "baewoo.co.kr": "baewoo",
    "www.baewoo.co.kr": "baewoo",
    "baewoobaewoo.cafe24.com": "baewoo",
    "baewoo.kr": "bnbuniv",
    "www.baewoo.kr": "bnbuniv",
    "baewoo.net": "kidscenter",
    "www.baewoo.net": "kidscenter",
    "baewoo.me": "bnbhighteen",
    "www.baewoo.me": "bnbhighteen",
}


shared_spec = importlib.util.spec_from_file_location("download_work_table_assets_ftp", SHARED_SCRIPT_PATH)
assert shared_spec and shared_spec.loader
shared = importlib.util.module_from_spec(shared_spec)
sys.modules[shared_spec.name] = shared
shared_spec.loader.exec_module(shared)


def main() -> None:
    args = parse_args()
    project_root = Path.cwd()

    shared.load_env_local(project_root / "config/env/local-postgres.env")
    shared.load_env_local(project_root / ".env.local")

    rows = read_artist_press_rows(project_root, args.source)
    entries = build_entries(rows)
    original_entry_count = len(entries)

    if args.sample_size:
        entries = sample_entries(entries, args.sample_size)
    elif args.limit != "all":
        entries = entries[: args.limit]

    if args.plan_only:
        results = [{**entry, "status": "planned-local"} for entry in entries]
    else:
        config = shared.load_config(project_root, args.config_path)
        sources = shared.build_sources(config)
        pool = shared.FTPPool(sources)
        results: list[dict[str, Any]] = []

        try:
            for index, entry in enumerate(entries, start=1):
                results.append(download_entry(pool, entry, project_root, args.dry_run))

                if should_print_progress(index, len(entries), args.progress_every):
                    print_progress(index, len(entries), results)
        finally:
            pool.close()

    output = {
        "collection": "artist-press",
        "dryRun": args.dry_run,
        "entries": entries,
        "generatedAt": now_iso(),
        "originalEntryCount": original_entry_count,
        "outputRoot": "public/legacy/artist-press",
        "planOnly": args.plan_only,
        "results": results,
        "sampleSize": args.sample_size,
        "totals": build_totals(results),
    }

    output_path = project_root / args.output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2))

    print(json.dumps(output["totals"] | {"outputPath": args.output}, ensure_ascii=False, indent=2))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config-path")
    parser.add_argument("--dry-run", action="store_true", help="FTP에 접속해 파일 존재와 크기만 확인합니다.")
    parser.add_argument("--limit", default="all")
    parser.add_argument("--output", default="tmp/legacy-assets/artist-press-body-image-download-report.json")
    parser.add_argument("--plan-only", action="store_true", help="FTP 접속 없이 DB 본문 이미지 목록만 생성합니다.")
    parser.add_argument("--progress-every", default=50, type=int)
    parser.add_argument("--sample-size", type=int)
    parser.add_argument("--source", choices=["postgres", "mariadb"], default="postgres")
    args = parser.parse_args()

    if args.limit != "all":
        args.limit = int(args.limit)

        if args.limit <= 0:
            raise ValueError("--limit 값은 양수 또는 all 이어야 합니다.")

    if args.progress_every < 0:
        raise ValueError("--progress-every 값은 0 이상이어야 합니다.")

    if args.sample_size is not None and args.sample_size <= 0:
        raise ValueError("--sample-size 값은 양수여야 합니다.")

    if args.plan_only and args.dry_run:
        raise ValueError("--plan-only 와 --dry-run 은 함께 사용할 수 없습니다.")

    return args


def read_artist_press_rows(project_root: Path, source: str) -> list[dict[str, Any]]:
    if source == "postgres":
        return read_artist_press_rows_from_postgres(project_root)

    return read_artist_press_rows_from_mariadb(project_root)


def read_artist_press_rows_from_postgres(project_root: Path) -> list[dict[str, Any]]:
    sql = """
SELECT
  id::text AS id,
  COALESCE(source_db, '') AS source_db,
  COALESCE(source_table, '') AS source_table,
  COALESCE(source_id::text, '') AS source_id,
  COALESCE(slug, '') AS slug,
  REPLACE(REPLACE(REPLACE(COALESCE(title, ''), CHR(9), ' '), CHR(10), ' '), CHR(13), ' ') AS title,
  encode(convert_to(COALESCE(body_html, ''), 'UTF8'), 'hex') AS body_html_hex
FROM artist_press
WHERE body_html ILIKE '%<img%'
ORDER BY id ASC
""".strip()
    output = subprocess.check_output(
        [
            "psql",
            database_url(),
            "--tuples-only",
            "--no-align",
            "--field-separator",
            "\t",
            "-c",
            sql,
        ],
        cwd=project_root,
        text=True,
    )

    return parse_row_output(output)


def read_artist_press_rows_from_mariadb(project_root: Path) -> list[dict[str, Any]]:
    sql = """
SELECT
  CAST(id AS CHAR) AS id,
  source_db,
  source_table,
  CAST(source_id AS CHAR) AS source_id,
  slug,
  REPLACE(REPLACE(REPLACE(COALESCE(title, ''), CHAR(9), ' '), CHAR(10), ' '), CHAR(13), ' ') AS title,
  HEX(COALESCE(body_html, '')) AS body_html_hex
FROM bnb_legacy_work.artist_press
WHERE body_html LIKE '%<img%'
ORDER BY id ASC
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

    return parse_row_output(output)


def parse_row_output(output: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    for line in output.splitlines():
        parts = line.split("\t")

        if len(parts) != 7:
            continue

        body_html = bytes.fromhex(parts[6]).decode("utf-8", errors="replace")
        rows.append(
            {
                "bodyHtml": body_html,
                "id": parse_int(parts[0]),
                "slug": parts[4],
                "sourceDb": parts[1],
                "sourceId": parse_int(parts[3]),
                "sourceTable": parts[2],
                "title": parts[5],
            }
        )

    return rows


def database_url() -> str:
    return (
        os.environ.get("DATABASE_URL_UNPOOLED")
        or os.environ.get("POSTGRES_URL_NON_POOLING")
        or os.environ.get("DATABASE_URL")
        or os.environ.get("POSTGRES_URL")
        or "postgresql://postgres:postgres@127.0.0.1:5432/bnb_renewal"
    )


def build_entries(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    seen: set[tuple[int, str]] = set()

    for row in rows:
        for source in extract_image_sources(row["bodyHtml"]):
            normalized = normalize_legacy_image(source, row["sourceDb"])

            if not normalized:
                continue

            key = (row["id"], normalized["sourceUrl"])

            if key in seen:
                continue

            seen.add(key)
            source_db = normalized["sourceDb"]
            bo_table = source_table_to_bo_table(row["sourceTable"])
            local_path = build_local_path(source_db, bo_table, row["sourceId"], normalized["remotePath"])

            entries.append(
                {
                    "assetRole": "body",
                    "boTable": bo_table,
                    "collection": "artist-press",
                    "localPath": local_path,
                    "localUrl": "/" + local_path.removeprefix("public/"),
                    "normalizedUrl": normalized["sourceUrl"],
                    "originalSrc": source,
                    "remotePath": normalized["remotePath"],
                    "slug": row["slug"],
                    "sourceDb": source_db,
                    "sourceId": row["sourceId"],
                    "sourceTable": row["sourceTable"],
                    "sourceUrl": normalized["sourceUrl"],
                    "title": row["title"],
                    "workId": row["id"],
                }
            )

    return entries


def extract_image_sources(value: str) -> list[str]:
    sources: list[str] = []

    for match in IMAGE_SRC_RE.finditer(value):
        src = html.unescape(str(match.group(1) or "").strip())

        if src:
            sources.append(src)

    return sources


def normalize_legacy_image(value: str, fallback_source_db: str) -> dict[str, str] | None:
    cleaned = html.unescape(value).strip()

    if not cleaned or cleaned.startswith(("data:", "blob:", "mailto:", "tel:")):
        return None

    if cleaned.startswith("//"):
        cleaned = f"https:{cleaned}"

    if cleaned.startswith(("/web/data/", "/web/img/", "/data/")):
        parsed = urlparse(f"{HOST_BY_DB.get(fallback_source_db, HOST_BY_DB['baewoo'])}{cleaned}")
    elif cleaned.startswith(("web/data/", "web/img/", "data/")):
        parsed = urlparse(f"{HOST_BY_DB.get(fallback_source_db, HOST_BY_DB['baewoo'])}/{cleaned}")
    else:
        parsed = urlparse(cleaned)

    if not parsed.scheme or not parsed.netloc:
        return None

    host = normalize_host(parsed.hostname or "")
    source_db = DB_BY_HOST.get(host, fallback_source_db)

    if host not in DB_BY_HOST and not host.endswith(".baewoo.co.kr"):
        return None

    remote_path = parsed.path.lstrip("/")

    if not looks_like_image(remote_path):
        return None

    return {
        "remotePath": remote_path,
        "sourceDb": source_db,
        "sourceUrl": f"https://{host}/{remote_path}",
    }


def download_entry(pool: Any, entry: dict[str, Any], project_root: Path, dry_run: bool) -> dict[str, Any]:
    source_name = shared.SOURCE_BY_DB.get(str(entry["sourceDb"]))

    if not source_name:
        return {**entry, "status": "failed", "error": "unknown source DB"}

    source = pool._sources.get(source_name)

    if not source:
        return {**entry, "status": "failed", "error": f"missing FTP source: {source_name}"}

    remote_path = str(entry["remotePath"]).lstrip("/")
    relative_dir = posixpath.dirname(remote_path)
    file_name = posixpath.basename(remote_path)
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
        client = pool._get_client(source)
    except Exception as exc:  # noqa: BLE001
        return {**entry, "status": "failed", "error": f"connect failed: {exc}"}

    for candidate_dir in candidate_dirs_for_remote_path(remote_path):
        absolute_dir = shared.resolve_candidate_dir(source.root_dir, candidate_dir, relative_dir)
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
            pool._reset_connection(source.name)

            try:
                client = pool._get_client(source)
            except Exception as connect_exc:  # noqa: BLE001
                attempts.append(f"reconnect failed: {connect_exc}")
                break

    return {**entry, "attempts": attempts, "status": "failed"}


def candidate_dirs_for_remote_path(remote_path: str) -> list[str]:
    relative_dir = posixpath.dirname(remote_path)

    if remote_path.startswith("web/data/editor/"):
        return ["/web/data/editor", "/data/editor", f"/{relative_dir}"]

    if remote_path.startswith("data/editor/"):
        return ["/data/editor", "/web/data/editor", f"/{relative_dir}"]

    if remote_path.startswith("web/img/"):
        return ["/web/img", "/img", f"/{relative_dir}"]

    return [f"/{relative_dir}"]


def build_local_path(source_db: str, bo_table: str, source_id: int, remote_path: str) -> str:
    return (
        f"public/legacy/artist-press/{source_db}/{bo_table}/{source_id}/body/"
        f"{local_body_suffix(remote_path)}"
    )


def local_body_suffix(remote_path: str) -> str:
    if remote_path.startswith("web/data/"):
        return remote_path.removeprefix("web/data/")

    if remote_path.startswith("data/"):
        return remote_path.removeprefix("data/")

    if remote_path.startswith("web/"):
        return remote_path.removeprefix("web/")

    return f"other/{remote_path}"


def source_table_to_bo_table(value: str) -> str:
    return value.removeprefix("g5_write_") or "new_shoot"


def sample_entries(entries: list[dict[str, Any]], sample_size: int) -> list[dict[str, Any]]:
    if sample_size >= len(entries):
        return entries

    if sample_size == 1:
        return [entries[0]]

    last_index = len(entries) - 1
    indexes = sorted({round(index * last_index / (sample_size - 1)) for index in range(sample_size)})
    return [entries[index] for index in indexes]


def build_totals(results: list[dict[str, Any]]) -> dict[str, Any]:
    total_bytes = sum(
        int(result.get("bytes") or 0)
        for result in results
        if result["status"] in {"downloaded", "planned", "planned-local", "skipped"}
    )

    return {
        "downloaded": sum(1 for result in results if result["status"] == "downloaded"),
        "failed": sum(1 for result in results if result["status"] == "failed"),
        "planned": sum(1 for result in results if result["status"] in {"planned", "planned-local"}),
        "skipped": sum(1 for result in results if result["status"] == "skipped"),
        "total": len(results),
        "totalBytes": total_bytes,
        "totalMiB": round(total_bytes / 1024 / 1024, 3),
    }


def should_print_progress(index: int, total: int, progress_every: int) -> bool:
    if total == 0 or progress_every == 0:
        return False

    return index == 1 or index == total or index % progress_every == 0


def print_progress(index: int, total: int, results: list[dict[str, Any]]) -> None:
    totals = build_totals(results)
    print(
        (
            f"[artist-press-body] {index}/{total} "
            f"planned={totals['planned']} downloaded={totals['downloaded']} "
            f"skipped={totals['skipped']} failed={totals['failed']}"
        ),
        flush=True,
    )


def looks_like_image(value: str) -> bool:
    path = value.split("?", 1)[0].split("#", 1)[0]
    return bool(IMAGE_EXTENSION_RE.search(path))


def normalize_host(value: str) -> str:
    normalized = value.lower()

    if normalized == "baewoo.co.kr":
        return "www.baewoo.co.kr"

    if normalized == "www.baewoo.kr":
        return "baewoo.kr"

    if normalized == "www.baewoo.net":
        return "baewoo.net"

    if normalized == "www.baewoo.me":
        return "baewoo.me"

    return normalized


def parse_int(value: str) -> int:
    try:
        return int(value)
    except ValueError:
        return 0


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


if __name__ == "__main__":
    main()
