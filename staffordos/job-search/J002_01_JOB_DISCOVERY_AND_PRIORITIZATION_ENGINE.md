# J002.01 Job Discovery and Prioritization Engine

## Checkpoint Authority

J002.01 builds on the committed Professional Job Search chain through J001.06C, S010 Career authority, G001 private-data containment, G002 Professional workspace modes, G003 adapter-only read-model authority, and G004.01 operator write isolation.

The mission uses "CareerOS" as the current Professional Career Operations capability label. It does not create a new top-level workspace, shell, authentication domain, UI route, database, provider integration, or application-submission path.

## Purpose

This slice creates the first deterministic Job Discovery engine for Career Operations:

- import discovered opportunities from mocked provider adapters;
- preserve Opportunities separately from Applications;
- detect duplicate opportunity records;
- compare opportunities against existing private Applications;
- prevent duplicate application recommendations;
- rank opportunities with explicit weighted rules;
- produce a private prioritized Opportunity Queue;
- create a redacted future read model that remains disconnected from `/os` and `/operator`.

No real provider adapter is implemented in this mission.

## Opportunity Contract

The private discovered Opportunity contract is `staffordos.job_search.private_discovered_opportunity.v1`.

Core fields include:

- durable opaque `opportunityId`;
- Professional workspace and Career Operations capability family;
- source record, mocked provider aliases, source digest, and source authority;
- company and role references;
- location, work arrangement, employment type, summary, responsibilities, and requirements;
- duplicate status and duplicate group;
- application comparison;
- ranking, priority tier, and recommended action;
- privacy, limitations, and explicit no-action flags.

An Opportunity is not an Application. Discovery creates no Application, ApplicationEvent, ResumeVersion, resume, cover letter, message, or employer contact.

## Ranking Model

The ranking engine is deterministic and explanation-based. It uses mission-approved weighting:

| Component | Weight |
| --- | ---: |
| AI / Automation | 45 |
| Business Technology | 25 |
| Product / TPM | 15 |
| Marketing Technology | 15 |

Supported dimensions are:

- AI Engineering;
- AI Automation;
- AI Governance;
- Business Technology;
- Technical Product Management;
- Technical Program Management;
- Business Systems Analysis;
- Marketing Technology;
- RevOps;
- Platform Operations;
- Digital Transformation.

The engine records matched dimensions, matched terms, component scores, and limitations. It does not generate employer interest, interview likelihood, offer likelihood, success probability, or validated fit.

## Duplicate Detection

Duplicate detection uses deterministic signals only:

- mocked provider record alias;
- canonical source URL;
- source text digest;
- normalized company plus requisition alias;
- normalized company plus role title.

Possible duplicate records are not silently merged. Duplicate review records preserve the member IDs, canonical display candidate, evidence, and limitations for later operator review.

## Application Comparison

Existing private Applications are compared separately from Opportunity duplicate review. A discovered Opportunity can be classified as:

- `NO_APPLICATION_MATCH`;
- `EXISTING_APPLICATION_MATCH`;
- `POSSIBLE_APPLICATION_DUPLICATE`;
- `APPLICATION_STATUS_UNKNOWN`.

An `EXISTING_APPLICATION_MATCH` sets `DO_NOT_APPLY_DUPLICATE` and removes the opportunity from the application-review queue. This prevents duplicate application recommendations without changing the underlying Application record.

## Priority Queue

The private queue contract is `staffordos.job_search.private_opportunity_queue.v1`.

Allowed recommendation states are:

- `REVIEW_FOR_APPLICATION`;
- `REVIEW_DUPLICATE_BEFORE_APPLICATION`;
- `DO_NOT_APPLY_DUPLICATE`;
- `NEEDS_OPERATOR_REVIEW`;
- `LOW_PRIORITY_REVIEW`.

Ross approval remains required before any future application action. No application submission method exists in this engine.

## Read Model

The future read model is redacted and disconnected. It may expose only:

- company;
- role;
- priority tier;
- recommended action;
- deterministic score;
- duplicate status;
- application comparison status;
- discovered date;
- captured/as-of date;
- limitations.

It excludes private paths, raw source text, source URLs, recruiter contacts, portal credentials, resume contents, application controls, and message controls. G003 remains authoritative.

## CLI

Local synthetic preview command:

```bash
node staffordos/ui/operator-frontend/lib/staffordos/runJobDiscoveryPrioritization.mjs mock-preview
```

Optional owner-private synthetic output write:

```bash
node staffordos/ui/operator-frontend/lib/staffordos/runJobDiscoveryPrioritization.mjs mock-preview --write
```

The CLI uses mocked provider fixtures only. It does not fetch job boards, browse, call providers, invoke AI, submit applications, generate resumes, or connect private data to a UI.

## Private Outputs

When writing is requested, outputs stay in owner-private storage outside Git:

- `opportunity_queue.json`;
- `opportunities.json`;
- `duplicate_review.json`;
- `opportunity_read_model.json`;
- `audit_summary.json`.

## Tests

Focused tests verify:

- mission weights;
- mocked providers only;
- Opportunity/Application separation;
- deterministic scoring and explanations;
- duplicate detection without silent merge;
- existing Application duplicate prevention;
- no employer-interest or success-probability inference;
- read-model redaction;
- repository-path rejection for private outputs;
- no submission, resume generation, messaging, external AI, browser automation, `/os`, or `/operator` connection path.

## Known Limitations

This mission does not implement real job-source adapters, search the internet, ingest live listings, submit applications, recommend a specific resume, or create a UI connection. Ranking depends only on the supplied opportunity fields and governed private Application records.

## Rollback

Rollback with:

```bash
git revert <J002.01 commit SHA>
```

No private job-source payloads are committed.

## Recommended Next Mission

`J002_02_PRIVATE_JOB_SOURCE_ADAPTER_AND_IMPORT_QUEUE`

That mission should introduce the first governed private source adapter/import queue while preserving the same no-submission and duplicate-prevention boundaries.
