# S009.06 Primary Action Read Model Source Adapter

## Mission

`S009_06_PRIMARY_ACTION_READ_MODEL_SOURCE_ADAPTER` implements one governed, read-only Primary Action source adapter as a local library.

The adapter answers:

`What part of the current Primary Action can safely become a StaffordOS source?`

This mission does not connect the adapter to the Chief of Staff model pipeline, invoke Ollama, start Ollama, modify the Chief of Staff demonstration UI, modify `/operator`, modify `/os`, deploy, push, or connect runtime data.

## Checkpoint Authority

- Starting HEAD verified: `2bb491056b3931427005be142d8c0c4ede075de8`
- Branch observed: `main`
- No S009.06 artifact or `primaryActionSourceAdapter` implementation existed before editing.
- Required authorities verified:
  - `staffordos/architecture/STAFFORDOS_ARCHITECTURE_V1.md`
  - `staffordos/architecture/S009_00_READ_ONLY_CHIEF_OF_STAFF_CONTRACT.md`
  - `staffordos/architecture/S009_01_STATIC_FIXTURE_AND_DETERMINISTIC_RESPONSE_VALIDATOR.md`
  - `staffordos/architecture/S009_02_READ_ONLY_CHIEF_OF_STAFF_DEMONSTRATION_SURFACE.md`
  - `staffordos/architecture/S009_03_PROVIDER_NEUTRAL_MODEL_ADAPTER_INTERFACE.md`
  - `staffordos/architecture/S009_04B_CERTIFY_LOCAL_MODEL_PROVIDER_BOUNDARY.md`
  - `staffordos/architecture/S009_05_GOVERNED_OPERATOR_READ_MODEL_ADAPTER_DISCOVERY.md`
  - `staffordos/ui/operator-frontend/lib/operator/loadPrimaryActionSnapshot.ts`
  - S008 Action, Objective, Decision, Evidence, Proof, and Learning foundations

Certified baseline:

- `/operator` remains runtime-canonical.
- `/os` remains presentation-focused.
- Ollama is installed but stopped.
- No listener exists on port `11434`.
- No model may read `/operator` directly.
- S009.05 selected Primary Action Snapshot as the first source-adapter candidate.
- Runtime use remains blocked by undeployed identity and permission authority.
- A library-only, fixture-backed adapter may be implemented now.
- `WorkspaceContext` remains presentation-only and is not authorization.
- Professional and Personal remain Planned.
- No write, execution, approval, verification, or mutation authority exists.

## Working Tree Exclusions

The repository contained broad preexisting unrelated modified and untracked files. They were inventoried and excluded from this mission.

Excluded categories:

- `S007_IDENTITY_OR_ISSUER`: identity, KMS, issuer, operator assertion, execution authorization, and ShopiFixer identity artifacts.
- `RUNTIME_OR_DAEMON`: StaffordOS daemon state, runtime output, heartbeat, preflight output, loop output, and existing generated snapshot files.
- `WEB_OR_PRISMA`: Prisma schema, migrations, packet routes, and web runtime files.
- `MISSION_EVIDENCE`: production, certification, recovery, reconciliation, and ShopiFixer mission records outside S009.06.
- `GENERATED`: generated frontend metadata such as `staffordos/ui/operator-frontend/next-env.d.ts`.
- `PREEXISTING_UNRELATED`: modified StaffordOS agent, capability, revenue, lead, system-map, and rule files.
- `UNKNOWN_REQUIRES_REVIEW`: any untracked or modified file not explicitly authorized by this mission.

Authorized files for this mission:

- `staffordos/ui/operator-frontend/lib/staffordos/primaryActionSourceAdapter.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/primaryActionSourceAdapter.test.mjs`
- `staffordos/architecture/S009_06_PRIMARY_ACTION_READ_MODEL_SOURCE_ADAPTER.md`
- `staffordos/architecture/S009_06_PRIMARY_ACTION_READ_MODEL_SOURCE_ADAPTER.json`

## Ollama Stopped State

Read-only process inspection confirmed:

- `lsof -nP -iTCP:11434 -sTCP:LISTEN` returned no listener.
- Ollama was not started.
- No model proof command was run.
- No model invocation occurred.

