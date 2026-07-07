# CANONICAL MONEY MODEL V1

## Executive Summary

This document is the single canonical authority for every money-related concept
used throughout StaffordOS. It reconciles the findings of the Revenue Authority
Certification without changing any implementation.

Repository truth today:

- `client_registry_v1.json` is the source of record for actual Stafford revenue.
  Its rollups in `operator_dashboard_snapshot_v1.json` and
  `ceo_truth_snapshot_v1.json` currently agree: Stafford revenue = $0, merchant
  value recovered = $100 (a dev-store proof value), recurring MRR = $0.
- The Stripe webhook is the only authority that converts a pending payment into
  earned Stafford revenue.
- One money figure on a primary surface — "revenue at stake" from
  `campaignResolver` — is synthesized and inflated, and is NOT derived from the
  source of record. It must be treated as an estimate, never as captured revenue.

This document defines each money concept, names one canonical authority per
concept, and states the transformation rules that keep estimates, merchant value,
and Stafford revenue from being confused. It renames nothing; it only defines and
recommends.

This is a documentation authority. It changes no code, JSON, registries, UI,
validators, or lifecycle documents.

---

## Canonical Money Model (overview)

```
SOURCE OF RECORD (actual money):
  client_registry_v1.json .revenue / .abando
    stafford_revenue_earned      → Stafford Revenue (captured)      [=0]
    shopifixer_one_time          → One-Time Revenue                 [=0]
    abando_recurring_mrr         → Recurring Revenue                [=0]
    total_lifetime_value         → Lifetime Value                   [=0]
    abando.merchant_revenue_recovered → Merchant Value (proof)      [=100]
        │
        └── DERIVED PROJECTIONS (read-only rollups):
              operator_dashboard_snapshot_v1.json (revenue_summary, top_metrics, revenue_gaps)
              ceo_truth_snapshot_v1.json (revenue)

POTENTIAL money (NOT captured):
  opportunity_units_v1.json .value/.probability   → Opportunity Value (stored)
  campaignResolver revenue_at_stake / actionResolver expected_revenue_impact
                                                   → Pipeline Value (derived, currently inflated)

CAPTURE GATE:
  payment_lifecycle_registry_v1.md → payment_received only via web/src/routes/stripeWebhook.esm.js
```

Two hard walls run through the whole model:

- **Potential ≠ Captured.** Opportunity Value and Pipeline Value are estimates and
  may never be displayed as captured revenue.
- **Merchant ≠ Stafford.** Merchant Value belongs to the merchant and may never be
  reported as Stafford Revenue until Stafford is actually paid.

---

## Canonical Money Concepts

### 1. Stafford Revenue

- Definition: Money Stafford Media Consulting has actually earned.
- Business meaning: The company's real, banked/earned revenue.
- Purpose: The only figure that counts toward revenue targets, ROI, and fiscal
  actuals.
- Owner: Finance; Executive (Ross) for reporting.
- Canonical authority: `client_registry_v1.json` `revenue.stafford_revenue_earned`.
- Storage: Stored (source of record).
- How earned: Only after `payment_received` is granted by the Stripe webhook
  authority for a real engagement.
- Inputs: Verified payment (Stripe webhook) tied to an offer/engagement.
- Outputs: Rollups in dashboard/CEO snapshots; fiscal actuals.
- Dependencies: Payment authority (Stripe webhook); client_registry.
- Allowed transformations: Sum across clients into derived rollups; report as
  actuals.
- Forbidden transformations: Deriving it from merchant value, opportunity value,
  pipeline value, offers, or proposals; marking it earned by any path other than
  the Stripe webhook.
- What it is NOT: NOT merchant value, NOT recovered value, NOT pipeline/estimate,
  NOT an offer or proposal amount.

### 2. Merchant Value

- Definition: Value recovered or proven for the merchant (e.g. Abando recovered
  revenue, ShopiFixer proof value).
- Business meaning: The merchant's money/benefit — evidence that the work helps
  the merchant. It is the sales/proof asset, not Stafford's earnings.
- Purpose: Demonstrate impact; justify offers and upsells.
- Owner: Client Success (proof/evidence); Finance for reporting.
- Canonical authority: `client_registry_v1.json` `abando.merchant_revenue_recovered`
  (rolled into dashboard `revenue_summary.merchant_revenue_recovered` and
  `revenue_gaps[].merchant_revenue`).
