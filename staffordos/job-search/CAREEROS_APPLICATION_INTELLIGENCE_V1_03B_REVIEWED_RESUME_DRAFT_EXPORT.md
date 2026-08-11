# CAREEROS_APPLICATION_INTELLIGENCE_V1_03B_REVIEWED_RESUME_DRAFT_EXPORT

## Checkpoint Authority

- Branch authority: `main`
- Starting HEAD authority: `df1415c0658b7ce00a63b5c9301d4e5e7e25d3bd`
- Governance authority: StaffordOS governed local-only commit path is available at `staffordos/operator_daemon/run_task_with_local_commit_gate_v1.sh`.
- CareerOS authorities reused: Application Intelligence Packet, V1.03 ApplicationArtifactVersion, truth-bound structured resume draft, CareerFact, CareerEvidence, approved chronology/evidence authority, and Daily Job Search Experience.

## Purpose

Turn an operator-approved V1.03 truth-bound structured resume draft into a private, submission-ready DOCX artifact.

This mission does not create an Application, submit anything, upload a resume, generate a cover letter, send a message, mutate a ResumeVersion, promote CareerFact/CareerEvidence, call a provider, call external AI, or call Ollama.

## Content Authority

The V1.03 structured draft remains the content authority for export.

Canonical career truth remains:

- CareerFact
- CareerEvidence
- approved chronology and evidence promotions

Historical ResumeVersions remain downstream artifacts. They are not used to validate their own claims and are not overloaded as job-specific export records.

## Review Boundary

Only drafts with both:

- `safetyState: APPROVED_FOR_EXPORT`
- `operatorApprovalState: APPROVED`

may produce a final DOCX artifact.

The V1.03B review decision `APPROVE_FOR_EXPORT` maps to the existing V1.03 review authority. It can only move a `DRAFT_READY_FOR_REVIEW` artifact into `APPROVED_FOR_EXPORT`. Drafts that remain `DRAFT_NEEDS_EVIDENCE_REVIEW` or `DRAFT_BLOCKED` fail closed.

Operator approval means the existing truthful draft may be exported. It does not authorize unsupported claims, submission, upload, messaging, or external action.

## Export Architecture

No reusable production DOCX/PDF generator was found in StaffordOS. V1.03B therefore adds a narrow deterministic OOXML writer for ATS-friendly DOCX output.

The writer:

- consumes only the approved structured draft;
- does not call a model;
- does not rewrite resume wording;
- uses a simple single-column document structure;
- writes standard section headings;
- omits empty sections;
- avoids tables, text boxes, graphics, and decorative layout;
- preserves a digest link from approved draft content to exported DOCX artifact.

## Artifact Versioning

V1.03B reuses the existing `staffordos.careeros.application_artifact_version.v1` authority for job-specific application artifacts.

Each export record preserves:

- export artifact ID and version;
- source V1.03 draft artifact ID;
- Application Intelligence Packet ID;
- JobOpportunity ID;
- source draft digest;
- source career authority digest;
- exported content digest;
- operator approval timestamp;
- DOCX file reference;
- PDF placeholder state when unsupported;
- supersession reference;
- privacy classification;
- `submissionStatus: NOT_SUBMITTED`.

Job-specific resume exports are ApplicationArtifactVersion records, not canonical ResumeVersions.

## Truth / No-Invention Validation

Before export, V1.03B reruns deterministic validation over the approved draft.

Export blocks on:

- missing operator approval;
- remaining V1.03 validation issues;
- missing claim traceability;
- internal claim/provenance IDs rendered in resume text;
- placeholder wording;
- empty export content.

Human approval cannot override fabricated, unsupported, ambiguous, or untraceable substantive claims.

## Private Outputs

Runtime artifacts are owner-private and remain outside Git under the existing CareerOS job-search private storage authority.

Private outputs may include:

- `reviewed_resume_draft_export_result.json`
- `application_artifact_export_versions.json`
- `resume_export_read_model.json`
- `resume_export_validation.private.json`
- `resume_export_audit.json`
- private DOCX files under `files/`

Directories are written with `0700`; files are written with `0600`.

The read model excludes generated resume text, private filesystem paths, claim IDs, CareerFact IDs, CareerEvidence IDs, and raw CareerEvidence content.

## UI

The existing `/os/professional/jobs` surface is extended narrowly:

- ready truth-bound drafts can be approved for export;
- reviewed resume files appear in a redacted `Resume Files` section;
- DOCX download is served by opaque export artifact ID;
- private filesystem paths are not exposed.

No new CareerOS shell, dashboard, provider, fit engine, recommendation engine, resume generator, or application tracker is created.

## CLI

Local runner:

`node staffordos/ui/operator-frontend/lib/staffordos/runReviewedResumeDraftExport.mjs`

Command:

- `latest`

Useful options:

- `--artifact-id <id>`
- `--approve`
- `--write`
- `--limit <n>`
- `--job-search-root <private-root>`
- `--as-of YYYY-MM-DD`

## DOCX / PDF

DOCX export is implemented.

PDF export is not implemented in V1.03B because no safe existing PDF conversion path was found and adding one would broaden the mission. PDF should be handled by a narrow follow-up only if it becomes the next real-use blocker.

## Tests

Focused tests cover:

- export approval requirement;
- blocked draft fail-closed behavior;
- approved structured draft to DOCX;
- deterministic file naming;
- artifact version increment;
- supersession;
- digest linkage;
- claim/provenance redaction;
- unsupported placeholder blocking;
- private file permissions;
- no Application creation;
- `submissionStatus: NOT_SUBMITTED`;
- no submission, messaging, browser, provider, external AI, or Ollama action.

## Rollback

Revert the V1.03B local commit through the governed local-only path or an authorized governed revert process. Private generated export artifacts can be superseded by rerunning the workflow; do not move private artifacts into Git.

## Recommended Next Mission

`CAREEROS_APPLICATION_INTELLIGENCE_V1_04_MANUAL_SUBMISSION_RECORD_AND_ARTIFACT_LINKAGE`
