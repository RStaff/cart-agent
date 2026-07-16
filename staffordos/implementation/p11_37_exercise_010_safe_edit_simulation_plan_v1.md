# P11.37 Exercise 010 Safe Edit Simulation Plan

Status:
Complete

Document Type:
Exercise planning artifact (read-only, documentation-only)

## Mission And Exercise Identity

- Mission ID: `mission_001`
- Mission: Mission 001 - NoKings Shopify Engineering Training
- Exercise ID: `ex_010_safe_edit_simulation`
- Exercise: Exercise 010 - Safe Edit Simulation
- Product: ShopiFixer
- Environment type: `controlled_training`
- Payment required: `false`

## Merchant And Canonical Store

- Merchant: NoKings Athletics
- Canonical store: `no-kings-athletics.myshopify.com`
- Storefront URL: `https://no-kings-athletics.myshopify.com`
- Shopify admin identity: `no-kings-athletics-dev.myshopify.com`
- Proof run: `mission_001_nokings_shopifixer_v1`

## Precondition Verification

Verified before this plan was created:

- Exercise 009 certification exists: `staffordos/implementation/p11_36_mission_001_exercise_009_certification_v1.md`
- Tag exists: `p11.36-nokings-exercise-009-certification`
- Readiness (`staffordos/qa/output/nokings_mission_001_readiness_v1.json`) reports exactly: `CONDITIONAL_GO` | phase `exercise_010_planning` | blocker `Exercise 010 Planning Missing` | next `Plan Exercise 010 - Safe Edit Simulation` | `payment_required: false` | `completion_permitted: false`
- Exercises 004-009 certifications exist, are committed, and are unmodified in the working tree:
  - `p10_9_mission_001_exercise_004_certification_v1.md`
  - `p11_7_mission_001_exercise_005_certification_v1.md`
  - `p11_14_mission_001_exercise_006_certification_v1.md`
  - `p11_21_mission_001_exercise_007_certification_v1.md`
  - `p11_28_mission_001_exercise_008_certification_v1.md`
  - `p11_36_mission_001_exercise_009_certification_v1.md`

## Canonical Objective

From `STAFFORDOS_MISSION_001_NOKINGS_TRAINING_V1.md`, Exercise 010:

- Objective: practice proposing a smallest-safe change **without applying it**.
- Shopify area: any low-risk theme area from prior exercises
- Likely files involved: depends on the selected prior file map
- Risk level: medium
- Validation required: compare proposed change against baseline
- Rollback requirement: yes — the revert path must be defined before approval
- Expected lesson: safe edits begin with a precise file map and rollback plan

Curriculum grounding (`SHOPIFIXER_ENGINEERING_CURRICULUM_V1.md`, Module 6 - Safe Editing, Validation, and Rollback): "propose a safe change without applying it" is a Module 6 practical exercise; graduation requires producing a valid rollback plan **before** editing and validating without guesswork.

## Authority Classification

**analysis-only simulation.**

Repository-backed basis:

- The canonical mission record defines the objective as proposing a change "without applying it."
- The Exercise 009 certification (`p11_36`) fixes the forward authority mode: "analysis-only proposal unless later canonical doctrine explicitly authorizes implementation." No later canonical doctrine authorizes implementation.
- No curriculum, canon, binding, or checkpoint artifact grants Exercise 010 mutation authority. The architecture checkpoint (`p11_29`) lists "Merchant-approved production mutation" as Not Yet Proven.
- Therefore Exercise 010 is **not** reversible implementation-capable and **not** mutation-capable-after-gate. Implementation of any kind remains **Not Yet Governed** and would require a new, explicit canonical authority gate in a later mission.

No Shopify mutation, theme edit (published or unpublished), admin/CLI/API execution, or live-theme publication is authorized by Exercise 010.

## Definition Of Safe Edit Simulation

Exercise 010's "simulation" means rehearsing the full safe-edit discipline on paper against proven source, applying nothing. The operations distinguish as follows:

| Operation | In Exercise 010? |
|---|---|
| Proposing a change (smallest-safe change statement) | **Yes** — core objective |
| Identifying exact files (from certified 004-009 file maps) | **Yes** — required |
| Producing a proposed patch/diff as a documentation artifact | **Yes** — inside the exercise proof directory only |
| Modifying a local repository copy of the theme | **No** — the archived theme backup is immutable evidence; the proposed diff is recorded as text, never applied to it |
| Modifying an unpublished Shopify theme | **No** — Shopify mutation, not simulation |
| Publishing to the live theme | **No** — prohibited |
| Executing rollback | **No** — nothing is applied, so nothing is reverted |
| Rehearsing rollback without mutation | **Yes** — mandatory: the revert path is fully designed and verified against the baseline before any future approval |

