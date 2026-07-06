# CANONICAL PRODUCT DEFINITIONS V1

## Purpose

Define every official Stafford Media Consulting entity — company, internal
system, service, SaaS product, and reserved/inactive product — so that all
future engineering agents (Claude, Codex, ChatGPT, and future AI agents)
operate from one identity and do not misclassify, duplicate, or invent the
business model.

This document is the single source of truth for WHAT each entity IS and IS NOT.
It reconciles existing repository terminology; it does not replace the code,
registries, or data that already use these names.

This is a documentation authority. It changes no runtime code, no registries,
no JSON, and no UI.

---

## Canonical business facts (approved; unchanged unless repository evidence proves otherwise)

- Stafford Media Consulting is the company.
- StaffordOS is the internal operating system, governance system, operational
  memory, and AI orchestration layer. It is not a customer-facing SaaS.
- ShopiFixer is an AI-governed engineering service (Shopify optimization and
  engineering engagement) that uses StaffordOS governance and approved coding
  agents. It is not a SaaS product.
- Abando is a separate SaaS product — a revenue-recovery platform. It can sell
  independently and can also be offered after ShopiFixer when appropriate. It is
  not dependent on ShopiFixer.
- Actinventory is reserved / inactive only. It is not an active product and must
  not be placed into the active portfolio.

---

## Portfolio at a glance

| Entity | Business classification | Sold to customers? | Status |
| --- | --- | --- | --- |
| Stafford Media Consulting | Company | — | Active |
| StaffordOS | Internal Platform (operating/governance/orchestration) | No | Active, internal |
| ShopiFixer | Service (AI-governed engineering engagement) | Yes | Active |
| Abando | SaaS Product (revenue-recovery platform) | Yes | Active |
| Actinventory | Future / Reserved | No | Reserved / inactive |

---

## 1. Stafford Media Consulting

1. Purpose: The legal business entity that owns and operates all offerings.
2. Description: The consulting company under which StaffordOS runs and through
   which ShopiFixer and Abando are delivered/sold.
3. Business classification: Company.
4. Primary customer: Not applicable (the operating entity itself).
5. Primary business outcome: Sustainable revenue from services (ShopiFixer) and
   SaaS (Abando), operated through StaffordOS.
6. Primary department owner: Executive (Ross).
7. Revenue model: Aggregate — one-time service fees (ShopiFixer) plus recurring
   SaaS revenue (Abando).
8. Inputs: Leads, campaigns, operator decisions, capital/time.
9. Outputs: Delivered engagements, SaaS subscriptions, proof, revenue.
10. Dependencies: StaffordOS (to operate), ShopiFixer + Abando (to earn).
11. Non-goals: It is NOT a product, NOT a platform sold to customers, and NOT a
    synonym for StaffordOS.
12. Repository authority: Referenced across docs; no single company-definition
    file today (this document is the canonical identity).

## 2. StaffordOS

1. Purpose: Run and govern the business — coordinate marketing, leads, approvals,
   AI agents, execution, evidence, payments, and lifecycle.
2. Description: The internal operating system, governance system, operational
   memory, and AI orchestration layer. The control plane; products are execution
   engines that connect to it via APIs/contracts.
3. Business classification: Internal Platform / Internal Capability. Not a
   customer-facing SaaS.
4. Primary customer: Internal — Ross and operators. Not sold to merchants.
5. Primary business outcome: Governed, evidence-backed operation of the business
   across products and services.
6. Primary department owner: Executive (Ross) / StaffordOS core.
7. Revenue model: None. StaffordOS is not sold and generates no direct revenue.
8. Inputs: Lead/client/merchant registries, campaigns, events, proofs, operator
   actions, agent outputs.
9. Outputs: Prioritized actions, approvals, governance gates, truth snapshots,
   lifecycle state, coordination across products.
10. Dependencies: The registries and authorities it coordinates; approved coding
    agents for execution.
11. Non-goals: It is NOT a SaaS product, NOT sold to merchants, NOT a single
    product runtime, and NOT a merchant-facing dashboard.
12. Repository authority: `staffordos/planning/Control_Plane_vs_Product_Engine.md`
    (control-plane vs product-engine boundary), `staffordos/authority/authority_registry_v1.md`
    (runtime write-authorities), `staffordos/cockpit/ceo_truth_snapshot_v1.json`.

## 3. ShopiFixer

1. Purpose: Improve a Shopify store through a governed, scoped AI engineering
   engagement.
