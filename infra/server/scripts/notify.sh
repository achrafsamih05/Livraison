#!/usr/bin/env bash
#
# notify.sh "<message>" — send an alert to ALERT_WEBHOOK_URL (Slack-compatible)
# if configured; otherwise log to the system journal. Never fails the caller.
#
set -uo pipefail

APP_DIR=/opt/livraison
MESSAGE="${1:-Livraison alert}"
HOST="$(hostname)"

if [[ -f "${APP_DIR}/.env" ]]; then
  # shellcheck disable=SC1091
  set -a; source "${APP_DIR}/.env"; set +a
fi

logger -t livraison-alert "${MESSAGE}" || true

if [[ -n "${ALERT_WEBHOOK_URL:-}" ]]; then
  payload=$(printf '{"text":"[%s] %s"}' "${HOST}" "${MESSAGE//\"/\\\"}")
  curl -fsS -m 10 -X POST -H 'content-type: application/json' \
    -d "${payload}" "${ALERT_WEBHOOK_URL}" >/dev/null 2>&1 || true
fi
exit 0
