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
from urllib.parse import urlparse


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

HOST_BY_DB = {
    "baewoo": "https://www.baewoo.co.kr",
    "bnbuniv": "https://www.baewoo.kr:443",
    "kidscenter": "https://www.baewoo.net",
    "bnbhighteen": "https://www.baewoo.me",
}


@dataclass(frozen=True)
class CollectionConfig:
    label: str
    output_root: str
    sql: str


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
    collection = COLLECTIONS[args.collection]
    config = load_config(project_root, args.config_path)
    sources = build_sources(config)
    entries = read_entries(project_root, args.collection, collection)

    original_entry_count = len(entries)

    if args.sample_size:
        entries = sample_entries(entries, args.sample_size)
    elif args.limit != "all":
        entries = entries[: args.limit]

    pool = FTPPool(sources)
    results: list[dict[str, Any]] = []

    try:
        for index, entry in enumerate(entries, start=1):
            results.append(pool.download(entry, project_root, args.dry_run))

            if should_print_progress(index, len(entries), args.progress_every):
                print_progress(args.collection, index, len(entries), results)
    finally:
        pool.close()

    output = {
        "collection": args.collection,
        "dryRun": args.dry_run,
        "entries": entries,
        "generatedAt": now_iso(),
        "originalEntryCount": original_entry_count,
        "outputRoot": collection.output_root,
        "results": results,
        "sampleSize": args.sample_size,
        "totals": build_totals(results),
    }

    output_path = project_root / args.output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2))

    print(json.dumps(output["totals"] | {"collection": args.collection, "outputPath": args.output}, ensure_ascii=False, indent=2))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--collection", choices=sorted(COLLECTIONS), required=True)
    parser.add_argument("--config-path")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", default="all")
    parser.add_argument("--output")
    parser.add_argument("--progress-every", default=25, type=int)
    parser.add_argument("--sample-size", type=int)
    args = parser.parse_args()

    if args.limit != "all":
        args.limit = int(args.limit)

        if args.limit <= 0:
            raise ValueError("--limit 값은 양수 또는 all 이어야 합니다.")

    if not args.output:
        args.output = f"tmp/legacy-assets/{args.collection}-image-download-report.json"

    if args.progress_every < 0:
        raise ValueError("--progress-every 값은 0 이상이어야 합니다.")

    if args.sample_size is not None and args.sample_size <= 0:
        raise ValueError("--sample-size 값은 양수여야 합니다.")

    return args


def read_entries(project_root: Path, collection_slug: str, collection: CollectionConfig) -> list[dict[str, Any]]:
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
            collection.sql.strip(),
        ],
        cwd=project_root,
        text=True,
    )
    entries: list[dict[str, Any]] = []

    for line in output.splitlines():
        parts = line.split("\t")

        if len(parts) != 12:
            continue

        (
            work_id,
            source_db,
            source_table,
            source_id,
            slug,
            title,
            asset_role,
            bo_table,
            file_no,
            original_name,
            path_or_url,
            bytes_in_db,
        ) = parts
        remote_path = resolve_remote_path(bo_table, path_or_url)
        file_name = posixpath.basename(remote_path)

        if not file_name:
            continue

        entries.append(
            {
                "assetRole": asset_role,
                "boTable": bo_table,
                "bytesInDb": parse_int(bytes_in_db),
                "collection": collection_slug,
                "fileNo": parse_int(file_no),
                "localPath": build_local_path(collection.output_root, source_db, bo_table, source_id, asset_role, file_name),
                "originalName": none_if_null(original_name),
                "remotePath": remote_path,
                "slug": slug,
                "sourceDb": source_db,
                "sourceId": parse_int(source_id),
                "sourceTable": source_table,
                "sourceUrl": source_url(source_db, remote_path),
                "title": title,
                "workId": parse_int(work_id),
            }
        )

    return entries


def build_local_path(output_root: str, source_db: str, bo_table: str, source_id: str, asset_role: str, file_name: str) -> str:
    safe_role = asset_role.replace("/", "-").replace(" ", "-")
    return f"{output_root}/{source_db}/{bo_table}/{source_id}/{safe_role}/{file_name}"


def sample_entries(entries: list[dict[str, Any]], sample_size: int) -> list[dict[str, Any]]:
    if sample_size >= len(entries):
        return entries

    if sample_size == 1:
        return [entries[0]]

    last_index = len(entries) - 1
    indexes = sorted({round(index * last_index / (sample_size - 1)) for index in range(sample_size)})
    return [entries[index] for index in indexes]


