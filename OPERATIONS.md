# Livraison — Operational Readiness & SRE Runbook (v1.0)

> Author hat: Principal Site Reliability Engineer.
> Companion to BLUEPRINT.md, ARCHITECTURE.md, IMPLEMENTATION.md, AUDIT.md.
> Purpose: Define how Livraison is made, kept, and proven production-ready at enterprise scale.

> Reality note: The platform is at Sprint 1 (foundation + design system). This document is the **target operational model** that each service must satisfy before it is allowed into production. It doubles as the production-readiness gate. Numbers are design targets traceable to ARCHITECTURE.md §1.1, §13.

---

## Table of Contents

1. Service Tiering & the Production Readiness Gate
2. SLAs, SLOs, SLIs, and Error Budgets
3. RTO / RPO by Data Class
4. Load Testing Strategy
5. Stress Testing Strategy
6. Capacity Planning
7. High Availability Architecture
8. Multi-Region Architecture
9. Disaster Recovery Strategy
10. Backup Strategy
11. Monitoring Strategy
12. Alerting Strategy
13. Incident Response Strategy
14. Business Continuity Strategy
15. Security Hardening Strategy
16. Operational Readiness Checklist (Go/No-Go)

---

# 1. Service Tiering & the Production Readiness Gate

Not all services carry equal risk. Tiering drives SLO strictness, DR posture, on-call coverage, and review depth.

| Tier                          | Definition                                            | Examples                                                            | Availability target | On-call                     |
| ----------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------- | ------------------- | --------------------------- |
| **Tier 0 — Money & Identity** | Loss causes financial loss, fraud, or auth compromise | IAM, COD, Finance/Settlement, Payments                              | 99.99%              | 24/7 dedicated              |
| **Tier 1 — Core Operations**  | Loss halts physical logistics                         | Shipment, Pickup, Dispatch, Delivery, Tracking ingest, Warehouse    | 99.95%              | 24/7 shared                 |
| **Tier 2 — Customer-facing**  | Degrades experience, not operations                   | Public tracking, Notifications, Merchant/Customer portals, Webhooks | 99.9%               | Business hours + escalation |
| **Tier 3 — Supporting**       | Internal / deferrable                                 | Analytics, Reporting, AI batch, Search reindex                      | 99.5%               | Business hours              |

**Production Readiness Gate**: a service may not serve production traffic until it passes the checklist in §16. The gate owner is the SRE on-call lead; sign-off is recorded in the service runbook.

---

# 2. SLAs, SLOs, SLIs, and Error Budgets

## 2.1 Definitions

- **SLA**: External, contractual promise (with penalties/credits). Always looser than the internal SLO.
- **SLO**: Internal objective the team commits to. Drives error budget.
- **SLI**: The measured signal (e.g., good requests / total requests).
- **Error Budget**: `1 − SLO`. The permitted unreliability per window. Governs release freezes.

## 2.2 Customer-facing SLAs (contractual)

| Service                      | SLA                                | Measurement window | Remedy                   |
| ---------------------------- | ---------------------------------- | ------------------ | ------------------------ |
| Platform API availability    | 99.9% monthly                      | Calendar month     | Service credits per tier |
| Public tracking availability | 99.9% monthly                      | Calendar month     | Service credits          |
| COD settlement timeliness    | ≥ 99.5% within contracted T+N      | Monthly            | Credits + RCA            |
| Webhook delivery             | ≥ 99.9% eventually delivered ≤ 24h | Monthly            | Credits                  |

## 2.3 Internal SLOs (per critical user journey)

SLOs are journey-based, not just per-endpoint, because users feel journeys.

