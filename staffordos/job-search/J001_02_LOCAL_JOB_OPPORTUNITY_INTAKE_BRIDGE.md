# J001.02 Local Job Opportunity Intake Bridge

## Checkpoint Authority

Starting HEAD was verified as `d95be89f2c4648afc90ca82b517bcba62018b375` on branch `main`.

Repository authority verified:

- J001 UI Authority Reconciliation
- J001 Job Search Information Architecture
- J001 UI Duplication and Reuse Matrix
- J001.01 Professional Job Command shell
- S010.00 Professional Job Search discovery
- S010.01 Job Opportunity and Requirement contracts
- S010.02A through S010.02C2 Career Evidence authorities
- `staffordos/ui/operator-frontend` as the canonical StaffordOS UI root
- `/operator` as Stafford Media runtime-canonical
- `/os` as the canonical multi-workspace shell
- `/os/professional/jobs` as the Job Command route

The worktree contained unrelated pre-existing modified and untracked files. They were excluded from this mission.

## Private Storage Boundary

The private Job Search storage boundary is outside Git:

- intake: `~/.staffordos/private/professional/job-search/intake/`
- normalized opportunities: `~/.staffordos/private/professional/job-search/opportunities/`

Both directories were created with owner-private permissions. No real job record was present, no private opportunity file was read, and no private normalized opportunity was written during this mission.

## Intake Contract

The bridge accepts one explicit JSON record per opportunity.

Required fields:

- `schemaVersion`
- `workspaceId`
- `sourceUrl`
- `sourceProvider`
- `sourceObservedAt`
- `roleTitle`
- `companyName`
- `listingText` or `sourceSummary`
- `privacy`
- `sourceAuthority`
- `limitations`

Optional source-backed fields include location, work arrangement, compensation text, employment type, listing publication date, listing expiration date, provider record ID, and operator notes.

Rules:

- `workspaceId` must equal `professional`.
- `sourceUrl` is an alias, not a primary ID.
- provider IDs are aliases, not primary IDs.
- unknown values remain unknown.
- open/current status is not accepted from intake alone.
- operator notes remain private and separate from source facts.
- no application, interview, offer, fit, model recommendation, or resume-selection field is accepted.

## Intake Template

`buildPrivateJobOpportunityIntakeTemplate()` provides an empty local template shape with no real company, role, salary, recruiter, source URL, or private note values. The intended operator process is to create a private JSON file from that template outside Git, then run the bridge from a governed local command or future server boundary.

## Validation Rules

The validator fails closed for:

- missing or non-Professional workspace
- missing, malformed, or non-HTTPS source URL
- missing role
- missing company
- missing source provider
- missing observed date
- missing source text or source-backed summary
- missing or unsupported source authority
- non-private privacy classification
- intake-supplied primary IDs
- application, interview, offer, fit, and model-recommendation fields
- unsupported numeric compensation normalization
- unsupported open/current listing status
- repository intake or output paths
- malformed schema version

The validator is deterministic and does not mutate inputs.

## Durable ID Result

The bridge generates deterministic opaque private IDs:

- opportunity IDs use the `privjobopp_` prefix.
- source IDs use the `privjobsrc_` prefix.

IDs are derived from governed source and intake attributes by digest. They are not raw URLs, company plus title, provider IDs, contact details, or public sequential identifiers.

## Duplicate Handling

Duplicate classifications are preserved for review:

- `EXACT_SOURCE_DUPLICATE`
- `SAME_PROVIDER_ALIAS`
- `POSSIBLE_CONTENT_DUPLICATE`
- `POSSIBLE_ROLE_VARIANT`
- `DISTINCT_OPPORTUNITY`
- `NEEDS_OPERATOR_REVIEW`

The bridge does not merge duplicate candidates. Uncertain duplicates remain visible for Ross review.

## Freshness Handling

Freshness classifications:

- `CURRENT`
- `RECENT`
- `HISTORICAL`
- `STALE`
- `UNKNOWN`

J001.02 does not claim a listing is open. Missing publication dates remain `UNKNOWN`. Import time does not become publication time. An expired listing is `STALE`, and historical continuity context is `HISTORICAL`.

## Private Normalized Output

Valid intake can produce a private normalized opportunity outside Git. The normalized record includes:

- private durable opportunity ID
- private source ID
- source aliases
- normalized role and company display fields
- source-backed location, work arrangement, compensation text, and employment type
- freshness
- opportunity status
- authority
- privacy
- duplicate status
- next action
- source reference
- limitations
- `noncanonical: true`
- `noApplicationCreated: true`
- `noFitAssessmentCreated: true`

The normalized opportunity does not duplicate full listing text. Source text remains in the private intake record.

## Read Model Result

`jobOpportunityQueuePresentation.ts` defines a redacted read-only Professional queue presentation. It includes only:

- role
- company
- source freshness
- known location
- known work arrangement
- compensation text only when explicitly supplied
- review status
- source status
- next action
- approval status
- limitations

It excludes full source text, private paths, raw operator notes, contact details, recruiter identity, application state, fit scores, AI recommendations, and application controls.

## Job Command Integration

`JobCommandSurface` now accepts an optional redacted opportunity queue presentation. The route default remains an empty queue:

- `No opportunities imported yet.`
- `Job intake will be connected in a later governed slice.`

No React component reads arbitrary private files. No `/operator` loader is imported.

## Real-Record Connection Status

No real private opportunity records were present in the private intake folder during this mission. The bridge is implementation-ready and awaiting operator intake. Real private opportunities are not displayed yet because a safe server-side read boundary has not been certified.

## Server and Client Boundary

Filesystem access is isolated to `privateJobOpportunityIntake.ts`. The Job Command surface consumes only a redacted presentation object and defaults to a static empty queue. No new API route was created.

## Human Authority

StaffordOS can organize and prepare job information.

Ross must decide:

- whether the role is worth reviewing
- whether the source is trustworthy
- whether to pursue the role
- which resume may later be used
- whether to apply
- whether any message may be sent

No intake record grants application or communication authority.

## Components Reused

- `StaffordOsShell`
- `WorkspaceSelector`
- `WorkspaceContext`
- `/os` layout
- `JobCommandSurface`
- existing StaffordOS card, panel, and empty-state styling

## Components Created

- `privateJobOpportunityIntake.ts`
- `privateJobOpportunityIntake.test.mjs`
- `jobOpportunityQueuePresentation.ts`
- `jobOpportunityQueuePresentation.test.mjs`

## Files Changed

- `staffordos/ui/operator-frontend/lib/staffordos/privateJobOpportunityIntake.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/privateJobOpportunityIntake.test.mjs`
- `staffordos/ui/operator-frontend/lib/staffordos/jobOpportunityQueuePresentation.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/jobOpportunityQueuePresentation.test.mjs`
- `staffordos/ui/operator-frontend/components/staffordos/JobCommandSurface.tsx`
- `staffordos/ui/operator-frontend/lib/staffordos/jobSearchCommandPresentation.ts`
- `staffordos/ui/operator-frontend/app/globals.css`
- `staffordos/job-search/J001_02_LOCAL_JOB_OPPORTUNITY_INTAKE_BRIDGE.md`
- `staffordos/job-search/J001_02_LOCAL_JOB_OPPORTUNITY_INTAKE_BRIDGE.json`

## Tests

- J001.02 focused tests: passed, 52 assertions
- J001.01 regression tests: passed, 30 assertions
- S010 regression tests: passed, 140 assertions
- S009 regression tests: passed, 126 assertions
- S008 regression tests: passed, 127 assertions
- build: passed, with pre-existing `/operator/shopifixer-pilot` static-generation warnings
- route checks: passed, 12 required routes returned HTTP 200

## Privacy Scan

Repository changes were scanned for real employer names, real role names, real URLs, salaries, locations, listing text, recruiter names, contact details, operator notes, private source IDs tied to real records, private paths, and real JobOpportunity records.

Result: no real private job data was staged.

## Known Limitations

- No real opportunity is connected to the UI yet.
- No safe server read boundary exists for private opportunity files.
- No requirement extraction exists.
- No career-evidence mapping exists.
- No fit recommendation exists.
- No application object exists.
- No submission or messaging authority exists.
- Professional workspace context remains presentation-only and is not authorization.

## Rollback

Repository rollback:

`git revert <J001.02 commit SHA>`

Git rollback does not delete private job-search intake or normalized opportunity files.

## Recommended Next Mission

`J001_03_JOB_REQUIREMENT_EXTRACTION_AND_CAREER_EVIDENCE_MAPPING`

That mission should extract requirements without inventing them, map only against verified or reviewable career evidence, avoid a single unexplained fit percentage, and preserve Ross approval before resume tailoring or application activity.
