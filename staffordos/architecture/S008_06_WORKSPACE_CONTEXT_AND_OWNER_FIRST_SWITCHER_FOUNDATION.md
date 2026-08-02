# S008.06 Workspace Context and Owner-First Switcher Foundation

## Classification

WORKSPACE_CONTEXT_READY_FOR_LOCAL_COMMIT

## Mission Boundary

This mission created a narrow, local `/os` workspace-context foundation. It did
not deploy, push, modify production, change authentication, change OAuth, KMS,
JWT, or operator issuer code, change Stripe, change ShopiFixer or Abando runtime
behavior, change databases, Prisma schemas, migrations, APIs, or existing
`/operator` behavior.

The selector is presentation-only. It does not implement real authorization,
membership, invited users, family login, employee login, media access, job
integrations, or cross-workspace data.

## Authority Baseline

Required local checkpoints were verified in HEAD history:

| Checkpoint | Commit | Status |
| --- | --- | --- |
| S008 foundation, reconciliation, and language | `7d661d1cea4e447e855dfec59e80d6b8feb44bad` | present |
| S008 capability map | `4503ebb5a15484384d5dbb463dcdce551c3e9293` | present |
| S008 multi-workspace architecture | `cd0757caacaf8d7c1523bc2bea63e0b715da9561` | present |
| S008 unified action and decision model | `e386645f2d2c0aa625c2bec11edfd3b6c5c92f6a` | current HEAD at discovery |

Current branch at discovery: `main`.

The broader worktree contained preexisting unrelated S007, identity, issuer,
StaffordOS runtime, daemon, generated, web, Prisma, ShopiFixer, and evidence
artifacts. They were excluded from this mission.

## Existing Workspace Model Discovery

Repository discovery found:

- `staffordos/ui/operator-frontend/lib/staffordos/workspaces.ts` contains the
  existing `/os` section registry: Home, Command, Work, Pipeline, Knowledge,
  Governance, System.
- `staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts` contained the
  S008.03 capability map for current `/operator` surfaces.
- `staffordos/architecture/S008_04_MULTI_WORKSPACE_PLATFORM_AND_DECISION_MODEL_ARCHITECTURE.md`
  defines Business, Professional, and Personal as approved workspace families.
- `staffordos/architecture/S008_05_UNIFIED_ACTION_AND_DECISION_MODEL.md`
  defines workspace as the privacy, policy, membership, language, and data
  boundary for future operating objects.
- S007 local operator identity work contains durable operator, role, session, and
  permission concepts, but it is not a general StaffordOS workspace runtime and
  was not modified.

No existing canonical runtime workspace context or general workspace membership
model was found. S008.06 therefore adds a small read-only `/os` presentation
context instead of a competing authorization system.

## Workspace Registry

New registry:

- `staffordos/ui/operator-frontend/lib/staffordos/workspaceRegistry.ts`

Initial workspaces:

| Workspace | Family | Availability | Authority status | Privacy |
| --- | --- | --- | --- | --- |
| Stafford Media | Business | Available now | Current operating workspace | Owner-private unless Business access is explicitly granted later |
| Professional | Professional | Planned | Architecture defined; no runtime workflow yet | Owner-private |
| Personal | Personal | Planned | Architecture defined; no runtime workflow yet | Owner-private by default |

Professional records future modes only:

- Job Search
- My Job

Personal records future capability groups only:

- private planning
- learning
- family
- media
- creation
- memories
- governed learner access

No Professional or Personal workflows were implemented.

## Workspace Context Contract

New presentation context:

- `staffordos/ui/operator-frontend/components/staffordos/WorkspaceContext.tsx`

It exposes:

- `activeWorkspaceId`
- `activeWorkspace`
- `availableWorkspaces`
- `setActiveWorkspace`

The default active workspace is Stafford Media.

The context uses React state only. It does not use the URL, cookies,
localStorage, sessionStorage, backend calls, API routes, database state, or
authentication state.

Explicit code warning:

> This context controls the current /os presentation only. It is not an authorization boundary.

## Owner-First Workspace Selector

New selector:

- `staffordos/ui/operator-frontend/components/staffordos/WorkspaceSelector.tsx`

It appears once in the existing `StaffordOsShell` and shows:

- Current workspace
- Stafford Media - Available now
- Professional - Planned
- Personal - Planned

When a planned workspace is selected, the shell presentation changes only. The
selector does not create accounts, memberships, invitations, roles, permissions,
sessions, or access controls.

Planned-state copy:

> This workspace is planned. Stafford Media is the part of StaffordOS you can use today.

## Workspace-Aware Home

The `/os` Home surface now respects the selected presentation workspace through
`WorkspacePage`.

Stafford Media:

- Remains the default.
- Preserves the existing foundation behavior.
- Shows the existing Next Action placeholder and foundation tiles.
- Shows current capability links through the existing Home capability preview.

Professional:

- Shows a planned-state overview only.
- Mentions Job Search and My Job as planned modes.
- Does not render fake jobs, applications, employer data, accomplishments, or
  `/operator` links.

Personal:

- Shows a planned-state overview only.
- Mentions private planning, learning, family, media, creation, memories, and
  governed learner access as future areas.
