# S008.07 Workspace-Aware Unified Home and Priority Presentation

## Classification

UNIFIED_HOME_READY_FOR_LOCAL_COMMIT

## Mission Boundary

S008.07 turns `/os` Home into a workspace-aware operating page that answers:

> What deserves my attention next?

This mission adds presentation structure only. It does not add live ranking, AI
recommendations, runtime Action or Decision records, API calls, write controls,
database changes, authentication changes, ShopiFixer or Abando behavior,
production configuration, deployment, push, or migration.

## Checkpoint Authority

Required local commits were verified in HEAD history:

| Checkpoint | Commit | Status |
| --- | --- | --- |
| S008 foundation | `7d661d1cea4e447e855dfec59e80d6b8feb44bad` | present |
| S008 capability map | `4503ebb5a15484384d5dbb463dcdce551c3e9293` | present |
| S008 multi-workspace architecture | `cd0757caacaf8d7c1523bc2bea63e0b715da9561` | present |
| S008 unified action and decision model | `e386645f2d2c0aa625c2bec11edfd3b6c5c92f6a` | present |
| S008 workspace context | `735c4a5fad194afdc3cfbef28411cac77bfc7ddd` | current checkpoint |

The broader worktree contains unrelated S007, identity, issuer, web, Prisma,
daemon, generated, runtime, and evidence artifacts. Those files are excluded
from S008.07 and must not be staged with this checkpoint.

## Existing Home Findings

Before S008.07, `/os` Home used the generic `WorkspacePage` wrapper and showed
the placeholder `NextActionCard` plus a short capability panel. That was
appropriate for the S008.00 foundation but did not yet give Ross a clear first
place to continue from the new shell.

Existing live `/operator` action surfaces were inspected and deliberately not
imported. They load current business snapshots, primary-action files, and in
some cases action controls. S008.07 keeps `/os` presentation-only.

## Home Presentation Model

New model:

- `staffordos/ui/operator-frontend/lib/staffordos/homePresentation.ts`

The model is static and typed. It exposes:

- `workspaceId`
- `heading`
- `summary`
- `primaryAction`
- `supportingActions`
- `plannedCapabilities`
- `evidenceNote`
- `authorityNote`
- `limitationNote`
- optional `returnWorkspaceLabel`

The primary action shape aligns with S008.05 where evidence exists:

- what to do
- why now
- expected result
- evidence
- risk
- completion proof
- continue link

Unsupported values are omitted instead of invented.

## Stafford Media Primary Action

Selected primary action:

- `Start My Day`

Current authority:

- capability ID: `start-my-day`
- current route: `/operator`
- source: repository-backed
- availability: Available now

Reason:

`Start My Day` is the current StaffordOS Home surface and the safest first place
to continue because it already represents the working Home page, main priority,
current risks, business health, and workday controls.

Transparency:

The page states that live priority ranking is not connected here yet and that
the current Home is using the existing operating structure.

## Stafford Media Supporting Actions

S008.07 adds a small set of supporting links, not a duplicate capability map:

| Action | Current route | Reason |
| --- | --- | --- |
| Find People to Contact | `/operator/leads` | Outreach and relationship follow-up |
| See Money to Collect | `/operator/revenue-command` | Payment waits, offers, or revenue follow-up |
| Manage Current Customer Work | `/operator/command-center` | Current customer work, proof, and delivery blockers |

The full capability list remains available through `/os/capabilities`.

## Professional Planned Home

Professional renders a planned-state Home only.

It names future modes:

- Job Search
- My Job

It states that no professional data is connected. It does not show jobs,
applications, resumes, employers, meetings, tasks, recommendations, or Stafford
Media operating links except the state-based return control.

## Personal Planned Home

Personal renders a planned-state Home only.

It names future areas:

- Private Planning
- Learning
- Family and Media

It states that no family members, media assets, memories, shared content, or
private tasks are connected. It also states that Personal is owner-private by
default and future Family and Media access requires explicit sharing.

