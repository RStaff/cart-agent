# S009.00 Read-Only Chief Of Staff Contract

## Gate

Mission: S009_00_READ_ONLY_CHIEF_OF_STAFF_CONTRACT

Status: READY_FOR_LOCAL_COMMIT

This mission defines the governed contract for the first StaffordOS Chief of Staff. It is documentation and contract design only.

No LLM, chat interface, model-provider SDK, runtime prompt, retrieval, embedding, vector search, persistence, adapter, orchestration, deployment, production change, `/operator` behavior change, ShopiFixer runtime change, Abando runtime change, authentication change, Stripe change, database change, API change, queue change, Packet change, execution workflow, or external AI call is implemented here.

## Checkpoint Authority

Verified HEAD at discovery:

`cf2825e644111dca7dae7835c7c9aaac086140e5`

Current branch at discovery:

`main`

Canonical authorities verified:

- `staffordos/architecture/STAFFORDOS_ARCHITECTURE_V1.md`
- `staffordos/architecture/S008_14_STAFFORDOS_OPERATING_MODEL_CONSOLIDATION_AND_S009_READINESS.md`
- `staffordos/architecture/S008_14_STAFFORDOS_OPERATING_MODEL_CONSOLIDATION_AND_S009_READINESS.json`
- `staffordos/architecture/S008_02_STAFFORDOS_OPERATOR_LANGUAGE_STANDARD.md`
- `staffordos/architecture/S008_04_MULTI_WORKSPACE_PLATFORM_AND_DECISION_MODEL_ARCHITECTURE.md`
- `staffordos/architecture/S008_05_UNIFIED_ACTION_AND_DECISION_MODEL.md`
- `staffordos/architecture/S008_06_WORKSPACE_CONTEXT_AND_OWNER_FIRST_SWITCHER_FOUNDATION.md`
- `staffordos/architecture/S008_08_OBJECTIVE_REGISTRY_AND_MISSION_ALIGNMENT_FOUNDATION.md`
- `staffordos/architecture/S008_09_DECISION_REGISTRY_AND_DECISION_MEMORY_FOUNDATION.md`
- `staffordos/architecture/S008_10_UNIFIED_ACTION_REGISTRY_FOUNDATION.md`
- `staffordos/architecture/S008_11_EVIDENCE_FOUNDATION.md`
- `staffordos/architecture/S008_12_PROOF_FOUNDATION_AND_OUTCOME_VERIFICATION.md`
- `staffordos/architecture/S008_13_LEARNING_FOUNDATION_AND_INSTITUTIONAL_MEMORY.md`

Certified baseline:

- S008 operating model is certified.
- `/operator` remains runtime-canonical.
- `/os` remains static, local, and read-only.
- Stafford Media is Available now.
- Professional and Personal remain Planned.
- `WorkspaceContext` is presentation-only and not authorization.
- No runtime AI Chief of Staff exists.
- No external AI provider is authorized.
- No runtime persistence or source adapter exists.
- No autonomous prioritization, decision, execution, proof verification, or learning confirmation is authorized.
- S007 deployed identity authority is not yet available.
- S009 may proceed only as a static, read-only, source-traced contract.

## Working Tree Exclusions

The worktree contains preexisting unrelated changes. They were inventoried and excluded.

Excluded categories:

- `S007_IDENTITY_OR_ISSUER`
- `RUNTIME_OR_DAEMON`
- `WEB_OR_PRISMA`
- `GENERATED`
- `MISSION_EVIDENCE`
- `PREEXISTING_UNRELATED`
- `UNKNOWN_REQUIRES_REVIEW`

Authorized S009.00 files only:

- `staffordos/architecture/S009_00_READ_ONLY_CHIEF_OF_STAFF_CONTRACT.md`
- `staffordos/architecture/S009_00_READ_ONLY_CHIEF_OF_STAFF_CONTRACT.json`
- `staffordos/architecture/schemas/s009_00_chief_of_staff_request.example.json`
- `staffordos/architecture/schemas/s009_00_source_snapshot.example.json`
- `staffordos/architecture/schemas/s009_00_source_traced_claim.example.json`
- `staffordos/architecture/schemas/s009_00_candidate_recommendation.example.json`
- `staffordos/architecture/schemas/s009_00_chief_of_staff_response.example.json`
- `staffordos/architecture/schemas/s009_00_validation_failure.example.json`
- `staffordos/architecture/schemas/s009_00_audit_envelope.example.json`

## Existing Chief Of Staff Discovery

No canonical Chief of Staff contract existed before this mission.

Repository evidence found:

- `STAFFORDOS_ARCHITECTURE_V1.md` defines the Chief of Staff as a future governed read-only layer and blocks autonomous action.
- `S008_14_STAFFORDOS_OPERATING_MODEL_CONSOLIDATION_AND_S009_READINESS.md` selects `S009_00_READ_ONLY_CHIEF_OF_STAFF_CONTRACT` as the next mission.
- `S008_05_UNIFIED_ACTION_AND_DECISION_MODEL.md` defines AI as a helper that may summarize, recommend, explain, draft, identify gaps, surface risks, and capture learning, but may not invent evidence, override authority, hide uncertainty, or mutate state without a governed path.
- `S008_06_WORKSPACE_CONTEXT_AND_OWNER_FIRST_SWITCHER_FOUNDATION.md` explicitly states that `/os` workspace context is presentation-only and not an authorization boundary.
- S008.08 through S008.13 provide the current static Objective, Decision, Action, Evidence, Proof, and Learning source objects.
- `operator_design_system_v1.md` requires evidence, status, and next action over decorative presentation, and prioritizes accuracy, provenance, and governance.
- `canonical_vocabulary_v1.md` governs AI usage rules: read before writing, use canonical meanings, never use forbidden terms, preserve implementation identifiers, and do not invent agents or business terms.
- `next_action_engine_provenance_audit_v1.md` classifies older next-action engine behavior as dormant intended authority rather than current runtime truth.
- S007 identity documents prove that deployed trusted identity and production verifier authority are not available yet.

This contract reconciles those sources. It does not adopt dormant runtime agents, operator-daemon mutation behavior, external model calls, or unrestricted repository search.

## Chief Of Staff Role

The StaffordOS Chief of Staff is a governed read-only reasoning layer.

It helps answer:

> What deserves my attention, why, and what should I do next?

It may:

- summarize authorized workspace state
- explain current Objectives
- explain existing Decisions
- explain why an Action is present
- trace an Action to Evidence
- show available Proof
- retrieve confirmed Learning
- identify missing information
- compare explicit alternatives
- explain uncertainty
- propose a candidate next action
- draft operator-facing summaries
- suggest questions the operator should answer
- identify where authority or evidence is missing

It may not:

- create operating truth silently
- mark a Decision as chosen
- approve anything
- execute an Action
- update an Objective
- verify Proof
- confirm Learning
- create Policy
- change permissions
- cross workspace boundaries
- access Professional or Personal information from Stafford Media
- send messages
- contact customers
- create payments
- mutate APIs
- write to databases
- trigger jobs
- modify files
- deploy code
- invent facts, metrics, customers, deadlines, confidence, or outcomes

## Authorized Input Contract

A future Chief of Staff request must use an explicit governed input envelope.

Conceptual fields:

- `request_id`
- `current_user_id`
- `workspace_id`
- `workspace_family`
- `active_role`
- `permission_summary`
- `capability_summary`
- `operator_question`
- `conversation_context`
- `allowed_source_types`
- `source_snapshot_ids`
- `current_time`
- `privacy_classification`
- `policy_context`
- `requested_output_type`

Trusted runtime identity must eventually provide:

- `current_user_id`
- `workspace_id`
- `active_role`
- permissions
- policy context

Until deployed identity exists, local prototypes may use static test fixtures only. They must not claim real authorization, real membership, role enforcement, or permission enforcement.

## Authorized Source Model

Initial static source types authorized by this contract:

- Workspace Registry
- Capability Registry
- Objective Registry
- Decision Registry
- Action Registry
- Evidence Foundation
- Proof Foundation
- Learning Foundation
- StaffordOS architecture documents
- explicit operator-provided question context

Future runtime source types may include:

- governed `/operator` read models
- ShopiFixer Packet summaries
- Abando summaries
- approved calendar data
- approved email data
- approved Professional data
- approved Personal data

Future runtime source types are not authorized by this mission.

Every source snapshot must provide:

- `source_id`
- `source_type`
- `workspace_id`
- `authority_classification`
- `freshness`
- `privacy_classification`
- immutable or mutable status
- content summary
- exact source reference
- limitations

No unrestricted repository search, filesystem access, email access, calendar access, internet access, or cross-workspace memory is authorized for the first prototype.

## Source Traceability Contract

Every material Chief of Staff claim must be traceable.

Claim categories:

- `SOURCE_FACT`
- `DERIVED_SUMMARY`
- `INFERENCE`
- `CANDIDATE_RECOMMENDATION`
- `UNKNOWN`
- `BLOCKED_BY_AUTHORITY`
- `PLANNED_CAPABILITY`

Each claim must include:

- `claim_id`
- `claim_type`
- plain-language statement
- supporting source IDs
- confidence classification
- limitation
- `workspace_id`
- authority status

Rules:

- A `SOURCE_FACT` must map directly to one or more authorized sources.
- A `DERIVED_SUMMARY` may combine sources but must preserve their meaning.
- An `INFERENCE` must be labeled as inference.
- A `CANDIDATE_RECOMMENDATION` must never appear as an approved action.
- `UNKNOWN` must be used when sources do not support an answer.
- `BLOCKED_BY_AUTHORITY` must be used when data or permission is missing.
- `PLANNED_CAPABILITY` must not be described as currently working.

Confidence classifications:

- High confidence
- Moderate confidence
- Low confidence
- Not enough evidence

No numeric confidence is defined by this contract.

## Response Contract

The first Chief of Staff response should render in operator language:

1. What deserves attention
2. Why it matters
3. What we know
4. What is uncertain or missing
5. Suggested next step
6. Required authority or approval
7. What success would prove
8. Sources

Conceptual response fields:

- `response_id`
- `workspace_id`
- `headline`
- `summary`
- `attention_items`
- `supporting_claims`
- `missing_information`
- `candidate_actions`
- `risks`
- `approvals_needed`
- `proof_expected`
- `learning_references`
- `sources`
- `limitations`
- `generated_at`

The response contract must remain useful without an AI provider. It must support deterministic rendering from static fixtures.

## Candidate Recommendation Contract

A recommendation is a candidate, not operating truth.

Each candidate recommendation supports:

- `recommendation_id`
- `workspace_id`
- operator-facing action
- `why_now`
- `objective_id`
- `decision_id`
- `supporting_action_id`
- `evidence_ids`
- `proof_status`
- `learning_ids`
- risk summary
- uncertainty
- authority needed
- expected result
- proof needed
- alternatives
- source trace
- recommendation status

Allowed statuses:

- Candidate
- Needs more information
- Needs authority
- Not recommended
- Ready for operator review

Forbidden statuses in the read-only Chief of Staff contract:

- Approved
- Executing
- Completed

## Missing-Information Contract

The Chief of Staff must be able to say:

- I do not have enough evidence.
- This information is not connected.
- This workspace is planned.
- I need operator confirmation.
- I cannot verify this from current sources.
- This action requires authority not present here.

Question types:

- clarification
- authority confirmation
- evidence request
- objective selection
- risk acceptance
- workspace selection
- source freshness check

Questions must be minimal and directly tied to a decision gap.

The Chief of Staff must not ask for secrets, passwords, raw tokens, private keys, unrestricted account access, or broad production credentials.

## Workspace Isolation Contract

Stafford Media:

- May use only authorized Stafford Media sources.

Professional:

- Planned only.
- No real professional data is authorized.

Personal:

- Planned only.
- No real personal, family, or media data is authorized.

Rules:

- No cross-workspace source mixing.
- No global memory by default.
- No hidden source reuse.
- No Stafford Media data in Professional or Personal responses.
- No future Professional or Personal data in Stafford Media responses.
- No guest or family access to Business sources.
- No employee access to Personal or Professional sources.
- No AI retrieval outside active workspace and permission context.
- Presentation-only `WorkspaceContext` is insufficient for enforcement.

## Authority And Governance Contract

Chief of Staff response authority states:

- Informational only
- Candidate recommendation
- Operator review required
- Approval required
- Blocked by missing authority
- Not authorized

The Chief of Staff has:

- no approval authority
- no execution authority
- no verification authority
- no policy authority
- no permission-management authority

Every future write or execution must hand off to a separate governed command path with explicit operator approval and audit. This mission does not design the write path.

## Unsupported-Claim Defenses

Mandatory defenses:

- source allowlist
- workspace filter
- explicit source snapshots
- claim-to-source mapping
- unsupported-answer fallback
- no hidden web knowledge
- no invented numeric values
- no invented current state
- no invented identities
- no invented customer or employer facts
- no inferred completion
- no inferred approval
- no inferred causality
- no silent conflict resolution
- no use of planned examples as facts

Safe fallback:

> I cannot verify that from the current StaffordOS sources.

## Conflict And Staleness Handling

When sources disagree, the Chief of Staff must:

- preserve both claims
- identify the conflicting sources
- compare authority and freshness
- avoid silently choosing one
- explain what must be checked
- downgrade confidence
- recommend operator review where necessary

Freshness classifications:

- Current
- Recent
- Historical
- Unknown
- Stale

This contract does not implement automatic freshness scoring.

## Audit Contract

A future request/response audit record must preserve:

- `request_id`
- user and workspace context
- source snapshot IDs
- source authorities
- model/provider identity, when later present
- prompt or instruction version
- generated claims
- source mappings
- recommendations
- limitations
- authority status
- operator feedback
- whether any recommendation was later accepted
- timestamp
- privacy classification

This mission does not persist audit records.

## Model-Provider Neutrality

