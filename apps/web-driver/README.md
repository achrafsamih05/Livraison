# @livraison/web-driver

Driver Web Portal for the Livraison platform — a mobile-first PWA. Next.js (App Router) · TypeScript · Tailwind · shadcn-style UI · React Query · Zustand · offline-first.

## Run locally

```
cp .env.example .env
pnpm --filter @livraison/web-driver dev
```

Open http://localhost:3102 on a phone (or device emulation). Requires the identity (3001), shipment (3002), and tracking (3003) services running.

## Features

- **Authentication**: email/password login, logout, JWT held server-side in an httpOnly cookie (BFF); DRIVER-role RBAC enforced at login, middleware, layout, and every BFF route.
- **Dashboard**: assigned count, out-for-delivery, delivered, failed; daily route summary.
- **Shipments**: list assigned shipments, client-side search, filter chips by status, detail view.
- **Delivery workflow**: Accept → Picked up → In transit → Out for delivery → Delivered / Failed / Returned, mapped to the canonical shipment status machine so the UI never offers an illegal transition.
- **Proof of delivery**: signature capture (pointer/touch), photo capture with downscale, delivery notes, recipient name, GPS stamp.
- **Location tracking**: one-shot capture, continuous watch, last known location, bounded history.
- **Offline support**: installable PWA (service worker app shell + offline page), IndexedDB durable outbox, background sync on reconnect/visibility/interval, automatic retry queue with idempotency keys.
- **Notifications/alerts**: in-app toasts for action results and connectivity changes.

## Architecture

```
src/
├─ app/
│  ├─ login/                       # public auth page
│  ├─ offline/                     # PWA offline fallback (precached)
│  ├─ (driver)/                    # role-guarded group + mobile AppShell
│  │  ├─ dashboard/ shipments/ shipments/[id]/ route/ profile/
│  ├─ api/bff/                     # Backend-for-frontend (auth, shipments, transition, pod, location)
│  └─ manifest.webmanifest/        # PWA manifest route
├─ components/                     # AppShell, dialogs, signature/photo capture, toggles, ui/*
├─ lib/                            # api, hooks, schemas, types, delivery-workflow, utils
├─ offline/                        # IndexedDB (idb), durable outbox, sync engine
├─ server/                         # server-only session (httpOnly cookie) + api-client + guard
├─ stores/                         # Zustand: connectivity, location
└─ test/                           # vitest setup (jsdom + fake-indexeddb)
public/sw.js                        # service worker (network-first nav, SWR assets, no API caching)
```

## Offline model

Every driver action (status transition, POD, location) is written to a durable IndexedDB **outbox** first, then a flush is attempted. Each item carries an **idempotency key** so server-side dedupe makes retries safe (no double transitions). Auto-sync triggers on `online`, tab visibility, and a 30s interval; the connectivity banner shows queued count with a manual "Sync now". This works whether the driver is online, flaky, or fully offline.

## Security

- No tokens in the browser: access/refresh/tenant live only in an httpOnly, SameSite=strict, Secure cookie read server-side by the BFF.
- RBAC: DRIVER role required; non-drivers are rejected at login and guarded routes redirect.
- The service worker never caches `/api/*` (user/tenant-specific); mutations go through the outbox, not the cache.
- Client GPS is advisory; the backend timestamps/attributes location and POD events (audit logged in the tracking service).

## Non-functional

- Mobile-first, responsive, bottom-tab navigation, 44px+ targets.
- Dark mode (next-themes, dark default) + RTL (logical properties + direction toggle).
- Accessibility: labelled fields, `role="alert"` errors, `aria-current` nav, skip link, reduced-motion.

## Testing

```
pnpm --filter @livraison/web-driver test
```

Unit + integration tests cover the delivery workflow state mapping, the IndexedDB outbox (enqueue/fail/retry/ordering), and the sync engine (success, failure-requeue, idempotency-key propagation, retry-on-next-flush) against `fake-indexeddb`.

## Notes

- Token refresh-on-401 is captured (refresh token stored) but auto-refresh in the BFF is the next increment.
- Push notifications use in-app toasts; Web Push (VAPID) can be layered onto the existing service worker later.
- PWA icons referenced by the manifest (`/icons/icon-192.png`, `/icons/icon-512.png`) should be added to `public/icons/` before store-quality install; the app installs and runs without them in development.
