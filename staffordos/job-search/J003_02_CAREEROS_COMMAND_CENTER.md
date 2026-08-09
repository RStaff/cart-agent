# J003.02 CareerOS Command Center

## Authority

J003.02 starts from `3a2cc55a` on `main` and treats the following as authoritative:

- J001 Know Me and Application Tracking;
- J002.01 Job Discovery and Prioritization;
- J002.02A Private Job Source Import Queue;
- J002.02B Greenhouse Discovery MVP;
- J003.01 Opportunity Recommendation Engine;
- Explainable Fit read-model output;
- ResumeVersion authority;
- G001 private data Git backstop;
- G003 adapter/read-model authority;
- G004.01 operator write isolation.

This mission does not redesign discovery, modify recommendation logic, add a provider, add AI, generate resumes, create Applications, send messages, or deploy.

## Dashboard Contract

The CareerOS Command Center is the first operational dashboard for the Professional Job Command route.

It presents:

- Today's Brief;
- Top Recommendations;
- Pipeline;
- System Health;
- operator approval boundary.

The dashboard is a read-only presentation adapter. It accepts existing authoritative result/read-model objects and reshapes them for display. It does not rank, score, import, recommend, or mutate anything itself.

## Read Model Inputs

Supported inputs are:

- J003.01 `OpportunityRecommendationResult`;
- J002.02A `PrivateJobSourceImportQueueResult`;
- J002.02B `GreenhouseDiscoveryResult`;
- J001.05B `PrivateApplicationPipelineReviewResult`.

The default `/os/professional/jobs` route remains disconnected from private runtime storage. Supplying private read models requires a later governed authorization/read-model connection.

## Today's Brief

The brief displays aggregate counts only:

- `New Opportunities`;
- `Ready to Apply`;
- `Review`;
- `Waiting`;
- `Skipped`.

Recommendation counts are copied from J003.01 recommendation read-model records. No recommendation rule is duplicated.

## Top Recommendations

Each recommendation row displays:

- Position;
- Company;
- Recommendation;
- Explainable Fit summary;
- ResumeVersion safe label or reuse status;
- Next Action;
- Application Readiness;
- supporting evidence and gap counts.

The displayed order is inherited from J003.01 recommendation output. The Command Center does not recalculate ranking or fit.

## Pipeline

Pipeline counts come from J001.05B application pipeline output:

- Applications Submitted;
- Interviews;
- Follow-ups Due.

No employer response, interview, offer, rejection, or outcome is inferred.

## System Health

System Health displays:

- Provider Status;
- Last Discovery Run;
- Queue Size.

Provider status is read from existing Greenhouse discovery output or the existing provider capability matrix. The dashboard does not call Greenhouse or any provider.

## Safety Boundary

J003.02 has no execution capability:

- no application submission;
- no Application creation;
- no resume generation;
- no resume mutation;
- no cover-letter generation;
- no recruiter messaging;
- no browser automation;
- no OAuth;
- no external AI;
- no Ollama;
- no private `/os` loader;
- no `/operator` private-data connection.

Ross remains the authority for applications, resume use, outreach, withdrawals, offers, and any external representation.

## Files

The implementation adds:

- `careerOsCommandCenterPresentation.ts`;
- `careerOsCommandCenterPresentation.test.mjs`;
- Command Center rendering in the existing `JobCommandSurface`;
- Command Center CSS in the existing frontend stylesheet.

No new route, app shell, provider, or storage writer is introduced.

## Tests

Focused tests verify:

- deterministic empty dashboard state;
- Today's Brief counts from existing read models;
- Top Recommendations display the required fields;
- Pipeline counts from the application pipeline read model;
- System Health from provider/queue metadata;
- no duplicated recommendation or ranking logic;
- no external action or private-data loader;
- private payload surfaces remain hidden.

## Limitations

The route currently renders an empty safe state unless a future governed UI read-model connection supplies private CareerOS artifacts.

The Command Center does not provide operator review decisions or application import approvals. Those remain future slices.

## Rollback

Rollback is a normal Git revert of the J003.02 commit. There are no private runtime artifacts to remove for this mission.

## Recommended Next Mission

Recommended next mission: `J003_03_OPERATOR_REVIEW_AND_OPPORTUNITY_IMPORT_DECISIONS`.

That mission should let Ross review top recommendations, approve Opportunity imports, and preserve defer/skip decisions without applying to jobs.