| Journey / SLI                              | SLO target                 | Window         | Error budget         |
| ------------------------------------------ | -------------------------- | -------------- | -------------------- |
| Create shipment — success rate             | 99.95%                     | 28-day rolling | 0.05% (~21.6 min/mo) |
| Create shipment — latency (P95 < 600 ms)   | 99% of minutes meet target | 28-day         | 1% of minutes        |
| Tracking ingest end-to-end < 1 s (P95)     | 99.5%                      | 28-day         | 0.5%                 |
| Tracking read (public) availability        | 99.9%                      | 28-day         | 0.1%                 |
| Pickup assignment latency < 5 s (P95)      | 99%                        | 28-day         | 1%                   |
| POD upload success (incl. offline replay)  | 99.9%                      | 28-day         | 0.1%                 |
| COD capture — success & exactly-once       | 99.99%                     | 28-day         | 0.01% (~4.3 min/mo)  |
| Settlement batch run completes on schedule | 99.9%                      | per cycle      | 0.1%                 |
| AuthN success (excl. bad credentials)      | 99.99%                     | 28-day         | 0.01%                |
| Notification dispatch accepted by provider | 99.9%                      | 28-day         | 0.1%                 |

## 2.4 Standard SLI definitions (how each is computed)

- **Availability SLI** = `count(good responses) / count(valid requests)` where "good" excludes 5xx and excludes client-caused 4xx (those are not budget-consuming except 429 from our own throttling, which counts).
- **Latency SLI** = `count(requests faster than threshold) / count(valid requests)`, measured at the edge and at the service, reported separately.
- **Freshness SLI** (tracking) = `count(events projected within 1s) / count(events ingested)`.
- **Correctness SLI** (COD) = `count(collections with exactly one ledger entry) / count(collections)`; any duplicate or missing entry burns 100% of that event's budget and pages immediately.

## 2.5 Error Budget Policy (release governance)

- Budget computed on a 28-day rolling window per SLO.
- **> 50% budget remaining**: normal velocity; ship freely behind flags.
- **10–50% remaining**: heightened caution; risky changes require SRE sign-off.
- **< 10% remaining**: **feature freeze** for the affected service; only reliability fixes ship until budget recovers.
- **Budget exhausted (SLO breached)**: automatic freeze + incident review + reliability backlog prioritized above features.
- **Fast-burn alert**: if 2% of the 28-day budget is consumed in 1 hour, page immediately (see §12).
- Tier 0 budget exhaustion escalates to engineering leadership within 1 business day.

---

# 3. RTO / RPO by Data Class

A single DR posture is wrong because data classes have different consistency needs (AUDIT.md SPEC-012). RTO/RPO are set per class.

| Data class            | Examples                                  | RPO (max data loss)                         | RTO (max downtime) | Replication                                                            |
| --------------------- | ----------------------------------------- | ------------------------------------------- | ------------------ | ---------------------------------------------------------------------- |
| **Financial ledger**  | COD, settlements, payouts, GL             | **0 (zero-loss)**                           | ≤ 15 min           | Synchronous / quorum, multi-AZ; cross-region sync where latency allows |
| **Identity & access** | IAM, sessions, keys                       | ≤ 30 s                                      | ≤ 15 min           | Synchronous multi-AZ; async cross-region                               |
| **Core operational**  | Shipments, pickups, deliveries, warehouse | ≤ 5 min                                     | ≤ 30 min           | Sync multi-AZ + async cross-region                                     |
| **Tracking events**   | Event stream/history                      | ≤ 5 min (lossy-tolerant for analytics tail) | ≤ 30 min ingest    | Kafka RF=3 + async cross-region mirror                                 |
| **Documents / POD**   | Labels, signatures, photos                | ≤ 5 min                                     | ≤ 1 h              | Object store cross-region replication                                  |
| **Analytics / lake**  | Marts, reports                            | ≤ 24 h                                      | ≤ 4 h              | Rebuildable from sources                                               |

Notes:

- "Zero-loss" for the ledger is achieved with synchronous commit to a quorum of replicas; a regional failover must not acknowledge a COD collection that isn't durably replicated. This is enforced by `synchronous_commit = on` + `synchronous_standby_names` quorum for the finance cluster.
- Control-plane composite RTO target ≤ 30 min; tracking ingest active-active so ingest RTO ≈ 0 with degraded projection.

---

# 4. Load Testing Strategy

## 4.1 Goals

Validate the system meets latency/throughput SLOs at expected and peak volumes, with realistic data shapes and tenancy distribution.

## 4.2 Workload model (derived from ARCHITECTURE.md §13)

