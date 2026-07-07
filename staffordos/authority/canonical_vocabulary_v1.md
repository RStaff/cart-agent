# CANONICAL VOCABULARY V1

## Executive Summary

This document is the constitutional dictionary for Stafford Media Consulting.
Every important business term has exactly one canonical meaning here. The
vocabulary governs documentation, UI, dashboards, AI agents, prompts, future code,
reports, planning, and department communication.

It reconciles — it does not rename implementation. Existing code, JSON, and UI
identifiers stay as they are; this document defines the canonical *meaning* that
new business text, agent output, and future code must conform to, and records the
synonyms, deprecated terms, and forbidden terms discovered across the repository.

It derives from and must not contradict the constitutional authorities:
`canonical_business_lifecycle_v1.md`, `product_definitions_v1.md`,
`canonical_money_model_v1.md`, `fiscal_operating_model_v1.md`, and
`canonical_department_architecture_v1.md`.

This is documentation only. It changes no code, JSON, registries, UI, validators,
or other authority documents (it references them).

---

## Section 1 — Purpose

StaffordOS requires a canonical vocabulary because the repository already contains
overlapping and drifting terminology (multiple lifecycle vocabularies, four
overlapping entity terms, several revenue synonyms, mixed product spellings). When
different documents, screens, and agents mean different things by the same word,
trust erodes and revenue can be misreported. A single dictionary ensures every
business term has one meaning across everything StaffordOS produces.

Every business term must have exactly one canonical definition, one owner, and one
business meaning. Implementation identifiers may differ from the canonical name;
business/user-facing language and agent output must use the canonical meaning.

---

## Section 2 — Vocabulary Principles

1. **One definition** per term — no term means two things.
2. **One owner** per term — a single department is accountable for it.
3. **One business meaning** — the meaning is fixed even if labels or code differ.
4. **Implementation may differ** — code/JSON field names need not match the
   canonical name; the mapping is recorded, not forced.
5. **UI labels may evolve** — display strings can change as long as they express
   the canonical meaning.
6. **AI agents must use canonical definitions** — agents reason and write in
   canonical terms and never use forbidden terms.
7. **Authorities win** — if any source contradicts a canonical definition, the
   authority (and this dictionary) win, and the source is corrected.

---

## Section 3 — Canonical Business Terms

Columns: Canonical Name · Definition / Business meaning · Owner · Authority ·
Related · Deprecated · Implementation notes.

### Company, systems, product, service

| Canonical Name | Definition / business meaning | Owner | Authority | Related | Deprecated | Implementation notes |
| --- | --- | --- | --- | --- | --- | --- |
| Stafford Media Consulting | The company that owns/operates everything. | Executive | product_definitions | StaffordOS | — | Referenced across docs; no single company file. |
| StaffordOS | Internal operating/governance/orchestration system. Not SaaS, not sold. | Executive/Engineering | product_definitions | Operator | "StaffordOS product/SaaS" | The whole `staffordos/` tree + operator UI. |
| ShopiFixer | Governed AI engineering **service** for Shopify owners; $950 Fix Sprint. Not SaaS. | Sales/Delivery | product_definitions; shopifixer_commercial_definition | Fix Sprint, Audit | "Shopifixer" (spelling), "ShopiFixer SaaS/product" | Code/UI sometimes spell "Shopifixer"; canonical is ShopiFixer. |
| Abando | Separate revenue-recovery **SaaS product**; standalone or post-ShopiFixer upsell. | Sales/Product | product_definitions; abando-system-overview | Recurring Revenue | "Abando-first" pricing | Own product engine + `abando.*` fields. |
| Actinventory | **Reserved / inactive** future offering; not an active product. | Executive | product_definitions | — | "Actinventory (active product/service)" | Surfaced in some UI as placeholder — not active. |

### Entities (customer journey)

