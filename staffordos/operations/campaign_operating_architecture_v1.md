# CAMPAIGN OPERATING ARCHITECTURE V1

## Executive Summary

This Operational Architecture defines how campaigns achieve **complete business
traceability** at Stafford Media Consulting — the ability to trace every campaign
from planning through captured Stafford Revenue and expansion.

The central repository-truth finding: the traceability chain is **intact from Lead
all the way through Revenue, Abando expansion, and Lifetime Value**, but the very
first hop — **Campaign → Lead — is broken**. Leads carry no `campaign_id` or UTM,
and campaign identifiers are per-*type* slugs (`campaign_<type>`, five total), not
per-campaign identifiers linked to the leads they produced. Therefore, today, the
answer to "Can every dollar be traced back to a campaign?" is **No** — not because
the downstream chain is missing, but because the campaign attribution link does not
exist.

This document defines the target campaign model and traceability chain, and marks
the single missing link (campaign attribution) plus other gaps as Known Drift. It
honors the constitution: campaigns promote the ShopiFixer service and Abando SaaS
(never a merged offer, never Actinventory), Pipeline Value is always an estimate,
and only captured Stafford Revenue counts toward ROI.

This is documentation only. It changes no code, JSON, registries, UI, validators,
or constitutional authority documents (it references them).

---

## Section 1 — Purpose

Campaign Architecture exists to make marketing spend and results **fully
traceable** to revenue. It distinguishes four altitudes:

- **Marketing Strategy** — the annual/quarterly plan and objectives (owned by
  Marketing; see marketing_operating_architecture_v1).
- **Campaign Portfolio** — the set of campaigns running in a quarter under an
  objective.
- **Campaign** — a single coordinated motion with a budget, audience, offer, and
  success criteria.
- **Lead Generation** — the leads a campaign produces, which must be attributable
  back to that campaign.

Purpose in one line: every lead, payment, and dollar should trace to the campaign
that produced it, and every campaign should roll up to a quarter and fiscal year.

---

## Section 2 — Campaign Hierarchy

```
Fiscal Year (FY2027 = Jan–Dec)
  ↓
Quarter (Q1–Q4)
  ↓
Marketing Objective
  ↓
Campaign Portfolio (the quarter's campaigns)
  ↓
Individual Campaign
  ↓
Assets (creative, pages, content)
  ↓
Audience (targeted merchant segment)
  ↓
Leads (attributable to the campaign)
```

Each level rolls up to the one above; leads roll back up to a campaign, quarter,
and fiscal year — the roll-up that attribution (currently missing) must enable.

---

## Section 3 — Campaign Definition (canonical fields)

A canonical campaign object should carry:

- **Campaign ID** — a stable, per-campaign identifier (today's `campaign_<type>` is
  a type slug, not a per-campaign id — see Known Drift).
- **Campaign Name**
- **Quarter** — the fiscal quarter it belongs to.
- **Owner** — Marketing (named owner).
- **Budget** — planned spend (Executive-approved).
- **Actual Spend** — realized spend (no spend store today).
- **Status / Health** — repo truth: `healthy | warm | at_risk | dormant | unknown`.
- **Audience** — targeted segment.
- **Offer** — ShopiFixer Fix Sprint ($950) or Abando subscription (never merged).
- **CTA** — requested action.
- **Primary Product** — ShopiFixer (service) or Abando (SaaS).
- **Supporting Product** — optional secondary (e.g. Abando as post-ShopiFixer
  upsell).
- **Start / End** — active window.
- **Success Criteria** — the KPIs it is judged on (Section 9).
- **Dependencies** — assets, other campaigns, or capabilities required.

Repository truth: campaigns are synthesized by `campaignResolver` into five types
(`shopifixer_outreach`, `shopifixer_close_engine`, `fulfillment_delivery`,
`referral_expansion`, `dormant_reactivation`); budget/spend/name/quarter are not
stored. This defines the target object.

---

## Section 4 — Campaign Lifecycle

```
Idea → Approval → Planning → Build → Launch → Monitor → Optimize → Close → Retrospective → Institutional Knowledge
```

- **Idea:** proposed (Marketing; AI may suggest).
- **Approval:** Executive approves campaign + budget (human gate).
- **Planning:** define the Section-3 object.
- **Build:** produce assets.
- **Launch:** activate channel(s).
- **Monitor:** track KPIs.
- **Optimize:** adjust.
- **Close:** end; finalize spend.
- **Retrospective:** results vs plan (monthly/quarterly).
- **Institutional Knowledge:** lessons encoded into StaffordOS.

