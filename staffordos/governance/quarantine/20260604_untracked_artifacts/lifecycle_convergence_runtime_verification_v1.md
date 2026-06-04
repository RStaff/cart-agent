# Lifecycle Convergence Runtime Verification v1

Canonical authority:

- `staffordos/authority/output/staffordos_canonical_lifecycle_v1.md`
- `staffordos/operator_design/lifecycle_convergence_plan_v1.md`
- `staffordos/operator_design/lifecycle_convergence_phase1_results_v1.md`

Verification basis:

- current runtime code paths in the operator frontend
- current dashboard snapshot output on disk
- read-side mappings added in phase 1

## A. Verified Alignment

### Surfaces now using canonical lifecycle terminology

- `/operator/command-center`
  - Uses the mapped Ross-facing primary action loader.
  - The primary action path now carries canonical lead/client labels in supporting context.
  - Business-facing copy is retained; raw control jargon is not shown in the main card.

- `/api/operator/ceo-snapshot`
  - Exposes canonical aliases for lead and client reads:
    - `canonical_lifecycle_stage`
    - `canonical_phase`
    - `canonical_lifecycle_counts`
    - `canonical_closest_to_payment`
  - Still returns raw fields for compatibility, but the canonical fields are now present in the runtime payload.

- `/api/operator/client-registry`
  - Exposes canonical aliases on read:
    - `canonical_lifecycle_stage`
    - `canonical_phase`
    - `lifecycle_display`
  - Keeps stored registry data unchanged.

- Command-center snapshot loading
  - `loadPrimaryActionSnapshot` now translates lead stage labels, client stage labels, and operator reason codes into Ross-facing language.

### Lifecycle stages visible in aligned runtime reads

- `Contact Discovery`
- `Conversation`
- `Qualified Target`
- `Audit`
- `Proposed Fix`
- `Payment`
- `Implementation`
- `After-State Evidence`
- `Proof Package`
- `Merchant Success`
- `Merchant Review`
- `Testimonial`
- `Referral`
- `Next Sprint`

These are visible either directly in runtime read payloads or as canonical aliases in the command-center path.

## B. Remaining Drift

### Surfaces still exposing legacy lifecycle terminology

- `/operator/leads`
  - Still renders raw lead registry stage labels in the page table and status summary.
  - Visible terms include:
    - `Contact Ready`
    - `Outreach Ready`
    - `Queued`
    - `Sent`
    - `Engaged`
    - `Blocked`
  - The table still shows raw `lead.lifecycle_stage` values.

- `/operator/revenue-command`
  - Still renders raw lead-state vocabulary:
    - `Contact needed`
    - `Send initial outreach`
    - `Approved`
    - `Dry-run ready`
    - `Sent`
    - `Engaged`
  - The page title and section headers still read like a lead pipeline control view rather than a canonical merchant lifecycle view.

- `/api/operator/ceo-snapshot`
  - Still includes raw compatibility fields:
    - `lifecycle_counts`
    - `lifecycle_stage`
    - `payment_status`
    - `proposal_sent_clients`
    - `followup_sent_leads`
  - These are acceptable for compatibility, but they are still legacy vocabulary in the payload.

- `staffordos/clients/operator_dashboard_snapshot_v1.json`
  - Still contains raw stage values because phase 1 was read-side only.
  - Visible examples:
    - `proposal_sent`
    - `lead`
  - The snapshot file itself is not yet canonicalized.

- `/api/operator/client-registry`
  - Still returns raw compatibility fields alongside the canonical aliases.
  - The runtime payload is improved, but not fully canonical-only.

### Engineering / system language still exposed

- `/api/operator/ceo-snapshot`
  - `status: loaded|missing|malformed`
  - `source_policy`
  - `proof_status`
  - `partial_missing_packet_adapter`
  - `system_health_summary`
  - `source_health`

- `/api/operator/client-registry`
  - `SOURCE`, `status`, `blockers`, and other implementation-oriented fields remain in the payload for compatibility.

- `staffordos/clients/operator_dashboard_snapshot_v1.json`
  - `source` points at the registry file path.
  - `top_metrics`, `system_health_summary`, and other internal aggregates are still exposed as snapshot structure.

## C. Highest ROI Next Convergence Change

Update `/operator/revenue-command` next.

Why this surface:

- It still exposes the densest legacy lead-state vocabulary.
- It is a high-frequency operator control surface.
- It sits close to revenue decision-making, so terminology drift here is visible and costly.
- It can be aligned with the same read-side mapping approach without changing stored data or lifecycle authorities.

Recommended next step after that:

- update `/operator/leads` to render canonical acquisition labels instead of raw lead-state labels.

