#!/usr/bin/env bash
#
# setup-nginx.sh — install the Livraison reverse-proxy site and shared snippets.
# Renders the site template with ${DOMAIN} from /opt/livraison/.env.
#
set -euo pipefail

APP_DIR=/opt/livraison
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NGINX_SRC="${HERE}/../nginx"

[[ "${EUID}" -eq 0 ]] || { echo "Run as root." >&2; exit 1; }
[[ -f "${APP_DIR}/.env" ]] || { echo "Missing ${APP_DIR}/.env" >&2; exit 1; }

# shellcheck disable=SC1091
set -a; source "${APP_DIR}/.env"; set +a
: "${DOMAIN:?DOMAIN must be set in .env}"

echo "[nginx] Installing shared snippets"
install -m 0644 "${NGINX_SRC}/snippets/security-headers.conf" /etc/nginx/snippets/livraison-security-headers.conf
install -m 0644 "${NGINX_SRC}/snippets/proxy-params.conf" /etc/nginx/snippets/livraison-proxy-params.conf

echo "[nginx] Preparing ACME webroot"
mkdir -p /var/www/certbot

echo "[nginx] Rendering site for domain ${DOMAIN}"
export DOMAIN
envsubst '${DOMAIN}' < "${NGINX_SRC}/livraison.conf.template" \
  > /etc/nginx/sites-available/livraison.conf
ln -sf /etc/nginx/sites-available/livraison.conf /etc/nginx/sites-enabled/livraison.conf
rm -f /etc/nginx/sites-enabled/default

# Validate config. Note: ssl_certificate paths may not exist until setup-ssl.sh
# runs; on first install we test with a temporary self-check that tolerates that.
if nginx -t 2>/dev/null; then
  systemctl reload nginx
  echo "[nginx] Installed and reloaded."
else
  echo "[nginx] Config references TLS certs that do not exist yet."
  echo "[nginx] Run setup-ssl.sh next; it will obtain certs and reload Nginx."
fi
