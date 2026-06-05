# Livraison — Enterprise Implementation Plan

## Companion to BLUEPRINT.md and ARCHITECTURE.md (v1.0)

> Audience: TPMs, engineering managers, tech leads, scrum masters, delivery owners, security/compliance leads, SRE.
> Status: Execution-ready plan. No code.
> Cadence: 2-week sprints. Quarterly milestones (Q-cycles). Time horizon: 24–36 months.

---

## Table of Contents

1. Conventions & Estimation
2. Epic Breakdown (E01–E20)
3. Feature Breakdown (per epic, with priority/deps/complexity/sprint/risks/AC)
4. User Story Breakdown (per major feature)
5. Sprint Planning (model and ceremonies)
6. Development Roadmap (12 quarters)
7. Frontend Implementation Plan
8. Mobile Implementation Plan
9. Backend Implementation Plan
10. Database Implementation Plan
11. Infrastructure Implementation Plan
12. CI/CD Implementation Plan
13. Security Implementation Plan
14. Testing Implementation Plan
15. Documentation Plan
16. Product Backlog (master)
17. Sprint Backlog Templates (S1–S8 worked examples)
18. Milestone Plan
19. Team Structure
20. Delivery Schedule

---

# 1. Conventions & Estimation

## 1.1 Priority

- **P0 — Critical**: Required for MVP go-live; blocks dependents.
- **P1 — High**: Needed for product-market fit and growth.
- **P2 — Medium**: Important for scale, optimization, premium tiers.
- **P3 — Nice-to-have / Future**: Backlog or innovation track.

## 1.2 Complexity (T-shirt + story points)

- **XS** = 1–2 SP, **S** = 3–5 SP, **M** = 8 SP, **L** = 13 SP, **XL** = 20 SP, **XXL** = 40+ SP (decompose).
- Velocity assumptions per stream (per 2-week sprint, mature team): backend squad ~40 SP, frontend squad ~35 SP, mobile squad ~30 SP, data/AI squad ~30 SP, platform squad ~30 SP.

## 1.3 Sprint Index

- Sprint Sn = sprint number from Sprint 1; "Sprint S5–S6" means delivery spans those sprints.
- Quarter Qn (Q1, Q2, ...) = 3 calendar months (~6 sprints).

## 1.4 Acceptance Criteria pattern

Given–When–Then; testable; tied to non-functional requirements (perf, security, a11y) where applicable.

## 1.5 RACI shorthand

- **R** = Responsible (does the work)
- **A** = Accountable (owns outcome)
- **C** = Consulted
- **I** = Informed

---

# 2. Epic Breakdown

20 epics span the platform. Each epic decomposes into features, then stories.

| ID  | Epic                                 | Outcome                                                    |
| --- | ------------------------------------ | ---------------------------------------------------------- |
| E01 | Platform Foundation                  | Cloud, K8s, mesh, observability, GitOps, security baseline |
| E02 | Identity & Access                    | IAM, AuthN, AuthZ, SSO, MFA, sessions, audit               |
| E03 | Tenancy & Configuration              | Multi-tenant, country/region/branch config, feature flags  |
| E04 | Merchant Lifecycle                   | Onboarding, KYC/KYB, contracts, rate cards, integrations   |
| E05 | Customer & Address                   | Profiles, address book, consents, public tracking identity |
| E06 | Network: Branches, Warehouses, Fleet | Facilities, layouts, vehicles, telematics                  |
| E07 | Shipment Lifecycle                   | Create, label, manifest, multi-piece, holds, cancel        |
| E08 | Pricing & Rating                     | Rate cards, surcharges, taxes, FX, promo, simulator        |
| E09 | Pickup & Dispatch                    | Requests, routing, assignment, attempts                    |
| E10 | Last-Mile Delivery & POD             | OFD, attempts, POD (signature/photo/OTP/ID), reattempts    |
| E11 | Warehouse Operations                 | Inbound, sortation, outbound, holds, inventory             |
| E12 | Linehaul / Transfer                  | Trips, sealing, telematics, inbound at destination         |
| E13 | Returns & Reverse Logistics          | RTO/RTS/customer returns, QC, exchanges                    |
| E14 | Tracking & Notifications             | Event ingest, public tracking, multi-channel notifications |
| E15 | COD & Payments                       | Collection, cash sessions, deposits, reconciliation        |
| E16 | Finance & Settlements                | Invoicing, settlements, payouts, GL, ERP exports           |
| E17 | CRM & Support                        | Tickets, KB, SLAs, NPS/CSAT, escalations                   |
| E18 | Analytics & Reporting                | KPIs, dashboards, scheduled reports, data lake             |
| E19 | AI / ML Platform                     | ETA, routing, delay, fraud, demand, support agent, vision  |
| E20 | International Expansion & Partners   | Customs, multi-currency, partner carriers, residency       |

---

# 3. Feature Breakdown

Each feature lists: Priority, Dependencies, Complexity, Suggested Sprint, Risks, Acceptance Criteria.

> Notation: dependencies refer to Epic IDs (E0X) or feature IDs (F0X.YY).

## E01 — Platform Foundation

### F01.01 Cloud landing zones (multi-account, networking, IAM)

- Priority: P0
- Dependencies: —
- Complexity: XL
- Sprint: S1–S2
- Risks: Account quotas; cross-region networking; SCPs.
- AC: Three accounts (dev/staging/prod) per primary region exist; VPC peering / Transit Gateway; baseline IAM; Terraform modules versioned; CIS benchmarks pass ≥ 95%.

### F01.02 Kubernetes platform with service mesh

- Priority: P0
- Dependencies: F01.01
- Complexity: XL
- Sprint: S2–S3
- Risks: Mesh complexity; cert lifecycle.
- AC: EKS/GKE clusters with Istio/Linkerd; mTLS default; ingress; cert-manager; HPA/Karpenter; PDBs; runbooks published.

### F01.03 GitOps & progressive delivery

- Priority: P0
- Dependencies: F01.02
- Complexity: L
- Sprint: S3
- Risks: Drift between manifests and clusters.
- AC: ArgoCD installed; Argo Rollouts for canary/blue-green; environment promotion via PR; rollback drills passing.

### F01.04 Observability stack (logs, metrics, traces)

- Priority: P0
- Dependencies: F01.02
- Complexity: L
- Sprint: S3–S4
- Risks: Cost; cardinality.
- AC: OTel collectors deployed; Grafana/Loki/Tempo/Mimir; standard dashboards; SLO templates; alerts routing to PagerDuty.

### F01.05 Secrets & KMS baseline

- Priority: P0
- Dependencies: F01.01
- Complexity: M
- Sprint: S2
- Risks: Misconfigured KMS keys.
- AC: Vault/Secrets Manager; External Secrets in K8s; KMS-backed envelope encryption; rotation policies documented and tested.

### F01.06 Security guardrails (CSPM, runtime, supply chain)

- Priority: P0
- Dependencies: F01.01
- Complexity: L
- Sprint: S3–S4
- Risks: Alert fatigue.
- AC: CSPM tool integrated; Falco runtime alerts; image signing (cosign); SBOM (Syft) per release; admission policies (OPA/Gatekeeper) deny unsigned images.

### F01.07 Data platform foundations

- Priority: P1
- Dependencies: F01.02
- Complexity: L
- Sprint: S4–S5
- Risks: Data governance debt.
- AC: Object store buckets, Lakehouse layer, schema registry, data catalog, lineage starter.

## E02 — Identity & Access

### F02.01 IAM service skeleton + identities

- Priority: P0
- Dependencies: F01.x
- Complexity: M
- Sprint: S3
- Risks: Migration paths if changed later.
- AC: Identity CRUD; tenant-aware; audit emitted; service deployed with SLO dashboards.

### F02.02 AuthN: password + OTP + WebAuthn (passkey-preferred)

- Priority: P0
- Dependencies: F02.01
- Complexity: L
- Sprint: S4–S5
- Risks: WebAuthn UX edge cases.
- AC: Login flows pass security review; lockout policy; MFA enforcement per role; passkey primary, SMS fallback.

