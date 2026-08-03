# S010.02B Career Evidence Contract and Static Validator

## Mission

`S010_02B_CAREER_EVIDENCE_CONTRACT_AND_STATIC_VALIDATOR` creates the first
static Professional Career Evidence contracts and deterministic validator.

This mission does not generate resumes, modify resumes, create fit scores,
invoke Ollama, call AI, create routes, persist records, create schemas, modify
S009 validators, or change `/operator`.

The canonical relationship is:

`FACT -> EVIDENCE -> POSITIONING`

Resumes, cover letters, model output, interview notes, and prior generated
documents remain downstream presentation or wording evidence. They do not become
primary career truth.

## Checkpoint Authority

- Starting HEAD verified: `3d79aff50112bf4e70554d78241581a8d2224f6f`
- Branch observed: `main`
- No S010.02B artifact or `careerEvidenceContracts` module existed before this
  mission.
- Required authorities verified:
  - `staffordos/architecture/STAFFORDOS_ARCHITECTURE_V1.md`
  - S008 Evidence, Proof, and Learning foundations
  - S009 Chief of Staff contracts and validators
  - `staffordos/architecture/S010_00_PROFESSIONAL_WORKSPACE_JOB_SEARCH_COMMAND_DISCOVERY.md`
  - `staffordos/architecture/S010_01_JOB_OPPORTUNITY_AND_REQUIREMENT_CONTRACT.md`
  - `staffordos/architecture/S010_02A_CAREER_EVIDENCE_DISCOVERY_AND_CANONICAL_AUTHORITY.md`

Certified baseline:

- No canonical Career Evidence Authority existed.
- No canonical resume or resume-fact authority existed.
- No verified employment, education, certification, portfolio, publication, or
  reference registry existed.
- StaffordOS, ShopiFixer, Abando, and architecture artifacts remain candidate
  evidence only until explicitly approved for Professional career use.
- Professional remains owner-private and Planned.
- No real career data was authorized.
- Ollama remained stopped.

## Working Tree Exclusions

The repository contained broad preexisting unrelated modified and untracked
files. They were inventoried and excluded from this mission.

Excluded categories:

- `RUNTIME_OR_DAEMON`: daemon state, runtime output, heartbeat, loop output,
  preflight output, and snapshots.
- `WEB_OR_PRISMA`: Prisma schema, migrations, web runtime files, packet
  authority files, and API route files.
- `S007_IDENTITY_OR_ISSUER`: operator issuer, KMS, identity, JWT, and execution
  authorization artifacts.
- `MISSION_EVIDENCE`: production, certification, recovery, reconciliation, and
  ShopiFixer mission records outside S010.02B.
- `GENERATED`: generated frontend metadata such as `next-env.d.ts`.
- `PREEXISTING_UNRELATED`: agent, lead, revenue, system-map, rule, capability,
  and daemon output changes.

Authorized files for this mission:

- `staffordos/ui/operator-frontend/lib/staffordos/careerEvidenceContracts.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/careerEvidenceContracts.test.mjs`
- `staffordos/architecture/S010_02B_CAREER_EVIDENCE_CONTRACT_AND_STATIC_VALIDATOR.md`
- `staffordos/architecture/S010_02B_CAREER_EVIDENCE_CONTRACT_AND_STATIC_VALIDATOR.json`

## Ollama Stopped State

`lsof -nP -iTCP:11434 -sTCP:LISTEN` returned no listener before editing.

Ollama was not started, invoked, connected to contracts, or used in tests.

## Existing Contract Discovery

No compatible canonical Professional Career Evidence contract was found.

Discovery summary:

| Area | Finding | Classification |
| --- | --- | --- |
| S010.02A | Defined Career Evidence authority model | `CANONICAL_AUTHORITY_DESIGN` |
| S010.01 | Defines JobSource, JobOpportunity, and JobRequirement | `REUSABLE_FOR_REQUIREMENT_MAPPING` |
| S008 Evidence and Proof | Reusable authority distinction | `REUSE_WITH_PROFESSIONAL_SCOPE` |
| S009 source tracing | Reusable future source principles | `REUSE_FOR_FUTURE_SNAPSHOTS` |
| Resume authority | No canonical registry found | `ABSENT` |
| Employment, education, certification, portfolio, publication, reference registries | No canonical Professional records found | `ABSENT` |

Business, merchant, customer, payment, packet, lead, campaign, and runtime
operator models were not reused as career authority because their assumptions do
not safely define Professional owner-private career truth.

## Career Fact Contract

