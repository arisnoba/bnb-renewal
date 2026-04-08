#!/usr/bin/env python3
from __future__ import annotations

import json
import shutil
from pathlib import Path


CURATION = {
    "p0": [
        "g5_content",
        "g5_content2",
        "g5_teacher",
        "g5_teacher2",
        "g5_write_new_notice",
    ],
    "p1": [
        "g5_write_new_profile",
        "g5_write_new_casting",
        "g5_write_new_casting2",
        "g5_write_new_casting3",
        "g5_write_new_casting_abio",
        "g5_write_new_casting_bx",
        "g5_agency",
        "g5_plan",
    ],
    "p2": [
        "g5_write_new_counsel",
        "g5_write_new_counsel_2",
        "sm_customer",
    ],
    "reference": [
        "g5_menu",
        "g5_menu2",
    ],
}


def main() -> int:
    source_root = Path("data/baewoo-split/tables")
    output_root = Path("data/baewoo-curated")

    if not source_root.exists():
        raise SystemExit(f"Source split directory not found: {source_root}")

    summary: dict[str, list[dict[str, object]]] = {}

    for bucket, tables in CURATION.items():
        bucket_dir = output_root / bucket
        bucket_dir.mkdir(parents=True, exist_ok=True)
        copied_rows = []

        for table_name in tables:
            source_file = source_root / f"{table_name}.sql"
            if not source_file.exists():
                raise SystemExit(f"Missing split table file: {source_file}")

            target_file = bucket_dir / source_file.name
            shutil.copy2(source_file, target_file)
            copied_rows.append(
                {
                    "table_name": table_name,
                    "file_path": str(target_file),
                    "file_size_bytes": target_file.stat().st_size,
                }
            )

        summary[bucket] = copied_rows

    summary_path = output_root / "summary.json"
    with summary_path.open("w", encoding="utf-8") as handle:
        json.dump(summary, handle, ensure_ascii=False, indent=2)
        handle.write("\n")

    lines = [
        "# 배우앤배움 선별 테이블 목록",
        "",
        "> 원본 분리본 `data/baewoo-split/tables` 기준으로, 실제 이관 우선순위가 높은 테이블만 재정리한 목록이다.",
        "",
    ]

    bucket_titles = {
        "p0": "P0. 가장 먼저 이관할 공개 콘텐츠",
        "p1": "P1. 공개 사이트 확장 콘텐츠",
        "p2": "P2. 운영 데이터",
        "reference": "Reference. 구조 참고용",
    }

    for bucket in ("p0", "p1", "p2", "reference"):
        lines.append(f"## {bucket_titles[bucket]}")
        lines.append("")
        for row in summary[bucket]:
            lines.append(f"- `{row['table_name']}`")
        lines.append("")

    readme_path = output_root / "README.md"
    readme_path.write_text("\n".join(lines), encoding="utf-8")

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