| Canonical Name | Definition / business meaning | Owner | Authority | Related | Deprecated | Implementation notes |
| --- | --- | --- | --- | --- | --- | --- |
| Lead | An unqualified prospect. | Marketing/Sales | lifecycle S2 | Merchant, Relationship | — | `lead_registry_v1.json`. |
| Client | A merchant with an engagement record in the client registry. | Sales/Client Success | lifecycle; department arch | Merchant | (see drift) | `client_registry_v1.json`; overlaps Merchant. |
| Merchant | The Shopify store owner served/sold to — the canonical customer term. | Sales/Client Success | lifecycle; merchant_lifecycle | Client, Lead | — | `merchant_lifecycle_registry_v1.json` (entity authority). |
| Relationship | The unified cross-store identity linking Lead ↔ Client ↔ Merchant. | Sales | lifecycle; relationshipResolver | Lead, Client, Merchant | — | `relationshipResolver.ts`. |
| Operator | The human executive operating StaffordOS (Ross). | Executive | department arch | AI Agent | — | CEO Cockpit / operator UI. |
| AI Agent | A registered agent that supports a department; never owns it. | AI Governance | department arch; agent_registry | Operator | invented agent names | `agent_registry_v1.json` (17 agents). |

### Process & artifact terms

| Canonical Name | Definition / business meaning | Owner | Authority | Related | Deprecated | Implementation notes |
| --- | --- | --- | --- | --- | --- | --- |
| Campaign | A coordinated outreach/conversion motion across relationships. | Marketing | lifecycle S1; fiscal model | Lead | — | `campaignResolver` (synthesized). |
| Opportunity | A scoped chance to earn from a merchant. | Sales | lifecycle; opportunity_units | Opportunity Value | — | `opportunity_units_v1.json`. |
| Proposal | The offer presented to a merchant (ShopiFixer Fix Sprint / Abando). | Sales | lifecycle S5 | Payment | — | merchant `offer_status`/`offer_price`. |
| Audit | The store inspection that is ShopiFixer's sales asset. | Sales (agent-run) | lifecycle S5; commercial def | Fix Sprint, Evidence | — | merchant `audit_status`. |
| Fix Sprint | The scoped ShopiFixer engagement delivered for $950. | Delivery | commercial def; lifecycle S6 | Audit, Evidence | "redesign/retainer/consulting" | fulfillment truth. |
| Evidence | Verifiable before/after proof of executed work. | Delivery | lifecycle S6 | Proof Package | — | `proof_runs/`, `execution_proof_register`. |
| Payment | A merchant payment captured for Stafford. | Finance | payment authority | Stafford Revenue | — | Capture only via Stripe webhook. |

### Money terms (see money model)

| Canonical Name | Definition / business meaning | Owner | Authority | Related | Deprecated | Implementation notes |
| --- | --- | --- | --- | --- | --- | --- |
| Stafford Revenue | Money Stafford has actually earned. | Finance | money model | Payment, MRR | — | `client_registry.stafford_revenue_earned`. |
| Merchant Value | Recovered/proven value belonging to the merchant. Never revenue. | Client Success/Finance | money model | Revenue Gap | "Money at stake" (for this) | `abando.merchant_revenue_recovered`. |
| Pipeline Value | Aggregated **estimate** of potential future revenue. | Sales | money model | Opportunity Value | "Revenue at Stake", "Expected/Potential Revenue" | campaignResolver `revenue_at_stake` (inflated). |
| Opportunity Value | Potential value of one opportunity. | Sales | money model | Pipeline Value | — | `opportunity_units.value`. |
| Revenue Gap | Proven merchant value not yet converted to Stafford revenue (`merchant_value − stafford_revenue`). | Finance | money model | Merchant Value | — | dashboard `revenue_gaps[].gap`. |

### Fiscal & meta terms

