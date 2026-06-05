# @livraison/core-db

The core PostgreSQL data layer for the Livraison platform: Prisma schema, SQL migrations, Row-Level Security, triggers, and seed data.

## Quick start

```
cp .env.example .env
docker compose up -d
pnpm --filter @livraison/core-db exec prisma generate
pnpm --filter @livraison/core-db run migrate:deploy
pnpm --filter @livraison/core-db run seed
```

## Scripts

| Script            | Purpose                                                                          |
| ----------------- | -------------------------------------------------------------------------------- |
| `prisma:generate` | Generate the Prisma client into `generated/client`.                              |
| `prisma:validate` | Validate the schema.                                                             |
| `migrate:dev`     | Create + apply a migration in development.                                       |
| `migrate:deploy`  | Apply committed migrations (CI/prod).                                            |
| `migrate:diff`    | Print SQL diff from empty to current schema.                                     |
| `seed`            | Seed permissions, roles, a demo tenant, admin user, and a sample shipment graph. |

## Migrations

| Migration                  | Contents                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `0001_init`                | `pgcrypto` extension; all 11 tables; enums; FKs; base indexes.                                                           |
| `0002_soft_delete_indexes` | Soft-delete-aware partial unique indexes (slug, email, AWB, role key); active-row partial indexes; JSONB GIN indexes.    |
| `0003_row_level_security`  | `livraison_app` role + grants; `current_tenant_id()`; RLS enabled + forced with tenant-isolation policies (fail-closed). |
| `0004_updated_at_triggers` | `set_updated_at()` trigger on all mutable tables.                                                                        |

All four were verified to apply cleanly against PostgreSQL 16, and RLS isolation + fail-closed behavior were verified live (see Database documentation).

## Documentation

See [`docs/database.md`](./docs/database.md) for the full data dictionary, ERD, indexing rationale, RLS contract, and operational notes.
