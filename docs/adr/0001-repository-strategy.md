# ADR-0001 — Repository strategy: Turborepo monorepo

- Status: Accepted
- Date: 2026-06-05
- Deciders: Principal engineering, DevEx, Frontend platform
- Supersedes: —

## Context

Livraison is a multi-app, multi-service platform: three or more Next.js portals, a Flutter driver app, a Flutter handheld app, ~30 backend services, and shared libraries (design system, contracts, SDK). We need a repository topology that:

- Maximizes code sharing for design tokens, contracts, and SDKs.
- Keeps build, lint, and test feedback fast for individual changes.
- Allows independent service ownership without forcing polyrepo overhead.
- Plays well with our chosen GitOps and CI/CD flow.

## Decision

Adopt a **single monorepo** managed with **pnpm workspaces** and **Turborepo** for task orchestration.

- Top-level layout: `apps/`, `packages/`, `services/`, `tools/`, `docs/`, `infra/` (added in later sprints).
- Frontend packages are TypeScript with `tsup` for libraries and Next.js for apps.
- Backend services live under `services/` and use language-appropriate build systems; they reuse `packages/contracts` for OpenAPI/AsyncAPI/Proto sources.
- Polyrepos are reserved for partner SDKs and tenant white-label customizations.

## Alternatives considered

1. **Polyrepo per service or app.** Better isolation but high coordination overhead for shared schemas and design tokens; rejected.
2. **Nx monorepo.** Comparable feature set; we chose Turborepo for a smaller cognitive surface and stronger native integration with Vercel/Next deployment toolchain.
3. **Bazel monorepo.** Powerful but operationally heavy for a primarily TypeScript and Kotlin/Go/Python mix without dedicated platform engineers; rejected for now, revisitable at scale.

## Consequences

- Shared packages (design system, contracts) are versioned via the `workspace:*` protocol and consumed without publishing.
- CI must enforce package-level affected detection (`turbo run ... --filter`) to keep PR feedback fast.
- Service code in non-JS languages still lives in the monorepo but is built by their native toolchains; Turborepo only orchestrates JS/TS pipelines and shells out for the rest where helpful.
- Onboarding requires `pnpm` and `node 20`; the `.nvmrc` and `engines` field enforce versions.
