# @livraison/web-merchant

Merchant Portal for the Livraison platform. Next.js (App Router) · TypeScript · Tailwind · shadcn-style UI · React Query.

## Run locally

```
cp .env.example .env
pnpm --filter @livraison/web-merchant dev
```

Open http://localhost:3100. The portal calls upstream services (identity 3001, shipment 3002, tracking 3003) through its own server-side BFF.

## Pages

| Route               | Description                                     |
| ------------------- | ----------------------------------------------- |
| `/login`            | Email/password sign-in                          |
| `/dashboard`        | KPI overview + quick actions                    |
| `/shipments`        | Paginated, status-filterable list               |
| `/shipments/[id]`   | Details + tracking timeline + cancel            |
| `/shipments/create` | Create-shipment form (sender/recipient/package) |
| `/profile`          | Account details                                 |
| `/settings`         | Theme + reading direction                       |

## Architecture

- **Folder structure**

  ```
  src/
  ├─ app/
  │  ├─ login/                     # public auth page
  │  ├─ (app)/                     # authenticated group (server-guarded layout + AppShell)
  │  │  ├─ dashboard/ shipments/ shipments/[id]/ shipments/create/ profile/ settings/
  │  └─ api/bff/                   # Backend-for-frontend route handlers
  ├─ components/                   # AppShell, providers, toggles, page-header, form-field
  │  └─ ui/                        # shadcn-style primitives (button, input, card, table, select, …)
  ├─ lib/                          # api client, hooks (React Query), schemas (zod), types, utils
  └─ server/                       # server-only: session (httpOnly cookie) + upstream api-client
  ```

- **API integration (BFF)**: The browser never holds tokens. The login handler authenticates upstream and stores access/refresh/tenant in an **httpOnly, SameSite=strict, Secure** cookie. All data calls go to same-origin `/api/bff/*`, which injects the bearer token and tenant server-side. This directly mitigates XSS token theft (AUDIT.md security posture).

- **State management**: React Query for all server state (caching, `keepPreviousData` pagination, retry that never retries 4xx/auth). Forms use React Hook Form + Zod (schemas shared with the BFF for double validation).

## Requirements met

- **Responsive**: mobile-first; collapsible sidebar with overlay on small screens; fluid grids.
- **Dark mode**: `next-themes` class strategy, dark default, light/system options; HSL token theme.
- **Accessibility**: labelled fields wired via `aria-describedby`/`aria-invalid`, `role="alert"` errors, skip-link, `aria-current` nav, visible focus rings, `prefers-reduced-motion` support, 44px+ targets.
- **RTL**: layouts use logical properties (`ms/me/ps/pe`, `start/end`); a direction toggle flips `dir` on `<html>` and the UI mirrors automatically (also in Settings).

## Scripts

```
pnpm --filter @livraison/web-merchant dev        # dev server on :3100
pnpm --filter @livraison/web-merchant build      # production build
pnpm --filter @livraison/web-merchant typecheck  # tsc --noEmit
```

## Notes

- Single-tenant per deployment: the login uses `DEFAULT_TENANT_SLUG`; the resolved tenant is then carried server-side.
- Token refresh is stubbed at the session layer (refresh token is stored); wiring automatic refresh-on-401 in the BFF is the next increment.
