# DevOps & CI/CD

Complete container and pipeline setup for the Livraison platform.

## Containers

| Image        | Build context       | Dockerfile                     | Port |
| ------------ | ------------------- | ------------------------------ | ---- |
| identity     | `services/identity` | `services/identity/Dockerfile` | 3001 |
| shipment     | `services/shipment` | `services/shipment/Dockerfile` | 3002 |
| tracking     | `services/tracking` | `services/tracking/Dockerfile` | 3003 |
| web-merchant | repo root           | `apps/web-merchant/Dockerfile` | 3100 |
| web-admin    | repo root           | `apps/web-admin/Dockerfile`    | 3101 |
| web-driver   | repo root           | `apps/web-driver/Dockerfile`   | 3102 |

All images: multi-stage, distroless-adjacent slim base, non-root user, `dumb-init` as PID 1. Backend services run `prisma migrate deploy` then start. Web apps use Next.js `standalone` output (monorepo-aware via `outputFileTracingRoot`) so the runtime image ships only traced dependencies.

Web app images build from the **repo root** context (they need workspace packages); backend images build from their own directory.

## Local full stack

```
cp .env.docker.example .env
docker compose up --build
```

Brings up PostgreSQL (multi-database init for identity/shipment/tracking), Redis, the three backend services, and the three portals. Postgres and Redis have healthchecks; services wait on them via `depends_on: condition: service_healthy`.

Ports: merchant 3100, admin 3101, driver 3102, identity 3001, shipment 3002, tracking 3003, Postgres 5432, Redis 6379.

## GitHub Actions

| Workflow       | Trigger                  | Purpose                                                                                             |
| -------------- | ------------------------ | --------------------------------------------------------------------------------------------------- |
| `ci.yml`       | push/PR to main          | Install, generate Prisma clients, format check, **typecheck → lint → test → build** via Turbo       |
| `security.yml` | push/PR + weekly         | `pnpm audit`, Trivy filesystem scan, gitleaks secret scan, CodeQL                                   |
| `docker.yml`   | push to main + `v*` tags | Build & push all 6 images to GHCR (matrix), SBOM + provenance, Trivy image scan                     |
| `deploy.yml`   | manual dispatch          | Environment-gated SSH deploy: ship compose file, `docker compose pull && up -d`, health smoke check |

### Pipeline order

CI runs format → typecheck → lint → test → build. All four were verified green locally (5 lint tasks, 13 typecheck+test tasks). Docker images publish only on main/tags (not PRs). Deploy is manual, gated by a GitHub Environment (required reviewers) and pulls immutable image tags.

### Required repository secrets

- Docker publish uses the built-in `GITHUB_TOKEN` (packages: write).
- Deploy (per environment): `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`, `DEPLOY_SSH_KEY`, `GHCR_USER`, `GHCR_TOKEN`.

## ESLint

A shared config (`@livraison/eslint-config`, ESLint 8 + typescript-eslint) is consumed by the TypeScript services and the design system; the Next apps use `eslint-config-next`. Lint is wired into CI and passes across all packages.

## Environment templates

- `.env.docker.example` — full-stack compose (Postgres, JWT secrets, tenant slugs).
- `services/*/.env.example` — per-service local development.
- `apps/*/.env.example` — per-app upstream API URLs and tenant slug.

> Replace every default secret before any non-development use. The compose defaults are for local development only.
