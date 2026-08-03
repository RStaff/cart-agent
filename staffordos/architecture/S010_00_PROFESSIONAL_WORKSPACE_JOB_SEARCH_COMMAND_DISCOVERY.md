# S010.00 Professional Workspace Job Search Command Discovery

## Mission

`S010_00_PROFESSIONAL_WORKSPACE_JOB_SEARCH_COMMAND_DISCOVERY` establishes the
architecture boundary for a StaffordOS Job Search Command System inside the
Professional workspace.

This mission is read-only discovery and documentation. It does not create
routes, schemas, migrations, job records, resume records, model calls,
application submissions, communications, persistence, or runtime adapters.

S009 remains paused, not removed. The Chief of Staff foundations remain
certified for later reasoning and source-traced recommendations.

## Checkpoint Authority

- Starting HEAD verified: `e246ea254bec1735e7d2c4dbac9c2ca7be990de8`
- Branch observed: `main`
- No S010.00 artifact existed before this mission.
- Required authorities remain present:
  - `staffordos/architecture/STAFFORDOS_ARCHITECTURE_V1.md`
  - S008 workspace architecture, operator language standard, and Objective,
    Decision, Action, Evidence, Proof, and Learning foundations
  - S009 Chief of Staff contract, deterministic validator, provider-neutral
    adapter boundary, local provider certification, and Primary Action source
    adapter
  - current `/operator` runtime surfaces
  - current `/os` workspace context and Professional planned-state behavior

Certified baseline:

- Stafford Media remains Available now.
- Professional remains Planned.
- Personal remains Planned.
- `/operator` remains runtime-canonical.
- `/os` remains the emerging canonical shell.
- `WorkspaceContext` is presentation-only and is not authorization.
- S007 deployed identity authority is not available.
- Job Search is not yet a certified runtime capability.
- No automatic application, messaging, or external communication is authorized.

## Working Tree Exclusions

The repository contained broad preexisting unrelated modified and untracked
files. They were inventoried and excluded from this mission.

Excluded categories:

| Category | Examples | Handling |
| --- | --- | --- |
| `RUNTIME_OR_DAEMON` | `staffordos/operator_daemon/*`, loop output, preflight output, runtime snapshots | Not touched, staged, formatted, or included |
| `WEB_OR_PRISMA` | `web/prisma/schema.prisma`, web routes, packet authority files, migrations | Read-only inspection only where needed |
| `S007_IDENTITY_OR_ISSUER` | `staffordos/operator-issuer`, S007 identity and KMS artifacts | Not modified |
| `MISSION_EVIDENCE` | production, recovery, reconciliation, certification, and ShopiFixer mission records | Not modified |
| `GENERATED` | `staffordos/ui/operator-frontend/next-env.d.ts`, generated output JSON | Not modified |
| `PREEXISTING_UNRELATED` | agent, capability, lead, revenue, system-map, rule, and daemon output files | Not modified |
| `UNKNOWN_REQUIRES_REVIEW` | any dirty file not authorized for S010.00 | Excluded |

Authorized files for this mission only:

- `staffordos/architecture/S010_00_PROFESSIONAL_WORKSPACE_JOB_SEARCH_COMMAND_DISCOVERY.md`
- `staffordos/architecture/S010_00_PROFESSIONAL_WORKSPACE_JOB_SEARCH_COMMAND_DISCOVERY.json`

## Ollama Stopped State

Read-only process inspection found no listener on TCP port `11434`.

Ollama was not started, invoked, connected to `/os`, or used for discovery.

## Existing Job-Search Authority

Repository search found no certified Professional Job Search runtime and no
canonical career data store.