### F02.03 AuthZ: RBAC + ABAC with OPA/Cedar

- Priority: P0
- Dependencies: F02.01
- Complexity: L
- Sprint: S5–S6
- Risks: Policy explosion; perf at scale.
- AC: PDP latency P95 < 10 ms (cached); policy unit tests; SoD policies enforced; default-deny.

### F02.04 SSO (OIDC + SAML)

- Priority: P1
- Dependencies: F02.02
- Complexity: M
- Sprint: S7–S8
- Risks: IdP variance.
- AC: At least 3 IdPs validated (Okta/EntraID/Google); JIT provisioning; SCIM optional.

### F02.05 Service identity (SPIFFE/SPIRE) + mTLS automation

- Priority: P0
- Dependencies: F01.02
- Complexity: M
- Sprint: S4
- Risks: Cert rotation outages.
- AC: All in-mesh services authenticate via SPIFFE IDs; cert rotation < 24 h; chaos test passes.

### F02.06 Audit log service (hash-chained)

- Priority: P0
- Dependencies: F01.04
- Complexity: M
- Sprint: S5
- Risks: Throughput at scale.
- AC: Append-only; tamper-evident verification job; coverage of authN/Z, finance, HR mutations.

## E03 — Tenancy & Configuration

### F03.01 Tenant model & RLS rollout

- Priority: P0
- Dependencies: F02.01
- Complexity: L
- Sprint: S4–S5
- Risks: Performance regressions; cross-tenant leaks.
- AC: All business tables have `tenant_id`; RLS enforced; cross-tenant tests pass; per-tenant quotas configurable.

### F03.02 Configuration & feature flags service

- Priority: P0
- Dependencies: F02.01
- Complexity: M
- Sprint: S4
- Risks: Flag sprawl.
- AC: SDKs for web/mobile/services; targeting by tenant/role/region; audited changes.

### F03.03 Country/region/branch hierarchy

- Priority: P0
- Dependencies: F03.01
- Complexity: M
- Sprint: S5
- Risks: Data residency mismatch later.
- AC: CRUD for country/region/branch; service area polygons (PostGIS); holiday calendars; working hours.

## E04 — Merchant Lifecycle

### F04.01 Merchant onboarding (KYC/KYB)

- Priority: P0
- Dependencies: F02.x, F03.x
- Complexity: L
- Sprint: S6–S7
- Risks: Provider integration timelines.
- AC: Self-serve sign-up; document upload; KYC provider integrated; statuses; audit.

### F04.02 Contracts & rate card binding

- Priority: P0
- Dependencies: F04.01, F08.01
- Complexity: M
- Sprint: S7
- Risks: Versioning conflicts.
- AC: Contract entity with valid-from/to; rate card linked; effective on shipments.

### F04.03 Merchant portal MVP

- Priority: P0
- Dependencies: F04.01, F07.x
- Complexity: L
- Sprint: S7–S9
- Risks: Scope creep.
- AC: Create shipment, track, see invoices/COD; team management; webhooks/API keys.

### F04.04 Marketplace integrations (Shopify/Woo first)

- Priority: P1
- Dependencies: F04.03
- Complexity: L
- Sprint: S10–S12
- Risks: API rate limits; OAuth scopes.
- AC: OAuth connect; order sync; label generation; status push back; resilient retries.

### F04.05 ERP integrations (SAP/Oracle/NetSuite)

- Priority: P2
- Dependencies: F16.x
- Complexity: XL
- Sprint: S18–S22
- Risks: Customer-specific customization.
- AC: GL exports; invoice sync; reconciliation reports.

## E05 — Customer & Address

### F05.01 Customer profile & address book

- Priority: P0
- Dependencies: F02.x
- Complexity: M
- Sprint: S5–S6
- AC: CRUD; consent capture; PII minimization; merge dedupe.

### F05.02 Public tracking identity (guest)

- Priority: P0
- Dependencies: F14.01
- Complexity: S
- Sprint: S6
- AC: Track by AWB + phone/email; OTP gate for sensitive actions.

### F05.03 Customer portal MVP

- Priority: P1
- Dependencies: F05.01, F14.x
- Complexity: M
- Sprint: S9–S11
- AC: Track, manage shipments, file ticket, manage profile/security.

## E06 — Network: Branches, Warehouses, Fleet

### F06.01 Branches & service areas

- Priority: P0
- Dependencies: F03.03
- Complexity: M
- Sprint: S5
- AC: Branch CRUD; polygon editor; capacity; staff roster references.

### F06.02 Warehouse layouts (zones/aisles/bins/docks)

- Priority: P1
- Dependencies: F03.03
- Complexity: L
- Sprint: S8–S10
- AC: Hierarchical layouts; dock board; equipment; throughput baseline.

### F06.03 Fleet & vehicles

- Priority: P0
- Dependencies: F03.03
- Complexity: M
- Sprint: S6
- AC: Vehicle CRUD; insurance/maintenance windows; capacity; OOS workflow.

### F06.04 Telematics ingest

- Priority: P1
- Dependencies: F06.03
- Complexity: L
- Sprint: S10–S11
- Risks: Provider variance.
- AC: At least 1 telematics provider integrated; live position updates; alerts on geofence.

## E07 — Shipment Lifecycle

### F07.01 AWB allocator + shipment create (single)

- Priority: P0
- Dependencies: F02.x, F03.x, F08.01
- Complexity: L
- Sprint: S6–S7
- Risks: Uniqueness at scale.
- AC: AWB unique; create within 1 s P95; events emitted; idempotency supported.

### F07.02 Multi-piece shipments and addons

- Priority: P0
- Dependencies: F07.01
- Complexity: M
- Sprint: S7
- AC: Multiple pieces with dims/weight; addons (insurance, signature); rules enforced.

### F07.03 Label and manifest generation

- Priority: P0
- Dependencies: F07.01, Document service
- Complexity: M
- Sprint: S7–S8
- AC: PDF/ZPL labels; manifests; barcode validated; throughput meets peak target.

### F07.04 Bulk shipment import

- Priority: P0
- Dependencies: F07.01, F04.03
- Complexity: M
- Sprint: S8–S9
- AC: CSV/XLSX upload, mapper, validation report, async processing, partial success handling.

### F07.05 Holds, redirects, cancellations

- Priority: P0
- Dependencies: F07.01
- Complexity: M
- Sprint: S9
- AC: State machine enforced; events emitted; audit trail.

## E08 — Pricing & Rating

### F08.01 Rate card model + simulator

- Priority: P0
- Dependencies: F03.x
- Complexity: L
- Sprint: S5–S6
- AC: Zone × weight breaks; surcharges; FX; preview tool.

### F08.02 Pricing engine quote API

- Priority: P0
- Dependencies: F08.01
- Complexity: M
- Sprint: S6–S7
- AC: P95 < 500 ms; deterministic; explainable line items.

### F08.03 Promotions/discounts

- Priority: P2
- Dependencies: F08.01
- Complexity: M
- Sprint: S14–S15
- AC: Coupon codes; eligibility rules; abuse controls.

### F08.04 Tax rules (per country) + e-invoicing readiness

- Priority: P1
- Dependencies: F08.01
- Complexity: L
- Sprint: S12–S14
- AC: Per-country tax engine; receipts compliant; ZATCA readiness in MEA.

## E09 — Pickup & Dispatch

### F09.01 Pickup request scheduling

- Priority: P0
- Dependencies: F07.x
- Complexity: M
- Sprint: S8
- AC: Windows; per-merchant rules; recurring pickups; SLAs.

### F09.02 Dispatch board (manual + assist)

- Priority: P0
- Dependencies: F09.01, F06.03
- Complexity: L
- Sprint: S8–S10
- AC: Drag-and-drop assignment; capacity bars; publish to drivers.

### F09.03 Routing v1 (heuristic)

