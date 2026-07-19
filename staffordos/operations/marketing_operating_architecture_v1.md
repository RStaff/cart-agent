# MARKETING OPERATING ARCHITECTURE V1

## Executive Summary

This is the first Operational Architecture document. It defines how the Marketing
department actually operates inside StaffordOS, consistent with the constitutional
authorities. It does not redesign the constitution.

Marketing's job is to generate **qualified opportunities** that become ShopiFixer
engagements and, when appropriate, Abando subscriptions. Marketing **does not own
revenue** (Finance does) and **does not qualify or close** (Sales does). Marketing
owns awareness and lead generation (lifecycle S1–S2) and hands off to Sales at
qualification (S3).

Repository truth today: campaigns are **synthesized on request** (a fixed set of
code enum types), not stored planning artifacts; the only operationally real
channels are an **inbound website form** and **email/manual outreach**; leads carry
no `campaign_id`/UTM, so end-to-end attribution and Campaign ROI are not yet
computable. This document defines the target operating model and marks
unimplemented capabilities as future or as known drift.

This is documentation only. It changes no code, JSON, registries, UI, validators,
or constitutional authority documents (it references them).

Honored authorities: `canonical_business_lifecycle_v1.md`,
`product_definitions_v1.md`, `canonical_money_model_v1.md`,
`fiscal_operating_model_v1.md`, `canonical_department_architecture_v1.md`,
`canonical_vocabulary_v1.md`.

---

## Section 1 — Purpose

Marketing's mission is to create qualified opportunities. Specifically:

- Marketing **creates qualified opportunities** (awareness → leads → routing-ready).
- Marketing **does NOT own revenue** — Stafford Revenue is owned by Finance, per
  the money model; Marketing may never report Pipeline Value or Merchant Value as
  revenue.
- Marketing **hands qualified opportunities to Sales** at the qualification gate
  (lifecycle S2 → S3); Sales owns qualification, routing, proposal, and close.

Marketing owns lifecycle stages S1 (Marketing) and S2 (Lead Generation) and the
Campaign concept; ownership transitions to Sales at S3.

---

## Section 2 — Marketing Mission (success)

Marketing succeeds when it:

- Generates **awareness** among Shopify store owners.
- Generates **qualified merchants** (leads with enough signal to qualify).
- Supports **ShopiFixer growth** (the $950 Fix Sprint service, positioned as a
  Governed Conversion Intervention — see
  `staffordos/shopifixer/shopifixer_commercial_definition_v1.md` and
  `staffordos/marketing/shopifixer_governed_conversion_intervention_messaging_v1.md`).
  The price ($950 flat) and single-scoped-problem boundary are unchanged.
- Supports **Abando growth** (the separate SaaS product), including seeding
  post-ShopiFixer upsell interest — without bundling Abando into ShopiFixer.
- Produces **measurable ROI** — Campaign ROI measured on captured Stafford Revenue
  divided by spend (requires attribution; see Known Drift).
- Creates **institutional learning** — every campaign's lessons become StaffordOS
  knowledge (fiscal model continuous improvement).

---

## Section 3 — Annual Marketing Strategy

Owned by Marketing, approved by the Executive (Ross), on the calendar fiscal year
(FY2027 = Jan–Dec):

- **Objectives:** annual awareness and qualified-opportunity goals that feed the
  Stafford Revenue target (Finance owns the revenue target itself).
- **Budget:** the annual marketing budget, approved by the Executive (no budget
  store exists yet — see Known Drift / fiscal model).
- **Primary channels:** the channels Marketing will invest in for the year (see
  Section 5 for what is operationally real today).
- **Content themes:** the messaging themes tied to ShopiFixer (conversion/UX/
  cart/checkout friction) and Abando (revenue recovery).
- **Products supported:** ShopiFixer (service) and Abando (SaaS); Actinventory is
  reserved and is never marketed as an active product.
- **Quarterly planning cadence:** annual objectives decompose into quarterly
  campaign plans (Section 4), reviewed monthly per the fiscal model.