| Artifact | Purpose found | Authority | Classification |
| --- | --- | --- | --- |
| `workspaceRegistry.ts` | Defines `professional` as a planned owner-private workspace with Job Search and My Job modes | Static S008 authority | `CANONICAL_REUSABLE` |
| `capabilities.ts` | Defines `professional-job-search`, career materials, interview prep, and current-role capabilities as planned | Static S008 authority | `CANONICAL_REUSABLE` |
| `homePresentation.ts` | States no jobs, applications, resumes, employers, meetings, or recommendations are connected | Static S008 authority | `CANONICAL_REUSABLE` |
| `objectiveRegistry.ts` | Contains planned Professional objectives `Secure the right role` and `Succeed in the current role` | Static S008 authority | `PARTIAL_REUSABLE` |
| S008 Decision, Action, Evidence, Proof, Learning foundations | Explicitly keep Professional empty of current records | Static S008 authority | `CANONICAL_REUSABLE` |
| S009 Chief of Staff fixtures | Professional source fixture is planned-only and contains no real professional data | Static S009 authority | `CANONICAL_REUSABLE` |
| `candidate_opportunities/*` | Generated merchant checkout and growth opportunities | Commerce runtime/generated | `NOT_SUITABLE` for career use; concept reuse only |
| `web/src/jobs/*`, Prisma `Job` | Background execution queue keyed by shop domain, packet, attempts, and status | Runtime queue | `NOT_SUITABLE` for employment records |
| `/operator` lead, campaign, relationship surfaces | Business CRM, revenue, customer, and merchant operating views | Runtime-canonical Business | `PARTIAL_REUSABLE` conceptually, not directly |
| Resume or career artifacts | No canonical resume file, resume-fact registry, or Professional resume store found | No current authority | `NEEDS_REVIEW` |
| Bosch rejection | No durable repository record found | Continuity context only | `HISTORICAL_EVIDENCE` only after future intake |

Search hits for `resume` in runtime code refer to checkout recovery URLs, not
Ross career resumes.

## StaffordOS Placement

Job Search belongs inside the Professional workspace, in the Job Search mode.
It should not become a standalone job board and should not duplicate StaffordOS
as a second operating system.

Recommended placement:

- Workspace: `Professional`
- Mode: `Job Search`
- Primary surfaces:
  - Job Command
  - Opportunities to Review
  - Application Pipeline
  - Follow-Up Command
  - Interview Command
  - Outcomes and Learning

These should become Professional capability lenses over shared StaffordOS
objects, with a small number of Professional-specific durable objects where the
shared objects cannot represent career facts safely.

## Reuse Analysis

| Primitive | Decision | Reason |
| --- | --- | --- |
| Workspace | `REUSE_WITH_PROFESSIONAL_SCOPE` | Professional workspace already exists as owner-private planned architecture |
| Capability | `EXTEND_NARROWLY` | Planned Job Search capability exists but needs a certified contract |
| Objective | `REUSE_WITH_PROFESSIONAL_SCOPE` | `Secure the right role` can become the parent objective after activation |
| Decision | `REUSE_WITH_PROFESSIONAL_SCOPE` | Application choices and strategy choices need evidence and authority |
| Action | `REUSE_WITH_PROFESSIONAL_SCOPE` | Next job-search step should remain explicit and read-only until acted on |
| Evidence | `REUSE_WITH_PROFESSIONAL_SCOPE` | Job fit must cite verified candidate evidence and job-source evidence |
| Proof | `REUSE_WITH_PROFESSIONAL_SCOPE` | Submission, follow-up, interview, offer, and rejection proof are separate from expectations |
| Learning | `REUSE_WITH_PROFESSIONAL_SCOPE` | Lessons require outcome evidence and must not become policy automatically |
| Relationship | `EXTEND_NARROWLY` | Business relationship resolver contains contact and merchant assumptions; career relationship concepts need Professional privacy |
| Contact | `EXTEND_NARROWLY` | Recruiter and hiring-manager contacts require owner-private Professional handling |
| Lead | `DO_NOT_REUSE` directly | Merchant-lead assumptions, outreach state, and revenue language make direct reuse unsafe |
| Campaign | `REUSE_CONCEPT_ONLY` | Search campaigns may be useful, but current campaign model is commercial and revenue-oriented |
| Task | `REUSE_CONCEPT_ONLY` | Follow-up tasks can reuse next-action ideas but need Professional state and approval |
| Activity/Event | `REUSE_CONCEPT_ONLY` | Append-only history is useful; existing events are customer and execution oriented |
| Document/Artifact | `EXTEND_NARROWLY` | Resume versions, cover letters, and application copies require canonical fact protection |
| Approval | `REUSE_CONCEPT_ONLY` | Human approval gates are required, but runtime identity is not deployed |
| Audit | `REUSE_CONCEPT_ONLY` | Every submission, status change, and external communication needs an audit trail later |
| Next Action | `REUSE_WITH_PROFESSIONAL_SCOPE` | The operating question remains "What should Ross do next?" |

