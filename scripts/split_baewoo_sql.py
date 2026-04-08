#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import shutil
from collections import Counter, defaultdict
from pathlib import Path


TABLE_PATTERNS = {
    "drop": re.compile(r"^\s*DROP TABLE IF EXISTS `([^`]+)`", re.IGNORECASE),
    "create": re.compile(r"^\s*CREATE TABLE `([^`]+)`", re.IGNORECASE),
    "insert": re.compile(r"^\s*INSERT INTO `([^`]+)`", re.IGNORECASE),
    "alter": re.compile(r"^\s*ALTER TABLE `([^`]+)`", re.IGNORECASE),
}

COMMENT_PREFIXES = ("--",)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Split a phpMyAdmin-style MySQL dump into per-table SQL files."
    )
    parser.add_argument(
        "--input",
        default="data/baewoo.sql",
        help="Path to the source SQL dump.",
    )
    parser.add_argument(
        "--output-dir",
        default="data/baewoo-split",
        help="Directory where split SQL files will be written.",
    )
    return parser.parse_args()


def is_comment_or_blank(line: str) -> bool:
    stripped = line.lstrip()
    return not stripped or stripped.startswith(COMMENT_PREFIXES)


def find_statement_end(
    line: str, in_single_quote: bool, escaping: bool
) -> tuple[int | None, bool, bool]:
    for idx, ch in enumerate(line):
        if in_single_quote:
            if escaping:
                escaping = False
                continue
            if ch == "\\":
                escaping = True
                continue
            if ch == "'":
                in_single_quote = False
            continue

        if ch == "'":
            in_single_quote = True
            continue

        if ch == ";":
            return idx, in_single_quote, escaping

    return None, in_single_quote, escaping


def statement_target(statement: str) -> tuple[str, str]:
    stripped = statement.lstrip()
    for kind, pattern in TABLE_PATTERNS.items():
        match = pattern.match(stripped)
        if match:
            return match.group(1), kind
    return "_global", "other"


def split_dump(input_path: Path, output_dir: Path) -> dict:
    temp_dir = output_dir.with_name(f".{output_dir.name}.tmp")
    if temp_dir.exists():
        shutil.rmtree(temp_dir)
    temp_dir.mkdir(parents=True)
    tables_dir = temp_dir / "tables"
    tables_dir.mkdir()

    statement_counters: dict[str, Counter] = defaultdict(Counter)

    current_parts: list[str] = []
    in_statement = False
    in_single_quote = False
    escaping = False

    def write_statement(statement: str) -> None:
        table_name, statement_kind = statement_target(statement)
        if table_name == "_global":
            target_path = temp_dir / "_global.sql"
        else:
            target_path = tables_dir / f"{table_name}.sql"

        with target_path.open("a", encoding="utf-8") as handle:
            handle.write(statement)
            if not statement.endswith("\n"):
                handle.write("\n")
            handle.write("\n")

        statement_counters[table_name]["total"] += 1
        statement_counters[table_name][statement_kind] += 1

    with input_path.open("r", encoding="utf-8", errors="replace") as handle:
        for raw_line in handle:
            line = raw_line
            while True:
                if not in_statement:
                    if is_comment_or_blank(line):
                        if line.strip():
                            write_statement(line)
                        break
                    current_parts = []
                    in_statement = True
                    in_single_quote = False
                    escaping = False

                end_idx, in_single_quote, escaping = find_statement_end(
                    line, in_single_quote, escaping
                )

                if end_idx is None:
                    current_parts.append(line)
                    break

                current_parts.append(line[: end_idx + 1])
                write_statement("".join(current_parts))
                current_parts = []
                in_statement = False
                in_single_quote = False
                escaping = False

                line = line[end_idx + 1 :]
                if not line:
                    break

        if current_parts:
            write_statement("".join(current_parts))

    manifest_rows = []
    for table_name in sorted(statement_counters):
        if table_name == "_global":
            file_path = "_global.sql"
            abs_path = temp_dir / file_path
        else:
            file_path = f"tables/{table_name}.sql"
            abs_path = temp_dir / file_path

        counters = statement_counters[table_name]
        manifest_rows.append(
            {
                "table_name": table_name,
                "file_path": file_path,
                "statement_total": counters["total"],
                "drop_count": counters["drop"],
                "create_count": counters["create"],
                "insert_count": counters["insert"],
                "alter_count": counters["alter"],
                "other_count": counters["other"],
                "file_size_bytes": abs_path.stat().st_size if abs_path.exists() else 0,
            }
        )

    manifest_path = temp_dir / "manifest.tsv"
    with manifest_path.open("w", encoding="utf-8") as handle:
        handle.write(
            "\t".join(
                [
                    "table_name",
                    "file_path",
                    "statement_total",
                    "drop_count",
                    "create_count",
                    "insert_count",
                    "alter_count",
                    "other_count",
                    "file_size_bytes",
                ]
            )
            + "\n"
        )
        for row in manifest_rows:
            handle.write(
                "\t".join(
                    [
                        str(row["table_name"]),
                        str(row["file_path"]),
                        str(row["statement_total"]),
                        str(row["drop_count"]),
                        str(row["create_count"]),
                        str(row["insert_count"]),
                        str(row["alter_count"]),
                        str(row["other_count"]),
                        str(row["file_size_bytes"]),
                    ]
                )
                + "\n"
            )

    summary = {
        "input_path": str(input_path),
        "output_dir": str(output_dir),
        "global_statement_count": statement_counters["_global"]["total"],
        "table_file_count": len([name for name in statement_counters if name != "_global"]),
        "table_names": sorted(name for name in statement_counters if name != "_global"),
    }
    with (temp_dir / "summary.json").open("w", encoding="utf-8") as handle:
        json.dump(summary, handle, ensure_ascii=False, indent=2)
        handle.write("\n")

    if output_dir.exists():
        shutil.rmtree(output_dir)
    temp_dir.rename(output_dir)

    return summary


def main() -> int:
    args = parse_args()
    input_path = Path(args.input)
    output_dir = Path(args.output_dir)

    if not input_path.exists():
        raise SystemExit(f"Input file not found: {input_path}")

    summary = split_dump(input_path, output_dir)
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
