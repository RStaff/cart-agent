# StaffordOS P3 Canonical Lead Data Model V1

Mission: STAFFORDOS_P3.3_CANONICAL_LEAD_DATA_MODEL_V1
Status: documentation and design only
Implementation status: not implemented
Commit status: do not commit

## Executive Summary

The current Lead registry exists and is real, but it is not yet a clean
canonical model. The repository shows 13 lead records in
`staffordos/leads/lead_registry_v1.json`, with mixed row shapes created by the
sync agent and downstream projections.

Repository truth:

- `lead_registry_v1.json` is the stored lead authority.
- `lead_registry_sync_agent_v1.mjs` is the writer that normalizes and persists
  lead rows.
- `loadOperatorLeads.ts` is a read-only UI projection that derives display
  fields.
- `relationshipResolver.ts` consumes lead identity fields to build the
  cross-store relationship object.
- `promote_leads_to_clients_v1.mjs` promotes qualified leads into the client
  registry.

The canonical Lead model must stay smaller than Campaign Attribution. It should
own prospect identity, contactability, routing hints, qualification state, and
lead-level provenance. It should not absorb campaign identity, spend, revenue, or
merchant/client lifecycle authority.

Critical design decision:

- `campaign_id` and UTM fields do not belong in the current lead registry yet.
- They are future attribution fields that will be added later without creating a
  parallel lead authority.
- Lead should remain the first durable attribution surface, not the campaign
  store.

Recommendation: CONDITIONAL GO for the next implementation step after the lead
model is locked and campaign attribution is added to the lead write path.

## Current Lead Shape

Current observed lead fields in the registry include:

- `channel`
- `contact.*`
- `contact_confidence`
- `created_at`
- `domain`
- `engagement.*`
- `execution.*`
- `follow_up_message`
- `generated_at`
- `id`
- `lead_id`
- `lifecycle_stage`
- `message`
- `name`
- `payment.*`
- `payment_status`
- `payment_url`
- `problem_summary`
- `product`
- `product_surface`
- `refs.*`
- `routing.*`
- `runtime_source`
- `score`
- `send_target`
- `source`
- `status`
- `updated_at`

Additional mixed-shape fields observed in some rows or writer output:

- `lead_state`
- `product_intent`
- `qualification_status`
- `qualification_reason`
- `qualification_source`
- `qualification_updated_at`
- `temperature`
- `conversion_score`

Current registry facts:

- Count observed: 13 leads.
- Lead rows are not perfectly uniform.
- The sync agent is the canonical writer for the registry shape today.

## Canonical Lead Model

Canonical purpose:

A Lead is an unqualified prospect record that captures a person or store,
preserves the origin of the prospect, records routing and qualification state,
and hands a qualified prospect to Client / Relationship promotion without losing
identity.

Canonical Lead responsibilities:

- Hold prospect identity.
- Hold contactability.
- Hold intake provenance.
- Hold routing hints.
- Hold qualification state.
- Hold lead-level engagement evidence.
- Feed Relationship resolution.
- Feed Client promotion when qualified.

Canonical Lead non-responsibilities:

- Campaign ownership.
- Campaign budgeting.
- Attribution rollup.
- Relationship authority.
- Merchant authority.
- Client authority.
- Payment authority.
- Revenue authority.

Canonical lead object shape:

- `lead_id`
- `name`
- `domain`
- `product`
- `product_surface`
- `source`
- `channel`
- `runtime_source`
- `contact`
- `engagement`
- `execution`
- `routing`
- `refs`
- `status`
- `qualification_status`
- `qualification_reason`
- `qualification_source`
- `qualification_updated_at`
- `score`
- `problem_summary`
- `created_at`
- `updated_at`

Canonical nested shapes:

- `contact`: `email`, `name`, `role`, `confidence`
- `engagement`: `audit_viewed`, `experience_viewed`, `replied`,
  `approved_for_send`, `dry_run_ready`, `sent`, `recovery_sent`, `return_tracked`,
  `recovered_revenue`
- `execution`: `channel`, `send_target`, `message`, `follow_up_message`
- `routing`: `primary`, `secondary`, `rule`
- `refs`: `outreach_queue`, `approval_queue_ids`, `send_ledger_ids`, `reply_ids`,
  `outcome`
- `status`: `current_stage`, `current_bottleneck`, `next_action`

Canonical lead model rule:

- If a field exists only to support UI convenience or downstream promotion, it
  must remain derived or transitional, not authoritative.

## Required Fields

