# Exercise 010 Fix Scope - Safe Edit Simulation

Status:
Complete

Mission ID:
mission_001

Mission:
Mission 001 - NoKings Shopify Engineering Training

Product:
ShopiFixer

Exercise ID:
exercise_010

Exercise:
Exercise 010 - Safe Edit Simulation

Merchant:
NoKings Athletics

Environment Type:
controlled_training

Store:
no-kings-athletics.myshopify.com

Authority Mode:
analysis-only

Payment Required:
false

Implementation Permitted:
No

Scope Authority:
Exercise-specific

Active Scope Path:
staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_010/fix_scope.md

Exact Problem / Learning Objective:
Exercise 010 - Safe Edit Simulation

Practice proposing a smallest-safe change without applying it; compare the proposed change against baseline; define the revert path before approval. This is a proposal-only safe edit simulation: nothing is applied to any theme.

Target Page / Template / Artifact:
Exercise 010 - Safe Edit Simulation; safe edit simulation; smallest-safe change proposal against a repository-proven target from a certified Exercise 004-009 file map (the specific target file is selected during the governed simulation phase, not fixed by this scope).

Smallest Governed Scope:
Produce a proposal-only safe-edit simulation using only Exercise 010 authority and repository-backed NoKings evidence: a smallest-safe change statement, an exact proposed diff recorded as documentation, a baseline comparison, and a complete rollback design. Apply nothing.

## Authority Mode

analysis-only simulation.

Repository-backed basis:

- The canonical mission record (`STAFFORDOS_MISSION_001_NOKINGS_TRAINING_V1.md`, Exercise 010) defines the objective as proposing a smallest-safe change "without applying it."
- The Exercise 009 certification (`p11_36_mission_001_exercise_009_certification_v1.md`) fixes the forward authority mode: "analysis-only proposal unless later canonical doctrine explicitly authorizes implementation." No later canonical doctrine authorizes implementation.
- The P11.37 plan (`p11_37_exercise_010_safe_edit_simulation_plan_v1.md`) classifies Exercise 010 as analysis-only simulation and holds implementation (even unpublished-theme) as Not Yet Governed.

No Shopify mutation, theme edit (published or unpublished), local theme-copy edit, admin/CLI/API execution, or live-theme publication is authorized. Rollback is designed and rehearsed on paper only; nothing is applied, so nothing is executed.

## Proven Repository Sources

Certified file maps available for target selection (all verified in the archived NoKings theme backup):
`staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/`

- Product page architecture — certified Exercise 004
- Collection page architecture — certified Exercise 005
- Cart architecture — certified Exercise 006
- Header / navigation architecture — certified Exercise 007
- Trust / CTA architecture — certified Exercise 008
- Footer architecture — certified Exercise 009
- Homepage architecture — Exercises 001-003 reports and `SHOPIFIXER_PATTERN_LIBRARY_0001_HOMEPAGE_ARCHITECTURE`

Baseline recovery sources:

- Archived theme backup path above (source-of-truth for target file content and hashes)
- Git history and mission tags (per-artifact restore)

## Candidate Change-Selection Criteria

The specific intervention is not chosen by this scope. Canonical doctrine assigns target selection to the governed simulation phase ("likely files involved: depends on the selected prior file map"). The simulation must select exactly one change that is:

- repository-backed (target file and current content proven in the archived backup and certified in an Exercise 004-009 inventory)
- small and visible (text, label, spacing, or single-block change; no broad refactor)
- easy to explain in one merchant-facing sentence
- reversible (single-file, content-level change with exact original content recorded)
- observable before and after (a rendered/visual delta would exist if applied)
- isolated from payment and checkout authority (no cart-to-checkout, payment-meaning, or checkout files)
- local, not shared (avoids shared snippets and global-shell/group JSON with high blast radius)
- pattern-productive (generalizes into a reusable ShopiFixer safe-fix pattern)

## Required Rollback Path

The simulation must define a complete rollback design before any approval language:

- baseline recovery point (archived backup path per target file plus the Git anchor)
- exact changed files (expected: one)
- original content and content hash of each target file, captured at before-evidence time
- reversal process (restore recorded original content; classified per canon rollback-by-file-type)
- rollback verification (restored-content hash equals baseline hash; canon reversion-validation checklist)
- stop conditions (baseline hash mismatch, missing backup, unexpected file state)

## In Scope

- Selecting one target change from a certified Exercise 004-009 file map per the selection criteria
- Stating the smallest-safe change and its merchant-explainable intent
- Producing the exact proposed diff (original lines to proposed lines) as documentation
- Recording baseline content and hashes of the target file(s) from the archived theme backup
- Comparing the proposed change against that baseline
- Designing and rehearsing the complete rollback path (design only)
- Capturing blast-radius and dependency analysis from certified render-chain knowledge
- Defining the validation checklist a future applied change would require
- Recording all unknowns as Not Yet Proven
- Producing reusable safe-fix and rollback pattern knowledge

## Out of Scope

- Shopify mutation of any kind (live theme, unpublished theme, duplicate theme, settings, content)
- Applying the proposed diff anywhere, including the archived backup or any local theme copy
- Modifying the archived theme backup or any prior-exercise artifact
- Executing rollback (nothing is applied)
- Shopify Admin, CLI, API, or storefront execution
- Live storefront inspection or runtime testing
- Selecting or implementing a change that touches payment, cart-to-checkout, or shared global-shell authority
- Merchant approval claims (controlled training; nothing applied)
- Before evidence capture in this scope mission
- Simulation execution in this scope mission
- After evidence capture, proof package generation, or certification (later governed phases)
- Exercises 004-009 artifacts (immutable)
- Generic `cart-agent-dev` commercial pilot changes
- Abando authority changes
- Payment, fulfillment, commercial proof, or completion truth changes

