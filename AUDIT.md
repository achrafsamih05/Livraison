# Livraison — Enterprise Audit Report (v1.0)

> Reviewers (role hats): Principal Software Architect, Security Auditor, DevOps Lead, Database Architect, Performance Engineer, QA Director.
> Date: 2026-06-05
> Method: Static review of committed code + toolchain execution (build, typecheck, test, lint) + specification review of `BLUEPRINT.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`.

---

## 0. Scope & Honest Baseline

This is critical context for reading every finding below.

**What actually exists as code today (Sprint 1):**

- Monorepo scaffolding: `pnpm` workspaces, Turborepo, shared `tsconfig`, Prettier, `.editorconfig`, `.gitignore`.
- One workspace package: `@livraison/design-system` (tokens, global CSS, and 4 primitives: Button, Input, Select, Tabs) with Vitest tests (22 passing) and Storybook config.
- ADRs 0001–0004.

**What does NOT exist as code yet (specification only):**

- All 30 backend services, all databases/migrations, all APIs, all infrastructure (K8s/Kafka/Postgres/Redis), the Next.js apps, and the Flutter apps. These live only as design documents.

Therefore this report is split:

- **Part A — Implemented Code Audit**: real, reproducible findings in committed code. These are actionable now.
- **Part B — Specification Audit**: design-level risks in the blueprint/architecture that must be resolved before or during implementation. These prevent expensive rework later.

Marking a finding's reality:

- `[CODE]` = verified against committed code / toolchain output.
- `[SPEC]` = design-level; not yet code, but a real risk to manage.

**Severity scale**: Critical / High / Medium / Low / Info.
**Priority scale**: P0 (now) / P1 (this sprint) / P2 (this quarter) / P3 (backlog).

---

## 1. Executive Summary

The Sprint 1 foundation is solid: strict TypeScript, accessible primitives, token-driven theming, green tests, and a clean build verified on this machine. However, there are real, reproducible defects in the committed code — most notably a **broken `lint` task** (no ESLint configuration exists, yet every package and the root pipeline call ESLint), **no CI pipeline**, and **no enforced coverage or accessibility gates**. These directly contradict the Definition of Done in `IMPLEMENTATION.md`.

At the specification level, the architecture is comprehensive and largely sound, but several high-impact decisions are under-specified in ways that historically cause security incidents and rework at scale: **multi-tenant isolation depends on a runtime setting (`app.tenant_id`) with no stated enforcement mechanism**, **COD/financial flows lack an explicit idempotency and exactly-once contract at the data layer**, **PII tokenization and key custody are described but not bound to concrete tables/columns**, and **the public tracking surface is a prime IDOR/enumeration target** that needs explicit rate-limiting and authorization design.

Headline counts:

- Implemented-code findings: 12 (0 Critical, 2 High, 6 Medium, 4 Low/Info).
- Specification findings: 21 (5 Critical, 8 High, 6 Medium, 2 Low/Info).

Top priorities (do first):

1. Fix the broken lint task and add a shared ESLint config (`[CODE]`, High).
2. Add CI with build/typecheck/test/lint + coverage and a11y gates (`[CODE]`, High).
3. Pin the tenant-isolation enforcement model (RLS + connection context + tests) before any service writes a row (`[SPEC]`, Critical).
4. Define the financial idempotency/exactly-once contract (outbox/inbox + unique keys) before COD/Finance services start (`[SPEC]`, Critical).
5. Bind PII classification to concrete columns with tokenization/field-encryption rules (`[SPEC]`, Critical).

---

# PART A — Implemented Code Audit

## A1. DevOps / Build — `lint` task is broken across the workspace

- ID: CODE-001
- Domain: DevOps, Maintainability
- Severity: High
- Priority: P0
- Status: Verified (`pnpm --filter @livraison/design-system lint` exits non-zero)
- Evidence: `eslint "src/**/*.{ts,tsx}"` fails with `ESLint couldn't find a configuration file`. There is no `.eslintrc*` / `eslint.config.*` anywhere, and no `packages/eslint-config` package (verified absent), even though `ARCHITECTURE.md` §2.2 lists `packages/eslint-config` and §14.2 mandates lint in CI.
- Impact: The root `pnpm lint` (which runs `turbo run lint`) fails. Any CI that runs lint will fail red on day one; teams will be tempted to disable the gate, eroding code quality enforcement.
- Root Cause: Lint scripts and dependency (`eslint@8.57.1`) were declared, but no configuration was authored, and no shared config package was created.
- Recommended Fix:
  1. Create `packages/eslint-config` exporting a flat config (ESLint 9) or `.eslintrc` (ESLint 8) with `@typescript-eslint`, `eslint-plugin-react`, `react-hooks`, `jsx-a11y`, and `eslint-plugin-storybook`.
  2. Add `eslint.config.js` to each package extending the shared config.
  3. Decide on ESLint 8 (legacy `.eslintrc`) vs ESLint 9 (flat config) and pin consistently. The repo pins `eslint@8.57.1` (already deprecation-warned at install), so either author an `.eslintrc.cjs` now or upgrade to ESLint 9 flat config and update the dependency.

## A2. DevOps / CI — No CI pipeline exists