---

## Section 4 — Quarterly Campaign Planning

Each quarter, Marketing plans campaigns. A campaign should define:

- **Purpose** — the outcome it drives (awareness, lead gen, reactivation, referral).
- **Audience** — the merchant segment targeted.
- **Offer** — the ShopiFixer Fix Sprint ($950, a Governed Conversion Intervention:
  one prioritized customer-journey problem, a bounded group of coordinated
  storefront changes) or an Abando subscription being promoted (never a merged
  offer — ShopiFixer and Abando remain separate products).
- **CTA** — the requested next action.
- **Budget** — planned spend.
- **Owner** — Marketing (a named owner within Marketing).
- **Expected Pipeline Value** — an explicitly-labeled **estimate** (never captured
  revenue; per money model).
- **Success Metrics** — the KPIs (Section 8) the campaign is judged on.
- **Status** — campaign health/state (repo truth uses healthy / warm / at_risk /
  dormant / unknown).
- **Supporting Assets** — content, pages, and creative backing the campaign.

Repository truth: campaigns today are **synthesized** by `campaignResolver` into a
fixed set of types (`shopifixer_outreach`, `shopifixer_close_engine`,
`fulfillment_delivery`, `referral_expansion`, `dormant_reactivation`), not authored
as stored quarterly plans. This section defines the target planning object; the
stored campaign artifact is future work.

---

## Section 5 — Marketing Channels (repository truth)

**Operationally real today:**
- **Website inbound form** — `lead.channel` includes `inbound_form`. Owner:
  Marketing.
- **Email / manual outreach** — the outreach machinery
  (`staffordos/outreach`, `merchant_outreach`, `merchant_discovery`, send ledger)
  supports outbound contact; `lead.channel` also carries `manual_backfill` and
  `unknown`. Owner: Marketing.
- **Referral** — exists as a campaign type (`referral_expansion`) and a lifecycle
  stage (S9), but referral tracking is field-only (not operational — see Known
  Drift). Owner: Client Success (generation) → Marketing (channel intake).

**Not implemented today (future channels):** SEO, Google Ads, LinkedIn,
Partnerships, Content, Video, Events. These are named for planning only and must
not be represented as active channels until implemented.

Note: some `send_target` values are placeholder GitHub-issue URLs (test data), not
real channel destinations (see Known Drift).

---

## Section 6 — Campaign Lifecycle

```
Idea → Approval → Planning → Build → Launch → Monitor → Optimize → Close → Review → Institutionalize
```

- **Idea:** a campaign concept proposed (Marketing; AI may suggest).
- **Approval:** Executive approves campaign + budget (human gate).
- **Planning:** define the Section-4 campaign object.
- **Build:** produce assets/creative/pages.
- **Launch:** activate the channel(s).
- **Monitor:** track KPIs (Section 8).
- **Optimize:** adjust based on performance.
- **Close:** end the campaign; finalize spend.
- **Review:** results vs expected (monthly/quarterly per fiscal model).
- **Institutionalize:** encode lessons into StaffordOS knowledge.

---

## Section 7 — Marketing Data Flow

```
Campaign → Visitor → Lead → Relationship → Qualification → ShopiFixer → Payment → Customer Success → Abando → Renewal
[  Marketing owns  ][    Marketing owns   ]│[  Sales   ][  Delivery ][ Finance ][ Client Success ][Sales/CS][ CS ]
                                            │
                                   MARKETING OWNERSHIP ENDS HERE
                                   (S2 Lead Generation → S3 Qualification handoff)
```

- Marketing owns Campaign → Visitor → Lead (and the Relationship linkage at
  intake).
- **Marketing ownership ends at the qualification handoff** (lifecycle S2 → S3):
  once a lead is ready to qualify, Sales owns it.
- Downstream stages are owned per the Department Architecture (Sales, Delivery,
  Finance, Client Success). Marketing's contribution is measured back through
  attribution — which is a known gap today (no `campaign_id`).

---

## Section 8 — Marketing KPIs (conceptual; no numbers)

