# P11.60 Readiness Determinism Authority Audit

Status:
Complete

Document Type:
Historical Engineering Audit

Preservation Note:
No original committed P11.60 document was found. This document preserves the
historical P11.60 engineering reasoning from repository-backed evidence only.
It does not perform a new repository-wide audit, does not update P11.61 policy,
and does not alter the P11.62 implementation.

## Purpose

Determine the authoritative meaning of the NoKings readiness `generated_at`
field and whether StaffordOS governance requires deterministic readiness
artifacts.

P11.59 and P11.59A were blocked because
`staffordos/qa/output/nokings_mission_001_readiness_v1.json` changed on every
readiness evaluator execution. The repeatedly unstable field was
`generated_at`.

## Background

The blocked containment sequence needed to know whether readiness output churn
was intentional governance metadata or a tooling defect.

The audit question was not whether Mission 001 readiness was correct. The audit
question was whether byte-level readiness output instability caused by
`generated_at` should block deterministic governance validation.

## Authority Trace

The NoKings readiness evaluator writes the readiness output.

Repository source:
`staffordos/qa/evaluate_nokings_mission_001_readiness_v1.mjs`

Relevant authority facts:

- The report schema is `staffordos.nokings_mission_001_readiness.v1`.
- The report includes `generated_at: new Date().toISOString()`.
- The CLI writes the report through `writeJson(outputPath, report)`.
- The default output path is
  `staffordos/qa/output/nokings_mission_001_readiness_v1.json`.

The evaluator also writes the canonical readiness fields that govern Mission 001
state:

- `status`
- `production_operation_permitted`
- `completion_permitted`
- merchant identity
- `active_exercise`
- `current_phase`
- `current_blocker`
- `blocking_reasons`
- `next_safe_action`
- `payment_required`
- scope authority
- gate statuses and reasons
- scores
- evidence source paths
- warnings

## Writer Call Graph

Primary execution path:

```text
node staffordos/qa/evaluate_nokings_mission_001_readiness_v1.mjs
  -> runCli()
  -> evaluateNokingsMissionReadiness(...)
  -> report.generated_at = new Date().toISOString()
  -> writeJson(outputPath, report)
  -> staffordos/qa/output/nokings_mission_001_readiness_v1.json
```

The evaluator imports only Node standard modules:

- `fs`
- `path`
- `crypto`
- `fileURLToPath`

The generated timestamp is not produced by an external helper. It is written in
the readiness evaluator report object itself.

## generated_at Definition

For the NoKings readiness artifact, `generated_at` is evaluator execution-time
metadata.

Repository evidence:

- `staffordos/qa/evaluate_nokings_mission_001_readiness_v1.mjs` writes it with
  `new Date().toISOString()`.
- `staffordos/governance/ceo_truth_explainability_audit/ceo_truth_explainability_audit_v1.md`
  classifies `metadata.generated_at` as builder execution time.
- `STAFFORDOS_MERCHANT_WORKSPACE_ARCHITECTURE_V1.md` says deliverables should
  be timestamped and tied to packet and reservation authority.
- `SHOPIFIXER_COMPETENCY_ENGINE_V1.md` defines `last_demonstrated` as a
  timestamp of the most recent successful demonstration.

The field supports audit and freshness context. Repository evidence did not show
that the NoKings readiness `generated_at` field itself determines readiness
status, blocker, payment authority, completion authority, or next safe action.

## Repository References

The audit identified these repository references as governing or directly
relevant:

- `staffordos/qa/evaluate_nokings_mission_001_readiness_v1.mjs`
- `staffordos/qa/output/nokings_mission_001_readiness_v1.json`
- `staffordos/qa/validate_nokings_mission_001_binding_v1.mjs`
- `staffordos/qa/validate_nokings_exercise_artifact_authority_v1.mjs`
- `staffordos/qa/validate_evidence_manifest_v1.mjs`
- `staffordos/proof_runs/evidence_manifest_v1.mjs`
- `staffordos/governance/runtime_artifact_commit_audit_v1.md`
- `staffordos/governance/ceo_truth_explainability_audit/ceo_truth_explainability_audit_v1.md`
- `STAFFORDOS_MERCHANT_WORKSPACE_ARCHITECTURE_V1.md`
- `SHOPIFIXER_COMPETENCY_ENGINE_V1.md`

Later repository authority that codified or implemented this audit's conclusion:

- `staffordos/governance/READINESS_ARTIFACT_DETERMINISM_POLICY_V1.md`
- `staffordos/qa/validate_nokings_mission_001_binding_v1.mjs`

Those later files are cited as preservation evidence only. They did not exist as
P11.60 authority at the time of the historical audit.

## Dependency Graph

### Readiness Writer Dependency

```text
evaluate_nokings_mission_001_readiness_v1.mjs
  -> writes nokings_mission_001_readiness_v1.json
```

### Readiness Validator Dependency

```text
validate_nokings_mission_001_binding_v1.mjs
  -> imports evaluateNokingsMissionReadiness
  -> verifies status, active exercise, phase, blocker, next action, payment,
     completion, and gate authority
```

### Exercise Artifact Validator Dependency

```text
validate_nokings_exercise_artifact_authority_v1.mjs
  -> imports evaluateNokingsMissionReadiness
  -> exercises fixture readiness states
```

### Runtime Metadata Precedent

```text
validate_evidence_manifest_v1.mjs
  -> normalizes Generated At and Manifest Generated At lines
  -> asserts proof package deterministic except generated_at
```