- ID: CODE-002
- Domain: DevOps
- Severity: High
- Priority: P0
- Status: Verified (`.github/workflows` absent)
- Impact: Nothing enforces build/test/lint/typecheck/format on PRs. The Definition of Done in `IMPLEMENTATION.md` §5.3 and the CI plan in §12 are not realized. Regressions (like CODE-001) reach `main` undetected.
- Root Cause: CI was scheduled for Sprint 1/2 in the plan but not implemented alongside the code it should protect.
- Recommended Fix: Add a CI workflow running `pnpm install --frozen-lockfile`, then `turbo run build typecheck test lint` with affected-package filtering, plus `format:check`. Upload coverage. Make all checks required for merge. Cache pnpm store and Turbo.

## A3. QA — No coverage thresholds enforced

- ID: CODE-003
- Domain: QA, Testing
- Severity: Medium
- Priority: P1
- Status: Verified (`vitest.config.ts` declares coverage reporters but no `thresholds`)
- Impact: `IMPLEMENTATION.md` §14.1 requires ≥ 80% line coverage, but nothing fails the build when coverage drops. Coverage will silently decay as primitives are added.
- Root Cause: Coverage reporting configured without `coverage.thresholds`.
- Recommended Fix: Add `coverage.thresholds` (`lines: 80, functions: 80, branches: 70, statements: 80`) to `vitest.config.ts`, and run `vitest run --coverage` in CI. Fail the job below threshold.

## A4. QA / Accessibility — a11y is documented but not automatically gated

- ID: CODE-004
- Domain: QA, Frontend, Accessibility
- Severity: Medium
- Priority: P1
- Status: Verified (no `vitest-axe`/`jest-axe`; Storybook a11y addon present but no test-runner)
- Impact: ADR-0004 and `SKILL.md` mandate WCAG 2.2 AA, but there is no automated check. Storybook's a11y panel is manual-only. Regressions in contrast/roles will not be caught.
- Root Cause: Accessibility verification relies on human inspection plus Testing Library assertions; no axe-core integration in unit tests or a Storybook test-runner job.
- Recommended Fix: Add `vitest-axe` assertions to each primitive test (`expect(await axe(container)).toHaveNoViolations()`), and add `@storybook/test-runner` with the a11y check in CI.

## A5. Frontend / Maintainability — Inline-style strategy defeats CSS state styling and hurts performance at scale

- ID: CODE-005
- Domain: Frontend, Performance, Maintainability
- Severity: Medium
- Priority: P1
- Status: Verified (components compute large `style` objects; hover/focus handled via `!important` overrides in `styles.css`)
- Impact:
  - Hover/active/focus cannot be expressed in inline styles, so `styles.css` overrides inline styles with `!important` (e.g., `.lv-button[data-variant='primary']:hover { ... !important }`). This `!important` ladder is brittle: any consumer override now needs higher specificity or more `!important`, which is an anti-pattern.
  - Per-render style object allocation for every Button/Input/Select adds GC pressure in large lists (e.g., a 10k-row dispatch board rendering many buttons).
  - Theming via inline values means some values (e.g., size paddings) are not overridable by tenant CSS.
- Root Cause: ADR-0002 chose "class names + inline style" to avoid a Tailwind dependency, but inline styles are the wrong tool for stateful/themable visuals.
- Recommended Fix: Move static visual rules into the shipped `styles.css` keyed by the existing `lv-*` classes and `data-variant`/`data-size` attributes (which already exist on the DOM). Keep inline styles only for genuinely dynamic values. This removes all `!important`, eliminates per-render style allocation, and makes tenant overrides clean. Reaffirm or supersede ADR-0002 with this refinement. Consider zero-runtime CSS (Vanilla Extract / CSS Modules) as noted in the ADR's "revisit" clause.

## A6. Frontend — Dead/duplicated export: `TABS_DATA_STYLES`

- ID: CODE-006
- Domain: Frontend, Maintainability
- Severity: Low
- Priority: P2
- Status: Verified (the same CSS exists in `styles.css` and as an exported string constant `TABS_DATA_STYLES` reachable via `Tabs.TABS_DATA_STYLES` in the built `dist/index.d.ts`)
- Impact: Two sources of truth for the same tab styles. A consumer could inject `TABS_DATA_STYLES` and double-apply styles, or the two could drift. It also leaks an internal implementation detail through the public API.
- Root Cause: A development convenience constant was left in and is re-exported via the `export * as Tabs` barrel.
- Recommended Fix: Delete `TABS_DATA_STYLES`; the canonical rules already live in `styles.css`. If a runtime-injectable variant is ever needed, expose it intentionally and documented, not as a side effect of `export *`.

## A7. Frontend — Public API surface leaks internals via `export *`

- ID: CODE-007
- Domain: Frontend, API design, Maintainability
- Severity: Low
- Priority: P2
- Status: Verified (`export * as Tabs from './Tabs.js'` re-exports `Root`, `List`, `Trigger`, `Content`, `ListVertical`, and `TABS_DATA_STYLES`)
- Impact: Wildcard re-export makes every symbol in `Tabs.tsx` public, including helpers that should be internal. This makes future refactors breaking changes and bloats the typed surface.
- Root Cause: Barrel uses `export *` instead of an explicit allow-list.
- Recommended Fix: Replace `export * as Tabs` with an explicit composed object (`export const Tabs = { Root, List, ListVertical, Trigger, Content }`) so the public surface is intentional and stable.

## A8. Frontend — Stale/incorrect JSDoc on Button (loading behavior)

