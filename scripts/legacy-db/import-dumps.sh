#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DUMP_DIR="${ROOT_DIR}/data/legacy_dumps"
ROOT_PASSWORD="${LEGACY_DB_ROOT_PASSWORD:-root}"

RESET=false

if [[ "${1:-}" == "--reset" ]]; then
  RESET=true
fi

declare -a DATABASES=(
  "baewoo:baewoo.sql"
  "bnbuniv:bnbuniv.sql"
  "kidscenter:kidscenter.sql"
  "bnbhighteen:bnbhighteen.sql"
)

run_mariadb() {
  docker compose exec -T legacy-mariadb mariadb -uroot -p"${ROOT_PASSWORD}" "$@"
}

wait_for_mariadb() {
  for _ in {1..60}; do
    if docker compose exec -T legacy-mariadb mariadb-admin ping -uroot -p"${ROOT_PASSWORD}" --silent >/dev/null 2>&1; then
      return 0
    fi

    sleep 1
  done

  echo "legacy-mariadb is not ready after 60 seconds." >&2
  return 1
}

for item in "${DATABASES[@]}"; do
  dump_file="${item#*:}"
  dump_path="${DUMP_DIR}/${dump_file}"

  if [[ ! -f "${dump_path}" ]]; then
    echo "Missing dump file: ${dump_path}" >&2
    exit 1
  fi
done

cd "${ROOT_DIR}"
docker compose up -d legacy-mariadb
wait_for_mariadb

for item in "${DATABASES[@]}"; do
  database="${item%%:*}"
  dump_file="${item#*:}"
  dump_path="${DUMP_DIR}/${dump_file}"

  if [[ "${RESET}" == true ]]; then
    echo "Resetting ${database}..."
    run_mariadb -e "DROP DATABASE IF EXISTS \`${database}\`; CREATE DATABASE \`${database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  else
    run_mariadb -e "CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

    table_count="$(
      run_mariadb -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${database}';" |
        tr -d '[:space:]'
    )"

    if [[ "${table_count}" != "0" ]]; then
      echo "${database} already has ${table_count} tables. Re-run with --reset to replace it." >&2
      exit 1
    fi
  fi

  echo "Importing ${dump_file} into ${database}..."
  docker compose exec -T legacy-mariadb mariadb -uroot -p"${ROOT_PASSWORD}" "${database}" < "${dump_path}"
done

echo "Legacy dumps imported successfully."
