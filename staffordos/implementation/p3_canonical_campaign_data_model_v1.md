# StaffordOS P3 Canonical Campaign Data Model V1

Mission: STAFFORDOS_P3.2_CANONICAL_CAMPAIGN_DATA_MODEL_V1
Status: canonical documentation and design only
Implementation status: not implemented
Commit status: do not commit

## Authority Basis

This model is grounded in the current repository authorities and operating architecture:

- `staffordos/authority/canonical_business_lifecycle_v1.md`
- `staffordos/authority/canonical_department_architecture_v1.md`
- `staffordos/authority/canonical_money_model_v1.md`
- `staffordos/authority/canonical_vocabulary_v1.md`
- `staffordos/authority/fiscal_operating_model_v1.md`
- `staffordos/authority/payment_lifecycle_registry_v1.md`
- `staffordos/operations/marketing_operating_architecture_v1.md`
- `staffordos/operations/campaign_operating_architecture_v1.md`
- `staffordos/operations/attribution_traceability_architecture_v1.md`
- `staffordos/implementation/p3_campaign_attribution_foundation_discovery_v1.md`

This document defines the governed business object only. It does not create storage,
change schemas, add APIs, modify UI, alter validators, or change constitutional
authorities.

## 1. Purpose

The Campaign object is the canonical marketing attribution head for StaffordOS.
Its purpose is to connect approved marketing activity to the existing repository
spine:

Campaign -> Lead -> Relationship -> Merchant / Client -> Payment -> Stafford
Revenue -> Customer Success -> Abando

The Campaign object must make Campaign ROI possible without weakening the
existing money model. It must preserve the current wall between estimates and
captured money:

- Pipeline Value is an estimate.
- Stafford Revenue is captured money only.
- Merchant Value belongs to the merchant and is never Stafford Revenue.
- Payment authority remains Stripe-webhook-only.

## 2. Business Definition

A Campaign is a coordinated, approved, budgeted, marketing-owned outreach or
conversion motion that targets a defined audience, promotes an approved offer,
uses defined channels and assets, and produces attributable leads.

Canonical Campaign requirements:

- It is owned by Marketing.
- It must be approved by Ross before launch.
- It must have an approved budget before paid spend is incurred.
- It must be linked to a fiscal year and quarter.
- It must promote ShopiFixer service or Abando SaaS according to current
  authorities. It must not merge the offers into an ungoverned combined offer.
- It must not promote Actinventory as an active campaign unless a later authority
  enables that product.
- It must not qualify leads, close deals, deliver work, approve payment, or count
  revenue.

Current repository state:

- No canonical campaign storage exists today.
- Current campaigns are synthesized in
  `staffordos/ui/operator-frontend/lib/operator/campaignResolver.ts`.
- Current synthesized `campaign_id` values are type-level slugs such as
  `campaign_shopifixer_outreach`, not stable per-campaign identifiers.
- Leads do not currently carry canonical `campaign_id` or UTM fields.

## 3. Campaign Lifecycle

The canonical Campaign lifecycle follows the Marketing operating architecture:

1. Idea
2. Approval
3. Planning
4. Build
5. Launch
6. Monitor
7. Optimize
8. Close
9. Retrospective
10. Institutional Knowledge

Canonical lifecycle states:

| State | Meaning | Human gate |
| --- | --- | --- |
| `idea` | Campaign concept exists but is not approved. | None |
| `pending_approval` | Campaign is ready for Ross review. | Ross campaign approval |
| `approved` | Campaign is approved for planning. | Ross approval complete |
| `planning` | Audience, offer, CTA, budget, channel, and assets are being defined. | Budget approval before spend |
| `building` | Creative, landing page, UTM plan, and operational setup are being prepared. | Launch approval still required |
| `ready_to_launch` | Campaign is prepared but not active. | Ross launch approval |
| `active` | Campaign is live and can generate attributable leads. | Outreach send approval where required |
| `paused` | Campaign is intentionally stopped but not closed. | Ross or authorized operator action |
| `optimizing` | Campaign remains active while content, audience, or budget changes are evaluated. | Approval required for material budget or offer changes |
| `closed` | Campaign is no longer generating new leads. | Close approval |
| `reviewed` | Retrospective has been recorded. | Human review |
| `institutionalized` | Learnings have been accepted into operating knowledge. | Human acceptance |
| `canceled` | Campaign ended before launch or completion. | Human cancellation |

