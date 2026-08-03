# J001.01 Canonical Career Navigation And Job Command Shell

## Classification

JOB_COMMAND_SHELL_VALIDATED

## Checkpoint Authority

Starting authority:

- Repository root: `/Users/rossstafford/projects/cart-agent`
- Branch: `main`
- Required starting HEAD: `6ff2106ad47f5ec7dbdf24dfe13a9c0d4463dfa7`
- J001 discovery artifacts available:
  - `staffordos/job-search/J001_UI_AUTHORITY_RECONCILIATION.md`
  - `staffordos/job-search/J001_UI_AUTHORITY_RECONCILIATION.json`
  - `staffordos/job-search/J001_JOB_SEARCH_INFORMATION_ARCHITECTURE.md`
  - `staffordos/job-search/J001_UI_DUPLICATION_AND_REUSE_MATRIX.md`

Repository authority preserved:

- `staffordos/ui/operator-frontend` remains the canonical StaffordOS UI root.
- `/operator` remains runtime-canonical for Stafford Media.
- `/os` remains the emerging multi-workspace shell.
- `StaffordOsShell` remains the canonical `/os` shell.
- `WorkspaceSelector` and `WorkspaceContext` remain presentation-only.
- No Job Search runtime API or persistence exists.

## Canonical UI Root

Implementation stays inside:

`staffordos/ui/operator-frontend`

No new frontend application, shell, deployment root, or production route was
created.

## Shell Reused

The new Job Command route is under the existing `/os` layout:

`staffordos/ui/operator-frontend/app/os/layout.tsx`

The route therefore reuses:

- `StaffordOsShell`
- `WorkspaceSelector`
- presentation-only `WorkspaceContext`
- existing `/os` command bar and content frame

## Route Added

`/os/professional/jobs`

Source file:

`staffordos/ui/operator-frontend/app/os/professional/jobs/page.tsx`

Operator-facing title:

`Job Command`

Primary question:

`What should I do next in my job search?`

## Navigation Behavior

A Professional-only Career navigation group was added inside
`StaffordOsShell`.

Career navigation:

| Item | State | Route |
| --- | --- | --- |
| Job Command | Available now | `/os/professional/jobs` |
| Opportunities | Planned | none |
| Applications | Planned | none |
| Relationships | Planned | none |
| Interviews | Planned | none |
| Outcomes | Planned | none |

The Career group is not rendered for Stafford Media or Personal workspace
context. Direct navigation to `/os/professional/jobs` sets the presentation
workspace to Professional; this remains presentation behavior only and is not
authorization.

## Presentation Contract

Static contract file:

`staffordos/ui/operator-frontend/lib/staffordos/jobSearchCommandPresentation.ts`

The contract defines:

- Professional workspace ownership
- Job Command title and primary question
- Professional-only Career navigation
- deterministic empty states
- Search Health status
- data authority disclosures
- human approval language
- route targets only for existing routes

The contract does not use:

- `Date.now`
- random IDs
- browser storage
- environment-derived jobs
- network state
- private files
- runtime APIs

## Available States

Available now:

- read-only Job Command shell
- Professional-only Career navigation
- private career source intake acknowledged as outside Git
- operator approval model

## Planned States

Planned and unlinked in this slice:

- Opportunities
- Applications
- Relationships
- Interviews
- Outcomes

## Human Approval Boundary

Visible language states:

StaffordOS can prepare, compare, explain, and draft.

Ross must approve:

- resume changes
- applications
- recruiter messages
- interview follow-ups
- withdrawals
- offer decisions
- any final representation made in his name

## Data Not Connected

The surface explicitly discloses that these are not connected:

- live jobs
- job-board search
- durable opportunities
- requirement extraction
- fit assessment
- canonical resume facts
- application state
- recruiters
- interviews
- outcomes
- external AI
- automated submissions

## Components Reused

- `StaffordOsShell`
- `WorkspaceSelector`
- `WorkspaceContext`
- `/os` layout
- `NextActionCard`
- existing StaffordOS header, status, panel, empty-state, and grid styles

## New Components

- `JobCommandSurface`

## Tests

Focused test:

`node --test staffordos/ui/operator-frontend/lib/staffordos/jobSearchCommandPresentation.test.mjs`

Result: passed, 30 assertions.

Required checks include Professional-only navigation, planned destinations,
empty states, no fake opportunities, no private paths, no `/operator` loader,
no API/database/model imports, no submit/send action, approval language, and the
exact primary question.

Regression results:

- S008-focused tests: passed, 127 assertions.
- S009-focused tests: passed, 126 assertions.
- S010-focused tests: passed, 140 assertions.
- `npm run build` in `staffordos/ui/operator-frontend`: passed with existing
  pre-existing route-generation and tracing warnings.

## Route Checks

Required route checks:

- `/os`
- `/os/professional/jobs`
- `/os/capabilities`
- `/os/actions`
- `/os/objectives`
- `/os/decisions`
- `/os/chief-of-staff`
- `/operator`
- `/operator/leads`
- `/operator/campaigns`
- `/operator/revenue-command`
- `/operator/command-center`

Result: all required routes returned HTTP 200 from a local server bound to
`127.0.0.1`.

## Known Limitations

- Job opportunities are not connected.
- Applications are not connected.
- Recruiter and follow-up records are not connected.
- Interviews are not connected.
- Governed outcomes are not connected.
- Career evidence review is not connected to this screen.
- Professional workspace context is presentation-only, not authorization.
- The capability map remains conservative until Job Search runtime authority is
  implemented.

## Rollback

Repository rollback:

`git revert <J001.01 commit SHA>`

No private career artifact, database, API, production, model, application,
message, or external-system rollback should be required.

## Recommended Next Mission

`J001_02_LOCAL_JOB_OPPORTUNITY_INTAKE_BRIDGE`

That mission should create a private/local JobOpportunity intake path and a
read-only opportunity queue. It must not add external job-board integration or
application submission yet.
