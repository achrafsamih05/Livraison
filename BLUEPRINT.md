# Livraison — Enterprise Logistics & Delivery Management Platform

## Complete Analysis & Design Blueprint (v1.0)

> Scope: Enterprise-grade, multi-tenant, multi-region logistics platform competing with FedEx, DHL, UPS, Aramex, and large regional carriers.
> Audience: Executive sponsors, product leadership, solution architects, engineering leads, UX leads, ops leadership, compliance, finance, data, and AI teams.
> Status: Design blueprint. No source code. Implementation-ready specification.

---

## Table of Contents

1. Business Analysis
2. Domain Analysis (Bounded Contexts)
3. Domain-Driven Design (Aggregates, Entities, VOs, Events, Services)
4. Workflow Analysis (State Machines)
5. User Roles & Permission Matrix
6. Frontend Product Design (Portals)
7. UI Design Analysis (Screens)
8. Complete Widget Inventory
9. Mobile App Design (Driver App)
10. Reporting & Analytics
11. AI Opportunities

---

# 1. Business Analysis

## 1.1 Vision

To become the most reliable, transparent, and intelligent logistics operating system on the planet — moving any parcel, on any route, for any merchant or individual, at predictable cost and time, with end-to-end traceability and zero hidden steps.

## 1.2 Mission

Deliver a unified platform that:

- Orchestrates pickup, sorting, transfer, last-mile delivery, returns, and cash-on-delivery (COD) across countries, cities, branches, warehouses, and fleets.
- Empowers merchants with a self-service control plane (rates, labels, tracking, settlement, analytics).
- Empowers customers with real-time visibility, communication, and choice (reschedule, redirect, return).
- Empowers operators (drivers, dispatchers, warehouse staff, finance) with purpose-built tools optimized for speed, accuracy, and accountability.
- Uses data and AI to compress time, reduce cost, prevent failure, and forecast demand.

## 1.3 Business Goals

- **G1**: Achieve >98% on-time delivery rate within 18 months of launch in each market.
- **G2**: Reduce cost-per-shipment by 15–25% versus incumbent baselines via routing, consolidation, and automation.
- **G3**: Reach <1.5% lost/damaged shipment rate.
- **G4**: Reach <24h merchant settlement cycle for COD funds (configurable per contract).
- **G5**: Achieve NPS ≥ 60 for merchants and ≥ 50 for end customers.
- **G6**: Onboard 10,000+ merchants and process 1M+ shipments/day at maturity.
- **G7**: Maintain 99.95% platform availability (excluding planned maintenance).
- **G8**: Comply with all applicable customs, tax, data-protection, and labor regulations in operating countries.

## 1.4 Strategic Objectives

- **S1**: Build a domain-driven, modular architecture supporting independent scaling of pickup, sort, line-haul, and last-mile.
- **S2**: Offer multi-tenant SaaS for white-label regional carriers ("Carrier-as-a-Service").
- **S3**: Open public APIs and webhooks; ship official SDKs (e-commerce platform plugins).
- **S4**: Develop in-house AI for ETA, routing, demand, and fraud.
- **S5**: Operate a hybrid fleet (owned + contracted + crowdsourced) with unified driver experience.
- **S6**: Expand into adjacent revenue (insurance, fulfillment, cross-border, finance).
- **S7**: Build a proprietary network of warehouses and sortation hubs in tier-1 metros, with 3PL fallback in tier-2/3.

## 1.5 Stakeholders

| Stakeholder                                | Interest                                                  |
| ------------------------------------------ | --------------------------------------------------------- |
| Executive board / Investors                | Growth, margin, valuation, defensibility                  |
| Country General Managers                   | P&L, SLAs, regulatory compliance                          |
| Regional Managers                          | Branch performance, driver utilization                    |
| Branch Managers                            | Daily ops, team performance, customer escalations         |
| Warehouse Managers                         | Throughput, inventory accuracy, dock scheduling           |
| Dispatchers                                | Route plans, driver coverage, exceptions                  |
| Drivers                                    | Earnings, route fairness, tools that don't slow them down |
| Merchants (SMB → Enterprise)               | Cost, reliability, integration, settlement speed          |
| End Customers                              | Visibility, predictability, choice, communication         |
| Finance / Accounting                       | COD reconciliation, billing, taxes                        |
| HR                                         | Hiring, scheduling, payroll, compliance                   |
| Customer Support                           | Tools, knowledge base, escalation paths                   |
| Compliance / Legal                         | Customs, data, labor, dangerous goods                     |
| Security & DPO                             | Identity, secrets, PII, audit                             |
| Data / Analytics                           | Quality, lineage, KPIs                                    |
| AI / ML                                    | Training data, feedback loops                             |
| Regulators / Customs                       | Manifests, declarations, taxes                            |
| Partners (3PL, airlines, last-mile co-ops) | Capacity, integration                                     |

## 1.6 User Types

- **Internal**: Super Admin, CEO/Exec, Regional Manager, Country Manager, Branch Manager, Dispatcher, Warehouse Manager, Warehouse Staff (Receiver, Sorter, Loader), Driver (Pickup, Line-haul, Last-mile), Finance Officer, HR Officer, Support Agent (L1/L2/L3), Compliance Officer, Auditor.
- **External**: Merchant Owner, Merchant Operator, Merchant Finance, Customer (registered), Customer (guest), Partner Carrier User, Customs Broker, Insurance Adjuster.
- **System**: External API client, Webhook subscriber, Marketplace integration (Shopify/WooCommerce/Magento/Salla/Zid/etc.).

## 1.7 Business Requirements (BR)

- **BR-1** Multi-country, multi-currency, multi-language, multi-timezone.
- **BR-2** Multi-tenant white-label option for partner carriers.
- **BR-3** Configurable rate cards (weight, volume, zone, service level, fuel surcharge, COD fee, insurance).
- **BR-4** End-to-end shipment lifecycle: create → pick → sort → line-haul → branch → out-for-delivery → delivered/returned.
- **BR-5** COD collection, reconciliation, and merchant settlement with configurable cycles.
- **BR-6** Returns (RTO, RTS, partial returns, exchange).
- **BR-7** Real-time tracking with public tracking page and webhooks.
- **BR-8** Proof of delivery (signature, photo, OTP, ID scan, geo).
- **BR-9** Self-service merchant portal (book, label, manifest, invoice, settlement).
- **BR-10** Self-service customer portal (track, reschedule, redirect, complain).
- **BR-11** Driver mobile app with offline capability.
- **BR-12** Public REST + webhook API and partner SDKs.
- **BR-13** SLA management with automated alerts and credits.
- **BR-14** Fraud, theft, and damage controls.
- **BR-15** AI-driven optimization across routing, ETA, and demand.

## 1.8 Functional Requirements (FR)

Grouped by capability. Each is testable.

### Identity & Access

- FR-IAM-1 SSO (OIDC, SAML), MFA (TOTP, WebAuthn, SMS), password policies, session management.
- FR-IAM-2 RBAC + ABAC; scoped by tenant, country, region, branch, warehouse, fleet.
- FR-IAM-3 Service accounts and API keys with granular scopes.
- FR-IAM-4 Audit log for all authN/authZ events.
- FR-IAM-5 Just-in-time access for elevated actions, with approvals.

### Merchants & Customers

- FR-MERCH-1 Merchant onboarding with KYC/KYB.
- FR-MERCH-2 Contract management (rate card, SLAs, COD terms, billing cycle).
- FR-MERCH-3 Pickup address book, drop locations, return locations.
- FR-MERCH-4 Bulk shipment import (CSV, API, marketplace plugin).
- FR-CUST-1 Customer registration, address book, preferences (time slots, reschedule rules, language).
- FR-CUST-2 Guest tracking by AWB + phone/email.

### Shipments

- FR-SHIP-1 Create, edit (pre-pickup), cancel, clone shipments.
- FR-SHIP-2 Multi-piece shipments and consolidation.
- FR-SHIP-3 Service levels: Same-day, Next-day, Express, Standard, Economy, Cold-chain, Dangerous Goods, Heavy/Bulky.
- FR-SHIP-4 Pricing engine with rate cards, surcharges, taxes, discounts, promo codes.
- FR-SHIP-5 Label generation (PDF, ZPL), manifest, customs documents (CN22/CN23, commercial invoice).
- FR-SHIP-6 Barcoded AWB with check-digit and human-readable.

### Pickup & Dispatch

- FR-PICK-1 Pickup request scheduling with windows.
- FR-PICK-2 Auto/manual driver assignment.
- FR-PICK-3 Route optimization for multi-stop pickups.
- FR-PICK-4 Pickup attempt records (success, partial, failed, rescheduled).

### Warehouse & Sorting

- FR-WH-1 Inbound receiving with scan-in.
- FR-WH-2 Sortation by destination zone/branch/route.
- FR-WH-3 Bin/zone/cage/cart/ULD management.
- FR-WH-4 Outbound staging and load planning.
- FR-WH-5 Stock-take and reconciliation.
- FR-WH-6 Damage and loss reporting.

### Linehaul / Transfer

- FR-LH-1 Inter-warehouse and inter-branch transfers.
- FR-LH-2 Trip/manifest creation, sealing, in-transit scans.
- FR-LH-3 Multi-leg routing with handoffs.

### Last-Mile Delivery

- FR-DEL-1 Out-for-delivery routing with windows and capacity.
- FR-DEL-2 Re-attempt rules (configurable per merchant).
- FR-DEL-3 POD: signature, photo, OTP, ID match, geo-stamp.
- FR-DEL-4 Failed delivery reasons (controlled vocabulary), customer-driven reschedule, redirect.

### Returns

- FR-RET-1 RTO (Return-to-Origin), RTS (Return-to-Shipper), Customer return pickups.
- FR-RET-2 Reverse logistics workflow with QC at warehouse.
- FR-RET-3 Exchange (drop-and-pick) flows.

### COD & Finance

- FR-COD-1 COD amount per shipment with currency.
- FR-COD-2 Driver cash collection with end-of-day cash-up.
- FR-COD-3 Multi-channel COD (cash, POS card, wallet, link).
- FR-COD-4 Merchant settlement (T+N) with statements.
- FR-FIN-1 Invoicing, taxes, credit notes, debit notes.
- FR-FIN-2 Driver payroll and incentives.
- FR-FIN-3 Vendor/3PL payouts.
- FR-FIN-4 GL export to ERP (SAP, Oracle, NetSuite, Dynamics).

### Tracking & Communications

- FR-TRK-1 Real-time tracking events with timestamps and geo.
- FR-TRK-2 Public tracking page (white-labeled).
- FR-TRK-3 Notifications: SMS, Email, WhatsApp, Push, Voice IVR (configurable cascade).
- FR-TRK-4 Webhooks with retries, signing, replay.

### CRM & Support

- FR-CRM-1 Unified contact timeline (shipments, calls, tickets, NPS).
- FR-CRM-2 Ticketing with SLAs, queues, escalations.
- FR-CRM-3 Knowledge base and macros.
- FR-CRM-4 Quality monitoring (call recording, scoring).

### Analytics & Reporting

- FR-AN-1 Operational, financial, warehouse, driver, merchant dashboards.
- FR-AN-2 Custom reports with scheduling and export.
- FR-AN-3 Data lake export (Parquet to S3/GCS/Azure).

### AI

- FR-AI-1 ETA prediction.
- FR-AI-2 Route optimization.
- FR-AI-3 Delay prediction and proactive notifications.
- FR-AI-4 Address normalization and geocoding fallback.
- FR-AI-5 Fraud and anomaly detection.
- FR-AI-6 Demand forecasting.
- FR-AI-7 Conversational support agent.

## 1.9 Non-Functional Requirements (NFR)

- **Performance**: P95 API latency < 250 ms for read, < 600 ms for write at 10k RPS sustained per region. Tracking event ingest 100k events/sec peak.
- **Availability**: 99.95% control-plane, 99.99% tracking ingest, multi-AZ active-active.
- **Durability**: 11 nines for object storage; PITR for OLTP; >= 30-day backups, cross-region replication for critical data.
- **Scalability**: Horizontal scale of stateless services; partitioned event streams by tenant/country.
- **Security**: Zero-trust, mTLS service mesh, KMS-backed secrets, CSPM, SAST/DAST/SCA, bug bounty.
- **Privacy**: Data minimization, residency by country, consent management, PII tokenization.
- **Observability**: Distributed tracing, metrics, structured logs, business KPIs, SLO dashboards, error budgets.
- **Resilience**: Circuit breakers, bulkheads, graceful degradation, queue back-pressure, idempotent producers/consumers, exactly-once for financial events.
- **Internationalization**: i18n, l10n, RTL (Arabic, Hebrew), CLDR, ICU plurals, unicode-safe addressing.
- **Accessibility**: WCAG 2.2 AA across all web portals; AAA where feasible; full keyboard, SR, reduced motion, high-contrast support.
- **Maintainability**: Modular monorepo or polyrepo with strict module boundaries, contract tests, ADRs, infra-as-code.
- **Cost**: Unit economics dashboard; cost-per-shipment instrumentation across compute, network, storage.

## 1.10 Scalability Requirements

- **Tenant scale**: 10,000+ merchants, 100+ branches, 50+ warehouses, 20,000+ drivers concurrently.
- **Volume scale**: 1M+ shipments/day, 10M+ tracking events/day, 50M+ notifications/day.
- **Geographic scale**: Multi-region (MEA, EU, NA, APAC), local data residency.
- **Catalog scale**: 1B+ historical shipments queryable within 2s P95.
- **Traffic scale**: Black-Friday-like peaks 8× average; auto-scale within 60s.

## 1.11 Compliance Requirements

- **Data**: GDPR (EU), CCPA/CPRA (CA), KSA PDPL, UAE PDPL, Egypt PDPL, Turkey KVKK, Brazil LGPD.
- **Payments**: PCI-DSS for any cardholder data path; tokenize via PSP; SAQ-A where possible.
- **Customs/Trade**: HS codes, CN22/CN23, ECCN, denied-party screening, sanctions, dual-use, dangerous goods (IATA DGR, ADR, IMDG).
- **Labor**: Driver classification (employee vs contractor), hours-of-service, wage, tax.
- **Postal/Carrier**: National postal regulator licensing, S10 UPU AWB compatibility, carrier integration standards.
- **Industry**: ISO 9001, ISO 27001, ISO 27701, SOC 2 Type II, ISO 28000 (supply chain security).
- **Accessibility**: ADA, EAA, WCAG 2.2 AA.
- **Anti-fraud / AML**: KYC/KYB, transaction monitoring on COD, suspicious activity reporting.
- **Tax**: VAT/GST e-invoicing (KSA ZATCA, EU, etc.), withholding, fiscal printers where required.

## 1.12 Future Expansion Requirements

