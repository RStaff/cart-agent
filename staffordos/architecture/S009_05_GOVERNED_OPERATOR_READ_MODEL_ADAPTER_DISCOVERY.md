# S009.05 Governed Operator Read Model Adapter Discovery

## Mission

`S009_05_GOVERNED_OPERATOR_READ_MODEL_ADAPTER_DISCOVERY` discovers the smallest safe path for the read-only Chief of Staff to consume selected runtime-canonical StaffordOS information from existing `/operator` read models.

This mission is documentation and authority design only. It does not implement a live adapter, start Ollama, invoke a model, connect runtime data to `/os`, add persistence, add retrieval, add embeddings, modify `/operator`, or change production behavior.

The future runtime path remains:

Runtime-canonical read model -> governed source adapter -> workspace and permission filtering -> immutable source snapshot -> governed Chief of Staff request -> replaceable provider adapter -> proposed response -> structural guard -> StaffordOS deterministic validator -> trusted candidate guidance or blocked result.

The model never reads `/operator` directly, never chooses sources, and never receives write authority.

## Checkpoint Authority

- Starting HEAD verified: `82acb03f217b2a0b988ef6368ea77248373bcec4`
- Branch observed: `main`
- No S009.05 artifact existed before this mission.
- Required authorities verified:
  - `staffordos/architecture/STAFFORDOS_ARCHITECTURE_V1.md`
  - `staffordos/architecture/S009_00_READ_ONLY_CHIEF_OF_STAFF_CONTRACT.md`
  - `staffordos/architecture/S009_01_STATIC_FIXTURE_AND_DETERMINISTIC_RESPONSE_VALIDATOR.md`
  - `staffordos/architecture/S009_02_READ_ONLY_CHIEF_OF_STAFF_DEMONSTRATION_SURFACE.md`
  - `staffordos/architecture/S009_03_PROVIDER_NEUTRAL_MODEL_ADAPTER_INTERFACE.md`
  - `staffordos/architecture/S009_04A_LOCAL_MODEL_RUNTIME_SELECTION_AND_INSTALLATION_PLAN.md`
  - `staffordos/architecture/S009_04B_CERTIFY_LOCAL_MODEL_PROVIDER_BOUNDARY.md`
  - `staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffValidator.ts`
  - `staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffModelAdapter.ts`
  - `staffordos/ui/operator-frontend/lib/staffordos/chiefOfStaffOllamaAdapter.ts`
  - S008 Workspace, Objective, Decision, Action, Evidence, Proof, and Learning foundations

Certified baseline:

- The static StaffordOS operating model is certified.
- The deterministic validator is authoritative for Chief of Staff responses.
- A provider-neutral model boundary exists.
- Ollama plus `qwen2.5:1.5b` passed one bounded local provider proof.
- Current Chief of Staff sources are static fixtures only.
- `/operator` remains runtime-canonical.
- `/os` remains presentation-focused.
- `WorkspaceContext` remains presentation-only and is not authorization.
- No deployed runtime identity enforcement exists.
- Professional and Personal remain Planned.
- No write, approval, execution, verification, or autonomous learning authority exists.

## Working Tree Exclusions

The repository contained broad preexisting unrelated modified and untracked files. They were inventoried and excluded from this mission.

Excluded categories:

- `S007_IDENTITY_OR_ISSUER`: local identity, KMS, issuer, operator assertion, execution grant, and ShopiFixer identity artifacts.
- `RUNTIME_OR_DAEMON`: StaffordOS runtime output JSON, daemon state, heartbeat, loop output, preflight output, and snapshot files.
- `WEB_OR_PRISMA`: Prisma schema, migrations, web routes, packet authority, and API implementation files.
- `MISSION_EVIDENCE`: production, certification, recovery, reconciliation, and ShopiFixer mission records outside S009.05.
- `GENERATED`: generated frontend metadata such as `staffordos/ui/operator-frontend/next-env.d.ts`.
- `PREEXISTING_UNRELATED`: modified StaffordOS agent, capability, revenue, lead, system-map, and rule output files.
- `UNKNOWN_REQUIRES_REVIEW`: any untracked or modified file not explicitly authorized by this mission.

Authorized files for this mission only:

- `staffordos/architecture/S009_05_GOVERNED_OPERATOR_READ_MODEL_ADAPTER_DISCOVERY.md`
- `staffordos/architecture/S009_05_GOVERNED_OPERATOR_READ_MODEL_ADAPTER_DISCOVERY.json`

## Ollama Stopped State