`CareerFact` represents a specific Professional career claim.

Implemented fields:

- `id`
- `workspaceId`
- `factType`
- `subject`
- `statement`
- `normalizedStatement`
- `startDate`
- `endDate`
- `current`
- `organization`
- `roleOrTitle`
- `location`
- `classification`
- `supportLevel`
- `verificationStatus`
- `authorityClassification`
- `privacyClassification`
- `sourceEvidenceIds`
- `conflictingEvidenceIds`
- `conflictTypes`
- `metricClassification`
- `measurementAuthority`
- `experienceClassification`
- `proficiencyLabel`
- `yearsOfExperience`
- `yearsAuthority`
- `deploymentClaim`
- `customerUseClaim`
- `technologyOrSkill`
- `limitations`
- `operatorNotes`
- `positioningBoundaries`
- `createdAt`
- `updatedAt`
- `testOnly`

Allowed fact types:

- `EMPLOYMENT`
- `EDUCATION`
- `CERTIFICATION`
- `SKILL`
- `TECHNOLOGY`
- `PROJECT`
- `PRODUCT`
- `ARCHITECTURE`
- `ACHIEVEMENT`
- `LEADERSHIP`
- `PRESENTATION`
- `PUBLICATION`
- `INTERVIEW_STORY`
- `REFERENCE`
- `OTHER`

Unknown values remain null, absent, or explicitly limited. The contract does not
infer employment dates, titles, accomplishments, years of experience, skill
proficiency, deployment, customer use, or certification authority.

## Career Evidence Contract

`CareerEvidence` represents source material that supports, challenges, or
preserves wording about a CareerFact.

Implemented fields:

- `id`
- `workspaceId`
- `evidenceType`
- `title`
- `summary`
- `sourceType`
- `sourceReference`
- `sourceArtifact`
- `sourceOwner`
- `observedAt`
- `sourceCreatedAt`
- `authorityClassification`
- `privacyClassification`
- `freshness`
- `supportsFactIds`
- `challengesFactIds`
- `contentDigest`
- `excerptReference`
- `limitations`
- `operatorReviewStatus`
- `testOnly`

Allowed evidence types:

- `RESUME`
- `EMPLOYMENT_RECORD`
- `EDUCATION_RECORD`
- `CERTIFICATION_RECORD`
- `PROJECT_ARTIFACT`
- `PRODUCT_ARTIFACT`
- `ARCHITECTURE_ARTIFACT`
- `PRESENTATION`
- `PUBLICATION`
- `INTERVIEW_NOTE`
- `OPERATOR_ATTESTATION`
- `PROVIDER_CONFIRMATION`
- `HISTORICAL_DOCUMENT`
- `OTHER`

Evidence may support or challenge a fact. Evidence does not automatically verify
a fact. Generated resume wording is evidence of prior wording only.

## Verification Status Model

Implemented verification statuses:

| Status | Operator-facing meaning |
| --- | --- |
| `PROPOSED` | Proposed fact |
| `NEEDS_EVIDENCE` | Needs evidence |
| `PARTIALLY_SUPPORTED` | Partly supported |
| `VERIFIED` | Verified |
| `CONFLICTING` | Conflicting evidence |
| `REJECTED` | Rejected |
| `SUPERSEDED` | Replaced by a newer fact |
| `HISTORICAL_ONLY` | Historical only |

Rules:

- `VERIFIED` requires supporting evidence and direct support.
- A generated resume cannot independently verify a fact.
- Conflicting dates, titles, employers, accomplishments, or source authority
  remain unresolved until review.
- Partly supported facts cannot appear verified.
- No automatic status promotion exists.

## Authority Classifications

Implemented authority classifications:

- `PROVIDER_CONFIRMED`
- `OFFICIAL_DOCUMENT`
- `OPERATOR_CONFIRMED`
- `REPOSITORY_BACKED`
- `PUBLIC_ARTIFACT`
- `IMPORTED_DOCUMENT`
- `GENERATED_DOCUMENT`
- `THIRD_PARTY_STATEMENT`
- `HISTORICAL_CONTINUITY`
- `NEEDS_VERIFICATION`

Rules:

- `GENERATED_DOCUMENT` is not canonical authority.
- `REPOSITORY_BACKED` proves only the demonstrated repository scope.
- `OPERATOR_CONFIRMED` remains explicit owner attestation.
- Public artifacts may support public claims but do not prove private
  employment details.
- Authority does not remove privacy boundaries.

## Fact, Evidence, and Positioning Boundary

Fact is what is asserted as career truth.

