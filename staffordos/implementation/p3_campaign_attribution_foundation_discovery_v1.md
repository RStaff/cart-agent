# STAFFORDOS P3.1 CAMPAIGN ATTRIBUTION FOUNDATION DISCOVERY V1

Mission: STAFFORDOS_P3.1_CAMPAIGN_ATTRIBUTION_FOUNDATION_DISCOVERY

Repository: `/Users/rossstafford/projects/cart-agent`

Status: discovery and implementation planning only. No implementation has been
performed in this document.

## 1. Executive Summary

Campaign Attribution is not implemented as a canonical, persisted capability in
the current repository.

Repository truth shows:

- Campaigns currently exist as synthesized UI/projection objects in
  `staffordos/ui/operator-frontend/lib/operator/campaignResolver.ts`.
- Current `campaign_id` values are generated type slugs:
  `campaign_${campaign_type}`. They are not stable per-campaign IDs and are not
  stamped on leads.
- There is no discovered stored `campaign_slug`.
- There are no StaffordOS UTM fields on leads or campaign records. The only UTM
  search hits are template/readme/archive noise, not StaffordOS attribution
  schema.
- `lead.source` exists in `staffordos/leads/lead_registry_v1.json`, but current
  authorities already define it as a data-origin tag, not marketing
  attribution.
- The downstream spine from Lead -> Relationship -> Merchant/Client ->
  Opportunity/Delivery/Payment/Revenue exists through JSON registries and
  resolver projections.
- Payment authority is already system-gated through the verified Stripe webhook
  path. Campaign Attribution must not weaken or bypass that authority.
- Campaign ROI is not computable today because the repository lacks campaign
  attribution, campaign budget, campaign spend, and a trustworthy de-inflated
  Pipeline Value calculation.

Certification for implementation start: CONDITIONAL GO.

Condition: proceed only with the attribution foundation first: persistent
campaign identity, lead-level campaign attribution, and attribution preservation
through existing projections. Do not implement ROI, fiscal dashboards, or
campaign performance conclusions until spend/budget storage exists and the known
Pipeline Value inflation is corrected.

## 2. Current Repository State

The repository is a mixed flat-file plus Prisma/Postgres system:

- StaffordOS operating truth is primarily JSON and Markdown under `staffordos/`.
- The operator UI reads those files directly through Next.js server-side loaders
  in `staffordos/ui/operator-frontend`.
- The public/backend runtime uses `web/prisma/schema.prisma` and Express routes
  under `web/src`.
- There is a Prisma `Packet` table and Abando cart attribution fields, but no
  campaign table, no lead table, and no campaign attribution model in the Prisma
  schema.

Primary current authorities and projections:

| Area | Current file(s) | Stored, projected, calculated, or formatted | Trust status for attribution |
| --- | --- | --- | --- |
| Campaign projection | `staffordos/ui/operator-frontend/lib/operator/campaignResolver.ts` | Calculated projection | Not authoritative for per-campaign attribution |
| Campaign UI | `staffordos/ui/operator-frontend/app/operator/campaigns/page.tsx`, `app/operator/page.tsx` | Formatted projection | Not authoritative |
| Lead storage | `staffordos/leads/lead_registry_v1.json` | Stored JSON registry | Trusted for current lead identity and data-origin fields; not attribution-complete |
| Lead events | `staffordos/leads/lead_events_v1.json` | Stored event log | Trusted for lead registry events; not campaign-attributed |
| Relationship projection | `staffordos/ui/operator-frontend/lib/operator/relationshipResolver.ts` | Calculated projection over registries | Trusted as current resolver projection; not an attribution authority |
| Client storage | `staffordos/clients/client_registry_v1.json` | Stored JSON registry | Trusted for client/revenue source fields |
| Merchant lifecycle | `staffordos/merchant_registry/merchant_lifecycle_registry_v1.json` | Materialized read model | Trusted as read model with field sources; not original authority for every field |
| Opportunity estimate | `staffordos/units/opportunity_units_v1.json` | Stored estimate | Trusted for Opportunity Value estimate only |
| Payment authority | `web/src/routes/stripeWebhook.esm.js` | Verified runtime authority | Trusted for payment transition authority |
| Revenue mutation | `staffordos/revenue/revenue_agent_v1.mjs`, `staffordos/clients/client_registry_v1.mjs` | Stored mutation and derived truth | Trusted for captured Stafford Revenue when reached by webhook proof |
| Campaign/ROI architecture | `staffordos/operations/*.md`, `staffordos/authority/*.md` | Documentation authority | Trusted for intended constraints, not implementation |

