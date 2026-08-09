# CAREEROS_V1_02 Live Job Search Activation

## Authority

CareerOS V1.02 continues from the integrated daily job-search experience and reuses existing CareerOS authorities:

- J001 private application tracking and pipeline review
- J002 real Greenhouse opportunity discovery
- J003 recommendation, workflow action, application package, and review workspace
- J004 follow-up and response tracking
- CAREEROS_V1_01 daily job-search experience

This mission does not redesign discovery, ranking, recommendation, ResumeVersion, application tracking, follow-up tracking, or the daily UI.

## Real Source Configuration

The live Greenhouse provider manifest is owner-private runtime configuration. It is not committed to Git.

The configured source set contains a small, practical set of public Greenhouse boards aligned to the existing CareerOS target lanes:

- AI automation
- AI platform
- AI governance
- AI product
- technical product/program management
- business technology
- business systems analysis
- digital transformation
- marketing technology and operations as a secondary lane

No additional provider was added.

## Live Discovery Result

The live run used only the public Greenhouse Job Board API.

Aggregate result:

- Sources attempted: 8
- Sources retrieved: 8
- Provider failures: 0
- Published jobs retrieved: 2200
- Eligible jobs: 276
- Rejected jobs: 282
- Queue items: 276
- Ready for opportunity import: 45
- Duplicate items: 24
- Existing application matches: 0

No authentication, cookies, browser automation, scraping, application submission, message sending, resume generation, external AI, or Ollama was used.

## Pipeline Result

The live artifacts were projected through the existing governed pipeline:

Greenhouse discovery -> eligibility -> normalization -> duplicate detection -> prioritization -> Explainable Fit -> Opportunity Queue -> Recommendation Engine -> Workflow State -> Application Package State -> Review Workspace State.

The recommendation result was conservative:

- APPLY NOW: 0
- REVIEW: 45
- WAIT: 210
- SKIP: 21
- Ready-to-apply packages: 0

The lack of APPLY NOW output is intentional. Current private ResumeVersion safety and evidence mapping did not support automatic application readiness.

## Blockers

HIGH: Private artifact handoff files were incomplete for local CLI chaining.

Resolution:

- Greenhouse discovery now writes a full private queue result companion file for the recommendation engine.
- Opportunity recommendation now writes a full private recommendation result companion file for workflow actions.
- Ready-to-apply package generation now writes a full private package result companion file for review workspace projection.

HIGH: The daily loader did not surface Greenhouse provider status from existing private discovery artifacts.

Resolution:

- The daily private loader now reconstructs the redacted Greenhouse discovery status from existing private artifacts.
- The UI shows Greenhouse run availability, latest discovery timestamp, and opportunity backlog without provider calls.

DATA READINESS: No current ResumeVersion was safe enough for reuse in live recommendations.

Classification:

- Not a code blocker.
- Requires future resume/evidence review before opportunities can move to application-package readiness.

## Daily Experience Result

The existing daily route now displays real current data from private artifacts:

- Today's Brief
- Today's Priorities
- Top Opportunities
- Application Work
- Application Pipeline
- Daily Actions
- Search Health

The route performs no provider calls and exposes no external action controls.

## Privacy

Committed documentation contains aggregate operational results only.

Excluded from Git:

- private provider manifest
- real source URLs
- raw job descriptions
- private opportunity records
- private recommendation artifacts
- private workflow decisions
- private application details
- resume filenames
- private filesystem paths

## Validation

Focused tests cover:

- Greenhouse private queue handoff
- Opportunity recommendation result handoff
- Ready-to-apply package result handoff
- Daily loader Greenhouse status reconstruction
- Daily UI no-action boundary

Regression, build, JSON validation, scans, and diff checks are recorded in the mission implementation report.

## Rollback

Rollback the local commit for source and documentation changes.

Private runtime artifacts may be left in place because they are owner-private operational records. If a clean operational rerun is required, create a new private run rather than deleting historical output.

## Recommended Next Action

Resolve the live data-readiness blocker before trying to move opportunities into application packages:

1. Review and clear ResumeVersion fact-safety status for the highest-value resume families.
2. Map existing Career Evidence to the top REVIEW opportunities.
3. Re-run recommendation.
4. Move only APPLY NOW opportunities through READY_TO_APPLY and human review.