- Cross-border air/ocean freight.
- Fulfillment-as-a-Service (FaaS) and managed inventory.
- Insurance marketplace.
- Embedded finance (merchant cash advances against COD pipeline).
- Last-mile lockers and PUDO network.
- Drone and autonomous delivery pilots.
- Carbon accounting and green-route options.
- Voice-first ops (driver, warehouse).
- AR-assisted sortation and loading.
- Marketplace for 3PL capacity bidding.

---

# 2. Domain Analysis (Bounded Contexts)

The platform is decomposed into bounded contexts using Domain-Driven Design. Each context owns its data, exposes contracts, and integrates via domain events on an event backbone (e.g., Kafka) plus synchronous APIs where needed.

## 2.1 Identity & Access (IAM)

- **Purpose**: Authenticate principals (humans, services), authorize actions, enforce session and credential policies.
- **Responsibilities**: Login, MFA, SSO, password reset, token issuance/refresh, RBAC/ABAC, service accounts, API keys, audit.
- **Business Rules**:
  - Every action must be attributable to a principal.
  - High-risk actions require step-up auth.
  - Tokens are short-lived; refresh rotates and is revocable.
- **Relationships**: Issues identities consumed by every other context.

## 2.2 Authentication

- **Purpose**: Verify identity claims.
- **Responsibilities**: Password, OTP, WebAuthn/Passkeys, OIDC, SAML, social providers (gated), device binding.
- **Rules**: Lockout with exponential backoff; geo/device anomaly challenges; passkey-preferred.
- **Relationships**: Feeds Authorization with verified principal.

## 2.3 Authorization

- **Purpose**: Decide whether a principal may perform an action on a resource.
- **Responsibilities**: Policy evaluation, role/scope resolution, context-aware checks (tenant, country, branch, time-of-day).
- **Rules**: Default deny; explicit grants; segregation of duties for finance.
- **Relationships**: Used by all contexts at API and UI levels.

## 2.4 Users (Identity Profiles)

- **Purpose**: Manage profile data of internal staff.
- **Responsibilities**: Profile CRUD, lifecycle (invite, activate, suspend, offboard), preferences.
- **Rules**: Email uniqueness per tenant; mandatory profile fields per role.
- **Relationships**: Linked to Employees, IAM.

## 2.5 Employees / HR

- **Purpose**: Employment lifecycle, organizational hierarchy, compensation context.
- **Responsibilities**: Org chart, contracts, schedules/shifts, leaves, payroll inputs, certifications (DG, hazmat, forklift).
- **Rules**: Driver license validity required for driving; expired credentials block scheduling.
- **Relationships**: Drives Driver and Warehouse staffing; feeds Finance payroll.

## 2.6 Drivers

- **Purpose**: Manage the active driving workforce and their assignments.
- **Responsibilities**: Driver onboarding (employee or contractor), vehicle binding, shift, route, performance.
- **Rules**: One active session per device; geo-on during shift; HOS limits enforced.
- **Relationships**: Consumes Fleet, produces Tracking events; feeds COD/Finance.

## 2.7 Merchants

- **Purpose**: Account management for shippers/sellers.
- **Responsibilities**: KYC/KYB, contracts, rate cards, billing terms, locations, integrations, users, API keys.
- **Rules**: Cannot ship if account is suspended or credit limit exceeded.
- **Relationships**: Originates Shipments; receives Settlements.

## 2.8 Customers

- **Purpose**: Recipients (and senders for C2C). Address book and preferences.
- **Rules**: PII minimized; preferred channels respected; do-not-contact respected.
- **Relationships**: Endpoint of Shipments; consumer of Tracking.

## 2.9 Branches

- **Purpose**: Operational nodes (drop-off counters, hubs, depots) where shipments transit.
- **Responsibilities**: Service area mapping, opening hours, capacity, staff roster, cash safe.
- **Rules**: A shipment must always have a "current custodian" branch or driver.

## 2.10 Warehouses

- **Purpose**: Sortation, storage, and load planning facilities.
- **Responsibilities**: Layouts (zones, aisles, bins), dock doors, equipment, inbound/outbound flow.
- **Rules**: Every parcel scan changes location and custody.

## 2.11 Fleet

- **Purpose**: Vehicles, equipment, telematics.
- **Responsibilities**: Vehicle registration, maintenance, fuel, insurance, telematics ingest, capacity (volumetric/weight).
- **Rules**: Cannot dispatch a vehicle out of service or with expired insurance.

## 2.12 Shipments

- **Purpose**: The unit of work. Contract between merchant, carrier, and customer.
- **Responsibilities**: Lifecycle, pieces, dimensions, weights, value, COD, services, references.
- **Rules**: Immutable once picked up except via controlled exception flows; AWB unique globally.
- **Relationships**: Cuts across all operational contexts.

## 2.13 Tracking

- **Purpose**: Time-ordered events describing the journey of a shipment/piece.
- **Responsibilities**: Event ingest, deduplication, ordering, projection to public tracking, webhook fan-out.
- **Rules**: Events are append-only; corrections are compensating events with audit.

## 2.14 Returns

- **Purpose**: Reverse logistics including RTO, RTS, customer returns, exchanges.
- **Rules**: Returns reuse shipment identity but with reversed flow; condition graded at QC.

## 2.15 COD (Cash on Delivery)

- **Purpose**: Cash and digital collection at delivery and reconciliation up to merchant settlement.
- **Rules**: Driver cash held → branch safe → bank deposit → merchant settlement; never co-mingled across merchants.

## 2.16 Finance

- **Purpose**: Billing, invoicing, taxes, settlements, payroll, payouts, GL.
- **Rules**: Double-entry; closed periods locked; tax rules per jurisdiction; FX rates daily snapshot.

## 2.17 CRM

- **Purpose**: Relationship and case management for merchants and customers.
- **Rules**: 360° timeline; SLAs by tier; quality monitoring.

## 2.18 Notifications

- **Purpose**: Outbound communications across SMS, Email, Push, WhatsApp, Voice/IVR.
- **Rules**: Provider failover, content templates, locale, opt-out, throttling, regulatory windows (no SMS at night except service-critical).

## 2.19 Analytics

- **Purpose**: KPI computation, dashboards, ad-hoc analysis.
- **Rules**: Read-side only; never blocks ops; data freshness SLAs.

## 2.20 Reporting

- **Purpose**: Scheduled and on-demand reports for ops, finance, and regulators.
- **Rules**: Reproducible; signed; archived.

## 2.21 AI

- **Purpose**: Predictive and generative capabilities across the platform.
- **Rules**: Models versioned; decisions explainable; human-in-the-loop for high-impact actions.

## 2.22 Cross-cutting Contexts (supporting)

- **Pricing & Rating**: Compute price for any (origin, destination, service, weight, volume, COD, value).
- **Routing & Optimization**: Build pickup/delivery/line-haul routes.
- **Geo & Address**: Geocoding, normalization, zoning, polygons, service areas.
- **Document Service**: Labels, manifests, customs, invoices, signatures (PKI).
- **Audit & Compliance**: Tamper-evident logs.
- **Integration Platform**: Marketplace plugins, partner carriers, customs, banks, ERPs.
- **Configuration / Catalog**: Tenants, products, services, surcharges, holidays, working hours.
- **Search**: Cross-domain search (shipments, merchants, customers, drivers).
- **Feature Flags / Experimentation**.
- **Admin / Platform Ops**.

---

# 3. Domain-Driven Design

Notation: **AGG** = Aggregate root, **E** = Entity, **VO** = Value Object, **DE** = Domain Event, **DS** = Domain Service.

## 3.1 IAM / Authentication / Authorization

- **AGG** Identity { id, principalType, status, createdAt }
  - **E** Credential { type: password|passkey|otp|sso, secretRef }
  - **E** Session { id, deviceId, ip, userAgent, expiresAt }
  - **E** ApiKey { id, scopes, lastUsedAt }
- **VO** Email, PhoneE164, PasswordHash, MfaMethod, IpAddress, DeviceFingerprint, RoleAssignment(role, scope), Scope(tenantId, countryId, regionId, branchId, warehouseId).
- **DE** IdentityCreated, IdentityActivated, IdentitySuspended, LoginSucceeded, LoginFailed, MfaChallenged, MfaPassed, PasswordReset, ApiKeyIssued, ApiKeyRevoked, RoleGranted, RoleRevoked.
- **DS** PasswordPolicyService, RiskScoringService, PolicyDecisionService.

## 3.2 Users / Employees / HR

- **AGG** Employee { id, identityId, employmentType, status, hireDate, terminationDate? }
  - **E** Contract { id, type, startDate, endDate?, terms }
  - **E** Certification { type, number, issuedAt, expiresAt }
  - **E** Schedule, ShiftAssignment, Leave.
- **VO** Address, EmergencyContact, Salary(amount, currency, period), TaxId, Nationality.
- **DE** EmployeeOnboarded, EmployeeRoleChanged, ContractSigned, CertificationExpiring, EmployeeOffboarded.
- **DS** PayrollEligibilityService, ShiftPlanner.

## 3.3 Drivers

- **AGG** Driver { id, employeeId?, contractorId?, status, rating }
  - **E** Vehicle (link), Device, Shift, Trip.
- **VO** LicenseNumber, LicenseClass, License Validity, GeoFix(lat, lng, accuracy, ts), Heading, BatteryLevel.
- **DE** DriverShiftStarted, DriverShiftEnded, DriverLocationUpdated, DriverAssigned, DriverUnassigned, DriverPerformanceRated, HOSExceeded.
- **DS** DispatchService, DriverAvailabilityService.

## 3.4 Merchants

- **AGG** Merchant { id, legalName, status, kycLevel, tier, currency }
  - **E** MerchantUser, RateCard, ContractTerms, PickupLocation, BillingAccount, Integration.
- **VO** TaxId, Iban, BicSwift, Webhook(url, secret), MerchantTier.
- **DE** MerchantOnboarded, MerchantKycApproved, MerchantSuspended, RateCardActivated, IntegrationConnected.
- **DS** CreditLimitService, KycService.

## 3.5 Customers

- **AGG** Customer { id, type: registered|guest, locale, status }
  - **E** AddressBookEntry, ContactChannel, Preference.
- **VO** PreferredTimeWindow, ConsentScope, NotificationOptIn.
- **DE** CustomerCreated, CustomerVerified, CustomerOptedOut, AddressAdded.

## 3.6 Branches / Warehouses

- **AGG** Branch { id, code, name, type, country, region, city, status, hours, capacity }
  - **E** Counter, Safe, StaffRoster, ServiceAreaPolygon.
- **AGG** Warehouse { id, code, type: hub|spoke|cross-dock, hours, capacity }
  - **E** Zone, Aisle, Bin, Cage, Cart, DockDoor, Equipment.
- **VO** GeoPolygon, OperatingHours, CutoffTime.
- **DE** BranchOpened, BranchClosed, WarehouseInboundOpened, WarehouseCutoffReached.
- **DS** SortationPlanService, DockSchedulerService.

## 3.7 Fleet

- **AGG** Vehicle { id, plate, type, capacityWeightKg, capacityVolumeM3, status, ownership }
  - **E** MaintenanceRecord, FuelEntry, InsurancePolicy, TelematicsDevice.
- **VO** Vin, Plate, Odometer, FuelLevel, EmissionsClass.
- **DE** VehicleAssigned, VehicleOutOfService, MaintenanceScheduled, InsuranceExpiring.

## 3.8 Shipments

- **AGG** Shipment { id, awb, merchantId, originAddress, destinationAddress, service, status, codAmount, declaredValue, currency, references }
  - **E** Piece { id, dimensions, weight, barcode, status }
  - **E** ServiceAddon (insurance, fragile, signature-required, age-restricted)
  - **E** SpecialHandling (cold-chain, dangerous-goods)
  - **E** AttemptHistory, NoteEntry, Hold (compliance/security/customs).
- **VO** Awb (S10-compatible), Address, GeoPoint, Money, Weight, Dimensions(L,W,H,Unit), Volumetric, ServiceLevel, IncotermsForTrade, HsCode, Barcode.
- **DE** ShipmentCreated, ShipmentLabelIssued, ShipmentPickedUp, ShipmentArrivedAtHub, ShipmentDeparted, ShipmentArrivedAtBranch, ShipmentOutForDelivery, DeliveryAttempted, ShipmentDelivered, ShipmentReturned, ShipmentLost, ShipmentDamaged, ShipmentHeld, ShipmentReleased, ShipmentCancelled.
- **DS** PricingService, RoutingService, AddressService, AwbAllocator, ManifestService, CustomsDeclarationService.

## 3.9 Tracking

- **AGG** TrackingStream(shipmentId)
  - **E** TrackingEvent { id, type, ts, geo?, source, actor, payload }
- **VO** EventType (controlled vocab), EventSource (driver-app, warehouse, system, partner).
- **DE** TrackingEventAppended, TrackingEventCorrected, TrackingProjectionUpdated.
- **DS** EventOrderingService, ProjectionService, WebhookFanoutService.

## 3.10 Returns

- **AGG** Return { id, shipmentRef, type: rto|rts|customer-return|exchange, status }
  - **E** QcInspection, RestockEntry.
- **DE** ReturnInitiated, ReturnPickedUp, ReturnGraded, ReturnCompleted, ExchangeIssued.

## 3.11 COD

- **AGG** CodCollection { id, shipmentId, amount, currency, channel, status }
  - **E** DriverCashSession, BranchCashDeposit, BankReconciliationItem.
- **VO** PaymentChannel(cash|pos|wallet|link), DepositSlipNumber.
- **DE** CodCollected, CodSettledToBranch, CodDepositedToBank, CodReconciled, CodMissingReported.
- **DS** CashReconciliationService.

## 3.12 Finance

- **AGG** Invoice { id, merchantId, period, lines, taxes, totals, status }
- **AGG** SettlementBatch { id, merchantId, codItems, deductions, netAmount, status }
- **AGG** Payout { id, payee, channel, amount, status }
- **AGG** GeneralLedgerJournal { id, lines[] }
- **E** CreditNote, DebitNote, FxRate, TaxRule.
- **DE** InvoiceIssued, InvoicePaid, SettlementCreated, SettlementSent, PayoutCompleted, JournalPosted, PeriodClosed.
- **DS** TaxEngine, RevenueRecognitionService, FxService.

## 3.13 CRM / Support

- **AGG** Ticket { id, subject, requester, channel, priority, status, slaDueAt }
  - **E** Message, InternalNote, Attachment, Escalation.
- **AGG** Case (linked to a ticket cluster).
- **VO** Channel, Sla, CsatScore, NpsScore.
- **DE** TicketOpened, TicketAssigned, TicketEscalated, TicketResolved, TicketReopened, CsatRecorded.
- **DS** SlaService, RoutingService(tickets), KbService.

## 3.14 Notifications