def resolve_remote_path(bo_table: str, path_or_url: str) -> str:
    value = none_if_null(path_or_url) or ""

    if value.startswith("http://") or value.startswith("https://"):
        parsed = urlparse(value)
        return parsed.path.lstrip("/")

    value = value.lstrip("/")

    if value.startswith("web/data/") or value.startswith("data/"):
        return value

    if bo_table == "g5_agency":
        return f"data/agency/{value}"

    return f"web/data/file/{bo_table}/{value}"


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
        f"/web/data/{bo_table}",
        f"/data/{bo_table}",
        "/data/agency" if bo_table == "g5_agency" else f"/data/{bo_table}",
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


def source_url(source_db: str, remote_path: str) -> str:
    host = HOST_BY_DB.get(source_db, HOST_BY_DB["baewoo"])
    return f"{host}/{remote_path.lstrip('/')}"


def sql_string(column: str) -> str:
    return f"REPLACE(REPLACE(REPLACE(COALESCE({column}, ''), CHAR(9), ' '), CHAR(10), ' '), CHAR(13), ' ')"


def board_file_sql(collection: str, table: str, title_column: str, roles: list[tuple[str, str, str, str, str]]) -> str:
    selects = []

    for role_name, source_db_sql, bo_table_sql, path_sql, bytes_sql in roles:
        selects.append(
            f"""
SELECT
  CAST({table}.id AS CHAR) AS work_id,
  {source_db_sql} AS source_db,
  COALESCE({table}.source_table, '') AS source_table,
  CAST(COALESCE({table}.source_id, '') AS CHAR) AS source_id,
  COALESCE({table}.slug, '') AS slug,
  {sql_string(title_column)} AS title,
  '{role_name}' AS asset_role,
  {bo_table_sql} AS bo_table,
  '0' AS file_no,
  '' AS original_name,
  {path_sql} AS path_or_url,
  {bytes_sql} AS bytes_in_db
FROM bnb_legacy_work.{collection} AS {table}
WHERE NULLIF(TRIM({path_sql}), '') IS NOT NULL
""".strip()
        )

    return "\nUNION ALL\n".join(selects) + "\nORDER BY work_id, asset_role"