Committed/current architecture already identifies Campaign Attribution as the
convergent P0 gap:

- `staffordos/operations/operational_gap_implementation_plan_v1.md` names G1
  Campaign Attribution as P0 and G7 campaign store as missing.
- `staffordos/operations/campaign_operating_architecture_v1.md` states that the
  Campaign -> Lead hop is broken because leads carry no `campaign_id` or UTM.
- `staffordos/operations/attribution_traceability_architecture_v1.md` states the
  attribution head is missing: Fiscal/Quarter/Objective/Campaign/Asset/UTM.
- `staffordos/authority/canonical_business_lifecycle_v1.md` states S1 Marketing
  is weak because `lead.source` is a data-origin tag and there is no
  `campaign_id` or UTM on leads.

## 3. Existing Campaign Objects

### `campaignResolver.ts`

File:
`staffordos/ui/operator-frontend/lib/operator/campaignResolver.ts`

Current objects:

- `CampaignType`
- `CampaignHealth`
- `Campaign`
- `CampaignInventoryItem`
- `CampaignResolverReport`

Current campaign types:

- `shopifixer_outreach`
- `shopifixer_close_engine`
- `fulfillment_delivery`
- `referral_expansion`
- `dormant_reactivation`

Current `campaign_id` construction:

- `normalizeCampaignId(value)` returns `campaign_${normalizeKey(value)}`.
- `buildCampaigns()` sets `campaign_id: normalizeCampaignId(campaignType)`.
- Therefore current campaign IDs are type slugs, not per-campaign identities.

Inputs used by the resolver:

- `resolveRelationships()`
- `resolveActionCandidates()`
- `getDecisionEngineReport()`
- `staffordos/revenue/revenue_truth_v1.json`
- `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`
- `staffordos/execution/execution_log_v1.json`
- `staffordos/execution/outcome_events_v1.json`
- `staffordos/merchant_registry/merchant_lifecycle_registry_v1.json`

Transformations:

- Relationships are selected into campaign types by resolver state, lifecycle
  stage, fulfillment/payment status, outcome state, and action types.
- Revenue at stake is calculated from merchant lifecycle `offer_price` when
  available, otherwise from summed action `expected_revenue_impact`.
- Health, confidence, relationship coverage, conflicts, and inventory are
  calculated in memory.
- UI pages format money through local `money()` helpers.

Duplicate authorities:

- No canonical campaign authority exists.
- `campaignResolver.ts` acts like a campaign object source for UI, but current
  operations documents state it is only a synthesized projection.
- `proof_authority_v1.mjs` accepts an optional `campaign_id`, but the JSONL proof
  store was not present and no populated campaign proof records were found.

Trust status:

- Current campaign projection: Needs verification for workflow awareness.
- Current campaign ID: Not authoritative for campaign attribution.
- Current campaign revenue at stake: Not authoritative for ROI; documented as
  inflated in `canonical_money_model_v1.md`.

### `/operator/campaigns`

File:
`staffordos/ui/operator-frontend/app/operator/campaigns/page.tsx`

Loader/projection:

- Calls `getCampaignResolverReport()`.

Displayed campaign values:

- Campaign count
- Health counts
- Revenue at stake
- Campaign type counts
- Relationship coverage
- Unresolved campaigns
- Conflicts
- Campaign registry rows
- Next best action
- Evidence/provenance source files

Trust status:

- Trusted only as a live projection over current files.
- Not authoritative for campaign identity, attribution, spend, or ROI.

### `/operator`

File:
`staffordos/ui/operator-frontend/app/operator/page.tsx`

Loader/projection:

- Uses `getCampaignResolverReport()`.

Displayed campaign values:

- At-risk campaign count
- Healthy/warm campaign count
- Dormant campaign count
- Revenue at stake
- Campaign review list
- Campaign IDs from `campaign.campaign_id`

Trust status:

- Same as `/operator/campaigns`: a projected operational signal, not attribution
  authority.

## 4. Existing Lead Objects

Primary stored lead registry:

- File: `staffordos/leads/lead_registry_v1.json`
- Top-level keys: `version`, `updated_at`, `source`, `items`
- Current item count sampled by `jq`: 13

Discovered lead item keys:

- `id`
- `lead_id`
- `name`
- `domain`
- `product`
- `product_intent`
- `product_surface`
- `source`
- `lead_state`
- `lifecycle_stage`
- `status`
- `score`
- `temperature`
- `contact`
- `engagement`
- `routing`
- `refs`
- `execution`
- `payment`
- `payment_status`
- `payment_url`
- `problem_summary`
- `runtime_source`
- `send_target`
- `channel`
- `message`
- `follow_up_message`
- `contact_confidence`
- `conversion_score`
- `qualification_status`
- `qualification_reason`
- `qualification_source`
- `qualification_updated_at`
- `created_at`
- `updated_at`
- `generated_at`

Fields not found on lead records:

- `campaign_id`
- `campaign_slug`
- `campaign_type`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `landing_page`
- `referrer`
- `referer`

Lead creation and update paths:

| Path | File | Source inputs | Stored output | Attribution status |
| --- | --- | --- | --- | --- |
| Runtime sync | `scripts/leads/sync_runtime_to_lead_registry.mjs` | `.tmp/send_console_data.json`, `.tmp/send_ready.json`, `.tmp/send_queue.json`, `.tmp/leads_pipeline.json` | `lead_registry_v1.json`, `lead_events_v1.json` | Stores `source`, `channel`, `runtime_source`; no campaign/UTM |
| StaffordOS lead sync | `staffordos/leads/lead_registry_sync_agent_v1.mjs` | `outreach_queue.json`, `contact_research_queue.json`, `approval_queue_v1.json`, `send_ledger_v1.json`, `reply_interpretation_v1.json`, `outcomes.json` | `lead_registry_v1.json`, `lead_events_v1.json` | Stores `source`, product intent, routing, qualification; no campaign/UTM |
| Candidate ingestion | `staffordos/leads/ingest_candidates.js` | `enriched_stores.json` | `candidate_stores.json` | Stores candidate `source`; no campaign/UTM |
| Candidate routing/scoring | `staffordos/leads/router.js` | `candidate_stores.json` | `scored_stores.json`, `top_targets.json` | Stores candidate/source and links; no campaign/UTM |
| Operator leads loader | `staffordos/ui/operator-frontend/lib/leads/loadOperatorLeads.ts` | lead registry plus send queue/ready/console files | UI projection | Normalizes `source`; no campaign/UTM |
| Client promotion | `staffordos/clients/promote_leads_to_clients_v1.mjs` | `lead_registry_v1.json` | `client_registry_v1.json` through `upsertClient()` | Preserves lead source into client source; no campaign/UTM |

Trust status:

- Lead identity and lifecycle values: Trusted within current flat-file model.
- `lead.source`: Needs verification for business attribution because current
  authorities define it as data-origin, not campaign/source attribution.
- Lead-level campaign attribution: Not authoritative because it does not exist.

## 5. Current Data Flow

Current lead-to-revenue flow:

1. Candidate/prospect data enters through lead candidate files and outreach
   queues.
2. `staffordos/leads/lead_registry_sync_agent_v1.mjs` or
   `scripts/leads/sync_runtime_to_lead_registry.mjs` writes
   `staffordos/leads/lead_registry_v1.json`.
3. Lead events are written to `staffordos/leads/lead_events_v1.json`.
4. Qualified leads can be promoted by
   `staffordos/clients/promote_leads_to_clients_v1.mjs` into
   `staffordos/clients/client_registry_v1.json`.
5. `staffordos/ui/operator-frontend/lib/operator/relationshipResolver.ts`
   builds in-memory relationships by unioning keys across lead, client, merchant
   lifecycle, fulfillment, execution, and outcome records.