- **AGG** NotificationRequest { id, channelCascade, template, locale, audience, payload, status }
- **E** DeliveryAttempt, ProviderResponse.
- **DE** NotificationQueued, NotificationSent, NotificationDelivered, NotificationFailed, NotificationOptOut.
- **DS** TemplateService, ProviderRouter, RateLimiter.

## 3.15 Analytics / Reporting

- **AGG** Dashboard, Report, MetricSnapshot, AlertRule.
- **DE** MetricThresholdBreached, ReportGenerated.
- **DS** KpiService, DataQualityService.

## 3.16 AI

- **AGG** Model { id, type, version, status }, Prediction { id, modelId, input, output, confidence }, Feedback.
- **DE** ModelDeployed, PredictionMade, FeedbackCaptured, DriftDetected.
- **DS** EtaService, RoutingOptimizer, FraudScorer, DemandForecaster, AddressNormalizer, SupportAgentService.

---

# 4. Workflow Analysis (State Machines)

Notation: `STATE → [event/condition] → STATE`. Every workflow includes happy path, exception branches, terminal states, compensating actions, SLAs, and required actors.

## 4.1 Shipment Creation Workflow

### States

`Draft → Validated → Priced → Labeled → Manifested → Awaiting Pickup → Cancelled (terminal)`

### Actors

Merchant Operator (or API integration), Pricing Service, Address Service, Customs Service (if cross-border), Dispatcher (for scheduled pickup).

### Transitions

- `(none) → Draft`: Merchant submits shipment payload (sender, recipient, pieces, service, COD, value, references).
- `Draft → Validated`: Address normalization succeeds, recipient phone valid, weight/dim within service limits, denied-party screening passes, hazmat checks pass, merchant credit OK.
- `Draft → Rejected (terminal)`: Validation fails (invalid address, blocked recipient, over credit limit, restricted item).
- `Validated → Priced`: Pricing engine computes price using rate card + surcharges + taxes; FX applied if needed.
- `Priced → Labeled`: AWB allocated, label and customs docs (if cross-border) generated; barcode reserved.
- `Labeled → Manifested`: Shipment added to a pickup manifest with pickup window.
- `Manifested → Awaiting Pickup`: Pickup scheduled, driver/route assigned (or queued for next sweep).
- `Draft|Validated|Priced|Labeled|Manifested → Cancelled`: Merchant cancels; if Labeled, AWB voided; if customs filed, declaration retracted.

### Rules

- AWB unique forever; voided AWBs are not reused.
- Label can be regenerated only while in `Labeled` or earlier.
- Address corrections allowed up to `Awaiting Pickup` (and limited window after pickup with surcharge).

### SLAs

- Validation < 2s P95.
- Pricing < 500ms P95.
- Label generation < 1s P95.

### Domain Events

ShipmentCreated, ShipmentValidated, ShipmentPriced, ShipmentLabelIssued, ShipmentManifested, ShipmentCancelled.

---

## 4.2 Pickup Workflow

### States

`Pickup Requested → Assigned → En Route → On Site → Picked Up → Failed Pickup → Rescheduled → Cancelled`

### Actors

Dispatcher, Driver, Merchant Operator, Routing Service.

### Transitions

- `Pickup Requested → Assigned`: Dispatcher assigns driver/vehicle, or auto-assign by routing service based on capacity and proximity.
- `Assigned → En Route`: Driver starts the stop in app; GPS tracked.
- `En Route → On Site`: Driver arrives within geofence of pickup address.
- `On Site → Picked Up`: Driver scans each piece's barcode; counts confirmed; shipper signs.
- `On Site → Failed Pickup`: Reason from controlled vocabulary (closed, not ready, refused, address wrong, safety risk).
- `Failed Pickup → Rescheduled`: New window scheduled; merchant notified.
- `Failed Pickup → Cancelled`: After max attempts (configurable per merchant tier) or merchant cancels.
- `Picked Up → (handoff to Sorting workflow)`.

### Rules

- A pickup must include all expected pieces or generate a `Discrepancy` flag.
- POP (Proof of Pickup) required: signature/photo/timestamp/geo.
- HOS limits enforced before assignment.

### SLAs

- Pickup attempt within agreed window (e.g., 2-hour slots) or breach event.
- Re-attempt within 24h unless merchant overrides.

### Events

PickupRequested, PickupAssigned, PickupEnRoute, PickupArrived, PickupCompleted, PickupFailed, PickupRescheduled, PickupCancelled, PickupDiscrepancyReported.

---

## 4.3 Sorting Workflow (at Hub/Branch)

### States

`Awaiting Sort → Scanned In → Sort Decision → Bin/Cage Assigned → Sorted → Mis-sort Flagged → Re-sorted → Staged for Outbound`

### Actors

Sorter, Warehouse Manager, Sortation Plan Service.

### Transitions

- `Awaiting Sort → Scanned In`: Piece barcode scanned at induction.
- `Scanned In → Sort Decision`: System computes destination (next leg, branch, route) based on shipment, cut-off times, capacity.
- `Sort Decision → Bin/Cage Assigned`: System lights up bin/cage (pick-to-light) or shows on handheld.
- `Bin/Cage Assigned → Sorted`: Worker confirms placement (scan bin + scan piece).
- `Sorted → Mis-sort Flagged`: Audit scan finds wrong bin → returned to induction.
- `Mis-sort Flagged → Re-sorted`: Corrective placement.
- `Sorted → Staged for Outbound`: Cage moved to outbound dock; manifest prepared.

### Rules

- Every piece must have a sort decision before cut-off; otherwise flagged "missed sort."
- Cage cannot ship without seal and manifest.
- Mis-sort rate is a tracked KPI per shift and per worker.

### SLAs

- Sort throughput (pieces per minute per induct).
- Cut-off compliance (% sorted before cut-off).

### Events

PieceInducted, SortDecided, PieceSorted, MisSortFlagged, CageStaged, OutboundManifested.

---

## 4.4 Warehouse Intake (Inbound Receiving)

### States

`Expected → Truck Arrived → Dock Assigned → Unloading → Scan-In → Reconciled → Exceptions Logged → Inbound Closed`

### Actors

Warehouse Manager, Receiver, Dock Scheduler.

### Transitions

- `Expected → Truck Arrived`: ASN matches truck arrival; gate logs.
- `Truck Arrived → Dock Assigned`: Dock door allocated.
- `Dock Assigned → Unloading`: Seal verified, broken intact; unload starts.
- `Unloading → Scan-In`: Each piece/cage scanned; quantity matches manifest.
- `Scan-In → Reconciled`: Counts equal manifest.
- `Scan-In → Exceptions Logged`: Over/short/damaged/wrong-destination items recorded.
- `Reconciled | Exceptions Logged → Inbound Closed`: Trip closed; pieces flow into Sorting.

### Rules

- Broken seal triggers security incident.
- Damaged-on-arrival photos required; auto-claim against carrier/3PL if applicable.
- Hazmat goods require separate dock and PPE check.

### Events

InboundExpected, TruckArrived, DockAssigned, UnloadingStarted, PieceReceived, ManifestReconciled, ExceptionLogged, InboundClosed.

---

## 4.5 Warehouse Transfer (Linehaul)

### States

`Load Plan Drafted → Cage/Pieces Loaded → Truck Sealed → Departed → In Transit → Arrived → Inbound Started → Closed`

### Actors

Warehouse Manager, Loader, Driver (linehaul), Routing Service.

### Transitions

- `Load Plan Drafted → Cage/Pieces Loaded`: Pieces scanned onto trip; vehicle weight/volume not exceeded.
- `Cage/Pieces Loaded → Truck Sealed`: Seal number recorded; manifest finalized.
- `Truck Sealed → Departed`: Driver starts trip; GPS tracking begins.
- `Departed → In Transit → Arrived`: Telematics-driven; ETA recomputed continuously.
- `Arrived → Inbound Started`: Hands off to Warehouse Intake at destination.
- `Inbound Started → Closed`: Reconciliation complete.

### Exception States

`Delayed`, `Mechanical Failure`, `Accident`, `Hijack/Security Event`, `Re-routed`.

### Rules

- Seal mismatch at destination triggers security incident.
- HOS limits enforced; relay drivers planned for long legs.

### Events

LinehaulPlanned, LinehaulLoaded, LinehaulSealed, LinehaulDeparted, LinehaulInTransitUpdate, LinehaulDelayed, LinehaulArrived, LinehaulClosed, SecurityIncidentRaised.

---

## 4.6 Delivery Workflow (Last-Mile)

### States

`Out for Delivery → En Route to Stop → Arrived at Stop → Recipient Verified → Delivered → Failed Delivery → Re-attempt Scheduled → Returned (RTO)`

### Actors

Driver, Customer, Dispatcher, Routing Service, Notification Service.

### Transitions

- `(from Branch) → Out for Delivery`: Loaded onto driver vehicle; route plan assigned.
- `Out for Delivery → En Route to Stop`: Driver moves to next stop.
- `En Route to Stop → Arrived at Stop`: Inside geofence.
- `Arrived at Stop → Recipient Verified`: OTP/ID/signature/age check as required.
- `Recipient Verified → Delivered`: POD captured (signature, photo, OTP code, ID match flag, geo).
- `Arrived at Stop → Failed Delivery`: Reason captured (not home, refused, address wrong, payment issue, etc.).
- `Failed Delivery → Re-attempt Scheduled`: Within configured policy.
- `Failed Delivery → Returned (RTO)`: Max attempts reached or merchant override; transitions to Return workflow.

### Rules

- COD must be collected before `Delivered` transition for COD shipments.
- Age-restricted: ID validated, age computed.
- Signature-required: cannot deliver without signature unless contactless waiver applies.
- Photo POD mandatory for high-value.

### SLAs

- On-time delivery (window compliance).
- First-attempt success rate.

### Events

OutForDelivery, ArrivedAtStop, RecipientVerified, DeliveryAttempted, DeliverySucceeded, DeliveryFailed, ReattemptScheduled, ShipmentReturnedToBranch.

---

## 4.7 Failed Delivery Workflow

### States

`Failed (reason) → Notify Customer → Customer Action → Re-attempt | Reschedule | Redirect | Hold at Branch | Return`

### Transitions

- `Failed → Notify Customer`: Multi-channel notification with reason and choices.
- `Customer Action → Re-attempt`: Same/next-day re-attempt within policy.
- `Customer Action → Reschedule`: New date and window picked by customer.
- `Customer Action → Redirect`: New address (within zone, may incur fee).
- `Customer Action → Hold at Branch`: Customer self-pickup; ID required.
- `Customer Action → Return`: Customer declines; goes to Return workflow.
- `No Customer Action within X hours → Default policy applies`: Per merchant config.

### Rules

- Redirects validated for service area and price recomputed if zone changes.
- Hold-at-branch creates a parcel in branch with expiry date.
- Maximum attempts enforced; final state must be Delivered, Returned, or Held-Expired.

### Events

DeliveryFailed, CustomerNotified, CustomerActionChosen, ShipmentRedirected, ShipmentHeldAtBranch, ShipmentReturnInitiated.

---

## 4.8 Return Process

### States

`Return Requested → Pickup Scheduled → Picked Up → In Transit → Received at Warehouse → QC Inspection → Graded → Restocked | Disposed | Refurbished | Returned to Merchant`

### Actors

Customer, Driver, Warehouse Receiver, QC Inspector, Merchant.

### Transitions

- `Return Requested → Pickup Scheduled`: Customer or system initiates; pickup window set.
- `Pickup Scheduled → Picked Up`: Driver collects; reverse AWB generated.
- `Picked Up → In Transit → Received at Warehouse`: Standard movement events.
- `Received at Warehouse → QC Inspection`: Photos, condition checklist.
- `QC Inspection → Graded`: A/B/C/D grade with reason.
- `Graded → Restocked | Disposed | Refurbished | Returned to Merchant`: Per merchant policy.

### Rules

- Tamper-evident packaging examined; mismatched returns flagged for fraud.
- Refunds (if platform handles them) released only after grade is confirmed (per merchant settings).

### Events

ReturnRequested, ReturnPickedUp, ReturnReceived, ReturnInspected, ReturnGraded, ReturnRestocked, ReturnDisposed, ReturnSentToMerchant.

---

## 4.9 COD Collection Workflow

### States

`COD Pending → Collected (Cash|Card|Wallet|Link) → Driver Cash Session Open → End-of-Shift Cash-up → Branch Safe Deposit → Bank Deposit → Reconciled → Available for Settlement`

### Actors

Driver, Branch Cashier, Finance Officer, Bank API.

### Transitions

- `COD Pending → Collected`: Captured at point of delivery.
- `Collected → Driver Cash Session Open`: Aggregated under driver shift.
- `Driver Cash Session Open → End-of-Shift Cash-up`: Driver counts cash; system reconciles vs expected.
- `End-of-Shift Cash-up → Variance Found`: Variance triggers investigation; locked until resolved.
- `End-of-Shift Cash-up → Branch Safe Deposit`: Cashier accepts cash, prints receipt.
- `Branch Safe Deposit → Bank Deposit`: Periodic bank deposit, slip captured.
- `Bank Deposit → Reconciled`: Bank statement matched.
- `Reconciled → Available for Settlement`: Funds eligible for merchant settlement batch.

### Rules

- Funds segregated per merchant.
- Variance > tolerance triggers HR/security review.
- Digital channels (POS/wallet/link) reconciled directly via PSP.

### Events

CodCollected, DriverCashSessionOpened, DriverCashSessionClosed, CashVarianceDetected, BranchDepositRecorded, BankDepositRecorded, CodReconciled, CodAvailableForSettlement.

---

## 4.10 Merchant Settlement Workflow

### States

`Eligible Items Pool → Batch Created → Deductions Applied → Approved → Payout Initiated → Payout Confirmed → Settled (terminal) | Failed → Retried`

### Actors

Finance Officer, Merchant, Payment Gateway/Bank.

### Transitions

- `Eligible Items Pool → Batch Created`: Per merchant settlement cycle (T+N, weekly, etc.).
- `Batch Created → Deductions Applied`: Service fees, COD fees, refunds, claims, tax.
- `Deductions Applied → Approved`: Finance approves (or auto-approval rule for trusted merchants).
- `Approved → Payout Initiated`: Bank or wallet transfer initiated.
- `Payout Initiated → Payout Confirmed`: Bank acknowledges.
- `Payout Confirmed → Settled`: Statement issued; merchant notified.
- `Payout Initiated → Failed`: Wrong IBAN, KYC issue, sanctions hit; remediation needed.

### Rules

- Cannot settle items in dispute or under hold.
- Statement immutable; corrections via credit/debit notes.

### Events

SettlementBatchCreated, DeductionsApplied, SettlementApproved, PayoutInitiated, PayoutConfirmed, PayoutFailed, SettlementClosed.

---

## 4.11 Customer Complaint Workflow

### States