The lifecycle state is not the same as campaign health. Lifecycle describes
where the campaign is in the operating process. Health describes current
performance risk.

## 4. Campaign Ownership

Canonical owner: Marketing.

Department boundaries:

| Area | Owner | Campaign relationship |
| --- | --- | --- |
| Campaign planning | Marketing | Direct owner |
| Audience and channel selection | Marketing | Direct owner |
| Outreach draft generation | Marketing with AI support | Requires human approval before send |
| Lead capture | Marketing | Campaign attribution attaches here |
| Lead qualification | Sales | Campaign is context only |
| Relationship creation | Sales | Campaign is inherited attribution only |
| Merchant lifecycle | Sales / Delivery / Finance / Customer Success by stage | Campaign is inherited attribution only |
| Payment | Finance system authority | Campaign never grants payment |
| Stafford Revenue | Finance system authority | Campaign consumes derived attribution only |
| Customer Success and Abando expansion | Customer Success | Campaign is inherited attribution only |
| Budget approval | Executive / Ross | Campaign cannot approve its own budget |

The Campaign object must never transfer ownership of Sales, Delivery, Finance,
or Customer Success decisions to Marketing.

## 5. Campaign Status

The repository already uses campaign health language in the campaign operating
architecture. Canonical campaign health values are:

| Health status | Meaning |
| --- | --- |
| `healthy` | Campaign is performing within approved expectations. |
| `warm` | Campaign has useful signal but needs monitoring or improvement. |
| `at_risk` | Campaign is underperforming or has dependency risk. |
| `dormant` | Campaign is inactive or producing no recent signal. |
| `unknown` | Campaign lacks enough authoritative data to classify. |

Health status is projected from campaign performance inputs. It is not an
independent revenue authority.

## 6. Campaign Objectives

Campaign objectives must be explicit because Pipeline Value, lead quality, and
ROI interpretation depend on the objective.

Canonical objective categories:

| Objective | Description | Repository grounding |
| --- | --- | --- |
| `lead_generation` | Generate new qualified leads. | Marketing S1 to S2 |
| `shopifixer_outreach` | Create ShopiFixer sales opportunities. | Current synthesized campaign type |
| `shopifixer_close_engine` | Support conversion of existing ShopiFixer opportunities. | Current synthesized campaign type |
| `referral_expansion` | Generate referrals or expansion leads. | Current synthesized campaign type; referral is field-level today |
| `dormant_reactivation` | Reactivate dormant relationships or merchants. | Current synthesized campaign type |
| `fulfillment_delivery_support` | Support delivery-related conversion or proof loops without owning Delivery. | Current synthesized `fulfillment_delivery` type, constrained by department ownership |
| `abando_expansion` | Create Abando SaaS expansion opportunities after the ShopiFixer spine. | Abando tail exists but attribution is not implemented |

Campaign objectives must not redefine captured revenue, Merchant Value, payment
authority, or lead qualification rules.

## 7. Fiscal Quarter Linkage

Every canonical Campaign must link to a fiscal quarter because the fiscal model
uses quarterly planning, quarterly KPIs, and Campaign ROI.

Required canonical quarter linkage:

- Fiscal year identity or label.
- Fiscal quarter identity or label.
- Quarter objective or marketing objective, once such storage exists.

Current repository state:

- The fiscal operating model exists as authority.
- A durable fiscal year, quarter, and marketing objective store does not exist.
- Current synthesized campaigns can expose a quarter-like projection, but that
  projection is not a canonical campaign authority.

Until fiscal storage exists, campaign quarter linkage is a required model field
with no current repository store.

## 8. Annual Plan Linkage

Every canonical Campaign must link to the annual operating plan once that plan
has durable storage.

Annual linkage must answer:

- Which annual objective does the campaign support?
- Which quarterly target does the campaign support?
- Which budget allocation funds the campaign?
- Which KPI does the campaign intend to move?

Current repository state:

- Annual and fiscal operating concepts exist in authority documents.
- No annual plan registry is present as campaign storage.

The Campaign object must therefore reserve annual-plan linkage as a canonical
relationship, but implementation must wait for or create the governed annual and
quarter storage in a later mission.

## 9. Marketing Channel

Marketing channel is the business source category for the campaign.

Current real channels:

- Inbound website form.
- Email or manual outreach.

Current partial or future channels:

- Referral exists as a campaign type and lifecycle concept, but the current
  repository does not provide complete referral attribution.
- SEO, Google Ads, LinkedIn, Partnerships, Content, Video, and Events are future
  or not implemented channels in current authorities.

Canonical field:

- `marketing_channel`

The channel must not be confused with current `lead.source`. Repository truth
states that `lead.source` is currently a data-origin or operational source, not
full marketing attribution.

## 10. Platform

Platform is the execution venue or surface where the campaign is run.

Examples grounded in current and future operating documents:

- Stafford website or inbound form.
- Email or manual outreach tooling.
- Referral motion.
- Future paid or organic platforms such as Google Ads, LinkedIn, SEO, content,
  video, events, or partnerships.

Canonical field:

- `platform`

The platform value must describe the execution venue. It must not imply that a
future channel is currently implemented.

## 11. Audience

Audience defines who the campaign targets.

Canonical audience fields:

- `audience_name`
- `audience_description`
- `audience_segment`
- `audience_filters`
- `target_product_surface`

Audience must be specific enough to explain why generated leads belong to the
campaign. Audience does not qualify a lead. Sales qualification remains a Sales
authority.

## 12. Creative Assets

Creative assets are campaign-controlled materials used to produce traffic,
responses, or conversion.

Examples:

- Outreach copy.
- Email subject lines.
- Landing page copy.
- Ads or creative variants.
- Referral messages.
- Call-to-action variants.

Canonical asset requirements:

- Every production asset must be associated with exactly one canonical campaign
  or explicitly declared as shared.
- Every asset intended to generate leads must have attribution instructions.
- Every outbound asset requires human approval before send when outreach is
  involved.

Current repository state:

- A governed campaign asset registry is not present.
- Asset identifiers are missing in the attribution traceability architecture.

Therefore `creative_assets` can be represented in the canonical model, but
durable `asset_id` storage remains a future dependency.

## 13. Landing Page

Landing page is the conversion surface where the campaign sends traffic or
captures intent.

Canonical landing page fields:

- `landing_page_id`
- `landing_page_url`
- `landing_page_product_surface`
- `landing_page_owner`

Repository grounding:

- Conversion surfaces exist in repository surface registries.
- Current leads can be created without canonical campaign or UTM linkage.
- Landing page linkage alone is not sufficient attribution unless the campaign
  and UTM chain are present.

Landing page must never become payment or revenue authority.

## 14. UTM Strategy

UTM fields are the canonical external attribution parameters for campaign
traffic, once implemented.