- Storage: Stored (source of record) with derived rollups.
- Evidence: Proof runs / recovery attribution (e.g. dev-store proof = $100).
- Inputs: Recovery/attribution data; proof packages.
- Outputs: Merchant value chips; revenue gap input.
- Dependencies: client_registry; proof/evidence surfaces.
- Allowed transformations: Display as "merchant value recovered (proof)"; use as
  offer/upsell rationale; subtract from gap.
- Forbidden transformations: Reporting as Stafford revenue; summing into Stafford
  revenue targets, ROI, or fiscal actuals.
- What it is NOT: NOT Stafford revenue, NOT captured Stafford earnings.

### 3. Opportunity Value

- Definition: The potential value of a single scoped opportunity.
- Business meaning: What one opportunity could be worth if it converts.
- Purpose: Prioritize opportunities; feed pipeline estimates.
- Owner: Sales.
- Canonical authority: `staffordos/units/opportunity_units_v1.json` `value`
  (with `probability` and `confidence`).
- Storage: Stored per unit (a scoped, deterministic estimate).
- Inputs: Opportunity scoring; offer/opportunity data.
- Outputs: Input to Pipeline Value; prioritization.
- Dependencies: opportunity scoring; unit registry.
- Allowed transformations: Weight by probability/confidence; aggregate into
  Pipeline Value clearly labeled as estimate.
- Forbidden transformations: Display as captured revenue or as Stafford revenue.
- What it is NOT: NOT captured revenue, NOT a pipeline total by itself, NOT a
  guarantee.

### 4. Pipeline Value

- Definition: The aggregated potential value of open opportunities/actions.
- Business meaning: An estimate of possible future revenue, not money in hand.
- Purpose: Forecasting and prioritization only.
- Owner: Sales.
- Canonical authority: A DERIVED projection over Opportunity Value and action
  `expected_revenue_impact`. There is no trustworthy canonical pipeline
  calculation today: the current implementation
  (`campaignResolver` `revenue_at_stake`, fed by `actionResolver`
  `expected_revenue_impact`) is inflated (see Known Issues) and must be treated
  as an unverified estimate.
- Storage: Derived (calculated on request).
- Inputs: Opportunity Value; `expected_revenue_impact`.
- Outputs: "Revenue at stake" chips (Executive Home, Campaigns) — currently
  inflated.
- Dependencies: opportunity_units; actionResolver; campaignResolver.
- Allowed transformations: Aggregate as an explicitly-labeled estimate/forecast.
- Forbidden transformations: Display as captured revenue, as Stafford revenue, or
  as banked pipeline without an "estimate" qualifier; double-count across
  campaigns/relationships.
- What it is NOT: NOT captured revenue, NOT Stafford revenue, NOT authoritative in
  its present inflated form.

### 5. Revenue Gap

- Definition: Proven merchant value not yet converted into Stafford revenue.
- Formula: `revenue_gap = merchant_value − stafford_revenue` (currently 100 − 0 =
  100).
- Business meaning: How much proven merchant value has not yet become Stafford
  earnings — a conversion opportunity, not money owed.
- Purpose: Highlight unconverted proven value for follow-up.
- Owner: Finance.
- Canonical authority: Derived in `operator_dashboard_snapshot_v1.json`
  `revenue_gaps[].gap` from client_registry values.
- Storage: Derived (calculated).
- Inputs: Merchant Value; Stafford Revenue.
- Outputs: "Merchant value recovered (proof)" context on Revenue Command.
- Dependencies: client_registry; dashboard projection.
- Allowed transformations: Present with a one-line explanation of its meaning.
- Forbidden transformations: Presenting the gap as Stafford revenue "ready to
  bank," or as money already earned.
- What it is NOT: NOT Stafford revenue, NOT an invoice or amount owed to Stafford.

### 6. Recurring Revenue

- Definition: Ongoing subscription revenue (Abando MRR).
- Business meaning: Predictable monthly Stafford revenue from Abando subscriptions.
- Purpose: Recurring component of Stafford revenue and LTV.
- Owner: Finance; Abando product engine.
- Canonical authority: `client_registry_v1.json` `revenue.abando_recurring_mrr`
  (with `abando_percentage`).
- Storage: Stored.
- Inputs: Abando subscription state (billed).
- Outputs: Rollups; LTV; fiscal recurring targets.
- Dependencies: client_registry; Abando billing (Stripe).
- Allowed transformations: Sum into Stafford revenue and LTV once billed.
- Forbidden transformations: Counting recovered merchant value or unbilled upsell
  intent as recurring revenue.
