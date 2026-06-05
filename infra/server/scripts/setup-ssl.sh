#!/usr/bin/env bash
#
# setup-ssl.sh — obtain Let's Encrypt certificates for all Livraison subdomains
# using the webroot challenge, and ensure auto-renewal reloads Nginx.
#
set -euo pipefail

APP_DIR=/opt/livraison
[[ "${EUID}" -eq 0 ]] || { echo "Run as root." >&2; exit 1; }
[[ -f "${APP_DIR}/.env" ]] || { echo "Missing ${APP_DIR}/.env" >&2; exit 1; }

# shellcheck disable=SC1091
set -a; source "${APP_DIR}/.env"; set +a
: "${DOMAIN:?DOMAIN must be set}"
: "${ACME_EMAIL:?ACME_EMAIL must be set}"

mkdir -p /var/www/certbot

echo "[ssl] Requesting certificate for ${DOMAIN} subdomains"
certbot certonly \
  --webroot -w /var/www/certbot \
  --non-interactive --agree-tos \
  --email "${ACME_EMAIL}" \
  --cert-name "${DOMAIN}" \
  -d "merchant.${DOMAIN}" \
  -d "admin.${DOMAIN}" \
  -d "driver.${DOMAIN}" \
  -d "api.${DOMAIN}"

echo "[ssl] Configuring auto-renewal reload hook"
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh <<'HOOK'
#!/usr/bin/env bash
systemctl reload nginx
HOOK
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

# certbot installs a systemd timer for renewal by default; verify it.
systemctl enable --now certbot.timer 2>/dev/null || true

echo "[ssl] Validating and reloading Nginx"
nginx -t
systemctl reload nginx
echo "[ssl] TLS configured for *.${DOMAIN}"
