# S008.09 Decision Registry and Decision Memory Foundation

## Classification

DECISION_MEMORY_READY_FOR_LOCAL_COMMIT

## Mission Boundary

S008.09 creates a static, read-only Decision Memory foundation for StaffordOS.
It answers:

- What did we decide?
- Why did we decide it?
- What evidence, alternatives, authority, proof, and learning should stay with
  that decision?

This mission does not add live decision-making, approvals, execution,
persistence, APIs, database access, AI decisions, authentication, Stripe,
ShopiFixer or Abando runtime behavior, deployment, push, or production change.

## Checkpoint Authority

HEAD at discovery:

- `33af5d22361ca6e3960e3445ceb01e2d2c25e5f7`

Required local commits were verified in HEAD history:

| Checkpoint | Commit | Status |
| --- | --- | --- |
| S008 foundation | `7d661d1cea4e447e855dfec59e80d6b8feb44bad` | present |
| S008 capability map | `4503ebb5a15484384d5dbb463dcdce551c3e9293` | present |
| S008 multi-workspace architecture | `cd0757caacaf8d7c1523bc2bea63e0b715da9561` | present |
| S008 unified action and decision model | `e386645f2d2c0aa625c2bec11edfd3b6c5c92f6a` | present |
| S008 workspace context | `735c4a5fad194afdc3cfbef28411cac77bfc7ddd` | present |
| S008 unified Home | `122bee6872099c4f909b5c025b3d375745af3134` | present |
| S008 Objective registry | `33af5d22361ca6e3960e3445ceb01e2d2c25e5f7` | current checkpoint at discovery |

The broader worktree contains unrelated S007, identity, issuer, web, Prisma,
daemon, generated, runtime, and evidence artifacts. Those files are excluded
from S008.09 and must not be staged with this checkpoint.

## Existing Decision Discovery

Repository evidence shows partial decision concepts, but no canonical Decision
Registry for `/os`:

| Source | Finding |
| --- | --- |
| `staffordos/architecture/S008_05_UNIFIED_ACTION_AND_DECISION_MODEL.md` | Defines Decision conceptually as what changed, why, evidence, alternatives, authority, proof, and learning. |
| `staffordos/decision/resolve_primary_action_v1.mjs` | Produces a decision trace for the current primary action; business-only and resolver-specific. |
| `staffordos/snapshots/primary_action_snapshot_v1.json` | Stores alternatives and decision trace for the primary action snapshot; not a general workspace Decision registry. |
| `staffordos/governance/operator_action_authority/operator_action_authority_v1.md` | Confirms current action authority is partial and top-1 oriented. |
| `staffordos/governance/READINESS_ARTIFACT_DETERMINISM_POLICY_V1.md` | Contains governance decisions about artifact determinism, but not a reusable `/os` Decision Memory surface. |
| `staffordos/architecture/S008_01_EXISTING_OPERATOR_UI_AND_NEW_OS_SHELL_RECONCILIATION.md` through `S008_08_OBJECTIVE_REGISTRY_AND_MISSION_ALIGNMENT_FOUNDATION.md` | Establish architectural decisions that can be safely recorded as static Decision Memory. |

Decision:

S008.09 creates a static read-side Decision registry for established
architecture decisions only. It does not compete with live decision traces,
approval gates, or resolver output.

## Decision Registry Contract

New file:

- `staffordos/ui/operator-frontend/lib/staffordos/decisionRegistry.ts`

Each Decision supports:

- `id`
- `workspaceId`
- `missionId`
- `objectiveId`
- `actionId`
- operator-facing `title`
- plain-language `summary`
- `situation`
- `decision`
- `why`
- `evidenceReferences`
- `alternativesConsidered`
- `tradeoffs`
- `risks`
- `uncertainty`
- confidence classification
- decision owner
- authority classification
- approval status
- timestamp
- expected result
- proof requirement
- outcome status
- learning destination
- privacy classification
- source classification
- authority status

Read methods:

- `getDecisionsForWorkspace`
- `getChosenDecisionsForWorkspace`
- `getDecisionById`
- `getDecisionsForObjective`
- `getDecisionsForMission`
- `getDecisionsForAction`

No create, update, delete, approve, reject, execute, persistence, API, database,
AI generation, or automatic status-change method exists.

## Source and Authority Classification

Source classifications:

| Source | Meaning |
| --- | --- |
| Repository-backed | Supported by exact repository artifacts and safe to show as current architecture memory. |
| Operator-recorded | Future owner-recorded decision; requires explicit authority. |
| Imported | Future imported decision; requires source and workspace validation. |
| AI-prepared | Future AI-prepared recommendation; never approved automatically. |
| Planned example | Future category only; must not appear as current decision. |
| Needs verification | Fails closed until evidence and authority are proven. |

Authority classifications:

| Authority | Meaning |
| --- | --- |
| Owner decision | Chosen by the owner through governed architecture checkpoints. |
| Approved delegate decision | Future delegated choice with explicit authority. |
| Policy-governed decision | Chosen under a documented policy authority. |
| Recommendation only | Not chosen and not approved. |
| Historical evidence | Preserved context, not current approval. |
| Needs authority review | Fails closed until authority is proven. |

Rules:

- AI-prepared does not mean approved.
- Recommendation only does not mean chosen.
- Planned examples never appear as current decisions.
- Repository-backed decisions require exact artifact references.
- Decisions without proven authority fail closed as `Needs review`.
- A Decision cannot approve itself.
- Decision authority and execution authority remain separate.

## Stafford Media Decisions

Initial Decision Memory is limited to five repository-backed architectural
decisions:

| Decision | Status | Source | Authority |
| --- | --- | --- | --- |
| Keep the current operator pages as the working source | Chosen | Repository-backed | Owner decision |
| Use language Ross can act on | Chosen | Repository-backed | Owner decision |
| Use Business, Professional, and Personal workspace families | Chosen | Repository-backed | Owner decision |
| Make Stafford Media available now and keep the other workspaces planned | Chosen | Repository-backed | Owner decision |
| Start Stafford Media Home with Start My Day | Chosen | Repository-backed | Owner decision |

These are architectural choices only. They are not customer, payment, staffing,
job, family, personal, approval, or execution decisions.

## Professional Decision Boundary

Professional has no current Decision records. No job-search, employer,
application, interview, compensation, meeting, or performance decision is shown
or connected.

## Personal Decision Boundary

Personal has no current Decision records. No private, family, media, health,
learning, creative, memory, or sharing decision is shown or connected.

## Decision Surface

New route:

- `/os/decisions`

Operator-facing title:

- Decisions and Why We Made Them

For Stafford Media, the surface shows only repository-backed architecture
decisions. Each record explains:

- what we chose
- why
- evidence
- other options
- authority
- expected result
- proof needed

For Professional and Personal, the surface shows planned-state guidance only
and no Stafford Media decisions.

## Objective Alignment

Decisions map to Objectives only through explicit `objectiveId` values in the
Decision registry.

Current mappings:

| Decision | Objective |
| --- | --- |
| Keep the current operator pages as the working source | Run the business from one clear loop |
| Use language Ross can act on | Run the business from one clear loop |
| Use Business, Professional, and Personal workspace families | Run the business from one clear loop |
| Make Stafford Media available now and keep the other workspaces planned | Run the business from one clear loop |
| Start Stafford Media Home with Start My Day | Run the business from one clear loop |

No title-based inference, Objective mutation, cross-workspace mapping, or
planned-workspace mapping occurs.

## Home and Knowledge Integration

Minimal read-only links were added:

- Stafford Media Home links to `/os/decisions`.
- Knowledge links to `/os/decisions`.

No primary action was added or changed. `/operator` behavior was not changed.
Professional and Personal planned states do not expose Stafford Media decisions.

## Decision, Proof, Outcome, and Learning

S008.09 preserves this lifecycle:

```text
Situation -> Evidence -> Decision -> Action -> Expected result -> Proof -> Outcome -> Learning
```