| Canonical Name | Definition / business meaning | Owner | Authority | Related | Deprecated | Implementation notes |
| --- | --- | --- | --- | --- | --- | --- |
| Fiscal Year | Calendar year of planning (FY2027 = Jan 1 – Dec 31 2027). | Executive | fiscal model | Quarter | — | No fiscal store yet. |
| Quarter | Fiscal sub-period (Q1 Jan–Mar … Q4 Oct–Dec). | Executive | fiscal model | Fiscal Year | — | No quarter store yet. |
| Department | A functional area accountable for outcomes. | Executive | department arch | Authority | informal `department` field | runtime field only has `revenue`/`unknown`. |
| Authority | A document/system that is the source of truth for a domain. | Executive | this doc; authority_registry | Canonical Authority | — | `staffordos/authority/*`. |
| Validator | A script that checks conformance/proof; does not define truth. | Engineering/AI Gov | authority_registry | Authority | "revenue authority" (for figures) | `*_validator_v1.mjs`. |
| Projection | A derived, read-only rollup of an authority. | Finance/Engineering | money model | Canonical Authority | — | dashboard/ceo snapshots. |
| Canonical Authority | The single declared source of truth for a concept. | Executive | this doc | Authority, Projection | "duplicate authority" | one per concept. |

---

## Section 4 — Synonyms

| Surface synonym(s) | Canonical term | Rule |
| --- | --- | --- |
| Revenue at Stake, Expected Revenue, Potential Revenue | **Pipeline Value** (estimate) | Standardize toward "Pipeline Value"; always label as estimate; never captured revenue. |
| Money at stake (for merchant/gap value) | **Merchant Value** | Already corrected in Revenue Command (M3). |
| Shopifixer | **ShopiFixer** | Canonical spelling. |
| Client (as the customer) | **Merchant** | "Client" is the registry-level term; "Merchant" is the canonical customer term. |
| Operator platform / broader platform (for StaffordOS) | **StaffordOS (internal system)** | "platform" acceptable only as *internal*, never customer-facing SaaS. |

Do not rename implementation. These are the canonical business meanings; code/UI
identifiers may lag and are mapped, not forced.

---

## Section 5 — Deprecated Terminology

- **"Shopifixer"** (lowercase-f spelling) — inconsistent; use ShopiFixer.
- **"Revenue at Stake" / "Money at stake"** as revenue-sounding labels — should
  become "Pipeline Value (estimate)" / "Merchant Value" respectively; they read
  like banked revenue.
- **"Abando-first" pricing** — superseded; ShopiFixer is first-touch, Abando is a
  separate/optional product.
- **Dual "serviceName"+"product" labeling** of offerings (capacity UI) — does not
  encode canonical classification.
- **Actinventory as a portfolio product** in placeholder UI — it is reserved.

These should eventually disappear from business text and UI; implementation cleanup
is future work, not part of this document.

---

## Section 6 — Forbidden Terminology

Never use these — they contradict constitutional authorities:

- **"Merchant Value == Revenue"** / merchant/recovered value reported as Stafford
  Revenue (money model).
- **"ShopiFixer SaaS"** / ShopiFixer as a SaaS product (product_definitions).
- **"StaffordOS product" / "StaffordOS SaaS"** — StaffordOS is internal
  (product_definitions).
- **"Actinventory" as an active product/service** (product_definitions).
- **Estimates ("Pipeline Value", "revenue at stake") shown as captured revenue**
  (money model).
- **Any claim that payment can be marked outside the Stripe webhook** (payment
  authority).
- **Any wording contradicting a constitutional authority.**

---

## Section 7 — AI Usage Rules

Applies to Codex, Claude, GPT, and future agents:

1. **Read before writing.** Consult this vocabulary (and the referenced
   authorities) before generating documentation, UI text, prompts, reports, or
   code comments.
2. **Write in canonical terms.** Use canonical names and meanings in all
   business/user-facing output.
3. **Never use forbidden terms** (Section 6). Never present estimates or merchant
   value as revenue. Never assert payment outside the Stripe webhook.
4. **Preserve implementation identifiers.** Do not rename existing code/JSON/UI
   fields to match canonical names; when a code term differs, use the canonical
   term in prose and note the mapping.
5. **Prefer authority on conflict.** If a source disagrees with this dictionary,
   follow the dictionary and flag the source for correction — do not silently
   propagate drift.
6. **Do not invent terms or agents.** Only use terms defined here and agents in
   `agent_registry_v1.json`.

---

## Section 8 — Repository Mapping