## Primary Action Source Authority

The canonical current Primary Action read-side authority discovered for this mission is:

- `staffordos/ui/operator-frontend/lib/operator/loadPrimaryActionSnapshot.ts`

Important boundary:

- `loadPrimaryActionSnapshot` can call `http://localhost:3000/api/operator/ceo-snapshot`.
- It can synthesize a Primary Action from local dashboard, merchant lifecycle, client, and lead files.
- It includes or derives sensitive fields such as merchant, store, revenue, priority, confidence, lead, and lifecycle context.

Therefore S009.06 does not import or execute the loader. The new adapter accepts an explicitly supplied read-model record or deterministic fixture and only transforms allowed fields.

The existing dirty generated file `staffordos/snapshots/primary_action_snapshot_v1.json` was inspected as authority evidence only and was not modified or staged.

## Input Contract

The adapter input is `PrimaryActionSourceAdapterInput`:

- `adapterExecutionId`
- `requestWorkspaceId`
- `permissionDecision`
- `primaryActionRecord`
- `sourceReference`
- `capturedAt`
- `sourceUpdatedAt`
- `privacyClassification`
- `authorityClassification`
- `fallbackClassification`
- `conflicts`

The adapter never accepts:

- database clients
- API clients
- mutation handlers
- command handlers
- queue clients
- execution tokens
- credentials
- unrestricted request objects
- browser state as authority
- client-selected permissions as trusted authority

## Safe Field Allowlist

Allowed Primary Action fields are explicit:

| Included field | Source path | Operator meaning | Transformation |
| --- | --- | --- | --- |
| `actionId` | `primaryActionRecord.primary_action.action_id` | Stable action identifier | Copied only when non-empty |
| `operatorFacingTitle` | `primaryActionRecord.primary_action.action_label` | Current primary action label | Copied after prohibited-value screening |
| `operatorFacingSummary` | `primaryActionRecord.primary_action.next_step` | Plain-language next step | Copied after prohibited-value screening |
| `whyItMatters` | `primaryActionRecord.primary_action.why_now` | Why it deserves attention | Copied after prohibited-value screening |
| `expectedResult` | `primaryActionRecord.primary_action.expected_outcome` | Expected result if acted on later | Copied after prohibited-value screening |
| `productScope` | `primaryActionRecord.primary_action.product_id` | Broad product scope | Reduced to a broad product label |
| `relatedObjectiveId` | `primaryActionRecord.primary_action.objective_id` | Explicit Objective mapping | Copied only when supplied |
| `relatedDecisionId` | `primaryActionRecord.primary_action.decision_id` | Explicit Decision mapping | Copied only when supplied |

No title-based inference is performed for Objective or Decision mappings.

## Excluded Field Classifications

The adapter records classifications, not sensitive values:

- `merchant_or_customer_identifier`
- `customer_contact`
- `store_domain`
- `payment_reference`
- `packet_or_checkout_identifier`
- `revenue_or_numeric_business_metric`
- `priority_or_confidence_score`
- `raw_notes_or_contact_content`
- `execution_or_mutation_instruction`
- `credential_or_secret`
- `provider_token`
- `rollback_command`
- `hidden_prompt`
- `generated_or_unverified_claim`

Credential, token, rollback, hidden-prompt, and write-instruction classifications fail closed.

## Source Snapshot Contract

A successful adapter result returns a `PrimaryActionSourceSnapshot` with:

- `sourceId`
- `sourceType: primary_action_snapshot`
- `workspaceId`
- `productScope`
- `authorityClassification`
- `freshness`
- `privacyClassification`
- `immutable`
- `title`
- `contentSummary`
- `structuredFacts`
- `exactSourceReference`
- `sourceUpdatedAt`
- `capturedAt`
- `limitations`
- `excludedFieldClassifications`
- `conflictStatus`
- `permissionRequirement`
- `adapterId`

The explicit adapter source type is `primary_action_snapshot`.

Because the existing S009.01 validator currently allows `action` as the closest compatible source type, the adapter also exports `toChiefOfStaffSourceFixture`. That projection converts a successful source snapshot into the existing `ChiefOfStaffSourceFixture` contract without changing validator rules.

