# P11.46 Mission 001 Doctrine Governance And Gate Amendment

Status:
Complete

Document Type:
Governed doctrine mission record (brings the Mission 001 doctrine layer under repository governance and amends the Mission 001 completion gate on committed repository evidence). Documentation-only; no engineering, no Shopify change, no evaluator/readiness/validator change.

## 1. Mission Identity

- Mission ID: `mission_001`
- Mission: Mission 001 - NoKings Shopify Engineering Training
- Governance mission: P11.46 — Doctrine Governance And Gate Amendment
- Authorizing governance decision: P11.45 — Mission 001 Governance Decision (determined the doctrine layer was ungoverned and the count-based gate miscalibrated)
- Preceding committed authority: P11.44 gate assessment (`staffordos/implementation/p11_44_mission_001_readiness_gate_assessment_v1.md`, committed `c817183c`, current HEAD)

## 2. Doctrine Governance Action

Before this mission, the doctrine layer was not under repository governance. Verified repository status at mission start (all UNTRACKED — no commit history, no tags):

- `STAFFORDOS_MISSION_001_NOKINGS_TRAINING_V1.md` (Mission 001 charter — carries the completion gate)
- `SHOPIFIXER_ENGINEERING_CURRICULUM_V1.md` (engineering curriculum)
- `SHOPIFIXER_SHOPIFY_ENGINEERING_CANON_V1.md` (engineering canon)

Every artifact *derived from* these documents (Exercise 004–010 certifications, architecture checkpoint `p11_29`, gate assessment `p11_44`) was already committed and tagged. The premises were ungoverned while the conclusions were governed.

This mission brings the three doctrine documents under repository governance by committing them (in the P11.46 commit). Content is preserved as authored; only the charter's §6 and §7 are amended (below). The curriculum and canon are committed without content edits — no documented contradiction requires editing them, and competency work is explicitly out of scope. No git history is rewritten; authorship of the doctrine content is preserved.

## 3. Amendment 1 — Readiness Gate (§7)

### Original gate wording (verbatim, preserved)

```
## 7. Readiness Gate

Mission 001 is successful when all of the following are true:

- NoKings theme inventory is complete
- the key files for homepage, product, collection, cart, header, footer, trust, and mobile behavior are identified
- at least 10 exercises have been completed
- at least 3 exercises included a safe proposed fix pattern
- at least 3 exercises included a rollback rehearsal or explicit rollback plan
- before/after evidence exists for every applied change
- lessons are recorded in StaffordOS
- reusable patterns are promoted into the ShopiFixer playbook
```

### Exact amended wording

The two count-based criteria —

- `at least 3 exercises included a safe proposed fix pattern`
- `at least 3 exercises included a rollback rehearsal or explicit rollback plan`

are replaced by three capability-class criteria:

- `at least one mechanically actionable safe-fix proposal has been produced (capability class: proposal)`
- `at least one governed applied-and-validated storefront change has been performed (capability class: applied change)`
- `at least one executed rollback rehearsal has restored a baseline and been verified (capability class: rollback)`

All six remaining criteria are retained unchanged. A rollback *plan* alone no longer satisfies the gate; the rollback criterion requires an executed, verified rehearsal.

### Repository evidence supporting the amendment

- **`p11_44` (committed gate assessment):** demonstrates arithmetically that the recommended next mission — one governed applied change — leaves the count gate at 2 of 3 on both count criteria, i.e. the gate is unsatisfiable by its own recommended remediation and would force additional filler proposal exercises.
- **`p11_43` (committed Exercise 010 certification):** defines what Mission 001 still lacks as capability classes — "a governed applied change, real changed-state before/after evidence, an executed Shopify rollback rehearsal" — not additional proposal counts.
- **`p11_29` (committed architecture checkpoint) §9:** paraphrases the gate as requiring "rollback rehearsals," dropping the original "or explicit rollback plan" disjunction — committed authority already read the stronger, execution-based standard as intended (see Amendment resolves C4, below).
- **`staffordos/shopifixer/shopifixer_commercial_definition_v1.md` (committed):** requires customer-facing fixes to be "rollback-protected, proven" with before/after evidence — the applied-and-validated class, not the proposal class.
- **`SHOPIFIXER_ENGINEERING_CURRICULUM_V1.md` §4/§5 (governed by this mission):** competency advances only when a mission "captures before/after evidence and validation" (§4 rule 2) and rollback readiness increases only when "a rollback rehearsal that succeeds" is recorded (§4 rule 3); supervised-fix readiness (§5) requires "at least one controlled change has been applied and validated" and a demonstrated rollback rehearsal. Additional proposal exercises trigger none of these — by the curriculum's own mechanics they are competency-neutral.

### Rationale

The count-based gate measured process throughput (repetition of one simulated skill) rather than capability breadth. It was simultaneously too weak — satisfiable by three proposals plus three plans with zero storefront mutations ever performed, certifying a fix capability never once exercised — and too demanding of low-value work, forcing two filler proposal exercises after the genuinely valuable applied-change mission. The capability-class gate is strictly stronger where it matters: it requires an actual applied, validated, reversible change and an executed rollback, which the count gate never required.

