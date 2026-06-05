# @livraison/tracking

Tracking service for the Livraison platform: tracking-event creation, shipment timeline, public + internal tracking, real-time updates, status synchronization, event history, and audit logs. NestJS + Prisma + PostgreSQL.

## Run locally

```
cp .env.example .env
docker compose up -d postgres
pnpm --filter @livraison/tracking exec prisma generate
pnpm --filter @livraison/tracking run migrate:deploy
pnpm --filter @livraison/tracking run start:dev
```

Or fully containerized: `docker compose up --build`.

## Data model

- **tracking_events** — append-only journey events; `statusAfter` set when an event drives a lifecycle change; `isPublic` controls public visibility.
- **shipment_tracking_state** — one row per shipment with the projected `currentStatus`, last event, and `eventCount`; maintained transactionally with each event for O(1) reads and status sync.
- **tracking_audit_logs** — append-only audit of CREATE / READ (public lookups) / SYNC actions.

## Features

- **Tracking Event Creation** — appends an event, projects status, audits, and publishes a real-time update in one transaction.
- **Shipment Timeline** — full chronological internal timeline; minimized public timeline (public events + customer fields only).
- **Public Tracking Endpoint** — `/public/track/:trackingNumber` returns status + public events; anti-enumeration (rate limit, second factor for PII) enforced at the edge per AUDIT.md SPEC-004.
- **Internal Tracking Dashboard** — filter shipments by projected status / recency.
- **Event History** — paginated, filterable (type, source, date range).
- **Status Synchronization** — re-derives current status from the latest status-bearing event and repairs the projection (idempotent).
- **Real-time updates** — Server-Sent Events per shipment and per public tracking number.
- **Audit Logs** — paginated audit query per shipment.

## API (prefix `/api/v1`)

Tenant context required on every request: from the verified token (`request.tenantId`) or `X-Tenant-Id: <uuid>`. Optional `X-Actor-Id` attributes audit/history.

### Internal

| Method | Path                                                                    | Description                              |
| ------ | ----------------------------------------------------------------------- | ---------------------------------------- |
| POST   | `/tracking/events`                                                      | Create event (+ sync + audit + realtime) |
| GET    | `/tracking/shipments/:id/timeline`                                      | Full timeline                            |
| GET    | `/tracking/shipments/:id/events?type=&source=&from=&to=&limit=&offset=` | Paginated/filterable history             |
| GET    | `/tracking/shipments/:id/state`                                         | Current projected status                 |
| GET    | `/tracking/shipments/:id/audit?from=&to=&limit=&offset=`                | Audit log                                |
| POST   | `/tracking/shipments/:id/sync`                                          | Re-derive + repair status                |
| GET    | `/tracking/dashboard?status=&updatedSince=&limit=&offset=`              | Internal dashboard                       |
| SSE    | `/tracking/shipments/:id/stream`                                        | Real-time updates (text/event-stream)    |

### Public

| Method | Path                                   | Description                 |
| ------ | -------------------------------------- | --------------------------- |
| GET    | `/public/track/:trackingNumber`        | Public timeline (minimized) |
| SSE    | `/public/track/:trackingNumber/stream` | Real-time public updates    |

### Create event — request

```
POST /api/v1/tracking/events
X-Tenant-Id: 00000000-0000-4000-8000-000000000001
X-Actor-Id: 00000000-0000-4000-8000-0000000000aa
Content-Type: application/json

{
  "shipmentId": "…uuid…",
  "trackingNumber": "LV1234567890XSA",
  "type": "OUT_FOR_DELIVERY",
  "source": "DRIVER_APP",
  "location": "Jeddah",
  "latitude": 21.4858,
  "longitude": 39.1925,
  "isPublic": true
}
```

### Real-time (SSE)

```
GET /api/v1/tracking/shipments/{id}/stream
Accept: text/event-stream

data: {"shipmentId":"…","trackingNumber":"LV…","eventId":"…","type":"OUT_FOR_DELIVERY","statusAfter":"OUT_FOR_DELIVERY","occurredAt":"…"}
```

### Errors

RFC 7807 `application/problem+json` with stable `code` and `requestId`. Common: `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `UNPROCESSABLE_ENTITY` (422).

## Testing

```
pnpm --filter @livraison/tracking test
pnpm --filter @livraison/tracking run test:cov
```

26 tests cover the event→status map, the SSE bus (per-shipment / per-tracking filtering), and all service operations (transactional event creation + projection, out-of-order handling, public minimization + READ audit, history/dashboard filtering, sync, audit). Migration and constraints were verified against PostgreSQL 16.

## Real-time at scale

The SSE bus is in-process (single replica). For multi-replica deployments, back it with Redis pub/sub or the Kafka tracking topic so updates reach clients connected to any replica (see ARCHITECTURE.md event backbone). The service interface (`TrackingEventsBus`) is the single seam to swap.

## Notes

- Tenant isolation is enforced in every query; pair with the core-db RLS layer in production.
- Ships its own package-local Prisma schema/client and is independently deployable. The tracking-event concept overlaps with `core-db.tracking_events`; consolidating per-service schemas vs. finalizing a schema-per-service boundary remains an open architectural decision.