---

## Section 5 — Campaign Financial Flow

```
Campaign Budget            (planned; Executive-approved) — no budget store today
  ↓
Campaign Spend             (actual) — no spend store today
  ↓
Cost per Lead              = spend ÷ leads
  ↓
Qualified Leads            (with Sales)
  ↓
Pipeline Value (ESTIMATE)  — potential; NEVER captured revenue (money model)
  ↓
ShopiFixer Payments        (Stripe webhook capture only)
  ↓
Captured Stafford Revenue  (client_registry.stafford_revenue_earned) — the only "revenue"
  ↓
Abando Expansion Revenue   (recurring MRR; separate SaaS)
  ↓
Lifetime Value             (captured one-time + recurring for the client)
```

Hard rule (money model): everything above the "ShopiFixer Payments" line is either
spend or **estimate**; only captured Stafford Revenue and realized MRR/LTV are
revenue. Pipeline Value must always be labeled an estimate and is inflated today
(Known Drift).

---

## Section 6 — Campaign Data Traceability (the core)

Target chain, with repository-truth link status per hop:

```
Campaign → Lead → Relationship → Merchant → Proposal → Audit → Fix Sprint → Evidence → Payment → Customer Success → Abando → Renewal
```

| Hop | Linking key (repo truth) | Status |
| --- | --- | --- |
| Campaign → Lead | none — leads carry no `campaign_id`/UTM; `campaign_id` is a type slug | ❌ **BROKEN** |
| Lead → Relationship | `relationshipResolver` matches on `lead_id`/`domain` | ✅ Linked |
| Relationship → Merchant | merchant_lifecycle `lead_id`/`client_id`/`merchant_id` | ✅ Linked |
| Merchant → Proposal | merchant `offer_status`, `offer_price` | ✅ Linked |
| Proposal → Audit | merchant `audit_status` | ✅ Linked |
| Audit → Fix Sprint | merchant `fulfillment_status`; `delivery_id` | ✅ Linked |
| Fix Sprint → Evidence | `before/after_evidence_status`, `proof_package_status`, `proof_runs/` | ✅ Linked |
| Evidence → Payment | merchant `payment_status`; `packet_id`/`reservation_id`; Stripe webhook | ✅ Linked (gated) |
| Payment → Customer Success | merchant `review_status`, `revenue_status` | ✅ Linked |
| Customer Success → Abando | state machine `abando_upsell_ready`/`abando_subscribed`; `client.abando` | ✅ Linked |
| Abando → Renewal | `client.revenue.abando_recurring_mrr` (renewal tracking thin) | ⚠ Partial |
| (capture) → Stafford Revenue | `client_registry.stafford_revenue_earned` | ✅ Linked |

**Conclusion:** the chain is fully traceable **from Lead onward**; the only broken
link is **Campaign → Lead**. Closing that single link (campaign attribution on the
lead) would make every dollar traceable to a campaign. Every downstream transition
already preserves traceability via `lead_id`/`client_id`/`merchant_id`.

---

## Section 7 — Campaign Dashboard (information architecture only)

Ross should immediately understand:

- **Budget** vs **Spend** (per campaign and portfolio).
- **Pipeline** (Pipeline Value, labeled estimate).
- **Revenue** (captured Stafford Revenue attributable to the campaign — shows
  "attribution pending" until the Campaign→Lead link exists).
- **ROI** (captured revenue ÷ spend).
- **Campaign Health** (`healthy/warm/at_risk/dormant`).
- **Top Opportunities** and **Blocked Opportunities**.
- **Next Actions** (the governed next step per campaign).

No implementation is specified; information architecture only.

---

## Section 8 — Campaign Workspace (information architecture only)

The ideal campaign page lets Ross drill in without losing traceability:

- **Assets** — creative/pages/content backing the campaign.
- **Leads** — leads attributed to the campaign (attribution pending today).
- **Relationships** — the merchant relationships those leads belong to.
- **Payments** — payments from the campaign's merchants (via merchant lifecycle +
  packet).
- **Revenue** — captured Stafford Revenue attributable to the campaign (Finance
  authority; never Merchant Value or Pipeline Value as revenue).
- **Evidence** — proof packages for delivered engagements.

Each drill-down should carry the linking keys (`lead_id`/`client_id`/`merchant_id`/
`packet_id`) so the trail from campaign to dollar is never lost.

