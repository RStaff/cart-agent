# S010.01 Job Opportunity and Requirement Contract

## Mission

`S010_01_JOB_OPPORTUNITY_AND_REQUIREMENT_CONTRACT` creates the first static
Professional Job Search operating contracts:

- `JobSource`
- `JobOpportunity`
- `JobRequirement`

These contracts support the later flow:

`Opportunity intake -> source preservation -> requirement extraction -> evidence mapping -> explainable recommendation -> next action`

This mission does not assess Ross's fit, connect resume evidence, create an
Application, create a route, persist records, invoke AI, invoke Ollama, access a
job board, or modify runtime behavior.

## Checkpoint Authority

- Starting HEAD verified: `8b859d067f6ef5a075e251f4af44f8d2a1be47f5`
- Branch observed: `main`
- No S010.01 artifact or `jobSearchContracts` module existed before this mission.
- Required authorities verified:
  - `staffordos/architecture/STAFFORDOS_ARCHITECTURE_V1.md`
  - S008 Professional workspace architecture
  - S008 Objective, Decision, Action, Evidence, Proof, and Learning foundations
  - S009 Chief of Staff contracts and validators
  - `staffordos/architecture/S010_00_PROFESSIONAL_WORKSPACE_JOB_SEARCH_COMMAND_DISCOVERY.md`
  - current workspace and capability registries
  - current operator-language standard

Certified baseline:

- Professional Job Search is architecture-defined but not runtime-backed.
- Professional remains Planned.
- Job Search is owner-private by default.
- No canonical JobOpportunity store existed.
- No canonical JobRequirement contract existed.
- No canonical resume authority existed.
- No real job record was authorized.
- No Bosch record exists in durable repository authority.
- Local deterministic fixtures were authorized.
- Runtime persistence must wait for identity, privacy, schema, audit, and migration authority.
- Ross remains the approval authority for applications and external communication.

## Working Tree Exclusions

The repository contained broad preexisting unrelated modified and untracked
files. They were inventoried and excluded from this mission.

Excluded categories:

- `RUNTIME_OR_DAEMON`: daemon state, runtime output, heartbeat, loop output, preflight output, and snapshots.
- `WEB_OR_PRISMA`: Prisma schema, migrations, web runtime files, packet authority files, and API route files.
- `S007_IDENTITY_OR_ISSUER`: operator issuer, KMS, identity, JWT, and execution authorization artifacts.
- `MISSION_EVIDENCE`: production, certification, recovery, reconciliation, and ShopiFixer mission records outside S010.01.
- `GENERATED`: generated frontend metadata such as `next-env.d.ts`.
- `PREEXISTING_UNRELATED`: agent, lead, revenue, system-map, rule, capability, and daemon output changes.
- `UNKNOWN_REQUIRES_REVIEW`: any dirty file not explicitly authorized for S010.01.

Authorized files for this mission:

- `staffordos/ui/operator-frontend/lib/staffordos/jobSearchContracts.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/jobSearchContracts.test.mjs`
- `staffordos/architecture/S010_01_JOB_OPPORTUNITY_AND_REQUIREMENT_CONTRACT.md`
- `staffordos/architecture/S010_01_JOB_OPPORTUNITY_AND_REQUIREMENT_CONTRACT.json`

## Ollama Stopped State

`lsof -nP -iTCP:11434 -sTCP:LISTEN` returned no listener before editing.

Ollama was not started, invoked, connected to the contracts, or used in tests.

## Existing Contract Discovery

No compatible canonical Professional Job Opportunity or Job Requirement contract
was found.

Existing related concepts:

| Artifact | Finding | Classification |
| --- | --- | --- |
| `workspaceRegistry.ts` | Professional is planned, owner-private, and includes Job Search mode | `CANONICAL_REUSABLE` |
| `capabilities.ts` | `professional-job-search` is planned only | `CANONICAL_REUSABLE` |
| S008 current registries | Professional has no current Actions, Decisions, Evidence, Proof, or Learning | `CANONICAL_REUSABLE` |
| S010.00 discovery | Selected Job Opportunity and Requirement contract as next slice | `CANONICAL_REUSABLE` |
| `candidate_opportunities/*` | Merchant checkout/growth opportunity generation | `NOT_SUITABLE` for career records |
| `web/src/jobs/*` and Prisma `Job` | Technical execution queue, not employment data | `NOT_SUITABLE` |
| `/operator` lead, campaign, relationship surfaces | Business CRM and revenue models | `REUSE_CONCEPT_ONLY` |

## Job Source Contract