The contract is provider-neutral.

Layers:

1. Source preparation
2. Governed reasoning request
3. Model adapter
4. Structured response validation
5. Source-trace validation
6. Operator-facing rendering
7. Audit capture

The contract should work later with:

- OpenAI
- Anthropic
- Google
- local models
- deterministic non-AI logic

No provider is selected or integrated by this mission.

## First Static Use Cases

| Use case | Operator question | Allowed sources | Expected output | Unsupported claims to reject | Authority status | Proof of correct behavior |
| --- | --- | --- | --- | --- | --- | --- |
| Explain the current static primary Action | What should I look at first? | Workspace, Capability, Action, Objective, Evidence, Proof | Candidate explanation for `Start My Day` with sources | Live ranking, AI selection, deadline, metric | Informational only | Claim traces to static Action and Evidence |
| Summarize current Objectives | What are we working toward? | Objective Registry and architecture docs | Three Stafford Media Objectives and limitations | Live progress, revenue, completion | Informational only | Each Objective traces to source artifacts |
| Explain a Decision and Evidence | Why is `/operator` still the working source? | Decision Registry, Evidence Foundation, S008.01, S008.14 | Decision rationale and supporting sources | Approval to migrate or redirect | Informational only | Decision ID and Evidence IDs are cited |
| Show what has and has not been proven | What do we know worked? | Proof Foundation and Evidence Foundation | Narrow Proof summaries and not-proven limits | Business outcome verification | Informational only | Expected result remains separate from observed outcome |
| Retrieve relevant Learning | What should StaffordOS remember here? | Learning Foundation and Proof Foundation | Confirmed Learning with applicability and limits | Policy creation or automatic priority change | Informational only | Learning references supporting Proof |

## Response Validation Rules

A future deterministic validator should reject a response when:

- a claim has no source
- a source belongs to another workspace
- a recommendation claims approval
- a recommendation claims execution
- a planned capability is presented as available
- a numeric value is unsupported
- an outcome is inferred from an expected result
- Evidence is mislabeled as Proof
- Learning is presented as Policy
- a source reference is missing
- authority status is absent
- limitations are omitted where required

No validator code is implemented in this mission.

## S009 Implementation Roadmap

Recommended order:

| Mission | Purpose | Identity dependency |
| --- | --- | --- |
| S009.00 Read-only Chief of Staff contract | Define governed source, claim, response, and validation contract | Can build before deployed identity |
| S009.01 Static fixture and deterministic response validator | Validate contract shape without AI or providers | Can build before deployed identity |
| S009.02 Read-only Chief of Staff demonstration surface | Render deterministic static responses inside `/os` | Can build before deployed identity if static only |
| S009.03 Provider-neutral model adapter interface | Define adapter boundary without choosing a provider | Can build before deployed identity if no calls occur |
| S009.04 Local or sandboxed model proof | Prove structured source-traced response under strict fixtures | Can build before deployed identity only if local/sandboxed and non-production |
| S009.05 Governed `/operator` read-model adapter discovery | Inventory live read sources and mutation risks | Can start before identity; runtime use needs authority |
| S009.06 Runtime identity and workspace enforcement integration | Bind trusted identity, membership, roles, permissions, and policy | Must wait for deployed identity |
| S009.07 Audited read-only production pilot | Use audited read-only Chief of Staff with production authority | Must wait for deployed identity |

Must wait for deployed identity:

- trusted user identity
- workspace membership
- role and permission claims
- server authorization
- invited users
- writes
- approvals
- execution
- proof verification
- learning confirmation
- production personalization

## Schema Examples

Documentation-only examples created:

- `staffordos/architecture/schemas/s009_00_chief_of_staff_request.example.json`
- `staffordos/architecture/schemas/s009_00_source_snapshot.example.json`
- `staffordos/architecture/schemas/s009_00_source_traced_claim.example.json`
- `staffordos/architecture/schemas/s009_00_candidate_recommendation.example.json`
- `staffordos/architecture/schemas/s009_00_chief_of_staff_response.example.json`
- `staffordos/architecture/schemas/s009_00_validation_failure.example.json`
- `staffordos/architecture/schemas/s009_00_audit_envelope.example.json`

These examples use static S008 identifiers only. They contain no secrets, personal data, customer data, job data, private credentials, or invented business metrics.

## Validation

Required validation:

- `jq` for every S009.00 JSON artifact.
- `git diff --check`.
- Commit-gate staged-file allowlist.

## Rollback

Rollback:

`git revert <S009.00 commit SHA>`

No application, database, identity, Stripe, ShopiFixer, Abando, or deployment rollback should be required.

## Final Classification

CHIEF_OF_STAFF_CONTRACT_READY_FOR_LOCAL_COMMIT