`Submitted → Triaged → Investigating → Awaiting Customer | Awaiting Internal | Awaiting Merchant → Resolution Proposed → Accepted | Rejected → Closed | Reopened`

### Actors

Customer, Support Agent (L1/L2/L3), Branch/Warehouse owner, Finance (refunds), Quality.

### Transitions

- `Submitted → Triaged`: Category, priority, SLA assigned.
- `Triaged → Investigating`: Owner assigned; root-cause analysis.
- `Investigating → Awaiting *`: Pending information.
- `Investigating → Resolution Proposed`: Action (refund, re-delivery, claim, apology, credit).
- `Resolution Proposed → Accepted | Rejected`.
- `Accepted → Closed`: CSAT/NPS captured.
- `Closed → Reopened`: Within reopen window if customer dissatisfied.

### Rules

- SLA timers pause only on customer-pending.
- Linked to shipment(s); telemetry attached automatically.

### Events

ComplaintSubmitted, ComplaintTriaged, ComplaintInvestigating, ResolutionProposed, ComplaintResolved, ComplaintReopened.

---

## 4.12 Support Escalation Workflow

### States

`L1 → L2 → L3 → Specialist (Finance/Legal/Engineering) → Manager Override → Executive Brief`

### Triggers

- SLA breach.
- Severity (high-value, VIP, regulatory, safety).
- Customer request.
- Repeated reopens.

### Rules

- Each escalation hop logs reason, owner, ETA.
- Executive brief required for incidents that breach contractual SLAs or carry regulatory exposure.
- Post-mortems for sev-1 within 5 business days.

### Events

TicketEscalated, EscalationAccepted, EscalationDeclined, IncidentDeclared, PostMortemPublished.

---

# 5. User Roles & Permission Matrix

## 5.1 Role Catalog

| Role                         | Scope                    | Description                                                                                    |
| ---------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| Super Admin                  | Platform                 | Full control of platform configuration, tenants, security policies. Break-glass with approval. |
| CEO / Executive              | Tenant                   | Read-only across all data, executive dashboards, board reports.                                |
| Country Manager              | Country                  | P&L, ops oversight, regulatory compliance for a country.                                       |
| Regional Manager             | Region                   | Multi-branch oversight; performance and SLA.                                                   |
| Branch Manager               | Branch                   | Daily ops, staff, customer escalations, branch P&L.                                            |
| Dispatcher                   | Branch / Region          | Plan and assign pickup and delivery routes; manage exceptions.                                 |
| Warehouse Manager            | Warehouse                | Inbound/outbound, sortation, dock scheduling.                                                  |
| Warehouse Staff (Receiver)   | Warehouse                | Inbound scanning.                                                                              |
| Warehouse Staff (Sorter)     | Warehouse                | Sortation.                                                                                     |
| Warehouse Staff (Loader)     | Warehouse                | Outbound loading.                                                                              |
| Driver (Pickup)              | Mobile                   | Execute pickup routes.                                                                         |
| Driver (Linehaul)            | Mobile                   | Execute linehaul trips.                                                                        |
| Driver (Last-Mile)           | Mobile                   | Execute delivery routes.                                                                       |
| Finance Officer              | Tenant / Country         | Invoicing, settlements, payroll, reconciliation.                                               |
| HR Officer                   | Tenant / Country         | Hiring, contracts, schedules, certifications.                                                  |
| Support Agent L1             | Tenant                   | First-line tickets and chats.                                                                  |
| Support Agent L2             | Tenant                   | Investigations, refunds within limits, claims.                                                 |
| Support Agent L3             | Tenant                   | Complex cases, technical interaction with ops.                                                 |
| Compliance Officer           | Tenant                   | Customs, sanctions, data, audits.                                                              |
| Auditor (External)           | Read-only                | Tenant-scoped read with watermark.                                                             |
| Merchant Owner               | Merchant                 | Full merchant account.                                                                         |
| Merchant Operator            | Merchant                 | Day-to-day ops, ship/track/return.                                                             |
| Merchant Finance             | Merchant                 | Billing, settlement, statements.                                                               |
| Customer (Registered)        | Self                     | Track, manage shipments, complaints.                                                           |
| Customer (Guest)             | Self                     | Track by AWB + phone/email; limited actions.                                                   |
| Partner Carrier User         | Partner                  | Limited shipment and tracking access.                                                          |
| Customs Broker               | Tenant / Shipment-scoped | Customs documents and clearance.                                                               |
| Service Account / API Client | Scoped                   | Programmatic access via API key/OAuth.                                                         |

## 5.2 Permission Matrix (high-level)

Legend: ✓ allowed, R read-only, A approval required, — denied. Scope inherited unless noted.

| Capability                     | Super Admin | CEO | Country Mgr | Regional Mgr | Branch Mgr | Dispatcher | WH Mgr | WH Staff | Driver  | Finance | HR  | Support L1 | Support L2 | Support L3 | Merchant Own | Merchant Op | Merchant Fin | Customer |
| ------------------------------ | ----------- | --- | ----------- | ------------ | ---------- | ---------- | ------ | -------- | ------- | ------- | --- | ---------- | ---------- | ---------- | ------------ | ----------- | ------------ | -------- |
| Manage tenants & global config | ✓           | —   | —           | —            | —          | —          | —      | —        | —       | —       | —   | —          | —          | —          | —            | —           | —            | —        |
| Manage roles & policies        | ✓           | —   | A           | —            | —          | —          | —      | —        | —       | —       | —   | —          | —          | —          | A (own)      | —           | —            | —        |
| View executive KPIs            | ✓           | ✓   | ✓           | R            | R          | —          | R      | —        | —       | R       | —   | —          | —          | —          | R(own)       | —           | R(own)       | —        |
| Manage users (internal)        | ✓           | —   | ✓           | ✓            | ✓ (branch) | —          | ✓ (WH) | —        | —       | —       | ✓   | —          | —          | —          | —            | —           | —            | —        |
| Onboard merchants              | ✓           | —   | ✓           | ✓            | A          | —          | —      | —        | —       | A       | —   | —          | —          | —          | —            | —           | —            | —        |
| Approve KYC/KYB                | ✓           | —   | A           | —            | —          | —          | —      | —        | —       | A       | —   | —          | —          | —          | —            | —           | —            | —        |
| Configure rate cards           | ✓           | —   | ✓           | A            | —          | —          | —      | —        | —       | ✓       | —   | —          | —          | —          | R            | —           | R            | —        |
| Create shipment                | —           | —   | —           | —            | ✓          | ✓          | —      | —        | —       | —       | —   | ✓          | ✓          | ✓          | ✓            | ✓           | —            | ✓ (C2C)  |
| Edit pre-pickup shipment       | —           | —   | —           | —            | ✓          | ✓          | —      | —        | —       | —       | —   | ✓          | ✓          | ✓          | ✓            | ✓           | —            | R        |
| Cancel shipment                | —           | —   | —           | —            | ✓          | ✓          | —      | —        | —       | —       | —   | A          | ✓          | ✓          | ✓            | ✓           | —            | A        |
| Bulk import shipments          | —           | —   | —           | —            | ✓          | ✓          | —      | —        | —       | —       | —   | —          | —          | —          | ✓            | ✓           | —            | —        |
| Generate label/manifest        | —           | —   | —           | —            | ✓          | ✓          | —      | —        | —       | —       | —   | ✓          | ✓          | ✓          | ✓            | ✓           | —            | —        |
| Schedule pickup                | —           | —   | —           | —            | ✓          | ✓          | —      | —        | —       | —       | —   | ✓          | ✓          | ✓          | ✓            | ✓           | —            | —        |
| Assign driver                  | —           | —   | —           | —            | ✓          | ✓          | —      | —        | —       | —       | —   | —          | —          | A          | —            | —           | —            | —        |
| Drive route / capture POD      | —           | —   | —           | —            | —          | —          | —      | —        | ✓       | —       | —   | —          | —          | —          | —            | —           | —            | —        |
| Inbound scan / receive         | —           | —   | —           | —            | —          | —          | ✓      | ✓        | —       | —       | —   | —          | —          | —          | —            | —           | —            | —        |
| Sort pieces                    | —           | —   | —           | —            | —          | —          | ✓      | ✓        | —       | —       | —   | —          | —          | —          | —            | —           | —            | —        |
| Outbound load / seal           | —           | —   | —           | —            | —          | —          | ✓      | ✓        | —       | —       | —   | —          | —          | —          | —            | —           | —            | —        |
| Initiate transfer              | —           | —   | —           | —            | A          | A          | ✓      | —        | —       | —       | —   | —          | —          | —          | —            | —           | —            | —        |
| Place hold (compliance)        | ✓           | —   | ✓           | A            | A          | —          | A      | —        | —       | —       | —   | —          | —          | A          | —            | —           | —            | —        |
| Release hold                   | ✓           | —   | ✓           | A            | —          | —          | —      | —        | —       | —       | —   | —          | —          | A          | —            | —           | —            | —        |
| Initiate return                | —           | —   | —           | —            | ✓          | ✓          | ✓      | —        | —       | —       | —   | ✓          | ✓          | ✓          | ✓            | ✓           | —            | ✓        |
| Grade returned items           | —           | —   | —           | —            | —          | —          | ✓      | ✓        | —       | —       | —   | —          | —          | —          | —            | —           | —            | —        |
| Collect COD                    | —           | —   | —           | —            | —          | —          | —      | —        | ✓       | —       | —   | —          | —          | —          | —            | —           | —            | —        |
| Reconcile branch cash          | —           | —   | —           | —            | ✓          | —          | —      | —        | —       | ✓       | —   | —          | —          | —          | —            | —           | —            | —        |
| Approve settlement             | —           | —   | A           | —            | —          | —          | —      | —        | —       | ✓       | —   | —          | —          | —          | —            | —           | R            | —        |
| Manage payroll                 | —           | —   | A           | —            | —          | —          | —      | —        | —       | ✓       | ✓   | —          | —          | —          | —            | —           | —            | —        |
| Issue refund / credit note     | —           | —   | A           | —            | A          | —          | —      | —        | —       | ✓       | —   | —          | A          | A          | —            | —           | —            | —        |
| View shipment tracking         | ✓           | ✓   | ✓           | ✓            | ✓          | ✓          | ✓      | ✓        | ✓ (own) | R       | —   | ✓          | ✓          | ✓          | ✓ (own)      | ✓ (own)     | R            | ✓ (own)  |
| Public tracking page           | —           | —   | —           | —            | —          | —          | —      | —        | —       | —       | —   | —          | —          | —          | —            | —           | —            | ✓        |
| Manage tickets                 | —           | —   | R           | R            | R          | —          | —      | —        | —       | —       | —   | ✓          | ✓          | ✓          | ✓ (own)      | ✓ (own)     | —            | ✓ (own)  |
| Escalate ticket                | —           | —   | —           | —            | —          | —          | —      | —        | —       | —       | —   | ✓          | ✓          | ✓          | ✓            | ✓           | —            | ✓        |
| Manage SLAs                    | ✓           | —   | ✓           | A            | —          | —          | —      | —        | —       | —       | —   | —          | —          | —          | —            | —           | —            | —        |
| Configure notifications        | ✓           | —   | ✓           | A            | A          | —          | —      | —        | —       | —       | —   | —          | —          | —          | ✓ (own)      | —           | —            | ✓ (self) |
| Run reports                    | ✓           | ✓   | ✓           | ✓            | ✓          | R          | ✓      | —        | —       | ✓       | ✓   | R          | R          | R          | ✓ (own)      | R           | ✓ (own)      | —        |
| Configure AI policies          | ✓           | —   | A           | —            | —          | —          | —      | —        | —       | —       | —   | —          | —          | —          | —            | —           | —            | —        |
| API key / Webhook config       | ✓           | —   | ✓           | —            | —          | —          | —      | —        | —       | —       | —   | —          | —          | —          | ✓            | A           | —            | —        |
| Audit log access               | ✓           | R   | R           | —            | —          | —          | —      | —        | —       | R       | —   | —          | —          | —          | R (own)      | —           | R (own)      | —        |
| Break-glass access             | ✓ (A)       | —   | —           | —            | —          | —          | —      | —        | —       | —       | —   | —          | —          | —          | —            | —           | —            | —        |

Notes:

- "A" indicates the role can request the action but it requires a separate approval.
- "(own)" means restricted to records owned by the merchant or the customer themselves.
- All write actions are subject to ABAC scope (tenant, country, region, branch, warehouse) and segregation of duties for finance.

## 5.3 Segregation of Duties (SoD) Examples

- A user who creates settlement batches cannot approve them.
- A user who collects COD cannot reconcile bank deposits for the same merchant.
- A user who edits HR salary data cannot approve payroll.
- A user who creates a shipment cannot also force-deliver it without POD.

---

# 6. Frontend Product Design (Portals)

Six primary front-end products, all sharing one design system and component library, all WCAG 2.2 AA, all responsive (web breakpoints sm/md/lg/xl/2xl) or native mobile.

1. **Admin Portal** (Super Admin / CEO / Country Mgr / Compliance / Finance / HR / Platform Ops)
2. **Internal Operations Portal** (Branch Mgr / Dispatcher / WH Mgr / WH Staff / Support / Regional Mgr)
3. **Merchant Portal** (Merchant Owner/Operator/Finance)
4. **Customer Portal & Public Tracking** (Customers, guests)
5. **Driver Mobile App** (Drivers)
6. **Warehouse Handheld App** (WH Staff scanners) — companion to Internal Ops Portal

> Auxiliary: **Developer Portal** (API docs, sandbox, keys, webhooks) and **Status Page**.

---

## 6.1 Admin Portal

### Navigation Structure (Top-level, Left Sidebar)

- Dashboard
- Tenants
- Organizations (Countries, Regions, Branches, Warehouses)
- Users & Roles
- Merchants
- Pricing & Rate Cards
- Service Catalog (services, surcharges, holidays, cut-offs)
- Fleet & Vehicles
- Compliance (Customs, Sanctions, DG)
- Finance Center
- HR Center
- Notifications & Templates
- Integrations
- API & Webhooks
- AI / Models
- Audit Log
- System Health
- Settings

### Pages and Subpages

- **Dashboard**
  - Executive KPIs
  - SLA Heatmap (country/region/branch)
  - Incidents
  - Financial summary
- **Tenants**
  - Tenants list → Tenant detail (overview, branding, domains, plans, billing, usage, security)
- **Organizations**
  - Countries list → Country detail (regions, branches, holidays, working hours)
  - Regions list → detail
  - Branches list → Branch detail (staff, hours, service area, capacity, safe)
  - Warehouses list → Warehouse detail (zones/aisles/bins, dock doors, equipment, layout map)
- **Users & Roles**
  - Users list → User detail (profile, roles, sessions, audit)
  - Roles & Policies → Role detail (capabilities, scopes), Policy editor (ABAC)
  - Access Reviews
