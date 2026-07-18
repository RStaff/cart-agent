# Readiness Artifact Determinism Policy v1

Status:
Governed policy

Policy scope:
StaffordOS readiness artifacts, readiness evaluator outputs, and validators that
compare readiness artifacts for governance stability.

## Purpose

This policy defines how StaffordOS treats deterministic readiness artifacts when
those artifacts contain operational metadata such as `generated_at`.

The policy exists to preserve governance integrity while allowing readiness
evaluators to record when an artifact was generated.

## Problem Statement

The NoKings Mission 001 readiness evaluator writes
`staffordos/qa/output/nokings_mission_001_readiness_v1.json`.

That artifact includes a top-level `generated_at` field written from the
evaluator execution time:

- `staffordos/qa/evaluate_nokings_mission_001_readiness_v1.mjs` writes
  `generated_at: new Date().toISOString()`.

Because this value changes on every evaluator execution, byte-for-byte
comparison of the whole JSON file cannot be stable across runs unless the
timestamp is normalized or generated deterministically.

Before this policy, StaffordOS did not define whether readiness artifacts must
be byte-deterministic including operational timestamps, or semantically
deterministic after operational metadata normalization.

## Repository Evidence

Repository evidence shows that `generated_at` is intentionally used as
operational metadata across StaffordOS:

- `staffordos/qa/evaluate_nokings_mission_001_readiness_v1.mjs` writes
  `generated_at` using the current evaluator execution time.
- `staffordos/proof_runs/evidence_manifest_v1.mjs` writes manifest
  `generated_at` from the current evidence append time.
- `staffordos/governance/ceo_truth_explainability_audit/ceo_truth_explainability_audit_v1.md`
  classifies `metadata.generated_at` as builder execution time.
- `STAFFORDOS_MERCHANT_WORKSPACE_ARCHITECTURE_V1.md` requires deliverables to
  be timestamped and tied to packet and reservation authority.
- `SHOPIFIXER_COMPETENCY_ENGINE_V1.md` defines `last_demonstrated` as a
  timestamp of the most recent successful demonstration.
- `staffordos/governance/runtime_artifact_commit_audit_v1.md` classifies
  runtime outputs, generated read models, snapshots, and event logs as expected
  runtime churn unless a separate governance decision changes persistence
  policy.
- `staffordos/implementation/p11_58_repository_working_tree_containment_audit_v1.md`
  records a separate governance decision to preserve selected runtime and audit
  outputs for continuity.
- `staffordos/qa/validate_evidence_manifest_v1.mjs` already normalizes
  generated timestamp lines when asserting that proof package output is
  deterministic except `generated_at`.

Repository evidence also shows that Mission 002 authority requires deterministic
governance:

- `staffordos/implementation/p11_57_mission_002_authority_definition_v1.md`
  requires deterministic Mission 002 authority and preserves the current
  competency score until deterministic scoring authority is governed.

## Definitions

### Canonical Governance Artifact

A canonical governance artifact is a committed or commit-authorized repository
artifact used to determine StaffordOS authority, gate status, readiness state,
evidence continuity, certification, completion, or next safe action.

For readiness artifacts, the canonical governance artifact is the semantic
readiness state, not necessarily every byte of runtime metadata written by the
evaluator.

### Readiness Artifact

A readiness artifact is a generated output that represents whether a mission,
product path, operator path, or governance gate is ready, blocked, complete, or
permitted to proceed.

Examples include:

- `staffordos/qa/output/nokings_mission_001_readiness_v1.json`
- other `staffordos/qa/output/*readiness*.json` artifacts when they are used as
  gate authority

### Operational Metadata

Operational metadata records when, where, or by which runtime process an
artifact was generated. It supports auditability and freshness checks, but does
not by itself decide gate outcome unless a governing artifact explicitly says it
does.

For readiness artifacts, `generated_at` is operational metadata when it is
written from evaluator execution time.

### Semantic Equality

Two readiness artifacts are semantically equal when their governance authority
fields are equal after permitted normalization of operational metadata.

Semantic equality is not permission to ignore status, blockers, gate reasons,
merchant identity, mission identity, evidence paths, or completion authority.

### Byte Equality

Byte equality means the full file content is identical. Byte equality remains
required when the bytes themselves are the proof.

## Canonical Authority Fields

For readiness artifacts, canonical authority fields include all fields that can
change a governance decision, user-visible gate result, or next-action
authority.

Canonical authority fields include, where present:

- `schema`
- `status`
- `production_operation_permitted`
- `completion_permitted`
- `merchant`
- mission identity
- exercise identity
- `active_exercise`
- `current_phase`
- `current_blocker`
- `blocking_reasons`
- `next_safe_action`
- `payment_required`
- scope authority paths
- evidence authority paths
- `gates`
- gate statuses
- gate reasons
- certification status
- completion status
- rollback status
- capability-gate status
- validator pass/fail result
- any source, hash, path, or artifact reference used to prove the readiness
  decision

These fields must remain deterministic for the same repository inputs. A
validator must fail if any canonical authority field changes unexpectedly.

## Operational Metadata Fields

For readiness artifacts, operational metadata fields include:

- `generated_at`, when it represents evaluator execution time
- `metadata.generated_at`, when it represents builder execution time
- equivalent generated-time fields whose documented purpose is runtime
  generation metadata