- ID: CODE-008
- Domain: Maintainability, Documentation
- Severity: Low
- Priority: P2
- Status: Verified
- Evidence: Button JSDoc still says loading "replaces children with a centered spinner" and "keeping the element non-interactive (pointerEvents disabled)". The code was corrected during Sprint 1 to keep the label (for the accessible name) and the `pointerEvents` approach was removed in favor of the native `disabled` attribute.
- Impact: Documentation contradicts behavior; future maintainers may "fix" the code back to the inaccessible version, reintroducing the bug that was caught in Sprint 1 testing.
- Root Cause: Comments not updated when the implementation was fixed.
- Recommended Fix: Update the JSDoc to state: loading keeps the visible label, prepends a spinner, sets `aria-busy="true"`, and disables via the native `disabled` attribute.

## A9. Frontend — Dead conditional in Input padding

- ID: CODE-009
- Domain: Maintainability
- Severity: Info
- Priority: P3
- Status: Verified
- Evidence: `paddingInline: leading !== undefined || trailing !== undefined ? '12px' : '12px'` — both branches return `'12px'`.
- Impact: Misleading code implying conditional behavior that does not exist.
- Root Cause: Likely a leftover from an intended different padding when adornments are present.
- Recommended Fix: Either collapse to `paddingInline: '12px'`, or implement the intended adornment-aware padding deliberately.

## A10. Frontend — Select placeholder logic can desync from actual selection

- ID: CODE-010
- Domain: Frontend, Correctness
- Severity: Medium
- Priority: P2
- Status: Verified by inspection
- Evidence: `showPlaceholder` is computed from `value`/`defaultValue` being empty. The placeholder `<option value="">` is rendered only when empty. In controlled usage where `value` is a valid option this is fine, but for uncontrolled usage with no `defaultValue` and no placeholder, the native select silently selects the first real option — meaning the form has a value the user never chose (a classic "phantom default" data-quality bug for shipment service level, country, etc.).
- Impact: Users can submit a service/country/etc. they never explicitly selected, producing incorrect shipments. This is a correctness/data-integrity risk for the create-shipment flow that will consume this component.
- Root Cause: Native select semantics: with no selected value it defaults to the first option.
- Recommended Fix: When a `placeholder` is provided, default the select to the placeholder option (`defaultValue=""`) unless a value is explicitly supplied, and validate required selection at the form layer (Zod). Document that `placeholder` implies a required, explicit choice. Add a test for the uncontrolled-no-default case.

## A11. Build — Root base tsconfig sets `incremental: true`, which already caused a build break

- ID: CODE-011
- Domain: Build, DevOps
- Severity: Medium
- Priority: P1
- Status: Verified (this exact conflict broke `tsup` DTS during Sprint 1; worked around by setting `incremental: false` only in the design-system tsconfig)
- Impact: Every new library package that extends the base config and uses `tsup`/bundle-DTS will hit `TS5074` unless it remembers to override `incremental`. This is a latent trap that will recur per package.
- Root Cause: `incremental: true` belongs in app/tsbuildinfo contexts, not in a base shared by bundled libraries.
- Recommended Fix: Remove `incremental` from `tsconfig.base.json`. Enable it only where a `tsBuildInfoFile` is configured (e.g., Next.js apps). This prevents the per-package landmine.

## A12. Supply Chain — No automated dependency/vuln scanning; deprecated ESLint pinned

- ID: CODE-012
- Domain: Security, Supply Chain
- Severity: Medium
- Priority: P1
- Status: Verified (install logs show `deprecated eslint@8.57.1` and 10 deprecated transitive deps; no Dependabot/Renovate config; no `pnpm audit` in any pipeline)
- Impact: `ARCHITECTURE.md` §11.7 mandates SCA and dependency SLAs, but nothing enforces them. Known-vulnerable transitive dependencies could ship undetected.
- Root Cause: Supply-chain tooling deferred.
- Recommended Fix: Add Renovate (or Dependabot), run `pnpm audit --audit-level=high` (or Trivy/Snyk) in CI, and add `osv-scanner`. Plan migration off deprecated ESLint 8 to ESLint 9.

### Part A — also worth noting (Info)

- No repository `LICENSE` file though packages declare `UNLICENSED` (intentional for private, but confirm). (`[CODE]`, Info)
- No `CODEOWNERS`, PR template, or commit-lint despite `IMPLEMENTATION.md` requiring Conventional Commits + CODEOWNERS. (`[CODE]`, Low, P2)
- Storybook `act(...)` warnings from Radix in tests are noise, not failures; suppressing them keeps logs readable. (`[CODE]`, Info)

---

# PART B — Specification Audit (Architecture / DB / API / Security / Infra / Perf / Scale / Mobile)

These findings are about the design in `BLUEPRINT.md` / `ARCHITECTURE.md` / `IMPLEMENTATION.md`. They are not code defects yet; they are design risks to close before the relevant sprint writes code. Fixing them on paper is cheap; fixing them after 30 services exist is not.

## B1. Security / Multi-tenancy — Tenant isolation depends on an unspecified runtime context

