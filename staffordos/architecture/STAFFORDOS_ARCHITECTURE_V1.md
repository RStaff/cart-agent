# StaffordOS Architecture V1

## 1. Product Thesis

StaffordOS is an owner-first operating system for running businesses and, later, professional and personal workspaces. It is not a collection of unrelated applications. Its core job is to help the operator answer:

> What should I do next?

Every screen, recommendation, automation, and record should help the operator observe the current situation, interpret what matters, decide what to do, act under authority, prove the result, and preserve learning for next time.

## 2. Operating Loop

Canonical loop:

Observe -> Interpret -> Decide -> Act -> Prove -> Learn

S008 represents the loop with static, read-only foundations:

- Observe: Workspace, Capability, Evidence.
- Interpret: Objective, context, risk, Evidence review.
- Decide: Decision.
- Act: Action.
- Prove: Proof and observed Outcome.
- Learn: Learning.

Current limitation: the loop is represented locally and statically. StaffordOS does not yet perform live observation, dynamic prioritization, autonomous decision-making, execution, automated verification, or autonomous learning.

## 3. Platform And Workspace Model

StaffordOS owns shared platform primitives:

- identity
- profile
- sessions
- workspace membership
- roles
- permissions
- capability access
- navigation
- missions
- objectives
- actions
- decisions
- evidence
- proof
- memory
- governance
- audit
- notifications
- agent policy

Workspace families own domain-specific objects, workflows, views, language, policy, and data.

Current canonical workspace families:

- Business
- Professional
- Personal

The shared platform does not imply shared data access.

## 4. Owner-First Membership Model

The owner-first model is:

Owner + optional invited members + access granted per workspace and capability.

Rules:

- Business data is private to the owner unless explicitly shared.
- Professional data is owner-private by default.
- Personal data is owner-private by default.
- Family and Media are future selectively shared Personal capabilities, not universally shared spaces.
- Workspace membership and capability permission are separate.
- AI agents inherit the active user, workspace, role, permission, and policy boundaries.
- Cross-workspace actions require explicit owner authorization.

Current limitation: S008 implements no real membership, server authorization, invited users, family access, employee access, or learner access.

## 5. Operator Language Principles

Canonical authority:

`staffordos/architecture/S008_02_STAFFORDOS_OPERATOR_LANGUAGE_STANDARD.md`

StaffordOS should sound clear, direct, calm, specific, evidence-based, respectful, action-oriented, and honest about uncertainty.

Primary copy should help the operator answer:

- What happened?
- Why does it matter?
- What should I do?
- What is blocking me?
- What happens next?
- What will prove completion?

Avoid exposing internal implementation terms as primary UI language. Technical details may exist in secondary evidence or developer views when useful.

## 6. Canonical Operating Objects

Workspace:

The active boundary for presentation, data, memory, permissions, policy, and agent behavior.

Capability:

A business or life function StaffordOS can help operate, such as people to contact, money to collect, current work, or future professional and personal modes.

Mission:

A broader outcome or sustained purpose.

Objective:

A specific result that advances a Mission.

Decision:

What was chosen, why, by whom, under what authority, with what evidence and tradeoffs.

Action:

What should be done next to advance an Objective because of a Decision.

Evidence:

What supports the reasoning before Action execution.

Proof:

What demonstrates the observed Outcome after Action execution.

Outcome:

What actually happened.

Learning:

A governed conclusion StaffordOS may reuse later after authority, evidence, and applicability are established.

## 7. Object Relationships

Canonical chain:

Workspace -> Mission -> Objective -> Decision -> Action -> Evidence -> Proof -> Outcome -> Learning

Current S008 relationship rules:

- Relationships must be explicit where implemented.
- No title-based inference should create authority.
- Unsupported IDs fail safely.
- Planned examples do not become current truth.
- Evidence does not become Proof automatically.
- Expected result does not become observed Outcome.
- Proof does not complete an Action automatically.
- Learning does not alter priority, permission, playbook, or policy automatically.

Current limitation: Mission exists conceptually and as IDs in records, but no runtime Mission Registry exists yet.

## 8. Workspace Isolation

Business:

Stafford Media is available now. ShopiFixer and Abando are Business product lenses or capability areas. Existing `/operator` routes remain the runtime-canonical Stafford Media surfaces.

Professional:

Planned private workspace. It should support Job Search and My Job modes later. It currently has no live employer, application, interview, meeting, compensation, or accomplishment data.

Personal:

Planned private workspace. It may later include private planning, learning, family activities, media watching, media creation, memories, and governed learner access. It currently has no live family, media, memory, sharing, or learner data.

Isolation rules:

- Professional and Personal expose no Stafford Media operating objects.
- Planned workspaces do not link to Stafford Media `/operator` routes except an explicit return path where appropriate.
- Presentation-only workspace selection is not authorization.
- Memory and search boundaries must remain workspace-aware before runtime data is introduced.

## 9. Authority And Governance

StaffordOS is AI-assisted, not AI-controlled.

Authority rules:

- AI may prepare and explain.
- AI may not approve itself.
- Decisions require authority.
- Actions require execution authority.
- Proof requires verification authority.
- Learning requires governed review before future reuse.
- Policy requires a separate governance decision.
- Audit must preserve what was chosen, why, by whom, and under what authority.

Current limitation: S008 has no runtime approval workflow, execution workflow, verification workflow, policy workflow, or immutable audit store.

## 10. Current /os Route Map

| Route | Purpose | Authority |
| --- | --- | --- |
| `/os` | Workspace-aware Home answering what deserves attention | Static S008 presentation |
| `/os/capabilities` | Shows what StaffordOS can currently help with | Static capability map |
| `/os/objectives` | Shows what StaffordOS is working toward | Static Objective Registry |
| `/os/decisions` | Shows decisions and why they were made | Static Decision Registry |
| `/os/actions` | Shows what to do next | Static Action Registry |
| `/os/evidence` | Shows why StaffordOS believes actions are worth considering | Static Evidence Foundation |
| `/os/proof` | Shows what has been proven | Static Proof Foundation |
| `/os/learning` | Shows what StaffordOS has learned | Static Learning Foundation |
| `/os/knowledge` | Read-only path to decisions, evidence, proof, and learning | Static knowledge hub |
| `/os/command` | Framework section | Static placeholder |
| `/os/work` | Framework section | Static placeholder |
| `/os/pipeline` | Framework section | Static placeholder |
| `/os/governance` | Framework section | Static placeholder |
| `/os/system` | Framework section | Static placeholder |

`/operator` remains runtime-canonical until `/os` reaches parity through governed migration.

## 11. Static Versus Runtime Authority

Implemented locally:

- `/os` shell.
- Workspace selector.
- Workspace Registry.
- Capability Map.
- Objective Registry.
- Decision Registry.
- Action Registry.
- Evidence Foundation.
- Proof Foundation.
- Learning Foundation.
- S008 tests.

Runtime-canonical elsewhere:

- Existing Stafford Media `/operator` surfaces.
- Current ShopiFixer operating truth where exposed through `/operator`.

Architecture-defined:

- Mission model.
- Runtime workspace context.
- Runtime objective, decision, action, evidence, proof, and learning lifecycle.
- AI Chief of Staff boundary.
- Professional and Personal workspaces.
- Family, Media, and learner access.

Planned:

- Read-only Chief of Staff contract.
- Runtime read adapters.
- Server-derived workspace context.
- Governance-backed approvals, execution, proof verification, and learning review.

Blocked:

- Trusted server authorization and production personalization require deployed identity and secure OAuth configuration.

## 12. AI Chief Of Staff Boundary

The first AI Chief of Staff version must be governed and read-only.

It may:

- Read allowed static workspace context.
- Summarize Objectives.
- Explain Actions.
- Trace Actions to Decisions and Evidence.
- Show Proof.
- Retrieve confirmed Learning.
- Identify missing information.
- Propose candidate recommendations with uncertainty.

It must not:

- Create operating truth silently.
- Approve Decisions.
- Execute Actions.
- Modify Objectives.
- Verify Proof.
- Confirm Learning.
- Cross workspace boundaries.
- Invent business data.
- Send messages.
- Mutate APIs or databases.

## 13. ShopiFixer And Abando Position

ShopiFixer:

- Current Business product lens inside Stafford Media.
- Existing runtime truth remains under `/operator` and ShopiFixer runtime systems.
- `/os` may link to authoritative ShopiFixer-related surfaces but must not duplicate write-capable behavior.

Abando:

- Future Business product lens or capability area.
- Architecture acknowledges Abando as a product that may contribute recovery opportunities, campaign actions, recovered-value evidence, product-health signals, and customer-success actions.
- No Abando runtime behavior is implemented or assumed by S008.

Shared rule:

Products may contribute context, Actions, Evidence, Proof, and Learning only through governed adapters and explicit workspace authority.

## 14. Professional Workspace Position

Professional is a planned owner-private workspace. It must remain useful before and after employment.

Future modes:

- Job Search.
- My Job.

Strict boundaries:

- No job, employer, application, interview, compensation, performance, or accomplishment data exists in S008.
- AI may later organize and prepare but may not invent experience, credentials, accomplishments, feedback, or commitments.
- External communication and application submission require explicit owner approval.