- Priority: P0
- Dependencies: F09.02
- Complexity: L
- Sprint: S9–S10
- AC: Multi-stop sequencing; honors HOS; produces ETAs.

### F09.04 Routing v2 (VRP/VRPTW with constraints)

- Priority: P1
- Dependencies: F09.03, F19.02
- Complexity: XL
- Sprint: S14–S18
- Risks: Solver tuning at scale.
- AC: 500-stop optimize < 30 s; A/B vs v1 shows uplift.

### F09.05 Pickup attempts and POP

- Priority: P0
- Dependencies: F09.01
- Complexity: M
- Sprint: S9
- AC: Reasons captured; photo/signature; re-attempt rules per merchant.

## E10 — Last-Mile Delivery & POD

### F10.01 OFD lifecycle and stop list

- Priority: P0
- Dependencies: F09.x
- Complexity: L
- Sprint: S10–S11
- AC: Stops generated; live status; reorder allowed under policy.

### F10.02 POD capture (signature, photo, OTP, ID)

- Priority: P0
- Dependencies: F10.01, Document service
- Complexity: L
- Sprint: S10–S12
- AC: All POD types supported; quality gates; storage signed; events emitted.

### F10.03 Failed delivery flows (reschedule, redirect, hold, RTO)

- Priority: P0
- Dependencies: F10.02
- Complexity: L
- Sprint: S11–S12
- AC: Customer choices honored; SLAs; max-attempts policy.

### F10.04 High-value & age-restricted handling

- Priority: P1
- Dependencies: F10.02
- Complexity: M
- Sprint: S15
- AC: ID match flagged; mandatory photo; audit per attempt.

## E11 — Warehouse Operations

### F11.01 Inbound receiving + reconciliation

- Priority: P0
- Dependencies: F06.02
- Complexity: L
- Sprint: S10–S11
- AC: ASN-driven; dock assignment; scan-in; exceptions logged.

### F11.02 Sortation (manual + lightweight automation)

- Priority: P0
- Dependencies: F11.01
- Complexity: L
- Sprint: S11–S12
- AC: Sort decisions before cut-off; mis-sort flagging; throughput dashboard.

### F11.03 Outbound staging and load planning

- Priority: P0
- Dependencies: F11.02
- Complexity: M
- Sprint: S12
- AC: Cages/pallets staged; load weight/volume respected; manifests generated.

### F11.04 Hold-at-branch & customer pickup

- Priority: P1
- Dependencies: F11.03, F10.x
- Complexity: M
- Sprint: S13
- AC: Aging tracked; OTP-based release; expiry handling.

### F11.05 Stock-take & inventory accuracy

- Priority: P2
- Dependencies: F11.01
- Complexity: M
- Sprint: S16
- AC: Cycle counts; variance reports; audit trail.

## E12 — Linehaul / Transfer

### F12.01 Trip planning & sealing

- Priority: P0
- Dependencies: F11.03, F06.04
- Complexity: L
- Sprint: S12–S13
- AC: Manifest sealed; seal verified at destination.

### F12.02 In-transit telemetry & ETA

- Priority: P1
- Dependencies: F12.01, F19.02
- Complexity: L
- Sprint: S13–S14
- AC: Live positions; predictive ETAs; delay alerts.

### F12.03 Multi-leg routing & handoffs

- Priority: P1
- Dependencies: F12.01
- Complexity: L
- Sprint: S15–S16
- AC: Hub-to-hub handovers tracked; SLA per leg.

## E13 — Returns & Reverse Logistics

### F13.01 Return initiation (RTO/RTS/customer-return)

- Priority: P0
- Dependencies: F10.x
- Complexity: M
- Sprint: S12
- AC: Reverse AWB; pickup scheduled; events emitted.

### F13.02 QC inspection & grading

- Priority: P1
- Dependencies: F13.01, F11.x
- Complexity: M
- Sprint: S14
- AC: Photos + checklist; grade A/B/C/D; restock/dispose paths.

### F13.03 Exchanges (drop-and-pick)

- Priority: P2
- Dependencies: F13.01
- Complexity: M
- Sprint: S17
- AC: Single visit; reconciled both directions.

## E14 — Tracking & Notifications

### F14.01 Tracking event ingest & projection

- Priority: P0
- Dependencies: F01.04, F07.x
- Complexity: L
- Sprint: S6–S7
- AC: 100k events/sec capacity by S20; ingest-to-page lag < 1 s P95.

### F14.02 Public tracking page (white-label)

- Priority: P0
- Dependencies: F14.01
- Complexity: M
- Sprint: S8–S9
- AC: AWB lookup; timeline; ETA; recipient actions; WCAG 2.2 AA.

### F14.03 Multi-channel notifications (SMS/Email/Push/WA)

- Priority: P0
- Dependencies: F14.01
- Complexity: L
- Sprint: S7–S9
- Risks: Provider failover, regulatory windows.
- AC: Cascade rules; opt-out; templates per locale; ≥ 99.9% delivery success.

### F14.04 Webhooks (outbound)

- Priority: P0
- Dependencies: F14.01
- Complexity: M
- Sprint: S9–S10
- AC: HMAC signed; retries 24h; replay; per-endpoint stats.

### F14.05 Voice/IVR notifications (failed delivery)

- Priority: P2
- Dependencies: F14.03
- Complexity: M
- Sprint: S18
- AC: Provider integrated; A/B vs SMS shows uplift in re-attempt success.

## E15 — COD & Payments

### F15.01 COD collection (cash + digital)

- Priority: P0
- Dependencies: F10.x, PSP
- Complexity: L
- Sprint: S11–S13
- Risks: PSP onboarding.
- AC: Cash, POS, wallet, link channels; idempotent capture; reconciliation hooks.

### F15.02 Driver cash session & cash-up

- Priority: P0
- Dependencies: F15.01
- Complexity: M
- Sprint: S12
- AC: Variances flagged; deposit slip; auditable.

### F15.03 Branch deposit & bank reconciliation

- Priority: P0
- Dependencies: F15.02
- Complexity: L
- Sprint: S13–S14
- AC: Bank statements imported; matched; exceptions actioned.

## E16 — Finance & Settlements

### F16.01 Invoicing & merchant statements

- Priority: P0
- Dependencies: F08.x, F15.x
- Complexity: L
- Sprint: S13–S15
- AC: Periodic invoices; line-itemized; tax compliant; statements signed.

### F16.02 Settlement engine & payouts

- Priority: P0
- Dependencies: F15.03, F16.01
- Complexity: L
- Sprint: S14–S16
- AC: Configurable cycles; deductions; bank/wallet payouts; failure handling.

### F16.03 Driver payroll & contractor payouts

- Priority: P1
- Dependencies: HR, Finance
- Complexity: L
- Sprint: S17–S18
- AC: Hours/incentives; tax-compliant; reconciliations.

### F16.04 GL export & ERP integrations

- Priority: P1
- Dependencies: F16.01
- Complexity: L
- Sprint: S18–S20
- AC: Mappings to ERP; nightly export; reconciliation reports.

## E17 — CRM & Support

### F17.01 Ticketing & SLAs

- Priority: P0
- Dependencies: F02.x
- Complexity: L
- Sprint: S10–S12
- AC: Queues, priorities, SLA timers; macros; KB.

### F17.02 Omnichannel inbox (email/chat/voice)

- Priority: P1
- Dependencies: F17.01, telephony
- Complexity: L
- Sprint: S13–S15
- AC: Unified threads; recording; transfer; quality scoring.

### F17.03 NPS/CSAT and quality monitoring

- Priority: P2
- Dependencies: F17.01
- Complexity: M
- Sprint: S16
- AC: Survey delivery; reporting; agent scorecards.

## E18 — Analytics & Reporting

### F18.01 Real-time KPI projections

- Priority: P0
- Dependencies: F14.01
- Complexity: L
- Sprint: S9–S11
- AC: OTD, FASR, lag, exceptions; freshness ≤ 1 min.

