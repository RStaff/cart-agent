# S008.10 Unified Action Registry Foundation

## Gate

Mission: S008_10_UNIFIED_ACTION_REGISTRY_FOUNDATION

Status: READY_FOR_LOCAL_COMMIT

This checkpoint creates the first static, read-only StaffordOS Action Registry. It answers the operator question:

> What should be done next?

The registry is presentation-only. It does not execute work, approve work, persist state, rank with AI, call APIs, read databases, or change `/operator` runtime behavior.

## Checkpoint Authority

Verified checkpoint HEAD at discovery:

`7fe3ee99da92fbf6e4184be43bd4778fb44036cd`

Verified S008 history includes:

- `7d661d1cea4e447e855dfec59e80d6b8feb44bad`
- `4503ebb5a15484384d5dbb463dcdce551c3e9293`
- `cd0757caacaf8d7c1523bc2bea63e0b715da9561`
- `e386645f2d2c0aa625c2bec11edfd3b6c5c92f6a`
- `735c4a5fad194afdc3cfbef28411cac77bfc7ddd`
- `122bee6872099c4f909b5c025b3d375745af3134`
- `33af5d22361ca6e3960e3445ceb01e2d2c25e5f7`
- `7fe3ee99da92fbf6e4184be43bd4778fb44036cd`

No canonical Action Registry existed before this mission.

## Discovery

Repository discovery found related action concepts, but no canonical StaffordOS Action object:

- `staffordos/ui/operator-frontend/lib/operator/actionResolver.ts` contains existing business-specific `ActionCandidate` resolution for current operator behavior. It is not a StaffordOS-wide Action Registry.
- `staffordos/decision/resolve_primary_action_v1.mjs` resolves and writes a primary-action snapshot. It is not a static, canonical OS Action model.
- `staffordos/snapshots/primary_action_snapshot_v1.json` contains current business action evidence, not a reusable registry contract.
- `staffordos/ui/operator-frontend/components/staffordos/NextActionCard.tsx` already supports presentation of action guidance.
- `staffordos/ui/operator-frontend/lib/staffordos/objectiveRegistry.ts` and `decisionRegistry.ts` provide the Objective and Decision anchors needed for explicit Action linking.

## Action Contract

The static contract is implemented in:

`staffordos/ui/operator-frontend/lib/staffordos/actionRegistry.ts`

Each Action includes:

- `id`
- `workspaceId`
- `objectiveId`
- `decisionId`
- `capabilityId`
- `title`
- `summary`
- `reason`
- `expectedResult`
- `proofNeeded`
- `owner`
- `authority`
- `priorityClassification`
- `effortClassification`
- `visibility`
- `status`
- `source`
- `createdFrom`
- `learningTarget`
- `continueHref`
- `continueLabel`

Safe read methods:

- `getActionsForWorkspace`
- `getActionById`
- `getActionsForDecision`
- `getActionsForObjective`
- `getPrimaryAction`

Forbidden methods remain absent:

- create
- update
- delete
- execute
- complete
- approve
- persistence
- API access
- database access
- AI ranking

## Initial Stafford Media Actions

Six repository-backed Stafford Media Actions were added:

1. `Start My Day`
   - Route: `/operator`
   - Objective: `stafford-media-operating-loop`
   - Decision: `s008-start-my-day-static-home-action`

2. `Review People to Contact`
   - Route: `/operator/leads`
   - Objective: `stafford-media-convert-opportunities`
   - Decision: `s008-operator-runtime-canonical`

3. `Review Money to Collect`
   - Route: `/operator/revenue-command`
   - Objective: `stafford-media-convert-opportunities`
   - Decision: `s008-operator-runtime-canonical`

4. `Review Active Work`
   - Route: `/operator/command-center`
   - Objective: `stafford-media-complete-work-with-proof`
   - Decision: `s008-operator-runtime-canonical`

5. `Review Current Goals`
   - Route: `/os/objectives`
   - Objective: `stafford-media-operating-loop`
   - Decision: `s008-operator-runtime-canonical`

6. `Review Recent Decisions`
   - Route: `/os/decisions`
   - Objective: `stafford-media-operating-loop`
   - Decision: `s008-operator-runtime-canonical`

These are static presentation entries. They do not claim live priority ranking or execution authority.

## Workspace Boundaries

Professional remains planned:

- no current Actions
- no employers
- no jobs
- no applications
- no interviews
- no professional workflow state
- no Stafford Media links except presentation-level return behavior elsewhere in `/os`