Read-only process checks found:

- `lsof -nP -iTCP:11434 -sTCP:LISTEN` returned no listener.
- Process inspection for `ollama`, `llama-server`, and `runOllamaChiefOfStaffProof` found only the inspection command itself.
- Ollama was not started, invoked, or connected during this mission.

## Operator Route Inventory

| Route | Purpose | Backing files | Data source | Authority | Risk | Classification |
| --- | --- | --- | --- | --- | --- | --- |
| `/operator` | Morning surface for primary action, system truth, revenue truth, campaign coverage, blockers, and workday controls | `app/operator/page.tsx`, `loadPrimaryActionSnapshot`, `loadPreflightReport`, `loadCommandCenterQaReport`, `WorkdayControlPanel` | Local truth files plus primary action loader | Runtime-canonical presentation | Contains revenue and workday start/stop adjacency | `READ_WITH_FIELD_FILTERING` |
| `/operator/cockpit` | CEO truth cockpit with revenue, pipeline, fulfillment, Abando, health, primary action, and top actions | `app/operator/cockpit/page.tsx`, `/api/operator/ceo-truth-snapshot` | `staffordos/cockpit/ceo_truth_snapshot_v1.json` | Runtime-canonical read snapshot | Client component includes execution button path | `WRITE_ADJACENT` |
| `/operator/leads` | Lead command with registry, queue, readiness, send ledger, and actions | `app/operator/leads/page.tsx`, `LeadActions`, `loadOperatorLeads` | Lead registry, lead events, `.tmp` send queues, send ledger | Runtime read model | Lead email/contact fields and POST actions | `READ_WITH_FIELD_FILTERING` and `WRITE_ADJACENT` |
| `/operator/campaigns` | Campaign command and resolver report | `app/operator/campaigns/page.tsx`, `campaignResolver` | Campaign registry plus relationship, action, decision, fulfillment, execution, outcome, and revenue resolvers | Derived runtime read model | Revenue-at-stake, relationship IDs, conflict context | `READ_WITH_FIELD_FILTERING` |
| `/operator/revenue-command` | Revenue queue for payment, offers, warm opportunities, active campaigns, and stale opportunities | `app/operator/revenue-command/page.tsx` | Lead registry, revenue truth, operator dashboard snapshot | Runtime read model | Merchant names, lead states, revenue values, contact gaps | `READ_WITH_FIELD_FILTERING` |
| `/operator/command-center` | Executive command center and ShopiFixer proof/evidence workbench | `app/operator/command-center/page.tsx`, `OperatorHomeV1`, write helpers | Primary action, preflight, QA, unit work, ShopiFixer command center | Runtime-canonical operator surface | Server actions write before/after evidence, scope, proof package, completion | `WRITE_ADJACENT` and `NOT_SUITABLE` for first adapter |
| `/operator/execution-log` | Execution, outcome, agent usage, and rule suggestion view | `app/operator/execution-log/page.tsx`, `loadExecutionLog` | Execution log, outcome events, legacy operator events, agent performance, rule suggestions | Mixed runtime and generated summaries | Generated fallback IDs use `Date.now`; contains customers and rule suggestions | `READ_WITH_FIELD_FILTERING` and `GENERATED_OR_MOCK` |
| `/operator/system-map` | System map read-only surface | `app/operator/system-map/page.tsx`, `/api/operator/system-map` | Lead registry, send ledger, agent registry, system inventory, governance files | Derived system summary | Uses generated timestamps and includes planned/partial nodes | `READ_WITH_FIELD_FILTERING` |
| `/operator/slice-truth` | Operator lock and slice verification surface | `app/operator/slice-truth/page.tsx` | System-map slice truth and operator lock state | Runtime/generated local files | Disabled buttons, slice lock state, internal repair language | `OPERATOR_PRIVATE_ONLY` |
| `/operator/shopifixer-pilot` | ShopiFixer proof-run workspace | `app/operator/shopifixer-pilot/page.tsx`, `ShopifixerPilotWorkspace`, write helpers | ShopiFixer command center, leads, campaign resolver, proof-run artifacts | Operator proof-run authority | Multiple server actions write evidence, proof, scope, and completion | `WRITE_ADJACENT` and `NOT_SUITABLE` for first adapter |
| `/operator/relationship/[id]` | Relationship 360 view | `app/operator/relationship/[id]/page.tsx`, relationship/action/decision resolvers, execution log | Relationship resolver, packet authority fetches, revenue truth, fulfillment truth | Runtime/derived read model | Contact email, packet IDs, payment reference, external packet fetches | `BLOCKED_BY_IDENTITY` and `READ_WITH_FIELD_FILTERING` |
| `/operator/analytics` | Placeholder analytics status | `app/operator/analytics/page.tsx` | Static placeholder content | Planned only | Not live truth | `GENERATED_OR_MOCK` and `NOT_SUITABLE` |
| `/operator/products` | Product overview with Abando summary fetch and placeholders | `app/operator/products/page.tsx` | Abando summary endpoint if configured, placeholders | Product summary surface | External product fetch; future product data | `BLOCKED_BY_DATA_AUTHORITY` |
| `/operator/capacity` | Service capacity board | `app/operator/capacity/page.tsx` | Manual placeholder arrays and planning docs | Planning only | Placeholder merchants and non-live estimates | `GENERATED_OR_MOCK` and `NOT_SUITABLE` |