### F18.02 Operational dashboards (per portal)

- Priority: P0
- Dependencies: F18.01
- Complexity: L
- Sprint: S10–S12
- AC: Drill-down; saved views; export.

### F18.03 Scheduled reports & data exports

- Priority: P1
- Dependencies: F18.01
- Complexity: M
- Sprint: S13
- AC: Email/secure pickup; signed PDFs; CSV/Parquet.

### F18.04 Lakehouse & BI marts

- Priority: P1
- Dependencies: F01.07
- Complexity: L
- Sprint: S14–S16
- AC: Bronze/silver/gold; dbt models; data contracts.

## E19 — AI / ML Platform

### F19.01 ML platform foundations

- Priority: P1
- Dependencies: F01.07
- Complexity: L
- Sprint: S10–S12
- AC: Model registry; feature store; serving; monitoring; governance.

### F19.02 ETA prediction v1

- Priority: P1
- Dependencies: F14.01, F19.01
- Complexity: L
- Sprint: S11–S13
- AC: MAE improves vs heuristic by ≥ 20%; calibrated intervals.

### F19.03 Address normalization & geocoding

- Priority: P1
- Dependencies: F19.01
- Complexity: L
- Sprint: S12–S14
- AC: Failure-on-arrival rate due to address reduced ≥ 30%.

### F19.04 Delay prediction & proactive notifications

- Priority: P2
- Dependencies: F19.02, F14.03
- Complexity: M
- Sprint: S15–S16
- AC: Reduction in unplanned breaches; quality ≥ targeted precision/recall.

### F19.05 Fraud & anomaly detection

- Priority: P2
- Dependencies: F19.01
- Complexity: L
- Sprint: S16–S18
- AC: Loss reduction; FP rate < threshold; HITL appeal flow.

### F19.06 Demand forecasting

- Priority: P2
- Dependencies: F18.04
- Complexity: L
- Sprint: S17–S19
- AC: WAPE within target; staffing/fleet integration.

### F19.07 AI support agent (assist → autonomy)

- Priority: P2
- Dependencies: F17.x
- Complexity: XL
- Sprint: S16–S22
- AC: Containment ≥ baseline lift; safe scopes only; audit.

### F19.08 Vision AI (damage, dimensions, POD verification)

- Priority: P3
- Dependencies: F11.x, F19.01
- Complexity: L
- Sprint: S22+
- AC: Pilot on 1–2 hubs; quality gates; ROI captured.

## E20 — International Expansion & Partners

### F20.01 Multi-currency & FX

- Priority: P1
- Dependencies: F08.x, F16.x
- Complexity: L
- Sprint: S14–S15
- AC: Daily FX snapshots; per-tenant base currency; settlements in chosen currency.

### F20.02 Customs & cross-border (CN22/CN23, HS, sanctions)

- Priority: P1
- Dependencies: F07.x, Compliance
- Complexity: XL
- Sprint: S18–S22
- AC: Declarations; sanctions screening; broker workflow.

### F20.03 Partner carrier handover

- Priority: P2
- Dependencies: F14.01
- Complexity: L
- Sprint: S20–S22
- AC: ≥ 1 partner integrated end-to-end; tracking interleaved.

### F20.04 Data residency cells

- Priority: P1
- Dependencies: F01.x
- Complexity: XL
- Sprint: S20–S24
- AC: Country-pinned clusters; lawful cross-region replication; tested.

---

# 4. User Story Breakdown (per major feature)

> Pattern: As a `<role>`, I want `<action>`, so that `<value>`. Each story carries acceptance criteria.

## F02.02 — AuthN

- **US-AUTH-01**: As a user, I want to sign in with email + password, so that I can access my portal.
  - AC: Lockout after 5 failures; localized errors; audit logged; throttled.
- **US-AUTH-02**: As a user, I want to register a passkey, so that I can sign in without a password.
  - AC: WebAuthn supported on modern browsers; recovery via verified email; passkey listed in security center.
- **US-AUTH-03**: As an admin, I want to enforce MFA for staff roles, so that we meet compliance.
  - AC: Policy toggle by role; non-compliant users blocked at login with remediation flow.

## F02.03 — AuthZ

- **US-AUTHZ-01**: As a Branch Manager, I want to manage shipments only in my branch, so that I cannot affect other branches.
  - AC: ABAC scope `branch_id` enforced at API and DB (RLS).
- **US-AUTHZ-02**: As a Finance Officer, I cannot approve a settlement I created, so that SoD is enforced.
  - AC: Policy denies same-actor approval; UI hides approve action; audit verified.

## F03.02 — Feature Flags

- **US-FF-01**: As a PM, I want to roll out a feature to 10% of merchants, so I can validate impact.
  - AC: Targeting rules; SDKs in web/mobile/services; audited changes.

## F04.01 — Merchant Onboarding

- **US-MERCH-01**: As a merchant owner, I want to register and submit KYC, so that I can start shipping.
  - AC: Sign-up; document upload; KYC provider flows; status page; notification on approval.
- **US-MERCH-02**: As an admin, I want to approve/reject KYC, so we control risk.
  - AC: Approval workflow; reasons captured; audit; notifications.

## F07.01 — Shipment Create

- **US-SHIP-01**: As a merchant operator, I want to create a single shipment, so I can ship an order.
  - AC: Validations (address, denied parties); quote returned; AWB issued; label downloadable.
- **US-SHIP-02**: As an API client, I want idempotent creation, so retries do not duplicate.
  - AC: `Idempotency-Key` honored; same key returns prior result for 24h.

## F07.04 — Bulk Import

- **US-BULK-01**: As a merchant, I want to import 5,000 orders via CSV, so I can ship a campaign.
  - AC: Upload, mapping, validation report, async processing, partial-success summary, label batch downloadable.

## F09.05 — Pickup Attempts and POP

- **US-PICK-01**: As a driver, I want to capture POP (signature, photo, geo), so the pickup is auditable.
  - AC: Required fields per merchant policy; offline capture; sync on reconnect; events emitted.

## F10.01–F10.03 — Delivery / POD / Failed

- **US-DEL-01**: As a driver, I want to capture POD (signature/photo/OTP) per merchant rules, so the delivery is valid.
  - AC: Quality gates; geofence verification; events; PII redacted in logs.
- **US-DEL-02**: As a customer, I want to reschedule a failed delivery, so I receive my parcel at a convenient time.
  - AC: Notification with options; valid windows; re-routing; confirmation.

## F11.01–F11.02 — Inbound + Sortation

- **US-WH-01**: As a receiver, I want to scan in inbound parcels with reconciliation, so we detect over/short/damage.
  - AC: ASN matching; exception flow; photos for damage; events.
- **US-WH-02**: As a sorter, I want to be guided to the correct bin, so mis-sorts are minimized.
  - AC: Bin assignment shown on handheld; mis-sort alarms; throughput reported.

## F12.01 — Linehaul Trip

- **US-LH-01**: As a warehouse manager, I want to seal a trip with a manifest, so chain-of-custody is enforced.
  - AC: Seal number captured; manifest generated; mismatch raises security incident.

## F13.01–F13.02 — Returns

- **US-RET-01**: As a customer, I want to initiate a return, so I can return an item.
  - AC: Reverse AWB; pickup window; status visible.
- **US-RET-02**: As a QC inspector, I want to grade returned items, so merchants receive accurate dispositions.
  - AC: Photo + checklist; grade saved; events emitted.

## F14.02 — Public Tracking

- **US-TRK-01**: As a customer, I want a clear timeline and ETA, so I know when to expect my parcel.
  - AC: WCAG 2.2 AA; localized; mobile-first; PWA cache.

## F14.03 — Notifications

- **US-NTF-01**: As a customer, I want SMS/email/WA alerts for key events, so I stay informed.
  - AC: Cascade rules; opt-out; localized; quiet-hours respected.

## F15.01 — COD Collection

- **US-COD-01**: As a driver, I want to collect COD via cash or card link, so customers can pay.
  - AC: Channels supported; idempotent; receipts; audit; offline cash supported.

