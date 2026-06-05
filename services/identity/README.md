# @livraison/identity

NestJS backend foundation for the Livraison platform: Auth, Users, and Tenants.

## Stack

NestJS · TypeScript · PostgreSQL · Prisma · Redis · Docker.

## Modules

- **Auth**: JWT access tokens, rotating refresh tokens with reuse detection, Argon2id password hashing, RBAC.
- **User**: tenant-scoped CRUD, profile (`/users/me`), status management.
- **Tenant**: multi-tenant management with isolation and JSON configuration.
- **Shared**: RFC 7807 exception filter, structured request logging, boot-time config validation, global validation pipe, URI API versioning (`/api/v1`).

## Local development

```
cp .env.example .env
docker compose up -d postgres redis
npm install
npm run prisma:generate
npm run prisma:migrate:dev --name init
npm run start:dev
```

Or run everything in containers:

```
docker compose up --build
```

## API (prefix /api/v1)

| Method | Path              | Auth                     | Roles                          |
| ------ | ----------------- | ------------------------ | ------------------------------ |
| POST   | /auth/login       | public (X-Tenant header) | —                              |
| POST   | /auth/refresh     | public                   | —                              |
| POST   | /auth/logout      | bearer                   | any                            |
| GET    | /users/me         | bearer                   | any                            |
| POST   | /users            | bearer                   | TENANT_ADMIN, MANAGER          |
| GET    | /users            | bearer                   | TENANT_ADMIN, MANAGER, SUPPORT |
| GET    | /users/:id        | bearer                   | TENANT_ADMIN, MANAGER, SUPPORT |
| PATCH  | /users/:id        | bearer                   | TENANT_ADMIN, MANAGER          |
| PATCH  | /users/:id/status | bearer                   | TENANT_ADMIN                   |
| DELETE | /users/:id        | bearer                   | TENANT_ADMIN                   |
| POST   | /tenants          | bearer                   | SUPER_ADMIN                    |
| GET    | /tenants          | bearer                   | SUPER_ADMIN                    |
| GET    | /tenants/:id      | bearer                   | SUPER_ADMIN                    |
| PATCH  | /tenants/:id      | bearer                   | SUPER_ADMIN                    |
| DELETE | /tenants/:id      | bearer                   | SUPER_ADMIN                    |
| GET    | /health/live      | public                   | —                              |
| GET    | /health/ready     | public                   | —                              |

## Testing

```
npm test
npm run test:cov
```

## Security notes

- Tenant is always derived from the verified token (or `X-Tenant` at login), never trusted from request bodies for authorized routes.
- All user queries are tenant-scoped (defense-in-depth alongside DB row-level security planned in ADR for tenant isolation).
- Refresh tokens are stored only as SHA-256 hashes; rotation revokes the prior token and reuse triggers family revocation.
- Passwords use Argon2id.
