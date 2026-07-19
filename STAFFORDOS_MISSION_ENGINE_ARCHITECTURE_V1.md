# STAFFORDOS_MISSION_ENGINE_ARCHITECTURE_V1

## Executive Summary

StaffordOS should treat a **Mission** as the top-level business object for meaningful work.

A Mission is a bounded unit of intent, execution, evidence, and learning. It can describe:

- a Training Mission
- a Merchant Mission
- a Campaign Mission
- an Internal Improvement Mission
- a Research Mission

This gives StaffordOS a consistent way to represent work across operator activity, merchant delivery, training, and AI-assisted planning.

**Final classification: YES**

The Mission domain should be the canonical top-level business object for StaffordOS because it unifies:

- what needs to be done
- who owns it
- what authority it depends on
- what evidence proves it
- what lesson survives it
- what reusable pattern should be preserved

That is a better operating abstraction than treating work as separate dashboards, pages, or conversations.

## 1. Canonical Mission Object

### Mission fields

- `mission_id`
  - stable unique identifier for the mission
- `mission_type`
  - `training`, `merchant`, `campaign`, `internal_improvement`, `research`
- `objective`
  - the concrete outcome to achieve
- `owner`
  - human or system owner responsible for progress
- `status`
  - current mission state
- `priority`
  - relative urgency / importance
- `evidence`
  - links or references to proof artifacts, screenshots, logs, or records
- `related_merchant`
  - merchant or store this mission concerns, if any
- `related_packet`
  - packet authority record tied to the mission, if any
- `related_campaign`
  - campaign record or campaign group tied to the mission, if any
- `related_training_environment`
  - environment used to practice or validate the mission
- `lessons_learned`
  - durable observations captured after completion
- `reusable_patterns`
  - named patterns that can be reused in later missions

### Recommended Mission shape

```json
{
  "mission_id": "mission_...",
  "mission_type": "merchant",
  "objective": "Restore a paid merchant continuity flow",
  "owner": "Ross",
  "status": "in_progress",
  "priority": "high",
  "evidence": [],
  "related_merchant": {
    "merchant_id": "elkeyecoffee.com"
  },
  "related_packet": {
    "packet_id": "packet_elkeyecoffee-com_7431aab34d"
  },
  "related_campaign": null,
  "related_training_environment": null,
  "lessons_learned": [],
  "reusable_patterns": []
}
```

## 2. Mission Lifecycle States

Canonical lifecycle:

1. `draft`
   - mission exists conceptually, not yet committed
2. `queued`
   - mission is accepted and waiting to start
3. `in_progress`
   - active work is underway
4. `blocked`
   - progress is halted by missing authority, dependency, or decision
5. `reviewing`
   - work is done but needs validation or signoff
6. `completed`
   - outcome achieved and evidence captured
7. `rolled_back`
   - work was reverted and the mission ended in the prior safe state
8. `archived`
   - mission is closed and retained as history and learning

Optional sub-status fields can exist for mission-specific detail, but these eight states should remain the canonical lifecycle.

## 3. Training Mission vs Merchant Mission

### Training Mission

A Training Mission exists to improve StaffordOS and ShopiFixer capability.

Properties:
- uses a controlled environment such as NoKings
- aims to produce reusable patterns and validated techniques
- success is measured by learning, repeatability, and safety
- evidence is usually screenshots, diffs, runbooks, and rollback rehearsal

### Merchant Mission

A Merchant Mission exists to produce customer value for a real merchant.

Properties:
- tied to a real merchant and usually a live packet
- aims to move the merchant toward a completed fix or outcome
- success is measured by merchant progress, continuity, revenue, and delivery
- evidence is usually packet authority, merchant workspace state, deliverables, and customer-visible continuity

### Core difference

Training Missions optimize for **pattern creation**.
Merchant Missions optimize for **merchant outcome**.

## 4. NoKings as the Canonical ShopiFixer Training Environment

NoKings becomes the canonical ShopiFixer training environment because it is:

- real Shopify theme structure, not mock files
- controlled, low-risk, practice-safe
- already inventoried in StaffordOS
- suitable for repeated inspect/propose/change/verify/rollback loops
- large enough to teach real Shopify file boundaries

NoKings should be treated as the standard place where ShopiFixer learns:

- homepage inspection
- product/collection/cart fixes
- header/footer behavior
- CTA and conversion changes
- mobile UX improvements
- rollback discipline

That makes NoKings the right training ground before external merchant work.

## 5. How Training Missions Become Reusable ShopiFixer Patterns

Training Missions should end by producing reusable engineering patterns.