- **Visitors** — traffic reaching Stafford surfaces.
- **CTR** — click-through rate on campaigns.
- **CPC** — cost per click.
- **Leads** — leads generated.
- **Qualified Leads** — leads that pass qualification (measured with Sales).
- **Pipeline Value** — estimated potential revenue from Marketing-sourced
  opportunities (estimate only; never captured revenue).
- **Campaign ROI** — captured Stafford Revenue attributable to a campaign ÷ spend
  (requires attribution).
- **Cost per Lead** — spend ÷ leads.
- **Cost per Acquisition** — spend ÷ paid merchants.
- **Merchant Conversion** — leads that become paying merchants.

All revenue-based KPIs use captured Stafford Revenue only; Pipeline Value and
Merchant Value are reported separately and never as revenue.

---

## Section 9 — Marketing Dashboard (information architecture only)

The ideal Marketing dashboard should surface, top to bottom:

1. **This quarter at a glance** — active campaigns, spend vs budget, qualified
   leads, Pipeline Value (labeled estimate).
2. **Channel performance** — per real channel (inbound form, outreach): visitors,
   leads, cost per lead.
3. **Campaign list** — each campaign with status/health, spend, leads, expected
   Pipeline Value, and success-metric progress.
4. **Funnel** — Visitors → Leads → Qualified → (handed to Sales), with drop-off.
5. **ROI panel** — Campaign ROI on captured Stafford Revenue (shown as "attribution
   pending" until attribution exists).
6. **Lessons/learnings** — institutionalized takeaways.

No implementation is specified; this is information architecture only.

---

## Section 10 — Campaign Workspace (information architecture only)

The ideal Campaign page should let Ross:

- **See:** the campaign object (purpose, audience, offer, CTA, budget, owner,
  expected Pipeline Value, success metrics, status, supporting assets), plus live
  KPI progress and the leads it produced.
- **Do:** approve/adjust budget (Executive gate), launch/pause/close, and open the
  leads/relationships it generated.
- **Require:** an explicit offer (ShopiFixer or Abando, never merged), a named
  owner, and a labeled Pipeline Value estimate.

Connections the workspace should expose:
- **Leads** — the leads attributed to the campaign (attribution is a known gap).
- **Relationships** — the merchant relationships those leads belong to.
- **ShopiFixer** — offers/engagements the campaign drove (service).
- **Abando** — subscriptions the campaign drove (separate SaaS).
- **Revenue** — captured Stafford Revenue attributable to the campaign (Finance
  authority; never Merchant Value or Pipeline Value shown as revenue).

---

## Section 11 — Lead Handoff (Marketing → Sales)

The ownership transition occurs at the qualification boundary (lifecycle S2 → S3):

- **Required data:** the lead record — `lead_id, name, domain, product,
  product_surface, source, channel, contact{email, confidence}, routing{primary,
  secondary}, score, created_at`.
- **Required evidence:** the source/channel of the lead and any engagement signal
  (send ledger / events); enough context for Sales to qualify.
- **Approval:** Ross confirms qualification (the S3 human gate). Marketing does not
  self-qualify.
- **Exit criteria:** a lead record exists with identity + a routing hint and is
  "ready to qualify"; on hand-off, Sales owns qualification, routing, and the offer.

After hand-off, Marketing's role is limited to attribution/learning; it does not
own the opportunity's progression.

---

## Section 12 — AI Support

AI supports Marketing; it never becomes the department owner (department arch).
Real agents (from `agent_registry_v1.json`) that support Marketing:

- `contact_research_agent_v1`, `contact_enrichment_agent_v1` — audience/contact
  research and enrichment.
- `message_generation_agent_v1`, `message_validation_agent_v1` — copy/message
  drafting and validation.
- `send_execution_agent_v1`, `send_ledger_agent_v1` — outreach send + ledger.
- `lead_registry_sync_agent_v1` — lead record hygiene.

AI may draft content, analyze campaigns/audiences, and summarize performance;
agents may not send unapproved outreach, may not self-qualify leads, and may not
report estimates or Merchant Value as revenue. Content types like SEO/copy analysis
are supported conceptually; only the agents above are real today.

---

## Section 13 — Known Implementation Drift (documented, not fixed)

1. **No campaign store:** campaigns are synthesized by `campaignResolver` into
   fixed enum types, not authored/stored quarterly plans.
2. **No attribution:** leads carry no `campaign_id`/UTM, so Campaign ROI and
   campaign→lead→revenue tracing are not computable end-to-end.
3. **`lead.channel` is thin/placeholder:** observed values are `inbound_form`,
   `manual_backfill`, `unknown`; some `send_target` values are GitHub-issue
   placeholder URLs (test data).
4. **Pipeline Value inflated:** `campaignResolver` `revenue_at_stake` is a
   synthesized, inflated estimate (money model known issue) — must be labeled an
   estimate and de-inflated before ROI uses it.
5. **Referral field-only:** `referral_status` is not operationally tracked.
6. **Most channels absent:** SEO/Ads/LinkedIn/Partnerships/Content/Video/Events
   are not implemented.
7. **No Marketing dashboard/campaign workspace** exists as a governed surface.

---

## Section 14 — Future Capabilities (clearly future)

- Budget forecasting (future)
- Predictive attribution (future)
- Autonomous campaign optimization (future)
- Campaign simulation (future)
- Executive forecasting (future)
- Adaptive governance (future)
- Operational self-healing (future)

None exist today; named for planning only.

---

## Deliverables (summary)

### Marketing Operating Model
Marketing generates qualified opportunities (S1–S2), does not own revenue, and
hands off to Sales at qualification (S3); measured on leads, Pipeline Value
(estimate), and Campaign ROI (captured Stafford Revenue).

### Campaign Lifecycle
Idea → Approval → Planning → Build → Launch → Monitor → Optimize → Close → Review →
Institutionalize (Section 6).

### Marketing Data Flow
Campaign → Visitor → Lead → (handoff) → Sales → Delivery → Finance → Client Success
→ Abando → Renewal; Marketing ownership ends at the S2→S3 qualification handoff
(Section 7).

### Campaign Workspace
Campaign object + KPI progress + leads/relationships/ShopiFixer/Abando/revenue
connections; budget approval and launch/pause/close actions (Section 10).

### Marketing Dashboard
Quarter-at-a-glance, channel performance, campaign list, funnel, ROI (attribution
pending), lessons (Section 9).

### Lead Handoff
S2→S3 boundary: lead record data + source/engagement evidence + Ross qualification
approval + ready-to-qualify exit criteria (Section 11).

### AI Support
Real Marketing agents (contact/message/send/sync) assist; never own; never send
unapproved, self-qualify, or report estimates as revenue (Section 12).

### Known Drift
No campaign store, no attribution, thin channel data, inflated Pipeline Value,
referral field-only, most channels absent, no governed dashboard/workspace
(Section 13).

### Future Capabilities
Budget forecasting, predictive attribution, autonomous optimization, simulation,
executive forecasting, adaptive governance, self-healing (Section 14).

---

## Certification

CONDITIONAL GO.

The Marketing Operating Architecture is internally consistent with the six
constitutional authorities: Marketing generates qualified opportunities and hands
off to Sales at qualification, never owns revenue, never reports estimates or
Merchant Value as Stafford Revenue, uses canonical vocabulary, and honors product
identity (ShopiFixer service, Abando SaaS, Actinventory reserved). It is sufficient
to guide Phase-2 Marketing surfaces and planning.

Conditions before the architecture can be fully operated: implement campaign
storage + attribution (`campaign_id`/UTM), de-inflate Pipeline Value, and build the
Marketing dashboard/campaign workspace — all future, separately-validated missions
named in Known Drift and Future Capabilities. Marketing ROI cannot be measured
end-to-end until attribution exists.

This is documentation only. No code, JSON, registries, UI, validators, or
constitutional authority documents were changed.