2. Description: An AI-governed engineering service for Shopify website owners. It
   audits stores, recommends fixes, executes approved fixes through StaffordOS
   governance and approved coding agents (e.g. Codex, Claude Code, or future
   agents), validates results, and produces before/after proof. Commercial
   packaging: the $950 flat-fee Fix Sprint — the audit is the sales asset and the
   scoped Fix Sprint is the product-of-work.
3. Business classification: Service (AI-governed engineering engagement). NOT
   SaaS.
4. Primary customer: Shopify store owners with visible conversion / UX / product /
   cart / checkout friction.
5. Primary business outcome: A specific, visible, scoped improvement delivered
   with proof, converting merchant trust into paid work.
6. Primary department owner: Revenue (sales) and Engineering/Fulfillment
   (delivery); Ross approves offer, scope, and proof.
7. Revenue model: One-time service fee — $950 flat-fee Fix Sprint
   (`client.revenue.shopifixer_one_time`). Not a subscription.
8. Inputs: Merchant store, audit evidence, selected scoped issue, merchant
   approval.
9. Outputs: Audit, recommendations, executed fix, QA/validation, before/after
   evidence, merchant proof package, completion summary.
10. Dependencies: StaffordOS governance; approved coding agents; the payment gate
    (delivery begins only after verified payment_received).
11. Non-goals: It is NOT SaaS, NOT a subscription, NOT a redesign, NOT a marketing
    retainer, NOT an open-ended consulting engagement, and NOT a gateway whose
    only next step is Abando.
12. Repository authority:
    `staffordos/shopifixer/shopifixer_commercial_definition_v1.md` (commercial
    definition), `staffordos/authority/output/product_routing_authority_v1.md`
    (routing), `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`
    (delivery truth).

## 4. Abando

1. Purpose: Recover abandoned-cart and other lost revenue for merchants.
2. Description: A separate SaaS product — a revenue-recovery platform with its own
   merchant-facing dashboard, recovery queue, and workers. It can be sold on its
   own and can also be offered as a post-ShopiFixer upsell when appropriate.
3. Business classification: SaaS Product (revenue-recovery platform).
4. Primary customer: Merchants wanting cart/revenue recovery — including merchants
   who never bought ShopiFixer.
5. Primary business outcome: Recovered merchant revenue and recurring Abando
   subscription revenue for Stafford.
6. Primary department owner: Revenue; Abando is its own product engine.
7. Revenue model: Recurring SaaS — subscription MRR plus a recovery percentage
   (`client.revenue.abando_recurring_mrr`, `abando_percentage`).
8. Inputs: Merchant signals, cart/checkout events, recovery opportunities.
9. Outputs: Recovery actions, recovered revenue attribution, merchant dashboard
   state, subscription.
10. Dependencies: Its own product runtime; may consume a ShopiFixer proof package
    as upsell rationale, but does not depend on ShopiFixer to function.
11. Non-goals: It is NOT part of ShopiFixer, NOT a bundled ShopiFixer continuation,
    NOT dependent on ShopiFixer, and its recovered merchant value is NOT Stafford
    revenue until Stafford is billed/paid.
12. Repository authority: `docs/abando-system-overview.md` (system loop),
    `staffordos/commercial/merchant_lifecycle_state_machine_v1.json`
    (`abando_upsell_ready`, `abando_subscribed`), `client_registry` `abando`/
    `revenue` fields.

## 5. Actinventory

1. Purpose: Reserved. No active business purpose today.
2. Description: A name-reserved / inactive future offering. Not defined,
   delivered, or sold.
3. Business classification: Future / Reserved. Not an active product or service.
4. Primary customer: None (reserved).
5. Primary business outcome: None (reserved).
6. Primary department owner: None assigned; Executive holds the reservation.
7. Revenue model: None.
8. Inputs: None.
9. Outputs: None.
10. Dependencies: None.
11. Non-goals: It is NOT an active product, NOT a service, NOT part of the active
    portfolio, and must NOT be routed to, sold, or represented as operational.
12. Repository authority: None authoritative. Existing UI/planning references are
    placeholders and roadmap-only (see Known Terminology Conflicts) and do not
    grant it active status.

---

## 13. Related authorities

This document sits alongside and defers to these existing authorities. On product
identity, this document is authoritative; on their specific domains, they are:

- Business lifecycle — `staffordos/authority/canonical_business_lifecycle_v1.md`
  (the end-to-end lifecycle S1–S11 that these products flow through).