## Canonical Job-Search Objects

| Object | Need | MVP necessity | Notes |
| --- | --- | --- | --- |
| `JobOpportunity` | Durable record for a role Ross may pursue | Required | Stores source, company, role, location, work arrangement, status, and privacy |
| `JobSource` | Provenance for the listing or referral | Required | Keeps listing URL, pasted text, referral source, or operator-entered source separate from interpretation |
| `Company` | Employer identity and context | Optional in first slice | Can be embedded in `JobOpportunity` until duplicate company records matter |
| `JobRequirement` | Extracted or operator-confirmed requirement | Required | Must cite the job source and preserve requirement text |
| `CandidateEvidence` | Verified Ross evidence mapped to requirements | Required for fit, but may begin as fixtures | Must cite resume facts, verified work, education, certifications, or approved project evidence |
| `JobFitAssessment` | Explainable recommendation and gaps | Required | No unexplained percentage score |
| `Application` | Application attempt and state | Required after intake contract | Tracks state and approval before submission |
| `ApplicationEvent` | Audit history for status changes | Required before runtime use | Needed for idempotency and proof |
| `ResumeVersion` | Exact resume version authority | Required before applying | No resume edits in S010.00 |
| `ApplicationResumeLink` | Which resume was used for which application | Required before submission | Prevents silent overwrite or ambiguity |
| `Contact` | Recruiter, hiring manager, referral, interviewer | Deferred | Owner-private and no automatic communication |
| `JobRelationship` | Relationship context around a company or person | Deferred | Must avoid business CRM assumptions |
| `FollowUpTask` | Due follow-up after application or contact | Required after application state exists | No automatic sending |
| `Interview` | Interview stage and preparation command | Deferred from first MVP | No calendar or email connection |
| `InterviewEvent` | Interview history | Deferred | Requires operator-confirmed event capture |
| `Offer` | Offer evaluation and approval boundary | Deferred | Compensation is sensitive |
| `JobOutcome` | Captured outcome such as rejection, withdrawal, offer, or acceptance | Required before Learning | Must distinguish supplied reason from interpretation |
| `JobSearchLearning` | Governed lesson from outcomes | Deferred until outcomes exist | Follows S008.13; one rejection is not universal |
| `JobSearchNextAction` | Current Professional next action | Required for command surface | Candidate until Ross approves or acts |

The first MVP should create contracts for `JobOpportunity`, `JobSource`,
`JobRequirement`, `CandidateEvidence`, `JobFitAssessment`, and
`JobSearchNextAction` before persistence.

## Workflow and State Model

Canonical workflow:

`Job discovery -> Qualification and fit evaluation -> Evidence-based positioning -> Resume selection -> Narrow resume tailoring -> Human approval -> Application submission -> Follow-up -> Recruiter and relationship tracking -> Interview preparation -> Interview progression -> Offer evaluation -> Outcome capture -> Learning and strategy refinement`

Recommended application states:

| State | Operator-facing label | Entry condition | Approval | Terminal |
| --- | --- | --- | --- | --- |
| `DISCOVERED` | Found | Role source captured | None | No |
| `UNDER_REVIEW` | Reviewing fit | Ross or StaffordOS is evaluating requirements | None | No |
| `QUALIFIED` | Worth applying | Fit assessment supports an apply path | Ross review before submission | No |
| `REJECTED_BY_ROSS` | Passed on this role | Ross chooses not to pursue | Ross decision | Yes |
| `RESUME_PREPARATION` | Preparing materials | Resume version or tailored copy is needed | Ross review required | No |
| `READY_FOR_APPROVAL` | Ready for Ross review | Materials and evidence are assembled | Ross approval required | No |
| `APPROVED_TO_APPLY` | Approved to apply | Ross approves submission | Ross approval recorded | No |
| `SUBMITTED` | Applied | Submission proof is captured | Submission must be human-approved | No |
| `FOLLOW_UP_DUE` | Follow-up due | Follow-up date or condition is reached | Approval before sending | No |
| `RECRUITER_CONTACT` | Recruiter conversation | Contact or response exists | Approval before communication | No |
| `SCREENING` | Screening | Employer/recruiter screening stage confirmed | Operator confirmation | No |
| `INTERVIEW` | Interview | Interview stage confirmed | Operator confirmation | No |
| `FINAL_INTERVIEW` | Final interview | Final-stage interview confirmed | Operator confirmation | No |
| `OFFER` | Offer | Offer received and source captured | Ross decision required | No |
| `WITHDRAWN` | Withdrawn | Ross withdraws | Ross approval | Yes |
| `REJECTED_BY_EMPLOYER` | Not selected | Rejection captured from source | Source or Ross confirmation | Yes |
| `CLOSED` | Closed | No further action remains | Ross or source confirmation | Yes |

Refinement needed before implementation:

- `FOLLOW_UP_DUE` may be a task state rather than an application state.
- `RECRUITER_CONTACT` may be a relationship event rather than an application state.
- `SCREENING`, `INTERVIEW`, and `FINAL_INTERVIEW` may be stage values inside an Interview model.

## Fit-Evidence Model

Each job requirement should map to verified Ross evidence only.

Evidence classifications:

- `PROVEN`
- `PARTIAL`
- `TRANSFERABLE`
- `MISSING`
- `UNKNOWN`

Each mapping must preserve:

- requirement text
- requirement type
- importance
- evidence reference
- evidence classification
- explanation
- limitation
- source authority
- resume compatibility
- operator review status

Allowed evidence authorities include only verified material from canonical
resumes, verified employment history, verified education, verified
certifications, StaffordOS work, ShopiFixer work, Abando work, AI automation
work, CI/CD and DevOps work, platform architecture, project and program
leadership, PMP background, analytics, data, and marketing technology.

Rules:

- no invented equivalence
- no unsupported proficiency level
- no unsupported years of experience
- no inflated title
- no fabricated result
- no silent conversion of transferable experience into proven experience

## Explainable Recommendation Model

Job Search should not use one unexplained AI percentage.

Fit dimensions:

- required-skill coverage
- preferred-skill coverage
- role-level alignment
- domain alignment
- leadership alignment
- technical alignment
- compensation alignment
- location and work-arrangement alignment
- evidence strength
- application effort
- strategic value
- major blockers

Allowed recommendation outcomes:

- `STRONG_APPLY`
- `APPLY_WITH_POSITIONING`
- `REVIEW_REQUIRED`
- `LOW_PRIORITY`
- `DO_NOT_APPLY`
- `INSUFFICIENT_EVIDENCE`

Each recommendation must include:

- plain-language conclusion
- strongest supporting evidence
- gaps
- blockers
- assumptions
- uncertainty
- resume recommendation
- next action
- approval requirement
- source references

Numerical scoring remains future design and requires validation authority before
use.

## Resume Authority

No canonical repository-backed resume file, career resume-fact registry, or
Professional resume store was found.

Future rules:

- preserve verified facts
- tailor positioning, not history
- track exact resume version
- record source facts
- require Ross review
- block unsupported additions
- retain application-specific copy
- mark stale versions
- never overwrite canonical authority silently

No resume, PDF, Word file, or career artifact was created or modified.

## Relationship and Follow-Up Model

Existing relationship and lead surfaces are Business runtime models. They prove
useful concepts: identity resolution, relationship state, next action, conflicts,
timestamps, source records, and follow-up status. They are not safe for direct
career reuse because they include merchant, customer, payment, packet, revenue,
and outreach assumptions.

Future Professional relationship fields may include:

- person
- company
- role
- relationship type
- date contacted
- channel
- current state
- last response
- next follow-up date
- next action
- communication drafts
- approval state
- source
- privacy classification

Communication boundary:

- drafting may be AI-assisted later
- approval belongs to Ross
- sending must be a separate explicit action
- delivery confirmation is proof, not intent
- response capture must preserve source and date

No communication may be sent automatically.

## Interview Model

Future Interview Command read model fields:

- company
- role
- interview stage
- interviewer
- scheduled date
- requirements
- preparation questions
- evidence-backed stories
- architecture examples
- likely objections
- questions Ross should ask
- follow-up due date
- preparation status
- evidence sources
- approval state

Automatically derivable later:

- requirement summaries from a captured job source
- draft preparation questions
- candidate story suggestions tied to verified evidence
- known gaps and uncertainties

Operator-confirmed later:

- scheduled date
- interviewer identity
- stage
- feedback
- follow-up sent
- outcome

No calendar, email, employer, or external account connection is authorized.

## Outcome and Learning Model

Bosch continuity context:

- Company: Bosch / Robert Bosch LLC
- Role: Digital Solutions and Automation Specialist
- Location: Watertown, Massachusetts
- Outcome: Rejected
- Stage: Application review
- Reason supplied: None

Repository discovery found no durable Bosch outcome record. Therefore this is
continuity context only until a future intake mission creates a governed record.

Allowed interpretation:

- Standard rejection with no evidence-supported reason supplied.

Not allowed:

- guessing that the rejection was caused by age, compensation, resume quality,
  experience, ATS, internal candidates, or any other unsupported reason.

Future outcome capture must include:

- outcome type
- stage
- date
- supplied reason
- source
- evidence
- Ross interpretation
- system interpretation
- confidence
- reusable learning
- applicability
- non-applicability
- follow-up status

Learning must follow S008.13 authority rules. One rejection must not become a
universal rule.

## Privacy and Workspace Boundary

Job Search is owner-private Professional data by default.

Privacy classifications:

| Data | Privacy |
| --- | --- |
| job descriptions | Owner-private Professional unless source is public and copied with authority |
| resumes | Owner-private Professional |
| contact details | Owner-private Professional and potentially third-party sensitive |
| application answers | Owner-private Professional |
| recruiter communication | Owner-private Professional |
| interview notes | Owner-private Professional |
| compensation | Highly sensitive owner-private Professional |
| offers | Highly sensitive owner-private Professional |
| rejection outcomes | Owner-private Professional |
| personal reflections | Owner-private Professional |
| learning | Owner-private Professional unless explicitly approved for cross-workspace reuse |

Rules:

- no Stafford Media employee or contractor access by default
- no Family or guest access
- no Personal workspace mixing
- no Business workspace use without explicit cross-workspace authority
- StaffordOS, ShopiFixer, and Abando accomplishments may be cited only through
  explicit approved candidate evidence
- presentation-only `WorkspaceContext` is not enforcement
- runtime use eventually requires S007 identity and server authorization

## AI and Human Authority

AI may later prepare and recommend:

- discover roles
- summarize descriptions
- extract requirements
- map evidence
- identify gaps
- recommend priority
- select a resume candidate
- draft supported tailoring
- draft application responses
- draft follow-ups
- prepare interview material
- summarize outcomes
- propose lessons

AI may not:

- submit an application
- send communication
- contact a recruiter
- accept an offer
- decline an offer
- withdraw an application
- change canonical resume facts
- invent evidence
- represent Ross externally
- schedule interviews
- disclose private information
- infer rejection reasons as fact

Future approval gates:

- opportunity source intake approval when source authority is unclear
- candidate evidence approval before it supports fit
- resume version approval before use
- tailored material approval before submission
- application submission approval
- external communication approval
- interview outcome confirmation
- offer accept, decline, or negotiate approval
- learning confirmation

## First MVP Definition

Smallest useful MVP:

`JobOpportunity intake -> durable source capture -> requirement extraction -> evidence mapping -> explainable recommendation -> next-action presentation`

The first MVP should exclude:

- automatic job discovery
- automatic submission
- messaging
- calendar integration
- email integration
- offer automation
- full relationship management
- full interview workflow
- external AI provider integration
- multi-user access

The first implementation can begin before deployed S007 identity only as a local,
owner-only, fixture-backed contract or library implementation. Runtime
Professional use must wait for identity, workspace membership, and server
authorization.

