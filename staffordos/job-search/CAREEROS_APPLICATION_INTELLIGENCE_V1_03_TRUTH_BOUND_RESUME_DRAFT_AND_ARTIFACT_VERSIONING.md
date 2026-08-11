# CAREEROS_APPLICATION_INTELLIGENCE_V1_03_TRUTH_BOUND_RESUME_DRAFT_AND_ARTIFACT_VERSIONING

## Checkpoint Authority

- Branch authority: `main`
- Starting HEAD authority: `ba74758cae7bbbea3508135b5ee44cbf5cf2ad18`
- Governance authority: StaffordOS governed local-only commit path is available at `staffordos/operator_daemon/run_task_with_local_commit_gate_v1.sh`.
- CareerOS authorities reused: Application Intelligence Packet, CareerFact, CareerEvidence, ResumeVersion, Daily Job Search Experience, and owner-private CareerOS storage.

## Purpose

Create a truth-bound, job-specific resume draft artifact from one existing Application Intelligence Packet.

This mission prepares a private draft for human review. It does not create an Application, submit anything, export DOCX/PDF, upload a resume, send a message, mutate an existing ResumeVersion, promote CareerFact/CareerEvidence, or call external AI/Ollama.

## Career Truth Boundary

Canonical career authority remains:

- CareerFact
- CareerEvidence
- approved chronology and evidence promotions

Historical ResumeVersions remain downstream artifacts. They may inform layout or historical emphasis in a future workflow, but they do not verify their own claims and are not used as career truth in V1.03.

## Model Execution Finding

Existing StaffordOS model authority is limited to read-only Chief of Staff fixtures/proofs. It does not authorize owner-private Professional CareerOS resume drafting.

V1.03 therefore uses a deterministic truth-bound assembler:

- `modelUsed: false`
- `externalAiUsed: false`
- `ollamaUsed: false`

The artifact contract leaves room to record a future approved generation method, but no ungoverned model provider is wired here.

## Artifact Contract

Schema: `staffordos.careeros.application_artifact_version.v1`

Artifact type implemented in this mission:

- `RESUME`

Future artifact types are reserved but not generated:

- `COVER_LETTER`
- `NETWORKING_MESSAGE`

Each ApplicationArtifactVersion records:

- artifact ID and version;
- Application Intelligence Packet ID;
- JobOpportunity ID;
- artifact type;
- source career authority digest;
- source packet digest;
- draft content digest;
- generation method and model metadata;
- claim traceability references;
- safety state;
- operator approval state;
- supersession references;
- file/export state;
- privacy and external-action boundary flags.

## Draft Safety States

- `DRAFT_READY_FOR_REVIEW`: every substantive draft claim is traceable to supported CareerFact and CareerEvidence authority and no blocking validation issue remains.
- `DRAFT_NEEDS_EVIDENCE_REVIEW`: traceable claims exist, but review issues remain.
- `DRAFT_BLOCKED`: no traceable claims are available or a blocking issue prevents safe draft wording.
- `APPROVED_FOR_EXPORT`: reserved for a human review decision; never assigned automatically.

Evidence-backed proposed CareerFacts may create review-only draft wording when the Application Intelligence Packet classifies the support as `SUPPORTED_WITH_LIMITATION` and the CareerEvidence explicitly supports the referenced fact. That output cannot become `DRAFT_READY_FOR_REVIEW` until the fact is promoted or otherwise verified.

## Truth-Bound Drafting Rules

Allowed:

- select relevant verified experience;
- reorder relevant experience;
- emphasize relevant verified capabilities;
- summarize supported accomplishments;
- align terminology with the job where truthful;
- select relevant supported technologies;
- reduce irrelevant material;
- tailor summary and skills from verified authority.

Blocked:

- invented employers, titles, dates, technologies, certifications, customers, metrics, revenue, team sizes, years claims, production usage, newsroom experience, or seniority;
- historical ResumeVersion wording used as proof;
- packet support copied into a draft without loaded CareerFact and CareerEvidence metadata.

Unsupported claims are omitted or left as validation issues. A missing metric does not invalidate a supported accomplishment, but numeric wording is blocked unless metric authority is explicit.

## Private Outputs

Private artifacts are written outside Git under the existing owner-private CareerOS job-search storage authority.

Runtime artifacts may include:

- `truth_bound_resume_draft_result.json`
- `application_artifact_versions.json`
- `resume_drafts.private.json`
- `resume_draft_read_model.json`
- `claim_traceability.private.json`
- `draft_validation.private.json`
- `application_artifact_audit.json`

Directories are written with `0700`; files are written with `0600`.

## UI

The existing `/os/professional/jobs` route is extended narrowly:

- Application Intelligence cards may offer `Prepare Resume Draft`.
- Resume draft status appears in a redacted `Resume Drafts` section.
- Full draft content, private paths, raw CareerEvidence, and authority IDs remain outside the UI read model.

No new CareerOS shell, route family, dashboard, provider, recommendation logic, or fit logic is created.

## CLI

Local runner:

`node staffordos/ui/operator-frontend/lib/staffordos/runTruthBoundResumeDraft.mjs`

Commands:

- `build --packet-result <file>`
- `latest`

`--write` writes private draft artifacts outside Git.

## Tests

Focused tests cover:

- truth-bound evidence selection;
- unsupported-claim exclusion;
- unsupported metric exclusion;
- chronology preservation;
- job-specific emphasis;
- claim traceability;
- deterministic artifact versioning;
- supersession behavior;
- missing evidence behavior;
- blocked draft behavior;
- human review state;
- private-data boundary;
- no Application creation;
- no submission;
- no messaging;
- no browser action;
- no external side effect.

## DOCX / PDF

V1.03 does not export DOCX or PDF. Structured private resume draft JSON and artifact versioning are sufficient for this mission. A future narrow export mission can reuse this artifact authority after human review.

## Rollback

Revert the V1.03 local commit through the governed local-only path or an authorized governed revert process. Private generated draft artifacts can be superseded by rerunning the workflow; do not move private artifacts into Git.

## Recommended Next Mission

If structured drafts are usable but export is the only real-use blocker, run:

`CAREEROS_APPLICATION_INTELLIGENCE_V1_03B_REVIEWED_RESUME_DRAFT_EXPORT`

Otherwise continue to:

`CAREEROS_APPLICATION_INTELLIGENCE_V1_04_MANUAL_SUBMISSION_RECORD_AND_ARTIFACT_LINKAGE`
