# S008.05 Unified Action and Decision Model

## Classification

UNIFIED_ACTION_MODEL_READY_FOR_LOCAL_COMMIT

## Mission Boundary

This mission defines StaffordOS architecture and documentation only. It does not
modify application code, UI routes, UI components, CSS, authentication, Stripe,
ShopiFixer behavior, Abando behavior, APIs, workflows, schemas, migrations,
deployment configuration, or production state.

Authorized artifacts:

- `staffordos/architecture/S008_05_UNIFIED_ACTION_AND_DECISION_MODEL.md`
- `staffordos/architecture/S008_05_UNIFIED_ACTION_AND_DECISION_MODEL.json`

## Checkpoint Authority

Required local commits were verified in HEAD history:

| Checkpoint | Commit | Status |
| --- | --- | --- |
| S008 Foundation | `7d661d1cea4e447e855dfec59e80d6b8feb44bad` | present |
| S008 Capability Map | `4503ebb5a15484384d5dbb463dcdce551c3e9293` | present |
| S008 Multi-Workspace Architecture | `cd0757caacaf8d7c1523bc2bea63e0b715da9561` | current HEAD at discovery |

Current branch at discovery: `main`.

The broader worktree contains unrelated preexisting S007, StaffordOS runtime,
ShopiFixer, web, Prisma, daemon, identity, issuer, generated, and evidence
changes. Those files are excluded from this mission and must not be staged with
S008.05.

## Existing Model Discovery

Existing repository concepts are partial but substantial:

| Existing concept | Source | Current meaning | Gap |
| --- | --- | --- | --- |
| Primary action | `staffordos/decision/resolve_primary_action_v1.mjs`, `staffordos/snapshots/primary_action_snapshot_v1.json` | Single canonical answer to "What should Ross do next?" | Business-only, snapshot-oriented, not a general workspace action object. |
| Action candidate | `staffordos/ui/operator-frontend/lib/operator/actionResolver.ts` | Relationship-based candidate with title, impact, urgency, confidence, status, blocker, and rank rationale. | Tied to current operator business truth; not cross-workspace. |
| Decision report | `staffordos/ui/operator-frontend/lib/operator/decisionEngineResolver.ts` | Selects top action by category and arbitration rationale. | Useful read model, but not the canonical platform decision record. |
| CEO next best action | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | Read-only aggregation over lead, client, dashboard, and proof sources. | Route-level projection, not durable decision authority. |
| Next Action Card | `staffordos/ui/operator-frontend/components/staffordos/NextActionCard.tsx` | Placeholder fields: action, why now, evidence, expected value, risk, confidence, governance, deadline, proof. | Needs conceptual expansion, not code change in this mission. |
| Capability registry | `staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts` | Static `/os` map to existing `/operator` routes. | Needs future workspace and action-readiness metadata. |
| Workspace registry | `staffordos/ui/operator-frontend/lib/staffordos/workspaces.ts` | Canonical `/os` sections and operating questions. | Needs future workspace context, not a route rename now. |
| Operator language standard | `staffordos/architecture/S008_02_STAFFORDOS_OPERATOR_LANGUAGE_STANDARD.md` | Operator-facing wording rules. | Remains valid. |
| Multi-workspace architecture | `staffordos/architecture/S008_04_MULTI_WORKSPACE_PLATFORM_AND_DECISION_MODEL_ARCHITECTURE.md` | Platform/workspace boundary and decision concepts. | Needs a more precise object and relationship model. |
| Business lifecycle | `staffordos/authority/canonical_business_lifecycle_v1.md` | Marketing through referral and Abando expansion with evidence and gates. | Business-only; should feed, not replace, shared operating objects. |
| Product identity | `staffordos/authority/product_definitions_v1.md` | StaffordOS, ShopiFixer, Abando, and Actinventory identity. | Provides product/workspace boundaries. |
| Operator action authority | `staffordos/governance/operator_action_authority/operator_action_authority_v1.md` | Top-1 action is authoritative; top-5 is derivable but not one governed artifact. | Needs unified action registry/read model later. |
| Mission bindings | `staffordos/missions/*` | Mission records exist for ShopiFixer work. | Not yet generalized across all workspaces. |
| Memory units | `staffordos/memory/memory_units_v1.json` | Memory can be fact, event, insight, preference, or decision and is domain-scoped. | Needs workspace and learning destinations later. |
| Agent registry | `staffordos/agents/agent_registry_v1.json` | Agents have declared reads, writes, allowed actions, forbidden actions, approval requirements, and constraints. | Agent authority must inherit workspace context in future. |
| Abando system loop | `docs/abando-system-overview.md` | Signals to opportunities, scoring, slices, execution packets, gates, feedback, snapshot, operator brain. | Must stay product-engine bounded and API-driven. |

