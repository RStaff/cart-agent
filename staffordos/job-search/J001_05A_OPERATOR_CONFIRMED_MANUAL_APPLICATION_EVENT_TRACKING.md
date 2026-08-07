# J001.05A Operator-Confirmed Manual Application Event Tracking

Date: 2026-08-07

Status: `MANUAL_APPLICATION_EVENT_TRACKING_IMPLEMENTED`

## Checkpoint Authority

Repository authority was verified through:

- J001.01 Professional Job Command shell;
- J001.02 private Job Opportunity intake bridge;
- J001.03A private Job Requirement and Evidence Mapping;
- J001.03B private Job Analysis Review CLI;
- J001.04 Explainable Fit and Positioning;
- S010.02D role-focused Career evidence review;
- S010.02E high-value Career fact verification;
- G001 private-data Git backstop;
- G002 Professional workspace modes;
- G003 adapter-only read-model authority;
- G004.01 minimal operator write isolation;
- P001 platform runtime and provider roadmap.

S010.02E remains the current authority that only the approved certification fact was newly promoted to canonical verified status. Education verification remains deferred until official education evidence is placed under approved private Career evidence authority.

## Contracts Reused

The workflow reuses the Professional workspace and Career Operations capability family. It does not create CareerOS, a new shell, a new authentication domain, or a duplicate Action/Evidence/Proof/Learning architecture.

The workflow preserves the J001.02 boundary that Job Opportunities are not Applications. Opportunity state remains separate from Application state.

## Application Contract

The private Application record includes:

- `applicationId`;
- `workspaceId`;
- `opportunityId`;
- `companyReference`;
- `roleReference`;
- `status`;
- `submissionMethod`;
- `submissionChannel`;
- `submittedAt`;
- `submittedAtPrecision`;
- `operatorConfirmed`;
- `resumeReference`;
- `coverLetterReference`;
- `employerResponseStatus`;
- `currentStage`;
- `nextAction`;
- `nextReviewAt`;
- `sourceAuthority`;
- `privacy`;
- `limitations`;
- timestamps.

Real values are written only to owner-private storage outside Git.

## ApplicationEvent Contract

Application history is event-based. The private event record includes:

- `eventId`;
- `applicationId`;
- `eventType`;
- `occurredAt`;
- `occurredAtPrecision`;
- `sourceAuthority`;
- `operatorConfirmed`;
- `channel`;
- `evidenceReferences`;
- `limitations`;
- `createdAt`.

Supported event names include manual submission, follow-up review scheduling, recruiter contact, screening, interview, rejection, offer, withdrawal, and closure events. J001.05A creates only events that actually occurred or review tasks that were explicitly derived from the recorded manual submission.

## Status Model

Application states support the Professional pipeline from preparation through submission, follow-up, interviews, offer, rejection, withdrawal, and closure.

`SUBMITTED_MANUAL_EXTERNAL` means Ross submitted outside StaffordOS.

This mission cannot create `SUBMITTED_FUTURE_STAFFORDOS`.

An application submission does not imply employer interest, recruiter review, fit, interview likelihood, or success probability.

## Manual Submission Authority

Three operator-confirmed manual external applications were eligible for private capture in this mission. StaffordOS did not submit them.

One additional candidate was not captured as a confirmed Application because required operator-confirmed facts were incomplete.

## Duplicate Handling

Duplicate prevention uses:

- Opportunity ID when available;
- otherwise company, role, requisition alias, and submitted date;
- possible duplicate review by company and role.

Confirmed and possible duplicates are held for operator review. The workflow does not silently merge or overwrite existing Application records.

## Reconciliations

The existing analysis-linked manual submission is linked to a private Application record when no duplicate exists. Unknown submission date, resume reference, cover-letter use, channel, and employer response remain unknown unless Ross records them.

Two additional operator-confirmed manual submissions are captured as private Applications with manual external submission events and follow-up review tasks.

The incomplete candidate remains `NEEDS_OPERATOR_CONFIRMATION`; no Application is created for it.

## Resume Reference Boundary

Resume files are not copied. A private Application may reference a resume filename or future Asset reference when operator-confirmed.

Resume wording is downstream positioning. It is not canonical Career truth and cannot verify a Career fact.

## Follow-Up Model

Follow-up is a review task, not a message.

Defaults:

- `communicationAllowed = false`;
- `operatorApprovalRequired = true`;
- generic 10-business-day review timing where a submission date is known.

Employer instructions override generic timing. No communication is sent by this workflow.

## Pipeline Model

The private pipeline summary reports submitted applications, follow-up reviews due, recruiter responses, screenings, interviews, offers, rejections, closed applications, and records needing operator confirmation.

It does not generate vanity metrics or conversion rates.

## Outcome and Learning Boundary

The workflow preserves:

- `OBSERVATION`: what occurred;
- `ASSESSMENT`: Ross's interpretation;
- `HYPOTHESIS`: a future idea to test;
- `OUTCOME`: an employer response or pipeline event;
- `LEARNING`: a reusable conclusion supported by sufficient evidence and explicit authority.

Positioning hypotheses remain hypotheses until outcomes support them.

## Private Storage

Real records are written under the owner-private Professional Job Search application store outside Git.

Generated private artifacts include:

- applications;
- application events;
- resume references;
- cover-letter references;
- follow-up review tasks;
- pipeline summary;
- next actions;
- positioning hypotheses;
- future UI read model;
- confirmation-needed records;
- processing audit summary;
- change report.

Artifacts are written with owner-private file permissions.

## Future UI Read Model

The workflow prepares a generic redacted read model for a future authorized Professional UI. It is not connected to `/os`, `/operator`, an API, a database, browser storage, or a provider.

The future read model excludes private paths, raw resumes, raw cover letters, portal credentials, private recruiter contacts, full source text, and operator-private notes.

G003 remains authoritative: real private Professional UI display remains blocked until trusted server identity and authorization exist.

## Tests

Focused tests cover:

- manual external submission distinct from StaffordOS submission;
- Opportunity and Application state separation;
- duplicate and possible-duplicate prevention;
- unknown submission time, resume, and cover-letter preservation;
- employer response, fit, and interview probability non-inference;
- follow-up review tasks that do not send messages;
- private output permission checks;
- redacted future read models;
- positioning hypotheses that do not become Learning;
- absence of provider, API, database, `/os`, `/operator`, external AI, Ollama, submit, message, or resume mutation paths;
- synthetic fixture cleanliness.

## Known Limitations

The workflow does not provide a visual UI. It is a local owner-private CLI and private artifact writer.

It does not resolve incomplete application candidates without Ross confirming the missing fields.

It does not link actual resume files to Asset Authority. That remains a future J001.06 slice.

It does not send follow-up messages or determine employer outcomes.

## Rollback

Repository rollback:

`git revert <J001.05A commit SHA>`

Private Application records are owner-private and versioned. Do not delete private application events, follow-up tasks, or pipeline summaries without explicit Ross approval.

## Next Mission

Recommended next mission:

`J001_05B_PRIVATE_APPLICATION_PIPELINE_REVIEW`

Reason: pipeline review creates immediate job-search value from the newly captured manual applications without connecting private data to `/os` or requiring OAuth/session integration.
