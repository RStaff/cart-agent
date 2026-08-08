# J001.05B Private Application Pipeline Review

Date: 2026-08-07

Status: `PRIVATE_APPLICATION_PIPELINE_REVIEW_IMPLEMENTED`

## Checkpoint Authority

Repository authority was verified at HEAD `6f81413f4143b8fb1457da0a5442237535fd6cde` through:

- J001.05A Manual Application Event Tracking;
- J001.04 Explainable Fit and Positioning;
- J001.03A and J001.03B private Job Analysis workflow;
- S010.02D Role-Focused Career Evidence Review;
- S010.02E High-Value Career Fact Verification;
- G001 Private Data Git Backstop;
- G002 Professional workspace modes;
- G003 adapter-only read-model authority;
- G004.01 minimal operator write isolation;
- P001 Platform Runtime and Provider Integration Roadmap.

The private baseline contains three confirmed manual external applications, three follow-up review tasks, one confirmation-needed candidate, zero automated submissions, zero automated messages, and no private UI connection.

## Priority Rules

The local pipeline review uses explicit deterministic rules:

1. Interview, recruiter, screening, or offer response requiring action.
2. Follow-up review due.
3. Missing critical confirmation.
4. High-value submitted application needing preparation.
5. Opportunity analysis with unresolved evidence questions.
6. Missing resume linkage where materially useful.
7. Older submitted application with no recorded outcome.
8. Low-priority administrative cleanup.

Every action exposes why it appears, what is known, what is unknown, what Ross should do, what requires approval, and what completion proof should look like.

## Daily Job Search Command

The owner-private CLI answers:

`What should Ross do next in his job search today?`

It loads private Applications, ApplicationEvents, follow-up review tasks, and confirmation-needed records from the governed private store, then produces a local daily command with:

- primary next action;
- applications needing attention;
- follow-ups due;
- interviews or recruiter contact;
- confirmation needed;
- submitted applications;
- recent outcomes;
- evidence and positioning tasks;
- descriptive search health.

No vanity score, conversion rate, fit probability, interview probability, or employer-success probability is generated.

## Pipeline Model

The pipeline remains inside the Professional workspace under Career Operations.

Supported pipeline categories include submitted applications, follow-up review, recruiter contact, screening, interview, final interview, offer, rejection, withdrawal, closed, and needs confirmation.

Opportunity state remains separate from Application state. An Application record does not imply employer interest, recruiter review, fit, interview likelihood, or outcome.

## Follow-Up Review

Follow-up review is a local decision workflow, not a communication workflow.

For each review item, the CLI can show:

- company and role from private records;
- submitted date when known;
- days since submission when calculable;
- employer-response state;
- employer guidance when recorded;
- proposed action;
- communication status;
- operator approval requirement.

Allowed decisions include continue monitoring, prepare a draft for later approval, review employer guidance, record a real response, close follow-up, defer, or prepare interview evidence.

No message is sent.

## Confirmation Needed

The incomplete candidate remains outside the confirmed Application set.

The CLI asks only the minimum fields needed to decide whether an Application should exist:

- exact role;
- whether submission occurred;
- submission date;
- submission channel;
- resume used if known.

No Application is created from partial context.

## Outcome Recording

Owner-confirmed outcomes can be recorded as append-only decisions and, where applicable, append-only ApplicationEvents.

Supported outcome events include recruiter response, screening, interview, rejection, offer, withdrawal, and closure.

For rejection, an employer-provided reason is preserved only if supplied. No rejection reason is invented.

For offers, the workflow records state only. It does not accept, reject, negotiate, or communicate.

## Operator Decisions

Operator decisions are owner-private, append-only records. They include:

- decision ID;
- workspace ID;
- action ID;
- Application or confirmation reference when present;
- decision type;
- operator confirmation;
- optional private operator context;
- timestamp;
- source authority;
- privacy;
- non-impact flags.

Decisions do not submit applications, send messages, mutate resumes, contact providers, invoke AI, call APIs, create database records, or connect private data to a browser UI.

## Private Storage

Real outputs are written only to the owner-private Professional Job Search application-pipeline review store outside Git.

Private artifacts include:

- daily job search command;
- pipeline summary;
- next actions;
- follow-up review decisions;
- confirmation decisions;
- generated ApplicationEvents;
- future UI read model;
- processing audit summary.

Artifacts are versioned by run and written with owner-private permissions.

## Future UI Readiness

The workflow prepares a generic read model for a later authorized Professional UI. It may include company, role, stage, submitted date, next action, review date, employer response, captured timestamp, and limitations.

It does not expose private filesystem paths, raw resumes, raw cover letters, portal credentials, recruiter private contacts, raw listing text, or operator-private notes.

The read model is not connected to `/os`, `/operator`, an API, a database, browser storage, or a provider. G003 remains authoritative.

## Tests

Focused tests verify:

- deterministic primary action selection;
- interview and recruiter actions outrank monitoring;
- due follow-up outranks non-due follow-up;
- confirmation-needed candidates are surfaced;
- employer response and rejection reason are not invented;
- no submit, message, resume mutation, provider, AI, API, database, `/os`, or `/operator` path exists;
- manual external state is preserved;
- Opportunity and Application state remain separate;
- Application history is append-only;
- follow-up requires operator approval;
- private paths are hidden;
- private outputs stay outside Git with owner-private permissions;
- G003/G004 boundaries remain unchanged;
- future UI read model excludes private artifacts;
- no vanity metric or success probability is generated;
- outcome events are append-only and supported;
- fixtures are synthetic only.

## Limitations

This is a local CLI, not a visual UI.

It does not resolve incomplete candidates without Ross confirming required fields.

It does not update Application records in place. It records owner-private decisions and generated events append-only.

It does not link actual resume files to Asset Authority. J001.06 remains the recommended resume-linkage slice.

It does not create recruiter relationships, follow-up message drafts, or interview preparation packs beyond high-level pipeline actions.

## Rollback

Repository rollback:

`git revert <J001.05B commit SHA>`

Private owner decisions and pipeline snapshots are separate private records. Do not delete them without explicit Ross approval.

## Next Mission

Recommended next mission:

`J001_06_RESUME_VERSION_AND_APPLICATION_LINKAGE`

Reason: the pipeline now identifies missing resume references as useful job-search history, but resume files remain separate from Asset Authority and canonical Career truth.