6. `staffordos/merchant_registry/build_merchant_lifecycle_registry_v1.mjs`
   materializes `staffordos/merchant_registry/merchant_lifecycle_registry_v1.json`
   from clients, leads, opportunity units, delivery units, action units, revenue,
   audit, send, payment, and fulfillment truth.
7. `staffordos/ui/operator-frontend/lib/operator/actionResolver.ts` derives
   action candidates from the relationship projection, dashboard snapshot,
   revenue truth, merchant lifecycle, fulfillment truth, execution log, and
   outcome truth.
8. `campaignResolver.ts` groups relationships/actions into the five campaign
   type buckets.
9. `/operator` and `/operator/campaigns` format and display those synthesized
   campaign buckets.

Current payment-to-revenue flow:

1. `web/src/checkout-public.js` creates a Stripe Checkout session and canonical
   packet with `packet_id`, `store_domain`, and `payment_pending`.
2. `web/src/routes/stripeWebhook.esm.js` receives `checkout.session.completed`,
   requires `STRIPE_WEBHOOK_SECRET`, verifies Stripe signature, resolves packet
   identity, validates store-domain alignment, and appends payment proof.
3. The webhook calls `bindPacketPayment()` to mark the packet payment status.
4. The webhook calls `recordStripePaymentPropagation()` in
   `staffordos/revenue/revenue_agent_v1.mjs`.
5. `recordStripePaymentPropagation()` requires a proof event, calls
   `recordVerifiedStripePayment()` in
   `staffordos/clients/client_registry_v1.mjs`, rebuilds revenue truth, and
   rebuilds the operator dashboard snapshot.
6. The webhook then invokes `rebuildShopifixerFulfillmentTruth()` so paid client
   truth can materialize into fulfillment truth.

Current campaign flow:

1. There is no campaign creation flow.
2. There is no persistent campaign registry.
3. There is no lead stamping flow for `campaign_id` or UTM.
4. Campaigns are reverse-derived from relationship/action state after the fact.

## 6. Current Missing Links

The following gaps are confirmed by repository search and current authority docs:

| Missing link | Current repository evidence | Effect |
| --- | --- | --- |
| Per-campaign identity | Only `campaignResolver.ts` creates `campaign_${campaign_type}` type slugs | Cannot identify a specific campaign |
| Campaign store | No persisted campaign JSON/DB model found | Cannot store campaign name, owner, budget, spend, window, audience, offer, status |
| Lead campaign attribution | Lead field union does not include `campaign_id` | Campaign -> Lead is broken |
| Campaign slug | No stored `campaign_slug` found | Cannot use slug routing/filtering |
| UTM fields | No StaffordOS `utm_*` fields found on lead/campaign/runtime records | No source/medium/campaign capture |
| Landing/referrer | No StaffordOS lead `landing_page` or referrer field found | Inbound origin cannot be reconstructed |
| Spend/budget | Architecture docs name both as missing | Cost side of ROI absent |
| ROI calculation | Campaign docs and fiscal model say ROI is blocked | Campaign ROI cannot be computed end-to-end |
| Pipeline Value correctness | `canonical_money_model_v1.md` says `campaignResolver` revenue-at-stake is inflated | ROI/forecast inputs are not safe |
| Campaign dashboard authority | `/operator/campaigns` is projection-only | UI cannot become source of truth |

Specific determinations:

- Where campaigns currently exist: synthesized in `campaignResolver.ts` and shown
  in `/operator` and `/operator/campaigns`; described in operations docs.
- Where campaign data is stored: not stored as canonical campaign data.
- Whether `campaign_id` already exists: yes as a projected type slug in
  `campaignResolver.ts`; optional accepted field in `proof_authority_v1.mjs`; no
  persisted lead campaign ID found.
- Whether `campaign_slug` exists: no stored StaffordOS campaign slug found.
- Whether UTM fields exist: no StaffordOS UTM fields found.
- Whether `lead.source` exists: yes, stored on lead records and propagated into
  client source, but it is a data-origin tag.
- Where leads are created: lead sync agents and lead candidate/outreach pipelines
  listed in Section 4.