Evidence is what supports or challenges the assertion.

Positioning is how verified or explicitly approved facts are selected and
explained for a target role.

Positioning may choose relevant verified facts, emphasize transferable
experience, use concise wording, connect related facts, and select appropriate
projects. It may not change employer, title, dates, responsibility, scope,
metrics, certification status, or the distinction between transferable and
direct experience.

## Accomplishment and Metric Rules

Metric classifications:

- `VERIFIED_METRIC`
- `OPERATOR_ESTIMATE`
- `DERIVED_ESTIMATE`
- `THIRD_PARTY_REPORTED`
- `UNSUPPORTED`
- `NOT_APPLICABLE`

Unsupported metrics are rejected. Percent improvements require measurement
authority. Revenue, user, customer, project, system, team-size, and adoption
claims require evidence. Verbs such as led, owned, designed, built,
implemented, and managed must reflect demonstrated responsibility.

## Skill and Technology Rules

Experience classifications:

- `USED_IN_PRODUCTION`
- `USED_IN_CONTROLLED_PROJECT`
- `USED_IN_TRAINING`
- `STUDIED`
- `FAMILIAR`
- `TRANSFERABLE`
- `NEEDS_VERIFICATION`

The validator rejects unsupported proficiency labels such as Expert, Advanced,
Master, or Senior without a governed proficiency authority. It does not infer
years of experience from repository age or document dates. Studied or controlled
project use does not become production use.

## Project and Product Authority

Project and product facts may include name, role, purpose, architecture,
technologies, status, environment, demonstrated capabilities, evidence
references, production status, business status, and limitations.

Rules:

- Built locally is not deployed.
- Deployed is not customer use.
- Tested is not commercially proven.
- Architecture documented is not fully implemented.
- Repository-backed evidence supports only demonstrated project scope.
- StaffordOS architecture may be described accurately without claiming mature
  commercial platform authority.

## Privacy and Workspace Boundary

All `CareerFact` and `CareerEvidence` records require:

`workspaceId = professional`

Current authority is owner-private only. There is no default access for Stafford
Media employees, contractors, customers, merchants, Family, friends, guests, or
Personal workspace users.

Business artifacts may be referenced from Professional only through explicit
approved evidence links. Presentation-only WorkspaceContext is not
authorization.

## Static Fixtures

The module includes eight synthetic CareerFact fixtures and nine synthetic
CareerEvidence fixtures. Every fixture is explicitly `testOnly: true`.

Fixture coverage:

- Verified education fact supported by an official-document fixture.
- Certification fact needing provider confirmation.
- Project fact supported by repository artifacts.
- Technology used in a controlled project.
- Technology only studied.
- Employment-title and date conflict.
- Unsupported accomplishment metric.
- Historical generated resume wording.
- Operator-confirmed fact with a clear limitation.

No real Ross employment, education, certification, accomplishment, resume, or
career record was created.

## Validation Rules

The deterministic validator rejects:

- missing Professional workspace
- wrong workspace
- missing durable ID
- URL used as primary ID
- missing fact statement
- missing evidence source reference
- `VERIFIED` fact with no evidence
- `VERIFIED` fact supported only by generated resume wording
- partly supported fact presented as verified
- title or date conflict silently resolved
- unsupported metric
- unsupported years of experience
- unsupported proficiency label
- project deployment claim without evidence
- customer-use claim without evidence
- certification claim without provider or official-document authority
- generated document treated as official record
- Business or Personal workspace leakage
- positioning text changing the underlying fact
- validator mutation of inputs

The validator is pure, deterministic, local, and non-mutating.

## Conflict Model

Implemented conflict types:

- `EMPLOYER_CONFLICT`
- `TITLE_CONFLICT`
- `START_DATE_CONFLICT`
- `END_DATE_CONFLICT`
- `EDUCATION_CONFLICT`
- `CERTIFICATION_CONFLICT`
- `METRIC_CONFLICT`
- `PROJECT_STATUS_CONFLICT`
- `SKILL_CONTEXT_CONFLICT`
- `SOURCE_AUTHORITY_CONFLICT`
- `OTHER`

Conflict behavior:

- preserve conflicting evidence IDs
- return no canonical verified value
- explain that review is required
- do not choose the newest or most flattering version automatically
- do not allow AI to resolve conflicts silently

## Verification Eligibility

`determineVerificationEligibility` returns:

- `ELIGIBLE_FOR_OPERATOR_VERIFICATION`
- `NEEDS_MORE_EVIDENCE`
- `CONFLICT_REQUIRES_REVIEW`
- `NOT_ELIGIBLE`
- `HISTORICAL_ONLY`

