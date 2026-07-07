# ATTRIBUTION & TRACEABILITY ARCHITECTURE V1

## Executive Summary

This Operational Architecture defines how StaffordOS achieves **complete business
traceability** — a founder drilling from an annual goal down to a single dollar of
Stafford Revenue, and back up from any dollar to the campaign, asset, and source
that produced it, with **no black boxes**.

Repository truth: the **core spine already has real identifiers** —
`lead_id → relationship_id → merchant_id/client_id → opportunity_id → delivery_id
→ (packet/Stripe payment identity) → client_id (lifetime)`. Traceability breaks at
**two ends and a few artifacts**:

- **Attribution head is missing:** no Fiscal-Year/Quarter/Objective IDs, no
  per-campaign `campaign_id` on leads (only a per-*type* slug), no Asset ID, no
  UTM.
- **Expansion tail is missing:** no Abando `subscription_id`, no `renewal_id`.
- **Artifact IDs missing/unlinked:** no `proposal_id`, no `evidence_id`; `audit_id`
  exists only on an isolated audit surface, not linked into the merchant lifecycle.

So today a dollar can be traced **from Lead down to Revenue and up to the Merchant**,
but **not up to the Campaign/Asset/Source** that generated it. This document
defines the canonical chain, the ID matrix (exist vs missing), attribution rules
(decision points, not choices), and the founder drill-down — and marks every gap as
Known Drift.

This is documentation only. It changes no code, JSON, registries, UI, validators,
constitutional authorities, or operational architecture documents (it references
them).

---

## Section 1 — Purpose

Attribution exists so every business outcome has a provenance: you can always
answer "where did this come from and what did it cost?" Distinctions:

- **Traceability** — the ability to follow a specific record (this dollar, this
  lead) along a chain of preserved identifiers. Deterministic, per-record.
- **Analytics** — aggregate measurement of behavior/performance across records.
- **Reporting** — periodic summaries of state and results (e.g. monthly review).
- **Business Intelligence** — cross-cutting analysis to inform decisions.

This document is about **traceability first** — the identifier chain that analytics,
reporting, and BI all depend on. Without traceability, the others are estimates.

---

## Section 2 — Canonical Traceability Chain

```
Annual Goal → Quarter → Marketing Objective → Campaign → Ad/Asset → Traffic Source
   ↓ (Marketing owns)
Lead → Relationship → Merchant
   ↓ (ownership → Sales at qualification)
Proposal → Audit → Fix Sprint → Evidence
   ↓ (Delivery owns; Finance at payment)
Payment → Stafford Revenue
   ↓ (Client Success owns)
Customer Success → Abando → Renewal → Lifetime Value
```

Ownership transitions (per department architecture + reconciled lifecycle):
- Annual Goal…Traffic Source…Lead: **Marketing**.
- Lead → qualification: hands to **Sales** (Relationship, Merchant, Proposal, Audit).
- Fix Sprint, Evidence: **Delivery**.
- Payment, Revenue: **Finance** (capture = Stripe webhook only).
- Customer Success, Abando readiness, Renewal, LTV: **Client Success** (with Sales
  for the Abando offer; Finance for revenue).

Every transition must preserve the upstream identifiers so provenance is never
lost.

---

## Section 3 — Canonical Business IDs (repository truth: exist vs missing)

| Canonical ID | Repository field / store | Status |
| --- | --- | --- |
| Fiscal Year ID | — (fiscal layer greenfield) | ❌ Missing |
| Quarter ID | — | ❌ Missing |
| Marketing Objective ID | — | ❌ Missing |
| Campaign ID | `campaignResolver` `campaign_<type>` (per-type slug, not per-campaign; not on leads) | ⚠ Partial/broken |
| Asset ID | — | ❌ Missing |
| Traffic Source | `lead.source` (data-origin tag: `staffordos`, `manual_backfill`, `unknown`) | ⚠ Partial (not marketing source) |
| UTM | — | ❌ Missing |
| Lead ID | `lead_registry` `lead_id` | ✅ Exists |
| Relationship ID | `relationshipResolver` `relationship_id` (`rel_*`) | ✅ Exists |
| Merchant ID | `merchant_lifecycle` `merchant_id` | ✅ Exists |
| Client ID | `client_registry` `client_id` (also serves as Lifetime Customer ID) | ✅ Exists |
| Opportunity ID | merchant `opportunity_id` (`opp_*`) + `opportunity_units.unit_id` | ✅ Exists |
| Proposal ID | — (only `offer_status`/`offer_price`, no id) | ❌ Missing |
| Audit ID | `staffordos/audit/*` `audit_id` exists but NOT linked to the merchant lifecycle (`audit_status` only) | ⚠ Partial (unlinked) |
| Fix Sprint / Delivery ID | merchant `delivery_id` (`delivery_*`) | ✅ Exists |
| Action ID | merchant `action_id` (`action_*`) | ✅ Exists |
| Evidence ID | — (proof_runs are path-based; `before/after_evidence_status`, `proof_package_status`) | ❌ Missing |
| Payment ID | packet `packet_id` / `reservation_id` / Stripe `payment_reference` (payment authority) | ✅ Exists (reservation_id may be null pre-payment) |
| Customer Success ID | — (`review_status` only) | ❌ Missing |
| Abando Subscription ID | — (`abando_subscribed` state + `client.abando`, no id) | ❌ Missing |
| Renewal ID | — | ❌ Missing |
| Lifetime Customer ID | `client_id` | ✅ Exists |