- Where relationships are created: in memory by `relationshipResolver.ts`, not
  stored as a canonical relationship registry.
- Where merchants are created: materialized into
  `merchant_lifecycle_registry_v1.json` by the merchant lifecycle builder; client
  creation occurs through `upsertClient()` and lead promotion.
- Where payments become authoritative: verified Stripe webhook route
  `web/src/routes/stripeWebhook.esm.js`, then revenue/client/fulfillment truth
  writers.
- Where ROI would consume attribution: campaign/fiscal/executive dashboards and
  reports named in `campaign_operating_architecture_v1.md`,
  `fiscal_operating_model_v1.md`, and `canonical_money_model_v1.md`.

## 7. Implementation Dependencies

Campaign Attribution foundation depends on these current repository surfaces:

| Dependency | Why it matters | Current status |
| --- | --- | --- |
| Lead registry schema discipline | Leads are the first durable record below campaign | JSON registry exists; missing campaign/UTM fields |
| Lead creation entry points | Attribution must be stamped at creation, not inferred later | Multiple entry points exist |
| Relationship resolver | Campaign attribution must survive into relationship projection | Resolver exists; no campaign facet |
| Merchant lifecycle read model | Campaign attribution must flow into merchant/revenue drill-downs | Read model exists; no campaign fields |
| Payment authority | Captured revenue must remain Stripe-webhook-only | Trusted and gated |
| Campaign resolver | Must eventually group by real campaign identity, not type slug | Projection exists; not authoritative |
| Money model | ROI must use captured Stafford Revenue only | Documentation authority exists |
| Pipeline de-inflation | Current `revenue_at_stake` cannot be ROI input | Known issue |
| Budget/spend authority | ROI requires cost data | Missing |

No current implementation can safely answer campaign ROI until all of these are
resolved:

1. Lead-level campaign attribution exists.
2. Budget/spend storage exists.
3. Captured revenue can be joined back to campaign through the lead/relationship
   spine.
4. Pipeline Value is de-inflated and labeled as estimate.

## 8. Required Database Changes

Repository truth: no existing database table or JSON registry is a canonical
campaign attribution authority.

Required persistence changes for a safe foundation:

1. Create a canonical campaign store.
   - Current repository has no stored campaign object.
   - Operations docs require stable per-campaign identity, name, quarter, owner,
     budget, spend, status/health, audience, offer, CTA, product, dates, and
     success criteria.
   - The smallest safe implementation should define the store before changing UI
     semantics.

2. Add attribution fields to stored lead truth.
   - Minimum required by current docs: `campaign_id`.
   - Required for richer attribution: UTM fields, source/medium/campaign,
     landing/referrer, and attribution model metadata.
   - Existing lead records must remain valid with null/unknown attribution unless
     repository evidence supports a backfill.

3. Preserve attribution through promoted client/merchant read models.
   - `promote_leads_to_clients_v1.mjs`, `client_registry_v1.mjs`,
     `relationshipResolver.ts`, and the merchant lifecycle builder will need to
     preserve or expose attribution once lead truth carries it.

4. If public runtime capture is implemented in the web backend, extend the Prisma
   persistence boundary.
   - Current `web/prisma/schema.prisma` has Abando cart attribution fields and
     packet/payment identity, but no campaign model.
   - No exact Prisma schema is present in the repository for campaign
     attribution; the implementation mission must choose whether public inbound
     campaign attribution is stored in Prisma, StaffordOS JSON, or both.
   - Any DB addition must not make payment captured unless the Stripe webhook
     path verifies it.

5. Add campaign budget/spend persistence later, before ROI.
   - Budget and spend are explicitly missing today.
   - ROI should not be implemented until these fields have an authority.

## 9. Required API Changes

No implementation is performed here. The current repository implies these API or
runtime boundary changes will be required:

1. Lead creation/stamping boundary.
   - All lead creation paths must accept and preserve campaign attribution.
   - A missing attribution value must remain explicit, not inferred from
     `lead.source`.

2. Campaign read boundary.
   - The operator UI needs a read path for canonical campaigns, not only
     `campaignResolver` type buckets.
   - Existing type-bucket resolver can remain as a fallback/projection during
     transition.