The simulation is complete when a reviewer could apply the proposed change and its rollback mechanically from the artifacts alone — without the change ever having been applied.

## In-Scope Operations

- Selecting the target surface and file(s) from the certified Exercise 004-009 inventories (selection happens in the governed scope phase, not in this plan)
- Stating the smallest-safe change and its intent in merchant-explainable terms
- Producing the exact proposed diff (original lines → proposed lines) as documentation
- Recording baseline content and hashes of the target file(s) from the archived theme backup (`staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/`)
- Comparing the proposed change against that baseline (the canonical validation requirement)
- Designing and rehearsing the complete rollback path per the canon's rollback-strategy-by-file-type (`SHOPIFIXER_SHOPIFY_ENGINEERING_CANON_V1.md` §6)
- Capturing blast-radius/dependency analysis from certified render-chain knowledge
- Defining the validation checklist a future applied change would require (canon §7 layers: baseline, functional, responsive, conversion, reversion, evidence)
- Recording all unknowns as Not Yet Proven
- Producing reusable safe-fix and rollback pattern knowledge

## Out-Of-Scope Operations

- Shopify mutation of any kind (live theme, unpublished theme, duplicate theme, settings, content)
- Modifying the archived theme backup or any prior-exercise artifact
- Shopify Admin, CLI, API, or storefront execution
- Live Shopify inspection or runtime testing
- Applying the proposed diff anywhere
- Executing rollback (nothing to roll back)
- Payment, fulfillment, commercial proof, completion truth, pricing, or marketing changes
- Scope creation, evidence capture, simulation execution, proof package, or certification (later governed phases)
- Exercises 004-009 artifacts (immutable)
- Abando authority and generic `cart-agent-dev` commercial pilot artifacts
- Readiness or validator modification

## Candidate Change-Selection Criteria

The actual intervention is **not** chosen in this plan; canonical doctrine assigns selection to the governed scope phase ("likely files involved: depends on the selected prior file map"). The scope mission must select one change that is:

1. **Repository-backed** — target file and current content proven in the archived theme backup and certified in an Exercise 004-009 inventory
2. **Small and visible** — a text, label, spacing, or single-block change observable on a rendered page (canon Pattern 6: no broad refactors)
3. **Easy to explain** — one sentence a merchant would understand
4. **Reversible** — single-file, content-level change with exact original content recorded (canon Pattern 7: theme-editor model left intact)
5. **Observable before and after** — a rendered/visual delta would exist if applied (archived before screenshots exist for the homepage)
6. **Isolated from payment and checkout authority** — no cart-to-checkout, payment-icon-meaning, or checkout files (Exercise 006/008 certified boundaries)
7. **Local, not shared** — avoids shared snippets and global-shell files where blast radius is high (canon Patterns 4-5; header/footer group JSON carries auto-generated drift risk per Exercises 007/009)
8. **Pattern-productive** — generalizes into a reusable ShopiFixer safe-fix pattern

Candidate surfaces satisfying these criteria exist in every certified inventory (homepage text/hero blocks from Exercises 001-003 reports, product-page text elements from Exercise 004, collection presentation from Exercise 005, footer text blocks from Exercise 009). Low-risk homepage-area text blocks are the strongest candidates by criteria 2, 5, and 7, but the selection decision belongs to the scope mission.

## Required Approval Gates

| Gate | Approval required? | Basis |
|---|---|---|
| Scope approval | **Yes** — governed scope mission creating `fix_scope.md` plus evaluator recognition, following the Exercise 009 pattern | Readiness progression proven for Exercises 005-009 |
| Merchant approval | **Not required for the proposal-only simulation** (controlled training, nothing applied). **Required before any future applied change** | Mission binding: `controlled_training`; canon requires merchant-safe authority boundaries |
| Local patch generation (proposed diff as documentation) | Authorized by the approved Exercise 010 scope; no separate gate | Documentation artifact, not a mutation |
| Unpublished-theme mutation | **Not authorized by Exercise 010 at all** — requires a new explicit canonical authority gate in a later mission | Canonical objective: "without applying it" |
| Live-theme publication | **Not authorized** — same new-gate requirement plus merchant approval | Not Yet Governed |
| Rollback execution | **Not applicable** — nothing applied; rollback is rehearsed as design only | Canonical rollback requirement is a defined revert path, not an executed revert |
| Certification | **Yes** — separate governed certification mission after the proof package | Certification pattern proven for Exercises 004-009 |