## F16.02 — Settlement

- **US-SET-01**: As finance, I want to generate weekly settlements per merchant, so payouts are timely.
  - AC: Configurable cycles; deductions; approvals; bank/wallet integration; statement.

## F17.01 — Tickets

- **US-TKT-01**: As a customer, I want to file a complaint about a delivery, so it gets resolved.
  - AC: Submission; SLA timer; updates; resolution; CSAT survey.

## F18.01–F18.02 — KPIs / Dashboards

- **US-KPI-01**: As a country manager, I want to see OTD, exceptions, and SLA breaches by region, so I can act.
  - AC: Live tiles; drill-down; export; alerts on threshold.

## F19.02 — ETA Prediction

- **US-ETA-01**: As an ops manager, I want predicted ETAs with confidence, so I can manage SLA risk.
  - AC: Shadow vs heuristic for 4 weeks; promote when MAE ≥ 20% better; calibration verified.

## F19.07 — AI Support Agent

- **US-AGENT-01**: As a customer, I want to self-serve common questions, so I do not wait for an agent.
  - AC: RAG over KB; bounded tool-use; confidence threshold; HITL handoff; audit trail.

> Note: a complete user story map is maintained in the backlog tool (Jira/ADO). The above is a representative cross-section.

---

# 5. Sprint Planning

## 5.1 Cadence

- **2-week sprints**; quarter = ~6 sprints.
- Ceremonies: Refinement (mid-sprint), Sprint Planning (Mon Day 1), Daily standups (15 min), Sprint Review (Day 10 AM), Retrospective (Day 10 PM).

## 5.2 Definition of Ready (DoR)

- Story has clear AC, dependencies identified, design or wireframes attached if UI, contracts/schema decisions noted, observability plan, security considerations.

## 5.3 Definition of Done (DoD)

- AC met; unit + integration + contract tests; static analysis & security scans clean; observability added; docs updated; deployed to staging behind flag where applicable; canary metrics healthy; release notes drafted.

## 5.4 Velocity & Capacity

- Track per squad; reserve 20% capacity for tech debt and incidents; 10% for unknowns; on-call rotation accounts for reduced focus.

## 5.5 Risk Management

- Risks logged per story; mitigations tracked; SEV classification for incidents; weekly risk review across program.

---

# 6. Development Roadmap (12 Quarters)

| Quarter | Theme            | Outcomes                                                                                                                     |
| ------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Q1      | Foundation       | Cloud, K8s, mesh, IAM, observability, GitOps, audit; design system v1; mobile shell                                          |
| Q2      | Core Domain      | Shipment create/label/track; pricing; merchant portal MVP; driver app pickup/delivery basics; public tracking; notifications |
| Q3      | Operations       | Dispatch board; pickup/delivery flows; warehouse inbound/outbound; COD collection; finance basics; KPIs v1                   |
| Q4      | Growth I         | Routing v2 (VRPTW); returns; settlements; ERP/marketplace integrations; CRM v1; AI ETA & address                             |
| Q5      | Growth II        | Linehaul; sortation automation; voice/IVR; AI delay prediction; fraud v1; advanced analytics                                 |
| Q6      | Enterprise I     | Multi-tenant white-label; SOC 2 Type I; tax engine; AI support agent (assist); demand forecasting                            |
| Q7      | Enterprise II    | Customs & cross-border v1; multi-currency; payouts; tax e-invoicing; partner carrier integrations v1                         |
| Q8      | Scale            | Cell-based per country; performance hardening; chaos GameDays; capacity for 1M shipments/day                                 |
| Q9      | International I  | New region rollout (e.g., MEA→EU); residency cells; localizations; bank integrations                                         |
| Q10     | International II | Asia/NA expansion options; advanced AI (vision, autonomy scopes); marketplace for 3PL bidding                                |
| Q11     | Differentiation  | Carbon, lockers/PUDO, embedded finance pilots; SOC 2 Type II; ISO 27001                                                      |
| Q12     | Innovation       | Drone/AV pilots; advanced AI agents; AR sortation pilots; marketplace expansion                                              |

---

# 7. Frontend Implementation Plan (Next.js)

## 7.1 Phasing

- **Phase 1 (Q1)**: Design system v1, Auth flows, Merchant + Customer + Public Tracking shell, Admin shell.
- **Phase 2 (Q2)**: Create/manage shipments, public tracking timeline, notifications inbox, merchant onboarding wizard, basic admin pages.
- **Phase 3 (Q3)**: Dispatch board, internal ops, warehouse screens, finance/COD merchant views, KPIs.
- **Phase 4 (Q4–Q5)**: AI-powered surfaces (insights, recommendations), advanced filters/saved views, accessibility certification.
- **Phase 5 (Q6+)**: White-label theming, developer portal, marketplace, BI exploration UIs.

## 7.2 Workstreams

- Tokens & primitives, charts, maps, logistics widgets, RTL/i18n, motion, a11y testing pipeline.
- Server-component vs client-component patterns codified in ADRs.
- Edge vs Node runtime decisions per route.

## 7.3 Quality Gates

- WCAG 2.2 AA via axe + manual; LCP < 2.5 s on 4G mid-tier; CLS < 0.1; INP < 200 ms; bundle budgets per app.

---

# 8. Mobile Implementation Plan (Flutter)

## 8.1 Phasing

- **Phase 1 (Q1)**: Auth, shift, route view, basic stop/POD/scan, offline scaffolding, telemetry.
- **Phase 2 (Q2)**: Pickup/delivery full flows, POD types, COD basics, messaging, incidents.
- **Phase 3 (Q3)**: Cash-up & deposit, performance KPIs, MDM compliance, deep links.
- **Phase 4 (Q4)**: Voice prompts (assist), advanced offline, route adherence checks, telematics overlays.
- **Phase 5 (Q5+)**: Vision-assisted POD, multilingual recognition, accessibility upgrades, large-screen support (tablet handheld).

## 8.2 Quality Gates

- Cold start < 2 s on mid-tier; crash-free sessions ≥ 99.5%; battery drain budget ≤ 8% per shift; accessibility audited.

## 8.3 Release Plan

- Phased store rollout (5% → 25% → 100%); kill switches; in-app force-update for critical fixes.

---

# 9. Backend Implementation Plan

## 9.1 Service Bring-up Order

1. **Q1 (S1–S6)**: IAM, User, Tenant/Config, Audit, Document, Geo, Notification, Tracking, Merchant, Customer, Pricing, Shipment.
2. **Q2 (S7–S12)**: Pickup, Dispatch, Routing v1, Delivery, Branch, Warehouse, Fleet, Returns, COD.
3. **Q3 (S13–S18)**: Finance, CRM, Search, Webhooks, Analytics, Reporting; Routing v2; AI Inference.
4. **Q4 (S19–S24)**: Integration platform expansion (ERP/Marketplaces), Customs, Partner carriers, Data residency.

## 9.2 Cross-Service Concerns

- Outbox/Inbox templates; standard libs for event envelope; testing harnesses.
- Contract-first development (OpenAPI/AsyncAPI/Proto in `packages/contracts`).
- Common observability and security middleware.

---

# 10. Database Implementation Plan

## 10.1 Phases

- **Q1**: Per-service schemas; RLS; baseline indexes; PostGIS enabled; outbox tables.
- **Q2**: Partitioning for `shipments`, `tracking_events`; logical replication for analytics; backups.
- **Q3**: Read replicas per region; pg_partman; archiving to object storage; data dictionary.
- **Q4+**: Cross-region replicas; tenant-pinned clusters; HSM-backed BYOK for premium tenants.

## 10.2 Standards

- Migration tool (Flyway/Liquibase) versioned; backward-compatible migrations; expand-migrate-contract; documented rollback.
- Performance review per schema (EXPLAIN, pg_stat_statements) before GA.

---

# 11. Infrastructure Implementation Plan

## 11.1 Phases