Required fields are the minimum set a lead must carry to remain a governed lead
record.

| Field | Purpose | Current status |
| --- | --- | --- |
| `lead_id` | Stable lead identity | Stored |
| `name` | Human-facing identifier | Stored |
| `domain` | Store or prospect domain | Stored |
| `product` | Governing product intent | Stored |
| `product_surface` | Product surface / target surface | Stored |
| `source` | Prospect origin class, not campaign attribution | Stored |
| `channel` | Lead intake or outreach channel | Stored / duplicated in some rows |
| `runtime_source` | Provenance of the row | Stored |
| `contact.email` | Primary contactability signal | Stored when known |
| `contact.confidence` | Contact confidence | Stored |
| `engagement.sent` | Outreach sent signal | Stored |
| `engagement.replied` | Reply signal | Stored |
| `routing.primary` | Primary product route | Stored |
| `routing.secondary` | Secondary route | Stored |
| `status.current_stage` or `lifecycle_stage` | Lead progression state | Stored / partially duplicated |
| `score` | Lead score | Stored |
| `qualification_status` | Qualification decision state | Stored in some rows |
| `qualification_reason` | Why the lead is qualified or pending | Stored in some rows |
| `qualification_source` | Source of qualification truth | Stored in some rows |
| `qualification_updated_at` | Qualification timestamp | Stored in some rows |
| `created_at` | Lead creation timestamp | Stored |
| `updated_at` | Last mutation timestamp | Stored |

Required fields are not all equally authoritative today, but they are the
minimum safe canonical lead set.

## Optional Fields

Optional fields improve operator ergonomics or support specific lead cases.

| Field | Purpose |
| --- | --- |
| `contact.name` | Contact person name |
| `contact.role` | Contact person role |
| `engagement.audit_viewed` | Audit interaction signal |
| `engagement.experience_viewed` | Experience or landing-page view signal |
| `engagement.approved_for_send` | Send approval signal |
| `engagement.dry_run_ready` | Dry-run readiness signal |
| `engagement.recovery_sent` | Abando recovery signal |
| `engagement.return_tracked` | Return-tracking signal |
| `engagement.recovered_revenue` | Recovered merchant value evidence |
| `execution.send_target` | Destination or address used for outreach |
| `execution.message` | Outreach body or message body |
| `execution.follow_up_message` | Follow-up body |
| `problem_summary` | Human-readable problem summary |
| `refs.outreach_queue` | Queue membership flag |
| `refs.approval_queue_ids` | Approval queue references |
| `refs.send_ledger_ids` | Send ledger references |
| `refs.reply_ids` | Reply references |
| `refs.outcome` | Outcome linkage flag |
| `channel` | Intake channel label when present |
| `payment_status` | Transitional payment-intent placeholder only |
| `payment_url` | Transitional payment-intent placeholder only |
| `generated_at` | Legacy duplicate timestamp label |

Optional does not mean authoritative. Several optional fields are legacy or
duplicated and must not become source of truth.

## Future Attribution Fields

These fields belong on Lead conceptually, but they are not to be implemented
yet.

| Field | Future purpose | Notes |
| --- | --- | --- |
| `campaign_id` | Lead-to-campaign attribution link | Do not add yet |
| `campaign_slug` | Human-readable campaign alias | Secondary only |
| `utm_source` | Traffic source attribution | Do not add yet |
| `utm_medium` | Channel medium attribution | Do not add yet |
| `utm_campaign` | Campaign attribution string | Do not add yet |
| `utm_content` | Creative variant attribution | Do not add yet |
| `utm_term` | Keyword or term attribution | Do not add yet |
| `attribution_model` | How credit is assigned | Future governance field |
| `attribution_confidence` | Strength of attribution claim | Future governance field |
| `attribution_source` | Human or system provenance | Future governance field |
| `first_touch_*` | First-touch history | Future only |
| `last_touch_*` | Last-touch history | Future only |
| `touch_history` | Multi-touch lineage | Future only |

Design rule:

- Lead is the first durable place where campaign attribution should eventually be
  preserved.
- Today that preservation is intentionally absent.
- Do not create a parallel attribution authority anywhere else in the Lead
  stack.

## Immutable Fields

These fields should not be mutated after lead creation except by a governed
reconciliation process that preserves history.

| Field | Why immutable |
| --- | --- |
| `lead_id` | Primary identity |
| `domain` | Core prospect identity anchor |
| `created_at` | Creation timestamp |
| `runtime_source` | Provenance of origin |
| `source` | Origin classification at ingestion |
| `generated_at` | Legacy creation timestamp if present |
| `id` | Registry alias for identity, when present |