COLLECTIONS = {
    "agencies": CollectionConfig(
        label="Agencies",
        output_root="public/legacy/agencies",
        sql=board_file_sql(
            "agencies",
            "agencies",
            "agencies.subject",
            [
                (
                    "profile",
                    "agencies.source_db",
                    "'g5_agency'",
                    "agencies.profile_image_path",
                    "'0'",
                ),
            ],
        ),
    ),
    "artist-press": CollectionConfig(
        label="Artist Press",
        output_root="public/legacy/artist-press",
        sql=board_file_sql(
            "artist_press",
            "artist_press",
            "artist_press.title",
            [
                ("agency-logo", "artist_press.source_db", "'new_shoot'", "artist_press.agency_logo_path", "'0'"),
                ("thumbnail", "artist_press.source_db", "'new_shoot'", "artist_press.thumbnail_url", "'0'"),
            ],
        ),
    ),
    "audition-schedules": CollectionConfig(
        label="Audition Schedules",
        output_root="public/legacy/audition-schedules",
        sql="""
SELECT
  CAST(id AS CHAR) AS work_id,
  source_db,
  source_table,
  CAST(source_id AS CHAR) AS source_id,
  slug,
  title,
  'none' AS asset_role,
  'none' AS bo_table,
  '0' AS file_no,
  '' AS original_name,
  '' AS path_or_url,
  '0' AS bytes_in_db
FROM bnb_legacy_work.audition_schedules
WHERE 1 = 0
""",
    ),
    "casting-appearances": CollectionConfig(
        label="Casting Appearances",
        output_root="public/legacy/casting-appearances",
        sql=board_file_sql(
            "casting_appearances",
            "casting_appearances",
            "casting_appearances.title",
            [
                ("thumbnail", "casting_appearances.source_db", "'new_appear'", "casting_appearances.thumbnail_path", "'0'"),
            ],
        ),
    ),
    "screen-appearances": CollectionConfig(
        label="Screen Appearances",
        output_root="public/legacy/screen-appearances",
        sql=board_file_sql(
            "screen_appearances",
            "screen_appearances",
            "screen_appearances.title",
            [
                ("profile", "screen_appearances.source_db", "'new_drama'", "screen_appearances.profile_image_path", "'0'"),
                ("thumbnail", "screen_appearances.source_db", "'new_drama'", "screen_appearances.thumbnail_path", "'0'"),
            ],
        ),
    ),
    "exam-passed-reviews": CollectionConfig(
        label="Exam Passed Reviews",
        output_root="public/legacy/exam-passed-reviews",
        sql=board_file_sql(
            "exam_passed_reviews",
            "exam_passed_reviews",
            "exam_passed_reviews.title",
            [
                ("school-logo", "exam_passed_reviews.source_db", "'new_hoogi'", "exam_passed_reviews.school_logo_path", "'0'"),
                ("student", "exam_passed_reviews.source_db", "'new_hoogi'", "exam_passed_reviews.student_image_path", "'0'"),
            ],
        ),
    ),
    "exam-school-logos": CollectionConfig(
        label="Exam School Logos",
        output_root="public/legacy/exam-school-logos",
        sql="""
SELECT
  CAST(id AS CHAR) AS work_id,
  'bnbuniv' AS source_db,
  'exam_school_logos' AS source_table,
  CAST(id AS CHAR) AS source_id,
  school_slug AS slug,
  school_name AS title,
  'logo' AS asset_role,
  'new_hoogi' AS bo_table,
  '0' AS file_no,
  COALESCE(logo_original_name, '') AS original_name,
  logo_path AS path_or_url,
  '0' AS bytes_in_db
FROM bnb_legacy_work.exam_school_logos
WHERE NULLIF(TRIM(logo_path), '') IS NOT NULL
ORDER BY id
""",
    ),
    "exam-results": CollectionConfig(
        label="Exam Results",
        output_root="public/legacy/exam-results",
        sql="""
SELECT
  CAST(id AS CHAR) AS work_id,
  source_db,
  source_table,
  CAST(source_id AS CHAR) AS source_id,
  slug,
  title,
  'thumbnail' AS asset_role,
  CASE
    WHEN source_table = 'g5_write_victory10' THEN 'victory10'
    WHEN source_table = 'g5_write_victory30' THEN 'victory30'
    ELSE REPLACE(source_table, 'g5_write_', '')
  END AS bo_table,
  '0' AS file_no,
  '' AS original_name,
  COALESCE(thumbnail_path, thumbnail_url, '') AS path_or_url,
  '0' AS bytes_in_db
FROM bnb_legacy_work.exam_results
WHERE NULLIF(TRIM(COALESCE(thumbnail_path, thumbnail_url, '')), '') IS NOT NULL
ORDER BY id
""",
    ),
    "news": CollectionConfig(
        label="News",
        output_root="public/legacy/news",
        sql="""
SELECT
  CAST(news.id AS CHAR) AS work_id,
  news.source_db,
  news.source_table,
  CAST(news.source_id AS CHAR) AS source_id,
  news.slug,
  REPLACE(REPLACE(REPLACE(COALESCE(news.title, ''), CHAR(9), ' '), CHAR(10), ' '), CHAR(13), ' ') AS title,
  CONCAT('file-', files.bf_no) AS asset_role,
  REPLACE(news.source_table, 'g5_write_', '') AS bo_table,
  CAST(files.bf_no AS CHAR) AS file_no,
  REPLACE(REPLACE(REPLACE(COALESCE(files.bf_source, ''), CHAR(9), ' '), CHAR(10), ' '), CHAR(13), ' ') AS original_name,
  REPLACE(REPLACE(REPLACE(COALESCE(files.bf_file, ''), CHAR(9), ' '), CHAR(10), ' '), CHAR(13), ' ') AS path_or_url,
  CAST(COALESCE(files.bf_filesize, 0) AS CHAR) AS bytes_in_db
FROM bnb_legacy_work.news AS news
JOIN (
  SELECT 'baewoo' AS source_db, bo_table, wr_id, bf_no, bf_source, bf_file, bf_filesize FROM baewoo.g5_board_file
  UNION ALL
  SELECT 'bnbuniv', bo_table, wr_id, bf_no, bf_source, bf_file, bf_filesize FROM bnbuniv.g5_board_file
  UNION ALL
  SELECT 'kidscenter', bo_table, wr_id, bf_no, bf_source, bf_file, bf_filesize FROM kidscenter.g5_board_file
  UNION ALL
  SELECT 'bnbhighteen', bo_table, wr_id, bf_no, bf_source, bf_file, bf_filesize FROM bnbhighteen.g5_board_file
) AS files
  ON files.source_db = news.source_db
  AND files.bo_table = REPLACE(news.source_table, 'g5_write_', '')
  AND files.wr_id = news.source_id
WHERE NULLIF(TRIM(files.bf_file), '') IS NOT NULL
ORDER BY news.id, files.bf_no
""",
    ),
}


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


def should_print_progress(index: int, total: int, progress_every: int) -> bool:
    if total == 0 or progress_every == 0:
        return False

    return index == 1 or index == total or index % progress_every == 0


def print_progress(collection: str, index: int, total: int, results: list[dict[str, Any]]) -> None:
    totals = build_totals(results)
    print(
        (
            f"[{collection}] {index}/{total} "
            f"planned={totals['planned']} downloaded={totals['downloaded']} "
            f"skipped={totals['skipped']} failed={totals['failed']}"
        ),
        flush=True,
    )


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


if __name__ == "__main__":
    main()
