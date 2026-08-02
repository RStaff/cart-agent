# S009.01 Static Fixture and Deterministic Response Validator

## Mission

S009_01_STATIC_FIXTURE_AND_DETERMINISTIC_RESPONSE_VALIDATOR implements the first deterministic validator for the read-only Chief of Staff contract. It does not generate a response. It checks whether a prepared structured response follows the S009.00 source, workspace, authority, limitation, and recommendation rules.

## Checkpoint Authority

- Starting HEAD verified: `e176416802e6dcb56ee3c9e04a0e4111b9c4395a`
- Branch observed: `main`
- S009.00 contract artifacts were present:
  - `staffordos/architecture/S009_00_READ_ONLY_CHIEF_OF_STAFF_CONTRACT.md`
  - `staffordos/architecture/S009_00_READ_ONLY_CHIEF_OF_STAFF_CONTRACT.json`
  - seven S009.00 documentation-only schema examples under `staffordos/architecture/schemas/`
- S008 canonical static model files were present for Workspace, Capability, Objective, Decision, Action, Evidence, Proof, and Learning.
- No canonical Chief of Staff response validator existed before this mission.

## Working-Tree Exclusions

The broader working tree contained preexisting unrelated modified and untracked work. These files were inventoried and excluded from S009.01 staging and commit scope.

Excluded categories:

- S007 identity or issuer artifacts
- runtime and daemon outputs
- web, Prisma, and migration work
- generated frontend files
- ShopiFixer, production, recovery, reconciliation, and mission-evidence artifacts
- unknown unrelated files requiring separate review

## Existing Validator Discovery

Discovery reviewed the S009.00 contract, S009.00 schema examples, S008 static model files, current package dependencies, and existing test conventions. No existing structured Chief of Staff validator, LLM runtime, chat surface, provider adapter, retrieval layer, embeddings layer, persistence model, or response validation utility was found.

The implementation therefore adds a single isolated deterministic validator in the operator frontend library. It uses native TypeScript and JavaScript only. No new dependency was added.

## Static Source Fixture Contract

The fixture model represents authorized sources that a future read-only Chief of Staff may cite. Each source includes:

- sourceId
- sourceType
- workspaceId
- authorityClassification
- freshness
- privacyClassification
- immutable
- title
- contentSummary
- exactSourceReference
- limitations
- optional availability
- deterministic support mappings for exact claim checks

Allowed initial source types:

- workspace
- capability
- objective
- decision
- action
- evidence
- proof
- learning
- architecture

The canonical Stafford Media fixture set uses only existing S008 identifiers and repository-backed references, including:

- `stafford-media`
- `start-my-day`
- `stafford-media-operating-loop`
- `s008-start-my-day-static-home-action`
- `start-my-day-home-action`
- `evidence-start-my-day-current-source`
- `proof-start-my-day-route-available`
- `learning-os-grows-beside-operator`

Professional and Personal fixture sets remain planned-only and contain no live Professional, Personal, family, media, employer, customer, payment, revenue, or private data.

## Governed Request Fixture

The Stafford Media request fixture is deterministic and test-only. It includes:

- requestId
- static currentUserId clearly labeled as not authenticated
- workspaceId and workspaceFamily
- activeRole labeled as fixture-only
- permissionSummary and capabilitySummary
- operatorQuestion: "What deserves my attention, and why?"
- allowedSourceTypes
- sourceSnapshotIds
- currentTime
- privacyClassification
- policyContext
- requestedOutputType

The request fixture states that it is not authentication, authorization, membership, role, or permission authority. It does not contain secrets, tokens, customer data, personal data, Professional data, or Personal data.

## Response Data Contract

The typed response contract mirrors S009.00 and supports:

- responseId
- workspaceId
- headline
- summary
- attentionItems
- supportingClaims
- missingInformation
- candidateActions
- risks
- approvalsNeeded
- proofExpected
- learningReferences
- sources
- limitations
- generatedAt
- authorityStatus

Each claim supports:

- claimId
- claimType
- statement
- supportingSourceIds
- confidenceClassification
- limitation
- workspaceId
- authorityStatus

Each recommendation supports:

- recommendationId
- workspaceId
- operatorFacingAction
- whyNow
- objectiveId
- decisionId
- supportingActionId
- evidenceIds
- proofStatus
- learningIds
- riskSummary
- uncertainty
- authorityNeeded
- authorityStatus
- expectedResult
- proofNeeded
- alternatives
- sourceTrace
- recommendationStatus

Allowed recommendation statuses are:

- Candidate
- Needs more information
- Needs authority
- Not recommended
- Ready for operator review

Approved, Executing, and Completed are rejected for the read-only Chief of Staff contract.

## Deterministic Validator

Implementation file:

- `staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffValidator.ts`

The validator accepts:

- governed request
- authorized source fixtures
- proposed structured response

It returns:

- valid
- validationStatus
- errors
- warnings
- checkedClaimCount
- checkedRecommendationCount
- checkedSourceCount

Each error includes:

- code
- path
- operator-safe message
- technical detail
- related claim or recommendation ID where applicable

The validator is pure and deterministic. It does not mutate inputs, call a network, call an AI provider, read a database, persist state, import `/operator` loaders, or execute actions.

## Validation Rules Implemented

The validator rejects at least these contract failures:

- RESPONSE_WORKSPACE_MISMATCH
- CLAIM_WORKSPACE_MISMATCH
- SOURCE_WORKSPACE_MISMATCH
- SOURCE_NOT_ALLOWED
- SOURCE_NOT_FOUND
- CLAIM_WITHOUT_SOURCE
- INVALID_CLAIM_TYPE
- UNSUPPORTED_SOURCE_FACT
- INFERENCE_NOT_LABELED
- RECOMMENDATION_STATUS_NOT_ALLOWED
- RECOMMENDATION_WITHOUT_AUTHORITY_STATUS
- RECOMMENDATION_WITHOUT_SOURCE_TRACE
- PLANNED_CAPABILITY_PRESENTED_AS_AVAILABLE
- UNSUPPORTED_NUMERIC_VALUE
- EXPECTED_RESULT_PRESENTED_AS_OUTCOME
- EVIDENCE_PRESENTED_AS_PROOF
- PROOF_PRESENTED_AS_COMPLETION
- LEARNING_PRESENTED_AS_POLICY
- AI_AUTHORITY_CLAIM
- MISSING_LIMITATION
- MISSING_AUTHORITY_STATUS
- UNKNOWN_NOT_USED
- CONFLICT_SILENTLY_RESOLVED
- STALE_SOURCE_NOT_DISCLOSED
- PRIVATE_SOURCE_NOT_AUTHORIZED

Unsupported SOURCE_FACT claims use deterministic explicit support mappings. The validator does not perform semantic inference.

## Valid Response Fixture

The valid Stafford Media fixture answers:

"What deserves my attention, and why?"

It states:

- Start My Day is the current static primary Action for Stafford Media.
- It supports the objective Run the business from one clear loop.
- The guidance is static and not dynamically ranked.
- Live business data and AI recommendations are not connected.
- The recommendation is ready for operator review, not approved.
- The response is source-traced to static Stafford Media sources.

It does not invent urgency, revenue, deadlines, customer state, live counts, numeric confidence, production health, or real operator identity.

## Invalid Response Fixtures

Focused test fixtures reject:

- unsourced claims
- missing sources
- cross-workspace claims
- cross-workspace source leakage
- disallowed source types
- planned Professional capabilities presented as available
- planned Personal capabilities presented as available
- recommendations marked Approved, Executing, or Completed
- recommendations without source trace
- recommendations without authority status
- unsupported numeric business claims
- expected results presented as Outcomes
- Evidence presented as Proof
- Proof presented as automatic completion
- Learning presented as Policy
- AI approval or execution claims
- missing limitations
- missing authority status
- confident unsupported answers
- stale source use without disclosure
- private source use outside request authority

