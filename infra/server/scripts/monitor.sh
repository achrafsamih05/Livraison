#!/usr/bin/env bash
#
# monitor.sh — host resource and container monitor. Alerts when disk usage,
# memory pressure, or restart-looping containers cross thresholds.
#
set -uo pipefail

APP_DIR=/opt/livraison
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${APP_DIR}/docker-compose.yml"

# shellcheck disable=SC1091
[[ -f "${APP_DIR}/.env" ]] && { set -a; source "${APP_DIR}/.env"; set +a; }
DISK_THRESHOLD="${DISK_ALERT_THRESHOLD_PCT:-85}"

alerts=()

# Disk usage on the root filesystem.
disk_pct="$(df --output=pcent / | tail -1 | tr -dc '0-9')"
if [[ -n "${disk_pct}" && "${disk_pct}" -ge "${DISK_THRESHOLD}" ]]; then
  alerts+=("Disk usage ${disk_pct}% >= ${DISK_THRESHOLD}% on /")
fi

# Memory usage percentage.
mem_pct="$(free | awk '/Mem:/ {printf "%d", ($2-$7)/$2*100}')"
if [[ -n "${mem_pct}" && "${mem_pct}" -ge 90 ]]; then
  alerts+=("Memory usage ${mem_pct}% >= 90%")
fi

# Containers that are not running, or restart-looping.
if [[ -f "${COMPOSE_FILE}" ]]; then
  while read -r cid; do
    [[ -z "${cid}" ]] && continue
    name="$(docker inspect -f '{{.Name}}' "${cid}" | sed 's#^/##')"
    state="$(docker inspect -f '{{.State.Status}}' "${cid}")"
    restarts="$(docker inspect -f '{{.RestartCount}}' "${cid}")"
    if [[ "${state}" != "running" ]]; then
      alerts+=("Container ${name} is ${state}")
    elif [[ "${restarts}" -ge 5 ]]; then
      alerts+=("Container ${name} restart count is ${restarts}")
    fi
  done < <(cd "${APP_DIR}" && docker compose -f "${COMPOSE_FILE}" ps -q)
fi

if [[ "${#alerts[@]}" -gt 0 ]]; then
  msg="Resource alert: $(IFS='; '; echo "${alerts[*]}")"
  echo "[monitor] ${msg}"
  bash "${HERE}/notify.sh" "${msg}"
  exit 1
fi

echo "[monitor] OK (disk ${disk_pct}%, mem ${mem_pct}%)"