Conclusion:

StaffordOS already has action, decision, evidence, proof, relationship, mission,
capability, and agent concepts. S008.05 should not create a competing runtime
system. It defines the canonical operating model that future read models and UI
surfaces should converge on.

## Canonical Operating Objects

All future StaffordOS work should be expressible through the following objects.
These are conceptual platform objects, not schema changes in this mission.

| Object | Definition | Owner | Lifecycle | Existing evidence |
| --- | --- | --- | --- | --- |
| Mission | A meaningful outcome StaffordOS is pursuing. | Workspace owner or delegated operator. | Proposed -> accepted -> active -> paused -> completed -> archived. | `staffordos/missions/*`, mission evidence artifacts. |
| Objective | A measurable or observable result that advances a mission. | Mission owner. | Draft -> committed -> in progress -> met -> missed -> retired. | Fiscal model objectives, `objective_binding_v1.json`. |
| Action | The next concrete thing a person or approved agent may prepare or do. | Assigned owner; authority depends on action type. | Candidate -> recommended -> selected -> prepared -> approved if required -> in progress -> done/blocked/cancelled/expired. | Primary action snapshot, action resolver, lead/client next actions. |
| Decision | A recorded choice: what changed, why, by whom, with which evidence and authority. | Human approver or authorized system authority. | Proposed -> decided -> superseded or retained -> reviewed. | Decision traces, operator action events, S007 authorization decisions. |
| Evidence | Source-backed information used to interpret state or support a recommendation. | Source authority owner. | Captured -> validated -> referenced -> stale/replaced. | Audit evidence, proof runs, logs, registries, snapshots. |
| Proof | Evidence that completion occurred and claims are supportable. | Work owner and verifier. | Required -> collected -> verified -> accepted/rejected -> archived. | ShopiFixer proof runs, proof references, send proof records. |
| Learning | A reusable lesson StaffordOS should retain after a decision or outcome. | Workspace owner; AI Governance for agent lessons. | Captured -> classified -> approved if sensitive -> applied -> reviewed. | `memory_units_v1.json`, outcome events, rule suggestions. |
| Risk | A possible loss, error, leakage, authority failure, or bad tradeoff. | Relevant workspace or governance owner. | Identified -> assessed -> mitigated/accepted -> monitored -> closed. | Risk arrays in primary action, blocker detection, gates. |
| Blocker | A current condition that prevents or should prevent progress. | Owning workspace/capability. | Detected -> assigned -> clearing action selected -> cleared/waived/expired. | Revenue blockers, client blockers, preflight gates, validation artifacts. |
| Opportunity | A potential gain that may justify action. | Workspace owner or product owner. | Detected -> evaluated -> qualified -> pursued/declined -> converted/lost/learned. | Lead/opportunity data, Abando opportunity model, revenue queue. |
| Outcome | What happened after action or decision. | Action owner or system authority. | Expected -> observed -> verified -> scored -> learned. | Outcome events, outcome scores, completion proofs. |
| Relationship | A person, organization, merchant, stakeholder, family member, guest, or entity that work relates to. | Workspace owner; relationship owner where delegated. | Identified -> linked -> active -> dormant/closed -> archived. | Relationship resolver, lead/client/merchant spine. |
| Capability | A bounded StaffordOS ability that can be read-only, guided, or action-capable. | Platform owner or capability owner. | Planned -> available -> governed -> deprecated/retired. | S008.03 capability registry, capability matrix. |
| Workspace | The privacy, policy, membership, language, and data boundary in which work occurs. | Workspace owner. | Created -> configured -> active -> paused/archived. | S008.04 architecture; current `/os` section registry is not yet a full workspace registry. |