- **Merchants**
  - Merchants list → Merchant detail (overview, KYC, contracts, rate cards, integrations, locations, billing, COD config, users, API keys, audit)
  - Onboarding Queue
- **Pricing & Rate Cards**
  - Rate Cards list → editor (zones, weight breaks, dim factor, surcharges, fuel index, COD fees, taxes, valid-from/to)
  - Promotions / Discounts
  - Currency / FX rates
- **Service Catalog**
  - Services (Same-day, Next-day, etc.)
  - Surcharges
  - Holidays
  - Cut-offs / Working hours
- **Fleet & Vehicles**
  - Vehicles list → Vehicle detail (telematics, maintenance, insurance, drivers, utilization)
  - Maintenance schedules
  - Telematics providers
- **Compliance**
  - Sanctions / Denied parties
  - HS code library
  - Dangerous goods rules
  - Customs templates
  - Data residency policies
  - Audits & Certifications
- **Finance Center**
  - Invoices
  - Settlements
  - COD reconciliation
  - Payouts
  - Tax configuration
  - GL exports
  - Periods (close/reopen)
- **HR Center**
  - Employees
  - Schedules / Shifts
  - Leaves
  - Certifications
  - Payroll inputs
- **Notifications & Templates**
  - Templates (multi-locale)
  - Cascading rules
  - Provider configuration
  - Throttling and quiet hours
- **Integrations**
  - Marketplaces (Shopify, Woo, Magento, Salla, Zid, Shopline)
  - ERPs (SAP, Oracle, NetSuite, Dynamics)
  - Banks / PSPs
  - Telematics
  - Customs systems
- **API & Webhooks**
  - API keys, scopes
  - Webhook endpoints, retries, signatures
  - API logs / quotas
- **AI / Models**
  - Models list, versions, status
  - Datasets, evaluations
  - Decision policies
  - Drift / monitoring
- **Audit Log**
  - Filterable, signed, exportable
- **System Health**
  - SLOs, error budgets, incident timeline
- **Settings**
  - Branding, domains, SSO, security policies, data export, account deletion

### Key User Journeys (Admin)

- Onboard a new merchant end-to-end (account → KYC → contract → rate card → API key).
- Configure a new country (regulations, currencies, holidays, zones, branches, working hours).
- Investigate an SLA breach (drill from KPI → branch → driver → shipment → events → ticket).
- Close a financial period (validate, lock, export GL).
- Roll out a new AI model (canary → metrics → promote).

---

## 6.2 Internal Operations Portal

### Navigation

- Operations Dashboard
- Shipments
- Pickups
- Dispatch Board
- Routes
- Warehouse (Inbound, Sortation, Outbound, Stock)
- Linehaul
- Branch Console
- Drivers (live, scheduling, performance)
- Support (Tickets, Calls, Chats)
- Customers & Merchants (search, profile)
- Cash & Safe
- Incidents
- Scans / Audits
- Reports

### Pages and Subpages

- **Operations Dashboard**: Live ops KPIs, exception queue, regional map.
- **Shipments**
  - List (filters: status, service, merchant, branch, date)
  - Detail: timeline, pieces, parties, documents, financials, events, communications, holds, actions (cancel, redirect, reschedule, RTO).
- **Pickups**
  - Board (today/tomorrow), Map, By driver
  - Detail: stops, pieces, ETA, exceptions
- **Dispatch Board**
  - Routes (drag-and-drop), Driver pool, Vehicles, Capacity bars
  - Optimize / Re-balance / Lock
- **Routes**
  - Active routes with live progress
  - Historical routes for analysis
- **Warehouse**
  - Inbound: arrivals, dock board, exceptions
  - Sortation: induction, mis-sort flags, throughput
  - Outbound: load plans, sealed trucks, manifests
  - Stock & Holds: parcels at branch, hold-at-branch, aging
- **Linehaul**
  - Trips list, trip detail (telematics, ETA, security events)
- **Branch Console**
  - Counter intake (drop-off shipments)
  - Customer pickup (hold-at-branch)
  - Local cash safe
- **Drivers**
  - Live map, shifts, HOS, performance, incidents
- **Support**
  - Inbox, queues, ticket detail, macros, KB
  - Call console (telephony integration)
- **Customers & Merchants**
  - 360° profile with linked shipments, tickets, communications
- **Cash & Safe**
  - Driver cash sessions, branch safe, deposits, variances
- **Incidents**
  - Security, damage, accident, hijack, delays
- **Scans / Audits**
  - Re-scan tools, count audits, missing scans
- **Reports**: Pre-built and custom.

### Key User Journeys (Internal Ops)

- Dispatcher builds tomorrow's last-mile routes with constraints, optimizes, locks, publishes to drivers.
- WH Manager handles a damaged-on-arrival exception (photo → claim → restow).
- Branch Manager performs end-of-day cash-up with discrepancies.
- Support Agent investigates a "delivered but not received" claim using POD, geo, and driver chat.

---

## 6.3 Merchant Portal

### Navigation

- Dashboard
- Shipments (Create, Bulk, List)
- Pickups
- Returns
- COD & Settlements
- Invoices
- Wallet (if prepaid model)
- Address Book
- Locations (Pickup/Drop/Return)
- Catalog (SKUs)
- Integrations
- API Keys & Webhooks
- Reports & Analytics
- Notifications
- Team & Roles
- Settings (Profile, Billing, KYC, Branding, Tracking page)
- Help

### Pages and Subpages

- **Dashboard**: KPI tiles (volume, success rate, returns rate, COD pipeline, NPS), trend charts, alerts.
- **Shipments**
  - Create (single): form with smart defaults (sender, recipient lookup, service, COD, value, references)
  - Create (bulk): CSV/XLSX upload, mapper, validation report, commit
  - Create (API): code samples, sandbox
  - List: filters, saved views
  - Detail: status, timeline, documents (label, invoice, customs), notes, actions
- **Pickups**: Schedule, list, calendar view, map.
- **Returns**: Initiate, track, grade results (read), policy.
- **COD & Settlements**
  - COD Pipeline (Pending → Collected → Reconciled → Settled)
  - Settlement Batches
  - Statements
- **Invoices**: List, detail, download.
- **Wallet**: Top-up, transactions, low-balance alerts.
- **Address Book**: Recipients/senders.
- **Locations**: Pickup/drop/return locations and time windows.
- **Catalog**: SKUs (HS codes, dims, weight) for fast shipping.
- **Integrations**: Connect Shopify/Woo/Magento/Salla/Zid; ERPs.
- **API Keys & Webhooks**: Manage, rotate, view logs.
- **Reports & Analytics**: Performance, costs, regions, returns, NPS.
- **Notifications**: Branded templates, sender IDs.
- **Team & Roles**: Invite, scope, MFA enforcement.
- **Settings**: Profile, KYC, branding (tracking page, label logo, sender names), billing.
- **Help**: KB, contact support, status.

### Key User Journeys (Merchant)

- Onboard, connect Shopify, do first shipment within 10 minutes.
- Bulk-ship 5,000 orders for a flash sale.
- Reconcile yesterday's COD and download the statement.
- Reduce returns: use analytics to identify problem regions/SKUs.

---

## 6.4 Customer Portal & Public Tracking

### Navigation (registered)

- Track
- My Shipments
- Address Book
- Preferences
- Returns
- Help / Tickets
- Profile / Security

### Pages

- **Track (Public, white-labeled)**: AWB lookup, timeline, ETA, map, recipient actions (reschedule, redirect, hold-at-branch, contact).
- **My Shipments**: List, detail, history.
- **Address Book**: Saved recipients.
- **Preferences**: Time windows, languages, channels, do-not-contact.
- **Returns**: Initiate return for an order; track return.
- **Help / Tickets**: Open complaint, view status, chat with support.
- **Profile / Security**: Profile, password, MFA, sessions, downloads (PII export), account deletion.

### Key User Journeys (Customer)

- Track a parcel and reschedule a delivery.
- File a complaint and receive a refund or re-delivery.
- Self-pickup at branch with OTP and ID.

---

## 6.5 Developer Portal (auxiliary but needed)

- Getting Started, Authentication, Webhooks, API Reference, SDKs (JS/PHP/Python/.NET/Java/Ruby/Go), Plugins (Shopify/Woo/Magento/Salla/Zid), Sandbox, Postman collection, Changelog, Status, Support.

---

## 6.6 Cross-portal Patterns

- Global search (cmd-K): jump to shipment, merchant, customer, ticket, driver.
- Notifications center.
- Saved views and shareable URLs for filtered lists.
- Bulk actions with confirmation and undo where reversible.
- Print-friendly templates (labels, manifests, statements).
- Dark and light themes; dark default per design system.
- RTL mirrored layouts for Arabic/Hebrew.

---

# 7. UI Design Analysis (Screens)

For each screen: Purpose, Layout, Widgets/Components, Actions, States (default, loading, empty, error, success, partial). All screens follow the Dashboard design system (dark-first, IBM Plex Sans, 8pt grid, glass panels, rounded), tokens for primary/neutral/success/warning/danger, focus-visible states, 44px+ hit areas, RTL-ready.

> Convention: each screen description is concise and structured. Loading/Empty/Error patterns are defined once at the end and referenced.

## 7.1 Common State Patterns (referenced by every screen)

- **Loading**: Skeletons mirroring the final layout; shimmer at low intensity; deferred spinners only after 400ms; preserve heading and primary action.
- **Empty**: Illustration + one-sentence reason + primary CTA + helper link. Non-judgmental tone.
- **Error**: Inline banner with cause, recovery action, and request ID; never blame the user; preserve user input.
- **Partial**: Mixed success/failure summaries with row-level statuses (used in bulk actions).
- **Stale**: "Last updated X ago" with a refresh affordance.
- **Permission Denied**: Clear reason and contact path; no UI dead ends.
- **Throttled**: "Try again in N seconds" with retry-after timer.

## 7.2 Authentication Screens (all portals)

### 7.2.1 Sign In

- Purpose: Authenticate users.
- Layout: Centered card on muted background; brand mark; language selector top-right.
- Widgets: TextInput (email/phone), PasswordInput, Button (Sign in), Link (forgot, SSO), Switch (remember device), Captcha (risk-based).
- Actions: Submit, switch to SSO, magic-link, passkey.
- States: default, validating, MFA required, locked-out, throttled, error.

### 7.2.2 MFA Challenge

- Purpose: Step-up auth.
- Widgets: OTPInput (6/8 digits), method switcher (TOTP/SMS/WebAuthn), resend button with cooldown.
- States: default, sending, error, expired, success.

### 7.2.3 Forgot / Reset Password

- Widgets: TextInput (identifier), success message, new password fields with strength meter.
- States: default, sent, expired-link, success, error.

### 7.2.4 SSO Callback

- Widgets: progress indicator, fallback "Try again" CTA on failure.

### 7.2.5 Account Locked / Suspended

- Widgets: Alert, contact-support CTA, request-ID display.

## 7.3 Admin Portal Screens

### 7.3.1 Admin Dashboard

- Purpose: Executive overview.
- Layout: 12-col grid: KPI strip (top), trend charts (mid-left), SLA heatmap (mid-right), incidents (bottom).
- Widgets: KPI cards, line/area charts, heatmap, incident list, region map.
- Actions: filter by tenant/country/date, export, drill-down.
- States: per 7.1; no-data state for new tenants.

### 7.3.2 Tenants List / Detail

- Widgets: DataGrid, search, filters, status pills, actions menu; detail drawer with tabs (Overview, Branding, Domains, Plans, Billing, Usage, Security, Audit).

### 7.3.3 Country / Region / Branch / Warehouse Management

- Widgets: Tree view (hierarchy), map with polygons (service area editor), capacity sliders, hours editor, holiday calendar, staff roster table.

### 7.3.4 Users & Roles

- Widgets: DataGrid (users), filter chips, Drawer (user detail with sessions and audit), Role editor (capability tree), Policy editor (ABAC builder), Access review wizard.

### 7.3.5 Merchant Detail

- Widgets: Tabs (Overview, KYC, Contracts, Rate Cards, Locations, Integrations, Users, API, COD, Billing, Audit), KYC checklist, document viewer, contract editor, rate-card editor, integration cards.

### 7.3.6 Rate Card Editor

- Widgets: Zone matrix (origin × destination), weight breaks editor, dim factor input, surcharges list, fuel index curve, valid-from/to date pickers, simulator (input shipment to see price).

### 7.3.7 Service Catalog

- Widgets: Service list, service editor (transit time matrix, exceptions), surcharge list, holiday calendar, working-hours editor.

### 7.3.8 Fleet & Vehicles

- Widgets: DataGrid, vehicle detail (telematics map, maintenance timeline, insurance, drivers), maintenance scheduler.

### 7.3.9 Compliance

- Widgets: Sanctions list import, HS code search, DG rule editor, customs template library, residency map, audit timeline.

### 7.3.10 Finance Center

- Subscreens:
  - Invoices (list, detail), Settlements (batch builder, batch detail), COD Reconciliation (variance grid), Payouts (status table), Tax (rule editor), GL Export (job runner), Periods (close/reopen wizard).
- Widgets: DataGrids with totals, drawer details, charts (revenue, AR aging), wizards.

### 7.3.11 HR Center

- Widgets: Employee grid, schedule planner (calendar), shift swap board, certifications dashboard with expiry alerts.

### 7.3.12 Notifications & Templates

- Widgets: Template editor (multi-locale tabs), preview pane (all channels), cascade rule builder, throttling editor.

### 7.3.13 Integrations

- Widgets: Catalog grid (logos), connection wizard, connection health card, mapping editor.

### 7.3.14 API & Webhooks

- Widgets: Keys table, scope selector, webhook endpoints with retry chart, signing secret, replay tool, log explorer.

### 7.3.15 AI / Models

- Widgets: Model registry table, version detail (metrics, drift, slices), policy editor (canary, traffic split), feedback inspector.

### 7.3.16 Audit Log

- Widgets: Faceted filters (actor, action, scope, time), table with chain-of-custody hash, JSON viewer, export.

### 7.3.17 System Health

- Widgets: SLO dials, error-budget burn, incident timeline, dependency map.

### 7.3.18 Settings (Admin)

- Widgets: Branding form, domain manager, SSO config, security policies, data export, deletion request flow.

## 7.4 Internal Operations Portal Screens

### 7.4.1 Operations Dashboard

- Layout: Live KPI strip, exception queue (left), regional map (center), shift-leader notes (right).
- Widgets: KPI cards, exception list, map with live truck/driver pins, alerts feed.

### 7.4.2 Shipments List / Detail

- List: DataGrid with saved views, faceted filters, bulk actions (assign, hold, release, redirect, RTO).
- Detail: Header (AWB, status, ETA, actions), Tabs:
  - Timeline (TrackingTimeline)
  - Pieces (table with weights, dims, barcodes)
  - Parties (sender, recipient, billing)
  - Documents (label, invoice, customs, POD)
  - Financials (charges, COD, taxes)
  - Communications (notifications log)
  - Holds & Notes
  - Map (current location)
  - Audit
