#!/usr/bin/env bash
#
# deploy.sh — pull images, run migrations (via service entrypoints), roll out,
# and gate on health. Records the deployed tag for rollback.
#
set -euo pipefail

APP_DIR=/opt/livraison
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_SRC="${HERE}/../../deploy/docker-compose.deploy.yml"
INIT_SRC="${HERE}/../../deploy/init-multiple-databases.sh"
COMPOSE_FILE="${APP_DIR}/docker-compose.yml"

log() { printf '\033[1;32m[deploy]\033[0m %s\n' "$*"; }

[[ -f "${APP_DIR}/.env" ]] || { echo "Missing ${APP_DIR}/.env" >&2; exit 1; }
# shellcheck disable=SC1091
set -a; source "${APP_DIR}/.env"; set +a
: "${REGISTRY_REPO:?REGISTRY_REPO must be set}"
: "${IMAGE_TAG:?IMAGE_TAG must be set}"

log "Staging compose + db init into ${APP_DIR}"
install -m 0644 "${COMPOSE_SRC}" "${COMPOSE_FILE}"
install -m 0755 "${INIT_SRC}" "${APP_DIR}/init-multiple-databases.sh"

cd "${APP_DIR}"

log "Pulling images for tag ${IMAGE_TAG}"
docker compose --env-file .env -f "${COMPOSE_FILE}" pull

log "Starting datastores"
docker compose --env-file .env -f "${COMPOSE_FILE}" up -d postgres redis

log "Rolling out services (migrations run via service entrypoints)"
docker compose --env-file .env -f "${COMPOSE_FILE}" up -d --remove-orphans

log "Waiting for health"
bash "${HERE}/healthcheck.sh" --wait 90 || {
  echo "[deploy] Health gate failed. Review: docker compose logs" >&2
  exit 1
}

echo "${IMAGE_TAG}" > "${APP_DIR}/.deployed_tag"
log "Pruning dangling images"
docker image prune -f >/dev/null 2>&1 || true
log "Deploy complete: ${IMAGE_TAG}"