Ownership rules:

- Every object must have an owner or source authority.
- Objects can be projected into UI, but projections do not become authorities.
- AI can prepare, explain, and recommend objects; it cannot own final authority
  unless a separately governed system authority grants that role.
- Sensitive objects inherit workspace privacy and visibility.

## Relationship Model

Primary operating chain:

```
Mission
  -> Objectives
  -> Actions
  -> Evidence
  -> Decision
  -> Proof
  -> Learning
```

Relationship rules:

- A Mission contains one or more Objectives.
- An Objective produces Action candidates.
- An Action must cite Evidence or explain the evidence gap.
- A Decision selects, rejects, delays, or changes an Action.
- Proof closes an Action or Objective only when completion is observable.
- Learning is captured from Decision plus Outcome plus Proof.

Cross-object rules:

```
Risk -> Decision
Blocker -> Action
Opportunity -> Action
Relationship -> Mission
Capability -> Workspace
Workspace -> every object
```

Interpretation:

- A Risk should affect a Decision, not silently lower a score without
  explanation.
- A Blocker should create or select an Action to clear it.
- An Opportunity should create an Action only after evidence supports pursuing
  it.
- A Relationship may anchor a Mission, Objective, Action, Evidence, Proof, or
  Learning item.
- A Capability is available only inside permitted Workspaces.
- Workspace context must be present before cross-workspace search, notification,
  memory, or AI action.

## Action Model

Every Action should conceptually contain:

| Field | Meaning | Operator-facing guidance |
| --- | --- | --- |
| Title | Short internal or canonical action name. | Use clear language, not route names. |
| Operator wording | The exact phrase shown to the person. | Verb-led: "Review the proposal", "Contact this lead". |
| Workspace | The active workspace boundary. | Always present, even if hidden on owner-only views. |
| Mission | Outcome this action advances. | Explain how the action fits the larger result. |
| Objective | Specific measurable/observable result. | Keep it concrete. |
| Evidence | Sources supporting the action. | Show concise evidence first; details can expand. |
| Why now | Reason this action is timely. | Explain timing, urgency, dependency, or decay. |
| Expected value | Benefit or value type. | Distinguish captured revenue, estimates, learning, safety, and family value. |
| Expected outcome | What should happen if action succeeds. | State observable result. |
| Confidence | How strongly StaffordOS trusts the recommendation. | Pair with reason; avoid unsupported certainty. |
| Risk | What could go wrong. | Include authority, privacy, quality, relationship, and opportunity-cost risks. |
| Effort | Expected work required. | Use time or effort bands. |
| Urgency | Time pressure. | Do not conflate urgency with value. |
| Priority reasoning | Why this outranks alternatives. | Show factors, not only a score. |
| Approval needed | Human/system authority required before action. | Be explicit; no hidden approvals. |
| Owner | Person, role, or agent responsible. | Must be attributable. |
| Status | Current action state. | Use operator-readable labels. |
| Proof requirement | What will prove completion. | Required for governed work. |
| Learning destination | Where lessons go after completion. | Workspace memory, playbook, rule suggestion, or no retention. |
| Related entities | Linked relationship, product, customer, project, asset, or packet. | Links are scoped by workspace. |
| Technical details | IDs, route, source file, fingerprint, enum, debug context. | Hidden under technical details. |
| Visibility | Who can see it. | Owner-private by default outside explicit sharing. |
| Lifecycle state | Candidate/recommended/selected/prepared/approved/in progress/done/blocked/cancelled/expired. | The UI should translate state into plain language. |

Action lifecycle:

```
candidate -> recommended -> selected -> prepared -> approved -> in_progress ->
done
```

Alternate terminal or holding states:

- blocked
- cancelled
- expired
- rejected
- delegated
- waiting

Rules:

- No action can establish its own authority.
- Caller-supplied status or approval cannot make an action valid.
- Write-capable actions require explicit authority and audit.
- Read-only actions may still require visibility checks.
- Actions must never hide evidence gaps.

## Decision Model