- ID: SPEC-001
- Domain: Security, Database, Architecture
- Severity: Critical
- Priority: P0 (before any service persists tenant data — Sprint 4/5)
- Reference: `ARCHITECTURE.md` §7.1, §7.4 ("RLS policies bound to `current_setting('app.tenant_id')`").
- Impact: If `app.tenant_id` is not set on every connection (e.g., a pooled connection reused across requests via PgBouncer in transaction mode), RLS either fails closed (outage) or, if policies are written permissively, leaks cross-tenant data. Connection-pool reuse of session GUCs is a well-known footgun. This is the single highest-impact data-leak vector in a multi-tenant logistics platform.
- Root Cause: The isolation mechanism is named but the enforcement contract (who sets it, when, and how it survives pooling) is undefined.
- Recommended Fix:
  1. Mandate `SET LOCAL app.tenant_id = $1` inside the same transaction as every query, never `SET` at session scope, so PgBouncer transaction pooling is safe.
  2. Provide a single data-access wrapper (per language) that refuses to issue queries unless tenant context is set; make "no tenant context" fail closed.
  3. Write RLS policies as default-deny with explicit `USING`/`WITH CHECK` on `tenant_id`.
  4. Add automated cross-tenant tests (attempt to read tenant B's rows under tenant A's context) to every service's CI.
  5. Add an ADR pinning this exact contract.

## B2. Security / Finance — No explicit exactly-once / idempotency contract for COD & settlements at the data layer

- ID: SPEC-002
- Domain: Security, Finance, Data Integrity
- Severity: Critical
- Priority: P0 (before COD/Finance — Sprint 11–16)
- Reference: `ARCHITECTURE.md` §5.5, §9.4 (outbox/inbox mentioned) and `BLUEPRINT.md` §4.9–4.10. The API spec includes `Idempotency-Key` (§8.2), but the financial data model does not define idempotency keys, unique constraints, or a reconciliation invariant.
- Impact: Money double-counting or loss. A retried `POST /v1/cod/collect`, a redelivered Kafka event, or a driver app offline replay can collect or settle COD twice without a unique business key and an inbox dedupe table. For a COD-heavy regional logistics model, this is direct financial and trust damage.
- Root Cause: Idempotency is specified at the API edge but not enforced end-to-end into the ledger and event consumers.
- Recommended Fix:
  1. Add explicit unique constraints: e.g., `cod_collections (shipment_id, idempotency_key)`, `settlement_items (batch_id, source_type, source_id)`.
  2. Mandate the inbox pattern (`processed_event_id` unique) for every financial consumer.
  3. Define the ledger as append-only double-entry with a reconciliation invariant (sum of debits = credits per journal) enforced by constraint/trigger.
  4. Require a property-based test suite that fuzzes retries/replays and asserts no double-spend.

## B3. Security / Privacy — PII classification is described but not bound to columns or a tokenization mechanism

- ID: SPEC-003
- Domain: Security, Privacy, Database
- Severity: Critical
- Priority: P0 (before customer/shipment schemas GA — Sprint 5–7)
- Reference: `ARCHITECTURE.md` §11.4–11.5 (tokenization, field-level encryption, residency) vs §7.3 schemas, which store `address jsonb`, phone, national IDs, IBAN with no field-encryption or tokenization annotation.
- Impact: Recipient names, phones, addresses, national IDs, and IBANs are exactly the data that leaks in logistics breaches. Without a concrete mapping of which columns are PII and how they are protected (tokenized vs encrypted vs plaintext), GDPR/PDPL/LGPD obligations (including right-to-erasure) cannot be met, and logs/exports will leak PII.
- Root Cause: Data classification exists as policy, not as schema-level annotations and access rules.
- Recommended Fix:
  1. Produce a PII column registry mapping each sensitive column to a class (PII/Restricted/PCI) and a protection method (tokenize / field-encrypt / plaintext).
  2. Tokenize national IDs and IBANs (store tokens; raw in a vault) per §11.4.
  3. Define erasure as pseudonymization that preserves aggregates.
  4. Enforce log redaction at the logging library, with tests that assert PII fields never appear in structured logs.
  5. Pin data residency: which clusters hold which countries' PII.

## B4. Security / API — Public tracking is a high-risk IDOR / enumeration surface without a defined control

- ID: SPEC-004
- Domain: Security, API
- Severity: Critical
- Priority: P0 (before public tracking — Sprint 8)
- Reference: `BLUEPRINT.md` §7.6.1 / `ARCHITECTURE.md` §8.5 (`GET /v1/tracking/{awb}`). AWBs are S10-compatible 13-char identifiers, which are partly sequential/predictable.
- Impact: If tracking by AWB returns recipient name, address, phone, or precise geo without a second factor, an attacker can enumerate AWBs and harvest PII at scale (a known pattern in real carrier breaches). This is both a data-leak and a stalking/safety risk.
- Root Cause: The public tracking endpoint is specified for usability without an explicit anti-enumeration and data-minimization control.
- Recommended Fix:
  1. Require AWB **plus** a second factor (recipient phone/email or a tokenized tracking link) before revealing any PII; show only coarse status/ETA to AWB-only lookups.
  2. Aggressively rate-limit and bot-protect the endpoint per IP/ASN.
  3. Data-minimize the public projection (no full address/phone; coarse geo).
  4. Issue opaque, unguessable tracking tokens for links in notifications instead of raw AWBs.

## B5. Security / AuthZ — Permission matrix lacks field/row-level and "deny" precedence rules; SoD only partially modeled