- Actions: Cancel, Re-label, Edit (pre-pickup), Redirect, Reschedule, Hold-at-branch, Force-RTO, Add note, Contact sender/recipient, Open ticket.

### 7.4.3 Pickup Board

- Layout: Tabs (List, Map, By Driver), filter chips, capacity bars.
- Widgets: KanbanBoard (Requested → Assigned → En Route → Picked → Failed), map, route list.

### 7.4.4 Dispatch Board

- Layout: Three columns (Routes, Drivers, Vehicles) with drag-and-drop; capacity meters; constraints panel.
- Widgets: Route cards, DriverCard, VehicleCard, ConstraintList (zones, HOS, vehicle type), Optimize CTA, Lock route, Publish to drivers.
- Actions: Auto-assign, manual swap, split route, merge stops, freeze, broadcast.

### 7.4.5 Route Detail (Live)

- Widgets: Map with polylines and stop pins, stop list with statuses, driver-card, ETA chart, exceptions feed, re-optimize CTA.

### 7.4.6 Warehouse — Inbound

- Widgets: Dock board (Gantt), arrivals list, exception queue, scan-progress meter, photo evidence gallery.

### 7.4.7 Warehouse — Sortation

- Widgets: Live throughput chart, induct lanes, mis-sort flag list, sorter leaderboard, cut-off countdown.

### 7.4.8 Warehouse — Outbound

- Widgets: Load plans, truck list, seal capture, manifest preview, departure board.

### 7.4.9 Stock & Holds (at Branch/WH)

- Widgets: DataGrid (parcels at facility), aging bar, hold reasons, reminders, expiry actions.

### 7.4.10 Linehaul Trips

- Widgets: Trip list, trip detail (map, telematics, sealed-status, ETA), security incidents.

### 7.4.11 Branch Console

- Widgets: Counter intake form, customer-pickup OTP form, local safe summary, day-end checklist.

### 7.4.12 Drivers (Live)

- Widgets: Live map, driver list, status pills (active, on-break, idle), HOS bars, recent events feed, contact-driver action.

### 7.4.13 Support — Inbox

- Widgets: Queue list, ticket list, ticket detail (timeline, customer profile, linked shipments, macros, KB suggestions), call console (dialer, recording, transfer), chat panel.

### 7.4.14 Customer / Merchant 360°

- Widgets: Profile header, KPI strip (volume, success, NPS), tabs (Shipments, Tickets, Communications, Financials, Notes), timeline.

### 7.4.15 Cash & Safe

- Widgets: Driver cash sessions table, variance flags, branch safe ledger, bank deposit form, reconciliation grid.

### 7.4.16 Incidents

- Widgets: Severity board, incident detail (timeline, evidence, owners), post-mortem template.

### 7.4.17 Scans & Audits

- Widgets: Re-scan wizard, missing-scan finder, count audit form, label-print queue.

### 7.4.18 Reports (Internal)

- Widgets: Report library, scheduler, builder (drag-and-drop fields), export.

## 7.5 Merchant Portal Screens

### 7.5.1 Merchant Dashboard