- **Q1**: Landing zones, K8s, mesh, GitOps, observability, secrets, WAF/CDN, base IaC modules, IAM.
- **Q2**: Kafka, OpenSearch, Redis, object storage, PostgreSQL, ClickHouse (analytics), data pipelines, CDC.
- **Q3**: Multi-AZ HA validated; chaos GameDays; cost dashboards; FinOps reviews.
- **Q4**: Multi-region readiness; DR drills; cell templates per country.

## 11.2 IaC Standards

- Terraform modules versioned; per-environment workspaces; drift detection; policy-as-code (OPA/Conftest).
- Helm charts per service; Kustomize overlays per env; progressive delivery via Argo Rollouts.

---

# 12. CI/CD Implementation Plan

## 12.1 Phases

- **Q1**: Monorepo CI with caching; lint/type/unit/contract; SBOM + signing; ArgoCD; canary rollouts.
- **Q2**: E2E pipelines for web (Playwright) and mobile (Patrol); ephemeral preview envs per PR; performance smoke tests.
- **Q3**: Production canary with auto-rollback; chaos jobs; release-train automation; SBOM attestations.
- **Q4**: SLSA-3 build provenance; supply chain hardening; compliance pipelines for SOC 2 evidence collection.

## 12.2 Pipelines

- **Pipeline P1 — Service**: lint → test → build → scan → contract → integration → deploy(dev) → e2e → deploy(staging) → canary(prod) → full.
- **Pipeline P2 — Web App**: lint → typecheck → test → build → a11y → visual reg → deploy preview → deploy(staging) → canary(prod).
- **Pipeline P3 — Mobile**: build → unit → integration → e2e (device farm) → publish internal → phased store rollout.
- **Pipeline P4 — Infra**: validate → plan → policy check → apply (manual gate prod).
- **Pipeline P5 — Data**: dbt build → tests → publish to marts.

---

# 13. Security Implementation Plan

## 13.1 Phases

- **Q1**: SDLC baseline (SAST/DAST/SCA), threat modeling per service, secret scanning, image signing, mesh mTLS, WAF, MFA.
- **Q2**: PCI-DSS scoping, PII classification rollout, DLP, SIEM, runtime security (Falco), penetration test #1.
- **Q3**: SOC 2 Type I prep; bug bounty launch; incident response drills; access reviews automated.
- **Q4**: ISO 27001 prep; data residency controls; BYOK for tenants; SOC 2 Type II window opens.

## 13.2 Compliance Calendar

- GDPR/PDPL/CCPA inventories per quarter; DPIAs for new flows; vendor reviews; SCCs/IDTAs maintained.
- ZATCA/e-invoicing readiness in MEA before commercial launch in KSA.

---

# 14. Testing Implementation Plan

## 14.1 Test Pyramid Targets

- Unit ≥ 80% coverage; Integration ≥ 60%; Contract for every internal/external API; E2E for top 30 user journeys.
- Property-based tests for pricing, sortation, routing.
- Mutation testing on core domains quarterly.

## 14.2 Pipelines

- PR pipelines: lint, type, unit, contract, lightweight integration.
- Nightly: full integration, E2E, performance smoke.
- Weekly: security DAST, fuzz tests on parsers, accessibility audits.
- Pre-release: chaos drills, DR drill (quarterly).

## 14.3 Tooling

- Web: Playwright + axe + Storybook + Chromatic.
- Mobile: Patrol + integration_test + Firebase Test Lab/AWS Device Farm.
- Backend: JUnit/Kotest, Testcontainers, Pact, k6/Locust, ZAP.
- Data: dbt tests, Great Expectations, schema registry compatibility checks.

---

# 15. Documentation Plan

## 15.1 Streams

- **Engineering docs**: per-service README, runbooks, ADRs, threat models, on-call playbooks.
- **API docs**: Auto-generated from OpenAPI/AsyncAPI; published to developer portal; versioned.
- **Architecture docs**: C4 diagrams (Structurizr), high-level overviews, target/transition states.
- **Data docs**: Data dictionary, lineage, retention/PII tags.
- **Operational docs**: SLOs, error budgets, dashboards index, alert catalog.
- **Customer-facing docs**: KB articles, integration guides, SDK references.

## 15.2 Authoring Cadence

- Each story includes a "docs" subtask if applicable.
- Quarterly doc review with owners; freshness < 90 days for critical pages.

---

# 16. Product Backlog (master, ordered by execution sequence)

> The complete backlog lives in the project tool. Here is an ordered, sprint-grouped slice that traces every epic.

