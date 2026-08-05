# J001.03A Private Job Requirement Extraction and Evidence Mapping Workflow

Date: 2026-08-05

Status: `PRIVATE_JOB_ANALYSIS_WORKFLOW_DOCUMENTED`

## Checkpoint Authority

This mission follows the committed authority chain through:

- P001 platform runtime and provider roadmap
- G004.01 minimal operator write-surface isolation
- S007.01I through S007.01I4 OAuth governance and local issuer configuration authority
- S010 Career Evidence contracts and private intake
- J001 Job Command and private Job Opportunity intake bridge
- G003 adapter-only read-model and staticity authority
- A001 Asset Authority architecture

The workflow preserves `/operator` and `/os` boundaries. It does not connect private Job Search data to a UI, API, route, provider, database, OAuth flow, or write surface.

## Private Workflow

J001.03A defines a local, owner-controlled workflow for one operator-selected private Job Opportunity at a time:

1. Load the selected private Opportunity and matching private intake record from the approved external Job Search root.
2. Load existing private Career facts and Career evidence from the approved external Career root.
3. Extract only explicit listing requirements.
4. Map requirements to existing Career facts and evidence.
5. Classify each mapping as `PROVEN`, `PARTIAL`, `TRANSFERABLE`, `MISSING`, or `UNKNOWN`.
6. Create an explainable fit assessment without an employer-success probability.
7. Create a private positioning brief and role-specific review queue.
8. Save the real outputs only under the external private Job Search analysis root after operator approval.

Real company names, role titles, listing text, source URLs, compensation, recruiter/contact details, notes, resume filenames, Career fact statements, and evidence excerpts are not committed.

## Contracts Reused

The workflow reuses existing StaffordOS contracts and boundaries:

- `PrivateNormalizedJobOpportunity` from J001.02
- `JobRequirement` concepts from S010/J001 Job Search authority
- `CareerFact` and `CareerEvidence` from S010 Career Evidence authority
- G001 private-data containment rules
- G003 adapter/staticity rule that private UI display remains blocked without server authorization
- G004.01 write isolation, which remains unchanged

No duplicate Job Opportunity, Career Evidence, Asset, identity, provider, database, or application-submission model is introduced.

## Requirement Extraction

The extractor is deterministic and local. It preserves:

- source Opportunity ID
- source ID
- requirement text
- required, preferred, responsibility, informational, or unclear level
- category
- explicit years when stated
- explicit technology, degree, certification, location, compensation, work arrangement, or employment type when stated
- source trace
- ambiguity
- operator-review status
- limitations

It does not invent years, proficiency, mandatory status, seniority, certification authority, compensation meaning, or employer intent.

## Evidence Mapping

The mapper uses existing private Career facts and Career evidence only.

Classification rules:

- `PROVEN`: directly supported by reviewed evidence that is not resume wording alone.
- `PARTIAL`: some support exists, but scope, recency, depth, or review state is incomplete.
- `TRANSFERABLE`: adjacent evidence-supported capability may be relevant, but exact-role experience is not proven.
- `MISSING`: no supporting fact or evidence exists.
- `UNKNOWN`: evidence is incomplete, conflicting, unreviewed, or insufficient to classify safely.

Resume wording alone does not verify a fact. Repository-backed or local testing work does not become production, customer, or professional use without separate evidence.

## Role-Specific Review

The workflow creates a role-specific review queue capped at the highest-impact questions for the selected role. It does not require Ross to complete the full historical Career review queue before gaining value.

Questions prioritize required, missing, unknown, and transferable mappings. They are private records and are not committed.

## Assessment Model

The assessment evaluates separate dimensions:

- required-skill coverage
- preferred-skill coverage
- technical alignment
- leadership alignment
- product/program alignment
- domain alignment
- production-system evidence
- AI and automation alignment
- architecture alignment
- location/work-arrangement alignment
- compensation alignment when explicitly known
- evidence strength
- major blockers
- application effort
- strategic value