- What it is NOT: NOT one-time revenue, NOT merchant recovered value, NOT unbilled
  pipeline.

### 7. One-Time Revenue

- Definition: Single-charge Stafford revenue — the ShopiFixer $950 Fix Sprint fee.
- Business meaning: Non-recurring service revenue.
- Purpose: One-time component of Stafford revenue and LTV.
- Owner: Finance.
- Canonical authority: `client_registry_v1.json` `revenue.shopifixer_one_time`
  (packaging authority: `shopifixer_commercial_definition_v1.md`, $950 flat fee).
- Storage: Stored.
- Inputs: Verified ShopiFixer payment (Stripe webhook).
- Outputs: Rollups; LTV; fiscal one-time targets.
- Dependencies: client_registry; payment authority.
- Allowed transformations: Sum into Stafford revenue and LTV once paid.
- Forbidden transformations: Recognizing before payment; counting the offer price
  as revenue before capture.
- What it is NOT: NOT recurring revenue, NOT an offer/proposal amount, NOT merchant
  value.

### 8. Lifetime Value

- Definition: Total realized Stafford revenue from a client over time.
- Business meaning: One-time plus recurring revenue actually earned from a client.
- Purpose: Client value reporting; prioritization.
- Owner: Finance.
- Canonical authority: `client_registry_v1.json` `revenue.total_lifetime_value`
  (per-merchant echo: merchant_lifecycle `lifetime_value`).
- Storage: Derived/aggregate over captured One-Time + Recurring Revenue.
- Inputs: One-Time Revenue; Recurring Revenue (captured).
- Outputs: Client value; prioritization inputs.
- Dependencies: client_registry.
- Allowed transformations: Sum of captured one-time + recurring for a client.
- Forbidden transformations: Including pipeline, opportunity, or merchant value;
  including unbilled/unpaid amounts.
- What it is NOT: NOT pipeline/estimate, NOT merchant value, NOT projected future
  revenue.

---

## Authority Rules (explicit)

1. `client_registry_v1.json` is the canonical source of actual Stafford revenue.
2. The Stripe webhook (`web/src/routes/stripeWebhook.esm.js`) is the only authority
   that converts a pending payment into earned Stafford revenue
   (`payment_lifecycle_registry_v1.md`).
3. `operator_dashboard_snapshot_v1.json` and `ceo_truth_snapshot_v1.json` are
   DERIVED projections of client_registry, not independent authorities.
4. Merchant Value can never be reported as Stafford Revenue.
5. Estimated values (Opportunity Value, Pipeline Value, "revenue at stake") can
   never be displayed as captured revenue.

---

## Money Concept Matrix

| Concept | Canonical authority | Stored/Derived | Value today | What it is NOT |
| --- | --- | --- | --- | --- |
| Stafford Revenue | client_registry `stafford_revenue_earned` | Stored (record) | $0 | merchant value / pipeline / estimate |
| Merchant Value | client_registry `abando.merchant_revenue_recovered` | Stored (record) | $100 | Stafford revenue |
| Opportunity Value | `opportunity_units_v1.json` `value` | Stored (estimate) | per unit | captured revenue |
| Pipeline Value | derived (campaignResolver `revenue_at_stake`) | Derived (inflated) | unverified | captured / Stafford revenue |
| Revenue Gap | dashboard `revenue_gaps[].gap` | Derived | $100 | Stafford revenue / amount owed |
| Recurring Revenue | client_registry `abando_recurring_mrr` | Stored | $0 | one-time / merchant value |
| One-Time Revenue | client_registry `shopifixer_one_time` | Stored | $0 | recurring / offer amount |
| Lifetime Value | client_registry `total_lifetime_value` | Derived/aggregate | $0 | pipeline / merchant value |

---

## Authority Matrix

| Role | Authority | Notes |
| --- | --- | --- |
| Source of record (money) | `client_registry_v1.json` | All actual Stafford revenue + merchant value originate here |
| Revenue capture gate | Stripe webhook (`payment_lifecycle_registry_v1.md`) | Only path from pending → earned |
| Derived rollup (operator) | `operator_dashboard_snapshot_v1.json` | Projection; must match client_registry |
| Derived rollup (executive) | `ceo_truth_snapshot_v1.json` | Projection; must match client_registry |
| Per-merchant economics | `merchant_lifecycle_registry_v1.json` | offer_price, payment_amount, lifetime_value, revenue_status |
| Funnel/bottleneck (counts) | `revenue/revenue_truth_v1.json` | Counts, not dollars |
| Opportunity estimate | `opportunity_units_v1.json` | Potential, not captured |
| Pipeline estimate | campaignResolver / actionResolver | Derived, currently inflated |
| Route/proof validation (NOT money) | `revenue_authority/*` | Validate surfaces, not figures |