- Baseline: 1M shipments/day ≈ 11.6/s average; design for diurnal peaks 3–4× average.
- Tracking events: 100k events/sec peak ingest.
- Notifications: 50M/day.
- Concurrency: 50k staff/merchant users, 100k concurrent public trackers, 30k drivers online.
- Tenancy skew: model a Pareto distribution (top 1% of merchants drive ~50% of volume) to expose noisy-neighbor effects.

## 4.3 Scenarios

| Scenario                | Tooling               | Profile                        | Pass criteria                                 |
| ----------------------- | --------------------- | ------------------------------ | --------------------------------------------- |
| Create-shipment API     | k6                    | Ramp to peak RPS, 1h soak      | P95 < 600 ms, error < 0.1%                    |
| Bulk import (5k orders) | k6 + worker assertion | 200 concurrent imports         | All complete < 5 min, partial-success correct |
| Tracking ingest         | k6 + Kafka producer   | 100k events/s, 30 min          | Ingest→page lag P95 < 1 s, zero loss          |
| Public tracking reads   | k6                    | 100k concurrent, cached + cold | P95 < 300 ms, CDN hit ratio > 90%             |
| Dispatch board (WS)     | k6 ws / Artillery     | 5k concurrent boards           | Update latency P95 < 2 s                      |
| Driver app sync         | k6                    | 30k devices, delta sync        | Sync P95 < 3 s, no dupes                      |
| COD capture             | k6                    | Peak + forced retries          | Exactly-once invariant holds                  |

## 4.4 Methodology

- **Environment**: dedicated load environment at production scale-ratio (≥ 30% of prod capacity) or full prod-parity for release-gating tests; never load-test prod without a documented game-day.
- **Data**: synthetic, anonymized, production-shaped (size distributions, address variety, multi-piece ratios). No real PII (AUDIT.md SPEC-003).
- **Cadence**: per-release smoke load test in CI (short, key endpoints); weekly full load test; quarterly peak-readiness test (8× for seasonal peaks).
- **Observability during tests**: capture RED/USE metrics, DB query plans, Kafka consumer lag, GC, connection-pool saturation.
- **Idempotency note**: load scripts that exercise write/financial paths use unique idempotency keys; replay scenarios deliberately reuse keys to assert dedupe.

## 4.5 Exit criteria

A release is load-cleared only if all targeted SLIs meet SLO at projected peak, with ≥ 20% headroom on saturation metrics (CPU, connections, queue depth).

---

# 5. Stress Testing Strategy

## 5.1 Goals

Find the breaking point and confirm the system fails safe, sheds load gracefully, and recovers automatically.

## 5.2 Techniques