- ID: SPEC-005
- Domain: Security, Authorization
- Severity: Critical
- Priority: P0 (before AuthZ service — Sprint 5–6)
- Reference: `BLUEPRINT.md` §5.2 matrix; `ARCHITECTURE.md` §11.2.
- Impact: The capability matrix is coarse (resource-level). Real logistics breaches happen at field/row granularity: a Support Agent who can "view shipment tracking" must NOT see full recipient PII or COD bank details; a Driver must only see their own assigned stops. Without explicit field-level masking and row-scoping rules, the implementation will likely over-grant. The matrix also doesn't define conflict resolution (explicit deny > allow) or time-bound/break-glass grant expiry semantics.
- Root Cause: Authorization specified at capability granularity only.
- Recommended Fix:
  1. Define field-level read policies (PII masking) per role, not just resource-level.
  2. Define row-scoping predicates (driver→own stops, branch manager→own branch) as ABAC attributes enforced at API and DB (RLS).
  3. Specify deny-overrides-allow precedence and least-privilege defaults.
  4. Model break-glass with mandatory expiry, approval, and session recording.
  5. Encode SoD as testable policies (creator ≠ approver) with negative tests.

## B6. Database — Cross-service "no FK" rule needs an explicit consistency/repair strategy

- ID: SPEC-006
- Domain: Database, Architecture
- Severity: High
- Priority: P1
- Reference: `ARCHITECTURE.md` §7.4 ("cross-service references represented by IDs ... consistency maintained by events").
- Impact: Without referential integrity across services, orphaned/zombie references are inevitable (e.g., a shipment referencing a deleted merchant). Eventually-consistent systems need explicit reconciliation, or data quality silently rots and reports become wrong.
- Root Cause: The trade-off (no cross-DB FKs) is stated, but the compensating controls (reconciliation jobs, outbox guarantees, orphan detection) are not.
- Recommended Fix: Specify (a) event delivery guarantees (outbox + at-least-once + idempotent consumers), (b) periodic reconciliation/repair jobs that detect dangling references, (c) data-quality SLAs and alerts, and (d) soft-delete/tombstone propagation rules.

## B7. Database — `tracking_events` engine and partitioning strategy is ambiguous vs the 100k events/sec target

- ID: SPEC-007
- Domain: Database, Performance, Scalability
- Severity: High
- Priority: P1
- Reference: `ARCHITECTURE.md` §7.3 (`tracking_events` in PostgreSQL, daily partitions) vs §13.1 (100k events/sec) and §1.1 ("ScyllaDB/Cassandra optional"). ADR-0005 is listed as "to author."
- Impact: A single PostgreSQL table at 100k inserts/sec sustained (8.6B rows/day) is not realistic without heavy sharding; the design hedges between Postgres and Cassandra without deciding. Building on Postgres first and migrating later is a massive, risky data migration.
- Root Cause: The most write-heavy table in the system has an undecided storage engine.
- Recommended Fix: Decide ADR-0005 now. Recommendation: write path to an append-optimized store (Kafka as the log of record + ClickHouse or Cassandra/Scylla for queryable history); keep only a compacted "current status" projection in PostgreSQL for transactional reads. Define partition keys (by AWB hash) and TTL/archival upfront.

## B8. Performance / Scale — N+1 and fan-out risks in tracking projection and webhook delivery

- ID: SPEC-008
- Domain: Performance, Scalability
- Severity: High
- Priority: P1
- Reference: `ARCHITECTURE.md` §6.16, §6.30, §9.3 (Tracking and Webhook consume nearly all events).
- Impact: Every shipment lifecycle event fans out to tracking, notifications, analytics, search, AI, and webhooks. At 1M shipments/day with ~10+ events each, naive per-event synchronous fan-out (especially webhook delivery with per-endpoint HTTP calls) becomes the dominant bottleneck and a thundering-herd risk during peaks.
- Root Cause: Fan-out consumers specified without batching/coalescing or per-tenant concurrency isolation.
- Recommended Fix: Batch and coalesce projections; use per-tenant partitions and consumer concurrency caps; make webhook delivery a separate, isolated, horizontally-scaled worker pool with circuit breakers per endpoint; collapse rapid event sequences in the public projection.

## B9. Security / Infra — Secrets, KMS, and mTLS are specified but no key-custody/rotation ownership is bound

- ID: SPEC-009
- Domain: Security, Infrastructure
- Severity: High
- Priority: P1
- Reference: `ARCHITECTURE.md` §11.3–11.4, §10.3.
- Impact: "KMS + Vault + rotation" is stated, but without named key hierarchies (per-tenant DEKs, per-region KEKs, signing keys for JWT/webhook HMAC/POD PKI) and rotation runbooks, key sprawl and un-rotatable secrets accumulate. JWT signing key rotation (JWKS) and webhook secret rotation in particular must be designed for zero-downtime from day one.
- Root Cause: Cryptographic material lifecycle not enumerated.
- Recommended Fix: Produce a key catalog (purpose, algorithm, custodian, rotation period, rotation procedure, blast radius) covering JWT/JWKS, webhook HMAC (versioned), POD signing (PKI), DB field-encryption DEKs, per-tenant BYOK, and TLS certs. Add rotation runbooks and automated rotation tests.

## B10. API — Versioning, pagination, and error contracts are defined but not enforced by a schema gate

- ID: SPEC-010
- Domain: API, Maintainability
- Severity: High
- Priority: P1
- Reference: `ARCHITECTURE.md` §8 (good standards) but no contract-test/registry enforcement wired; `packages/contracts` doesn't exist yet.
- Impact: Without an OpenAPI/AsyncAPI source-of-truth in `packages/contracts` plus contract tests and a CI compatibility gate, the 30 services will drift from the documented standards (cursor pagination, RFC 7807 errors, idempotency). Breaking changes will leak to clients.
- Root Cause: Standards documented; enforcement mechanism not yet created.
- Recommended Fix: Create `packages/contracts` with OpenAPI 3.1 + AsyncAPI 2.6 + Protobuf; generate types/SDKs; add Spectral linting for API style, schema-registry compatibility checks, and Pact provider/consumer tests as required CI gates.

