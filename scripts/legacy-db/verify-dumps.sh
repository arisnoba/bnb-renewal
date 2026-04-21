#!/usr/bin/env bash
set -euo pipefail

ROOT_PASSWORD="${LEGACY_DB_ROOT_PASSWORD:-root}"

docker compose exec -T legacy-mariadb mariadb -uroot -p"${ROOT_PASSWORD}" -e "
SELECT
  table_schema AS legacy_database,
  COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_schema IN ('baewoo', 'bnbuniv', 'kidscenter', 'bnbhighteen')
GROUP BY table_schema
ORDER BY table_schema;

SELECT
  table_schema AS legacy_database,
  table_name,
  table_rows
FROM information_schema.tables
WHERE table_schema IN ('baewoo', 'bnbuniv', 'kidscenter', 'bnbhighteen')
  AND table_name IN (
    'g5_teacher',
    'g5_teacher2',
    'g5_write_new_notice',
    'g5_write_new_profile',
    'g5_agency'
  )
ORDER BY table_schema, table_name;
"