- KPI strip (today's volume, in-transit, success rate, returns rate, COD pipeline, NPS).
- Charts: trend, by region, by service.
- Alerts: failed pickups, undelivered aging, balance low.

### 7.5.2 Create Shipment (Single)

- Form sections: Sender (default), Recipient (lookup or new), Pieces (rows), Service & Options, COD & Value, References.
- Widgets: AddressLookup, AddressMapPicker, PiecesEditor (dims, weight, declared value, contents, HS), ServiceSelector, MoneyInput, ReferenceFields, PriceQuoteCard, ETACard, ActionBar (Save Draft, Get Label).
- States: validating address, price recalculation, label generation, error per field.

### 7.5.3 Create Shipment (Bulk)

- Steps: Upload → Map fields → Validate → Review → Commit.
- Widgets: FileDropzone, MappingTable, ValidationReport (row-level), ProgressBar, SuccessSummary.

### 7.5.4 Shipments List

- Widgets: Filter chips, saved views, DataGrid, bulk actions, export, label re-print.

### 7.5.5 Shipment Detail (Merchant)

- Tabs: Tracking timeline, pieces, documents, notes, communications, financials, actions (cancel, edit pre-pickup, request RTO).

### 7.5.6 Pickups

- Widgets: Calendar/map, schedule form, recurring pickups.

### 7.5.7 Returns

- Widgets: Initiate flow, list, detail, grading results.

### 7.5.8 COD & Settlements

- Widgets: Pipeline funnel (Pending → Collected → Reconciled → Settled), settlement batches table, batch detail, statement download.

### 7.5.9 Invoices

- Widgets: Invoice list, invoice viewer, payment status.

### 7.5.10 Wallet (if used)

- Widgets: Balance card, top-up flow, transactions list.

### 7.5.11 Address Book / Locations / Catalog

- Standard CRUD grids with import/export.

### 7.5.12 Integrations

- Widgets: Catalog cards, OAuth connect flows, mapping editor (order → shipment), sync history.

### 7.5.13 API Keys & Webhooks (Merchant)

- Widgets: Keys table with scopes, webhook endpoints with retries, signing secret, log explorer (read-only), sandbox link.

### 7.5.14 Reports & Analytics (Merchant)

- Widgets: KPI cards, charts, region heatmap, top failure reasons, NPS timeline, export, schedule.

### 7.5.15 Notifications (Merchant)

- Widgets: Branded template editor, preview by channel, sender-ID management.

### 7.5.16 Team & Roles (Merchant)

- Widgets: Members table, invite modal, MFA enforcement toggle, scope editor.

### 7.5.17 Settings (Merchant)

- Profile, KYC, Branding (logo, colors, tracking page), Billing, Domains, Webhooks.

### 7.5.18 Help

- Widgets: KB search, ticket list, status indicator.

## 7.6 Customer Portal & Public Tracking

### 7.6.1 Public Tracking Page

- Purpose: Track without login.
- Layout: Hero with AWB input → result with timeline, ETA, map, recipient actions.
- Widgets: TrackingTimeline, ETACard, MapView with stops, ActionList (Reschedule, Redirect, Hold-at-branch, Contact, Add note), POD preview when delivered.
- States: not-found, multiple-results, OTP gate (for sensitive actions).

### 7.6.2 Customer Dashboard (registered)

- KPI strip (active, delivered this month, returns), shipment list.

### 7.6.3 Shipment Detail (Customer)

- Subset of internal detail; communications log; ticket button; review button.

### 7.6.4 Address Book

- CRUD with map.

### 7.6.5 Preferences

- Channels, time windows, language, do-not-contact, accessibility (reduced motion, high contrast).

### 7.6.6 Returns (Customer)

- Initiate return wizard, list, status.

### 7.6.7 Help / Tickets

- Open complaint, my tickets, KB.

### 7.6.8 Profile / Security

- Profile, password, MFA, sessions, downloads, deletion.

---

# 8. Complete Widget Inventory

A canonical, design-system component library shared by all portals. Every component is keyboard-operable, screen-reader friendly, RTL-aware, supports dark/light, and exposes loading/error/disabled/focus states. Tokens come from the Dashboard design system (primary `#0C5CAB`, surface `#09090b`, text `#fafafa`, etc.).

## 8.1 Inputs

### Text & Form

- TextInput (single line, with prefix/suffix, helper, error)
- TextArea (auto-resize, max-length counter)
- PasswordInput (show/hide, strength meter)
- SearchInput (with clear, debounced, suggestions dropdown)
- NumberInput (with min/max, steppers, formatted display)
- MoneyInput (currency selector, locale formatting)
- PhoneInput (E.164, country code search)
- EmailInput (format validation)
- UrlInput
- TagsInput (chips)
- CodeInput (monospace block)
- MaskedInput (custom masks)

### Selection

- Select (single)
- MultiSelect (chips)
- ComboBox (typeahead with create-new option)
- Cascader (hierarchical select)
- TreeSelect
- AutoComplete (server-driven suggestions)
- Checkbox
- CheckboxGroup
- Radio
- RadioGroup / SegmentedControl
- Switch / Toggle
- ToggleGroup (multi-state)
- Slider (single + range)
- Rating
- ColorPicker

### Date & Time

- DatePicker
- DateRangePicker
- TimePicker
- DateTimePicker
- TimeWindowPicker (logistics-specific: pick-up windows)
- HolidayAwareCalendar

### Specialized

- OTPInput (4/6/8 digits, paste-aware)
- FileDropzone (drag-and-drop, multi)
- FileInput (single)
- ImageUpload (preview, crop)
- SignaturePad
- BarcodeScannerInput (camera + handheld)
- AddressInput (smart fields per country, lookup)
- AddressMapPicker (drop pin, polygon-aware service area)
- GeoCoordinateInput
- WeightInput (unit toggle kg/lb)
- DimensionsInput (LxWxH with unit)
- HsCodeSelector (with description search)
- LanguagePicker
- CurrencyPicker
- TimezonePicker

## 8.2 Layout & Structure

- AppShell (Sidebar + Header + Footer + Content)
- Sidebar (collapsible, multi-level, RTL-mirrored)
- TopHeader (logo, global search, environment indicator, notifications, profile)
- Footer (legal, status, language)
- Container (max-width responsive)
- Grid (12-col responsive)
- Stack (vertical/horizontal with spacing tokens)
- Cluster (wrap-friendly inline group)
- Section / Panel (glass surface)
- Card (header/body/footer, with actions)
- Tabs (horizontal/vertical, scrollable)
- Accordion / Collapsible
- Splitter / Resizable Panes
- Drawer (left/right/bottom)
- Modal / Dialog (small/medium/large, scrollable)
- Sheet (mobile bottom sheet)
- Popover
- HoverCard
- Tooltip
- ContextMenu
- DropdownMenu
- CommandPalette (cmd-K)
- Stepper / Wizard
- BreadcrumbBar
- PageHeader (title, description, breadcrumbs, primary actions)
- TwoColumnLayout / ThreeColumnLayout
- Masonry (for galleries)
- StickyToolbar / FloatingActionBar
- ScrollArea (custom scrollbars)
- ResizeObserver wrapper
- VirtualList / VirtualGrid
- PrintableSheet (label, manifest, statement)

## 8.3 Navigation

- NavigationMenu (primary)
- SubNavigation (secondary, contextual)
- TabBar (mobile bottom)
- Pagination
- LoadMore button
- InfiniteScrollSentinel
- Breadcrumbs
- BackButton
- Stepper (progressive flow)
- AnchorLinks (in long forms or docs)

## 8.4 Data Display

- Table (sortable, sticky headers)
- DataGrid (virtualized, column resize/reorder/pin, group/aggregate, expandable rows, server-side ops)
- DataGridFilters (chips, advanced filter builder, saved views)
- TreeView (lazy-load nodes)
- TreeTable
- KanbanBoard (with WIP limits)
- Calendar (month/week/day/agenda views)
- TimelineView (vertical/horizontal)
- ListView (with selection, bulk actions)
- DescriptionList (key-value pairs)
- StatList
- Badge / Pill / Tag / Chip
- StatusDot (pulse for live)
- Avatar (with initials fallback) and AvatarGroup
- ProgressBar (linear, segmented, indeterminate)
- ProgressRing
- Stepper (read state)
- DiffViewer (for audit / version compare)
- JSONViewer
- CodeBlock (with copy)
- MarkdownRenderer
- MetadataPanel
- LabelChip (POD, Holds, Hazmat, Cold-chain, Fragile, Age-restricted, COD)
- SignatureViewer
- DocumentViewer (PDF, image)
- BarcodeRenderer
- QRCodeRenderer

## 8.5 Feedback & System

- Toast / Snackbar (with action and undo)
- Banner (page-level info/warn/error/success)
- Alert (inline)
- InlineNotice
- Dialog (confirm/alert/destructive/multi-step)
- ConfirmDialog (typed-confirmation for destructive)
- LoadingSpinner / Skeleton / ShimmerSkeleton
- ProgressOverlay
- EmptyState (illustration + CTA)
- ErrorState (with retry, request-ID)
- PermissionDeniedState
- OfflineIndicator
- StaleIndicator
- ConnectionQualityBadge
- SessionExpiringPrompt
- WhatsNewPanel
- AnnouncementBar

## 8.6 Analytics & Visualization

- KPI Card (value, delta, sparkline, target)
- RevenueCard (currency, comparison, trend)
- StatCard (with icon)
- LineChart, AreaChart, BarChart (h/v), StackedBar, GroupedBar
- ColumnChart, ColumnHeatmap
- PieChart, DonutChart
- ScatterPlot, BubbleChart
- HeatmapMatrix (e.g., zone-by-hour failures)
- Choropleth Map / Region Map
- LiveMap (vehicles, drivers)
- RouteMap (polylines, stop markers, traffic overlay)
- GeofenceEditorMap
- WarehouseLayoutMap (zones/aisles/bins)
- FunnelChart (e.g., delivery funnel)
- WaterfallChart (financials)
- GanttChart (dock schedules, projects)
- GaugeChart (capacity utilization)
- Sparkline
- TrendIndicator (delta with arrow and color token)
- DateRangeSelector (with presets)
- Granularity Switcher (hour/day/week/month)
- ComparePeriod toggle
- SegmentSelector (filter by tenant/country/branch)
- DrillDownBreadcrumb
- ChartLegend (interactive)
- ChartTooltip
- DataTableSummaryRow (totals)
- SLODials, BurnUpChart, ErrorBudgetCard

## 8.7 Logistics-specific

- TrackingTimeline (vertical, with icons per event type)
- ShipmentCard (compact and expanded)
- ShipmentSummaryStrip (key facts, status, ETA)
- AwbBlock (barcode + human-readable + actions)
- POD Viewer (signature, photos, OTP code, geo, ID match)
- PiecesEditor (table for multi-piece input)
- DimsCalculator (volumetric)
- PriceQuoteCard (line items)
- ETACard (estimated, confidence, factors)
- RouteViewer (map + stops)
- StopCard (address, recipient, window, payment)
- DriverCard (avatar, status, rating, current trip, vehicle)
- VehicleCard (plate, type, capacity, status)
- WarehouseMap (zones, aisles, bins, dock doors)
- DockBoard (gantt of doors)
- LoadPlanCard (cages/pallets)
- ManifestPreview (print-ready)
- CashSessionCard (driver cash with variance)
- DepositSlipPreview
- COD Pipeline Funnel
- IncidentCard (severity, owners, ETA)
- SealCaptureWidget (input + photo)
- HoldChip (reason, owner, expiry)
- ReturnReasonPicker
- DeliveryAttemptCard (attempt number, reason, photos)
- AddressVerifierCard (validation, suggestions)
- HsCodePicker
- DGChecklist (dangerous goods)
- ColdChainMonitorCard (temperature)
- TemperatureSparkline
- GeoBreadcrumb (country → region → branch → warehouse)
- ServiceAreaPolygonEditor
- CutoffCountdown (per service)
- PickupWindowPicker
- ZoneMatrixEditor (rate cards)
- WeightBreakEditor
- FuelIndexCurve

## 8.8 Maps & Geospatial

- MapCanvas (light/dark tiles, RTL labels)
- LayerToggles (traffic, satellite, weather, polygons, heat, clusters)
- StopPin, DriverPin, VehiclePin, BranchPin, WarehousePin
- ClusterMarker
- PolylineRenderer (with arrows for direction)
- PolygonEditor (service areas, zones)
- DistanceMeasureTool
- SearchOnMap
- LegendPanel

## 8.9 Communication & Collaboration

- ChatPanel (agent ↔ customer, agent ↔ driver)
- CallConsole (dial, record, transfer, hold)
- VoiceMemoRecorder
- NoteThread (internal vs external)
- Mentions (@user)
- AttachmentsList
- Translator (UI translation toggle)
- LanguageBadge (auto-detect)

## 8.10 Forms & Validation

- FormShell (sections, actions, sticky save bar)
- FieldGroup
- FieldRow (label/help/error)
- ConditionalField
- RepeatingFieldset (e.g., pieces)
- FileList
- ValidationSummary
- AutoSaveIndicator
- DiffPreview (before/after)
- BulkEditor (multi-row edit)

## 8.11 System & Admin

- FeatureFlagToggle (with audit)
- EnvironmentBadge (sandbox/staging/production)
- ImpersonationBanner (red, with stop)
- AuditTrailViewer
- PolicyBuilder (ABAC)
- ApiKeyTable (rotate, revoke)
- WebhookTester (replay)
- SecretMaskedField

## 8.12 Mobile-specific

- BottomSheet
- SwipeableList
- PullToRefresh
- ActionSheet
- HapticButton
- SegmentedTabs
- Stepper (large, thumb-friendly)
- BarcodeCameraView
- SignaturePad (high-res)
- PhotoCapture (with flash, retake)
- FieldKeypad (for COD amount)
- OfflineBanner
- BatteryAndConnectivityBadge
- VoiceCommandButton

## 8.13 Accessibility & Utility

- LiveRegion (polite/assertive)
- FocusTrap (modals/drawers)
- SkipLink
- KeyboardShortcutsHelp
- A11ySettingsPanel (font size, motion, contrast)
- AnnouncementForScreenReader
- PrintFriendlyToggle

---

# 9. Mobile App Design — Driver

Native apps for iOS and Android, built on a shared design system. Optimized for one-handed use, gloves, sunlight, low-bandwidth, intermittent connectivity, and long shifts. Battery-aware and bandwidth-aware.

## 9.1 Personas

- **Pickup Driver**: Multi-stop pickups from merchants.
- **Linehaul Driver**: Long-haul trips between hubs.
- **Last-Mile Driver**: Many small stops, high turnover, COD.
- **Hybrid Driver**: All of the above on different shifts.

## 9.2 Screens (full inventory)

### 9.2.1 Onboarding & Auth

- Splash with brand
- Language picker
- Sign in (employee credentials or contractor magic-link)
- MFA (OTP, biometric)
- Device binding (one active device, with handover flow)
- Permissions onboarding (location always-on, camera, notifications, motion, microphone)
- Tutorial (3 cards: Start shift → Scan & deliver → Cash up)

### 9.2.2 Home / Today

- Shift status (Off / On / Break)
- Start Shift action with pre-trip checklist (vehicle, fuel, equipment, ID)
- Today's plan summary (stops, distance, ETA, COD expected)
- Quick actions: Scan, Help, Report Issue, Map.
- Message inbox preview (dispatcher, customers).

### 9.2.3 Pre-Trip Checklist

- Vehicle inspection items (tires, lights, seal, kit) with photo capture for failures.
- Driver ID and license confirmation if expiring.
- Acknowledgement step.

### 9.2.4 Route Map

- Live map with stops in order, polylines, traffic.
- Stop list bottom-sheet (drag to expand).
- Re-optimize CTA (with reason for divergence).
- Off-route warnings.
- Refuel/break stops insertable.

### 9.2.5 Stop Detail

- Recipient (or sender for pickup) info, address, phone (masked, click-to-call via tenant SIP).
- Service tags (Fragile, COD, Age, ID-required).
- Pieces list with barcodes.
- Action button transitions to Scan / Capture / Verify.
- Map snippet, navigate (Google/Apple Maps deep-link).
- Notes from dispatcher and from customer.

### 9.2.6 Pickup Capture

- Scan all expected pieces (with mismatch handling).
- Add unexpected pieces with reason (overage flow).
- Capture photos of parcels and shipper signature.
- POP (Proof of Pickup) summary and submit.

### 9.2.7 Delivery Capture

- Recipient verification (OTP, ID scan, age computation).
- Photo capture (mandatory for high-value or signature-required).
- Signature pad.
- COD amount confirmation and channel (cash, POS, wallet, link).
- POD summary and submit.

### 9.2.8 Failed Attempt

- Reason picker (controlled vocabulary).
- Photo evidence (mandatory in many reasons).
- Recipient contact attempt log.
- Re-attempt or RTO suggestion.

### 9.2.9 COD Cash-Up (End of Shift)

- Expected vs counted summary by currency.
- Variance entry with reason.
- Branch deposit (QR code printed by branch cashier; scan to confirm).
- Receipt download.

### 9.2.10 Messages

- Threads with dispatcher, support, optional customer chat.
- Quick replies, voice notes.
- SLA badges on dispatcher messages.

### 9.2.11 Issues / Incidents

- Categories: Vehicle, Safety, Damage, Theft, Address, Customer.
- Photo + GPS auto-attached.
- Severity, dispatcher routing.

### 9.2.12 Earnings & Performance

- Today / This week / Month earnings (if applicable).
- Performance KPIs: on-time, success rate, customer rating, mis-scan rate.
- Bonuses / incentives status.

### 9.2.13 Profile & Settings

- Profile, language, notifications, accessibility, dark/light, data saver.
- Switch device flow (with manager approval).
- Help / KB / Status.

### 9.2.14 End-of-Shift

- Summary of stops, exceptions, cash, distance.
- Vehicle return checklist.
- Sign-off and submit.

## 9.3 Offline Mode

- **Strategy**: Local-first with a durable command queue.
- **Local store**: Encrypted SQLite/Realm; PII tokenized at rest.
- **Sync model**:
  - Read replicas: Today's route, stops, customer info, templates, KB cached.
  - Write log: All driver actions are events (Scan, POD, Failure, Photo) appended to a durable queue with idempotency keys; flushed when online with exponential backoff.
  - Conflict resolution: Server is source of truth; client receives reconciliation diffs and surfaces issues if a stop was reassigned.
- **Offline-allowed actions**:
  - Scan pickup/delivery pieces.
  - Capture POD (signature, photo, OTP entered as code).
  - Mark attempts and failures with reasons.
  - Take notes and incident photos.
  - Update stop order locally with constraints.
- **Restricted offline**:
  - Confirm COD when card/wallet (requires PSP online); cash allowed offline with later reconciliation.
  - Customer OTP via SMS requires online; ID-based fallback documented.
- **UX**:
  - OfflineBanner with last-sync time.
  - Queue indicator with count and "Sync now" button.
  - Color-coded badges per stop indicating sync state.
- **Storage caps**: Per-device cap; oldest non-essential cache evicted; never evict pending writes.

## 9.4 GPS & Location

- **Modes**: Foreground precise during stops; background balanced during transit; significant-change on long idles.
- **Geofencing**: Around each stop and warehouse; triggers state transitions.
- **Tampering protection**: Mock-location detection; jailbreak/root detection; signal anomaly flags (e.g., teleport).
- **Privacy**: Location captured only during active shifts; minimization off-shift; user-visible indicator.
- **Battery**: Adaptive sampling; reduce when stationary; pause on low battery (with banner).

## 9.5 Barcode & Label Scanning

- **Camera scanning**: 1D and 2D (Code128, Code39, EAN, UPC, QR, DataMatrix, PDF417).
- **External scanners**: Bluetooth/HID handheld scanners (warehouse).
- **Speed**: Continuous-scan mode for batch operations.
- **Validation**: Check digit, prefix policy (S10-compatible), tenant prefix.
- **Feedback**: Haptic + sound + visual color cue (token success/warning/danger).
- **Anti-error**: Confirm on duplicates; flag missing pieces; require reason on overage.

## 9.6 Proof of Delivery (POD)

- **Components**: Recipient name, signature image, photos (configurable count), OTP code, ID match (manual flag), geo-stamp, timestamp, device fingerprint.
- **Variants**:
  - Contactless (photo + GPS, no signature) per merchant rules.
  - Age-restricted (require ID screen with manual age confirmation).
  - High-value (mandatory photo + ID).
  - Refused (photo + reason).
- **Quality gates**: Min photo size, blur detection (auto-retake suggestion), signature non-empty, geo within geofence (or capture override reason).
- **Storage**: Uploaded to object storage; CDN-delivered with signed URLs and short TTL; PII redacted in logs.

## 9.7 Synchronization Strategy

- **Transport**: HTTP/2 + gRPC for control; long-poll fallback; mTLS for service auth.
- **Push**: APNs/FCM for assignments and alerts; silent pushes to wake sync.
- **Idempotency**: Every write carries a UUID; server dedupes; safe retries.
- **Versioning**: Schema versioning; backward-compatible API; feature flags per app version.
- **Throttling**: Server applies token-bucket per device; clients respect Retry-After.
- **Telemetry**: Anonymous device telemetry with consent; crashes and ANRs reported.
- **Recovery**: On crash recovery, queue replays from durable log; user prompted only for ambiguous conflicts.

---

# 10. Reporting & Analytics

All KPIs are defined with: **formula**, **dimensions**, **target**, **owner**, **freshness**, **drill-down**.

## 10.1 Operational KPIs

| KPI                               | Formula                                    | Dimensions                                 | Target                  | Owner            | Freshness      |
| --------------------------------- | ------------------------------------------ | ------------------------------------------ | ----------------------- | ---------------- | -------------- |
| On-Time Delivery (OTD)            | delivered_in_window / total_delivered      | country, region, branch, service, merchant | ≥ 98%                   | Country Mgr      | Live (≤ 1 min) |
| First-Attempt Success Rate (FASR) | first_attempt_delivered / out_for_delivery | branch, driver                             | ≥ 90%                   | Branch Mgr       | Live           |
| Pickup Compliance                 | pickups_in_window / scheduled_pickups      | branch, merchant                           | ≥ 95%                   | Dispatcher       | Live           |
| Average Transit Time              | avg(delivered_at - picked_up_at)           | service, lane                              | per service SLA         | Country Mgr      | Hourly         |
| Exception Rate                    | exceptions / total_shipments               | type, branch                               | ≤ 2%                    | Ops Mgr          | Hourly         |
| Lost Rate                         | lost_shipments / total_shipped             | branch, lane                               | ≤ 0.05%                 | Compliance       | Daily          |
| Damage Rate                       | damaged / total_shipped                    | branch, lane                               | ≤ 0.1%                  | WH Mgr           | Daily          |
| Misroute Rate                     | misrouted_pieces / sorted_pieces           | hub                                        | ≤ 0.5%                  | WH Mgr           | Hourly         |
| Cut-off Compliance                | sorted_before_cutoff / total_inducted      | hub                                        | ≥ 99%                   | WH Mgr           | Hourly         |
| Re-attempt Rate                   | reattempts / failed_first_attempts         | branch, reason                             | ≤ 80% (lower is better) | Branch Mgr       | Daily          |
| RTO Rate                          | rto_shipments / total_shipped              | merchant                                   | ≤ 5%                    | Merchant Success | Daily          |
| Customer SLA Breach Rate          | breaches / contracted_volume               | merchant tier                              | ≤ 1%                    | Account Mgr      | Daily          |
| Active Shipments                  | count where status in transit/oFD          | branch                                     | n/a                     | Live             | Live           |
| Out-for-delivery Aging            | now - oFD_ts where > 12h                   | branch                                     | ≤ 5% > 24h              | Branch Mgr       | Live           |

## 10.2 Financial KPIs

| KPI                 | Formula                           | Dimensions                 | Target           | Owner      | Freshness |
| ------------------- | --------------------------------- | -------------------------- | ---------------- | ---------- | --------- |
| Revenue             | sum(invoiced_amount)              | country, service, merchant | growth           | Finance    | Daily     |
| Gross Margin        | (revenue - direct_cost) / revenue | service                    | ≥ target         | Finance    | Weekly    |
| Cost per Shipment   | direct_cost / shipments           | lane                       | downward trend   | Finance    | Daily     |
| COD Float           | cash_pending - cash_settled       | merchant                   | minimized        | Finance    | Live      |
| COD Cycle Time      | settled_at - delivered_at         | merchant                   | ≤ T+N contracted | Finance    | Daily     |
| AR Aging            | unpaid_invoices by bucket         | merchant                   | ≤ targets        | Finance    | Daily     |
| Bad Debt            | written_off / billed              | merchant tier              | ≤ 0.2%           | Finance    | Monthly   |
| FX Exposure         | foreign_balances                  | currency                   | hedged           | Treasury   | Daily     |
| Settlement Accuracy | reconciled / settled              | merchant                   | ≥ 99.9%          | Finance    | Daily     |
| Payroll Accuracy    | corrections / payroll_lines       | country                    | ≤ 0.1%           | HR/Finance | Per cycle |

## 10.3 Warehouse KPIs

| KPI                         | Formula                       | Dimensions  | Target     | Owner      | Freshness |
| --------------------------- | ----------------------------- | ----------- | ---------- | ---------- | --------- |
| Throughput                  | pieces_processed / hour       | hub, induct | per design | WH Mgr     | Live      |
| Sort Accuracy               | 1 - missort_rate              | hub, sorter | ≥ 99.5%    | WH Mgr     | Live      |
| Dock-to-Stock Time          | first_scan_to_putaway         | hub         | ≤ target   | WH Mgr     | Hourly    |
| Inbound Reconciliation Rate | reconciled / inbound          | hub         | ≥ 99%      | WH Mgr     | Hourly    |
| Inventory Accuracy          | counted_match / total_counted | warehouse   | ≥ 99.5%    | WH Mgr     | Cycle     |
| Damage at Hub               | damaged_in_hub / processed    | hub         | ≤ 0.05%    | WH Mgr     | Daily     |
| Cage Utilization            | filled_cages / capacity       | hub         | ≥ target   | WH Mgr     | Hourly    |
| Equipment Uptime            | up / scheduled                | equipment   | ≥ 99%      | WH Mgr     | Live      |
| Hold-at-Branch Aging        | parcels by aging bucket       | branch      | minimized  | Branch Mgr | Live      |

## 10.4 Driver KPIs

| KPI                | Formula                                | Dimensions      | Target     | Owner      | Freshness |
| ------------------ | -------------------------------------- | --------------- | ---------- | ---------- | --------- |
| Stops per Hour     | stops / on_route_hours                 | driver, route   | per region | Dispatcher | Live      |
| On-Time Stops      | stops_in_window / total_stops          | driver          | ≥ 95%      | Dispatcher | Live      |
| Success Rate       | delivered / out_for_delivery           | driver          | ≥ 92%      | Dispatcher | Daily     |
| POD Quality Score  | (photos_ok + signatures_ok + geo_ok)/3 | driver          | ≥ 95%      | QA         | Daily     |
| Customer Rating    | avg(rating)                            | driver          | ≥ 4.5/5    | QA         | Daily     |
| HOS Compliance     | sessions_under_limit / total           | driver          | 100%       | HR         | Live      |
| Cash Variance Rate | sessions_with_variance / total         | driver          | ≤ 0.5%     | Finance    | Daily     |
| Safety Incidents   | incidents / 10k miles                  | driver          | ≤ target   | Safety     | Monthly   |
| Fuel Efficiency    | fuel / km                              | driver, vehicle | optimized  | Fleet      | Weekly    |
| Adherence to Plan  | route_diff / planned                   | driver          | ≤ 10%      | Dispatcher | Daily     |

## 10.5 Merchant KPIs

| KPI                       | Formula                | Dimensions        | Target       | Owner       | Freshness |
| ------------------------- | ---------------------- | ----------------- | ------------ | ----------- | --------- |
| Volume                    | shipments              | merchant, service | growth       | Account Mgr | Daily     |
| Success Rate              | delivered / total      | merchant          | ≥ 95%        | Account Mgr | Daily     |
| RTO Rate                  | rto / total            | merchant          | ≤ 5%         | Account Mgr | Daily     |
| Damage / Loss Rate        | claims / total         | merchant          | ≤ 0.2%       | Account Mgr | Weekly    |
| Average Cost per Shipment | charges / shipments    | merchant          | trend        | Finance     | Weekly    |
| Settlement Cycle Time     | settle_at - deliver_at | merchant          | ≤ contracted | Finance     | Daily     |
| Reattempt Rate            | reattempts / oFD       | merchant          | ≤ target     | Account Mgr | Daily     |
| NPS / CSAT                | survey scores          | merchant tier     | ≥ 60 / ≥ 4.5 | CS          | Monthly   |
| API Usage                 | calls / day            | merchant          | n/a          | DevRel      | Daily     |
| Webhook Success           | success / total        | merchant          | ≥ 99.9%      | DevRel      | Live      |

## 10.6 Reporting Capabilities

- **Pre-built reports**: Daily ops summary, financial close, driver scorecards, merchant scorecards, exception reports, customs declarations, regulator reports.
- **Custom reports**: Drag-and-drop fields, dimensions, metrics, filters, scheduling, signed delivery.
- **Exports**: CSV, XLSX, PDF, Parquet (data lake).
- **Distribution**: Email, secure portal, S3/GCS/Azure pickup, webhook.
- **Audit**: Every report generation is audit-logged; reports are signed and reproducible.
- **Benchmarking**: Anonymized peer benchmarks for merchants opted-in.
- **Alerts**: Threshold and anomaly-based alerting with acknowledgement and routing.

## 10.7 Data Architecture (logical)

- **OLTP**: Transactional databases per bounded context (PostgreSQL or equivalent), partitioned by tenant/country.
- **Streaming**: Event backbone (Kafka) with topics per domain; CDC streams for OLTP.
- **Lake / Warehouse**: Lakehouse pattern (Iceberg/Delta) on S3/GCS/Azure; gold/silver/bronze layers; DWH (Snowflake/BigQuery/Redshift) for BI.
- **Serving**: Materialized views and ROLAP/HOLAP for dashboards; sub-second KPIs via pre-aggregations.
- **Data Quality**: Tests on freshness, completeness, validity, uniqueness; data contracts for events; lineage with OpenLineage.
- **Governance**: PII catalog, data classifications, residency tags, access reviews.

---

# 11. AI Opportunities

All AI features follow a common framework: **problem**, **inputs**, **model class**, **output**, **decision policy**, **success metrics**, **guardrails**, **human-in-the-loop**, **feedback loops**, **explainability**, **risks**, **rollout**.

## 11.1 Route Optimization

- **Problem**: Build pickup, delivery, and linehaul routes that maximize stops/hour and on-time, given vehicles, drivers, time windows, capacities, traffic, and constraints (zones, HOS, cold-chain, hazmat).
- **Inputs**: Stops with windows, vehicles with capacity and skills, driver shifts, traffic forecasts, road restrictions, historical durations, weather, real-time GPS.
- **Model class**: Operations research (VRP/VRPTW/PDPTW with capacities and skills) hybridized with ML predictors for stop service time and travel time.
- **Output**: Sequenced routes with planned ETAs and slack time.
- **Decision policy**: Auto-publish for routine plans; human review for exceptions (split routes, > X stops re-shuffled, customer commitments at risk).
- **Metrics**: Stops/hour uplift, on-time uplift, distance reduced, fuel/CO2 savings.
- **Guardrails**: Respect HOS, fairness across drivers, no route concentration that creates burnout.
- **HITL**: Dispatcher approves; can override and capture reason as feedback.
- **Feedback**: Actuals vs plan inform service-time and travel-time models.
- **Explainability**: For each stop, why placed (window, proximity, capacity, fairness).
- **Rollout**: Shadow → A/B → general availability.

## 11.2 ETA Prediction

- **Problem**: Predict promised, dynamic, and customer-facing ETAs.
- **Inputs**: Lane history, current location, traffic, weather, time of day, package counts, branch performance, driver speed.
- **Model**: Gradient-boosted trees + temporal features; quantile regression for uncertainty bounds.
- **Output**: Point ETA and 80%/95% interval; reasons.
- **Policy**: Use upper bound for SLA risk alerts; show median to customers; recompute on event triggers.
- **Metrics**: MAE, calibration of intervals, customer reschedule reduction.
- **Guardrails**: Never display narrower windows than calibration supports.

## 11.3 Delay Prediction & Proactive Communication

- **Problem**: Detect shipments at risk of breach early.
- **Inputs**: Current trajectory vs plan, hub backlogs, weather, holidays, driver issues.
- **Model**: Risk classification with probability score and reason codes.
- **Action**: Auto-notify customer with new ETA + options; route to dispatcher if high-impact (VIP, contractual SLA).
- **Metrics**: Reduced unplanned breaches, customer NPS lift, support volume reduction.
- **Guardrails**: No alarmism; suppress messages with low confidence.

## 11.4 Address Normalization & Geocoding

- **Problem**: Free-form, multilingual, transliterated addresses are unreliable.
- **Inputs**: Address text, country, postal code, customer history, GPS clusters from past deliveries.
- **Model**: Sequence labeling + retrieval (POI gazetteer) + LLM fallback for ambiguous cases.
- **Output**: Structured address, lat/lng, confidence, suggestions.
- **Metrics**: Failure-on-arrival rate due to address, support tickets reduced.
- **Guardrails**: Confirm with sender/customer for low-confidence; never ship to ambiguous addresses for high-value.

## 11.5 Demand Forecasting

- **Problem**: Predict volumes by lane, day, hour to plan capacity.
- **Inputs**: Historical volumes, merchant pipelines, marketing calendars, public holidays, weather, macro signals.
- **Model**: Hierarchical time-series (Prophet/DeepAR/Temporal Fusion).
- **Output**: Forecasts with intervals at multiple aggregations.
- **Use cases**: Staffing, fleet sizing, hub capacity, surge pricing windows.
- **Metrics**: WAPE/MAPE, capacity utilization, overtime reduction.

## 11.6 Fraud & Anomaly Detection

- **Problem**: Detect cash-handling fraud, package theft, return fraud, fake POD, identity misuse, account takeover.
- **Inputs**: Transactions, POD evidence, geo paths, scan patterns, login signals, device fingerprints, social graph.
- **Models**: Anomaly detection, gradient-boosted classifiers, graph neural networks for collusion rings, computer vision for POD photo authenticity (similarity, exif, blur, manipulation hints).
- **Output**: Risk score with reasons; queued for review or auto-action (hold, require step-up, freeze).
- **Metrics**: Loss reduction, false-positive rate, review backlog SLAs.
- **Guardrails**: Human review for adverse actions; bias monitoring across demographics; appeal flow.

## 11.7 AI Support Agent

- **Problem**: Resolve common customer/merchant inquiries at scale.
- **Capabilities**:
  - Conversational tracking, reschedule, redirect, FAQs.
  - Drafting responses for human agents (suggested replies).
  - Summarizing tickets and call transcripts.
  - Auto-classifying and prioritizing tickets.
  - Multilingual including Arabic and dialects.
- **Architecture**: Retrieval-augmented generation over KB, shipment data, and policies; tool-use to take actions (subject to authorization).
- **Policy**: Confidence thresholds; explicit handoff to humans for sensitive cases (claims > limit, complaints, legal, accessibility).
- **Metrics**: Containment rate, AHT reduction, CSAT, resolution accuracy.
- **Guardrails**: PII redaction, no hallucinated commitments, action audit trail, jailbreak resistance, locale and tone control.

## 11.8 Merchant Insights

- **Problem**: Help merchants reduce returns, costs, and grow.
- **Capabilities**:
  - Cohort analytics on regions, SKUs, time windows.
  - Cause-and-effect on RTO drivers (e.g., bad addresses by region, payment failures, communication gaps).
  - Recommendations: change service level for a lane, set pickup cutoff, opt-in reattempt fee, address-confirmation workflow.
  - Forecast their own demand and settlement timing.
- **Output**: Plain-language insights and actionable recommendations with one-click apply.
- **Metrics**: Adoption of recommendations, measurable RTO/cost improvements.
- **Guardrails**: No competitor-disclosing benchmarks; opt-in for cross-merchant peer comparison.

## 11.9 Vision AI for Operations

- **Damage detection**: At inbound and during sortation; flag damaged parcels for QC.
- **Dimension capture**: Smartphone-based volumetric measurement to dispute weight/dim mismatches.
- **Loading optimization**: Detect under/over-loaded cages and trucks via camera.
- **Safety**: Detect PPE compliance, forklift hazards, dock collisions.
- **POD verification**: Verify package presence in photo and consistent backgrounds across attempts.

## 11.10 Voice & Conversational Driver Tools

- Voice-controlled status updates, "Find next stop," scan confirmations.
- Hands-free POD capture for pickups (camera + voice).
- Multilingual recognition.

## 11.11 Sustainability & Cost Optimization

- Carbon estimation per shipment with options for greener routes/services.
- Mode/lane optimization (rail vs road) and consolidation suggestions.
- Empty-mile reduction via backhaul matching.

## 11.12 Pricing Intelligence

- Win-rate models for quote acceptance.
- Surge pricing and discount targeting per segment.
- Churn risk modeling for merchants.

## 11.13 Workforce Intelligence

- Driver matching (skills, area familiarity, vehicle).
- Schedule optimization with fairness constraints.
- Attrition prediction and retention nudges.

## 11.14 Search & Knowledge

- Semantic search across shipments, tickets, KB, policies, internal docs.
- Document understanding for customs and contracts.
- Auto-categorization and entity extraction.

## 11.15 Responsible AI Framework

- **Principles**: Transparency, fairness, accountability, privacy, safety.
- **Documentation**: Model cards, data sheets, risk assessments per model.
- **Reviews**: Pre-deployment review board; periodic audits; ethics escalation path.
- **Privacy**: PII minimization, training data lineage, customer/merchant opt-outs honored, data residency respected.
- **Security**: Adversarial testing, prompt-injection defenses, output filtering, secret protection.
- **Explainability**: Feature attributions, reason codes, counterfactual explanations where feasible.
- **Monitoring**: Drift, bias, performance, business KPI impact; auto-rollback on regressions.
- **Human-in-the-loop**: Required for irreversible or high-impact decisions (refunds above thresholds, holds, account freezes).
- **Regulatory**: EU AI Act risk classification, sectoral rules, regional deployment constraints.

---

# Appendix A — Cross-cutting Architecture Notes (informational)

- **Architecture style**: Domain-aligned services with event-driven backbone; strong contracts; idempotent APIs; SAGA for cross-context workflows (e.g., create shipment + reserve capacity + collect payment).
- **APIs**: REST + Webhooks for external; gRPC internal; OpenAPI/Protobuf source-of-truth; SDK generation pipeline.
- **Tenancy**: Per-tenant isolation at logical level; per-region physical isolation for residency.
- **Observability**: OpenTelemetry traces across services; SLOs per critical journey (create-shipment, deliver, settle); error budgets; user-journey synthetic tests.
- **Security**: SDLC with SAST/DAST/SCA; secrets in vault; KMS-managed encryption; least-privilege IAM; SoD; comprehensive audit; regular pen-tests; bug bounty.
- **Disaster recovery**: RPO ≤ 5 min for OLTP, RTO ≤ 30 min for control plane; multi-region active-active for tracking ingest; runbooks tested quarterly.
- **Internationalization**: Locale-aware formatting (CLDR), full RTL support, transliteration for addresses, ICU plurals; per-country compliance toggles.
- **Accessibility**: Component library certified to WCAG 2.2 AA; keyboard, SR, contrast, motion settings exposed as user preferences.

# Appendix B — Glossary

- **AWB**: Air Waybill / shipment identifier.
- **POD / POP**: Proof of Delivery / Proof of Pickup.
- **RTO / RTS**: Return to Origin / Return to Shipper.
- **HOS**: Hours of Service for drivers.
- **DG**: Dangerous Goods.
- **3PL**: Third-Party Logistics provider.
- **PUDO**: Pick-Up / Drop-Off network.
- **VRP / VRPTW / PDPTW**: Vehicle Routing Problem variants.
- **SLO / SLA**: Service Level Objective / Agreement.
- **ABAC / RBAC**: Attribute / Role Based Access Control.
- **FX**: Foreign Exchange.
- **ASN**: Advance Shipping Notice.
- **ULD**: Unit Load Device.

# Appendix C — Document Acceptance Criteria

- Every section is implementation-ready: roles, permissions, screens, widgets, KPIs, AI features, and workflows are explicit and testable.
- Every workflow has all states, transitions, actors, rules, SLAs, and emitted events.
- Every UI screen lists purpose, layout, components, actions, and state behaviors.
- Every KPI has formula, dimensions, target, owner, and freshness.
- Every AI feature has policy, metrics, guardrails, and HITL definition.

— End of Blueprint —