Summary: the **core spine IDs exist** (Lead, Relationship, Merchant, Client,
Opportunity, Delivery, Action, Payment). The **attribution head** (Fiscal/Quarter/
Objective/Campaign/Asset/UTM), **expansion tail** (Subscription/Renewal), and some
**artifact IDs** (Proposal, Evidence, linked Audit) are missing.

---

## Section 4 — Attribution Rules (decision points, not chosen here)

Canonical attribution models to decide between (this document does not choose an
implementation):

- **First Touch** — credit the first campaign/source that produced the lead.
- **Last Touch** — credit the last touch before conversion.
- **Multi-touch** — distribute credit across touches.
- **Referral** — credit the referring customer/relationship (lifecycle S9).
- **Organic** — non-paid inbound (e.g. website form).
- **Paid** — paid channels (none implemented today).
- **Manual** — operator-attributed.
- **Unknown** — no attribution captured.

Decision points to resolve when attribution is implemented: which model is
canonical; how multi-touch weights are assigned; how referral credit interacts with
campaign credit; and the default when no `campaign_id`/UTM is present. Repository
truth today: attribution is effectively **Unknown/Manual** — `lead.source` is a
data-origin tag, not a marketing attribution, and no model is applied.

---

## Section 5 — Data Lineage (what must survive each transition)

```
Campaign → Lead → Relationship → Merchant → Proposal → Audit → Fix Sprint → Evidence → Payment → Revenue → Expansion → Renewal
```

Information that must be preserved at every hop:
- **Upstream IDs** — each record carries the IDs of everything above it (campaign,
  source, lead, relationship, merchant), so any record resolves its full origin.
- **Ownership + timestamp** — which department owned it and when it transitioned.
- **Money classification** — spend vs estimate vs captured (never conflated).
- **Evidence linkage** — proof references travel with the engagement.

Today the lineage survives from **Lead onward** (via `lead_id`/`client_id`/
`merchant_id` on the merchant lifecycle); it does **not** survive from **Campaign →
Lead** (no `campaign_id`/UTM on the lead), so origin is lost above the lead.

---

## Section 6 — Financial Traceability

```
Budget (planned; no store)  →  Spend (actual; no store)  →  Pipeline Value (ESTIMATE)
  →  Captured Revenue (client_registry.stafford_revenue_earned; Stripe-gated)
  →  Recurring Revenue (abando_recurring_mrr)  →  Lifetime Value (total_lifetime_value)
```

- **Estimates:** Budget, Spend (planned), Pipeline Value — none are revenue;
  Pipeline Value is inflated today (money model known issue).
- **Actuals:** Captured Stafford Revenue, Recurring Revenue, LTV — the only figures
  that count as revenue; capture only via the Stripe webhook.
- Merchant Value is never part of this line as Stafford revenue.

Financial traceability to a campaign is blocked by the missing attribution head
(no `campaign_id`) and the missing spend store, even though captured revenue itself
is fully traceable to the merchant/client.

---

## Section 7 — Founder Drill-down (information architecture only)

Ross should be able to click straight down and back up, losing no provenance:

```
Quarter → Campaign → Lead → Relationship → Merchant → Payment → Revenue → Evidence → Customer Success → Abando
```

Each level shows its own IDs plus the IDs above/below, so any node links to its
origin and its outcomes. Today the drill-down is intact from **Lead downward**; the
**Quarter → Campaign → Lead** portion is not yet linkable (attribution head
missing). No implementation is specified.

---

## Section 8 — Executive Intelligence (questions StaffordOS should always answer)

- Where did this revenue originate? (traceable to Merchant/Client today; **not** to
  Campaign yet)
