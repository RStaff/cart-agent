# J003.04 Ready To Apply Application Package

## Authority

J003.04 starts from `31c99236` on `main` and treats the following as authoritative:

- J001 Know Me and Application Tracking;
- J002.01 Job Discovery and Prioritization;
- J002.02A Private Job Source Import Queue;
- J002.02B Greenhouse Discovery MVP;
- J003.01 Opportunity Recommendation Engine;
- J003.02 CareerOS Command Center;
- J003.03 Career Workflow Actions;
- Explainable Fit read-model output;
- ResumeVersion authority;
- Career Evidence authority;
- G001 private data Git backstop;
- G003 adapter/read-model authority;
- G004.01 operator write isolation.

This mission does not redesign discovery, modify recommendation logic, add a provider, generate or mutate resumes, create Applications, submit applications, send messages, connect private data to `/os` or `/operator`, deploy, or push.

## Package Flow

The package flow is:

```text
READY_TO_APPLY
  -> Opportunity
  -> Existing Explainable Fit
  -> Existing Recommended ResumeVersion
  -> Supporting Career Evidence
  -> Gap Analysis
  -> Application Package
  -> Human Review Required
```

Only recommendations already placed into `READY_TO_APPLY` by J003.03 are packaged.

## Application Package Contract

Each package includes:

- Opportunity ID;
- Company;
- Role;
- canonical job URL, when available from the existing J002 source record;
- recommendation state;
- Explainable Fit summary;
- recommended ResumeVersion;
- supporting Career Evidence;
- relevant strengths;
- missing skills and gaps;
- resume update requirements;
- application readiness;
- blocking issues;
- recommended next action;
- `humanReviewRequired: true`.

Packages are private preparation output only.

## Readiness States

J003.04 uses deterministic package readiness:

- `READY`;
- `NEEDS_RESUME_REVIEW`;
- `NEEDS_EVIDENCE_REVIEW`;
- `BLOCKED`.

`READY` means the existing ResumeVersion and Career Evidence are sufficient for human review and manual application planning.

`READY` does not mean the application was created, submitted, or externally represented.

## Blocking Rules

The package becomes `BLOCKED` when deterministic source authority shows:

- workflow state is not `READY_TO_APPLY`;
- full recommendation record is missing;
- recommendation is not `APPLY_NOW`;
- application readiness is not `READY_FOR_OPERATOR_APPROVED_APPLICATION`;
- canonical job URL is missing from the supplied Opportunity Queue source record;
- recommended ResumeVersion identity is missing;
- no safe existing ResumeVersion is available;
- ResumeVersion fact safety is `CONFLICTING`, `STALE`, or `UNSUPPORTED`.

Missing values remain missing. StaffordOS does not guess.

## Resume Rules

J003.04 reuses existing ResumeVersions.

It does not:

- generate a resume;
- rewrite a resume;
- mutate a ResumeVersion;
- create a new ResumeVersion;
- invent missing experience.

If the selected ResumeVersion requires review or has unresolved fact safety, the package is marked `NEEDS_RESUME_REVIEW` or `BLOCKED`.

## Career Evidence Rules

J003.04 reuses existing supporting Career Evidence and gap analysis from J003.01.

It does not:

- invent evidence;
- promote Career facts;
- mutate Career Evidence;
- treat job postings as verification of Ross's claims.

If evidence is insufficient, the package is marked `NEEDS_EVIDENCE_REVIEW` unless a hard blocker is present.

## Private Outputs

Runtime outputs remain owner-private and outside Git. The workflow may write:

- `application_packages.json`;
- `application_package_read_model.json`;
- `ready_packages.json`;
- `resume_review_required.json`;
- `evidence_review_required.json`;
- `blocked_packages.json`;
- `application_package_audit.json`.

The package may retain canonical job URL in private output. The redacted read model and CLI summary do not print the URL value, private paths, raw job text, raw resume text, or execution controls.

## CLI

Command:

```bash
node staffordos/ui/operator-frontend/lib/staffordos/runReadyToApplyApplicationPackage.mjs package --workflow-state <workflow-state.json> --recommendations <recommendation-result.json> --queue-result <queue-result.json>
```

`--write` persists package artifacts outside Git.

## Safety Boundary

J003.04 has no execution capability:

- no Application creation;
- no application submission;
- no resume generation;
- no resume mutation;
- no cover-letter generation;
- no recruiter messaging;
- no browser automation;
- no OAuth;
- no external provider write;
- no external AI;
- no Ollama;
- no private `/os` loader;
- no `/operator` private-data connection.

Human review is required for every package.

## Tests

Focused tests verify:

- deterministic readiness states;
- `READY_TO_APPLY` items produce packages;
- non-ready recommendations are ignored;
- canonical job URL is reused from J002 source authority or marked missing;
- recommended ResumeVersion is reused and never mutated;
- unresolved resume safety triggers review or block;
- supporting Career Evidence is reused;
- missing evidence triggers review;
- unsafe resume fact safety blocks the package;
- read model and CLI summary remain redacted;
- private outputs stay outside Git and create no Application artifacts;
- no discovery, ranking, recommendation, provider, AI, resume, message, or application execution path is added.

## Limitations

J003.04 does not create Application records. It prepares a review package only.

J003.04 does not implement resume edits, cover letters, or external application execution.

If the J002 queue result is not supplied, canonical job URL may remain unknown and package readiness may be blocked.

The `/os/professional/jobs` route remains a safe read-only dashboard without a private storage loader.

## Rollback

Rollback is a normal Git revert of the J003.04 commit. Owner-private J003.04 package artifacts can be removed separately if runtime package output should be discarded.

## Recommended Next Mission

Recommended next mission: `J003_05_OPERATOR_REVIEWED_MANUAL_APPLICATION_HANDOFF`.

That mission should let Ross review a package and record a manual handoff decision without creating or submitting an Application automatically.
