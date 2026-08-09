# J003.01 Opportunity Recommendation Engine

## Authority

J003.01 starts from `35f4c100` on `main` and treats the following as authoritative:

- J001 Know Me and private Career evidence authority;
- J001.03A Explainable Fit;
- J001.06 ResumeVersion authority;
- J002.01 Job Discovery and Prioritization;
- J002.02A Private Job Source Import Queue;
- J002.02B Greenhouse Discovery MVP;
- G001 private data Git backstop;
- G003 adapter/read-model authority;
- G004.01 operator write isolation.

This mission does not redesign discovery, add a provider, create Applications, generate resumes, generate cover letters, or send messages.

## Pipeline

The recommendation engine composes existing artifacts:

`Opportunity Queue -> Explainable Fit -> ResumeVersion Selection -> Gap Analysis -> Recommendation -> Application Readiness`

The engine consumes a J002 job-source import queue, existing Explainable Fit artifacts, and existing ResumeVersion records. It does not call Greenhouse or any other provider.

## Recommendation Contract

Each opportunity receives exactly one recommendation:

- `APPLY_NOW`
- `REVIEW`
- `WAIT`
- `SKIP`

The recommendation record includes:

- Explainable Fit availability and reused fit assessment;
- recommended ResumeVersion reuse candidate;
- supporting Career evidence IDs from existing mappings;
- missing skills or unresolved requirements;
- deterministic resume update effort;
- recommended next action;
- application readiness state;
- closed execution flags.

No hiring probability, interview probability, or AI confidence score is generated.

## ResumeVersion Selection

ResumeVersion selection uses deterministic metadata only:

- purpose;
- target company reference;
- target role reference;
- target role family;
- review status;
- fact-safety status;
- document format;
- observed date.

The engine does not use filename as identity, does not read raw resume text, does not mutate source resumes, and does not treat a resume as Career truth.

Possible reuse statuses:

- `SELECTED_EXISTING_RESUMEVERSION`
- `REVIEW_BEFORE_REUSE`
- `NO_SAFE_EXISTING_RESUMEVERSION`
- `NO_RESUMEVERSION_AVAILABLE`

Ross must still approve the exact resume before applying.

## Gap Analysis

Gap analysis reuses existing requirement-evidence mappings.

Supporting Career evidence includes only mappings already classified as:

- `PROVEN`
- `PARTIAL`
- `TRANSFERABLE`

Missing skills include mappings classified as:

- `MISSING`
- `UNKNOWN`

Missing skill output is not a claim that Ross lacks the skill. It means current CareerOS evidence does not yet support the role requirement well enough for application planning.

## Application Readiness

Application readiness states:

- `READY_FOR_OPERATOR_APPROVED_APPLICATION`
- `NEEDS_EVIDENCE_REVIEW`
- `NEEDS_RESUME_REVIEW`
- `WAITING_FOR_SOURCE_OR_DUPLICATE_REVIEW`
- `BLOCKED_EXISTING_APPLICATION`
- `SKIP_RECOMMENDED`

`APPLY_NOW` still means private planning output only. StaffordOS does not submit the application.

## Private Outputs

Real recommendation outputs remain outside Git.

The private writer may create:

- `opportunity_recommendations.json`
- `application_readiness.json`
- `resume_selection.json`
- `gap_analysis.json`
- `future_read_model.json`
- `recommendation_audit.json`

Private output directories are owner-private and repository paths are rejected.

## CLI

Local command:

```bash
node staffordos/ui/operator-frontend/lib/staffordos/runOpportunityRecommendationEngine.mjs recommend --queue-result <queue-result.json> --fit-artifacts <fit-artifacts.json> --resume-versions <resume-versions.json> --write
```

The queue input must be a full J002.02 queue result or an artifact containing `jobSourceImportQueue`.

The CLI prints counts and closed safety flags only. It does not print private filesystem paths, raw resume text, raw job text, or application controls.

## Tests

Focused tests verify:

- every queue item receives a deterministic recommendation;
- high-priority clean opportunities can become `APPLY_NOW`;
- missing evidence produces `REVIEW`;
- unsafe or unreviewed ResumeVersions require review;
- duplicate and existing-application prevention outrank apply recommendations;
- no ResumeVersion availability does not generate or mutate a resume;
- private outputs stay outside Git with owner-private permissions;
- read models hide private paths, raw text, URLs, and action controls;
- no provider, browser, application, resume generation, messaging, external AI, or Ollama capability exists.

## Limitations

J003.01 does not import Opportunities, create Applications, create ApplicationResumeLinks, generate resumes, generate cover letters, send messages, schedule notifications, or connect to `/os` or `/operator`.

The recommendation depends on the quality of supplied Explainable Fit and ResumeVersion artifacts. If those artifacts are absent or incomplete, the engine returns `REVIEW`, `WAIT`, or `SKIP` rather than guessing.

## Rollback

Rollback is a normal Git revert of the J003.01 commit. Private output artifacts can be removed separately from the owner-private output root.

## Recommended Next Mission

Recommended next mission: `J003_02_OPERATOR_REVIEW_AND_OPPORTUNITY_IMPORT_DECISIONS`.

That mission should let Ross review recommendation output, approve selected JobOpportunity imports, and preserve reject/defer decisions without applying to jobs.
