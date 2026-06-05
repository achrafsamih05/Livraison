# Livraison

Enterprise logistics and delivery management platform.

This monorepo hosts the apps, services, packages, and infrastructure for Livraison. The full product blueprint, architecture specification, and implementation plan are checked in alongside the code:

- [`BLUEPRINT.md`](./BLUEPRINT.md) — Business, domain, UX, and operations blueprint.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Architecture and technical specification.
- [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) — Engineering implementation plan and backlog.
- [`SKILL.md`](./SKILL.md) — Design system mission and brand foundations.
- [`docs/adr/`](./docs/adr) — Architecture Decision Records.

## Repository layout

```
.
├─ apps/                # Web and mobile apps (added per sprint)
├─ packages/            # Shared workspace packages
│  ├─ design-system/    # Tokens and primitives (Button, Input, Select, Tabs, …)
│  └─ tsconfig/         # Shared TypeScript configurations
├─ services/            # Backend microservices (added per sprint)
├─ tools/               # Repository tooling and scripts (added per sprint)
└─ docs/                # ADRs, runbooks, guides
```

## Prerequisites

- Node.js 20 (the repository pins `20.11.0` via `.nvmrc`).
- pnpm 9 (the repository pins `pnpm@9.12.3` via `package.json#packageManager`).

Enable Corepack to use the pinned pnpm version automatically:

```
corepack enable
```

## Getting started

```
pnpm install
pnpm build
pnpm test
```

To work on the design system in isolation:

```
pnpm --filter @livraison/design-system dev          # tsup watch build
pnpm --filter @livraison/design-system storybook    # Storybook on :6006
pnpm --filter @livraison/design-system test         # Vitest one-shot run
```

## Sprint cadence

Implementation follows the sprint plan in [`IMPLEMENTATION.md`](./IMPLEMENTATION.md). Each sprint adds production-ready code aligned with the documented backlog. Sprint 1 lands the foundations and the first design system primitives; subsequent sprints extend the system, scaffold backend services, and implement domain features.

## Contributing

- Conventional Commits, branch per change, PR review with code owners.
- Definition of Done lives in [`IMPLEMENTATION.md`](./IMPLEMENTATION.md).
- Material architectural decisions are recorded as ADRs under [`docs/adr/`](./docs/adr).