## Conflict Handling

The tests include synthetic validation-only source fixtures that disagree about one bounded status. A response that silently chooses one side is rejected. A response that discloses the conflict, preserves both sources, lowers certainty, and asks for operator review is accepted.

The conflict fixture does not alter real S008 registry values.

## Safe Unknown Fallback

The canonical fallback is:

`I cannot verify that from the current StaffordOS sources.`

The validator accepts UNKNOWN claims when the statement uses the fallback, includes a limitation, includes authority status, and does not invent an answer afterward.

## Validation Report Formatter

The report formatter is library-only and operator-safe.

For valid responses it says:

- Response follows the current StaffordOS rules.
- Claims checked.
- Recommendations checked.
- Sources checked.

For invalid responses it says:

- Response cannot be shown as trusted.
- It explains the most important reason in plain language.
- It lists structured error codes under Technical details.

The formatter does not expose secrets or raw private content.

## Tests

Focused validator tests:

- command: `node --test staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffValidator.test.mjs`
- result: 37 passed, 0 failed

S008 regression tests:

- command: `node --test staffordos/ui/operator-frontend/lib/staffordos/workspaceRegistry.test.mjs staffordos/ui/operator-frontend/lib/staffordos/homePresentation.test.mjs staffordos/ui/operator-frontend/lib/staffordos/objectiveRegistry.test.mjs staffordos/ui/operator-frontend/lib/staffordos/decisionRegistry.test.mjs staffordos/ui/operator-frontend/lib/staffordos/actionRegistry.test.mjs staffordos/ui/operator-frontend/lib/staffordos/evidenceFoundation.test.mjs staffordos/ui/operator-frontend/lib/staffordos/proofFoundation.test.mjs staffordos/ui/operator-frontend/lib/staffordos/learningFoundation.test.mjs`
- result: 127 passed, 0 failed

Build:

- command: `npm run build` in `staffordos/ui/operator-frontend`
- result: passed
- notes: existing Turbopack/NFT warning and existing `/operator/shopifixer-pilot` static-generation warnings appeared, with exit code 0.

## Boundary Safety

Confirmed by implementation inspection and tests:

- no external AI service call
- no provider SDK
- no chat interface
- no runtime prompt
- no network call
- no database call
- no API call
- no persistence
- no `/operator` loader import
- no real authentication claim
- no production data read
- no Professional or Personal data connected
- no Approved, Executing, or Completed recommendation accepted
- no mutation of validator inputs
- no `/operator` behavior change

## Files Changed

Added:

- `staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffValidator.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffValidator.test.mjs`
- `staffordos/architecture/S009_01_STATIC_FIXTURE_AND_DETERMINISTIC_RESPONSE_VALIDATOR.md`
- `staffordos/architecture/S009_01_STATIC_FIXTURE_AND_DETERMINISTIC_RESPONSE_VALIDATOR.json`

Modified:

- none in authorized scope

## Known Limitations

- The validator does not generate responses.
- The validator does not call an LLM or any provider.
- The validator does not validate a full JSON Schema.
- SOURCE_FACT support is deterministic and explicit; it is not semantic matching.
- Conflict handling is fixture-based and deterministic.
- The request fixture is not authorization.
- No runtime identity, persistence, retrieval, adapters, or UI surface exists.

## Recommended Next Mission

Recommended next mission:

`S009_02_READ_ONLY_CHIEF_OF_STAFF_DEMONSTRATION_SURFACE`

Recommended scope:

- render a static prepared Chief of Staff response fixture inside `/os`
- show validator acceptance or rejection using the deterministic formatter
- preserve source trace display
- keep Stafford Media only
- no LLM, provider SDK, retrieval, persistence, API writes, execution, approval, or `/operator` behavior change

## Rollback

Rollback requires only:

`git revert <S009.01 commit SHA>`

No application, database, identity, Stripe, ShopiFixer, Abando, provider, or deployment rollback should be required.
