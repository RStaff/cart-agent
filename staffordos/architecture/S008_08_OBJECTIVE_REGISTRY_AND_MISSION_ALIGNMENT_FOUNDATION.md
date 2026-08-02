# S008.08 Objective Registry and Mission Alignment Foundation

## Classification

OBJECTIVE_REGISTRY_READY_FOR_LOCAL_COMMIT

## Mission Boundary

S008.08 creates a static, read-only Objective foundation for StaffordOS. It
answers:

- What are we trying to accomplish?
- Which objective does this action support?

This mission does not add live objectives, live measurement, automated
prioritization, AI ranking, runtime Action or Decision records, persistence,
APIs, database access, authentication, Stripe, ShopiFixer or Abando runtime
behavior, deployment, push, or production change.

## Checkpoint Authority

Required local commits were verified in HEAD history:

| Checkpoint | Commit | Status |
| --- | --- | --- |
| S008 foundation | `7d661d1cea4e447e855dfec59e80d6b8feb44bad` | present |
| S008 capability map | `4503ebb5a15484384d5dbb463dcdce551c3e9293` | present |
| S008 multi-workspace architecture | `cd0757caacaf8d7c1523bc2bea63e0b715da9561` | present |
| S008 unified action and decision model | `e386645f2d2c0aa625c2bec11edfd3b6c5c92f6a` | present |
| S008 workspace context | `735c4a5fad194afdc3cfbef28411cac77bfc7ddd` | present |
| S008 unified Home | `122bee6872099c4f909b5c025b3d375745af3134` | current checkpoint |

The broader worktree contains unrelated S007, identity, issuer, web, Prisma,
daemon, generated, runtime, and evidence artifacts. Those files are excluded
from S008.08 and must not be staged with this checkpoint.

## Existing Objective Discovery

Repository evidence shows objective-like concepts, but no canonical live
workspace Objective registry:

| Source | Finding |
| --- | --- |
| `staffordos/architecture/S008_05_UNIFIED_ACTION_AND_DECISION_MODEL.md` | Defines Objective conceptually as a result that advances a Mission. |
| `staffordos/system_inventory/objective_binding_v1.json` | Lists business objectives such as close deals, generate revenue, and operate system; not a general runtime registry. |
| `staffordos/authority/output/staffordos_business_core_definition_of_done_v1.md` | Defines what the current business core must help Ross answer. |
| `staffordos/authority/canonical_business_lifecycle_v1.md` | Defines marketing, leads, qualification, sales, payment, delivery, proof, customer success, referral, and Abando expansion. |
| `staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json` | Mission binding for controlled NoKings training; not a current business objective. |
| `staffordos/missions/mission_002_shopifixer_merchant_execution_readiness_binding_v1.json` | Governance binding for ShopiFixer readiness; not a runtime Objective registry. |
| `staffordos/snapshots/primary_action_snapshot_v1.json` | Current business-only primary action snapshot; not generalized across workspaces. |
| `staffordos/governance/operator_action_authority/operator_action_authority_v1.md` | Confirms current action authority is partial: top-1 action is authoritative, top-5 is derivable but not governed. |

Decision:

S008.08 creates a static read-side Objective registry for `/os` presentation. It
does not compete with live business snapshots or mission bindings.

## Objective Registry Contract

New file:

- `staffordos/ui/operator-frontend/lib/staffordos/objectiveRegistry.ts`

Each Objective supports:

- `id`
- `workspaceId`
- `missionId`
- operator-facing `title`
- plain-language `description`
- `whyItMatters`
- objective type
- status
- priority class
- owner
- success condition
- proof requirement
- evidence status
- timeframe
- related capabilities
- related actions
- privacy classification
- authority status
- source classification
- source artifacts

Read methods:

- `getObjectivesForWorkspace`
- `getActiveObjectivesForWorkspace`
- `getObjectiveById`
- `getObjectivesForCapability`

No write, persistence, API, scoring, import, or AI proposal method exists.

## Source and Authority Classification

Source classifications:

| Source | Meaning |
| --- | --- |
| Repository-backed | Supported by exact repository evidence and safe to show as current operating structure. |
| Operator-defined | Requires explicit owner approval in a future runtime model. |
| Imported | Requires source and workspace validation in a future import path. |
| AI-proposed | May be suggested later but is never automatically active. |
| Planned example | Future category only; must not appear as current operating truth. |
| Needs verification | Fails closed until source authority is proven. |

Rules:

- AI-proposed objectives are never automatically active.
- Planned examples are never current operating truth.
- Repository-backed objectives cite exact artifacts.
- Unsupported objectives fail closed as `Needs review`.
- No import or AI creation path is implemented in S008.08.

## Stafford Media Objectives

Initial current objectives are limited to three.

| Objective | Status | Source | Why included |
| --- | --- | --- | --- |
| Run the business from one clear loop | Active | Repository-backed | Supported by S008.05, S008.07, business-core definition of done, and objective binding. |
| Turn opportunities into paid work | Active | Repository-backed | Supported by business lifecycle, product definitions, business-core definition of done, and objective binding. |
| Complete customer work with proof | Active | Repository-backed | Supported by business lifecycle, business-core definition of done, Mission 002, and ShopiFixer readiness evidence. |

No live progress, due date, revenue value, owner assignment beyond repository
authority, or automatic measurement is shown.

## Professional Objective Boundary

Professional contains planned example categories only:

- Secure the right role
- Succeed in the current role