Canonical UTM fields:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`

Canonical UTM rules:

- `utm_campaign` must resolve to a stable canonical `campaign_id` or approved
  campaign slug.
- `utm_source` identifies the traffic source or platform source.
- `utm_medium` identifies the medium such as email, referral, paid, organic, or
  social.
- `utm_content` identifies creative or variant where applicable.
- `utm_term` is optional and only applies where the channel uses terms or
  keyword-like attribution.
- Missing UTM fields must be treated as unknown attribution, not invented later.
- Manual attribution must be explicitly marked as manual and must carry a human
  or system provenance trail.

Current repository state:

- StaffordOS lead and campaign records do not currently provide canonical UTM
  fields.
- No lead-level canonical `campaign_id` exists today.

## 15. Budget

Budget is the approved planned campaign spend.

Canonical field:

- `budget_approved_amount`
- `budget_currency`
- `budget_approved_by`
- `budget_approved_at`

Authority rules:

- Ross approves campaign budgets.
- Campaign budget is a Marketing input and Executive governance decision.
- Budget is not spend.
- Budget is not revenue.
- Budget is not Pipeline Value.

Current repository state:

- Budget governance exists in fiscal and marketing authorities.
- No campaign budget store exists today.

## 16. Spend

Spend is the actual money spent to run the campaign.

Canonical field:

- `spend_actual_amount`
- `spend_currency`
- `spend_source`
- `spend_recorded_at`

Authority rules:

- Spend must be stored separately from budget.
- Spend is required for Campaign ROI.
- Spend must not be inferred from Pipeline Value, Merchant Value, or Stafford
  Revenue.
- If spend is missing or zero, ROI must be blocked or explicitly marked
  non-computable according to reporting rules.

Current repository state:

- No campaign spend store exists today.

## 17. Pipeline Value Estimate

Pipeline Value is an estimate of potential value. It is not captured Stafford
Revenue.

Canonical field:

- `pipeline_value_estimate`

Authority rules:

- Pipeline Value must be labeled as an estimate.
- Pipeline Value may be derived from open opportunities, campaign-attributed
  leads, or approved projection logic once the attribution head exists.
- Pipeline Value must not be counted as revenue.
- Pipeline Value must not be mixed with Merchant Value.
- Current `campaignResolver` revenue-at-stake style values are synthesized and
  inflated or unverified estimates, not source-of-record money.

Current repository state:

- Opportunity Value exists in `staffordos/units/opportunity_units_v1.json`.
- Current campaign-level pipeline-style values are projections, not canonical
  campaign storage.

## 18. Stafford Revenue Captured

Stafford Revenue is captured money Stafford earned.

Canonical campaign consumption field:

- `stafford_revenue_captured_attributed`

Authority rules:

- The source of record for actual Stafford Revenue is
  `staffordos/client_registry_v1.json` through
  `revenue.stafford_revenue_earned`.
- A payment can become earned only through the Stripe webhook authority defined
  in `staffordos/authority/payment_lifecycle_registry_v1.md`.
- Campaign never stores independent Stafford Revenue authority.
- Campaign may consume derived attributed revenue only after the payment and
  revenue records are authoritative.

Current repository state:

- Payment and captured revenue authority exists downstream.
- Campaign attribution to that revenue is not implemented because the
  Campaign -> Lead link is missing.

## 19. Merchant Value

Merchant Value is recovered or proven value for the merchant. It is never
Stafford Revenue.

Canonical campaign consumption field:

- `merchant_value_proven_attributed`

Authority rules:

- Merchant Value must be labeled separately from Stafford Revenue.
- Merchant Value must never be included in Campaign ROI numerator.
- Merchant Value may be used as proof, case-study context, or merchant outcome
  reporting only.

Repository grounding:

- Merchant Value authority is separate from Stafford Revenue in the canonical
  money model.
- Current authorities explicitly forbid treating Merchant Value as Stafford
  Revenue.

## 20. ROI Calculation Inputs

Canonical Campaign ROI requires captured Stafford Revenue and actual campaign
spend.

Canonical ROI input fields:

- `stafford_revenue_captured_attributed`
- `spend_actual_amount`
- `budget_approved_amount`
- `pipeline_value_estimate`
- `merchant_value_proven_attributed`

Canonical ROI rule:

`campaign_roi = stafford_revenue_captured_attributed / spend_actual_amount`

Reporting constraints:

- ROI numerator must use captured Stafford Revenue only.
- ROI denominator must use actual campaign spend.
- Pipeline Value may be shown near ROI only if labeled estimate.
- Merchant Value may be shown near ROI only if labeled Merchant Value and never
  included in ROI.
- If spend is missing, ROI is not computable.
- If campaign attribution is missing, ROI is not computable.
- If captured Stafford Revenue is missing, ROI may be zero only when attribution
  and spend are otherwise authoritative.

Current repository state:

- Campaign ROI is not computable today.
- The missing blockers are canonical campaign storage, lead-level campaign
  attribution, UTM fields, spend storage, and governed attribution projection.

## 21. Relationships

The Campaign object is the attribution head for existing downstream objects.

| Relationship | Cardinality | Current state | Canonical rule |
| --- | --- | --- | --- |
| Campaign -> Lead | One campaign can produce many leads | Broken; no lead `campaign_id` today | Lead must carry canonical attribution or explicit unknown/manual provenance |
| Campaign -> Merchant | Through Lead -> Relationship -> Merchant | Indirect path exists downstream | Campaign must not attach directly to Merchant unless inherited from lead attribution |
| Campaign -> Client | Through Merchant / client registry | Downstream authority exists | Client attribution must be derived, not manually invented |
| Campaign -> Payment | Through attributed client/payment path | Payment authority exists; campaign attribution missing | Campaign consumes payment-derived revenue only after payment is authoritative |
| Campaign -> Abando | Through Customer Success and Abando expansion tail | Tail exists but subscription/renewal IDs are incomplete | Abando attribution must inherit from upstream campaign and preserve expansion provenance |
| Campaign -> Relationship | Through lead matching and relationship resolver | Resolver exists | Relationship attribution must inherit from lead attribution where available |
| Campaign -> Proposal | Through merchant opportunity and offer state | Proposal IDs are not complete | Proposal attribution must be derived from the traced relationship/merchant path |
| Campaign -> Delivery | Through delivery or fulfillment identifiers | Delivery path exists downstream | Delivery attribution must not make Delivery a marketing owner |

## 22. Human Approval Gates

Canonical Campaign gates:

| Gate | Required approval | Reason |
| --- | --- | --- |
| Campaign approval | Ross | Campaign cannot move from idea to approved without human approval |
| Budget approval | Ross | Budget is an Executive governance decision |
| Launch approval | Ross or authorized operator | Campaign cannot become active without launch approval |
| Outreach send approval | Ross or authorized operator | Agents may draft but may not send unapproved outreach |
| Material budget change | Ross | Prevents unapproved spend changes |
| Offer or CTA change | Ross or authorized operator | Prevents unapproved market promises |
| Campaign close | Ross or authorized operator | Ends active attribution window |
| Retrospective acceptance | Human review | Converts findings into institutional knowledge |

Non-negotiable gate:

- Payment received is never a human approval gate. It is system-only and must
  remain controlled by the Stripe webhook authority.

## 23. AI Responsibilities

AI agents may support Campaign work inside approved authority boundaries.

Allowed AI responsibilities:

- Propose campaign ideas for human review.
- Draft outreach copy and creative variants.
- Summarize campaign performance.
- Recommend audience refinements.
- Recommend channel or platform adjustments.
- Generate proposed UTM values for human or system validation.
- Validate whether required campaign fields are present.
- Detect missing attribution links.
- Label estimates as estimates.
- Prepare retrospective summaries.

Forbidden AI responsibilities:

- Approve campaigns.
- Approve budgets.
- Launch campaigns without approval.
- Send unapproved outreach.
- Self-qualify leads.
- Close sales.
- Approve payment.
- Mark payment received.
- Convert estimates into Stafford Revenue.
- Treat Merchant Value as Stafford Revenue.
- Invent missing attribution.
- Backfill campaign attribution without provenance.

## 24. Canonical Identifiers

Canonical identifiers define how the campaign can be traced across the StaffordOS
spine.

| Identifier | Required | Current repository status | Canonical rule |
| --- | --- | --- | --- |
| `campaign_id` | Yes | Missing as stable per-campaign ID | Immutable, stable, per-campaign authority |
| `campaign_slug` | Optional | Missing | Human-readable alias only; not primary authority |
| `campaign_name` | Yes | Synthesized today | Human-readable name |
| `fiscal_year_id` or fiscal year label | Yes | Fiscal store missing | Required planning linkage |
| `fiscal_quarter_id` or quarter label | Yes | Fiscal store missing | Required planning linkage |
| `marketing_objective_id` | Future | Missing | Links campaign to quarterly or annual objective |
| `asset_id` | Future | Missing | Links creative variant to campaign |
| `landing_page_id` | Required when campaign uses a landing page | Surface registries exist; campaign linkage missing | Links campaign to conversion surface |
| `utm_campaign` | Required for external links once UTM exists | Missing | Must resolve to campaign authority |
| `lead_id` | Derived relationship | Exists | Lead must carry attribution once implemented |
| `relationship_id` | Derived relationship | Exists through resolver | Inherits from attributed lead |
| `merchant_id` | Derived relationship | Exists downstream | Inherits from traced relationship/client path |
| `client_id` | Derived relationship | Exists downstream | Inherits from traced client path |
| `payment_id` or Stripe payment identity | Derived relationship | Exists downstream | Payment remains Finance/system authority |
| `subscription_id` | Future derived relationship | Incomplete | Needed for Abando expansion attribution |
| `renewal_id` | Future derived relationship | Incomplete | Needed for renewal/LTV attribution |

The current type-level IDs generated by `campaignResolver` must not be treated
as canonical per-campaign identifiers.

## 25. Required Fields

These fields are required by the canonical Campaign business object. Some do not
yet have repository storage.

| Field | Requirement | Current repository status |
| --- | --- | --- |
| `campaign_id` | Stable per-campaign identifier | Missing |
| `campaign_name` | Human-readable campaign name | Synthesized today |
| `lifecycle_state` | Campaign lifecycle state | Not stored canonically |
| `health_status` | One of `healthy`, `warm`, `at_risk`, `dormant`, `unknown` | Projected/synthesized today |
| `owner_department` | Must be Marketing | Authority exists |
| `owner_person` | Human owner or accountable operator | Not stored canonically |
| `objective` | Campaign objective category | Synthesized types exist; canonical storage missing |
| `primary_product` | ShopiFixer or Abando, according to approved offer | Product fields exist downstream; campaign storage missing |
| `offer` | Approved offer promoted by campaign | Not stored canonically |
| `cta` | Approved call to action | Not stored canonically |
| `audience_name` | Target audience name | Not stored canonically |
| `marketing_channel` | Channel category | Partial; `lead.source` is not sufficient |
| `platform` | Execution venue | Not stored canonically |
| `fiscal_year` | Fiscal year linkage | Fiscal store missing |
| `fiscal_quarter` | Quarter linkage | Fiscal store missing |
| `budget_approved_amount` | Approved campaign budget | Budget store missing |
| `budget_currency` | Currency for budget | Budget store missing |
| `start_at` | Planned or actual start timestamp/date | Not stored canonically |
| `end_at` | Planned or actual end timestamp/date | Not stored canonically |
| `approval_status` | Approval state for campaign launch | Not stored canonically |
| `created_at` | Creation timestamp | Not stored canonically |
| `updated_at` | Update timestamp | Not stored canonically |

Required fields do not imply current implementation. They define the minimum
governed Campaign object needed for Phase 3 implementation.

## 26. Optional Fields

Optional fields enrich campaign governance but are not always present for every
campaign.

| Field | Use |
| --- | --- |
| `campaign_slug` | Human-readable alias for URLs, reports, or operator views |
| `audience_description` | Narrative explanation of the audience |
| `audience_segment` | Segment label |
| `audience_filters` | Structured targeting criteria |
| `landing_page_id` | Required only when a campaign uses a landing page |
| `landing_page_url` | URL for campaign destination |
| `creative_assets` | Asset references until a governed asset registry exists |
| `utm_source` | Required for UTM-enabled external campaign links |
| `utm_medium` | Required for UTM-enabled external campaign links |
| `utm_campaign` | Required for UTM-enabled external campaign links |
| `utm_content` | Optional creative variant attribution |
| `utm_term` | Optional keyword or term attribution |
| `spend_actual_amount` | Required before ROI can be computed |
| `spend_currency` | Required when spend exists |
| `spend_source` | Provenance of spend record |
| `success_criteria` | Human-approved success definition |
| `dependencies` | Known campaign dependencies |
| `notes` | Human-readable operating context |
| `retrospective_summary` | Required after review, optional before close |

## 27. Future Fields

Future fields are needed for complete attribution, expansion, and LTV analysis.
They are not current repository truth.

| Field | Reason |
| --- | --- |
| `annual_plan_id` | Durable annual plan linkage |
| `quarter_id` | Durable quarter linkage |
| `marketing_objective_id` | Durable objective linkage |
| `asset_id` | Creative-level attribution |
| `traffic_source_id` | Governed source registry |
| `attribution_model` | First touch, last touch, multi-touch, manual, referral, organic, paid, or unknown once chosen |
| `attribution_confidence` | Distinguishes direct, inferred, manual, and unknown attribution |
| `manual_attribution_reason` | Provenance for human-set attribution |
| `proposal_id` | Complete proposal tracing once proposal identity exists |
| `evidence_id` | Complete evidence tracing once evidence identity exists |
| `customer_success_id` | Complete Customer Success tracing |
| `subscription_id` | Abando subscription attribution |
| `renewal_id` | Renewal and LTV attribution |
| `lifetime_value_attributed` | Future LTV reporting after renewal model matures |

## 28. Current Repository Constraints

The Campaign object must respect these current constraints:

- Campaign storage does not exist.
- Campaign spend storage does not exist.
- Campaign budget storage does not exist.
- Stable per-campaign `campaign_id` does not exist.
- `campaign_slug` does not exist.
- UTM fields do not exist on leads or campaigns.
- `lead.source` exists but is not canonical marketing attribution.
- Current campaign objects are synthesized, not authoritative.
- Current campaign type IDs are not stable per-campaign IDs.
- Pipeline Value projections are estimates.
- Captured Stafford Revenue is downstream of Stripe webhook payment authority.
- Campaign ROI is blocked until attribution and spend exist.

## 29. Non-Goals

This Campaign model does not:

- Implement a database table, JSON registry, API route, UI component, validator,
  migration, or projection.
- Rename existing campaign types.
- Backfill historical attribution.
- Invent missing UTM values.
- Treat current `lead.source` as complete attribution.
- Treat current synthesized `campaign_id` values as canonical per-campaign IDs.
- Qualify leads.
- Create relationships.
- Create merchants.
- Approve proposals.
- Deliver services.
- Approve payments.
- Mark payment received.
- Count Pipeline Value as revenue.
- Count Merchant Value as Stafford Revenue.
- Replace `client_registry_v1.json` as Stafford Revenue authority.
- Replace the Stripe webhook as payment lifecycle authority.
- Merge ShopiFixer and Abando into an ungoverned combined offer.
- Enable Actinventory campaigns without later authority.

## 30. Canonical Data Model Summary

The canonical Campaign object is:

- Stored: future canonical campaign storage, not present today.
- Projected: campaign dashboards and reports may project from the stored object
  plus downstream attribution.
- Calculated: Pipeline Value estimate, captured Stafford Revenue attributed,
  Merchant Value attributed, health, and ROI.
- Formatted: dashboards may format money, percentages, dates, and status labels,
  but formatting must not change authority.

Minimum safe implementation dependency chain:

1. Create canonical campaign storage.
2. Create stable per-campaign `campaign_id`.
3. Add campaign attribution to lead capture.
4. Add UTM capture and provenance.
5. Add budget and spend storage.
6. Project Campaign -> Lead -> Revenue attribution.
7. Compute Campaign ROI from captured Stafford Revenue and actual spend.
8. Add campaign dashboard reporting with estimate labels and money walls intact.

## 31. GO / CONDITIONAL GO / NO GO

Recommendation: CONDITIONAL GO for Phase 3 implementation planning.

Conditions:

- Do not compute or publish Campaign ROI until campaign attribution and spend
  storage exist.
- Do not treat synthesized campaign resolver output as canonical campaign
  authority.
- Do not treat `lead.source` as complete marketing attribution.
- Do not let campaign records override payment or revenue authority.
- Implement the campaign foundation in the smallest sequence that preserves the
  existing Lead -> Revenue -> Customer Success -> Abando spine.

NO GO for reporting campaign ROI, campaign revenue, or campaign LTV as
authoritative today.