Adjacent API route review:

| API route | Method | Behavior | Classification |
| --- | --- | --- | --- |
| `/api/operator/ceo-truth-snapshot` | GET | Reads `staffordos/cockpit/ceo_truth_snapshot_v1.json` | `SAFE_READ_CANDIDATE` after field filtering |
| `/api/operator/ceo-snapshot` | GET | Aggregates lead, client, dashboard, and send-ledger files with generated timestamp | `READ_WITH_FIELD_FILTERING` |
| `/api/operator/dashboard-snapshot` | GET | Reads operator dashboard snapshot | `READ_WITH_FIELD_FILTERING` |
| `/api/operator/lead-registry` | GET | Returns `loadOperatorLeads` output | `READ_WITH_FIELD_FILTERING` |
| `/api/operator/send-proof` | GET | Reads send ledger proof counts and latest proofs | `READ_WITH_FIELD_FILTERING` |
| `/api/operator/system-map` | GET | Builds generated system map summary | `GENERATED_OR_MOCK` |
| `/api/operator/system-truth` | GET | Reads send ledger summary | `READ_WITH_FIELD_FILTERING` |
| `/api/operator/client-registry` | GET | Reads client registry and lifecycle terminology | `READ_WITH_FIELD_FILTERING` |
| `/api/operator/followups` | GET | Reads follow-up queue | `OPERATOR_PRIVATE_ONLY` |
| `/api/operator/discovery-status` | GET | Reads discovery runner status file | `OPERATOR_PRIVATE_ONLY` |
| `/api/operator/cron-status` | GET | Executes status script through `execFile` | `WRITE_ADJACENT` and `NOT_SUITABLE` |
| `/api/operator/execute-primary-action` | POST | Writes operator action, outcome, and related logs; can spawn Node command | `WRITE_OR_EXECUTION_INSTRUCTION` and `NOT_SUITABLE` |
| `/api/operator/lead-registry/action` | POST | Mutates lead registry, lead events, send ledger, and send execution log | `WRITE_OR_EXECUTION_INSTRUCTION` and `NOT_SUITABLE` |
| `/api/operator/workday/start` | POST | Runs workday start script | `WRITE_OR_EXECUTION_INSTRUCTION` and `NOT_SUITABLE` |
| `/api/operator/workday/stop` | POST | Runs workday stop script | `WRITE_OR_EXECUTION_INSTRUCTION` and `NOT_SUITABLE` |

## Read-Model and Resolver Inventory