| Vocabulary cluster | Governing authority |
| --- | --- |
| Company / systems / product / service | `product_definitions_v1.md` |
| Entities + lifecycle process terms | `canonical_business_lifecycle_v1.md` |
| Money terms | `canonical_money_model_v1.md` |
| Fiscal terms | `fiscal_operating_model_v1.md` |
| Department / ownership terms | `canonical_department_architecture_v1.md` |
| Payment term | `payment_lifecycle_registry_v1.md` |
| Authority/validator/projection meta | `authority_registry_v1.md` + this doc |

No implementation is mapped or changed; this is a definition-to-authority index.

---

## Section 9 — Known Drift (documented, not fixed)

1. **Entity sprawl:** Lead / Client / Merchant / Relationship overlap across four
   registries; "Client" and "Merchant" both denote the customer.
2. **Lifecycle vocabularies:** ≥4 stage/phase vocabularies exist
   (`merchant_lifecycle` per-field statuses, state-machine enum,
   `lifecycleTerminology.ts`, `translateStage()`) not yet reconciled to one list.
3. **Revenue synonyms in UI:** "revenue at stake" / "expected revenue" still
   appear as labels; canonical is Pipeline Value (estimate).
4. **Spelling drift:** "Shopifixer" vs "ShopiFixer" in UI/planning.
5. **Actinventory surfaced** in products/capacity/analytics/system-map despite
   reserved status.
6. **Informal `department` field** (`revenue`/`unknown`) vs the 9 canonical
   departments.
7. **Pipeline Value inflated** in `campaignResolver` (money model known issue).

---

## Section 10 — Related Authorities

References only:

- `staffordos/authority/canonical_business_lifecycle_v1.md`
- `staffordos/authority/product_definitions_v1.md`
- `staffordos/authority/canonical_money_model_v1.md`
- `staffordos/authority/fiscal_operating_model_v1.md`
- `staffordos/authority/canonical_department_architecture_v1.md`
- `staffordos/authority/payment_lifecycle_registry_v1.md`
- `staffordos/authority/authority_registry_v1.md`

---

## Deliverables (summary)

### Vocabulary Matrix
~30 canonical terms across company/systems/product/service, entities, process/
artifact, money, and fiscal/meta clusters — each with definition, owner, authority,
related, deprecated, and implementation notes (Section 3).

### Synonym Matrix
Revenue at Stake / Expected Revenue / Potential Revenue → Pipeline Value; Money at
stake → Merchant Value; Shopifixer → ShopiFixer; Client → Merchant (customer);
platform → StaffordOS internal (Section 4).

### Deprecated Terms
"Shopifixer", "Revenue/Money at Stake" as revenue labels, "Abando-first",
dual service/product labeling, Actinventory-as-product (Section 5).

### Forbidden Terms
Merchant Value == Revenue; ShopiFixer SaaS; StaffordOS product; Actinventory
active; estimates as captured revenue; payment outside Stripe webhook (Section 6).

### AI Usage Rules
Read-before-write, canonical terms only, no forbidden terms, preserve
implementation identifiers, authority wins on conflict, no invented terms/agents
(Section 7).

### Known Drift
Entity sprawl, lifecycle vocabularies, revenue synonyms in UI, spelling drift,
Actinventory surfaced, informal department field, inflated Pipeline Value
(Section 9).

---

## Certification

CONDITIONAL GO.

The canonical vocabulary is internally consistent with all five constitutional
authorities, assigns one meaning/owner/authority per term, and records the synonym,
deprecated, and forbidden sets needed to stop drift in new work. It is sufficient
to govern documentation, prompts, reports, planning, and future code from this
point forward.

Conditions before the vocabulary is fully realized in the running system: the
implementation drift it documents (entity sprawl, lifecycle-vocabulary
reconciliation, revenue-label standardization, spelling, Actinventory surfacing,
department-field formalization, Pipeline Value de-inflation) must be resolved in
later, separately-validated missions. Those are named as Known Drift, not solved
here.

This is documentation only. No code, JSON, registries, UI, validators, or other
authority documents were changed.