## Required Rollback Path

Exercise 010 must include a mandatory rollback design even though nothing is applied. Required artifacts and evidence:

- **Baseline recovery point** — the archived theme backup path for each target file, plus the Git commit/tag anchoring the exercise baseline
- **Exact changed files** — the complete list of files the proposed change would touch (expected: one)
- **Original content and hash** — verbatim original lines and a content hash (e.g., SHA-256) of each target file captured at before-evidence time
- **Reversal process** — the exact restore step (restore recorded original content to the target file; classified per canon §6 rollback-by-file-type for the chosen file class)
- **Rollback verification** — the check proving restoration: restored content hash equals baseline hash; plus the canon §7 reversion-validation checklist a future applied rollback would run
- **Stop conditions** — the rollback design's own abort criteria (baseline hash mismatch, missing backup, unexpected file state)

For this simulation, the repository-level rollback is also defined: each Exercise 010 lifecycle artifact is individually restorable via Git history and mission tags, and this plan itself rolls back by deleting `staffordos/implementation/p11_37_exercise_010_safe_edit_simulation_plan_v1.md`.

## Before-Evidence Requirements

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_010/before_evidence.md` must capture:

- Mission ID, Exercise ID, merchant, canonical store, analysis-only authority, `Payment Required: false`
- Active Exercise 010 scope path
- **Current source state** — verbatim current content of the selected target file(s) from the archived theme backup, with paths
- **Current rendered/visual state where available** — references to existing archived screenshots (`staffordos/audits/no_kings/evidence/before/`); live rendered state marked Not Yet Proven unless newly proven
- **Theme identity and hashes** — content hashes of target files computed from the archived backup; theme name/ID/version marked Not Yet Proven (per the `p11_29` checkpoint) unless proven
- **Target file authority** — the certified Exercise 004-009 inventory that proves the target file's role
- **Target surface** — the page/section/block the change would affect
- **Known dependencies** — render-chain callers and blast radius from certified knowledge
- **Rollback baseline** — the recorded original content and hash that the rollback design restores to
- Confirmation no Shopify mutation occurred
- No claims of runtime behavior, live configuration, conversion, or merchant outcomes

## Simulation / Execution Method

`.../exercise_010/execution_notes.md` must prove, without overstating authority:

- The smallest-safe change statement and its merchant-explainable rationale
- The exact proposed diff: original lines → proposed lines, file by file
- Baseline comparison: the proposed change validated against the recorded baseline (the canonical validation requirement) — confirming the original lines exist verbatim at the recorded location
- Blast-radius analysis: what renders the target file, what else could be affected, why the change stays local
- The complete rollback design (all six elements above)
- The validation checklist a future applied change would require (desktop/mobile, functional, conversion surfaces per canon §7)
- Explicit statements: the diff was **not** applied to the archived backup, any local theme copy, any unpublished theme, or the live theme; no rollback was executed because nothing was changed
- All unknowns marked Not Yet Proven

## After-Evidence Requirements

`.../exercise_010/after_evidence.md` must confirm:

- Safe Edit Simulation completed as repository-backed analysis
- A smallest-safe change was proposed and compared against baseline (canonical validation satisfied)
- The revert path was fully defined before any approval (canonical rollback requirement satisfied)
- The expected lesson is captured: safe edits begin with a precise file map and rollback plan
- Target source files remain byte-identical to baseline (hash re-verification — the "after" state equals the "before" state, which is the proof of non-application)
- No Shopify mutation occurred
- No storefront, conversion, merchant-outcome, payment, or completion claims

## Proof-Package Requirements

`.../exercise_010/mission_proof_package.md` must:

- Use only the five Exercise 010 exercise-specific authority artifacts
- Carry `Status: Assembled`, canonical store, and exercise identity fields recognized by the readiness evaluator
- Summarize scope, baseline, proposed change, rollback design, and after evidence
- Present the proposed diff, the rollback design, the blast-radius analysis, the safe-fix pattern candidate, risks, unknowns, and a next-phase recommendation
- Exclude all unsupported claims (applied change, live behavior, runtime validation, conversion impact, payment, certification, mission completion)

## Certification Requirements

The Exercise 010 certification memo (expected `staffordos/implementation/p11_4X_mission_001_exercise_010_certification_v1.md`) must follow the certified Exercise 005-009 pattern:

- Identity block (mission, exercise, merchant, canonical store, product, environment, authority, payment)
- Evidence Chain Verification section
- A "Safe Edit Simulation Certified" findings section
- Repository Truth Reviewed section
- Unsupported Claims Explicitly Excluded section
- Mutation And Rollback Assessment section (must state: no mutation occurred; rollback was designed and rehearsed, not executed)
- Readiness Assessment section
- Next Canonical Phase section (see Recommended Next Governed Mission — the mission record defines no Exercise 011, so the next phase is Mission 001 gate assessment)
- Certification decision (`GO` / `CONDITIONAL GO`) and "No Shopify mutation occurred" confirmation

A minimal evaluator/validator recognition update for Exercise 010 phases will be required at the scope, proof, and certification missions (the evaluator currently defines exercises through 009); those changes belong to the later missions, not to this plan.

## Success Criteria

- The Exercise 010 scope, when created, selects exactly one change meeting all eight selection criteria, targeting only repository-proven files from certified inventories.
- The proposed diff is exact, minimal, and never applied anywhere.
- The rollback path is fully defined **before** any approval language appears in the chain (the canonical rollback requirement).
- Baseline comparison is hash-anchored, and after-evidence proves target files unchanged.
- Payment/checkout authority boundaries and shared-component blast radius are respected.
- All unknowns (theme identity, live state, runtime behavior) remain explicit at every phase.
- No mission-root payload file is used as active authority.
- No Shopify mutation occurs; no payment, completion, Abando, commercial pilot, or prior-exercise truth changes occur.
- The exercise produces a promotable safe-fix pattern and rollback pattern.

## Stop Conditions

Any of the following stops Exercise 010 immediately with the failure recorded:

- **Wrong store** — any artifact or tool context references a store other than `no-kings-athletics.myshopify.com` / admin identity `no-kings-athletics-dev.myshopify.com`
- **Wrong theme** — target-file content does not match the archived `dev_horizon_150895657158` backup baseline
- **Missing backup** — the archived theme backup or the target file's baseline content/hash is unavailable
- **Unproven target authority** — the selected file is not proven by a certified Exercise 004-009 inventory (or the Exercise 001-003 reports)
- **Unexpected dependency** — blast-radius analysis reveals shared-snippet, global-shell, or checkout coupling that breaks the selection criteria
- **Validator failure** — readiness evaluator or binding validators fail or regress at any phase
- **Unrelated working-tree changes** — the exercise's governed step touches any file outside its declared artifact set
- **Live-publication risk** — any step would require or trigger a Shopify write, theme upload, or publication
- **Inability to prove rollback** — original content/hash cannot be recorded, or the reversal process cannot be stated exactly

## Knowledge-Capture Requirements

Exercise 010 must produce or strengthen:

- **One safe-fix pattern** — "smallest-safe change proposal" as a reusable ShopiFixer pattern (candidate pattern-library entry following `SHOPIFIXER_PATTERN_LIBRARY_0001_HOMEPAGE_ARCHITECTURE`), covering change statement, exact diff, baseline anchor, and validation checklist
- **One rollback pattern** — the canonical rollback-design template (recovery point, changed files, original content/hash, reversal process, verification, stop conditions) instantiated for the chosen file type per canon §6
- **One reusable intervention boundary** — the explicit line between proposing (documentation authority) and applying (mutation authority requiring a new gate), including the payment/checkout and shared-component exclusions
- **Explicit lessons for future merchant work** — recorded in StaffordOS: safe edits begin with a precise file map and rollback plan; proposal artifacts must be mechanically applicable by a reviewer; non-application is proven by hash equality, not asserted

Per the curriculum's progress rules, a successful Exercise 010 advances safe-edit-planning competency (a documented rollback plan and baseline-compared proposal); it does **not** satisfy the "controlled change applied and validated" criterion for supervised-fix readiness.

## Expected Artifact Structure

Recommended authority directory:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_010/`