No active Mission 001 readiness dependency was found that made the top-level
NoKings readiness `generated_at` field a governance decision field.

## Governance References

Repository governance contained two relevant ideas before P11.61:

1. Runtime outputs and generated read models can change during normal command
   center execution.

   Source:
   `staffordos/governance/runtime_artifact_commit_audit_v1.md`

2. Timestamp metadata is legitimate audit metadata.

   Sources:
   `staffordos/governance/ceo_truth_explainability_audit/ceo_truth_explainability_audit_v1.md`,
   `STAFFORDOS_MERCHANT_WORKSPACE_ARCHITECTURE_V1.md`,
   and `SHOPIFIXER_COMPETENCY_ENGINE_V1.md`

The repository also had an implementation precedent for normalization:

`staffordos/qa/validate_evidence_manifest_v1.mjs` normalizes generated timestamp
lines before checking proof-package determinism.

What the repository lacked before P11.61 was an explicit readiness-specific
governance rule that distinguished semantic readiness authority from volatile
execution metadata.

## Determinism Analysis

The NoKings readiness output can be unstable byte-for-byte while remaining
semantically stable.

Reason:

- `generated_at` changes every evaluator run because it is based on current
  execution time.
- The readiness decision fields are separate from that timestamp.
- Mission 001 readiness authority is represented by status, phase, blocker,
  next safe action, payment and completion booleans, merchant identity, scope
  authority, evidence paths, and gates.

Removing `generated_at` would not be required to preserve readiness semantics,
but removal could discard useful operational metadata.

Hard-coding `generated_at` would make the file byte-stable but would falsify the
meaning of a generation timestamp.

Normalizing only the operational timestamp during equality checks preserves both
facts:

- readiness output can continue recording when it was generated;
- deterministic validation can continue comparing canonical readiness authority
  strictly.

## Root Cause Classification

Root Cause:
B - Governance Documentation Gap

The issue was not that `generated_at` was accidentally written. Repository
evidence shows timestamp metadata is intentionally used across StaffordOS.

The issue was not that readiness authority was inherently non-deterministic. The
canonical readiness fields are derived from repository inputs and can be
compared strictly.

The gap was that StaffordOS did not yet define how readiness validators should
compare artifacts that contain evaluator execution-time metadata.

## Remediation Options Considered

### Option 1 - Define Semantic Readiness Determinism

Define readiness determinism as semantic equality of canonical authority fields,
with normalization of operational `generated_at`.

Benefits:

- Preserves timestamp metadata.
- Keeps canonical fields strict.
- Matches existing evidence-manifest normalization precedent.
- Avoids evaluator mutation.

Risks:

- Requires validator discipline to avoid broad field exclusion.

Priority:
Highest.

### Option 2 - Remove generated_at From Readiness Outputs

Benefits:

- Makes readiness output easier to compare byte-for-byte.

Risks:

- Removes operational metadata already used broadly in StaffordOS patterns.
- Requires writer behavior change.
- Does not align with timestamped evidence precedent.

Priority:
Low.

### Option 3 - Hard-Code Or Override generated_at In Validator Runs

Benefits:

- Produces byte-stable output during tests.

Risks:

- Changes meaning of generation metadata.
- Can create false timestamps unless separately governed.

Priority:
Medium-low.

### Option 4 - Split Canonical Readiness From Runtime Metadata

Benefits:

- Clean separation between decision state and generation metadata.

Risks:

- Larger migration.
- More artifacts and reader changes.

Priority:
Medium for future architecture, not immediate containment.

### Option 5 - Continue Full-File Checksum Comparison

Benefits:

- Simple to implement.

Risks:

- Fails every run when `generated_at` changes.
- Blocks runtime evidence containment even when canonical readiness authority is
  unchanged.

Priority:
Rejected.

## Reason P11.61 Was Required

P11.61 was required because implementation could not safely choose normalization
rules without governance authority.

Before P11.61, repository evidence showed that `generated_at` was operational
metadata and that evidence-manifest validation normalized timestamps, but no
readiness-specific doctrine stated:

- what fields are canonical readiness authority;
- what fields are informational metadata;
- when semantic equality is allowed;
- when byte equality remains required;
- how future validators should normalize operational metadata.

P11.61 supplied that missing governance definition.

## Historical Conclusion

The P11.60 audit concluded:

- `generated_at` in the NoKings readiness artifact is operational metadata.
- Readiness authority is semantic, not the volatile timestamp byte value.
- Canonical readiness fields must continue to be compared strictly.
- Evidence-manifest validation already provided a repository precedent for
  timestamp normalization.
- StaffordOS lacked explicit readiness determinism doctrine.
- The proper next mission was a governance definition mission, later executed as
  P11.61.

## Non-Goals

This audit did not:

- modify validators;
- modify readiness evaluators;
- modify runtime outputs;
- commit P11.59 runtime files;
- execute containment waves;
- modify Mission 002;
- define implementation code;
- change Mission 001 readiness state;
- change competency score.

## Authority Statement

This document preserves the historical P11.60 authority audit that led to the
P11.61 readiness artifact determinism policy and the P11.62 semantic
determinism validator alignment.

It authorizes no implementation by itself. Its authority is historical:
StaffordOS needed explicit readiness determinism governance because
execution-time `generated_at` metadata made byte-level readiness output
comparison unstable while leaving semantic readiness authority unchanged.
