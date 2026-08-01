# S008.03 OS Capability Link Map

## Classification

CAPABILITY_MAP_READY_FOR_LOCAL_COMMIT

## Checkpoint Authority

Starting checkpoint:

- Commit: `7d661d1cea4e447e855dfec59e80d6b8feb44bad`
- Message: `S008 StaffordOS foundation, reconciliation, and operator language standard`

Checkpoint verification:

- HEAD matched the checkpoint commit exactly before implementation.
- The checkpoint contains the S008.00 `/os` foundation shell, S008.01
  reconciliation artifacts, and S008.02 operator language standard.

## Mission Boundary

This mission implemented one read-only capability map. It did not deploy, push,
modify authentication, modify Stripe, modify ShopiFixer production behavior,
modify schemas or migrations, move or rename existing `/operator` routes, import
write-capable operator actions into `/os`, or include unrelated working-tree
changes.

The broader working tree already contained unrelated uncommitted changes in
StaffordOS runtime artifacts, S007 evidence, web/Prisma files, the operator
issuer, generated frontend typing, and prior evidence directories. Those files
were excluded from this mission.

## Objective

Answer the operator question:

What can StaffordOS help me do right now?

The capability map makes `/os` a plain-language map over existing working
StaffordOS pages. It links to current `/operator` surfaces without duplicating
their data, actions, loaders, or business logic.

## Files Changed

Application files:

- `staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts`
- `staffordos/ui/operator-frontend/components/staffordos/CapabilityLinkPanel.tsx`
- `staffordos/ui/operator-frontend/app/os/capabilities/page.tsx`
- `staffordos/ui/operator-frontend/app/os/page.tsx`
- `staffordos/ui/operator-frontend/components/staffordos/StaffordOsShell.tsx`
- `staffordos/ui/operator-frontend/components/staffordos/WorkspacePage.tsx`
- `staffordos/ui/operator-frontend/app/globals.css`

Documentation files:

- `staffordos/architecture/S008_03_OS_CAPABILITY_LINK_MAP.md`
- `staffordos/architecture/S008_03_OS_CAPABILITY_LINK_MAP.json`

## Capability Registry

The centralized registry lives at:

- `staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts`

Each capability records:

- id
- operator-facing title
- plain-language description
- operator question answered
- current authoritative route
- future `/os` section
- availability status
- authority classification
- read-only or action-capable classification
- readiness note
- secondary technical note

The registry is static. It does not read files, call APIs, import `/operator`
loaders, or invoke actions.

## Capabilities Mapped

| Capability | Current page | Future `/os` section | Availability | Classification |
| --- | --- | --- | --- | --- |
| Start My Day | `/operator` | Home | Available now | Opens guided actions |
| Decide What Matters | `/operator/cockpit` | Command | Partially available | Opens guided actions |
| Find People to Contact | `/operator/leads` | Pipeline | Available now | Opens guided actions |
| Review Marketing Activity | `/operator/campaigns` | Pipeline | Available now | Read-only view |
| See Money to Collect | `/operator/revenue-command` | Pipeline | Available now | Read-only view |
| Manage Current Customer Work | `/operator/command-center` | Work | Partially available | Opens guided actions |
| Review Recent Activity | `/operator/execution-log` | Knowledge | Available now | Read-only view |
| Understand System Connections | `/operator/system-map` | System | Available now | Read-only view |
| Review Rules and Checks | `/operator/slice-truth` | Governance | Partially available | Read-only view |

## Operator-Facing Surface

New route:

- `/os/capabilities`

The page groups capabilities under the canonical `/os` information architecture:

- Home
- Command
- Work
- Pipeline
- Knowledge
- Governance
- System

Each card answers:

- What can I do here?
- Why would I use it?
- Where does it take me?
- Is it ready now?

The page also states that it does not move work, copy data, start actions,
contact customers, change payments, or change ShopiFixer behavior.

## Shell Connection

The existing `/os` shell received one small secondary link:

- `What StaffordOS Can Do`

The `/os` Home page also received a short preview panel that links to the full
capability map. No redirects were added, no route names were changed, and
existing `/operator` navigation was untouched.

## Language Decisions

S008.02 language standard applied:

- Primary page title: `Capability Map`
- Primary question: `What StaffordOS can do today`
- Plain labels: `Start My Day`, `Find People to Contact`, `See Money to Collect`,
  `Review Recent Activity`, `Review Rules and Checks`
- Operator-readable statuses: `Available now`, `Partially available`,
  `Planned`, `Needs review`
- Action classification: `Read-only view` or `Opens guided actions`

Avoided as primary copy:

- registry
- command center
- execution log
- validation status
- attribution
- packet
- runtime
- loader
- endpoint
- architecture version
- not yet implemented

Route paths appear only as secondary technical notes.

## Read-Only Assurance

`/os/capabilities` imports only:

- the static capability registry
- `/os` section metadata
- the read-only link panel component

It does not import:

- existing `/operator` data loaders
- write-capable operator action components
- API route handlers
- ShopiFixer helpers
- Stripe helpers
- database or migration code

The page contains links only. It has no mutation controls.

## Validation Results

Build:

- Command: `npm run build` in `staffordos/ui/operator-frontend`
- Result: passed with exit code 0
- Note: Next emitted the preexisting non-fatal Turbopack trace warning and
  `/operator/shopifixer-pilot` server-component serialization messages, then
  finalized successfully.

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

- `git diff --check`: passed
- S008.03 JSON validation with `jq`: passed

## Rollback Procedure

Rollback is limited to S008.03:

1. Revert the S008.03 commit after it is created, or remove the files and edits
   listed in this artifact.
2. Delete `staffordos/ui/operator-frontend/app/os/capabilities`.
3. Delete `staffordos/ui/operator-frontend/components/staffordos/CapabilityLinkPanel.tsx`.
4. Delete `staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts`.
5. Remove the small capability link from `StaffordOsShell`.
6. Remove the Home capability preview from `app/os/page.tsx`.
7. Remove the `children` extension from `WorkspacePage` if no longer needed.
8. Remove S008.03 CSS classes from `app/globals.css`.
9. Delete S008.03 architecture artifacts.

No database, production, authentication, Stripe, deployment, ShopiFixer, or
business-logic rollback is required because none of those areas changed.

## Remaining Notes

- `/operator` remains runtime-canonical.
- `/os` now has a read-only map into existing pages.
- The next governed slice can improve the capability map copy or begin a
  read-only section-by-section parity plan, but should still avoid moving
  write-capable surfaces.