| Order | ID     | Title                                  | Epic | Pri | Comp | Sprint  |
| ----- | ------ | -------------------------------------- | ---- | --- | ---- | ------- |
| 1     | F01.01 | Cloud landing zones                    | E01  | P0  | XL   | S1–S2   |
| 2     | F01.05 | Secrets & KMS baseline                 | E01  | P0  | M    | S2      |
| 3     | F01.02 | K8s + mesh                             | E01  | P0  | XL   | S2–S3   |
| 4     | F01.03 | GitOps + rollouts                      | E01  | P0  | L    | S3      |
| 5     | F01.04 | Observability stack                    | E01  | P0  | L    | S3–S4   |
| 6     | F01.06 | Security guardrails                    | E01  | P0  | L    | S3–S4   |
| 7     | F02.01 | IAM skeleton                           | E02  | P0  | M    | S3      |
| 8     | F02.05 | Service identity / mTLS automation     | E02  | P0  | M    | S4      |
| 9     | F02.02 | AuthN                                  | E02  | P0  | L    | S4–S5   |
| 10    | F03.01 | Tenant model & RLS                     | E03  | P0  | L    | S4–S5   |
| 11    | F03.02 | Feature flags                          | E03  | P0  | M    | S4      |
| 12    | F02.03 | AuthZ (RBAC+ABAC+OPA)                  | E02  | P0  | L    | S5–S6   |
| 13    | F02.06 | Audit log                              | E02  | P0  | M    | S5      |
| 14    | F03.03 | Country/region/branch                  | E03  | P0  | M    | S5      |
| 15    | F08.01 | Rate card model                        | E08  | P0  | L    | S5–S6   |
| 16    | F05.01 | Customer profile/address               | E05  | P0  | M    | S5–S6   |
| 17    | F08.02 | Pricing engine quote                   | E08  | P0  | M    | S6–S7   |
| 18    | F07.01 | AWB allocator + create shipment        | E07  | P0  | L    | S6–S7   |
| 19    | F14.01 | Tracking ingest + projection           | E14  | P0  | L    | S6–S7   |
| 20    | F05.02 | Public tracking identity               | E05  | P0  | S    | S6      |
| 21    | F06.01 | Branches & service areas               | E06  | P0  | M    | S5      |
| 22    | F06.03 | Fleet & vehicles                       | E06  | P0  | M    | S6      |
| 23    | F07.02 | Multi-piece + addons                   | E07  | P0  | M    | S7      |
| 24    | F04.01 | Merchant onboarding/KYC                | E04  | P0  | L    | S6–S7   |
| 25    | F04.02 | Contracts & rate card binding          | E04  | P0  | M    | S7      |
| 26    | F07.03 | Label/manifest generation              | E07  | P0  | M    | S7–S8   |
| 27    | F14.03 | Notifications (SMS/Email/Push/WA)      | E14  | P0  | L    | S7–S9   |
| 28    | F02.04 | SSO (OIDC+SAML)                        | E02  | P1  | M    | S7–S8   |
| 29    | F04.03 | Merchant portal MVP                    | E04  | P0  | L    | S7–S9   |
| 30    | F09.01 | Pickup scheduling                      | E09  | P0  | M    | S8      |
| 31    | F14.02 | Public tracking page                   | E14  | P0  | M    | S8–S9   |
| 32    | F07.04 | Bulk shipment import                   | E07  | P0  | M    | S8–S9   |
| 33    | F09.02 | Dispatch board                         | E09  | P0  | L    | S8–S10  |
| 34    | F06.02 | Warehouse layouts                      | E06  | P1  | L    | S8–S10  |
| 35    | F09.03 | Routing v1                             | E09  | P0  | L    | S9–S10  |
| 36    | F09.05 | Pickup attempts/POP                    | E09  | P0  | M    | S9      |
| 37    | F07.05 | Holds/redirects/cancellations          | E07  | P0  | M    | S9      |
| 38    | F14.04 | Webhooks (outbound)                    | E14  | P0  | M    | S9–S10  |
| 39    | F18.01 | KPI projections (real-time)            | E18  | P0  | L    | S9–S11  |
| 40    | F05.03 | Customer portal MVP                    | E05  | P1  | M    | S9–S11  |
| 41    | F11.01 | Inbound receiving + reconciliation     | E11  | P0  | L    | S10–S11 |
| 42    | F10.01 | OFD + stop list                        | E10  | P0  | L    | S10–S11 |
| 43    | F10.02 | POD capture                            | E10  | P0  | L    | S10–S12 |
| 44    | F06.04 | Telematics ingest                      | E06  | P1  | L    | S10–S11 |
| 45    | F18.02 | Operational dashboards                 | E18  | P0  | L    | S10–S12 |
| 46    | F19.01 | ML platform foundations                | E19  | P1  | L    | S10–S12 |
| 47    | F17.01 | Ticketing & SLAs                       | E17  | P0  | L    | S10–S12 |
| 48    | F11.02 | Sortation                              | E11  | P0  | L    | S11–S12 |
| 49    | F15.01 | COD collection                         | E15  | P0  | L    | S11–S13 |
| 50    | F19.02 | ETA prediction v1                      | E19  | P1  | L    | S11–S13 |
| 51    | F11.03 | Outbound staging/load planning         | E11  | P0  | M    | S12     |
| 52    | F12.01 | Linehaul trip & sealing                | E12  | P0  | L    | S12–S13 |
| 53    | F13.01 | Returns initiation                     | E13  | P0  | M    | S12     |
| 54    | F10.03 | Failed delivery flows                  | E10  | P0  | L    | S11–S12 |
| 55    | F15.02 | Driver cash session                    | E15  | P0  | M    | S12     |
| 56    | F19.03 | Address normalization                  | E19  | P1  | L    | S12–S14 |
| 57    | F18.03 | Scheduled reports/exports              | E18  | P1  | M    | S13     |
| 58    | F15.03 | Branch/bank reconciliation             | E15  | P0  | L    | S13–S14 |
| 59    | F11.04 | Hold-at-branch                         | E11  | P1  | M    | S13     |
| 60    | F17.02 | Omnichannel inbox                      | E17  | P1  | L    | S13–S15 |
| 61    | F12.02 | In-transit telemetry/ETA               | E12  | P1  | L    | S13–S14 |
| 62    | F08.04 | Tax rules/e-invoicing readiness        | E08  | P1  | L    | S12–S14 |
| 63    | F13.02 | QC inspection/grading                  | E13  | P1  | M    | S14     |
| 64    | F18.04 | Lakehouse/BI marts                     | E18  | P1  | L    | S14–S16 |
| 65    | F16.01 | Invoicing/statements                   | E16  | P0  | L    | S13–S15 |
| 66    | F09.04 | Routing v2 (VRPTW)                     | E09  | P1  | XL   | S14–S18 |
| 67    | F16.02 | Settlement engine/payouts              | E16  | P0  | L    | S14–S16 |
| 68    | F19.04 | Delay prediction                       | E19  | P2  | M    | S15–S16 |
| 69    | F08.03 | Promotions/discounts                   | E08  | P2  | M    | S14–S15 |
| 70    | F20.01 | Multi-currency/FX                      | E20  | P1  | L    | S14–S15 |
| 71    | F17.03 | NPS/CSAT                               | E17  | P2  | M    | S16     |
| 72    | F19.05 | Fraud detection v1                     | E19  | P2  | L    | S16–S18 |
| 73    | F11.05 | Stock-take/inventory                   | E11  | P2  | M    | S16     |
| 74    | F12.03 | Multi-leg routing                      | E12  | P1  | L    | S15–S16 |
| 75    | F16.03 | Driver payroll                         | E16  | P1  | L    | S17–S18 |
| 76    | F19.07 | AI support agent (assist)              | E19  | P2  | XL   | S16–S22 |
| 77    | F19.06 | Demand forecasting                     | E19  | P2  | L    | S17–S19 |
| 78    | F13.03 | Exchanges                              | E13  | P2  | M    | S17     |
| 79    | F14.05 | Voice/IVR notifications                | E14  | P2  | M    | S18     |
| 80    | F16.04 | GL export & ERP integrations           | E16  | P1  | L    | S18–S20 |
| 81    | F04.05 | ERP integrations (SAP/Oracle/NetSuite) | E04  | P2  | XL   | S18–S22 |
| 82    | F20.02 | Customs & cross-border                 | E20  | P1  | XL   | S18–S22 |
| 83    | F20.03 | Partner carrier handover               | E20  | P2  | L    | S20–S22 |
| 84    | F20.04 | Data residency cells                   | E20  | P1  | XL   | S20–S24 |
| 85    | F19.08 | Vision AI pilot                        | E19  | P3  | L    | S22+    |

---

# 17. Sprint Backlog Templates (Examples S1–S8)

Each sprint shows committed items and squad allocation. Velocity assumed; adjust after Sprint 1.

## Sprint 1 (Foundation kickoff)

- Platform: F01.01 (start), F01.05 (start). Owners: Platform.
- IAM/Sec: design ADRs (RBAC/ABAC), threat model template. Owners: Security.
- Frontend: design system v0 (tokens, primitives Button/Input/Select/Tabs), Storybook setup. Owners: Frontend Platform.
- Mobile: shell app, theming, telemetry skeleton. Owners: Mobile.
- Data: data platform RFC; observability standards. Owners: Data.

## Sprint 2

- Platform: F01.01 finish; F01.02 start; F01.05 finish.
- IAM: F02.01 design.
- Frontend: design system v1 batch (Forms, Modal, Drawer, Toast, Table base); a11y testing pipeline.
- Mobile: GoRouter setup, Auth scaffold, OTel/Sentry.
- Data: object storage and data lake skeleton.

## Sprint 3

- Platform: F01.02 finish; F01.03; F01.04 (start); F01.06 (start).
- IAM: F02.01 implement; F02.05 design.
- Frontend: Auth screens (sign-in, MFA, reset).
- Mobile: Auth flows; biometric.
- Data: schema registry and contracts repo; OpenAPI/AsyncAPI bootstrap.

## Sprint 4

- Platform: F01.04 finish; F01.06 finish; F01.07 start.
- IAM: F02.02 build (password + OTP); F02.05 implement.
- Tenant: F03.01 start; F03.02.
- Frontend: User & roles admin scaffolds; tenant switcher; feature flag SDK.
- Mobile: Permissions onboarding; pre-trip checklist UI shell.
- Backend services: scaffolds for Notification, Document, Geo (vendor-tested).

## Sprint 5

- IAM: F02.02 finish (passkey); F02.06 (audit log) finish.
- AuthZ: F02.03 start.
- Tenant: F03.01 finish; F03.03 (geo + branches).
- Pricing: F08.01 (rate cards) start.
- Customer: F05.01 start.
- Frontend: Admin tenant/branch screens; rate card editor v0.
- Mobile: Route map shell; stop detail shell.

## Sprint 6

- AuthZ: F02.03 finish (PDP, policies); SoD policies for finance.
- Pricing: F08.02 start.
- Shipment: F07.01 start; AWB allocator design.
- Tracking: F14.01 start.
- Customer: F05.01 finish; F05.02.
- Fleet: F06.03 finish.
- Frontend: shipment create form (single); tracking page v0.
- Mobile: scanner integration; offline queue scaffold.

## Sprint 7