| File | Export | Inputs | Output | Sensitivity | Suitability |
| --- | --- | --- | --- | --- | --- |
| `lib/operator/loadPrimaryActionSnapshot.ts` | `loadPrimaryActionSnapshot` | `/api/operator/ceo-snapshot` on localhost first, then local dashboard, merchant lifecycle, client, and lead files | Operator-facing primary action snapshot | Merchant, product, revenue gap context, confidence scores | `RECOMMENDED_FIRST` only through field allowlist and no API fetch in snapshot adapter |
| `lib/operator/loadDashboardSnapshot.ts` | `loadDashboardSnapshot` | `staffordos/clients/operator_dashboard_snapshot_v1.json` | Raw dashboard snapshot | Revenue and merchant/client summaries | `SAFE_AFTER_FIELD_FILTERING` |
| `lib/operator/actionResolver.ts` | `resolveActionCandidates`, `getActionResolverReport` | Dashboard, revenue truth, fulfillment truth, execution log, outcome events, relationship resolver | Ranked action candidates and report | Revenue impact, confidence, relationship IDs, conflict state | `SAFE_AFTER_FIELD_FILTERING` |
| `lib/operator/decisionEngineResolver.ts` | `resolveDecisionEngine`, `getDecisionEngineReport` | Action resolver, relationship resolver, revenue, fulfillment, execution, outcome truth | Top action by category and arbitration context | Derived ranking and commercial context | `SAFE_AFTER_FIELD_FILTERING` |
| `lib/operator/campaignResolver.ts` | `getCampaignResolverReport` | Campaign registry, action resolver, relationship resolver, decision engine | Campaign inventory, coverage, health, revenue at stake | Relationship membership, revenue at stake, conflict notes | `SAFE_AFTER_FIELD_FILTERING` |
| `lib/operator/relationshipResolver.ts` | `resolveRelationships`, `resolveRelationshipById`, `getRelationshipResolverReport` | Lead, client, merchant, fulfillment, execution, outcome files | Relationship 360 model | Emails, domains, merchant shops, payment/proof state, conflict notes | `BLOCKED_BY_IDENTITY` |
| `lib/leads/loadOperatorLeads.ts` | `loadOperatorLeads` | Lead registry, lead events, send ledger, `.tmp` send queue/readiness/console data | Lead summary and full lead rows | Email, send target, names, domains, outreach state | `BLOCKED_BY_IDENTITY` for full data; summary only after filtering |
| `lib/operator/loadShopifixerCommandCenter.ts` | `loadShopifixerCommandCenter`, `deriveCustomerOutcome` | Merchant lifecycle, client registry, fulfillment truth, packet API fetches | ShopiFixer command center and customer outcome row | Packet IDs, payment reference, customer outcome, external fetch | `BLOCKED_BY_DATA_AUTHORITY` |
| `lib/operator/loadExecutionLog.ts` | `loadExecutionLog` | Execution log, outcome events, legacy operator events, agent performance, rule suggestions, loop report | Execution/outcome summary | Customer names, generated IDs, rule suggestions | `SAFE_AFTER_FIELD_FILTERING` |
| `lib/operator/loadFounderProfitQueue.ts` | `loadFounderProfitQueue` | Merchant lifecycle, leads, clients, revenue, execution, send ledger, follow-up queue | Founder profit missions | Merchant, lead, expected revenue, readiness | `SAFE_AFTER_FIELD_FILTERING` after identity |
| `lib/operator/loadUnitWorkSnapshot.ts` | `loadUnitWorkSnapshot` | `staffordos/snapshots/unit_work_snapshot_v1.json` | Unit work snapshot | Open work, priority, product/domain context | `SAFE_AFTER_FIELD_FILTERING` |
| `lib/operator/loadPreflightReport.ts` | `loadPreflightReport` | `staffordos/preflight/output/preflight_report_v1.json` | Preflight findings | Internal validation details | `OPERATOR_PRIVATE_ONLY` |
| `lib/operator/loadCommandCenterQaReport.ts` | `loadCommandCenterQaReport` | `staffordos/qa/output/command_center_primary_action_qa_v1.json` | QA verdict and findings | Internal QA evidence | `OPERATOR_PRIVATE_ONLY` |
| `lib/operator/writeShopifixer*.ts` | write helpers | Form input and proof-run files | Filesystem writes | Merchant proof/evidence/completion | `WRITE_OR_EXECUTION_INSTRUCTION`, never supplied to model |

## Field-Level Classification

Field classes for future source snapshots:

| Classification | Examples discovered | Future handling |
| --- | --- | --- |
| `OPERATOR_SAFE_SUMMARY` | Primary action label, next step, expected outcome, broad product/domain label, source file references, explicit limitations | Allowed for first adapter after workspace filtering |
| `OPERATOR_SAFE_WITH_REDACTION` | Merchant display name, relationship ID, campaign ID, lead stage, conflict note, blocker | Use only after redaction or generalization |
| `INTERNAL_TECHNICAL` | schema, generated_at, source file paths, resolver validation status, source health | Allowed in technical details or source trace, not primary guidance |
| `OPERATOR_PRIVATE` | workday state, operator daemon status, preflight findings, QA findings, rule suggestions | Requires trusted operator identity and permission |
| `MERCHANT_OR_CUSTOMER_SENSITIVE` | lead name, domain, email, send target, merchant shop, client ID, packet ID, reservation ID, payment reference, revenue values, customer outcomes | Exclude from first adapter unless explicit customer-data authority exists |
| `CREDENTIAL_OR_SECRET` | environment values, tokens, API keys, private keys, OAuth materials | Never permitted |
| `WRITE_OR_EXECUTION_INSTRUCTION` | execute-primary-action, lead action, workday start/stop, proof/evidence write helpers, packet mutation paths | Never supplied to the model |
| `PROVIDER_METADATA` | packet provider status, Ollama provider metadata, model/runtime metadata | Allowed only as bounded source trace when relevant |
| `GENERATED_OR_UNVERIFIED` | system-map generated_at, `Date.now` fallback IDs, placeholder capacity entries, generated summaries | Must be labeled and cannot become source truth |
| `PLANNED_OR_PLACEHOLDER` | analytics placeholders, products placeholders, capacity placeholder merchants | Must not appear as live capability |