Distinctions:

- Decision is what was chosen and why.
- Action is what was done.
- Proof shows whether the expected result occurred.
- Outcome is what actually happened.
- Learning is what StaffordOS retains.

Expected results are not outcomes. Plans are not proof.

## AI and Authority Boundary

AI may later:

- summarize evidence
- compare alternatives
- identify missing information
- draft a recommendation
- explain tradeoffs
- propose proof requirements
- flag uncertainty

AI may not:

- approve its own recommendation
- invent evidence
- hide uncertainty
- mark a Decision as Chosen
- execute the related Action
- rewrite historical reasoning silently

S008.09 includes no AI decision-making or autonomous authority.

## Boundary Safety

S008.09 preserves the following boundaries:

- Stafford Media decisions appear only in Stafford Media.
- Professional and Personal expose no current Decision records.
- Planned examples never appear as `Chosen`.
- Recommendation-only entries never appear as approved.
- No write or approval methods exist.
- No `/operator` loaders are imported.
- No API or database access occurs.
- No Action is executed.
- No authorization changes occur.
- `/operator` behavior remains unchanged.

## Operator Language Review

New visible strings were reviewed against S008.02.

Preferred language used:

- Decisions and Why We Made Them
- What we chose
- Why
- Evidence
- Other options
- Authority
- Expected result
- Proof needed
- Needs review

Avoided primary language:

- registry
- entity
- enum
- foreign key
- resolver
- persistence
- runtime binding

## Files Changed

Application presentation:

- `staffordos/ui/operator-frontend/app/os/decisions/page.tsx`
- `staffordos/ui/operator-frontend/app/os/knowledge/page.tsx`
- `staffordos/ui/operator-frontend/components/staffordos/DecisionSurface.tsx`
- `staffordos/ui/operator-frontend/components/staffordos/UnifiedHome.tsx`
- `staffordos/ui/operator-frontend/lib/staffordos/decisionRegistry.ts`

Tests:

- `staffordos/ui/operator-frontend/lib/staffordos/decisionRegistry.test.mjs`

Documentation:

- `staffordos/architecture/S008_09_DECISION_REGISTRY_AND_DECISION_MEMORY_FOUNDATION.md`
- `staffordos/architecture/S008_09_DECISION_REGISTRY_AND_DECISION_MEMORY_FOUNDATION.json`

No CSS change was required; the surface reuses existing `/os` presentation
styles.

## Validation Results

- focused Decision tests: 18 passing
- existing Objective registry tests: 14 passing
- existing Home presentation tests: 11 passing
- existing Workspace registry tests: 8 passing
- `npm run build` in `staffordos/ui/operator-frontend`: passed with existing
  Turbopack trace warning and existing `/operator/shopifixer-pilot`
  serialization warnings during static generation; exit code 0
- local GET route checks: 16 routes returned HTTP 200

Routes verified:

- `/os`
- `/os/objectives`
- `/os/decisions`
- `/os/capabilities`
- `/os/knowledge`
- `/os/command`
- `/os/work`
- `/os/pipeline`
- `/os/governance`
- `/os/system`
- `/operator`
- `/operator/cockpit`
- `/operator/leads`
- `/operator/campaigns`
- `/operator/revenue-command`
- `/operator/command-center`

## Known Limitations

- No live Decision registry exists yet.
- No live approval workflow exists.
- No Action registry exists.
- No AI decision-making is implemented.
- No runtime persistence exists.
- Decision records are static architecture memory only.
- Professional and Personal remain planned presentation states.
- `/operator` remains runtime-canonical until parity is proven.

## Rollback

Rollback is a single local Git revert after commit:

```bash
git revert <S008.09 commit SHA>
```

No database, authentication, Stripe, ShopiFixer, Abando, migration, production,
or Render rollback is required.

## Next Mission Recommendation

S008.10 should define the first read-only Action alignment model that connects
static Objectives, static Decision Memory, existing capability links, and the
current primary-action truth without claiming live ranking, approval, or
execution authority.