Operational metadata fields are informational unless a governing artifact
explicitly classifies a specific timestamp as decision authority.

Timestamp fields are canonical evidence when they prove a specific event,
demonstration, payment, execution, rollback, certification, or delivery time.
This policy does not downgrade those event timestamps.

## Deterministic Validation Policy

Readiness artifacts must be semantically deterministic.

That means:

1. The same repository inputs must produce the same governance authority fields.
2. Operational metadata may change between evaluator executions.
3. Validator equality checks may normalize operational metadata before comparing
   readiness artifacts.
4. Validators must not normalize fields that decide readiness, gate outcome,
   mission status, payment authority, completion authority, rollback authority,
   or next safe action.
5. Validators must report or document which metadata fields were normalized.

## Semantic Equality Rules

A readiness artifact passes semantic equality when:

- all canonical authority fields are present as required;
- all canonical authority fields match the expected value or expected derived
  state;
- no blocker, gate, scope, merchant, payment, completion, certification,
  rollback, or next-action field is lost or weakened;
- operational metadata differences are limited to governed metadata fields such
  as `generated_at`;
- normalization does not create or remove evidence.

If an output differs only in `generated_at` and `generated_at` is documented as
evaluator execution time, the readiness artifact is semantically equal.

## Byte Equality Rules

Byte equality is required for:

- Shopify source baselines used as rollback authority;
- exact live asset snapshots;
- sealed proof packages where the seal covers the full artifact;
- source files where hashes are evidence;
- certification artifacts that are asserted to be unchanged;
- fixture files when the fixture's bytes are the test input;
- readiness artifacts only when the validator explicitly defines byte equality
  as the required authority.

Readiness artifacts that include runtime-generated operational metadata should
not be required to pass byte equality unless the metadata is fixed, normalized,
or explicitly defined as canonical decision authority.

## Normalization Rules

Metadata normalization is permitted only when all of the following are true:

1. The field is identified by this policy or a later governance document as
   operational metadata.
2. The field is not used to decide status, blocker, gate result, payment
   authority, completion authority, rollback authority, certification, or next
   safe action.
3. The validator compares the remaining canonical authority fields.
4. The validator fails on any unexpected field addition, deletion, or semantic
   change unless that change is separately governed.
5. The normalized fields are named in validator output, test description, or
   mission evidence.

For NoKings Mission 001 readiness output, the top-level `generated_at` field is
permitted to be normalized for deterministic equality checks.

## Existing Repository Precedent

The evidence manifest validator already applies this principle.

`staffordos/qa/validate_evidence_manifest_v1.mjs` normalizes `Generated At` and
`Manifest Generated At` lines before asserting that a proof package is
deterministic except `generated_at`.

That precedent proves that StaffordOS may preserve operational timestamps while
comparing governance-bearing artifact content deterministically.

Readiness artifacts should follow the same policy: preserve generated timestamp
metadata, but compare governance decisions through semantic equality unless byte
equality is explicitly required.

## Governance Decision

StaffordOS readiness artifacts are canonical by semantic governance state, not
by volatile generated timestamp bytes.

The `generated_at` field in
`staffordos/qa/output/nokings_mission_001_readiness_v1.json` is operational
metadata when written from evaluator execution time.

For deterministic readiness validation, `generated_at` may be normalized or
excluded from equality checks, provided every canonical authority field remains
strictly compared.

This policy does not require removing `generated_at` from readiness outputs.
This policy does not require changing existing runtime writers.

## Future Validator Guidance

Future StaffordOS validators that compare readiness artifacts should:

- compare canonical authority fields semantically;
- normalize `generated_at` only where it is operational metadata;
- fail if status, phase, blocker, next safe action, gate state, payment state,
  completion state, merchant identity, evidence path, source hash, or
  certification authority changes unexpectedly;
- avoid full-file checksum requirements for readiness artifacts that contain
  runtime-generated metadata unless that metadata is made deterministic;
- report normalized metadata fields in the validator result or mission evidence.

Validators may still use byte equality where byte equality is the authority.

## Migration Guidance

Existing readiness outputs do not need to be rewritten solely to remove
`generated_at`.

A future implementation mission may align validators or containment scripts with
this policy by comparing a normalized readiness projection or by excluding the
top-level readiness `generated_at` field from checksum equality.

Such implementation must be narrow and must not weaken checks on canonical
authority fields.

## Risks

- Over-normalization could hide a real governance change if validators ignore
  too many fields.
- Treating all timestamps as operational metadata would be incorrect because
  event, execution, payment, rollback, and certification timestamps may be
  evidence.
- Full-file checksum checks against timestamped readiness outputs will continue
  to fail until validators are aligned with this policy.

## Non-Goals

This policy does not:

- modify validators;
- modify readiness outputs;
- modify evidence manifests;
- modify runtime files;
- change Mission 001 or Mission 002 authority;
- change competency score;
- authorize P11.59 completion;
- define a new scoring model;
- remove timestamp metadata from StaffordOS artifacts.

## Authority Statement

After this policy is committed, StaffordOS validators and governance missions
may treat readiness `generated_at` fields as operational metadata for
deterministic equality checks when those fields represent evaluator execution
time.

Readiness artifact determinism is defined as semantic equality of canonical
authority fields with governed normalization of operational metadata.