## B11. Security / Threat — Driver app GPS/POD anti-fraud is described but trust model is thin

- ID: SPEC-011
- Domain: Security, Mobile
- Severity: High
- Priority: P1
- Reference: `BLUEPRINT.md` §9.4, §9.6; `ARCHITECTURE.md` §4.4.
- Impact: COD + POD + GPS are the fraud-critical surfaces (fake deliveries, spoofed GPS, manipulated POD photos, cash skimming). Mock-location and root detection are mentioned, but the server-side trust model (never trust client geo/time; corroborate with cell/route telemetry; sign POD media; detect photo reuse/EXIF tampering) needs to be explicit, because client-side checks are bypassable.
- Root Cause: Anti-fraud leans on client-side signals.
- Recommended Fix: Treat all client data as untrusted; corroborate geo server-side against route/telematics; require signed, server-timestamped POD uploads; run server-side image authenticity checks (perceptual hash reuse, EXIF anomalies); feed signals to the fraud model (F19.05) with human review for adverse actions.

## B12. Infra / DR — RPO/RTO targets lack tested mechanisms for the financial path

- ID: SPEC-012
- Domain: Infrastructure, Reliability
- Severity: High
- Priority: P1
- Reference: `ARCHITECTURE.md` §1.1, §7.8, §13 (RPO ≤ 5 min, RTO ≤ 30 min, active-active for tracking ingest).
- Impact: Active-active ingest with async cross-region replicas can lose in-flight financial events on regional failover, violating exactly-once for money. The DR design doesn't distinguish consistency requirements between tracking (lossy-tolerant) and finance (must-not-lose).
- Root Cause: One DR posture applied to data with very different consistency needs.
- Recommended Fix: Use synchronous replication (or quorum writes) for financial/ledger data with stricter RPO≈0; allow relaxed async for tracking. Define and test failover runbooks separately for each data class; quarterly game-days as already planned.

## B13. Architecture — 30 microservices from the start is an organizational/operational anti-pattern for the team size

- ID: SPEC-013
- Domain: Architecture, Maintainability
- Severity: Medium
- Priority: P1
- Reference: `ARCHITECTURE.md` §6 (30 services) vs `IMPLEMENTATION.md` §19 (pods) and MVP timeline §16.1.
- Impact: Standing up 30 deployable services in the MVP/Growth phase imposes massive operational overhead (30× CI/CD, on-call, schema registries, mesh policies) before product-market fit. This is a classic "distributed monolith / premature decomposition" risk.
- Root Cause: Target-state decomposition applied too early.
- Recommended Fix: Start with a modular monolith or a small number of coarse services (e.g., 6–8 bounded "modulith" deployables) with strict internal module boundaries and the event backbone in place. Split out services only when scaling or ownership pressure justifies it. The MVP architecture in §16.1 already hints at this; make it explicit and resist early over-splitting.

## B14. Performance — Routing (VRPTW) compute and AI inference capacity not modeled

- ID: SPEC-014
- Domain: Performance, Scalability, AI
- Severity: Medium
- Priority: P2
- Reference: `BLUEPRINT.md` §11.1; `ARCHITECTURE.md` §13.1 (500-stop optimize < 30s); `IMPLEMENTATION.md` F09.04.
- Impact: VRPTW is NP-hard; "500 stops < 30s" is feasible with good solvers but compute cost scales sharply with fleet size and re-optimization frequency. No capacity model exists for solver workers or GPU inference pools, risking dispatch delays at peak.
- Root Cause: Optimization workload not capacity-planned.
- Recommended Fix: Define solver SLOs per problem size, a worker autoscaling model (KEDA on queue depth), caching of stable sub-routes, and incremental re-optimization rather than full re-solves. Separate batch (overnight planning) from real-time (re-route) tiers.

## B15. Database — Money/units conventions risk precision and unit bugs

- ID: SPEC-015
- Domain: Database, Correctness
- Severity: Medium
- Priority: P2
- Reference: `ARCHITECTURE.md` §7.2 (`numeric(19,4)` + ISO 4217), §7.3 (`weight_grams int`, dimensions jsonb).
- Impact: `numeric(19,4)` is good for money, but multi-currency rounding rules (currencies with 0 or 3 decimal places, e.g., JPY/KWD) and FX rounding need explicit policy or settlements will be off by rounding. Storing dimensions in `jsonb` (vs typed columns + units) invites unit-mismatch bugs (cm vs in) that affect volumetric pricing.
- Root Cause: Unit/precision policy under-specified.
- Recommended Fix: Define per-currency minor-unit handling and a single rounding policy; store dimensions as typed columns with an explicit unit enum; centralize volumetric calculation in one tested service.

## B16. Observability — PII-safe logging and trace sampling for financial events under-specified

- ID: SPEC-016
- Domain: Observability, Security
- Severity: Medium
- Priority: P2
- Reference: `ARCHITECTURE.md` §12.1 (PII redaction "centralized library") and §12.3 (sampling).
- Impact: Redaction is asserted but not bound to the PII registry (see SPEC-003). Tail-based sampling that drops financial traces could hamper money investigations; head sampling could miss rare fraud paths.
- Root Cause: Cross-cutting concerns not tied to data classification.
- Recommended Fix: Drive redaction from the PII column registry; force-sample (100%) financial and auth traces; add log-leak tests in CI.