`JobSource` preserves where a role came from before StaffordOS interprets it.

Fields implemented:

- `id`
- `workspaceId`
- `sourceType`
- `providerName`
- `providerRecordId`
- `sourceUrl`
- `canonicalUrl`
- `observedAt`
- `publishedAt`
- `updatedAt`
- `retrievedBy`
- `authorityClassification`
- `freshness`
- `privacyClassification`
- `termsOrAccessLimitation`
- `rawContentReference`
- `contentDigest`
- `duplicateGroupId`
- `status`
- `limitations`
- `testOnly`

Allowed source classifications:

- Employer career site
- Recruiter-provided
- Professional network
- Job board
- Operator-entered
- Imported document
- Historical continuity context
- Needs verification

Rules enforced:

- `workspaceId` must be `professional`.
- fixtures must be explicitly `testOnly`.
- provider IDs and URLs are aliases, not StaffordOS primary authority.
- a source URL does not prove the listing is open.
- missing published and updated dates must keep freshness `Unknown` or `Needs verification`.
- historical context cannot appear current.
- source content is preserved through `rawContentReference` and `contentDigest`.

## Job Opportunity Contract

`JobOpportunity` describes Ross's private review object for a role source. It is
not an Application.

Fields implemented:

- `id`
- `workspaceId`
- `sourceId`
- `companyId`
- `companyName`
- `roleTitle`
- `roleTitleNormalized`
- `employmentType`
- `seniority`
- `locationText`
- `workArrangement`
- `compensationText`
- `compensationMinimum`
- `compensationMaximum`
- `compensationCurrency`
- `compensationPeriod`
- `description`
- `responsibilities`
- `qualificationsSummary`
- `applicationUrl`
- `discoveredAt`
- `publishedAt`
- `sourceUpdatedAt`
- `listingFreshness`
- `opportunityStatus`
- `operatorInterest`
- `privacyClassification`
- `authorityClassification`
- `sourceReference`
- `duplicateStatus`
- `duplicateGroupId`
- `limitations`
- `createdAt`
- `updatedAt`
- `testOnly`

Rules enforced:

- `workspaceId` must be `professional`.
- `privacyClassification` must be `Professional owner-private`.
- missing values remain null or explicitly unknown.
- unsupported statuses fail.
- missing status does not become open.
- source ID must reference a supplied JobSource fixture.
- numeric compensation cannot appear without source compensation text.
- Application-state fields are rejected.
- fit-assessment fields are rejected.

Not inferred:

- compensation
- seniority
- remote eligibility
- sponsorship
- hiring urgency
- application deadline
- recruiter identity
- likelihood of interview
- likelihood of offer

## Opportunity Status Model

Initial opportunity statuses:

| Status | Label | Entry condition | Next states | Ross approval | Terminal |
| --- | --- | --- | --- | --- | --- |
| `DISCOVERED` | Found | Role source captured | `UNDER_REVIEW`, `NEEDS_VERIFICATION`, `LOW_PRIORITY`, `REJECTED_BY_ROSS`, `CLOSED` | No | No |
| `UNDER_REVIEW` | Reviewing fit | Source and requirements are being reviewed | `QUALIFIED`, `LOW_PRIORITY`, `REJECTED_BY_ROSS`, `NEEDS_VERIFICATION`, `CLOSED` | No | No |
| `QUALIFIED` | Worth applying | Role appears worth pursuing after source and requirement review | `LOW_PRIORITY`, `REJECTED_BY_ROSS`, `CLOSED` | Yes | No |
| `LOW_PRIORITY` | Low priority | Role remains possible but less important | `UNDER_REVIEW`, `QUALIFIED`, `REJECTED_BY_ROSS`, `CLOSED` | No | No |
| `REJECTED_BY_ROSS` | Passed on this role | Ross chose not to pursue | None | Yes | Yes |
| `CLOSED` | Closed | No further review is planned | None | Yes | Yes |
| `NEEDS_VERIFICATION` | Needs verification | Source, listing status, or extracted details need review | `UNDER_REVIEW`, `LOW_PRIORITY`, `REJECTED_BY_ROSS`, `CLOSED` | No | No |

Boundary:

- Job Opportunity status describes Ross's evaluation of a role.
- Application status will later describe an actual application process.
- `REJECTED_BY_ROSS` does not mean an employer rejected Ross.

## Job Requirement Contract

`JobRequirement` preserves what the listing says or what the operator entered.
It does not decide whether Ross satisfies the requirement.

Fields implemented:

- `id`
- `workspaceId`
- `jobOpportunityId`
- `sourceId`
- `requirementText`
- `normalizedRequirement`
- `requirementCategory`
- `requirementLevel`
- `importanceClassification`
- `evidenceExpectation`
- `yearsMentioned`
- `degreeMentioned`
- `certificationMentioned`
- `technologyOrSkill`
- `responsibilityOrQualification`
- `extractionMethod`
- `extractionConfidence`
- `sourceExcerptReference`
- `operatorReviewStatus`
- `ambiguity`
- `limitations`
- `createdAt`
- `testOnly`

Allowed categories:

- Required skill
- Preferred skill
- Experience
- Leadership
- Domain
- Education
- Certification
- Responsibility
- Location or work arrangement
- Compensation
- Travel
- Legal or employment eligibility
- Other
- Unknown

Allowed levels:

- `REQUIRED`
- `PREFERRED`
- `DESIRED`
- `RESPONSIBILITY`
- `INFORMATIONAL`
- `UNCLEAR`

Rules enforced:

- required and preferred language remain distinct.
- ambiguous requirements remain `UNCLEAR`.
- `or equivalent` wording is preserved.
- years of experience must appear in source text before `yearsMentioned` can be set.
- each requirement must cite `sourceExcerptReference`.
- no fit score, candidate evidence, skill match, resume recommendation, or likelihood field is allowed.

## Extraction Authority

Allowed extraction methods:

- `SOURCE_EXPLICIT`
- `OPERATOR_ENTERED`
- `DETERMINISTIC_EXTRACTION`
- `AI_PROPOSED`
- `IMPORTED`
- `NEEDS_REVIEW`

Rules:

- `AI_PROPOSED` requirements cannot be `Operator confirmed` in this contract.
- source text must trace to a passage or section.
- normalized text must preserve meaning.
- ambiguous language stays ambiguous.
- combined listing statements must not be split when splitting changes meaning.
- years of experience are not invented.
- degree and certification language preserves exact wording.
- no Ross fit classification is assigned.

No AI was called in this mission.

## Durable ID and Duplicate Model

Durable opaque ID prefixes:

- `jobsrc_` for JobSource
- `jobopp_` for JobOpportunity
- `jobreq_` for JobRequirement

Forbidden primary IDs:

- URL
- canonical URL
- provider record ID
- company plus title

Duplicate classifications:

- `NOT_EVALUATED`
- `POSSIBLE_DUPLICATE`
- `CONFIRMED_DUPLICATE`
- `DISTINCT_LISTING`
- `SUPERSEDED_LISTING`

Rules:

- duplicate detection is not implemented.
- fuzzy matching is not implemented.
- possible duplicates are not merged.
- confirmed duplicates require explicit grouping.
- duplicate status is review context, not authority to hide records.

## Freshness and Staleness

Freshness classifications:

- Current
- Recent
- Historical
- Unknown
- Stale
- Closed by source
- Needs verification

Rules:

- no universal time threshold is defined.
- `observedAt`, `publishedAt`, and `updatedAt` are preserved.
- future `checkedAt` remains a runtime concept.
- missing published and updated dates must not be called current.
- a listing without authoritative open status must not be called open.

Operator-facing language should prefer:

- Recently observed
- Source date unknown
- Listing may be stale
- Source reports closed
- Needs verification

## Privacy and Workspace Boundary

All implemented objects require `workspaceId = professional`.

Current fixtures are synthetic and owner-private in handling.

Forbidden workspace use:

- Stafford Media
- Personal
- Family
- guest access
- employee access
- contractor access

Public listing facts may originate publicly, but Ross's interest, evaluation,
notes, application plans, future fit assessment, compensation preferences,
communication, and outcomes remain Professional owner-private information.

Presentation-only `WorkspaceContext` is not authorization.

## Authority Classifications

Allowed authority classifications:

- Source explicit
- Operator confirmed
- Derived normalization
- Imported
- AI proposed
- Historical continuity context
- Needs verification

Rules:

- derived normalization cannot override source text.
- AI proposed cannot become confirmed automatically.
- operator confirmation must be recorded separately in future runtime.
- historical continuity context cannot appear current.
- missing authority fails closed as Needs verification.

## Static Fixtures

Implemented deterministic fixtures:

- 2 JobSource fixtures
- 2 JobOpportunity fixtures
- 8 JobRequirement fixtures

Fixture coverage:

- clear employer-source role
- listing with unknown source date and incomplete compensation
- required requirement
- preferred requirement
- ambiguous requirement
- education requirement with `or equivalent`
- work-arrangement information
- possible duplicate classification