- Shipment: F07.01 finish; F07.02; F07.03 start.
- Pricing: F08.02 finish.
- Notifications: F14.03 start.
- Merchant: F04.01 build; F04.02; F04.03 start.
- SSO: F02.04 start.
- Frontend: bulk import wizard v0; tracking timeline.
- Mobile: pickup capture flow (POP).

## Sprint 8

- Shipment: F07.03 finish; F07.04 start.
- Pickup: F09.01.
- Tracking: F14.02 start.
- Dispatch: F09.02 start.
- Warehouse: F06.02 start.
- Frontend: dispatch board v0; merchant portal shipments list/detail.
- Mobile: delivery flow shell; POD capture v0; offline writes flush.

> Sprints S9–S24 follow the order in §16 (Product Backlog), respecting dependencies and squad velocity. Sprint backlogs are finalized at sprint planning, drawing from the prioritized backlog with team capacity.

---

# 18. Milestone Plan

| Milestone                      | Date (target) | Scope                                                                                                             | Exit criteria                                                             |
| ------------------------------ | ------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| M0 — Inception complete        | End of Q1     | Foundation, IAM, Tenancy, Audit, Notifications skeleton, Tracking ingest skeleton, Design system v1, Mobile shell | All P0 foundation features done; observability live; secure baseline pass |
| M1 — Closed Beta (single city) | Mid Q2        | Shipment create/label/track; merchant onboarding; pickup; delivery + POD; public tracking; basic finance/COD      | 50 merchant pilots; OTD ≥ 90% in pilot; SLOs healthy 4 weeks              |
| M2 — General Availability v1   | End of Q2     | Marketplace integrations (Shopify/Woo); webhooks; KPIs v1; CRM tickets v1                                         | 500 merchants; ≥ 99.9% API; settlement runs OK 4 cycles                   |
| M3 — Operations Scale          | End of Q3     | Warehouse full; routing v2 alpha; dispatch hardening; finance/settlements end-to-end                              | 10× volume vs M2; warehouse throughput targets met                        |
| M4 — Growth Wave               | End of Q4     | Routing v2 GA; AI ETA + address; CRM omnichannel; tax engine                                                      | KPIs improved measurably; AI ROI verified                                 |
| M5 — Enterprise I              | End of Q5     | White-label readiness; SOC 2 Type I; AI delay prediction; advanced analytics                                      | First enterprise contract signed; controls audited                        |
| M6 — International I           | End of Q6     | Multi-currency; partner carrier integration v1; customs v1                                                        | 1 cross-border lane live; reg compliance verified                         |
| M7 — Scale-out                 | End of Q8     | Cell-based per country; chaos validated; 1M shipments/day capacity                                                | Load test passes target; DR drill < 30 min RTO                            |
| M8 — International II          | End of Q9–Q10 | New regions; full residency; AI autonomy in safe scopes                                                           | New market launched on schedule; tenants onboarded                        |
| M9 — Differentiation           | End of Q11    | Lockers/PUDO, embedded finance pilots; SOC 2 Type II; ISO 27001                                                   | Pilots with proven uptake; certifications attained                        |
| M10 — Innovation               | End of Q12    | Drone/AV pilots; vision-assisted ops; AR sortation pilots                                                         | At least 2 innovation pilots in production with metrics                   |

---

# 19. Team Structure

## 19.1 Pods (Squads)

Each squad: 5–8 engineers (mix of FE/BE/Mobile as needed) + Product Manager + Design partner + QA + EM (shared if small).

- **Platform Pod**: K8s, mesh, observability, GitOps, secrets, CSPM.
- **Security Pod**: AuthN/Z, IAM service, audit, threat model, pen-tests.
- **Identity & Tenancy Pod**: IAM, SSO, RLS, tenant config.
- **Shipment & Pricing Pod**: Shipment, Pricing, Document, Manifest.
- **Tracking & Notifications Pod**: Tracking, Notification, Webhooks, Public tracking page.
- **Field Ops Pod**: Pickup, Dispatch, Driver, Delivery, Mobile Driver app.
- **Warehouse Pod**: Warehouse, Sortation, Inbound/Outbound, Handheld app.
- **Linehaul & Fleet Pod**: Fleet, Linehaul, Telematics.
- **Returns & CRM Pod**: Returns, CRM, Support tooling.
- **Finance Pod**: COD, Finance, Settlements, ERP.
- **Data Platform Pod**: Lakehouse, dbt, schemas, KPIs, reporting.
- **AI Pod**: ML platform, ETA, address, fraud, demand, support agent, vision.
- **Frontend Platform Pod**: Design system, charts, maps, logistics widgets, RTL/i18n, perf.
- **Mobile Platform Pod**: Cross-cutting Flutter platform, offline, sync, scanner libs.
- **DevEx Pod**: Monorepo tooling, CI/CD, codegen, developer portal.
- **Quality & SRE Pod**: SRE practices, chaos, perf testing, incident management.

## 19.2 Functional Roles

- VP Engineering, CTO/CPO, CISO, Head of SRE, Head of Data, Head of AI.
- Principal/Staff engineers anchor each pod and own ADRs.
- Engineering Managers (EM) per pod or paired pods.
- Technical Program Managers across streams (Foundation, Domain, Growth, International).

## 19.3 Communication

- RFC process for cross-team architecture decisions.
- Architecture review board, weekly.
- SRE/Security reviews on every change touching auth/finance/PII.
- Shared on-call rotation per service (with paid handoffs).

---

# 20. Delivery Schedule

## 20.1 Indicative timeline (calendar months, t = launch start)

- **t+0 to t+3 (Q1)**: Foundation, design system v1, mobile shell, IAM, tenancy, audit, observability, security baseline.
- **t+3 to t+6 (Q2)**: Closed beta with shipment/track/notify/POD/COD/merchant/customer portals; first integrations.
- **t+6 to t+9 (Q3)**: GA v1; warehouse + dispatch + finance settlements; CRM v1; KPIs v1.
- **t+9 to t+12 (Q4)**: Routing v2; AI ETA & address; tax engine; ERP integrations begin; SOC 2 Type I prep.
- **t+12 to t+18 (Q5–Q6)**: Enterprise I, AI delay/fraud, omnichannel CRM, multi-currency, audit prep complete.
- **t+18 to t+24 (Q7–Q8)**: International I; customs; partner carriers; cell-per-country; chaos hardening; 1M/day capacity.
- **t+24 to t+30 (Q9–Q10)**: International II; AI autonomy in safe scopes; marketplace for 3PL.
- **t+30 to t+36 (Q11–Q12)**: SOC 2 Type II + ISO 27001; embedded finance pilots; lockers/PUDO; innovation pilots (vision/voice/AR).

## 20.2 Critical Path

- IAM → Tenancy → Pricing → Shipment → Tracking → Notifications → Pickup → Delivery → POD → COD → Settlement → CRM → Routing v2 → AI ETA → International.

## 20.3 Risk Register (high-impact)

- **R1**: KYC/Bank vendor delays — mitigation: parallel vendor evaluation; sandbox-first integration.
- **R2**: Schema lock-in too early — mitigation: contracts repo, versioning policy.
- **R3**: Performance under peaks — mitigation: scheduled load tests, capacity buffers, KEDA-based autoscaling.
- **R4**: Privacy/residency complexity — mitigation: cell-based deployments early; ADR per region.
- **R5**: AI safety regressions — mitigation: shadow → canary → guarded rollouts; HITL.
- **R6**: Regulatory changes (e.g., e-invoicing rules) — mitigation: dedicated compliance liaison; quarterly compliance review.
- **R7**: Talent/onboarding friction — mitigation: paved-road monorepo + service templates + golden paths.

## 20.4 Reporting & Cadence

- Weekly: Pod status, risks, SLO posture.
- Bi-weekly: Sprint review/retro per pod.
- Monthly: Program review with portfolio status.
- Quarterly: Roadmap re-baseline; OKR review; risk register refresh; DR drill.

— End of Implementation Plan —