They are not active runtime objectives. No job, application, employer,
interview, meeting, deliverable, compensation, or professional data is connected.
They do not link to Stafford Media routes.

## Personal Objective Boundary

Personal contains one planned example category:

- Protect private priorities

It is not an active runtime objective. No private task, family member, health,
media, memory, learning record, creative project, or shared item is connected.
It does not link to Stafford Media routes.

## Objective Surface

New route:

- `/os/objectives`

Operator-facing title:

- What We Are Working Toward

The page shows:

- what each objective is trying to accomplish
- why it matters
- what completion looks like
- what proof is needed
- which existing capabilities support it
- whether it is active, planned, or repository-backed

For Stafford Media, the surface displays current repository-backed objectives.
For Professional and Personal, it displays planned-state guidance only.

## Home Alignment

The Stafford Media Home primary action now shows:

- `Supports: Run the business from one clear loop`

The Home also states that objective alignment is based on the current
StaffordOS structure and that live measurement is not connected yet.

This does not claim that the action was dynamically selected because of the
objective.

## Capability Alignment

Capabilities are mapped only through explicit `relatedCapabilities` arrays.

Examples:

| Objective | Supporting capabilities |
| --- | --- |
| Run the business from one clear loop | Start My Day, Decide What Matters, Review Recent Activity, Understand System Connections, Review Rules and Checks |
| Turn opportunities into paid work | Find People to Contact, Review Marketing Activity, See Money to Collect, Decide What Matters |
| Complete customer work with proof | Manage Current Customer Work, Review Rules and Checks, Review Recent Activity |

No inferred mapping is performed from titles, descriptions, routes, or questions.

## Mission and Objective Relationship

S008.08 preserves the S008.05 distinction:

- Mission: broader outcome or sustained purpose.
- Objective: specific result that advances a Mission.
- Action: next step that advances an Objective.
- Proof: evidence that an Action or Objective reached its intended result.
- Learning: what StaffordOS retains afterward.

S008.08 does not create a runtime Mission registry.

## Boundary Safety

S008.08 preserves the following boundaries:

- Stafford Media objectives appear only in Stafford Media.
- Professional and Personal show no active objectives.
- Planned examples are visibly planned and not operating truth.
- No objective claims live measurement.
- No objective performs mutation.
- No `/operator` loader is imported.
- No API request occurs.
- No database access occurs.
- No AI recommendation is generated.
- No objective changes authorization.
- Workspace selection remains presentation-only.
- `/operator` routes remain unaffected.

## Operator Language Review

New visible strings were reviewed against S008.02.

Preferred language used:

- What We Are Working Toward
- Why this matters
- What completion looks like
- Proof needed
- Supported by
- Active
- Planned
- Needs review

Avoided primary language:

- objective registry
- entity
- source enum
- foreign key
- resolver
- runtime binding
- mission-object relation
- persistence layer

## Files Changed

Application presentation:

- `staffordos/ui/operator-frontend/app/os/objectives/page.tsx`
- `staffordos/ui/operator-frontend/components/staffordos/ObjectiveSurface.tsx`
- `staffordos/ui/operator-frontend/components/staffordos/StaffordOsShell.tsx`
- `staffordos/ui/operator-frontend/components/staffordos/NextActionCard.tsx`
- `staffordos/ui/operator-frontend/components/staffordos/UnifiedHome.tsx`
- `staffordos/ui/operator-frontend/lib/staffordos/homePresentation.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/objectiveRegistry.ts`
- `staffordos/ui/operator-frontend/app/globals.css`

Tests:

- `staffordos/ui/operator-frontend/lib/staffordos/objectiveRegistry.test.mjs`

Documentation:

- `staffordos/architecture/S008_08_OBJECTIVE_REGISTRY_AND_MISSION_ALIGNMENT_FOUNDATION.md`
- `staffordos/architecture/S008_08_OBJECTIVE_REGISTRY_AND_MISSION_ALIGNMENT_FOUNDATION.json`

## Validation Results

- focused objective tests: 14 passing
- existing workspace registry tests: 8 passing
- existing Home presentation tests: 11 passing
- `npm run build` in `staffordos/ui/operator-frontend`: passed with existing
  Turbopack trace warning and existing `/operator/shopifixer-pilot`
  serialization warnings during static generation; exit code 0
- local GET route checks: 15 routes returned HTTP 200
- JSON validation: `jq` passed
- diff check: `git diff --check` passed

Routes verified:

- `/os`
- `/os/objectives`
- `/os/capabilities`
- `/os/command`
- `/os/work`
- `/os/pipeline`
- `/os/knowledge`
- `/os/governance`
- `/os/system`
- `/operator`
- `/operator/cockpit`
- `/operator/leads`
- `/operator/campaigns`
- `/operator/revenue-command`
- `/operator/command-center`

## Known Limitations

- No live Objective registry exists yet.
- No live objective measurement is connected.
- No runtime Mission registry is created.
- No Action or Decision registry is created.
- No AI ranking or objective scoring is implemented.
- Professional and Personal remain planned presentation states.
- `/operator` remains runtime-canonical until parity is proven.

## Rollback

Rollback is a single local Git revert after commit:

```bash
git revert <S008.08 commit SHA>
```

No database, authentication, Stripe, ShopiFixer, Abando, migration, production,
or Render rollback is required.

## Next Mission Recommendation

S008.09 should define the first read-only Action alignment model that connects
static objectives, existing capability links, and existing primary-action truth
without claiming live cross-workspace ranking.