### Pattern lifecycle

1. observe a merchant-style problem in NoKings
2. identify the exact Shopify files involved
3. apply the smallest safe change
4. verify before/after behavior
5. rollback if needed
6. record the lesson in StaffordOS
7. promote the successful fix pattern into the ShopiFixer playbook

### Pattern output

Each completed Training Mission should yield:

- problem class
- file map
- safe fix pattern
- validation checklist
- rollback plan
- before/after evidence
- lesson summary

These should become the reusable pattern library for later merchant work.

## 6. AI Chief of Staff Consumption Model

The AI Chief of Staff should consume Mission data as the primary planning substrate instead of relying on conversational memory.

### Why Mission data is better than chat memory

- structured
- auditable
- repeatable
- tied to evidence
- tied to authority
- carries lessons forward

### What the AI should read from Mission records

- objective
- type
- owner
- status
- priority
- authority dependencies
- evidence
- related merchant / packet / campaign
- lessons learned
- reusable patterns

### What the AI should do with Mission records

- prioritize the next mission
- detect blockers
- recommend next steps
- choose whether a mission is training, merchant, or research
- infer likely playbook patterns
- preserve execution memory as structured mission history

### What the AI should not do

- depend on hidden conversational state
- invent mission outcomes without evidence
- blur merchant missions and training missions
- treat screenshots or summaries as authority when packet or merchant state exists

## 7. Mission Relationship Map

### Packet Authority

- Packet Authority is the durable truth layer for paid merchant state.
- Merchant Missions should reference packet authority where payment or continuity matters.
- A mission may use packet state as a fact source, but not replace it.

### Merchant Workspace

- Merchant Workspace is the customer-facing surface for post-payment work.
- Merchant Missions should link to the merchant workspace and track its status.

### Operator

- Operator is the StaffordOS execution surface.
- Missions should be created, reviewed, and progressed from operator workflows.

### Campaigns

- Campaign Missions should relate to campaign objects and campaign health.
- Campaigns often generate follow-up missions or revenue missions.

### Evidence

- Evidence is mission proof.
- A mission is incomplete without evidence if it claims to have been executed.

### Revenue

- Revenue is a mission outcome category.
- Merchant Missions and Campaign Missions should show revenue effect where applicable.

### Future Shopify Playbook

- Training Missions should feed the playbook.
- The playbook should be the reusable memory of successful mission patterns.

## 8. Canonical Mission Types

### Training Mission
- purpose: practice and pattern creation
- environment: NoKings or equivalent controlled store
- authority: theme files, screenshots, rollback evidence

### Merchant Mission
- purpose: real merchant delivery
- environment: live merchant + packet authority + merchant workspace
- authority: packet authority, merchant workspace, live evidence

### Campaign Mission
- purpose: campaign motion and revenue movement
- environment: operator campaign command and related merchant records
- authority: campaign resolver, relationship data, revenue truth

### Internal Improvement Mission
- purpose: improve StaffordOS itself
- environment: operator surfaces and internal truth stores
- authority: operator data, execution logs, system state

### Research Mission
- purpose: answer a question before changing the system
- environment: docs, audits, and controlled review
- authority: source inspection, measured evidence, historical patterns

## 9. Mission State to Output Mapping

- `draft` → mission definition only
- `queued` → scheduled in operator workflow
- `in_progress` → active task surface
- `blocked` → explicit blocker surfaced
- `reviewing` → evidence under review
- `completed` → reusable pattern extracted
- `rolled_back` → safe reset recorded
- `archived` → retained for memory and analysis

## 10. StaffordOS System Mapping

### Packet Authority
- provides payment and continuity facts
- linked to merchant missions

### Merchant Workspace
- provides customer-facing mission execution
- linked to merchant missions and evidence

### Operator
- creates, routes, and tracks missions
- the main control surface for mission execution

### Campaigns
- source of campaign missions
- influences priority and revenue flow

### Evidence
- proves mission completion or blockage
- attaches to every finished mission

### Revenue
- measures mission impact
- especially for merchant and campaign missions

### Future Shopify Playbook
- stores reusable patterns from training missions
- informs future mission planning

## 11. Canonical Top-Level Business Object Decision

**YES**

Mission should become the canonical top-level business object for StaffordOS because it:

- unifies work across training, merchants, campaigns, and internal improvement
- ties intent to evidence
- preserves lessons and reusable patterns
- gives the AI Chief of Staff a stable unit of reasoning
- prevents StaffordOS from degrading into disconnected dashboards

Mission is the right abstraction layer above packet authority, merchant workspace, and operator execution.