Initial included fields for the selected future adapter:

- `workspace_id`: `stafford-media`
- `source_type`: `operator_primary_action_snapshot`
- `source_record_id`: primary action ID or stable fallback source ID
- `title`: operator-facing action label
- `summary`: next step and expected outcome in plain language
- `why`: explicit `why_now` text only if already present
- `status`: informational/candidate, not approved or executing
- `source_references`: source snapshot file references and decision-trace source files
- `limitations`: static/read-model source, no execution, no approval, no live identity enforcement
- `freshness`: derived from source `generated_at` when present, otherwise `Unknown`

Initial excluded fields:

- lead email, contact data, send targets, message bodies
- packet IDs, reservation IDs, payment references, session IDs
- raw merchant/customer identifiers unless separately redacted
- exact revenue amounts and numeric business metrics
- numeric priority or confidence scores
- raw resolver candidates and alternatives
- write route paths, shell commands, scripts, API mutation endpoints
- environment-derived URLs and any environment values
- generated fallback IDs based on `Date.now`

## Runtime Source Snapshot Contract

A future immutable runtime source snapshot should conceptually contain:

- `snapshot_id`
- `adapter_id`
- `source_type`
- `source_record_id`
- `workspace_id`
- `product_scope`
- `captured_at`
- `source_updated_at`
- `freshness`
- `authority_classification`
- `privacy_classification`
- `permission_requirement`
- `content_summary`
- `structured_facts`
- `excluded_fields`
- `exact_source_reference`
- `limitations`
- `conflict_status`
- `immutable_digest` or equivalent future integrity reference

The snapshot must never include:

- raw database access
- unrestricted API access
- mutable object references
- write routes
- secrets or credentials
- rollback commands
- execution tokens
- customer data outside authority
- data from another workspace

No hashing or persistence is implemented by this mission.

## Identity and Authorization Dependencies

S007 review confirms:

- A local operator issuer exists as implementation evidence, but deployed identity authority is not available for StaffordOS runtime read enforcement.
- `WorkspaceContext` remains presentation-only and cannot authorize server reads.
- S009.00 states local prototypes may use static fixtures only until deployed identity exists.
- Server-side authorization, workspace membership, role claims, permission claims, and production governance remain future requirements.

Dependency classification:

| Function | Classification | Reason |
| --- | --- | --- |
| Static fixture validation and deterministic source-shape tests | `CAN_BUILD_WITH_STATIC_LOCAL_FIXTURES` | No runtime data or identity claim required |
| Primary Action Snapshot source adapter as an unwired library with local test fixtures | `CAN_BUILD_AS_LIBRARY_WITHOUT_RUNTIME_USE` | Can prove transformation and field filtering without runtime use |
| Runtime invocation for operator-private sources | `MUST_WAIT_FOR_OPERATOR_IDENTITY` | Requires trusted user identity |
| Workspace-scoped runtime reads | `MUST_WAIT_FOR_WORKSPACE_MEMBERSHIP` | Client-selected workspace cannot authorize server scope |
| Customer-sensitive lead, merchant, packet, revenue, or fulfillment records | `MUST_WAIT_FOR_PERMISSION_CLAIMS` and `MUST_WAIT_FOR_PRODUCTION_GOVERNANCE` | Requires explicit data authority |
| Any production source adapter | `MUST_WAIT_FOR_SERVER_AUTHORIZATION` | Must not rely on local presentation context |

Rules:

- Presentation-only workspace selection cannot authorize runtime reads.
- Client-selected workspace cannot determine server data scope.
- Operator-only sources require trusted server identity.
- Customer-sensitive records require explicit data authority.
- Professional and Personal runtime sources remain prohibited.
- Model-provider selection does not grant data access.

## Mutation and Write-Adjacency Review

Write-capable paths discovered near candidate read models:

- `app/api/operator/execute-primary-action/route.ts` writes local action and outcome files and may spawn Node.
- `app/api/operator/lead-registry/action/route.ts` writes lead registry, lead events, send ledger, and send execution log.
- `app/api/operator/workday/start/route.ts` and `stop/route.ts` run shell scripts through `execFile`.
- `app/operator/command-center/page.tsx` server actions write ShopiFixer before evidence, after evidence, scoped fix, proof package, and completion.
- `app/operator/shopifixer-pilot/page.tsx` server actions write proof-run artifacts and completion state.
- `lib/operator/writeShopifixer*.ts` are explicit filesystem write helpers.
- `components/operator/ExecutePrimaryActionButton.tsx`, `LeadActions.tsx`, `LeadQueue.tsx`, and `WorkdayControlPanel.tsx` contain mutation POST clients.

Future adapter dependency tests must prove:

- no imports from `writeShopifixer*.ts`
- no imports from `/app/api/operator/*/route.ts`
- no imports from mutation-capable client components
- no `POST`, `writeFileSync`, `execFile`, queue, payment, packet mutation, approval, reject, retry, deploy, rollback, or completion dependencies
- no direct `/operator` page imports
- no direct model access to `/operator`

## Freshness and Conflict Model

Freshness classifications:

- `Current`
- `Recent`
- `Historical`
- `Unknown`
- `Stale`

No universal time threshold is defined. Each adapter must document its source-specific rule.

Observed timestamp availability:

- Primary action snapshot: `generated_at` is available in the committed snapshot and synthesized loader output.
- CEO truth snapshot: metadata `generated_at` and source file status may be available.
- Lead and client records: `updated_at`, `generatedAt`, or `created_at` may be present but inconsistent.
- Relationship resolver: timeline fields and source facet timestamps are available when inputs contain them.
- Execution log: `timestamp` is available for some records, but fallback normalization can create `Date.now` IDs.
- System map API/page: generated at request time, so it is a generated summary rather than immutable source truth.
- Placeholder pages: no authoritative freshness.

Conflict handling:

- If two read models disagree, preserve both source claims and mark `conflict_status`.
- If runtime state differs from repository documentation, report the conflict and prefer runtime canonical only for the bounded claim it actually owns.
- If cached state differs from provider state, disclose source authority and freshness; do not silently choose one.
- If generated summaries differ from canonical records, treat generated summaries as derived and lower authority.
- If `/operator` and `/os` static fixtures disagree, the Chief of Staff should say, "I cannot verify that from the current StaffordOS sources," until a governed source snapshot resolves the conflict.

## Provenance and Source Authority

Runtime source authority levels:

- `Runtime canonical`
- `Repository canonical`
- `Provider confirmed`
- `Operator confirmed`
- `Derived read model`
- `Generated summary`
- `Historical evidence`
- `Needs verification`

Candidate source authority:

| Source | Original authority | Adapter reads | Transformation | Limitations |
| --- | --- | --- | --- | --- |
| Primary action snapshot | Runtime-canonical operator action snapshot | Snapshot/loader output | Redact sensitive fields, summarize action | Does not approve or execute action |
| CEO truth snapshot | Runtime-canonical cockpit snapshot | Snapshot JSON via API/page today; future direct source boundary preferred | Summarize health/action only | Contains broad business metrics requiring filtering |
| Action resolver report | Derived read model | Local truth files through resolver | Summarize action categories | Derived ranking is not Chief of Staff authority |
| Decision engine report | Derived read model | Action and relationship resolvers | Summarize arbitration | Must not rewrite S008 Decision Memory |
| Lead queue | Runtime read model | Lead registry and queues | Aggregate counts only before identity | Full rows contain customer/contact data |
| Revenue queue | Runtime read model | Lead, revenue, dashboard files | Aggregate only after authority | Contains money and merchant-specific facts |
| System health/map | Generated summary | Source inventory and truth files | Technical detail only | Generated request-time values are not source truth |

## Candidate Adapter Comparison