## Mutable Fields

These fields may change as the lead is enriched, qualified, routed, or promoted.

| Field | Why mutable |
| --- | --- |
| `name` | Prospect naming may improve |
| `product` | Product intent can be corrected |
| `product_surface` | Surface mapping can change |
| `channel` | Intake channel can be refined |
| `contact.*` | Contact enrichment changes over time |
| `engagement.*` | Engagement evolves |
| `execution.*` | Outreach content and target may change |
| `routing.*` | Routing can be corrected |
| `refs.*` | References accumulate |
| `status.*` | Lead stage and next action change |
| `score` | Lead scoring updates |
| `qualification_status` | Qualification decision may change with review |
| `qualification_reason` | Reason can be refined |
| `qualification_source` | Provenance can be corrected |
| `qualification_updated_at` | Updated on qualification changes |
| `payment_status` | Transitional placeholder state only, if still used |
| `payment_url` | Transitional placeholder state only, if still used |
| `updated_at` | Last mutation timestamp |

Mutation rule:

- Mutable fields may be updated by the lead registry sync process, but the model
  must preserve enough provenance to avoid rewriting history silently.

## Derived Fields

These fields should be treated as calculated or projected, not independently
authoritative.

| Field | Derivation source |
| --- | --- |
| `id` | Alias of `lead_id` or domain-based fallback |
| `status.current_stage` | Lead state machine / sync agent |
| `status.current_bottleneck` | Lead state machine |
| `status.next_action` | Lead state machine / sync agent |
| `status.temperature` | Derived classification in some rows |
| `status.conversion_score` | Derived or projected score in some rows |
| `temperature` | Projection convenience |
| `conversion_score` | Projection convenience |
| `lead_state` | Legacy/alternate stage label |
| `product_intent` | Routing classification / product route |
| `contact_confidence` | Duplicate of `contact.confidence` |
| `generated_at` | Duplicate timestamp label |
| `message` | Duplicate of `execution.message` |
| `follow_up_message` | Duplicate of `execution.follow_up_message` |
| `send_target` | Duplicate of `execution.send_target` |
| `payment_status` | Duplicate or transitional placeholder, not revenue authority |
| `payment_url` | Duplicate or transitional placeholder, not revenue authority |
| `qualification_*` | Derived by sync agent from lead state and downstream signals |
| `refs.outreach_queue` | Derived from queue membership |
| `refs.outcome` | Derived from outcome presence |
| `engagement.recovered_revenue` | Derived from outcome evidence |

Load-time projection fields in `loadOperatorLeads.ts`:

- `canonical_lifecycle_stage`
- `canonical_phase`
- `next_action`
- `outreach_ready`
- `queued`
- `sent`
- `replied`
- `last_event_at`

These are UI/runtime projections and must not be written back to the canonical
lead registry as if they were source fields.

## Deprecated / Duplicated Fields

The current registry contains several duplicate or transitional forms.

| Field | Canonical handling |
| --- | --- |
| `id` | Duplicate alias of `lead_id`; keep only as compatibility alias |
| `contact_confidence` | Duplicate of `contact.confidence`; deprecate top-level form |
| `send_target` | Duplicate of `execution.send_target`; deprecate top-level form |
| `message` | Duplicate of `execution.message`; deprecate top-level form |
| `follow_up_message` | Duplicate of `execution.follow_up_message`; deprecate top-level form |
| `channel` | Keep canonical only if it means lead intake/outreach channel; otherwise normalize into `execution.channel` and/or `source` |
| `payment_status` | Transitional placeholder only; not payment authority |
| `payment_url` | Transitional placeholder only; not payment authority |
| `generated_at` | Duplicate of `created_at`; deprecate |
| `lead_state` | Legacy alias for progression state; consolidate to `status.current_stage` and/or `lifecycle_stage` |
| `product_intent` | Routing duplicate; consolidate to `product` / `routing.primary` |
| `temperature` | Projection field; do not promote to canonical lead source |
| `conversion_score` | Projection field; do not promote to canonical lead source |

The canonical model should avoid creating more aliases. The registry already has
enough duplication debt.

## Field Ownership Matrix