3. Attribution propagation boundary.
   - Relationship, merchant, client, and dashboard loaders must expose campaign
     attribution once it is stored.

4. Public/inbound capture boundary.
   - Any public forms, landing pages, audit pages, or checkout flows that create
     leads must pass attribution values into the lead creation path.
   - Current conversion surface registry only stores page URLs/goals; it does not
     capture attribution.

5. Payment boundary.
   - No campaign API should mutate `payment_status`, `stafford_revenue_earned`,
     `deal.payment_status`, or packet payment state.
   - Payment remains owned by `web/src/routes/stripeWebhook.esm.js`.

## 10. Required UI Changes

Current UI:

- `/operator/campaigns` displays synthesized campaign type buckets.
- `/operator` displays campaign review and outreach motion from the same report.
- Lead UI is backed by `loadOperatorLeads()` and does not expose campaign
  attribution.

Required UI changes after persistence exists:

1. Campaign Command should distinguish canonical campaigns from synthesized
   campaign types.
2. Campaign rows should show stable campaign identity, campaign name, status,
   lead count, attributed relationships, and attribution coverage.
3. Leads should display campaign attribution and unknown/unattributed state.
4. Relationship and merchant views should expose campaign lineage when available.
5. Revenue at stake must remain labeled as an estimate and not be displayed as
   captured revenue.
6. ROI fields should remain absent or explicitly blocked until spend/budget and
   captured-revenue attribution exist.

## 11. Required Dashboard Changes

Current dashboard consumers:

- `/operator` campaign/outreach panel uses `campaignReport`.
- `/operator/campaigns` uses `campaignReport`.
- `operator_dashboard_snapshot_v1.json` stores revenue summaries, primary focus,
  next actions, and revenue gaps.
- `ceo_truth_snapshot_v1.json` rolls up executive truth.

Required dashboard changes:

1. Add attribution coverage metrics before ROI:
   - total leads with `campaign_id`
   - unattributed leads
   - attributed qualified leads
   - attributed captured revenue when payment exists

2. Keep estimates separate:
   - Pipeline Value / revenue at stake must remain an estimate.
   - Captured Stafford Revenue must come from client registry revenue fields
     updated by the verified payment path.

3. Add blocked ROI states:
   - If campaign has no spend authority, ROI should show "blocked: no spend".
   - If campaign has no attributed captured revenue, ROI should show "blocked:
     no attributed captured revenue".

4. Do not let dashboards become authorities:
   - Dashboard snapshots remain projections.
   - Campaign store, lead registry, client registry, and payment authority remain
     the sources.

## 12. Risk Assessment

| Risk | Repository evidence | Severity | Mitigation |
| --- | --- | --- | --- |
| Misusing `lead.source` as marketing attribution | Authorities state it is a data-origin tag | High | Add explicit campaign/UTM fields; keep source semantics separate |
| Treating current `campaign_id` as canonical | Current IDs are type slugs | High | Create stable per-campaign IDs before ROI or reporting |
| Overstating ROI from inflated Pipeline Value | Money model names current revenue-at-stake inflation | High | De-inflate and label estimates before ROI |
| Breaking payment authority | Payment gate is Stripe-webhook-only | High | Keep campaign code read-only against payment states |
| Incomplete stamping across lead entry points | Multiple lead creation/sync paths exist | Medium | Update every writer and add validation coverage |
| Unsafe backfill | Existing leads lack campaign evidence | Medium | Use null/unknown unless repository evidence supports attribution |
| UI trust drift | `/operator/campaigns` looks like a registry but is projection-only | Medium | Label/generated state until canonical campaign store exists |
| Dual persistence drift | StaffordOS JSON plus Prisma runtime may diverge | Medium | Define one canonical owner per field before implementation |

## 13. Smallest Safe Implementation Order

1. Define the campaign authority boundary.
   - Choose the canonical campaign store location and exact fields.
   - Do not change UI semantics until the store exists.

2. Add nullable campaign attribution to lead truth.
   - Add `campaign_id` first.
   - Preserve existing leads with explicit null/unknown values.
   - Do not infer campaign identity from current type slugs.