Expected lifecycle artifacts (to be created only in their own governed phases — none created by this plan):

1. `fix_scope.md`
2. `before_evidence.md`
3. `execution_notes.md`
4. `after_evidence.md`
5. `mission_proof_package.md`

## Expected Readiness Transitions

| After governed step | Phase | Blocker | Next safe action |
|---|---|---|---|
| This plan (no readiness change) | `exercise_010_planning` | `Exercise 010 Planning Missing` | Plan Exercise 010 - Safe Edit Simulation |
| Scope created + evaluator recognition | `before_evidence` | `Before Evidence Missing` | Capture Before Evidence |
| Baseline captured | `safe_edit_simulation` | `Safe Edit Simulation Not Performed` | Perform governed proposal-only simulation |
| Simulation complete | `after_evidence` | `After Evidence Missing` | Capture After Evidence |
| After evidence complete | `proof_package` | `Proof Package Missing` | Generate Exercise 010 Mission Proof Package |
| Proof package assembled | `mission_certification` | `Mission Certification Missing` | Certify Exercise 010 |
| Certification recognized | mission-gate assessment (exact phase naming to be set by the certification mission; no Exercise 011 exists in the mission record) | Mission 001 gate criteria unmet | Assess Mission 001 readiness gate |

Status remains `CONDITIONAL_GO`, payment `false`, completion `false` throughout. Exercise 010 phase definitions are added to the evaluator in the scope mission, mirroring the Exercise 009 pattern.