Personal remains planned:

- no current Actions
- no family members
- no media
- no learning history
- no sharing
- no Stafford Media links except presentation-level return behavior elsewhere in `/os`

## Action Surface

Added route:

`/os/actions`

Operator-facing title:

`What To Do Next`

The surface shows:

- what to do
- why it matters
- what success looks like
- proof needed
- related goal
- related decision
- authority
- effort
- where the action starts

The surface contains no execution buttons, approvals, mutation controls, loaders, API calls, or database access.

## Home Integration

`/os` Home now uses `getPrimaryAction(DEFAULT_STAFFORDOS_WORKSPACE_ID)` for its primary Stafford Media card.

The Home card continues to communicate:

- Available now
- Planned
- Not connected yet

It explicitly avoids claiming live ranking, automated recommendation, or execution authority.

## Decision And Objective Linking

Every current Action explicitly references one Objective and one Decision.

No title matching, route matching, inferred relationship, or automatic mapping is used.

Unsupported lookups fail safely by returning `null` or an empty list.

## Boundary Safety

Verified by tests and code inspection:

- Stafford Media Actions are returned only for Stafford Media.
- Professional returns no current Actions.
- Personal returns no current Actions.
- No `/operator` loaders are imported.
- No API request is made.
- No database access is introduced.
- No persistence is introduced.
- No execution, completion, approval, or automation method exists.
- Workspace selection remains presentation-only.
- `/operator` routes and runtime behavior remain unchanged.

## Validation

Focused tests:

- `actionRegistry.test.mjs`: 14/14 passed
- `decisionRegistry.test.mjs`: 18/18 passed
- `objectiveRegistry.test.mjs`: 14/14 passed
- `homePresentation.test.mjs`: 11/11 passed
- `workspaceRegistry.test.mjs`: 8/8 passed

Build:

- `npm run build` in `staffordos/ui/operator-frontend`: passed
- Existing build warnings remained:
  - Turbopack traced `next.config.mjs` through `/api/operator/ceo-snapshot`
  - Existing `/operator/shopifixer-pilot` client/server function serialization warnings during static generation

Route checks on local production server:

- `/os`: 200
- `/os/actions`: 200
- `/os/objectives`: 200
- `/os/decisions`: 200
- `/os/capabilities`: 200
- `/operator`: 200

## Files Changed

Added:

- `staffordos/ui/operator-frontend/app/os/actions/page.tsx`
- `staffordos/ui/operator-frontend/components/staffordos/ActionSurface.tsx`
- `staffordos/ui/operator-frontend/lib/staffordos/actionRegistry.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/actionRegistry.test.mjs`
- `staffordos/architecture/S008_10_UNIFIED_ACTION_REGISTRY_FOUNDATION.md`
- `staffordos/architecture/S008_10_UNIFIED_ACTION_REGISTRY_FOUNDATION.json`

Modified:

- `staffordos/ui/operator-frontend/components/staffordos/UnifiedHome.tsx`
- `staffordos/ui/operator-frontend/lib/staffordos/homePresentation.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/homePresentation.test.mjs`
- `staffordos/ui/operator-frontend/lib/staffordos/objectiveRegistry.test.mjs`

The Objective test update only updates the source-inspection assertion to validate the new explicit Action-to-Objective chain.

## Known Limitations

- Actions are static and repository-backed only.
- There is no runtime Action table.
- There is no Action persistence.
- There is no Action completion.
- There is no approval workflow.
- There is no AI prioritization.
- Professional and Personal Actions are intentionally absent.
- Live evidence aggregation is not connected.
- The registry does not yet model proof records or learning records as runtime data.

## Rollback

Rollback requires only reverting the S008.10 commit:

```bash
git revert <S008.10 commit SHA>
```

No production rollback, database rollback, authentication rollback, Stripe rollback, ShopiFixer rollback, Abando rollback, migration rollback, queue rollback, packet rollback, or deployment rollback is required.

## Non-Impact Confirmation

This mission did not:

- deploy
- push
- modify production
- modify ShopiFixer runtime
- modify Abando runtime
- modify authentication
- modify OAuth, KMS, JWT, or issuer code
- modify Stripe
- modify databases
- modify Prisma
- modify APIs
- modify queues
- modify packets
- modify `/operator` runtime behavior
- implement execution workflows
- implement persistence
- implement AI ranking
- implement AI execution
- implement automation