3. Stamp attribution at every lead creation path.
   - `lead_registry_sync_agent_v1.mjs`
   - `scripts/leads/sync_runtime_to_lead_registry.mjs`
   - candidate/outreach paths that feed those sync agents
   - any public runtime route that creates leads

4. Preserve attribution through the current spine.
   - Lead -> client promotion.
   - Relationship resolver.
   - Merchant lifecycle builder.
   - Dashboard projections.

5. Update campaign resolver to use canonical campaign identity.
   - Keep existing campaign type buckets as a derived grouping.
   - Do not remove current projection until parity is verified.

6. Add UTM/landing/referrer capture.
   - After `campaign_id` exists, add richer source details without changing
     payment or revenue authority.

7. Add campaign budget and spend storage.
   - Required before ROI.

8. De-inflate Pipeline Value.
   - Required before any campaign performance or ROI dashboard consumes estimates.

9. Implement ROI.
   - Only after attribution, captured revenue linkage, budget, spend, and
     estimate de-inflation exist.

## 14. Rollback Strategy

Safe rollback principles:

1. Make the foundation additive first.
   - New fields should be nullable or unknown-safe.
   - Existing records should continue to load without campaign attribution.

2. Keep existing projections as fallback.
   - `campaignResolver` type buckets should remain available while canonical
     campaign grouping is introduced.

3. Do not couple campaign attribution to payment mutation.
   - Rollback must not affect Stripe webhook payment authority, packet payment
     state, client revenue, or fulfillment truth.

4. Snapshot flat files before migration/backfill.
   - Lead/client/merchant registries are JSON stores; any future migration should
     copy prior state before write.

5. DB rollback, if Prisma is extended.
   - New DB fields/tables should be optional at first.
   - Rollback should remove readers before dropping stored attribution columns.

6. UI rollback.
   - Hide canonical attribution panels behind data availability.
   - Revert to existing Campaign Command projection if canonical campaign data is
     incomplete.

## 15. Recommended Phase 3 Implementation Sequence

Recommended sequence:

1. Phase 3.1: Campaign Attribution Foundation.
   - Create campaign authority.
   - Add lead-level `campaign_id`.
   - Stamp all lead creation paths.
   - Preserve attribution through relationship and merchant projections.

2. Phase 3.2: Attribution Visibility.
   - Show attribution coverage in `/operator/leads`, `/operator/campaigns`, and
     `/operator`.
   - Keep ROI blocked until cost and captured revenue attribution exist.

3. Phase 3.3: UTM and Source Detail.
   - Add UTM/source/medium/referrer/landing capture.
   - Keep `lead.source` as data-origin unless explicitly migrated by authority.

4. Phase 3.4: Campaign Budget and Spend.
   - Add planned budget and actual spend authority.
   - Add validation that ROI cannot compute without spend.

5. Phase 3.5: Pipeline Value Correction.
   - Fix current `campaignResolver` inflation.
   - Label Pipeline Value as estimate.

6. Phase 3.6: Campaign ROI.
   - Compute only from captured Stafford Revenue attributable through the lead
     spine divided by authoritative spend.

7. Phase 3.7: Campaign Performance and Planning Reports.
   - Build Quarterly Planning, Campaign Performance, Founder Dashboard, and LTV
     by campaign only after ROI is trustworthy.

## 16. GO / CONDITIONAL GO / NO GO

CONDITIONAL GO.

GO for the smallest foundation:

- Define a canonical campaign authority.
- Add explicit campaign attribution to lead truth.
- Stamp attribution at lead creation.
- Preserve attribution through existing relationship, merchant, and dashboard
  projections.

NO GO for downstream claims yet:

- No campaign ROI.
- No campaign performance conclusions.
- No fiscal planning based on campaign revenue.
- No LTV-by-campaign.
- No dashboard claim that every dollar traces to a campaign.

Reason:

The repository has a usable downstream spine from Lead to Revenue, and payment
authority is strong. The first hop, Campaign -> Lead, is missing. Closing that hop
is the smallest safe Phase 3 start. Anything beyond that depends on additional
authorities that do not exist yet: campaign store, UTM/source detail, spend,
budget, and corrected Pipeline Value.