## Commercial Launch Boundary

Exercise 010 alone **cannot** satisfy the Mission 001 commercial-readiness requirement. Against the four commercial-readiness elements:

- **A governed applied change** — Not satisfied. Exercise 010 applies nothing by canonical definition. No Mission 001 exercise currently holds implementation authority; an applied change requires a new explicit canonical gate.
- **Real before/after evidence** — Partially exercised. Exercise 010 produces before/after evidence of *non-application* (hash-equal source states). The commercial definition (`staffordos/shopifixer/shopifixer_commercial_definition_v1.md`) requires before/after evidence of an *applied, rollback-protected* fix, which Exercise 010 does not produce.
- **Rollback rehearsal** — Partially satisfied. Exercise 010 delivers a complete rollback *design* rehearsed on paper; the curriculum's supervised-fix readiness requires a *demonstrated* rollback rehearsal against a real change.
- **Safe-fix pattern promotion** — Satisfiable. Exercise 010 can promote its first safe-fix and rollback patterns into the ShopiFixer pattern library.

Mission 001 gate arithmetic after Exercise 010 (per the mission record §7): exercise count reaches 10 (Exercises 001-003 as analysis reports + 004-010); safe-proposed-fix-pattern exercises reach 1 of the required 3; rollback-plan exercises reach 1 of the required 3; "before/after evidence for every applied change" is vacuously satisfied (no applied change exists).

## Remaining Bounded Work After Exercise 010

Bounded, without an endless roadmap:

1. **Two additional proposed-fix exercises with rollback plans** (on different certified surfaces) to reach the mission gate's ≥3 safe-fix-pattern and ≥3 rollback-plan counts — these can reuse the Exercise 010 template and require no new authority.
2. **One explicitly-gated applied-change mission** — a new canonical authority decision (scope + merchant-approval + mutation gate + executed rollback rehearsal) to produce the governed applied change with real before/after evidence that commercial readiness requires. This gate does not exist today and must be created deliberately, not inferred.
3. **Mission 001 gate assessment and mission-level certification** once the gate criteria are met.

## Recommended Next Governed Mission

**P11.38 — Establish Exercise 010 governed scope**, creating:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_010/fix_scope.md`

selecting the single smallest-safe change per the eight selection criteria, together with the minimal evaluator/binding-validator recognition for Exercise 010 (definition entry and state-sensitive assertions), following the exact pattern proven for Exercise 009.

## Planning Decision

**GO** for establishing Exercise 010 scope.

Repository-backed justification:

- All preconditions verified (Exercise 009 certified and tagged, readiness exactly at `exercise_010_planning`, Exercises 004-009 certifications intact).
- Exercise 010 is canonical in Mission 001 and is the evaluator's declared next planning phase.
- The authority mode is unambiguous from repository truth: analysis-only simulation, proposal without application, mandatory rollback design before approval.
- Certified Exercise 001-009 knowledge provides proven candidate surfaces and file maps; the archived theme backup provides the baseline.
- The exercise requires no Shopify mutation, no payment, and no new authority.
- No payment, completion, Abando, commercial pilot, or prior-exercise truth is affected.
