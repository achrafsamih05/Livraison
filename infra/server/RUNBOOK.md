# Livraison MVP — Operations Runbook (single Ubuntu host)

Concrete procedures for operating the MVP deployment. All scripts are invoked
with `bash <script>` (no executable bit required) and are idempotent unless noted.

## DNS prerequisites

Create four A (and AAAA if using IPv6) records pointing at the host's public IP:

```
merchant.<domain>   A   <host-ip>
admin.<domain>      A   <host-ip>
driver.<domain>     A   <host-ip>
api.<domain>        A   <host-ip>
```

TLS issuance (setup-ssl.sh) will fail until these resolve publicly.

## First deployment

```bash
sudo bash infra/server/scripts/provision.sh
cp infra/server/env/.env.production.example /opt/livraison/.env
sudoedit /opt/livraison/.env            # domain, secrets, REGISTRY_REPO, IMAGE_TAG
chmod 600 /opt/livraison/.env

# Authenticate to the image registry (GHCR) once:
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin

sudo bash infra/server/scripts/setup-nginx.sh
sudo bash infra/server/scripts/setup-ssl.sh
sudo bash infra/server/scripts/deploy.sh
sudo bash infra/server/scripts/setup-backups.sh
sudo bash infra/server/scripts/setup-monitoring.sh
```

## Routine deploy (new version)

```bash
sudoedit /opt/livraison/.env            # bump IMAGE_TAG
sudo bash infra/server/scripts/deploy.sh
```

The deploy gates on health (`healthcheck.sh --wait 90`); a failed gate exits
non-zero without recording the new tag, leaving the prior containers in place.

## Rollback

```bash
sudo bash infra/server/scripts/rollback.sh            # shows current tag
sudo bash infra/server/scripts/rollback.sh v1.0.0     # roll back to a tag
```

## Backups

- Schedule: nightly 02:30 UTC via `livraison-backup.timer`.
- Location: `${BACKUP_DIR}` (default `/var/backups/livraison`), retained `${BACKUP_RETENTION_DAYS}` days.
- Encryption: set `BACKUP_GPG_RECIPIENT` to an `age` recipient file to encrypt dumps at rest.
- Manual run: `sudo systemctl start livraison-backup.service`
- Restore a database:
  ```bash
  sudo bash infra/server/scripts/restore.sh shipment /var/backups/livraison/shipment-<ts>.sql.gz
  ```
  Restore is destructive (drops/recreates objects) and requires typing the db name to confirm.

## Monitoring & health

- `livraison-health.timer` (every 2 min): probes `/health/ready` on all services; restarts an unhealthy container once and alerts.
- `livraison-monitor.timer` (every 5 min): disk/memory/container-restart thresholds; alerts on breach.
- Alerts go to `ALERT_WEBHOOK_URL` (Slack-compatible) if set, otherwise to the journal (`journalctl -t livraison-alert`).
- Inspect timers: `systemctl list-timers 'livraison-*'`
- Manual probe: `sudo bash infra/server/scripts/healthcheck.sh`

## Logs

- Service logs: `cd /opt/livraison && docker compose logs -f <service>`
- Docker JSON logs are rotated (10MB × 5) via `/etc/docker/daemon.json`.
- Nginx: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`.

## TLS renewal

certbot's `certbot.timer` renews automatically; the deploy hook
`/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh` reloads Nginx on renewal.
Force a dry run: `sudo certbot renew --dry-run`.

## Security posture

- Only 22/80/443 are open (ufw); Postgres and Redis are not published to the network.
- SSH: root login and password auth disabled; fail2ban enabled.
- Containers run as non-root with rotated logs.
- All secrets live in `/opt/livraison/.env` (chmod 600); never commit it.
- Replace every default credential before exposing the host.

## Common incidents

| Symptom | Action |
|---|---|
| Deploy health gate fails | `docker compose logs <service>`; check DB migration output; fix env; redeploy |
| A portal 502s | `healthcheck.sh`; the health timer restarts it; check container logs |
| Disk alert | prune images `docker image prune -af`; check `${BACKUP_DIR}` size and retention |
| Cert renewal failed | `certbot renew --dry-run`; verify DNS + port 80 reachable |
| Need to restore data | stop dependent services, run `restore.sh`, restart |