- Merchant lifecycle (entity-level) —
  `staffordos/merchant_registry/merchant_lifecycle_registry_v1.json`, with
  `staffordos/commercial/merchant_lifecycle_state_machine_v1.json` as the derived
  current-stage model.
- Payment authority — `staffordos/authority/payment_lifecycle_registry_v1.md`
  (payment_received may be marked only by the Stripe webhook authority).
- Execution authority — `staffordos/authority/authority_registry_v1.md`
  (Checkout Authority, Packet Authority) and the governed execute action
  (`staffordos/ui/operator-frontend/app/api/operator/execute-primary-action/route.ts`).
- Operator authority —
  `staffordos/control_spine/contracts/ross_operator_contract_v1.json`.
- Routing authority —
  `staffordos/authority/output/product_routing_authority_v1.md`.

---

## 14. Known terminology conflicts (repository-backed)

1. Actinventory surfaced despite being reserved. The operator UI already presents
   Actinventory as if it were part of the portfolio:
   `staffordos/ui/operator-frontend/app/operator/products/page.tsx` (placeholder
   product card), `.../capacity/page.tsx` (listed as both `serviceName` and
   `product`), `.../analytics/page.tsx` (analytics tile), and the system-map
   route/page ("Future product summaries for Abando, Shopifixer, Actinventory,
   and StaffordOS"). Canonical position: Actinventory is reserved/inactive. These
   are placeholder/roadmap references and do NOT make it active. (Do not modify
   UI in this mission; flag for later cleanup.)

2. ShopiFixer classified as a "product" and as a "service" inconsistently.
   `products/page.tsx` lists "Shopifixer" as a product card; `capacity/page.tsx`
   lists it as both `serviceName` and `product`. Canonical position: ShopiFixer is
   a SERVICE, not a product, and not SaaS.

3. Capitalization drift: "Shopifixer" vs "ShopiFixer". UI and some planning docs
   use "Shopifixer"; the commercial definition and this authority use "ShopiFixer".
   Canonical spelling: ShopiFixer.

4. Generic service-vs-product labeling in `capacity/page.tsx`. Every offering
   (Abando, Shopifixer, Actinventory) is labeled both `serviceName` and `product`
   in that file, so the file does not encode canonical classification. Canonical
   classification lives here: StaffordOS = internal platform; ShopiFixer =
   service; Abando = SaaS product; Actinventory = reserved.

5. "Platform" used loosely for StaffordOS. Planning docs call StaffordOS an
   "operator platform" / "broader platform"
   (`staffordos/planning/Module_Roadmap_v1.md`, `StaffordOS_WBS_v1.md`).
   Acceptable only as INTERNAL platform; StaffordOS is never a customer-facing
   SaaS.

6. Abando-first pricing drift (historical, being corrected). Quarantined docs note
   the public pricing page emphasized Abando subscriptions over ShopiFixer
   (`staffordos/governance/quarantine/20260604_untracked_artifacts/shopifixer_conversion_audit_v1.md`).
   Canonical position: ShopiFixer is the first-touch conversion service; Abando is
   a separate SaaS product and optional upsell — not the default continuation.

7. Merchant value vs Stafford revenue. Abando recovered value and ShopiFixer
   merchant value must never be counted as Stafford revenue until billed/paid
   (inherited from the payment/revenue authority and the business lifecycle).

---

## 15. Governance

1. Future engineering agents (Claude, Codex, ChatGPT, and future AI agents) must
   read and use these definitions before implementing features that touch
   products, services, platforms, or internal systems.
2. If an implementation, UI label, prompt, or document conflicts with this
   document, this document is authoritative until formally superseded, and the
   conflicting source should be corrected.
3. Reconcile, do not fork: existing files that use these names remain; where they
   disagree with this authority (Section 14), they are corrected to conform, not
   duplicated.
4. Classification is fixed: Stafford Media Consulting = company; StaffordOS =
   internal platform (not SaaS); ShopiFixer = service (not SaaS); Abando =
   separate SaaS product; Actinventory = reserved/inactive.
5. No new product may be introduced, and no reserved name (Actinventory) may be
   activated, without updating this document first.
6. Versioning: this is `_v1`. A change to any entity's identity or classification
   requires `_v2` plus a migration note; do not silently redefine `_v1`.
7. This is documentation only. It does not authorize code, registry, JSON, UI,
   lifecycle, fiscal, or vocabulary changes.