| Field | Canonical owner | Current writer | Read / derived by |
| --- | --- | --- | --- |
| `lead_id` | Lead registry | `lead_registry_sync_agent_v1.mjs` | UI loaders, relationship resolver, client promotion |
| `domain` | Lead registry | `lead_registry_sync_agent_v1.mjs` | Relationship resolver, promotion |
| `name` | Lead registry | `lead_registry_sync_agent_v1.mjs` | UI loaders, promotion |
| `source` | Lead registry | `lead_registry_sync_agent_v1.mjs` | UI loaders, promotion |
| `channel` | Lead registry / outreach layer | `lead_registry_sync_agent_v1.mjs`, outreach writers | UI loaders |
| `runtime_source` | Lead registry | `lead_registry_sync_agent_v1.mjs` | Audit and provenance checks |
| `product` | Lead registry | `lead_registry_sync_agent_v1.mjs` / downstream backfills | Promotion and routing |
| `product_surface` | Lead registry | `lead_registry_sync_agent_v1.mjs` | Promotion and routing |
| `contact.*` | Lead registry | `lead_registry_sync_agent_v1.mjs`, contact research / outreach agents | UI, promotion, relationship resolver |
| `engagement.*` | Lead registry | `lead_registry_sync_agent_v1.mjs`, outcome and outreach signals | UI, promotion |
| `execution.*` | Lead registry | outreach / lead workflow writers | UI, send ledger, promotion |
| `routing.*` | Lead registry | `lead_registry_sync_agent_v1.mjs` | Promotion, routing |
| `refs.*` | Lead registry | `lead_registry_sync_agent_v1.mjs` | UI, reconciliation |
| `status.*` | Lead registry | `lead_registry_sync_agent_v1.mjs` | UI, qualification logic |
| `qualification_*` | Lead registry | `lead_registry_sync_agent_v1.mjs` | Promotion, UI |
| `score` | Lead registry | `lead_registry_sync_agent_v1.mjs` | UI, promotion eligibility |
| `created_at` | Lead registry | `lead_registry_sync_agent_v1.mjs` | UI, history |
| `updated_at` | Lead registry | `lead_registry_sync_agent_v1.mjs` | UI, history |
| `id` | Compatibility alias only | Derived by writer | UI compatibility |
| `contact_confidence` | Compatibility alias only | Derived by writer / legacy rows | UI compatibility |
| `send_target` | Compatibility alias only | Derived by writer / legacy rows | UI compatibility |
| `message` | Compatibility alias only | Derived by writer / legacy rows | UI compatibility |
| `follow_up_message` | Compatibility alias only | Derived by writer / legacy rows | UI compatibility |
| `generated_at` | Compatibility alias only | Derived by writer / legacy rows | UI compatibility |
| `payment_status` | Not authoritative on Lead | Legacy / transitional | Downstream payment authority only |
| `payment_url` | Not authoritative on Lead | Legacy / transitional | Downstream payment authority only |

Writer authority:

- `lead_registry_sync_agent_v1.mjs` is the only discovered canonical writer for
  the lead registry shape today.
- `loadOperatorLeads.ts` is read-only.
- `relationshipResolver.ts` is read-only projection logic.
- `promote_leads_to_clients_v1.mjs` reads lead data and writes client records;
  it does not define the lead schema.

## Attribution Extension Plan

The future attribution plan must add attribution to Lead without creating a new
parallel store.

Plan:

1. Preserve the current lead registry as the canonical lead store.
2. Add `campaign_id` to Lead when campaign attribution is ready.
3. Add UTM fields to Lead when attribution capture is ready.
4. Keep `source` as origin classification, not campaign identity.
5. Keep `runtime_source` as provenance.
6. Keep attribution provenance explicit rather than inferred silently.

Where `campaign_id` belongs:

- On Lead, as the future campaign-to-lead link.
- Not in a separate lead authority.
- Not in the client registry as primary campaign attribution.

Where UTM fields belong:

- On Lead, alongside the future campaign link.
- Not in the campaign projection only.
- Not in the client registry as the primary capture surface.

Attribution rule:

- A lead may be created before campaign attribution exists, but once the
  campaign-to-lead link is implemented, the lead must carry the upstream
  campaign provenance.

## Promotion Mapping

### Lead -> Relationship

Promotion / resolution inputs used today:

- `lead_id`
- `domain`
- `contact.email`
- `name`
- `product`
- `product_surface`
- `source`
- `status.current_stage` / `lifecycle_stage`
- `routing.*`
- `score`
- `updated_at`

RelationshipResolver fields indicate the relationship object needs:

- lead identity
- client identity
- merchant identity
- email / contactability
- stage / next action

Canonical rule:

- Relationship is a cross-store identity object, not a lead subtype.
- Lead should provide the identity anchor and routing context, not the full
  relationship authority.

### Lead -> Client

Promotion writer inputs in `promote_leads_to_clients_v1.mjs`:

- `lead_id` or `id`
- `domain`
- `source`
- `product`
- `product_surface`
- `contact.email`
- `contact.name`
- `contact.role`
- `contact.confidence`
- `routing.primary`
- `routing.secondary`
- `qualification_status`
- `qualification_reason`
- `qualification_source`
- `qualification_updated_at`
- `status.current_stage` / `lifecycle_stage`

Promotion rule:

- Only qualified leads promote to Client.
- The client record should inherit lead identity and qualification provenance.
- The client registry, not the lead registry, becomes the authority for client
  lifecycle and revenue fields.

## Duplicate Field Report

Current duplicate or overlapping fields in the lead registry:

- `id` and `lead_id`
- `contact_confidence` and `contact.confidence`
- `message` and `execution.message`
- `follow_up_message` and `execution.follow_up_message`
- `send_target` and `execution.send_target`
- `channel` and `execution.channel`
- `generated_at` and `created_at`
- `lead_state` and `lifecycle_stage` and `status.current_stage`
- `product_intent` and `product` / `routing.primary`
- `payment_status` and the downstream payment lifecycle
- `payment_url` and downstream payment capture / payment URL concepts
- `temperature` and `status.temperature`
- `conversion_score` and `status.conversion_score`

Assessment:

- The duplicates are manageable, but they need a canonical normalization rule.
- No new alias should be added until these are reconciled.

## Writer Authority Report

Current write authority by repository truth:

- `lead_registry_sync_agent_v1.mjs`
  - Writes lead registry rows.
  - Normalizes domain and stage.
  - Derives qualification fields.
  - Emits lead registry events.
- `promote_leads_to_clients_v1.mjs`
  - Reads leads.
  - Writes clients.
  - Does not own lead truth.
- `loadOperatorLeads.ts`
  - Reads registry and temp queues.
  - Derives UI-only fields.
  - Does not own lead truth.
- `relationshipResolver.ts`
  - Reads lead/client/merchant data.
  - Derives relationship objects.
  - Does not own lead truth.

Practical authority rule:

- If a field is written by the sync agent, it can be canonical lead truth.
- If a field is only derived by the UI, it is not canonical lead truth.
- If a field is owned by downstream promotion or relationship logic, it belongs
  to those layers, not to the Lead authority.

## Implementation Sequence

Smallest safe implementation path:

1. Freeze the canonical Lead field set in documentation.
2. Normalize lead registry reading around the current stored lead fields.
3. Remove confusion between canonical lead truth and UI projections.
4. Preserve current lead registry write behavior without introducing new
   authorities.
5. Add campaign attribution fields to Lead in a later mission only after the
   campaign model is stable.
6. Then add UTM capture on Lead.
7. Then connect Campaign -> Lead.
8. Then build campaign ROI from the existing money model.

This sequence avoids creating a parallel campaign or relationship store before
the lead model is stable.

## Migration Implications

No migration is defined in this mission.

However, the canonical model implies these future normalization steps:

- Consolidate duplicate top-level fields into nested canonical shapes.
- Preserve legacy aliases only for compatibility.
- Keep existing lead records readable.
- Do not rewrite historical lead truth in place without provenance.
- Do not normalize into a new schema until attribution fields are ready.

Important constraint:

- Existing leads must not be migrated in this mission.
- Existing writers must not be changed in this mission.

## Rollback Strategy

Rollback is conceptual only because no implementation is being made here.

If a later implementation goes wrong, rollback should:

- Leave the lead registry readable.
- Preserve current lead IDs.
- Preserve current qualification and routing truth.
- Revert only the newly added attribution fields or projections.
- Avoid touching client, merchant, payment, or revenue authorities.

## GO / CONDITIONAL GO / NO GO

Recommendation: CONDITIONAL GO.

Reason:

- The canonical Lead model is sufficiently grounded to support a later campaign
  attribution implementation.
- The registry shape is messy but understandable.
- The safe next step is campaign attribution on Lead, not parallel lead modeling.

Conditions:

- Do not add `campaign_id` yet.
- Do not add UTM fields yet.
- Do not change lead writers yet.
- Do not rewrite lead history.
- Do not promote UI projections into source truth.

NO GO only if the next mission attempts to implement attribution before the
Lead model is treated as the single governed lead authority.