## 15. Personal, Family, And Media Position

Personal is planned and owner-private by default.

Future capability areas may include:

- private planning
- learning
- family activities
- media watching
- media creation
- approved sharing
- shared memories
- governed learner mode

Sharing rules:

- Family and Media access is explicit and capability-scoped.
- A child or learner must not reach production Business data.
- A guest must not browse private libraries or Business/Professional data by default.
- The owner retains approval, revocation, deletion, and audit authority.

No login, media storage, streaming, upload, generation, sharing, family profile, or learner runtime behavior exists in S008.

## 16. Current Limitations

- S008 objects are static and repository-backed.
- No runtime persistence exists for S008 operating objects.
- No runtime Mission Registry exists.
- No runtime read adapters exist from `/operator` to `/os`.
- Workspace context is presentation-only.
- No authorization boundary exists in `/os`.
- No AI Chief of Staff exists.
- No automated prioritization exists.
- No Action execution exists.
- No Proof verification exists.
- No automatic Learning or memory retrieval exists.
- Professional and Personal are planned only.

## 17. Incremental Roadmap

Recommended sequence:

1. S009_00_READ_ONLY_CHIEF_OF_STAFF_CONTRACT.
2. S009_01_STATIC_CHIEF_OF_STAFF_EXPLANATION_PROTOTYPE.
3. S008_15_RUNTIME_READ_MODEL_ADAPTER_DISCOVERY, if live `/operator` truth needs to be mapped before AI output.
4. Runtime Workspace Context design after identity deployment boundaries are clear.
5. Runtime Objective and Decision read model.
6. Runtime Action read model.
7. Governed Evidence and Proof ingestion.
8. Governed Learning review and policy-candidate boundary.
9. Stafford Media capability migration from `/operator` into `/os` after parity is proven.
10. Abando, Professional, Personal, Family, Media, and learner modes only after workspace isolation and permission authority are runtime-backed.

## 18. Canonical Source Index

Primary S008 sources:

- `staffordos/architecture/S008_00_STAFFORDOS_FOUNDATION_ARCHITECTURE.md`
- `staffordos/architecture/S008_01_EXISTING_OPERATOR_UI_AND_NEW_OS_SHELL_RECONCILIATION.md`
- `staffordos/architecture/S008_02_STAFFORDOS_OPERATOR_LANGUAGE_STANDARD.md`
- `staffordos/architecture/S008_03_OS_CAPABILITY_LINK_MAP.md`
- `staffordos/architecture/S008_04_MULTI_WORKSPACE_PLATFORM_AND_DECISION_MODEL_ARCHITECTURE.md`
- `staffordos/architecture/S008_05_UNIFIED_ACTION_AND_DECISION_MODEL.md`
- `staffordos/architecture/S008_06_WORKSPACE_CONTEXT_AND_OWNER_FIRST_SWITCHER_FOUNDATION.md`
- `staffordos/architecture/S008_07_WORKSPACE_AWARE_UNIFIED_HOME_AND_PRIORITY_PRESENTATION.md`
- `staffordos/architecture/S008_08_OBJECTIVE_REGISTRY_AND_MISSION_ALIGNMENT_FOUNDATION.md`
- `staffordos/architecture/S008_09_DECISION_REGISTRY_AND_DECISION_MEMORY_FOUNDATION.md`
- `staffordos/architecture/S008_10_UNIFIED_ACTION_REGISTRY_FOUNDATION.md`
- `staffordos/architecture/S008_11_EVIDENCE_FOUNDATION.md`
- `staffordos/architecture/S008_12_PROOF_FOUNDATION_AND_OUTCOME_VERIFICATION.md`
- `staffordos/architecture/S008_13_LEARNING_FOUNDATION_AND_INSTITUTIONAL_MEMORY.md`
- `staffordos/architecture/S008_14_STAFFORDOS_OPERATING_MODEL_CONSOLIDATION_AND_S009_READINESS.md`

Primary implementation sources:

- `staffordos/ui/operator-frontend/app/os`
- `staffordos/ui/operator-frontend/components/staffordos`
- `staffordos/ui/operator-frontend/lib/staffordos`

Identity dependency sources:

- `staffordos/shopifixer/S007_01B_OPERATOR_IDENTITY_TRUST_MODEL.md`
- `staffordos/shopifixer/S007_01B_OPERATOR_IDENTITY_OPERATING_RUNBOOK.md`
- `staffordos/shopifixer/S007_01G_KMS_SIGNER_IDENTITY_AND_PROOF.md`
- `staffordos/shopifixer/S007_01H_LOCAL_OPERATOR_ISSUER.md`
