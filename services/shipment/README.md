# @livraison/shipment

Shipment service for the Livraison platform: lifecycle, status workflow, history, and tracking-number generation. NestJS + Prisma + PostgreSQL.

## Run locally

```
cp .env.example .env
docker compose up -d postgres
pnpm --filter @livraison/shipment exec prisma generate
pnpm --filter @livraison/shipment run migrate:deploy
pnpm --filter @livraison/shipment run start:dev
```

Or fully containerized: `docker compose up --build`.

## Status workflow

```
CREATED ─▶ PICKUP_PENDING ─▶ PICKED_UP ─▶ IN_TRANSIT ─▶ OUT_FOR_DELIVERY ─▶ DELIVERED
                                              │                    │
                                              ▼                    ▼
                                            FAILED ◀───────────────┘
                                              │
                                   ┌──────────┴──────────┐
                                   ▼                     ▼
                            OUT_FOR_DELIVERY          RETURNED   (retry or return)

CANCELLED  ◀── from CREATED or PICKUP_PENDING only
```

- Terminal states: `DELIVERED`, `RETURNED`, `CANCELLED`.
- Editable (mutable fields) only in `CREATED` / `PICKUP_PENDING`.
- Cancellable only in `CREATED` / `PICKUP_PENDING`.
- Illegal transitions are rejected with `422 UNPROCESSABLE_ENTITY`.
- Every transition appends an immutable `shipment_status_history` row in the same transaction.

## Tracking numbers

Format `LV` + 10 digits + mod-11 check char + `SA` (e.g. `LV4830561927XSA`). Configurable via `AWB_PREFIX` / `AWB_COUNTRY`. Uniqueness is enforced by a soft-delete-aware unique index, with generation retry on the rare collision.

## API (prefix `/api/v1`)

Tenant context is required on every request. In production it is derived from the verified access token (upstream auth guard sets `request.tenantId`); for local/service use, pass `X-Tenant-Id: <uuid>`. Optional `X-Actor-Id: <uuid>` attributes history entries.

| Method | Path                                  | Description                               | Success |
| ------ | ------------------------------------- | ----------------------------------------- | ------- |
| POST   | `/shipments`                          | Create a shipment (status `CREATED`)      | 201     |
| GET    | `/shipments?status=&limit=&offset=`   | List shipments (tenant-scoped, paginated) | 200     |
| GET    | `/shipments/:id`                      | Get by id                                 | 200     |
| GET    | `/shipments/tracking/:trackingNumber` | Get by tracking number                    | 200     |
| GET    | `/shipments/:id/history`              | Status history (chronological)            | 200     |
| PATCH  | `/shipments/:id`                      | Update mutable fields (pre-pickup only)   | 200     |
| PATCH  | `/shipments/:id/status`               | Transition status (workflow-enforced)     | 200     |
| POST   | `/shipments/:id/cancel`               | Cancel (pre-pickup only)                  | 200     |
| GET    | `/health/live` \| `/health/ready`     | Liveness / readiness                      | 200     |

### Create — request

```
POST /api/v1/shipments
X-Tenant-Id: 00000000-0000-4000-8000-000000000001
Content-Type: application/json

{
  "sender":    { "name": "Acme Store", "phone": "+966500000001", "line1": "1 Logistics Way", "city": "Riyadh", "country": "SA" },
  "recipient": { "name": "Jane Doe",   "phone": "+966500000002", "line1": "42 Palm St",      "city": "Jeddah", "country": "SA" },
  "service": "NEXT_DAY",
  "weightGrams": 1200,
  "codAmount": 199.00,
  "declaredValue": 199.00,
  "currency": "SAR",
  "reference": "ORD-1234"
}
```

### Create — response (201)

```
{
  "id": "…uuid…",
  "trackingNumber": "LV4830561927XSA",
  "status": "CREATED",
  "service": "NEXT_DAY",
  "weightGrams": 1200,
  "codAmount": "199.0000",
  "currency": "SAR",
  "createdAt": "2026-06-05T12:00:00.000Z"
}
```

### Transition status — request

```
PATCH /api/v1/shipments/{id}/status
X-Tenant-Id: …
{ "status": "PICKUP_PENDING", "reason": "Scheduled for pickup" }
```

### Errors (RFC 7807 `application/problem+json`)

```
{
  "type": "about:blank",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "Illegal status transition from CREATED to DELIVERED.",
  "instance": "/api/v1/shipments/…/status",
  "code": "UNPROCESSABLE_ENTITY",
  "requestId": "…"
}
```

Common codes: `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `UNIQUE_CONSTRAINT` (409), `UNPROCESSABLE_ENTITY` (422).

## Testing

```
pnpm --filter @livraison/shipment test
pnpm --filter @livraison/shipment run test:cov
```

40 unit tests cover the state machine, tracking-number generation/validation, and all service operations (create with collision retry, update guards, legal/illegal transitions, cancel rules, history). Migrations and the unique tracking index were verified against PostgreSQL 16.

## Notes

- Tenant isolation is applied in every query (`WHERE tenant_id = …`); pair with the core-db RLS layer in production for defense-in-depth.
- This service ships its own Prisma schema/client (package-local `generated/`) and is independently deployable.