## Merchant Approval Requirement

No

Reason:

- This is a controlled-training, analysis-only proposal simulation.
- No Shopify mutation or merchant-facing change is authorized.
- Merchant approval becomes required only before a future applied change, which is Not Yet Governed.

## Implementation Permitted

No.

Exercise 010 authorizes repository-backed proposal-only analysis. Any applied change (even to an unpublished theme) is Not Yet Governed and requires a new explicit canonical authority gate in a later mission.

## Required Before Evidence

The next governed artifact is:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_010/before_evidence.md`

Required baseline content:

- Mission ID and Exercise ID
- Merchant and canonical store
- Analysis-only authority and `Payment Required: false`
- Active Exercise 010 scope path
- Archived theme-pull references and theme backup path
- Current source state of the selected target file(s), verbatim, from the archived backup
- Current rendered/visual state where available (existing archived screenshots); live rendered state marked Not Yet Proven
- Content hashes of target files; theme name/ID/version marked Not Yet Proven unless proven
- Target file authority (the certified Exercise 004-009 inventory that proves the file's role)
- Target surface and known dependencies (render-chain callers, blast radius)
- Rollback baseline (recorded original content and hash the rollback restores to)
- Confirmation no Shopify mutation occurred

The baseline must not claim runtime behavior, live configuration, conversion outcomes, merchant outcomes, or theme identity/hashes unless repository truth proves them.

## Simulation Method

The future simulation must:

- Read only the Exercise 010 scope and baseline as active authority.
- Use archived NoKings theme source and certified Exercise 004-009 knowledge.
- Select exactly one change meeting all selection criteria.
- Produce the exact proposed diff, file by file, as documentation only.
- Validate the proposed change against the recorded baseline (confirm original lines exist verbatim).
- Analyze blast radius and confirm the change stays local and isolated from payment/checkout authority.
- Produce the complete rollback design (all six elements).
- State explicitly that the diff was not applied to the archived backup, any local copy, any unpublished theme, or the live theme, and that no rollback was executed.
- Record unknowns as Not Yet Proven.

## Success Criteria

- Exactly one change is selected, meeting all selection criteria, targeting only repository-proven files.
- The proposed diff is exact, minimal, and never applied anywhere.
- The rollback path is fully defined before any approval language.
- Baseline comparison is hash-anchored.
- Payment/checkout boundaries and shared-component blast radius are respected.
- Assumptions are marked Not Yet Proven.
- Exercise 010 scope remains exercise-specific.
- No mission-root payload file is used as active authority.
- No Shopify mutation occurs.
- No payment, completion, Abando, commercial pilot, or prior-exercise truth changes occur.
- The next governed phase becomes Before Evidence.
- The next safe action becomes Capture Before Evidence.

## Rollback Expectation

Shopify rollback required:

- No

Reason:

- This scope authorizes no Shopify mutation.

Repository rollback:

- Restore or remove `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_010/fix_scope.md` through Git history and mission tags.
- Restore the readiness recognition updates (`evaluate_nokings_mission_001_readiness_v1.mjs`, `validate_nokings_mission_001_binding_v1.mjs`, `qa/output/nokings_mission_001_readiness_v1.json`) via Git if this scope is reverted.
- Do not alter Exercises 004-009.
- Do not alter mission-root index/deprecation files.

## Knowledge Capture Requirement

Exercise 010 must produce reusable ShopiFixer knowledge about:

- the smallest-safe change proposal as a reusable safe-fix pattern
- the rollback-design template (recovery point, changed files, original content/hash, reversal, verification, stop conditions)
- the boundary between proposing (documentation authority) and applying (mutation authority requiring a new gate)
- payment/checkout and shared-component exclusions for low-risk changes
- proof that non-application is demonstrated by hash equality, not asserted

## Source Artifacts

- `staffordos/implementation/p11_37_exercise_010_safe_edit_simulation_plan_v1.md`
- `STAFFORDOS_MISSION_001_NOKINGS_TRAINING_V1.md`
- `SHOPIFIXER_ENGINEERING_CURRICULUM_V1.md`
- `SHOPIFIXER_SHOPIFY_ENGINEERING_CANON_V1.md`
- `staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json`
- `staffordos/qa/output/nokings_mission_001_readiness_v1.json`
- `staffordos/implementation/p11_36_mission_001_exercise_009_certification_v1.md`
- `staffordos/implementation/p11_29_mission_001_architecture_checkpoint_v1.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_009/mission_proof_package.md`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/`

## Final Scope Decision

GO.

Repository-backed justification:

- Exercise 010 is canonical in Mission 001 and is the evaluator's declared next planning phase.
- Exercise 009 is certified and Mission 001 remains active.
- The current readiness output identifies Exercise 010 planning as the resolved blocker and the P11.37 plan is committed and tagged.
- The P11.37 planning artifact defines the authority mode, selection criteria, mandatory rollback design, and evidence chain.
- Exercise 010 is analysis-only proposal simulation.
- No Shopify mutation, payment, completion, Abando, commercial pilot, or prior-exercise change is authorized.
