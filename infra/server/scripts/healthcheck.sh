#!/usr/bin/env bash
#
# healthcheck.sh — probe every service's /health/ready endpoint. Used both as a
# deploy gate (--wait N) and as a periodic monitor (default) that restarts an
# unhealthy container once and alerts.
#
set -euo pipefail

APP_DIR=/opt/livraison
COMPOSE_FILE="${APP_DIR}/docker-compose.yml"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# service_name:host_port:path
TARGETS=(
  "identity:3001:/api/v1/health/ready"
  "shipment:3002:/api/v1/health/ready"
  "tracking:3003:/api/v1/health/ready"
  "web-merchant:3100:/login"
  "web-admin:3101:/login"
  "web-driver:3102:/login"
)

WAIT_SECONDS=0
if [[ "${1:-}" == "--wait" ]]; then
  WAIT_SECONDS="${2:-90}"
fi

probe() {
  local port="$1" path="$2"
  curl -fsS --max-time 5 "http://127.0.0.1:${port}${path}" >/dev/null 2>&1
}

alert() {
  bash "${HERE}/notify.sh" "$1" || true
}

if [[ "${WAIT_SECONDS}" -gt 0 ]]; then
  # Deploy gate: poll until all healthy or timeout.
  deadline=$(( $(date +%s) + WAIT_SECONDS ))
  while true; do
    all_ok=true
    for t in "${TARGETS[@]}"; do
      IFS=':' read -r name port path <<< "$t"
      if ! probe "${port}" "${path}"; then all_ok=false; fi
    done
    if [[ "${all_ok}" == true ]]; then
      echo "[health] All services healthy."
      exit 0
    fi
    if [[ "$(date +%s)" -ge "${deadline}" ]]; then
      echo "[health] Timeout after ${WAIT_SECONDS}s; some services unhealthy." >&2
      exit 1
    fi
    sleep 5
  done
fi

# Monitor mode: report, restart unhealthy once, alert.
failed=()
for t in "${TARGETS[@]}"; do
  IFS=':' read -r name port path <<< "$t"
  if probe "${port}" "${path}"; then
    echo "[health] ${name}: ok"
  else
    echo "[health] ${name}: UNHEALTHY"
    failed+=("${name}")
  fi
done

if [[ "${#failed[@]}" -gt 0 ]]; then
  for name in "${failed[@]}"; do
    echo "[health] Restarting ${name}"
    (cd "${APP_DIR}" && docker compose -f "${COMPOSE_FILE}" restart "${name}") || true
  done
  alert "Livraison health check restarted unhealthy services: ${failed[*]}"
  exit 1
fi
echo "[health] All services healthy."