All fixture records are synthetic and `testOnly: true`.

No Bosch record, real employer record, resume evidence, Ross fit evidence,
application, submission, message, or contact record was created.

## Failure Behavior

Validators return operator-safe validation results. Expected failures do not
throw.

Covered failure cases:

- missing workspace
- wrong workspace
- missing source
- missing role title
- missing company
- malformed URL
- source URL used as primary ID
- provider record ID used as primary ID
- unsupported source or opportunity status
- requirement missing source trace
- required/preferred meaning changed
- invented years of experience
- listing falsely classified as open
- historical context presented as current
- duplicate silently merged
- Personal or Business workspace leakage
- Application fields added too early
- fit-assessment fields added too early

## Immutability and Provenance

Fixtures are frozen at module load.

Validators preserve:

- source ID
- source reference
- content reference
- content digest
- normalization boundary
- extraction method
- authority
- freshness
- limitations

Validators do not mutate inputs and do not rewrite source wording silently.

## Application Boundary

A `JobOpportunity` is not an `Application`.

A JobOpportunity record may exist without Ross applying.

This mission does not include:

- application date
- submitted status
- recruiter response
- interview state
- rejection state from employer
- offer state

`REJECTED_BY_ROSS` means Ross chose not to pursue the role. It does not mean the
employer rejected an application.

## Fit-Assessment Boundary

A `JobRequirement` does not imply Ross has or lacks the requirement.

Candidate evidence and job fit assessment come later.

This mission does not include:

- fit percentage
- apply recommendation
- skill match
- years match
- resume recommendation
- likelihood of success
- evidence classification for Ross
- placeholder scores

## Chief of Staff Compatibility

Defined future source types:

- `job_opportunity_snapshot`
- `job_requirement_snapshot`

Compatibility fields available:

- source ID
- workspace
- authority
- freshness
- privacy
- exact source reference
- limitations
- excluded fields
- permission requirement

No S009 validator rule was modified. No Ollama call occurred. No model snapshot
was created or authorized.

## Tests

Focused test file:

- `staffordos/ui/operator-frontend/lib/staffordos/jobSearchContracts.test.mjs`

Focused test result:

- `node --test staffordos/ui/operator-frontend/lib/staffordos/jobSearchContracts.test.mjs`
- 37/37 tests passed.

S009 regression result:

- `node --test` over Chief of Staff validator, demo, model adapter, Ollama adapter, and Primary Action source-adapter tests.
- 126/126 tests passed.

S008 regression result:

- `node --test` over workspace, Home, Objective, Decision, Action, Evidence, Proof, and Learning foundation tests.
- 127/127 tests passed.

Build result:

- `npm run build` in `staffordos/ui/operator-frontend` exited 0.
- Route generation completed.
- Existing Next/Turbopack warnings were observed for the `next.config.mjs` NFT trace and `/operator/shopifixer-pilot` static generation, with no S010.01 route or operator-code change.

## Files Changed

- `staffordos/ui/operator-frontend/lib/staffordos/jobSearchContracts.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/jobSearchContracts.test.mjs`
- `staffordos/architecture/S010_01_JOB_OPPORTUNITY_AND_REQUIREMENT_CONTRACT.md`
- `staffordos/architecture/S010_01_JOB_OPPORTUNITY_AND_REQUIREMENT_CONTRACT.json`

## Known Limitations

- Professional remains planned and not runtime-backed.
- No real job record exists.
- No Bosch record was created.
- No canonical resume authority exists yet.
- No Candidate Evidence or Job Fit Assessment exists yet.
- No Application contract exists yet.
- No persistence, audit store, identity enforcement, or route exists.
- No job-board access or model call exists.
- Duplicate detection is conceptual only.
- Freshness has classifications only; no universal thresholds.

## Rollback

Rollback:

`git revert <S010.01 commit SHA>`

No application, resume, database, model, identity, Stripe, ShopiFixer, Abando,
or deployment rollback should be required.

## Recommended Next Mission

`S010_02_CANONICAL_RESUME_AND_CANDIDATE_EVIDENCE_AUTHORITY`

Scope:

- discover canonical resume files and career fact authority
- define verified candidate evidence records
- define unsupported resume-content rejection rules
- prepare the later fit-assessment contract

Exclusions:

- no resume edits
- no tailored resume generation
- no applications
- no external communication
- no model invocation
- no persistence unless separately authorized

## Final Classification

`JOB_OPPORTUNITY_CONTRACT_COMMITTED`