| Candidate | Value | Sensitivity | Identity dependency | Scope | Classification |
| --- | --- | --- | --- | --- | --- |
| Primary Action Snapshot Adapter | Directly answers what deserves attention and why | Medium; can be reduced with field allowlist | Library can be built with local fixtures; runtime use waits for identity | Small | `RECOMMENDED_FIRST` |
| Current Objectives Adapter | Useful for context but already static in S008 | Low | Can remain static | Small | `DEFER` because not an `/operator` runtime read model |
| Recent Decisions Adapter | Useful for why, but already static in S008 | Low | Can remain static | Small | `DEFER` because not runtime-canonical `/operator` truth |
| Proof and Learning Summary Adapter | Useful for source trace | Low to medium | Static today; runtime proof needs governance | Medium | `SAFE_AFTER_FIELD_FILTERING` |
| Lead or Revenue Summary Adapter | High business value | High customer, contact, merchant, and revenue sensitivity | Must wait for identity and permissions | Medium/high | `SAFE_AFTER_IDENTITY` |
| System Health Summary Adapter | Useful operational context | Medium technical/internal | Operator identity required for some fields | Medium | `SAFE_AFTER_FIELD_FILTERING` |
| Relationship 360 Adapter | High customer/account value | Very high: email, packet, payment reference, merchant, fulfillment | Must wait for identity, permission, and data authority | High | `DEFER` |

## Selected First Adapter

Selected future adapter:

`S009_06_PRIMARY_ACTION_READ_MODEL_SOURCE_ADAPTER`

Selected source:

Primary Action Snapshot as a governed Chief of Staff source snapshot.

Rationale:

- It maps directly to the Chief of Staff question: "What deserves my attention, and why?"
- It already expresses one current `/operator` primary action.
- It has explicit source references and decision-trace source files.
- It can be reduced to a safe operator-facing summary without customer contact data, packet data, write paths, or exact revenue amounts.
- It can be implemented library-only with deterministic fixtures before deployed identity.
- It preserves the provider-neutral boundary because model adapters receive only prepared source snapshots.

Boundary:

- The future adapter must not call `/api/operator/ceo-snapshot` directly in a model path.
- The future adapter must not import `/operator` pages or mutation-capable components.
- Runtime use must stay disabled until identity and permission authority exists.
- The first implementation should prove the source shape and filtering only.

## Static-to-Runtime Compatibility

The selected adapter supplements, rather than replaces, current static S009 fixtures.

Compatibility findings:

- Existing Chief of Staff source fixtures can keep the current source types until a future contract extends them with an operator read-model source type.
- Claim-source mapping remains explicit by source ID.
- Validator rules remain unchanged for this mission.
- The response structure remains unchanged.
- The Ollama adapter remains unchanged.
- Future OpenAI, Anthropic, Google, local, and deterministic adapters remain unchanged.
- Runtime source snapshots sit upstream of all model adapters.
- Demo fixtures remain useful as a non-runtime control case.

Future implementation note:

- If a new source type is needed, add it in a separate implementation mission with deterministic tests. Do not silently weaken S009.01 validator rules.

## Failure-Closed Design

Future adapter failures must return:

- no trusted snapshot
- explicit failure classification
- operator-safe limitation
- audit evidence
- no fallback invented from model knowledge

Failure classifications:

- `SOURCE_UNAVAILABLE`
- `UNAUTHORIZED_REQUEST`
- `WORKSPACE_MISMATCH`
- `STALE_SOURCE`
- `MALFORMED_SOURCE`
- `MISSING_TIMESTAMP`
- `CONFLICTING_RECORDS`
- `PROVIDER_TIMEOUT`
- `EMPTY_RESULT`
- `SENSITIVE_FIELD_PRESENT`
- `WRITE_CAPABLE_DEPENDENCY`
- `UNEXPECTED_SCHEMA`
- `PARTIAL_DATA`

Canonical fallback:

`I cannot verify that from the current StaffordOS sources.`

## Audit Contract

Future runtime-adapter audit evidence should include:

- `adapter_execution_id`
- `user_identity_reference`
- `workspace_id`
- `permission_decision`
- `source_requested`
- `source_authority`
- `fields_included`
- `fields_excluded`
- `snapshot_id`
- `capture_time`
- `source_update_time`
- `freshness`
- `conflicts`
- `limitations`
- `success_or_failure_status`
- `downstream_request_id`
- `privacy_classification`

No audit persistence is implemented by this mission.

## Test Strategy

Future selected adapter tests should cover:

- exact source allowlist
- exact field allowlist
- excluded secrets and sensitive fields
- workspace enforcement
- permission enforcement
- read-only dependency graph
- no write imports
- no mutation calls
- deterministic transformation
- provenance preservation
- freshness classification
- conflict preservation
- empty result
- unavailable source
- malformed source
- static validator compatibility
- provider-neutral compatibility
- no Ollama dependency
- no model invocation
- input immutability

Static scans should fail on:

- `writeFileSync`
- `execFile`
- `POST`
- `fetch` to model, packet, product, or operator APIs from the model-facing adapter
- `/operator` page imports
- `writeShopifixer`
- `ExecutePrimaryActionButton`
- `LeadActions`
- `WorkdayControlPanel`