## Route and UI Strategy

Recommended future route shape:

- `/os/professional`
- `/os/professional/jobs`
- `/os/professional/jobs/[jobId]`
- `/os/professional/applications`
- `/os/professional/interviews`

This is preferred over `/os/jobs` because it preserves workspace clarity,
future My Job mode separation, privacy expectations, and later authorization
boundaries.

Operator-facing labels:

- Job Command
- Opportunities to Review
- Applications
- Follow-Ups
- Interviews
- Outcomes and Learning

No route or UI change is authorized in S010.00.

## Data and Persistence Options

| Option | Classification | Reason |
| --- | --- | --- |
| Local static fixtures | `SUITABLE_FOR_LOCAL_MVP` | Can prove contracts without identity or persistence |
| S008 static registries | `SUITABLE_FOR_LOCAL_MVP` for planned metadata only | Existing authority is planned-state, not job truth |
| Append-only JSON | `TEMPORARY_ONLY` | Useful for local proof after contract approval, but not production authority |
| Existing Prisma database | `SUITABLE_AFTER_IDENTITY` | Runtime store exists, but current schema is ShopiFixer/Abando oriented and must not be modified here |
| Prisma `Job` queue | `NOT_SUITABLE` | Technical execution queue, not employment application state |
| Application database tables | `SUITABLE_FOR_PRODUCTION` only after design | Requires schema, authorization, privacy, audit, and migration authority |
| Separate Professional storage | `NEEDS_MORE_DISCOVERY` | Likely correct for production privacy, but identity and data authority are not ready |

No schema, migration, database record, or persistence artifact was created.

## Chief of Staff Compatibility

Future Job Search source types should follow S009 contracts:

- `job_opportunity_snapshot`
- `job_fit_assessment`
- `application_state_snapshot`
- `follow_up_snapshot`
- `interview_snapshot`
- `job_outcome_snapshot`
- `job_search_learning`

Required source fields:

- source ID
- Professional workspace ID
- authority classification
- privacy classification
- freshness
- limitations
- exact source reference
- excluded fields
- permission requirement

No Job Search source is authorized for model use in this mission. Ollama was not
invoked. The S009 validator was not modified.

## Bosch Outcome Disposition

No repository-backed Bosch rejection record was found.

Disposition:

- record remains continuity context only
- future intake path should be a `JobOutcome` tied to a `JobOpportunity` and
  `Application`
- supplied reason must be recorded as `None`
- interpretation must remain limited to "standard rejection with no
  evidence-supported reason supplied"
- no learning may be confirmed from this outcome until S008.13 evidence and
  applicability rules are satisfied

## Gap and Risk Register

| Risk or gap | Evidence | Likelihood | Impact | Mitigation | Stop condition | Future authority |
| --- | --- | --- | --- | --- | --- | --- |
| No canonical job opportunity store | No Job Search runtime found | High | High | Start with contracts and fixtures | Runtime records requested before contract | S010.01 contract |
| No canonical resume-fact authority | No resume registry found | High | High | Create separate resume authority mission before applying | Resume tailoring tries to add facts | Resume evidence authority |
| Possible unsupported historical resume content | No canonical fact registry | Medium | High | Treat existing resumes as unverified until reviewed | Unsupported claim enters application | Ross approval |
| No application-state authority | Professional has no current Actions, Decisions, Evidence, Proof, or Learning | High | High | Define states before persistence | Submission state claimed without proof | Application contract |
| No source ingestion contract | No job-source store exists | High | Medium | Capture source text and provenance first | Job facts appear without source | JobSource contract |
| No identity enforcement | `WorkspaceContext` is presentation-only | High | High | Local fixture-only until S007 runtime authority | Runtime Professional data exposed | S007 identity |
| Sensitive Professional data | Workspace architecture marks Professional owner-private | High | High | Owner-private by default and no sharing | Business, Personal, Family, or guest access appears | Server authorization |
| Duplicate CRM/job pipeline risk | Business lead/campaign models exist | Medium | Medium | Reuse concepts, not merchant schemas | Career opportunity forced into merchant lead model | Professional model contract |
| Application automation risk | No external action authority exists | Medium | High | Human approval before submission | Send or submit control appears | Approval workflow |
| Fabricated-fit risk | No resume evidence authority exists | High | High | Requirement mapping must cite evidence | Unsupported qualification appears | CandidateEvidence review |
| Stale job listing risk | No freshness model for job sources | Medium | Medium | Store captured_at and source_updated_at | Stale role shown as current | Freshness contract |
| Uncontrolled resume variants | No version registry found | High | High | Track exact resume version per application | Resume overwritten or ambiguous | ResumeVersion contract |
| Communication-without-approval risk | Existing lead actions include POST mutation | Medium | High | Draft/approve/send separation | Automatic message path added | Communication approval |
| External-source terms risk | Job-board scraping not authorized | Medium | Medium | Manual source capture first | Scraping implemented without authority | Source policy review |
| Model hallucination risk | S009 validates model output but Professional sources do not exist | Medium | High | Keep S009 source snapshots and validator gate | Unsourced AI output shown | S009 validation |
| Overfitting from one rejection | Bosch has no supplied reason | Medium | Medium | Record as one outcome only | Universal lesson from one rejection | Learning review |
| Metric fixation on volume | No validated scoring doctrine | Medium | Medium | Use explainable dimensions, no arbitrary weights | Application count becomes primary success metric | Strategy review |

