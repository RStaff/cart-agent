# S009.03 Provider-Neutral Model Adapter Interface

## Mission

S009_03_PROVIDER_NEUTRAL_MODEL_ADAPTER_INTERFACE defines and proves the model-adapter boundary for a future read-only StaffordOS Chief of Staff.

This mission adds a local deterministic adapter interface and execution pipeline only. It does not call any model, select a provider, add credentials, create a chat surface, retrieve sources, persist state, execute work, approve decisions, verify proof, or modify `/operator`.

## Checkpoint Authority

- Starting HEAD verified: `82155d654ee4be5d37a8c75fa36189bd4ce88c55`
- Branch observed: `main`
- No S009.03 artifact existed before implementation.

Canonical authorities verified:

- `staffordos/architecture/STAFFORDOS_ARCHITECTURE_V1.md`
- `staffordos/architecture/S009_00_READ_ONLY_CHIEF_OF_STAFF_CONTRACT.md`
- `staffordos/architecture/S009_01_STATIC_FIXTURE_AND_DETERMINISTIC_RESPONSE_VALIDATOR.md`
- `staffordos/architecture/S009_02_READ_ONLY_CHIEF_OF_STAFF_DEMONSTRATION_SURFACE.md`
- `staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffValidator.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffDemo.ts`
- S008 Workspace, Objective, Decision, Action, Evidence, Proof, and Learning foundations

Certified baseline:

- S008 operating model is certified.
- S009.00 contract is committed.
- S009.01 validator is committed.
- S009.02 deterministic demonstration is committed.
- Trusted display is gated by the deterministic validator.
- No response generator existed before this mission.
- No model provider is selected or authorized.
- No external AI service may be called.
- No provider SDK exists.
- No runtime identity enforcement exists.
- `WorkspaceContext` is presentation-only.
- Stafford Media static fixtures are the only authorized source set.
- Professional and Personal remain Planned.
- No writes, approvals, execution, verification, or autonomous learning are authorized.

## Working Tree Exclusions

The worktree contains preexisting unrelated modified and untracked files. They were inventoried and excluded from staging and commit scope.

Excluded categories:

- S007 identity or issuer artifacts
- runtime and daemon outputs
- web, Prisma, and migration work
- generated frontend files
- ShopiFixer, production, recovery, reconciliation, and mission-evidence artifacts
- unknown unrelated files requiring separate review

Authorized S009.03 files only:

- `staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffModelAdapter.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffModelAdapter.test.mjs`
- `staffordos/architecture/S009_03_PROVIDER_NEUTRAL_MODEL_ADAPTER_INTERFACE.md`
- `staffordos/architecture/S009_03_PROVIDER_NEUTRAL_MODEL_ADAPTER_INTERFACE.json`

## Existing Adapter Discovery

Discovery reviewed S009.00, S009.01, S009.02, the S008 static foundations, current `/os` demonstration code, operator-facing components, package dependencies, operator-daemon artifacts, agent artifacts, and provider-adjacent references.

No compatible canonical Chief of Staff model-adapter interface existed.

Existing provider-adjacent and recommendation-related files are outside this mission's authority:

- older ShopiFixer or Abando provider references
- operator-daemon and agent inventories
- existing operator recommendation fields
- current `/operator` read and write loaders

Those artifacts were not imported, modified, or used as runtime authority.

## Provider-Neutral Adapter Contract

Implementation file:

- `staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffModelAdapter.ts`

The adapter contract defines:

- `adapterId`
- `adapterKind`
- `providerName`
- `modelName`
- `contractVersion`
- `capabilities`
- `limitations`
- `generateStructuredResponse(request)`

The adapter receives only governed, prepared data. It does not receive:

- unrestricted repository access
- filesystem authority
- network credentials
- database credentials
- raw OAuth tokens
- private keys
- email or calendar access
- mutation tools
- production execution authority

## Governed Model Request

The governed request includes:

- `requestId`
- `contractVersion`
- `workspaceId`
- `workspaceFamily`
- `operatorQuestion`
- `operatorLanguageRules`
- `authorityRules`
- `allowedClaimTypes`
- `allowedRecommendationStatuses`
- `authorizedSources`
- `sourceSnapshotIds`
- `requiredResponseShape`
- `requiredLimitations`
- `prohibitedClaims`
- `instructionEnvelope`
- `currentTimeFixture`
- `privacyClassification`

Sources are filtered before reaching the adapter. They must match the request workspace, allowed source types, requested snapshot IDs, and privacy classification. The adapter cannot request additional sources or perform hidden retrieval.

## Adapter Result Contract

The adapter result envelope includes:

- `adapterId`
- `adapterKind`
- `providerName`
- `modelName`
- `contractVersion`
- `requestId`
- `proposedResponse`
- `rawOutputAvailable`
- `generationStatus`
- `adapterWarnings`
- `providerMetadata`
- `generatedAt`
- `deterministicFixture`

Allowed generation statuses:

- Proposed
- Failed
- Invalid structured output
- Blocked by adapter policy
- Unsupported request

Forbidden trust statuses remain outside the adapter result:

- Trusted
- Approved
- Verified
- Executed
- Completed

## Deterministic Fixture Adapter

Added:

- `DeterministicFixtureChiefOfStaffAdapter`

It returns the existing valid S009.01/S009.02 Stafford Media structured response for a governed Stafford Media request. It uses no network, no randomness, no environment-derived state, no external files beyond committed fixtures, no provider SDK, and no AI claim.

The fixture adapter identifies itself as local deterministic fixture infrastructure and makes clear that validation, not the adapter, determines trust.

## Invalid Fixture Adapters

Added test-only adapters:

- `UnsourcedClaimAdapter`
- `CrossWorkspaceLeakAdapter`
- `UnauthorizedStatusAdapter`
- `InvalidShapeAdapter`
- `AdapterFailureAdapter`
- `PlannedAsAvailableAdapter`

They simulate invalid model output and controlled adapter failure. They are used only in tests and must never appear in trusted guidance.

## Adapter Execution Pipeline

Added:

- `runChiefOfStaffAdapter`

The pipeline:

1. Clones and workspace-filters authorized sources.
2. Verifies adapter contract compatibility.
3. Executes the local adapter.
4. Confirms the adapter result envelope matches adapter, request, and contract IDs.
5. Runs a structural response guard.
6. Runs the S009.01 deterministic validator.
7. Returns either `trustedResponse` or `blockedResponse`.
8. Builds an operator-safe report.
9. Builds a non-persisted audit envelope.

Rules encoded:

- `trustedResponse` exists only when S009.01 validation passes.
- Adapter success does not equal trust.
- Provider name does not create trust.
- Model name does not create trust.
- Structurally invalid output fails closed before semantic validation.
- Adapter failure fails closed.
- Validation cannot be skipped.

## Structural Output Guard

Added:

- `guardChiefOfStaffStructuredResponse`

The guard checks required response fields and primitive shapes before semantic validation. It rejects:

- missing `responseId`
- missing `workspaceId`
- missing `headline`
- missing `supportingClaims`
- invalid claim arrays
- invalid recommendation arrays
- missing sources
- missing limitations
- missing authority status
- unsupported claim type
- unsupported recommendation status
- non-string identifiers
- malformed source references

This is a deterministic structural contract guard. It is not a full JSON Schema implementation.

## Failure and Retry Contract

The current local adapters do not need network timeout or retry behavior.

Future provider implementations must preserve these rules:

- retries must be bounded
- retries cannot weaken validation
- provider errors cannot become operator guidance
- fallback models cannot expand source authority
- provider failure must not fabricate a response
- failures must return operator-safe unavailable language

Canonical fallback:

`The Chief of Staff could not prepare a trusted response from the current request.`

## Provider Capability Declaration

The fixture adapter declares:

- `structuredOutput: true`
- `deterministicSeedSupport: not_applicable`
- `toolUse: false`
- `streaming: false`
- `localExecution: true`
- `externalNetwork: false`
- `maximumContextClassification: static_stafford_media_fixture_only`
- `supportedContractVersions: S009.00`

No future provider capabilities are assumed.

## Instruction Boundary

S009.03 defines a provider-neutral instruction envelope only. It describes:

- role
- allowed source rule
- required response structure
- source tracing requirement
- workspace boundary
- authority boundary
- uncertainty behavior
- safe unknown behavior
- prohibited behavior

It is not a provider-specific prompt, and it is not wired into runtime application behavior.

## Untrusted Output Rule

Every adapter output is untrusted until StaffordOS validation passes.

The pipeline does not allow:

- direct adapter output rendering
- bypass flags
- trust based on provider name
- trust based on model name
- trust based on generation success
- trust based on structured output mode
- trust based on local execution

Only S009.01 validation may produce `trustedResponse`.

## Demonstration Integration

No S009.02 demonstration route code was changed.

The current `/os/chief-of-staff` surface already renders a deterministic response gated by the S009.01 validator. S009.03 remains library-only to avoid broad UI changes. A future narrow mission may switch the demonstration data path to call `runChiefOfStaffAdapter` while preserving the same visible operator experience.

## Workspace Boundary

The pipeline enforces the request workspace before and after adapter execution:

- Stafford Media requests receive only Stafford Media sources.
- Returned responses must match the request workspace through S009.01 validation.
- Professional and Personal sources remain unavailable to Stafford Media requests.
- Adapters cannot request extra sources.
- Adapter metadata cannot override workspace authority.
- `WorkspaceContext` remains presentation-only and is not security.

## Audit Envelope

Added:

- `buildChiefOfStaffAdapterAuditEnvelope`

The envelope preserves:

- `auditId`
- `requestId`
- `adapterId`
- `providerName`
- `modelName`
- `contractVersion`
- `sourceSnapshotIds`
- `generationStatus`
- `validationStatus`
- `validationErrorCodes`
- `trustedResponseAvailable`
- `generatedAt`
- `workspaceId`
- `privacyClassification`
- `limitations`

Audit envelopes are deterministic and not persisted. They contain no raw secrets or unrestricted source content.

## Tests

Focused S009.03 tests:

- Command: `node --test staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffModelAdapter.test.mjs`
- Result: 25 passed, 0 failed

S009.02 regression:

- Command: `node --test staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffDemo.test.mjs`
- Result: 18 passed, 0 failed

S009.01 regression:

- Command: `node --test staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffValidator.test.mjs`
- Result: 37 passed, 0 failed

S008 regression:

- Command: `node --test staffordos/ui/operator-frontend/lib/staffordos/workspaceRegistry.test.mjs staffordos/ui/operator-frontend/lib/staffordos/homePresentation.test.mjs staffordos/ui/operator-frontend/lib/staffordos/objectiveRegistry.test.mjs staffordos/ui/operator-frontend/lib/staffordos/decisionRegistry.test.mjs staffordos/ui/operator-frontend/lib/staffordos/actionRegistry.test.mjs staffordos/ui/operator-frontend/lib/staffordos/evidenceFoundation.test.mjs staffordos/ui/operator-frontend/lib/staffordos/proofFoundation.test.mjs staffordos/ui/operator-frontend/lib/staffordos/learningFoundation.test.mjs`
- Result: 127 passed, 0 failed

## Build

- Command: `npm run build`
- Working directory: `staffordos/ui/operator-frontend`
- Result: passed, exit 0

Observed existing build output:

- Turbopack/NFT warning from `next.config.mjs`
- Existing `/operator/shopifixer-pilot` Client Component static-generation messages
- Route generation completed and included `/os`, `/os/chief-of-staff`, and `/operator`

## Route Results

No route code changed in S009.03, so no dev server was started solely for route probes. Build route generation remained intact and included:

- `/os`
- `/os/chief-of-staff`
- `/operator`

## Boundary Safety

Verified:

- no external model is called
- no provider SDK is installed
- no API key or secret is added
- no environment variable is added
- no network call exists
- no chat input exists
- no free-form prompt input exists
- no runtime model prompt exists
- no database or persistence exists
- no `/operator` loader is imported
- no real authentication claim exists
- no production data is read
- no adapter output bypasses validation
- no invalid output reaches trusted display
- no Professional or Personal data is used
- no approval, execution, verification, or mutation control exists
- `/operator` behavior remains unchanged

## Files Changed

Added:

- `staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffModelAdapter.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffModelAdapter.test.mjs`
- `staffordos/architecture/S009_03_PROVIDER_NEUTRAL_MODEL_ADAPTER_INTERFACE.md`
- `staffordos/architecture/S009_03_PROVIDER_NEUTRAL_MODEL_ADAPTER_INTERFACE.json`

Modified:

- none

## Known Limitations

- The adapter is deterministic fixture infrastructure only.
- No provider implementation exists.
- No provider-specific prompt exists.
- No route integration was added in this mission.
- No runtime identity enforcement exists.
- No runtime source adapters exist.
- No persistence or audit storage exists.
- Professional and Personal remain planned.
- Stafford Media fixtures remain static and repository-backed.

## Rollback

Rollback requires only:

`git revert <S009.03 commit SHA>`

No production, database, identity, Stripe, ShopiFixer, Abando, provider, or deployment rollback is required.

## Recommended Next Mission

Recommended next mission:

`S009_04_LOCAL_OR_SANDBOXED_MODEL_PROOF`

Scope:

- prove a local or sandboxed model can produce a structured proposed response through the S009.03 adapter interface
- keep all outputs validator-gated
- keep sources static unless a separate source-adapter mission authorizes more
- do not add production credentials, writes, execution, approvals, or autonomous authority

Dependencies:

- S009.00 contract
- S009.01 validator
- S009.02 demonstration
- S009.03 adapter interface

Expected outcome:

- a provider-neutral proof that model output can be blocked or trusted only by StaffordOS validation, not by provider status.