---

## Section 9 — KPIs (conceptual only)

- **Budget Utilization** — spend ÷ budget.
- **Cost per Lead** — spend ÷ leads.
- **Qualified Lead Rate** — qualified ÷ leads.
- **Proposal Rate** — proposals ÷ qualified.
- **Payment Rate** — paid ÷ proposals.
- **Stafford Revenue** — captured, attributable to the campaign.
- **Abando Expansion** — subscriptions from campaign merchants.
- **ROI** — captured Stafford Revenue ÷ spend.

Revenue KPIs use captured Stafford Revenue only; estimates and merchant value are
never counted as revenue.

---

## Section 10 — Known Repository Drift (documented, not solved)

1. **`campaign_id` on leads is missing** — the Campaign→Lead link does not exist;
   this is the single break in end-to-end traceability.
2. **UTM attribution absent** — no UTM capture on inbound/outbound.
3. **`campaign_id` is a type slug** — `campaign_<type>` identifies a campaign
   *type* (5 total), not an individual campaign.
4. **No budget storage** — campaign budgets are not stored.
5. **No spend storage** — actual spend is not stored.
6. **ROI not computable end-to-end** — depends on attribution + spend, both absent.
7. **Pipeline Value inflated** — `campaignResolver` `revenue_at_stake` is a
   synthesized, inflated estimate (money model known issue).
8. **Disconnected surfaces / placeholders** — no governed campaign dashboard or
   workspace; some outreach `send_target` values are placeholder GitHub-issue URLs.
9. **Renewal tracking thin** — recurring MRR exists; renewal events are not
   explicitly tracked.

---

## Section 11 — Future Capabilities (clearly future)

- Automatic attribution (future)
- Predictive ROI (future)
- Budget optimization (future)
- Campaign simulation (future)
- AI campaign optimization (future)
- Executive forecasting (future)
- Operational self-healing (future)

None exist today; named for planning only.

---

## Deliverables (summary)

### Campaign Hierarchy
Fiscal Year → Quarter → Marketing Objective → Campaign Portfolio → Campaign →
Assets → Audience → Leads (Section 2).

### Campaign Lifecycle
Idea → Approval → Planning → Build → Launch → Monitor → Optimize → Close →
Retrospective → Institutional Knowledge (Section 4).

### Campaign Financial Flow
Budget → Spend → Cost per Lead → Qualified Leads → Pipeline Value (estimate) →
ShopiFixer Payments → Captured Stafford Revenue → Abando Expansion → LTV; estimates
strictly separated from captured revenue (Section 5).

### Campaign Traceability Matrix
Campaign→Lead is BROKEN (no `campaign_id`); Lead→Relationship→Merchant→Proposal→
Audit→Fix→Evidence→Payment→Customer Success→Abando all linked via
`lead_id`/`client_id`/`merchant_id` + lifecycle status; Renewal partial (Section 6).

### Campaign Dashboard
Budget/Spend/Pipeline/Revenue/ROI/Health/Top+Blocked opportunities/Next actions
(Section 7).

### Campaign Workspace
Drill into Assets/Leads/Relationships/Payments/Revenue/Evidence carrying linking
keys (Section 8).

### Known Drift
Missing `campaign_id`/UTM, type-slug ids, no budget/spend store, ROI not
computable, inflated Pipeline Value, no governed surfaces, thin renewal tracking
(Section 10).

### Future Capabilities
Automatic attribution, predictive ROI, budget optimization, simulation, AI
optimization, executive forecasting, self-healing (Section 11).

---

## Certification

CONDITIONAL GO.

The Campaign Operating Architecture is internally consistent with the six
constitutional authorities and defines a complete, correct traceability chain. It
honestly identifies that traceability is **intact from Lead through Revenue, Abando,
and LTV**, and that the **single break is Campaign → Lead** (no `campaign_id`).

Condition before "every dollar traces to a campaign" is achievable: implement
**campaign attribution** (a per-campaign `campaign_id`/UTM stamped on the lead), plus
budget and spend storage, and de-inflate Pipeline Value — all future,
separately-validated missions named in Known Drift and Future Capabilities. Until
attribution exists, campaign ROI and campaign→revenue roll-up cannot be computed
end-to-end, even though the downstream chain fully supports it.

This is documentation only. No code, JSON, registries, UI, validators, or
constitutional authority documents were changed.