## Permission Decision Contract

S009.06 uses `PRIMARY_ACTION_PERMISSION_DECISION_FIXTURE`.

It is deliberately:

- deterministic
- Stafford Media only
- `testOnly: true`
- not real authentication
- not workspace membership
- not server authorization
- not future runtime authority

Failure behavior:

- `allowed=false` returns no snapshot.
- missing permission returns no snapshot.
- permission workspace mismatch returns no snapshot.
- unsupported permission authority returns no snapshot.
- client-selected workspace alone is insufficient.

## Workspace Enforcement

Enforced behavior:

- request workspace must be `stafford-media`;
- permission workspace must match the request workspace;
- Professional input fails closed;
- Personal input fails closed;
- unknown workspace fails closed;
- source record workspace fields cannot override trusted request context;
- the adapter cannot change workspace identity.

Workspace switching remains presentation-only and not authorization.

## Freshness Classification

Freshness is classified only from supplied timestamps.

S009.06 deterministic fixture policy:

- `Current`: source timestamp is no more than one day older than capture time.
- `Recent`: source timestamp is more than one day and no more than seven days older.
- `Historical`: source timestamp is more than seven days and no more than ninety days older.
- `Stale`: source timestamp is more than ninety days older.
- `Unknown`: timestamp authority is missing, invalid, or contradictory.

This is a library fixture policy, not a universal business freshness threshold.

Missing timestamps never appear as `Current`.

## Provenance

The adapter preserves:

- exact source reference
- source authority
- adapter identity
- included field list
- excluded field classifications
- capture time
- source update time
- fallback classification
- fixture/test-only permission status

The snapshot discloses that it is derived from an explicitly supplied Primary Action read model and is not original write authority.

## Conflict Handling

The adapter accepts bounded conflict input.

Behavior:

- non-blocking conflicts are preserved with `Needs review`;
- blocking conflicts return no snapshot;
- conflicting source references are retained;
- the adapter does not silently reconcile conflicts;
- model judgment is not used to resolve conflicts.

Failure codes include:

- `SOURCE_CONFLICT`
- `STATIC_RUNTIME_CONFLICT`
- `GENERATED_FALLBACK_CONFLICT`
- `SOURCE_AUTHORITY_AMBIGUOUS`

## Fallback and Generated Data

Fallback classifications:

- `NONE`
- `REPOSITORY_BACKED_FALLBACK`
- `GENERATED_PLACEHOLDER`
- `MOCK_DATA`
- `OPERATOR_DEFAULT`
- `UNKNOWN`

Generated placeholder or mock data cannot become runtime truth and fails closed.

Repository-backed or unknown fallback classifications remain visible in limitations.

## Write-Adjacency Safety

The adapter has no dependency on:

- `execute-primary-action`
- workday start or stop routes
- lead mutation actions
- campaign mutation actions
- command-center server actions
- ShopiFixer pilot actions
- payment or packet mutation
- queue production
- deployment
- rollback
- provider mutation clients
- `writeShopifixer` helpers
- database writers

The adapter does not import `/operator` pages, `/operator` loaders, API routes, model adapters, provider SDKs, or runtime services.

## Static Fixtures

Focused tests cover deterministic fixtures for:

- valid Stafford Media Primary Action
- permission denied
- missing permission
- workspace mismatch
- Professional workspace
- Personal workspace
- sensitive fields present in raw source
- missing timestamps
- stale source
- conflicting source
- generated fallback
- malformed source

No real customer, merchant, payment, employer, family, or personal data is used.

## Chief of Staff Compatibility

Compatibility is proven without changing:

- S009.01 validator rules
- S009.03 provider-neutral adapter
- Ollama adapter
- Chief of Staff response shape
- source-traced claim shape
- recommendation status rules

The adapter keeps its explicit snapshot type and provides a Chief of Staff-compatible projection using the existing S009 `action` source type.

No model is invoked.

## Audit Summary

The adapter returns a non-persisted audit summary with:

- `adapterExecutionId`
- `adapterId`
- `workspaceId`
- `permissionDecision`
- `sourceReference`
- `includedFields`
- `excludedFieldClassifications`
- `sourceUpdatedAt`
- `capturedAt`
- `freshness`
- `conflictStatus`
- `resultStatus`
- `failureCode`
- `privacyClassification`
- `limitations`
- `fallbackClassification`
- `testOnly`

Sensitive excluded values are not present in the audit summary.

## Failure-Closed Behavior

Operator-safe fallback:

`I cannot verify the current primary action from the available StaffordOS source.`

The adapter returns no source snapshot when:

- permission is denied;
- permission is missing;
- permission authority is unsupported;
- workspace mismatches;
- source is malformed;
- source authority is missing;
- source provenance is missing;
- credential, token, rollback, prompt, or write-instruction fields are present;
- generated or mock fallback data is supplied as runtime truth;
- conflict makes the source unsafe.

## Tests

Focused adapter tests:

- Command: `node --test staffordos/ui/operator-frontend/lib/staffordos/primaryActionSourceAdapter.test.mjs`
- Result: `32/32 passed`

Regression suites required by this mission:

- S009.03 adapter tests: `25/25 passed`
- S009.02 demonstration tests: `18/18 passed`
- S009.01 validator tests: `37/37 passed`
- S008 Workspace, Home, Objective, Decision, Action, Evidence, Proof, and Learning tests: `127/127 passed`

Build:

- Command: `npm run build` in `staffordos/ui/operator-frontend`
- Result: passed with existing `/operator/shopifixer-pilot` static-generation warnings and an existing NFT tracing warning.

Other validation:

- `jq staffordos/architecture/S009_06_PRIMARY_ACTION_READ_MODEL_SOURCE_ADAPTER.json`: passed
- `git diff --check`: passed

## Files Changed

- `staffordos/ui/operator-frontend/lib/staffordos/primaryActionSourceAdapter.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/primaryActionSourceAdapter.test.mjs`
- `staffordos/architecture/S009_06_PRIMARY_ACTION_READ_MODEL_SOURCE_ADAPTER.md`
- `staffordos/architecture/S009_06_PRIMARY_ACTION_READ_MODEL_SOURCE_ADAPTER.json`

## Known Limitations

- Runtime use remains blocked by undeployed S007 identity, workspace membership, permission claims, and server authorization.
- The adapter uses deterministic test permission authority only.
- The adapter does not retrieve live data.
- The adapter does not persist snapshots or audit summaries.
- The adapter does not invoke any model.
- The adapter does not update the Chief of Staff demonstration UI.
- The existing S009 validator source-type union was not changed; compatibility uses the existing `action` source type.

## Runtime Blockers

Before runtime use:

- trusted operator identity must be deployed;
- server-side workspace membership must be proven;
- permission claims must be available;
- source read authority must be enforced server-side;
- source snapshots must be captured immutably;
- customer, merchant, payment, packet, and revenue data authority must be explicit before inclusion;
- `WorkspaceContext` must not be treated as authorization.

## Recommended Next Mission

Recommended next mission:

`S009_07_GOVERNED_SOURCE_SNAPSHOT_ASSEMBLY_AND_IDENTITY_GATE`

Scope:

- define a governed source-snapshot assembler for static StaffordOS sources plus supplied Primary Action source snapshots;
- keep runtime reads disabled;
- prove identity and permission gate requirements before any live adapter use;
- preserve S009.01 validator authority and provider neutrality;
- do not invoke models or modify `/operator`.

## Rollback

Rollback requires only:

`git revert <S009.06 commit SHA>`

No runtime, model, database, identity, Stripe, ShopiFixer, Abando, or deployment rollback should be required.

## Confirmation of Non-Impact

This mission did not:

- start or invoke Ollama;
- modify `/operator`;
- modify `/os`;
- modify the Chief of Staff demonstration UI;
- call any API;
- access any database;
- add provider SDKs;
- add credentials or environment variables;
- modify authentication, OAuth, KMS, JWT, or issuer code;
- modify Stripe;
- modify Prisma, migrations, queues, packets, or execution workflows;
- modify ShopiFixer or Abando runtime behavior;
- deploy;
- push;
- include unrelated working-tree changes.
