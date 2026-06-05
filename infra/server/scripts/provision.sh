#!/usr/bin/env bash
#
# provision.sh — prepare a fresh Ubuntu 22.04/24.04 host for the Livraison stack.
# Installs Docker Engine + Compose plugin, Nginx, certbot, ufw, fail2ban; hardens
# SSH; creates the deploy user and app directory. Idempotent.
#
set -euo pipefail

APP_DIR=/opt/livraison
DEPLOY_USER=livraison

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    echo "This script must be run as root." >&2
    exit 1
  fi
}

log() { printf '\033[1;34m[provision]\033[0m %s\n' "$*"; }

require_root

log "Updating apt and installing base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y --no-install-recommends \
  ca-certificates curl gnupg lsb-release ufw fail2ban nginx certbot \
  python3-certbot-nginx unattended-upgrades jq age

log "Installing Docker Engine + Compose plugin (official repo)"
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${VERSION_CODENAME}") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker

log "Creating deploy user '${DEPLOY_USER}' and app dir '${APP_DIR}'"
if ! id -u "${DEPLOY_USER}" >/dev/null 2>&1; then
  useradd --system --create-home --shell /bin/bash "${DEPLOY_USER}"
fi
usermod -aG docker "${DEPLOY_USER}"
mkdir -p "${APP_DIR}"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_DIR}"

log "Configuring Docker daemon log rotation"
cat > /etc/docker/daemon.json <<'JSON'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "5" },
  "live-restore": true
}
JSON
systemctl restart docker

log "Configuring firewall (ufw): allow SSH, HTTP, HTTPS only"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

log "Hardening SSH (disable root login + password auth)"
SSHD=/etc/ssh/sshd_config.d/99-livraison.conf
cat > "${SSHD}" <<'CONF'
PermitRootLogin no
PasswordAuthentication no
ChallengeResponseAuthentication no
X11Forwarding no
MaxAuthTries 3
CONF
systemctl reload ssh || systemctl reload sshd || true

log "Enabling fail2ban and unattended security upgrades"
systemctl enable --now fail2ban
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'CONF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
CONF

log "Provisioning complete. Next: configure ${APP_DIR}/.env then run setup-nginx.sh"
