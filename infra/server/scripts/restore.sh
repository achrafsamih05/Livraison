#!/usr/bin/env bash
#
# restore.sh <database> <backup_file> — restore a single database from a dump
# produced by backup.sh. Supports plain .sql.gz and age-encrypted .sql.gz.age.
#
# DESTRUCTIVE: the dump is taken with --clean --if-exists, so existing objects
# in the target database are dropped and recreated. Requires explicit confirm.
#
set -euo pipefail

APP_DIR=/opt/livraison
COMPOSE_FILE="${APP_DIR}/docker-compose.yml"

# shellcheck disable=SC1091
set -a; source "${APP_DIR}/.env"; set +a
: "${POSTGRES_USER:?}"

DB="${1:-}"
FILE="${2:-}"
if [[ -z "${DB}" || -z "${FILE}" ]]; then
  echo "Usage: restore.sh <database> <backup_file>" >&2
  exit 1
fi
[[ -f "${FILE}" ]] || { echo "Backup file not found: ${FILE}" >&2; exit 1; }

read -r -p "This will OVERWRITE database '${DB}'. Type the db name to confirm: " confirm
[[ "${confirm}" == "${DB}" ]] || { echo "Aborted."; exit 1; }

container="$(cd "${APP_DIR}" && docker compose -f "${COMPOSE_FILE}" ps -q postgres)"
[[ -n "${container}" ]] || { echo "postgres container not running" >&2; exit 1; }

decrypt_and_stream() {
  if [[ "${FILE}" == *.age ]]; then
    : "${BACKUP_AGE_IDENTITY:?Set BACKUP_AGE_IDENTITY to the age private key file for decryption}"
    age -d -i "${BACKUP_AGE_IDENTITY}" "${FILE}" | gunzip
  else
    gunzip -c "${FILE}"
  fi
}

echo "[restore] Restoring ${DB} from ${FILE}"
decrypt_and_stream | docker exec -i -e PGUSER="${POSTGRES_USER}" "${container}" psql -v ON_ERROR_STOP=1 "${DB}"
echo "[restore] Done."