## UI Impact Review

No UI change is required for this discovery mission.

Future UI integration, if separately authorized, should:

- show source freshness
- distinguish static from runtime-backed sources
- display runtime authority
- display unavailable state
- display conflicts
- show operator-review requirement
- preserve the existing source trace section

Future UI integration must not:

- add chat
- add free-form input
- add generation buttons
- imply authorization from `WorkspaceContext`
- show runtime data in Professional or Personal workspaces
- bypass the deterministic validator

## Model-Provider Boundary

The selected read-model adapter is upstream of all model adapters.

It must work identically with:

- deterministic fixture adapter
- local Ollama adapter
- future OpenAI adapter
- future Anthropic adapter
- future Google adapter
- non-AI deterministic reasoning

No runtime source may be coupled to `qwen2.5:1.5b`.

No model may directly query `/operator`.

Ollama remained stopped throughout this mission.

## Selected Next Implementation Slice

Recommended next mission:

`S009_06_PRIMARY_ACTION_READ_MODEL_SOURCE_ADAPTER`

Scope:

- Implement one library-only Primary Action Snapshot source adapter.
- Use deterministic local fixtures and/or direct read-side projection tests only.
- Produce a governed source snapshot object compatible with the S009 Chief of Staff request model.
- Field-allowlist only the operator-safe primary action summary, reason, expected result, broad product/domain label, source references, freshness, and limitations.
- Explicitly exclude customer contact data, raw merchant identifiers where not redacted, payment references, packet IDs, revenue amounts, numeric confidence/priority scores, write paths, and environment values.
- Do not wire the adapter into `/os` display.
- Do not call Ollama.
- Do not invoke any model.
- Do not modify `/operator`.
- Do not modify S009.01 validator rules unless a separate defect mission is approved.

Identity assumptions:

- Local tests may use static Stafford Media fixtures.
- Runtime invocation remains off.
- Trusted operator identity, workspace membership, permission claims, and server authorization remain future dependencies.

Expected outcome:

- A deterministic source adapter contract proves the first runtime-canonical source can be transformed into an immutable, source-traced, field-filtered snapshot without weakening the Chief of Staff validator or provider-neutral model boundary.

## Artifacts Created

- `staffordos/architecture/S009_05_GOVERNED_OPERATOR_READ_MODEL_ADAPTER_DISCOVERY.md`
- `staffordos/architecture/S009_05_GOVERNED_OPERATOR_READ_MODEL_ADAPTER_DISCOVERY.json`

## Validation

Required validation for this mission:

- `jq staffordos/architecture/S009_05_GOVERNED_OPERATOR_READ_MODEL_ADAPTER_DISCOVERY.json`
- `git diff --check`

No route probes are required because no application code or routes changed.

## Diff Review

Allowed diff:

- S009.05 Markdown artifact
- S009.05 JSON artifact

Disallowed diff:

- application code
- `/operator`
- `/os`
- tests
- scripts
- package files
- provider configuration
- auth, OAuth, KMS, JWT, issuer code
- Stripe
- database, Prisma, migrations, APIs, queues, packets, execution workflows
- ShopiFixer or Abando runtime behavior
- unrelated working-tree changes

## Residual Risks

- Primary action runtime data currently blends safe action guidance with sensitive merchant and revenue context.
- `loadPrimaryActionSnapshot` can call localhost `/api/operator/ceo-snapshot`; a future adapter should avoid API self-fetch in favor of an explicit source boundary.
- Some `/operator` read models use generated timestamps or fallback IDs and are not immutable snapshots today.
- `/operator` command-center and ShopiFixer pilot pages are write-adjacent.
- Lead, relationship, revenue, packet, and fulfillment surfaces require identity and data-authority work before runtime Chief of Staff ingestion.
- No deployed S007 identity authority exists yet.

## Rollback

Rollback requires only:

`git revert <S009.05 commit SHA>`

No runtime, model, application, database, authentication, Stripe, ShopiFixer, Abando, provider, or deployment rollback is required.

## Confirmation of Non-Impact

This mission did not:

- start or invoke Ollama
- connect a model to `/os`
- implement a runtime adapter
- modify `/operator`
- modify application code
- modify authentication, OAuth, KMS, JWT, or issuer code
- modify Stripe
- modify databases, Prisma, migrations, APIs, queues, packets, or execution workflows
- modify ShopiFixer or Abando runtime behavior
- deploy
- push
- include unrelated working-tree changes