Every Decision should answer:

| Question | Required answer |
| --- | --- |
| What changed? | The selected action, status, priority, scope, owner, policy, or outcome change. |
| Why? | The reasoning, timing, objective, and trigger. |
| Evidence? | Source-backed evidence and confidence. |
| Alternatives? | What else could have been chosen. |
| Tradeoffs? | What is gained, delayed, or sacrificed. |
| Risk? | Known risks and mitigation. |
| Who approved? | Human operator, delegated owner, or governed system authority. |
| Authority? | Permission, policy, approval, gate, or source authority. |
| Expected result? | The observable next state. |
| Proof expected? | What will prove the decision worked or completed. |
| Learning captured? | What should be retained and where. |

Decision lifecycle:

```
proposed -> decided -> enacted -> observed -> reviewed -> retained/superseded
```

Rules:

- Decisions must be attributable.
- Decisions must cite evidence or explicitly record missing evidence.
- Decisions must distinguish recommendation from approval.
- Decisions must preserve alternatives when alternatives affected priority.
- Decisions may be generated as read models, but durable authority is required
  before they mutate state.

## Next Action Card Model

The current S008 card is structurally right and should not be redesigned in code
during this mission. Conceptually, it should be the operator-facing projection of
an Action plus its governing Decision context.

Primary card fields:

- What to do
- Why now
- Expected result
- Time or effort
- Confidence
- Approval needed
- Deadline or decay

Expanded explanation:

- Evidence
- Priority reasoning
- Alternatives
- Tradeoffs
- Risk
- Related entities
- Expected value

Governance panel:

- Authority required
- Approval state
- Permission or role requirement
- Proof requirement
- Audit trail
- Policy constraints

Technical detail:

- Source files
- Routes
- internal IDs
- enum values
- fingerprints
- resolver names
- generated timestamps

Operator-first wording:

- Prefer "What to do" over "Action".
- Prefer "Why now" over "priority rationale".
- Prefer "What will prove this worked" over "proof".
- Prefer "Rules and approvals" over "governance" when the person needs to act.
- Keep implementation terms only in technical details.

## Workspace Mapping

The same Action object should render differently by workspace without changing
the underlying model.

| Workspace family | Example action wording | Expected value language | Proof language | Hidden or minimized details |
| --- | --- | --- | --- | --- |
| Business | Review the next merchant follow-up. | Pipeline movement, captured revenue, customer trust, delivery progress. | Payment, sent message, customer response, proof package, completion evidence. | Raw file paths, packet internals, resolver names. |
| Professional | Prepare for the next interview step. | Role fit, readiness, time sensitivity, relationship value, career learning. | Updated prep notes, approved materials, completed follow-up, outcome captured. | Employer-sensitive details unless owner expands. |
| Personal | Choose the next private priority. | Time, energy, health, safety, learning, creative progress, family value. | Private note, completed task, saved memory, approved shared plan. | Business/customer evidence and professional records. |

Examples:

- A Business action may be ranked high because it can unblock payment, but it
  still must show whether payment authority or customer approval is required.
- A Professional action may be urgent because an interview is soon, but it must
  not invent credentials or reuse employer-confidential information.
- A Personal action may be valuable because it lowers household friction, but it
  must remain owner-private unless explicitly shared.

## AI Chief of Staff Model

AI may:

- summarize
- prioritize
- prepare
- recommend
- explain
- draft
- identify gaps
- surface risks
- capture learning

AI may not:

- invent evidence
- override authority
- mutate state without a governed action path
- hide uncertainty
- approve itself
- bypass workspace boundaries
- expose private memory across workspaces
- turn estimates into captured revenue
- treat product-engine access as platform authority

AI responsibilities:

- Always answer the next-action question with evidence and uncertainty.
- Show why an action matters before asking the operator to act.
- Separate recommendation, approval, execution, proof, and learning.
- Use the active workspace context and capability permissions.
- Keep blocked work visible, not buried.
- Preserve institutional knowledge after outcomes are observed.

## Governance Model

Approval boundaries:

- Human approval is required for irreversible changes, customer-facing
  communication, financial commitments, production changes, external
  submissions, sharing changes, and sensitive personal/professional actions.
