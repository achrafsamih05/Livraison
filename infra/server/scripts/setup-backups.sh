#!/usr/bin/env bash
#
# setup-backups.sh — install and enable the nightly backup systemd timer.
#
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UNIT_SRC="${HERE}/../systemd"
[[ "${EUID}" -eq 0 ]] || { echo "Run as root." >&2; exit 1; }

# shellcheck disable=SC1091
set -a; source /opt/livraison/.env; set +a
BACKUP_DIR="${BACKUP_DIR:-/var/backups/livraison}"
mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

echo "[backups] Installing systemd units"
install -m 0644 "${UNIT_SRC}/livraison-backup.service" /etc/systemd/system/livraison-backup.service
install -m 0644 "${UNIT_SRC}/livraison-backup.timer" /etc/systemd/system/livraison-backup.timer

systemctl daemon-reload
systemctl enable --now livraison-backup.timer

echo "[backups] Enabled. Schedule:"
systemctl list-timers livraison-backup.timer --no-pager || true
echo "[backups] Run an immediate test backup with: systemctl start livraison-backup.service"