Allowed final recommendations are:

- `STRONG_APPLY`
- `APPLY_WITH_POSITIONING`
- `REVIEW_REQUIRED`
- `LOW_PRIORITY`
- `DO_NOT_APPLY`
- `INSUFFICIENT_EVIDENCE`
- `ALREADY_APPLIED_MONITOR`

For an operator-confirmed manual external submission, the workflow records `SUBMITTED_MANUAL_EXTERNAL` and recommends monitoring or follow-up preparation rather than applying again.

## Positioning Boundary

The private positioning brief preserves:

`FACT -> EVIDENCE -> POSITIONING`

It includes supported themes, evidence to emphasize, transferable experience requiring careful wording, unsupported claims to avoid, a primary gap, recommended resume emphasis, project examples, interview story prompts, and review questions.

It does not create or mutate a resume.

## Application Event Boundary

Manual applications may be recorded only when Ross confirms them. Such events are classified as:

- `SUBMITTED_MANUAL_EXTERNAL`
- submission channel `MANUAL_EXTERNAL`
- submitted by Ross
- not submitted by StaffordOS

Unknown submitted date, resume filename, cover-letter status, and employer response remain unknown until Ross records them.

## Private Outputs

After operator approval, the workflow writes real outputs under:

`$HOME/.staffordos/private/professional/job-search/analysis/<opportunity>/<run>/`

Artifacts:

- `requirements.json`
- `requirement_evidence_mappings.json`
- `fit_assessment.json`
- `positioning_brief.json`
- `role_review_queue.json`
- `application_event.json`
- `next_action.json`
- `processing_audit_summary.json`

The output directory and JSON files are written with owner-private permissions. Prior outputs are not overwritten; each run has a versioned run directory.

## Local Proof Result

One operator-selected private Opportunity was processed after explicit approval to save private outputs. Redacted result:

- requirements extracted: 33
- mapping coverage: 0 `PROVEN`, 0 `PARTIAL`, 3 `TRANSFERABLE`, 2 `MISSING`, 28 `UNKNOWN`
- application state: `SUBMITTED_MANUAL_EXTERNAL`
- final recommendation: `ALREADY_APPLIED_MONITOR`
- role-specific review questions: 15
- next action: monitor employer response and prepare role-specific follow-up evidence

No private output was committed.

## Tests

Focused tests verify:

- required and preferred requirements remain distinct
- ambiguous requirements remain ambiguous
- explicit years are preserved and unstated years are not invented
- source trace is preserved
- Career facts without evidence cannot become `PROVEN`
- partial and transferable support remain distinct
- resume wording alone does not verify a fact
- repository-backed or local testing work does not become production or customer use
- no employer-success probability or unexplained score is generated
- manual submission remains distinct from StaffordOS submission
- already-applied Opportunities do not recommend applying again
- no provider, API, database, AI, application submission, message send, or resume mutation behavior exists
- real outputs remain outside Git
- G004.01 write isolation remains unchanged

## Limitations

- The extractor is deterministic and conservative; it does not replace Ross review.
- The private Career evidence set still contains unresolved review items, so many mappings may remain `UNKNOWN`.
- No UI surface displays the real private analysis.
- No application, message, provider fetch, or resume mutation is authorized.
- No OAuth, identity, authorization, or `/os` connection is added.

## Rollback

Repository rollback:

`git revert <J001.03A commit SHA>`

This removes the reusable workflow code and committed documentation only. Private output rollback is separate and must not be automatic; it would require Ross to delete the approved external private analysis artifacts if he chooses.

## Next Mission

Selected next mission:

`J001_03B_PRIVATE_JOB_ANALYSIS_OPERATOR_SURFACE`

Reason: J001.03A creates private analysis artifacts, but Ross still needs an ergonomic local operator surface to select one private Opportunity, review redacted summaries, answer the 5-15 role-specific questions, and open the private artifacts without exposing them through `/os` or requiring full OAuth deployment.