- Which campaign produced it? (**not answerable** today — attribution missing)
- What did it cost? (**not answerable** — no spend store)
- Which merchants never paid? (answerable — `payment_status`/`revenue_status`)
- Which campaigns lose money? (**not answerable** — needs spend + attribution)
- Which campaigns produce highest LTV? (**not answerable** — needs attribution;
  LTV exists per client)
- What is the ROI of a campaign? (**not answerable** — needs captured revenue ÷
  spend, both linked)

The answerable set is limited by the two missing ends; the merchant-and-revenue
core is already answerable.

---

## Section 9 — Known Repository Drift (documented, not solved)

1. **Broken campaign attribution** — no `campaign_id`/UTM on leads; origin lost
   above the lead.
2. **Missing IDs** — Fiscal/Quarter/Objective, Asset, Proposal, Evidence, Abando
   Subscription, Renewal.
3. **Placeholder/partial IDs** — `campaign_id` is a per-type slug; `lead.source` is
   a data-origin tag not a marketing source; `audit_id` exists but is unlinked to
   the merchant lifecycle; `reservation_id` can be null pre-payment.
4. **Disconnected surfaces** — no governed attribution/drill-down surface; some
   outreach `send_target` values are placeholder GitHub-issue URLs.
5. **Pipeline inflation** — `campaignResolver` `revenue_at_stake` is a synthesized,
   inflated estimate (money model known issue).
6. **Missing budget/spend tracking** — no budget or spend store, so cost side of
   ROI is absent.

---

## Section 10 — Future Capabilities (clearly future)

- Automatic attribution (future)
- Cross-platform attribution (future)
- Executive forecasting (future)
- Predictive ROI (future)
- Marketing Mix Modeling (future)
- AI attribution recommendations (future)
- Operational self-healing (future)

None exist today; named for planning only.

---

## Deliverables (summary)

### Canonical Traceability Chain
Annual Goal → Quarter → Objective → Campaign → Asset → Source → Lead → Relationship
→ Merchant → Proposal → Audit → Fix Sprint → Evidence → Payment → Revenue →
Customer Success → Abando → Renewal → LTV, with department ownership transitions
(Section 2).

### Business ID Matrix
Core spine IDs exist (Lead, Relationship, Merchant, Client, Opportunity, Delivery,
Action, Payment); attribution-head, expansion-tail, and artifact IDs missing
(Section 3).

### Attribution Matrix
First/Last/Multi-touch, Referral, Organic, Paid, Manual, Unknown as decision points;
today effectively Unknown/Manual (Section 4).

### Data Lineage
Upstream IDs + ownership + money classification + evidence must survive each hop;
survives from Lead onward, breaks at Campaign→Lead (Section 5).

### Financial Traceability
Budget/Spend/Pipeline = estimate; Captured/Recurring/LTV = actual; capture
Stripe-gated; campaign-level financial trace blocked by missing head/spend
(Section 6).

### Founder Drill-down
Quarter→Campaign→Lead→…→Abando, intact from Lead down, not yet linkable at the
Quarter→Campaign→Lead head (Section 7).

### Executive Intelligence
Merchant/revenue questions answerable; campaign origin/cost/ROI/LTV-by-campaign not
yet answerable (Section 8).

### Known Drift
Broken attribution, missing/placeholder IDs, disconnected surfaces, pipeline
inflation, missing budget/spend (Section 9).

### Future Capabilities
Automatic/cross-platform attribution, forecasting, predictive ROI, MMM, AI
recommendations, self-healing (Section 10).

---

## Certification

CONDITIONAL GO.

The Attribution & Traceability Architecture is internally consistent with the
constitutional and operational authorities. It correctly identifies that the **core
spine (Lead → Revenue → LTV) is already traceable via real IDs**, and that complete
"no black boxes" traceability is blocked by a **missing attribution head**
(Fiscal/Quarter/Objective/Campaign/Asset/UTM) and **expansion tail** (Subscription/
Renewal), plus a few missing artifact IDs (Proposal/Evidence/linked Audit).

Condition before complete traceability is achievable: implement the attribution
head — a per-campaign `campaign_id` + UTM stamped on the lead — plus spend storage
and the missing artifact/subscription/renewal IDs, and de-inflate Pipeline Value.
These are future, separately-validated missions named in Known Drift and Future
Capabilities. Until the attribution head exists, revenue traces up to the Merchant
but not to the Campaign, and campaign ROI/LTV-by-campaign are not answerable.

This is documentation only. No code, JSON, registries, UI, validators,
constitutional authorities, or operational architecture documents were changed.