This function never marks a fact `VERIFIED`. It only reports whether the fact is
eligible for later governed operator verification.

## Resume Boundary

A resume is a generated or curated presentation artifact.

A future resume may contain only:

- verified facts
- explicitly approved partly supported wording
- clearly labeled transferable positioning
- evidence-backed accomplishments
- approved contact information

A resume must preserve source CareerFact IDs, evidence IDs, positioning
decision, version, target role, and approval state.

No resume object, parser, writer, PDF, Word file, or generator is implemented in
S010.02B.

## Job Requirement Compatibility

Future mapping:

`JobRequirement -> CandidateEvidence -> CareerFact -> CareerEvidence -> Fit classification`

S010.02B does not implement CandidateEvidence, fit mapping, fit scoring, or job
recommendations.

The contract exposes enough future mapping fields for fact type, statement,
technology or skill context, authority, verification status, source references,
limitations, workspace, and privacy.

## Chief of Staff Compatibility

Future Professional source types are defined but not authorized for model use:

- `career_fact_snapshot`
- `career_evidence_snapshot`
- `career_conflict_snapshot`

Future snapshots must include source ID, Professional workspace, authority,
verification status, privacy, freshness, exact source reference, limitations,
and permission requirement.

S009 validator rules were not modified.

## Operator Language Review

Operator-safe wording uses:

- Career fact
- Supporting evidence
- Verified
- Needs evidence
- Partly supported
- Conflicting evidence
- Needs Ross's review
- What this proves
- What this does not prove
- Where this came from
- Technical details

Primary visible language avoids implementation terms such as entity, canonical
tuple, join model, evidence graph node, normalization schema, foreign key,
confidence vector, and semantic match.

## Tests

Focused deterministic tests cover:

- valid fact and evidence fixtures
- Professional workspace enforcement
- Business and Personal workspace rejection
- durable opaque IDs
- URL primary ID rejection
- evidence-required verification
- generated resume boundary
- partial support boundary
- title and date conflicts
- unsupported metrics, years, and proficiency labels
- project deployment and customer-use authority
- conflict detection
- verification eligibility non-mutation
- fixture immutability and test-only limits
- absence of resume generation, fit scoring, persistence, fetch, or AI paths
- S010.01 and S009 compatibility fields

Validation results:

- Focused S010.02B tests: `38/38` passed.
- S010.01 regression tests: `37/37` passed.
- S009 regression tests: `126/126` passed.
- S008 regression tests: `127/127` passed.
- Frontend build: passed. Existing `/operator/shopifixer-pilot` static
  generation warnings were observed and remain outside this mission.
- JSON validation: passed with `jq`.
- Diff whitespace check: passed.

## Boundary Safety

Confirmed by scope and tests:

- no real resume was read
- no real resume was modified
- no real career fact was created
- no Ross employment data was added
- no education data was added
- no certification data was added
- no accomplishment was invented
- no metric was invented
- no job fit was calculated
- no resume was generated
- no AI was invoked
- no Ollama listener existed during implementation
- no database or API path was added
- no route or UI was added
- no `/operator` behavior changed
- no S009 validator was modified

## Files Changed

- `staffordos/ui/operator-frontend/lib/staffordos/careerEvidenceContracts.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/careerEvidenceContracts.test.mjs`
- `staffordos/architecture/S010_02B_CAREER_EVIDENCE_CONTRACT_AND_STATIC_VALIDATOR.md`
- `staffordos/architecture/S010_02B_CAREER_EVIDENCE_CONTRACT_AND_STATIC_VALIDATOR.json`

## Known Limitations

- Contracts are static and fixture-backed only.
- No real Professional career record exists.
- No resume fact authority exists yet.
- No CandidateEvidence or JobFitAssessment contract exists yet.
- No persistence, import, parser, route, or UI exists.
- Verification eligibility does not verify facts.
- Future runtime use requires Professional owner identity, privacy, audit, and
  persistence authority.

## Rollback

Repository rollback:

`git revert <S010.02B commit SHA>`

No resume, database, model, identity, Stripe, ShopiFixer, Abando, application,
or deployment rollback should be required.

## Recommended Next Mission

`S010_02C_CANONICAL_RESUME_FACT_AND_POSITIONING_BOUNDARY`

Recommended scope:

- define resume-safe claim selection from CareerFact
- define ResumeFact and Positioning contracts
- keep real resumes out of scope unless separately authorized
- keep no generation, no fit scoring, no persistence, and no UI