- Does not render fake family members, media, memories, shared projects, or
  `/operator` links.

## Workspace-Aware Capability Map

The capability registry now distinguishes:

- `repository_backed` capabilities for Stafford Media.
- `planned_architecture` capabilities for Professional and Personal.

Stafford Media keeps the nine current repository-backed capabilities and their
existing authoritative `/operator` links:

- `/operator`
- `/operator/cockpit`
- `/operator/leads`
- `/operator/campaigns`
- `/operator/revenue-command`
- `/operator/command-center`
- `/operator/execution-log`
- `/operator/system-map`
- `/operator/slice-truth`

Professional and Personal capabilities are planned summaries only. They have
`currentRoute: null`, show `Planned for later`, and do not link to `/operator`.

## Boundary Safety Results

Code inspection and focused tests verified:

- Stafford Media is the safe default.
- The registry contains exactly Stafford Media, Professional, and Personal.
- Stafford Media is marked Available now.
- Professional and Personal are marked Planned.
- Stafford Media capabilities are the only capabilities with `/operator` links.
- Professional planned content does not expose `/operator` links.
- Personal planned content does not expose `/operator` links.
- Workspace selection changes React presentation state only.
- The context does not call APIs, write storage, use cookies, or import
  `/operator` code.
- Existing `/operator` routes remain untouched and directly reachable.

## Focused Tests

Test file:

- `staffordos/ui/operator-frontend/lib/staffordos/workspaceRegistry.test.mjs`

Command:

```bash
node --test staffordos/ui/operator-frontend/lib/staffordos/workspaceRegistry.test.mjs
```

Result:

- 8 passing
- 0 failing

## Operator Language Review

New visible copy follows the S008.02 language standard.

Primary operator-facing labels:

- Current workspace
- Stafford Media
- Professional
- Personal
- Available now
- Planned
- What StaffordOS Can Help With
- Return to Stafford Media
- Planned for later

Avoided as primary UI copy:

- tenant
- namespace
- context ID
- scope resolver
- active principal
- unauthorized
- unimplemented module

Technical details remain in code and documentation only.

## Validation Results

Focused tests:

- `node --test staffordos/ui/operator-frontend/lib/staffordos/workspaceRegistry.test.mjs`
- Result: passed, 8 passing / 0 failing.

Build:

- Command: `npm run build` in `staffordos/ui/operator-frontend`
- Result: passed with exit code 0.
- Note: Next emitted the preexisting non-fatal Turbopack trace warning and the
  known `/operator/shopifixer-pilot` server-component serialization messages,
  then finalized successfully.

Route checks:

| Route | Result |
| --- | --- |
| `/os` | 200 |
| `/os/capabilities` | 200 |
| `/os/command` | 200 |
| `/os/system` | 200 |
| `/operator` | 200 |
| `/operator/leads` | 200 |
| `/operator/campaigns` | 200 |
| `/operator/revenue-command` | 200 |
| `/operator/command-center` | 200 |

Additional validation:

- S008.06 JSON validation with `jq`: passed.
- `git diff --check`: passed.

## Files Changed

Application files:

- `staffordos/ui/operator-frontend/lib/staffordos/workspaceRegistry.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts`
- `staffordos/ui/operator-frontend/components/staffordos/WorkspaceContext.tsx`
- `staffordos/ui/operator-frontend/components/staffordos/WorkspaceSelector.tsx`
- `staffordos/ui/operator-frontend/components/staffordos/StaffordOsShell.tsx`
- `staffordos/ui/operator-frontend/components/staffordos/WorkspacePage.tsx`
- `staffordos/ui/operator-frontend/components/staffordos/CapabilityLinkPanel.tsx`
- `staffordos/ui/operator-frontend/app/os/capabilities/page.tsx`
- `staffordos/ui/operator-frontend/app/globals.css`

Test file:

- `staffordos/ui/operator-frontend/lib/staffordos/workspaceRegistry.test.mjs`

Documentation files:

- `staffordos/architecture/S008_06_WORKSPACE_CONTEXT_AND_OWNER_FIRST_SWITCHER_FOUNDATION.md`
- `staffordos/architecture/S008_06_WORKSPACE_CONTEXT_AND_OWNER_FIRST_SWITCHER_FOUNDATION.json`

## Known Limitations

- This is presentation state only, not real workspace authorization.
- No invited-member model exists.
- No server-side workspace context exists.
- No Professional workflow exists.
- No Personal, Family, Media, or learner workflow exists.
- No cross-workspace search, notification, memory, or agent policy runtime exists.
- The selector does not persist selection after refresh.

## Rollback

Rollback is limited to the S008.06 commit:

```bash
git revert <S008.06 commit SHA>
```

No database rollback, authentication rollback, Stripe rollback, ShopiFixer
rollback, Abando rollback, production rollback, Render rollback, migration
rollback, API rollback, or payment rollback is required.

## Confirmation of Non-Impact

No deployment, push, production change, authentication change, OAuth change, KMS
change, JWT issuer change, Stripe change, ShopiFixer runtime change, Abando
runtime change, database change, Prisma schema change, migration, API change,
workflow change, operator bootstrap, Packet action, execution grant, queueing,
Shopify mutation, payment change, webhook change, customer contact, or external
service mutation occurred.