- System authority may decide only within a proven narrow domain, such as Stripe
  payment verification or packet lifecycle rules.
- AI recommendations are not approvals.

Authority boundaries:

- StaffordOS platform authority coordinates work.
- Product engines own product execution.
- ShopiFixer and Abando behavior must not be changed by shared model
  documentation.
- Service authentication is not human authority.
- Workspace membership is not capability permission.

Audit:

- Privileged actions and decisions must record actor, workspace, authority,
  evidence, reason, timestamp, and outcome.
- Events must not store secrets, raw credentials, private keys, bearer tokens, or
  unnecessary personal data.

Isolation:

- Workspace isolation controls data access.
- Memory isolation controls what AI can retrieve and reuse.
- Agent isolation controls reads, writes, tools, and authority by workspace.
- Search and notifications must be filtered by workspace and visibility.

## Implementation Impact

What changes later:

- Add workspace context metadata before expanding `/os`.
- Add a unified Action read model over existing primary action, action resolver,
  CEO snapshot, lead/client next actions, blockers, evidence, and proof.
- Add an Objective registry only after current objective sources are reconciled.
- Add a Decision registry only after decision authority and mutation boundaries
  are explicit.
- Extend action cards to display approval, effort, proof, and expanded reasoning
  consistently.

What remains unchanged now:

- `/operator` remains runtime-canonical.
- `/os` remains isolated and read-only.
- Current primary-action resolver remains unchanged.
- Current action resolver remains unchanged.
- Current decision resolver remains unchanged.
- ShopiFixer, Abando, Stripe, auth, APIs, schemas, migrations, and deployments
  remain unchanged.

Component impact:

- `NextActionCard` does not need immediate code change, but its conceptual model
  should guide future UI work.
- `WorkspacePage` can remain a shell placeholder.
- `STAFFORDOS_SECTIONS` remains valid, but later needs workspace applicability.
- `STAFFORDOS_CAPABILITIES` remains valid, but later needs workspace, authority,
  and action-readiness metadata.
- S008.02 language standard remains valid.

## Roadmap

Recommended next sequence:

| Mission | Purpose | Boundary |
| --- | --- | --- |
| S008.06 Workspace Context Engine | Add a read-only workspace context foundation and owner-first switcher metadata. | No auth, schema, or business logic changes unless separately authorized. |
| S008.07 Unified Home | Present the next action from existing evidence through `/os` without replacing `/operator`. | Read-only projection first. |
| S008.08 Objective Registry | Reconcile existing objective sources into one conceptual/read model. | No premature database migration. |
| S008.09 Decision Registry | Define durable decision records and authority boundaries. | Implement only after approval and mutation rules are clear. |
| S009 AI Chief of Staff | AI recommendations over canonical actions, decisions, evidence, risk, proof, and learning. | AI assists; it does not approve or mutate without authority. |

Later:

- Business workspace integration.
- ShopiFixer product/service lens parity.
- Abando read-only product summary integration.
- Professional workspace.
- Personal, Family, Media, and Learner workspaces/capabilities.
- Capability-scoped invited access.

## Validation

Completed validation:

- JSON artifact validation with `jq`: passed.
- Documentation diff validation with `git diff --check`: passed.
- Staged diff review before commit: passed; only the two authorized S008.05
  artifacts are included.

Runtime checks are intentionally omitted because this mission does not modify
application code.

## Rollback

Rollback is documentation-only:

1. Revert the S008.05 commit if created.
2. Or delete only:
   - `staffordos/architecture/S008_05_UNIFIED_ACTION_AND_DECISION_MODEL.md`
   - `staffordos/architecture/S008_05_UNIFIED_ACTION_AND_DECISION_MODEL.json`
3. No application, route, component, CSS, database, authentication, Stripe,
   ShopiFixer, Abando, Render, deployment, API, workflow, or migration rollback
   is required.

## Confirmation of Non-Impact

No application code, UI route, component, CSS, authentication, Stripe,
ShopiFixer behavior, Abando behavior, API, workflow, schema, migration,
database, deployment, Render configuration, production state, commit push, or
external service behavior was changed by this mission.