## 4. Amendment 2 — Evidence Requirements (§6)

### Original wording (verbatim, preserved)

```
Every training exercise must capture:

- before screenshot
- after screenshot
- files inspected
- files changed
- validation result
- rollback path
- lesson learned

If an exercise does not change code, the evidence set should still capture:

- before screenshot
- inspected files
- validation result
- lesson learned
```

### Amended wording

The universal "before screenshot / after screenshot" requirement is made conditional: before/after screenshots of the affected rendered surface are required when a rendered or live storefront surface is in scope and capture is authorized; otherwise an explicit recorded screenshot waiver must state why no rendered capture applies (for example, source-only analysis against archived theme source). For a governed applied change, before/after screenshots are mandatory and may not be waived. (Full amended text is in the charter §6.)

### Repository evidence and rationale

Exercises 004–010 are source-only analysis/simulation against archived theme source; their before-evidence files uniformly record "Screenshot: Not Captured — no new customer-facing screenshot was authorized for this source baseline." Seven certifications passed while the former universal screenshot requirement went unmet and unwaived — a standing contradiction between the charter and conforming practice. The amendment makes those exercises' recorded rationale a conforming explicit waiver, while keeping screenshots mandatory for applied changes (where before/after visual proof is the core deliverable).

## 5. Contradictions Resolved (scope-limited)

Only contradictions tied to the completion gate and its evidence requirements are resolved here (per the mission's "only those contradictions; no unrelated edits"):

- **C1 (screenshot requirement vs. source-only practice):** resolved by Amendment 2 (§6).
- **C4 (charter "rehearsal or plan" vs. checkpoint "rehearsals"):** resolved by Amendment 1 (§7) — the rollback criterion now requires an executed, verified rehearsal, matching `p11_29` §9 and the canon's reversion-validation doctrine.

Explicitly NOT changed in this mission (recorded for the follow-on record, not resolved here):

- **C2 (playbook-pattern promotion provenance for gate condition #8):** gate condition #8 remains as written and factually satisfied (three playbook patterns exist). The provenance nuance — that the promoted patterns predate the Exercise 004–010 evidence chain while Exercise 010's evidenced pattern remains "proposal-tested only" — is a pattern-library-tier question, not a gate-wording defect, and is out of scope for this doctrine mission.
- **C3 (stale competency record `competency_engine_sync_v1.json`):** a data-file/competency-engine concern; explicitly out of scope ("no competency redesign"). Left for a separate governed data-refresh mission.

## 6. Historical Compatibility

- No git history is rewritten. The doctrine files enter governance at their authored content; the original §6/§7 wording is preserved verbatim in this record.
- Historical artifacts are unchanged: Exercises 004–010 evidence chains, certifications (`p10_9`, `p11_7`, `p11_14`, `p11_21`, `p11_28`, `p11_36`, `p11_43`), the architecture checkpoint (`p11_29`), and the gate assessment (`p11_44`) are not modified.
- `p11_44` remains valid as an assessment of the gate as it then stood; only its recommended next action is superseded by the amended gate (the applied-change mission can now complete Mission 001 rather than leaving it at 2 of 3).

## 7. Certification Preservation Statement

All Exercise 004–010 certifications remain fully valid and are not re-scored. Each certification was issued against exercise-level objectives (charter §5), not against gate satisfaction, and each explicitly disclaimed Mission 001 completion. The gate amendment changes the mission-completion standard going forward; it does not retroactively alter any exercise's certified outcome. No re-certification is required or performed.

## 8. Deferred Follow-On (not performed here)

This mission does not touch the readiness evaluator, the binding validator, or the readiness output (per mission constraints: no evaluator redesign, no readiness update, no binding-validator update). Consequently, until a follow-on readiness-alignment mission runs, the evaluator continues to emit the pre-amendment count-based blocker string (`Mission 001 Gate Unmet: Safe-Fix Pattern Exercises 1 Of 3`). Recommended follow-on: **P11.47 — Readiness Alignment**, updating the evaluator/validator to express the amended capability-class gate (blocker: missing applied-change and executed-rollback classes; next safe action: authorize the governed applied change). Then **P11.48 — Governed Applied-Change Mission**, which under the amended gate can complete Mission 001.

## 9. Governance Summary

- Doctrine layer (charter, curriculum, canon) prepared to enter repository governance via the P11.46 commit.
- Charter §7 amended from count-based to capability-class completion criteria.
- Charter §6 amended to make screenshots conditional with explicit waivers, mandatory for applied changes.
- Contradictions C1 and C4 resolved; C2 and C3 recorded as out-of-scope with named follow-ups.
- All historical artifacts and certifications preserved unchanged.
- No engineering, evaluator, readiness, or validator changes performed.
