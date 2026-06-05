#!/usr/bin/env bash
#
# setup-monitoring.sh — install and enable the health-check and resource-monitor
# systemd timers.
#
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UNIT_SRC="${HERE}/../systemd"
[[ "${EUID}" -eq 0 ]] || { echo "Run as root." >&2; exit 1; }

echo "[monitoring] Installing systemd units"
install -m 0644 "${UNIT_SRC}/livraison-health.service" /etc/systemd/system/livraison-health.service
install -m 0644 "${UNIT_SRC}/livraison-health.timer" /etc/systemd/system/livraison-health.timer
install -m 0644 "${UNIT_SRC}/livraison-monitor.service" /etc/systemd/system/livraison-monitor.service
install -m 0644 "${UNIT_SRC}/livraison-monitor.timer" /etc/systemd/system/livraison-monitor.timer

systemctl daemon-reload
systemctl enable --now livraison-health.timer
systemctl enable --now livraison-monitor.timer

echo "[monitoring] Enabled timers:"
systemctl list-timers 'livraison-*' --no-pager || true
