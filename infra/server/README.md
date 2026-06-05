# Livraison MVP — Ubuntu Server Deployment

Production deployment kit for a single Ubuntu host running the Livraison stack with Docker, behind Nginx with TLS.

## Topology

```
Internet ──443/80──▶ Nginx (host) ──▶ Docker published ports (127.0.0.1 only)
                                       ├─ web-merchant   :3100   merchant.<domain>
                                       ├─ web-admin      :3101   admin.<domain>
                                       ├─ web-driver     :3102   driver.<domain>
                                       └─ /api/* per host ▶ identity/shipment/tracking :3001-3003
                       (Postgres :5432 and Redis :6379 are NOT published — internal only)
```

## Order of operations

```bash
# 0. As root on a fresh Ubuntu 22.04/24.04 host:
git clone <repo> /opt/livraison && cd /opt/livraison

# 1. Provision the host (Docker, Nginx, firewall, users, fail2ban)
sudo bash infra/server/scripts/provision.sh

# 2. Configure environment + DNS records (A records for the 4 subdomains)
cp infra/server/env/.env.production.example /opt/livraison/.env
sudoedit /opt/livraison/.env        # set domain, secrets, registry

# 3. Install Nginx site + obtain TLS certificates
sudo bash infra/server/scripts/setup-nginx.sh
sudo bash infra/server/scripts/setup-ssl.sh

# 4. Deploy the stack
sudo bash infra/server/scripts/deploy.sh

# 5. Install backups, monitoring, and health-check timers
sudo bash infra/server/scripts/setup-backups.sh
sudo bash infra/server/scripts/setup-monitoring.sh
```

## Contents

- `scripts/provision.sh` — installs Docker Engine + Compose plugin, Nginx, certbot, ufw, fail2ban; hardens SSH; creates the `livraison` deploy user.
- `scripts/setup-nginx.sh` — installs the reverse-proxy site and shared TLS/security snippets.
- `scripts/setup-ssl.sh` — obtains/renews Let's Encrypt certs for all subdomains; wires auto-renewal.
- `scripts/deploy.sh` — pulls images, runs migrations, rolls out with health gating, prunes old images.
- `scripts/rollback.sh` — re-deploys a previous image tag.
- `scripts/setup-backups.sh` — installs the nightly encrypted Postgres backup timer with retention.
- `scripts/backup.sh` / `scripts/restore.sh` — backup and restore runbook scripts.
- `scripts/setup-monitoring.sh` — installs healthcheck + disk/resource alert timers and the Docker log rotation config.
- `scripts/healthcheck.sh` — probes every service `/health/ready`; restarts unhealthy containers and alerts.
- `nginx/` — reverse-proxy site config + reusable snippets.
- `systemd/` — timer/service units for health checks, backups, and monitoring.
- `env/.env.production.example` — production environment template.

All secrets in `.env` must be replaced before deployment. The compose file used on the host is `infra/deploy/docker-compose.deploy.yml` (pre-built GHCR images).