## B17. Maintainability — `packages/contracts`, `eslint-config`, and codegen referenced but absent

- ID: SPEC-017
- Domain: Maintainability, DevEx
- Severity: Medium
- Priority: P1
- Reference: `ARCHITECTURE.md` §2.2 lists `packages/contracts`, `packages/eslint-config`, `tools/codegen`; none exist.
- Impact: The very packages that enforce consistency across the platform are missing, so the first services will invent their own conventions and drift before the shared tooling lands.
- Root Cause: Foundational shared packages scheduled but not created alongside the first consumer needs.
- Recommended Fix: Create `packages/eslint-config` (fixes CODE-001 too), `packages/contracts`, and `tools/codegen` before backend services start (Sprint 2/3), so the first service consumes them.

## B18. Scalability — Notification provider throughput and regulatory windows not capacity-modeled

- ID: SPEC-018
- Domain: Scalability, Compliance
- Severity: Medium
- Priority: P2
- Reference: `BLUEPRINT.md` §2.18; `ARCHITECTURE.md` §6.21 (50M notifications/day).
- Impact: 50M/day across SMS/Email/WA with per-country quiet-hours, sender-ID regulations, and provider rate limits requires a scheduling/throttling engine; naive immediate-send will hit provider caps and regulatory violations (e.g., night SMS).
- Root Cause: Notification scale and compliance constraints not turned into a concrete throttling/scheduling design.
- Recommended Fix: Design a rate-limited, quiet-hours-aware scheduler with per-provider token buckets, failover, and per-country compliance rules; load-test against provider limits.

## B19. API / Security — WebSocket and webhook authN/Z details thin

- ID: SPEC-019
- Domain: API, Security
- Severity: Low
- Priority: P2
- Reference: `ARCHITECTURE.md` §8.7–8.8.
- Impact: WS "auth via short-lived ticket" and webhook HMAC are mentioned but ticket issuance/expiry, per-channel authorization (can this principal subscribe to this AWB/branch?), and webhook SSRF protection (merchant-supplied URLs) are unspecified. Merchant-controlled webhook URLs are an SSRF vector into internal networks.
- Root Cause: Edge protocols under-specified.
- Recommended Fix: Define WS ticket lifetime + per-channel ABAC checks on subscribe; for webhooks, validate/allowlist destinations, block internal IP ranges (SSRF), sign with versioned secrets, and cap payload size.

## B20. Compliance — Right-to-erasure vs 7–10 year financial retention conflict not resolved

- ID: SPEC-020
- Domain: Compliance, Database
- Severity: Medium
- Priority: P2
- Reference: `ARCHITECTURE.md` §7.7 (retention) and §11.5 (erasure).
- Impact: GDPR/PDPL erasure rights conflict with financial/tax retention obligations. Without a documented reconciliation (pseudonymize-but-retain ledger; erase contactable PII), the platform risks either non-compliance or destroying records it must keep.
- Root Cause: The two policies coexist without an explicit precedence/mechanism.
- Recommended Fix: Document that financial records are retained in pseudonymized form (PII tokens severed from contact identity), and that erasure removes linkage and contactable PII while preserving legally required aggregates.

## B21. QA — No performance/chaos/contract test harness exists yet despite aggressive NFRs

- ID: SPEC-021
- Domain: QA, Performance
- Severity: Low
- Priority: P2
- Reference: `ARCHITECTURE.md` §13.4, §14.4; `IMPLEMENTATION.md` §14.
- Impact: The NFRs (P95 latencies, 8× peak, chaos) require harnesses (k6/Locust, chaos mesh, Pact) that don't exist. Building them late means NFRs are validated late, when fixes are expensive.
- Root Cause: Test infrastructure scheduled but not bootstrapped.
- Recommended Fix: Stand up the k6 load harness and Pact contract tests as soon as the first service exists (Sprint 2/3); add chaos experiments by Sprint 8 as planned.

---

## 2. Consolidated Findings Table