## Next Action Card Changes

`NextActionCard` remains the S008 card foundation. It was updated
backward-compatibly to support:

- operator-first header labels
- optional expected result
- optional effort, approval, completion proof, and risk fields
- optional transparency note
- optional Continue link

The component does not require confidence, scores, deadlines, governance, or
other unsupported fields for the Home presentation.

## Authority and Transparency

Visible Home language distinguishes:

- Available now: repository-backed links that work today.
- Planned: workspace capabilities without runtime workflows.
- Not connected yet: live ranking, real action records, AI recommendations,
  objective tracking, and evidence aggregation.

Static presentation must not look like live intelligence.

## Boundary Safety

S008.07 preserves the following boundaries:

- Stafford Media Home links only to repository-backed current routes.
- Professional Home exposes no `/operator` operating links.
- Personal Home exposes no `/operator` operating links.
- `/operator` loaders are not imported into `/os` Home.
- No API request is made by the Home model or component.
- No data is mutated.
- No Action or Decision record is created.
- Workspace selection remains presentation-only.
- Direct `/operator` routes remain unaffected.

## Operator Language Review

New visible strings were reviewed against S008.02.

Preferred language used:

- What Deserves Attention
- Start here
- Look here first
- Available now
- Planned
- Continue
- Return to Stafford Media
- Not connected yet

Avoided primary language:

- decision engine
- ranking algorithm
- action registry
- data source
- runtime
- context provider
- capability resolver
- authority object
- not implemented

## Files Changed

Application presentation:

- `staffordos/ui/operator-frontend/app/os/page.tsx`
- `staffordos/ui/operator-frontend/components/staffordos/UnifiedHome.tsx`
- `staffordos/ui/operator-frontend/components/staffordos/NextActionCard.tsx`
- `staffordos/ui/operator-frontend/lib/staffordos/homePresentation.ts`
- `staffordos/ui/operator-frontend/app/globals.css`

Tests:

- `staffordos/ui/operator-frontend/lib/staffordos/homePresentation.test.mjs`

Documentation:

- `staffordos/architecture/S008_07_WORKSPACE_AWARE_UNIFIED_HOME_AND_PRIORITY_PRESENTATION.md`
- `staffordos/architecture/S008_07_WORKSPACE_AWARE_UNIFIED_HOME_AND_PRIORITY_PRESENTATION.json`

## Validation Results

Required bounded checks:

- focused S008 workspace tests: 8 passing
- focused S008.07 Home tests: 11 passing
- `npm run build` in `staffordos/ui/operator-frontend`: passed with existing
  Turbopack trace warning and existing `/operator/shopifixer-pilot`
  serialization warnings during static generation; exit code 0
- `git diff --check`: passed
- `jq` validation for S008.07 JSON: passed
- local GET checks: all returned HTTP 200 for `/os`, `/os/capabilities`,
  `/os/command`, `/os/work`, `/os/pipeline`, `/os/knowledge`,
  `/os/governance`, `/os/system`, `/operator`, `/operator/cockpit`,
  `/operator/leads`, `/operator/campaigns`, `/operator/revenue-command`, and
  `/operator/command-center`

## Known Limitations

- No live priority engine is connected to `/os` Home.
- No runtime Action registry exists yet.
- No runtime Decision registry exists yet.
- No evidence aggregation is connected to `/os` Home.
- Professional and Personal remain planned presentation states.
- `/operator` remains runtime-canonical until parity is proven.

## Rollback

Rollback is a single local Git revert after commit:

```bash
git revert <S008.07 commit SHA>
```

No database, authentication, Stripe, ShopiFixer, Abando, migration, production,
or Render rollback is required.

## Next Mission Recommendation

S008.08 should define the first Objective read model or registry boundary before
any live ranking, AI Chief of Staff behavior, or dynamic next-action selection is
introduced.