- **Ramp-to-break**: increase load until SLOs break; record the knee and the first bottleneck (DB connections, Kafka lag, CPU, mesh).
- **Spike**: instantaneous 8–10× surge (flash sale / Black Friday) to validate autoscaling reaction time (target scale-out < 60 s) and queue back-pressure.
- **Soak/endurance**: 24–72 h at high-normal load to surface leaks, connection exhaustion, partition bloat, log/disk growth.
- **Back-pressure validation**: confirm 429 + Retry-After propagate end-to-end; confirm clients (web, mobile, webhooks) honor them.
- **Chaos engineering** (Chaos Mesh / LitmusChaos):
  - Pod kill, node drain, AZ loss.
  - Network latency/partition injection between services and to DB.
  - Kafka broker loss; verify RF=3 + min ISR=2 holds.
  - Dependency failure (PSP/SMS provider down) → verify circuit breakers, failover providers, and graceful degradation.
  - Clock skew injection (drivers' devices) → verify server-authoritative time.

## 5.3 Game Days

- Quarterly, scheduled, with a hypothesis and abort criteria.
- At least one annual **regional failover game day** (full DR drill, see §9).
- One annual **finance failover drill** proving zero-loss ledger RPO.
- Each game day produces findings tracked to closure.

## 5.4 Pass criteria

- No data loss for Tier 0/1 data classes.
- Automatic recovery without manual DB intervention.
- Blast radius contained to one cell/region (no cross-tenant or cross-region cascade).

---

# 6. Capacity Planning

## 6.1 Principles

- Plan to **2× current peak** standing headroom; autoscale beyond for surges.
- Instrument **cost-per-shipment** across compute/network/storage as a first-class metric (FinOps).
- Capacity reviews monthly; pre-scale for known events (sales, holidays).

## 6.2 Component capacity model (initial targets, refine with load tests)

| Component          | Sizing driver         | Initial target                                                             | Scaling lever                                |
| ------------------ | --------------------- | -------------------------------------------------------------------------- | -------------------------------------------- |
| Stateless services | RPS, P95 latency      | HPA 60–70% CPU target, min 3 replicas/AZ                                   | HPA + Karpenter                              |
| PostgreSQL (OLTP)  | Writes/s, connections | Primary + 2 replicas/region; PgBouncer txn pooling                         | Read replicas, partitioning, shard by tenant |
| Kafka              | Events/s, retention   | RF=3, min ISR=2, partitions ≥ 3× consumer count on hot topics              | Add partitions/brokers, tiered storage       |
| Redis              | Ops/s, memory         | Cluster mode, 3 shards/region, `allkeys-lru` for caches                    | Add shards; near-cache                       |
| OpenSearch         | Index rate, query QPS | 3 data nodes/region, rolling indices                                       | Shards, hot-warm tiers                       |
| Object store       | PUT/GET, volume       | Multi-region buckets, lifecycle to IA/Glacier                              | Native scaling                               |
| Tracking store     | 100k events/s         | Append store (Kafka log of record) + ClickHouse/Cassandra (AUDIT SPEC-007) | Horizontal nodes, TTL                        |
| Routing/AI workers | Solve QPS, GPU util   | KEDA on queue depth; separate batch vs real-time tiers                     | GPU/CPU pools, batching                      |

## 6.3 Connection budget (a common silent bottleneck)

- Each Postgres primary has a hard `max_connections`; do not let stateless autoscaling exhaust it.
- Mandate PgBouncer in **transaction** pooling mode; cap per-service pool sizes; total app connections ≤ 80% of `max_connections`.
- This interacts with tenant isolation: use `SET LOCAL app.tenant_id` per transaction (AUDIT SPEC-001) so txn pooling stays safe.

## 6.4 Capacity SLO

- Saturation alerts fire at 70% of any capacity ceiling; capacity is added before 85%.

---

# 7. High Availability Architecture

## 7.1 Within a region

- **Multi-AZ everything**: ≥ 3 AZs. Stateless pods spread via topology-spread constraints + pod anti-affinity.
- **Databases**: Patroni-managed PostgreSQL, synchronous replica in a second AZ, async replica in a third. Automatic failover with fenced old primary.
- **Kafka**: brokers across 3 AZs, RF=3, min ISR=2; producers `acks=all`, idempotent producers; financial topics transactional.
- **Redis**: cluster mode with replicas per shard across AZs.
- **Ingress/LB**: redundant L7 ingress (Envoy/NGINX) behind regional LB; health checks at L4 and L7.
- **Service mesh**: mTLS, retries (bounded, idempotent only), timeouts, circuit breakers, outlier detection.

## 7.2 Resilience patterns (mandatory per service)

- Timeouts on every outbound call; no unbounded waits.
- Retries only for idempotent operations, with jitter and a retry budget.
- Circuit breakers + bulkheads to isolate failing dependencies.
- Graceful degradation: e.g., tracking page serves last-known status from cache when the DB is degraded; create-shipment can queue if pricing is briefly unavailable (with clear UX).
- Idempotency + outbox/inbox for all writes (exactly-once for money).
- Load shedding: shed Tier 3 before Tier 1; protect Tier 0 always.

## 7.3 Single points of failure — explicitly eliminated

- No singleton stateful pods without HA.
- No single NAT/egress without redundancy.
- No single secret store/KMS endpoint without regional failover.
- DNS with health-checked failover and low TTL for failover records.

---

# 8. Multi-Region Architecture

## 8.1 Topology

- **Cell-based per country/region** to bound blast radius and meet data residency (ARCHITECTURE.md §1.1, §10.1).
- **Tracking ingest**: active-active across regions (ingest RTO ≈ 0).
- **Control plane**: active-active in mature markets; active-passive (warm) elsewhere.
- **Financial/ledger**: region-pinned with synchronous quorum; cross-region async for DR with zero-loss failover procedure.

## 8.2 Routing

- Global anycast + GeoDNS with latency-based routing and health checks.
- Per-country data residency enforced by routing customers to their lawful region; cross-region replication only where legally permitted (ARCHITECTURE.md §11.5).

## 8.3 Data strategy

- **Region-local primary** for OLTP; async replicas to DR region.
- **Kafka MirrorMaker** for cross-region event replication on selected topics.
- **Object store** cross-region replication for documents/POD.
- **Conflict avoidance**: a tenant/shipment is "owned" by one home region for writes; other regions read replicas. No multi-master OLTP for business writes (avoids conflict-resolution complexity).

## 8.4 Region failover

- Promote DR region replicas; repoint GeoDNS; warm caches; verify financial replication caught up before accepting money operations.
- Documented, tested, time-boxed (see §9).

---

# 9. Disaster Recovery Strategy

## 9.1 Scope of disasters

AZ loss, region loss, data corruption, ransomware/destructive action, dependency provider outage, accidental mass deletion.

## 9.2 Strategy by scenario

| Scenario                     | Response                                      | Target                                       |
| ---------------------------- | --------------------------------------------- | -------------------------------------------- |
| Single AZ loss               | Automatic; multi-AZ absorbs                   | No action; RTO ≈ 0                           |
| Region loss                  | Failover to DR region per runbook             | Control plane RTO ≤ 30 min; ledger zero-loss |
| Data corruption / bad deploy | PITR restore to pre-corruption; replay events | RPO ≤ 5 min (≤ 0 for ledger)                 |
| Ransomware / destructive     | Restore from immutable backups (Object Lock)  | RTO ≤ 4 h for affected data                  |
| Provider outage (PSP/SMS)    | Failover provider; degrade gracefully         | No hard outage                               |

## 9.3 Mechanisms

- **PITR** on PostgreSQL via WAL archiving (WAL-G) to object storage; continuous.
- **Immutable backups**: S3 Object Lock (WORM) for backups and audit snapshots — ransomware-resistant.
- **Event replay**: Kafka retention + tiered storage allows rebuilding projections after restore.
- **Infrastructure as Code**: entire region reproducible from Terraform modules (region template), enabling rebuild-from-zero.

## 9.4 DR runbook (region failover) — outline

1. Declare DR (incident commander authority).
2. Freeze writes to failing region (fence).
3. Verify replication lag on DR; for finance, confirm zero outstanding un-replicated transactions before accepting money ops.
4. Promote DR databases; start services; warm caches.
5. Repoint GeoDNS/anycast; verify health checks.
6. Validate top journeys via synthetic checks.
7. Communicate (status page, customers, regulators if required).
8. Post-failover reconciliation: detect/replay any in-flight events; run financial reconciliation.

## 9.5 DR testing

- Quarterly partial DR drill; annual full regional failover game day; annual finance zero-loss drill. Each drill validates RTO/RPO and updates the runbook.

---

# 10. Backup Strategy

## 10.1 What is backed up

- OLTP databases (full + WAL/PITR).
- Object store (versioning + cross-region replication).
- Kafka (tiered storage + topic configs/ACLs as code).
- Configuration & secrets metadata (secrets themselves in Vault/KMS, backed up per vendor guidance; never in plaintext backups).
- Audit log (append-only, WORM snapshots).

## 10.2 Policy (3-2-1+)

- ≥ 3 copies, ≥ 2 media/locations, ≥ 1 offsite/immutable.
- **Encryption** at rest with KMS; backups never contain plaintext secrets or un-tokenized PII beyond policy.
- **Retention**:
  - OLTP full: daily for 35 days; weekly for 1 year.
  - PITR window: ≥ 7 days.
  - Financial/audit: 7–10 years (regulatory), pseudonymized per erasure policy (AUDIT SPEC-020).
  - Object/POD: per data class; lifecycle to cold tiers.

## 10.3 Restore verification (the part most orgs skip)

- **Automated monthly restore tests**: restore to an isolated environment and run validation queries; a backup that hasn't been test-restored is not a backup.
- Track **restore time** as an SLI against RTO targets.
- Quarterly: restore a full region's critical datasets end-to-end.

---

# 11. Monitoring Strategy

## 11.1 Pillars (OpenTelemetry-first)

- **Metrics**: Prometheus exposition → Mimir/Thanos. RED per service, USE per resource, business KPIs as metrics (shipments/min, OTD, COD float, consumer lag).
- **Logs**: structured JSON → Loki/Elastic; PII-redacted at source (driven by the PII registry, AUDIT SPEC-003); cold tier in object storage.
- **Traces**: OTel, W3C Trace Context across HTTP/gRPC/Kafka; tail-based sampling for errors/slow; **100% sampling for financial and auth traces** (AUDIT SPEC-016).
- **Profiles**: continuous profiling (Pyroscope/Parca) for hot paths.

## 11.2 Dashboards

- **Golden per service**: traffic, errors, latency (P50/95/99), saturation.
- **SLO dashboards per journey**: SLI, budget remaining, burn rate.
- **Business**: live ops map, OTD, exceptions, COD pipeline, settlement timeliness.
- **Capacity**: connection pools, Kafka lag, DB replication lag, disk, GPU.
- **Cost**: cost-per-shipment, per-tenant cost.

## 11.3 Synthetic monitoring

- 24/7 synthetic checks from multiple regions for top APIs, public tracking, login, create-shipment, COD capture.
- Synthetic checks feed availability SLIs and catch issues before users.

## 11.4 Data quality monitoring

- Freshness/completeness/uniqueness checks (Great Expectations) on critical pipelines.
- Cross-service reconciliation jobs (AUDIT SPEC-006) emit metrics on orphaned references.

---

# 12. Alerting Strategy

## 12.1 Philosophy

- **Alert on symptoms (SLO burn), not causes.** Page humans only for user-impacting or budget-threatening conditions. Everything else is a ticket or a dashboard.
- Every alert links to a runbook. No runbook → no page.

## 12.2 SLO burn-rate alerting (multi-window)

| Alert      | Condition                                       | Action                                   |
| ---------- | ----------------------------------------------- | ---------------------------------------- |
| Fast burn  | 2% of 28-day budget consumed in 1 h (and 5 min) | Page immediately                         |
| Slow burn  | 5% of budget in 6 h (and 30 min)                | Page (business hours) / ticket off-hours |
| Budget low | < 10% budget remaining                          | Notify team; trigger freeze policy       |

Multi-window (long+short) prevents flapping and false pages.

## 12.3 Hard pages (immediate, any time)

- COD exactly-once invariant violation (duplicate/missing ledger entry).
- AuthN/AuthZ system down or mass auth failures.
- Tier 0 service down or error budget exhausted.
- Data loss or corruption signal; backup/replication broken.
- Security: active intrusion, secret exposure, abnormal data egress.
- Regional failover triggered.

## 12.4 Routing & hygiene

- PagerDuty/Opsgenie with tier-based rotations; clear primary/secondary; paid handoffs.
- Severity-based routing; smart grouping/dedup; maintenance windows suppress expected noise.
- **Alert review** weekly: delete noisy/non-actionable alerts; track page volume per on-call (target < 2 actionable pages/shift); fight alert fatigue actively.

---

# 13. Incident Response Strategy

## 13.1 Severity matrix

| Sev      | Definition                                               | Examples                                                 | Response                          | Comms                                                |
| -------- | -------------------------------------------------------- | -------------------------------------------------------- | --------------------------------- | ---------------------------------------------------- |
| **SEV1** | Critical: major outage, data loss, money/security breach | COD double-spend, region down, breach                    | Immediate, all-hands, IC assigned | Exec + customer + status page; regulator if required |
| **SEV2** | Major: significant degradation, SLA risk                 | Tracking ingest lag, one Tier-1 service down in a region | < 15 min ack, IC assigned         | Status page + affected customers                     |
| **SEV3** | Minor: limited impact, workaround exists                 | Elevated latency, non-critical job failing               | < 30 min ack                      | Internal                                             |
| **SEV4** | Low: cosmetic/no user impact                             | Flaky dashboard                                          | Next business day                 | Ticket                                               |

## 13.2 Roles

- **Incident Commander (IC)**: runs the incident, makes decisions. Not the one debugging.
- **Operations/Subject lead**: hands-on remediation.
- **Comms lead**: status page, customer/exec/regulator updates.
- **Scribe**: timeline of actions and decisions.

## 13.3 Lifecycle

Detect → Triage/Declare (severity) → Assemble (roles) → Mitigate (stop the bleeding; rollback/feature-flag/failover before root-causing) → Resolve → Recover/Reconcile (esp. financial) → Postmortem.

## 13.4 Tooling & automation

- One-click incident channel creation (ChatOps) with roles paged.
- Runbooks linked from every alert.
- Rollback and feature-flag kill switches reachable within 1 click and audited.
- Status page automation.

## 13.5 Postmortems

- **Blameless**, mandatory for SEV1/SEV2 within 5 business days.
- Root cause (5 whys / causal analysis), contributing factors, timeline, action items with owners and dates.
- Action items tracked in backlog above feature work until closed.
- Trends reviewed quarterly (recurring causes → systemic fixes).

## 13.6 MTTx targets

- MTTA (acknowledge): SEV1 < 5 min, SEV2 < 15 min.
- MTTM (mitigate): SEV1 < 30 min target.
- MTTR (resolve): tracked per tier; trended over time.

---

# 14. Business Continuity Strategy

## 14.1 Beyond IT: keep parcels moving

Logistics is physical; software DR is necessary but not sufficient. BCP covers people, facilities, and process.

## 14.2 Degraded-mode operations (manual fallback)

- **Offline driver app**: already local-first (ARCHITECTURE.md §4.4); drivers continue pickups/deliveries/POD offline and sync later.
- **Warehouse manual mode**: pre-printed contingency manifests and barcode sheets; documented manual sort procedure when scanning is down.
- **Branch COD continuity**: manual cash logs reconciled into the system on recovery; strict dual-control to prevent fraud during manual mode.
- **Comms fallback**: if primary SMS provider down, failover provider; if all down, in-app + email.

## 14.3 Dependencies & vendors

- Multi-vendor for SMS, PSP, maps where feasible (no single external SPOF).
- Vendor SLAs reviewed; contingency for each critical vendor documented.

## 14.4 People & facilities

- On-call coverage across time zones (follow-the-sun) to avoid single-region staffing risk.
- Documented succession for IC and Tier-0 owners.
- Warehouse/branch continuity plans for power/connectivity loss (UPS, mobile failover, generator where applicable).

## 14.5 BCP testing

- Tabletop exercises semi-annually (region loss, key-vendor loss, ransomware).
- Manual-mode drills at representative branches/warehouses annually.

---

# 15. Security Hardening Strategy

(Operational hardening; complements ARCHITECTURE.md §11 and AUDIT.md Part B.)

## 15.1 Identity, access, secrets

- Zero-trust: mTLS everywhere (SPIFFE/SPIRE); default-deny network policies.
- MFA mandatory for all human access; passkey-preferred.
- **Just-in-time** privileged access with approval + expiry; **break-glass** with session recording and mandatory post-use review.
- Secrets in Vault/KMS; short-lived dynamic DB credentials; automated rotation (JWT/JWKS, webhook HMAC versioned, POD signing, DB DEKs, TLS) per the key catalog (AUDIT SPEC-009).
- Quarterly access reviews; SoD enforced and tested (creator ≠ approver).

## 15.2 Platform & supply chain

- Hardened, distroless, non-root images; read-only root filesystems; drop Linux capabilities.
- Signed images (cosign) + SBOM (Syft); admission controllers reject unsigned/untrusted images.
- SLSA-3 build provenance; pinned dependencies; Renovate + `pnpm audit`/Trivy/osv-scanner in CI (closes AUDIT CODE-012).
- CIS-benchmarked clusters; runtime security (Falco); CSPM continuous.

## 15.3 Data protection

- Encryption in transit (TLS 1.2+/1.3) and at rest (KMS); field-level encryption + tokenization for PII/PCI bound to the PII registry (AUDIT SPEC-003).
- Egress controls + DLP; block SSRF for merchant-supplied webhook URLs (allowlist, block internal ranges) (AUDIT SPEC-019).
- Public tracking anti-enumeration: second factor + rate limiting + data minimization (AUDIT SPEC-004).

## 15.4 Detection & response

- Centralized SIEM; security alerts integrated with on-call.
- Anomalous data-egress and mass-read detection; abnormal auth pattern detection.
- WAF (OWASP CRS), bot management, DDoS shield at the edge.
- Tamper-evident audit log (hash-chained) with WORM snapshots.

## 15.5 Assurance

- SAST/DAST/SCA/IaC scanning in CI; secret scanning pre-commit + CI.
- Annual penetration test; continuous bug bounty.
- SOC 2 Type II + ISO 27001/27701 evidence collection automated in pipelines (per IMPLEMENTATION.md roadmap).

---

# 16. Operational Readiness Checklist (Go/No-Go)

A service passes the Production Readiness Gate only when **all** apply. Recorded in the service runbook; signed by service owner + SRE on-call lead.

### Reliability

- [ ] SLOs defined (availability + latency) with SLIs instrumented and dashboards live.
- [ ] Error budget + burn-rate alerts configured and routed.
- [ ] Multi-AZ deployment; ≥ 3 replicas; PDBs; topology spread.
- [ ] Timeouts, bounded retries (idempotent only), circuit breakers configured.
- [ ] Graceful shutdown + readiness/liveness probes.
- [ ] Load test passed at projected peak with ≥ 20% headroom.
- [ ] Chaos test passed (pod/AZ loss, dependency failure).

### Data

- [ ] Backups configured; **restore test passed** in last 30 days.
- [ ] RPO/RTO for the service's data class documented and tested.
- [ ] Migrations backward-compatible (expand-migrate-contract).
- [ ] Tenant isolation enforced (RLS + per-txn context) with cross-tenant tests (AUDIT SPEC-001).
- [ ] Idempotency/outbox/inbox in place; exactly-once verified for any financial path (AUDIT SPEC-002).

### Security

- [ ] mTLS, authN/Z (field + row level), default-deny network policy.
- [ ] PII columns classified, encrypted/tokenized; logs redacted (AUDIT SPEC-003).
- [ ] Secrets via Vault/KMS; rotation tested; no secrets in code/env.
- [ ] SAST/DAST/SCA clean; image signed; SBOM produced.
- [ ] Threat model reviewed.

### Observability

- [ ] Structured logs, RED metrics, traces (100% for finance/auth).
- [ ] Golden dashboard + SLO dashboard published.
- [ ] Synthetic checks live from ≥ 2 regions.
- [ ] Every alert has a runbook.

### Operations

- [ ] Runbook complete (architecture, dependencies, common failures, rollback, escalation).
- [ ] On-call rotation assigned per tier; paging tested.
- [ ] Feature flags + kill switch for risky paths.
- [ ] DR runbook step exists if Tier 0/1.
- [ ] Rollback verified in staging.

### Compliance

- [ ] Data residency correct for served countries.
- [ ] Retention + erasure reconciliation documented (AUDIT SPEC-020).
- [ ] Audit logging covers sensitive actions.

---

## Appendix A — Key Numbers at a Glance

- Control-plane availability target: 99.95%; Tier 0: 99.99%.
- Tracking ingest: active-active, ingest RTO ≈ 0; end-to-end lag P95 < 1 s.
- RPO: ledger 0, identity ≤ 30 s, core ops/tracking ≤ 5 min.
- RTO: ledger ≤ 15 min, control plane ≤ 30 min, ransomware-affected data ≤ 4 h.
- Scale: 1M shipments/day, 100k tracking events/s peak, 50M notifications/day, 30k drivers online.
- Autoscale reaction: < 60 s. Capacity headroom: 2× peak standing; saturation alert at 70%.
- Error budget freeze: < 10% remaining → feature freeze; fast burn (2%/1h) → page.

## Appendix B — Document Maintenance

- Owner: SRE lead. Review cadence: quarterly and after every SEV1.
- Changes via PR with SRE + security review. Numbers re-baselined after each quarterly load/peak test.

— End of Operational Readiness Documentation —