| ID       | Title                                                | Domain           | Severity | Priority | Reality |
| -------- | ---------------------------------------------------- | ---------------- | -------- | -------- | ------- |
| CODE-001 | Broken lint task / no ESLint config                  | DevOps           | High     | P0       | Code    |
| CODE-002 | No CI pipeline                                       | DevOps           | High     | P0       | Code    |
| CODE-003 | No coverage thresholds                               | QA               | Medium   | P1       | Code    |
| CODE-004 | a11y not auto-gated                                  | QA/A11y          | Medium   | P1       | Code    |
| CODE-005 | Inline-style `!important` anti-pattern + render cost | Frontend/Perf    | Medium   | P1       | Code    |
| CODE-006 | Dead/duplicated `TABS_DATA_STYLES`                   | Frontend         | Low      | P2       | Code    |
| CODE-007 | `export *` leaks internals                           | Frontend         | Low      | P2       | Code    |
| CODE-008 | Stale Button JSDoc                                   | Docs             | Low      | P2       | Code    |
| CODE-009 | Dead Input padding conditional                       | Maintainability  | Info     | P3       | Code    |
| CODE-010 | Select phantom-default data bug                      | Frontend         | Medium   | P2       | Code    |
| CODE-011 | Base tsconfig `incremental` trap                     | Build            | Medium   | P1       | Code    |
| CODE-012 | No SCA / deprecated ESLint                           | Security         | Medium   | P1       | Code    |
| SPEC-001 | Tenant isolation context unspecified                 | Security/DB      | Critical | P0       | Spec    |
| SPEC-002 | No exactly-once for COD/settlement                   | Finance          | Critical | P0       | Spec    |
| SPEC-003 | PII not bound to columns/tokenization                | Privacy          | Critical | P0       | Spec    |
| SPEC-004 | Public tracking IDOR/enumeration                     | Security/API     | Critical | P0       | Spec    |
| SPEC-005 | AuthZ lacks field/row-level + SoD                    | Security         | Critical | P0       | Spec    |
| SPEC-006 | No cross-service consistency repair                  | DB               | High     | P1       | Spec    |
| SPEC-007 | tracking_events engine undecided                     | DB/Scale         | High     | P1       | Spec    |
| SPEC-008 | Fan-out/webhook bottleneck                           | Perf/Scale       | High     | P1       | Spec    |
| SPEC-009 | Key custody/rotation unbound                         | Security/Infra   | High     | P1       | Spec    |
| SPEC-010 | API contracts not gate-enforced                      | API              | High     | P1       | Spec    |
| SPEC-011 | Driver GPS/POD trust model thin                      | Security/Mobile  | High     | P1       | Spec    |
| SPEC-012 | DR posture wrong for finance                         | Infra            | High     | P1       | Spec    |
| SPEC-013 | Premature 30-service decomposition                   | Architecture     | Medium   | P1       | Spec    |
| SPEC-014 | Routing/AI capacity unmodeled                        | Perf/AI          | Medium   | P2       | Spec    |
| SPEC-015 | Money/units precision policy                         | DB               | Medium   | P2       | Spec    |
| SPEC-016 | PII-safe logging/sampling                            | Observability    | Medium   | P2       | Spec    |
| SPEC-017 | Missing shared packages (contracts/eslint/codegen)   | DevEx            | Medium   | P1       | Spec    |
| SPEC-018 | Notification scale/compliance                        | Scale/Compliance | Medium   | P2       | Spec    |
| SPEC-019 | WS/webhook authZ + SSRF                              | API/Security     | Low      | P2       | Spec    |
| SPEC-020 | Erasure vs retention conflict                        | Compliance       | Medium   | P2       | Spec    |
| SPEC-021 | No perf/chaos/contract harness                       | QA               | Low      | P2       | Spec    |

---

## 3. Remediation Roadmap

### Immediate (P0 — before/at the start of the next sprint)

- CODE-001, CODE-002: Author `packages/eslint-config`; wire ESLint into every package; add CI running build/typecheck/test/lint/format + coverage. (Closes two High items and unblocks the DoD.)
- SPEC-001, SPEC-002, SPEC-003, SPEC-004, SPEC-005: Author the five "security-critical" ADRs (tenant isolation contract, financial idempotency/exactly-once, PII registry + tokenization, public-tracking anti-enumeration, field/row-level authorization + SoD) **before** the corresponding services are coded. These are paper artifacts now; they become very expensive after implementation.

### This sprint (P1)

- CODE-003, CODE-004, CODE-005, CODE-011, CODE-012: coverage gates, axe in tests + Storybook test-runner, refactor visual rules out of inline styles into `styles.css`, remove `incremental` from base tsconfig, add Renovate + `pnpm audit`/Trivy.
- SPEC-006, SPEC-007, SPEC-008, SPEC-009, SPEC-010, SPEC-011, SPEC-012, SPEC-013, SPEC-017: decide tracking storage engine (ADR-0005), define cross-service reconciliation, fan-out/webhook isolation, key catalog + rotation, create `packages/contracts` + codegen + API gates, driver anti-fraud trust model, finance-grade DR, and confirm a modulith-first decomposition.

### This quarter (P2)

- CODE-006, CODE-007, CODE-008, CODE-010: design-system cleanups and the Select phantom-default fix (do before create-shipment UI consumes Select).
- SPEC-014, SPEC-015, SPEC-016, SPEC-018, SPEC-019, SPEC-020, SPEC-021: capacity models, money/units policy, observability redaction, notification throttling, WS/webhook SSRF controls, erasure-vs-retention policy, and the perf/chaos/contract harness.

### Backlog (P3)

- CODE-009 and other Info items folded into routine refactors.

---

## 4. Positive Findings (what is already done well)

- **Strict TypeScript** baseline (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `useUnknownInCatchVariables`) — strong correctness posture.
- **Accessibility-first primitives**: labels wired to controls, `aria-invalid`/`aria-errormessage`, `aria-busy`, visible focus rings, reduced-motion support, RTL via logical properties. The Sprint 1 loading-state bug was caught by tests and fixed — evidence the test discipline works.
- **Token-driven theming** via CSS variables with clean tenant-override seams.
- **Verified green toolchain**: build, typecheck, and 22 tests pass; portable cross-platform build (the POSIX `cp` issue was caught and fixed).
- **Documentation depth**: BLUEPRINT/ARCHITECTURE/IMPLEMENTATION are unusually thorough and internally consistent, which makes this very audit possible.

---

## 5. Audit Caveats

- This audit reflects the repository at the time of review: Sprint 1 code plus three specification documents. The bulk of the platform is not implemented, so most "platform" findings are necessarily about the design, not running code. They are included because catching them now is the entire point of an architecture review.
- No dynamic security testing (DAST), penetration testing, or live infrastructure review was possible because no services or infrastructure are deployed. Those must be repeated against running systems each quarter per `ARCHITECTURE.md` §11.7.

— End of Audit Report —