## Selected Next Implementation Slice

Selected next mission:

`S010_01_JOB_OPPORTUNITY_AND_REQUIREMENT_CONTRACT`

Scope:

- define static contracts for `JobOpportunity`, `JobSource`, `JobRequirement`,
  `CandidateEvidence`, `JobFitAssessment`, and `JobSearchNextAction`
- create deterministic owner-private Professional fixtures only
- define source, privacy, evidence, and approval boundaries
- add focused contract tests if implementation is authorized by that mission
- create documentation and local commit

Dependencies:

- S008 workspace, capability, Objective, Decision, Action, Evidence, Proof, and
  Learning foundations
- S009 source-tracing and validator doctrine
- S010.00 discovery

Exclusions:

- no routes
- no database or Prisma
- no resume edits
- no application submissions
- no email, calendar, or messaging
- no model invocation
- no runtime adapter
- no multi-user access

Expected outcome:

- StaffordOS has a narrow, owner-private, source-backed Job Opportunity and
  Requirement contract ready for a local MVP without pretending Professional is
  runtime-backed.

Rejected candidates:

- `S010_01_CANONICAL_RESUME_AND_CANDIDATE_EVIDENCE_AUTHORITY`: important, but
  the job and requirement source contract should land first so resume evidence
  has a target.
- `S010_01_JOB_OPPORTUNITY_LOCAL_INTAKE_FOUNDATION`: premature because
  persistence authority is not clear.
- `S010_01_PROFESSIONAL_WORKSPACE_JOB_COMMAND_SHELL`: premature because no
  contract-backed data exists.
- `S010_01_BOSCH_OUTCOME_CAPTURE`: too narrow as first slice and should wait
  for JobOpportunity/Application contracts.

## Artifacts Created

- `staffordos/architecture/S010_00_PROFESSIONAL_WORKSPACE_JOB_SEARCH_COMMAND_DISCOVERY.md`
- `staffordos/architecture/S010_00_PROFESSIONAL_WORKSPACE_JOB_SEARCH_COMMAND_DISCOVERY.json`

## Validation

Validation results:

- `jq . staffordos/architecture/S010_00_PROFESSIONAL_WORKSPACE_JOB_SEARCH_COMMAND_DISCOVERY.json` passed.
- `git diff --check` passed.
- Governed commit gate passed with only the two S010.00 artifacts staged.

No tests, build, route probes, dev server, database command, model command, or
Ollama command were required because this mission changed documentation only.

## Rollback

Rollback:

`git revert <S010.00 commit SHA>`

No application, resume, database, identity, model, Stripe, ShopiFixer, Abando,
or deployment rollback should be required.

## Final Classification

`JOB_SEARCH_DISCOVERY_COMMITTED`
