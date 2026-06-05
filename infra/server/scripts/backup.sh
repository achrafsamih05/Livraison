#!/usr/bin/env bash
#
# backup.sh — dump all Livraison databases from the running Postgres container,
# compress, optionally encrypt (age), and prune by retention. Designed to run
# from a systemd timer (see setup-backups.sh).
#
set -euo pipefail

APP_DIR=/opt/livraison
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${APP_DIR}/docker-compose.yml"

# shellcheck disable=SC1091
set -a; source "${APP_DIR}/.env"; set +a
: "${POSTGRES_USER:?}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/livraison}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
DATABASES=(identity shipment tracking)

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"
ts="$(date -u +%Y%m%dT%H%M%SZ)"

container="$(cd "${APP_DIR}" && docker compose -f "${COMPOSE_FILE}" ps -q postgres)"
if [[ -z "${container}" ]]; then
  bash "${HERE}/notify.sh" "Backup FAILED: postgres container not running"
  echo "[backup] postgres container not found" >&2
  exit 1
fi

for db in "${DATABASES[@]}"; do
  out="${BACKUP_DIR}/${db}-${ts}.sql.gz"
  echo "[backup] Dumping ${db} -> ${out}"
  if docker exec -e PGUSER="${POSTGRES_USER}" "${container}" \
      pg_dump --clean --if-exists --no-owner "${db}" | gzip -9 > "${out}"; then
    if [[ -n "${BACKUP_GPG_RECIPIENT:-}" && -f "${BACKUP_GPG_RECIPIENT}" ]]; then
      age -R "${BACKUP_GPG_RECIPIENT}" -o "${out}.age" "${out}" && rm -f "${out}"
      echo "[backup] Encrypted ${out}.age"
    fi
  else
    bash "${HERE}/notify.sh" "Backup FAILED for database ${db}"
    echo "[backup] dump failed for ${db}" >&2
    exit 1
  fi
done

echo "[backup] Pruning backups older than ${RETENTION_DAYS} days"
find "${BACKUP_DIR}" -type f \( -name '*.sql.gz' -o -name '*.sql.gz.age' \) \
  -mtime "+${RETENTION_DAYS}" -delete

echo "[backup] Completed at ${ts}"