---

## Terminology Recommendations (recommend only; do not rename yet)

- "Revenue at Stake" (Executive Home, Campaigns): reads like banked pipeline but is
  a synthesized, inflated estimate. Recommend standardizing toward "Pipeline Value
  (estimate)" and always labeling it an estimate — after its calculation is fixed.
- "Expected Revenue" (Founder Profit Queue): a per-merchant estimate from
  `offer_price` with fallbacks. Recommend standardizing as an Opportunity/Pipeline
  estimate term, clearly distinct from captured revenue.
- "Opportunity Value": adopt as the canonical name for per-unit potential
  (`opportunity_units.value`).
- "Pipeline Value": adopt as the canonical name for the aggregated estimate.
- Keep "Stafford Revenue" and "Merchant Value" as-is; they are now correctly
  separated (M3). No renames are authorized by this document.

---

## Known Issues (documented, not fixed here)

1. campaignResolver synthesized values: `revenue_at_stake` is inflated — a
   per-relationship fallback adds the full sum of all action
   `expected_revenue_impact` once per price-less relationship, and values are
   summed across overlapping campaign types. It is not derived from the money
   source of record.
2. Duplicate revenue validators: two divergent same-named
   `revenue_route_validator_v1.mjs` files exist (in `revenue_authority/` and
   `revenue_routes/`), with different content. They validate routes/proofs, not
   money figures.
3. Undeclared rollup authority: dashboard and CEO snapshots project revenue but
   nothing declared them derived — this document does so now.
4. Multi-store fallback chain: "expected revenue" resolves from
   `merchant_lifecycle.offer_price` or `client.deal.value` or
   `client.revenue.shopifixer_one_time` or `total_lifetime_value`, so one
   merchant's estimate can come from different stores.

---

## Related Authorities

- `staffordos/authority/canonical_business_lifecycle_v1.md` — where money moves
  through S1–S11 (Payment gate at S7).
- `staffordos/authority/product_definitions_v1.md` — product/service identity
  (ShopiFixer one-time service; Abando recurring SaaS).
- Payment authority — `staffordos/authority/payment_lifecycle_registry_v1.md`.
- Revenue authority (routes/proof) — `staffordos/revenue_authority/*`
  (validates surfaces, not figures).
- Execution authority — `staffordos/authority/authority_registry_v1.md`
  (Checkout Authority, Packet Authority) and the governed execute action.

---

## Known Risks

- Business: fiscal planning that consumes "revenue at stake" (Pipeline Value) in
  its inflated form would overstate ROI and forecasts.
- Business: without a declared money authority, a future writer could update one
  rollup and not another; both would look official.
- Technical: undeclared canonical → silent rollup drift; divergent same-named
  validators invite editing the wrong one; Pipeline Value inflation is a live
  calculation defect on a primary surface.

---

## Implementation Priorities (for later, separately-validated missions)

1. Treat Pipeline Value ("revenue at stake") as an explicitly-labeled estimate and
   fix its inflation before fiscal ROI consumes it.
2. Enforce client_registry as the single declared money authority; keep dashboard
   and CEO snapshots as derived projections that must reconcile to it.
3. Resolve the divergent same-named revenue validators.
4. Surface a one-line definition of Revenue Gap where it appears.

None of these are performed by this document.

---

## Certification

CONDITIONAL GO.

StaffordOS has a trustworthy money source of record (client_registry) with
consistent captured-revenue projections and a correct payment gate; this document
now names one canonical authority per money concept and states the walls that keep
merchant value, estimates, and Stafford revenue separate. It is sufficient to
begin fiscal planning for actuals.

Conditions before fiscal planning consumes estimates: Pipeline Value
("revenue at stake") must be labeled an estimate and de-inflated, and
client_registry must be enforced as the single declared money authority. These are
future implementation missions, not part of this document.

This is documentation only. No code, JSON, registries, UI, validators, or lifecycle
documents were changed.
