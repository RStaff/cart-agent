# G003.00 Adapter-Only Read Model and Staticity Authority

## Checkpoint Authority

- Mission: `G003_00_ADAPTER_ONLY_READ_MODEL_AND_STATICITY_AUTHORITY`
- Checkpoint HEAD: `f572828429ec7cbf7a5d6902a606fb20fbba3b83`
- Current authority: `/operator` remains Stafford Media runtime authority; `/os` remains the parent workspace shell.
- Required prior commits verified locally: S009/S010/J001/G001/G002 authority chain including G002 Professional modes.

## Current Data Entry Inventory

| Path family | Classification | Result |
| --- | --- | --- |
| Workspace, mode, capability, action, objective, decision, evidence, proof, learning registries | `STATIC_REPOSITORY` | Direct imports are allowed only with static/historical disclosure. |
| `primaryActionSourceAdapter.ts` | `GOVERNED_ADAPTER` | Existing S009.06 adapter pattern remains valid for read-model assembly. |
| Job Command presentation and opportunity queue presentation | `STATIC_REPOSITORY` plus adapter-ready presentation | No real private opportunity is connected. |
| `WorkspaceContext` | `CLIENT_LOCAL_PRESENTATION` | Presentation-only; not authorization. |
| Chief of Staff demo records | `GENERATED_PROPOSAL` / static demo | Must remain labeled as demonstration or generated proposal, not live operator truth. |
| `/os` client components | Presentation only | No direct private file reads, provider calls, or `/operator` loader imports were added. |

No direct runtime loader, direct private file read, provider-direct path, database path, API path, model call, or application submission path was added to `/os`.

## Adapter-Only Rule

A StaffordOS `/os` surface may consume non-static data only through a governed read-model adapter that:

- accepts explicit workspace context;
- accepts or retrieves only authorized source material;
- declares included and excluded fields;
- preserves provenance, freshness, conflicts, and limitations;
- redacts sensitive fields;
- produces an immutable read model;
- performs no write or execution behavior;
- fails closed;
- does not allow client components to read providers, private files, browser storage authority, or `/operator` loaders.

Static repository content may be imported directly only when it is visibly classified as static and has an `asOf`, recorded version, or explicit date-unknown limitation.

## Source Snapshot Contract

Created `sourceSnapshot.ts`.

Canonical displayed source classifications:

- `STATIC_REPOSITORY`
- `HISTORICAL_RECORD`
- `PRIVATE_LOCAL`
- `RUNTIME_READ_MODEL`
- `PROVIDER_CONFIRMED`
- `OPERATOR_CONFIRMED`
- `GENERATED_PROPOSAL`
- `PLANNED_PLACEHOLDER`

Staticity values:

- `LIVE_RUNTIME`
- `CAPTURED_SNAPSHOT`
- `STATIC_REPOSITORY`
- `HISTORICAL`
- `GENERATED`
- `PLANNED`

Freshness values:

- `CURRENT`
- `RECENT`
- `HISTORICAL`
- `STALE`
- `UNKNOWN`

The validator requires workspace scope, source identity, authority, privacy classification, timestamp or unknown-date limitation, freshness, staticity, authorization status, conflict status, included/excluded fields, limitations, digest or digest limitation, and schema version.

## Read-Model Envelope

Created `readModelEnvelope.ts`.

The envelope defines:

- read-model identity;
- workspace scope;
- records;
- source snapshot references;
- `assembledAt`;
- `asOf`;
- freshness;
- staticity;
- authority summary;
- authorization status;
- conflict status;
- limitations;
- empty-state reason;
- adapter identity;
- immutable output.

Empty states distinguish:

- no records;
- source unavailable;
- unauthorized;
- not connected;
- validation failed;
- planned.

## Authorization Status Model

Display-safety statuses:

- `NOT_REQUIRED_FOR_PUBLIC_STATIC`
- `TEST_FIXTURE_ONLY`
- `PRESENTATION_ONLY_NOT_AUTHORIZED`
- `AUTHORIZED_BY_SERVER_POLICY`
- `AUTHORIZED_BY_PROVIDER`
- `OPERATOR_CONFIRMED`
- `AUTHORIZATION_UNKNOWN`
- `DENIED`

Rules:

- WorkspaceContext alone may only be presentation-only.
- Private local data requires future server policy enforcement or operator-confirmed authority before display.
- Client-side checks cannot produce server authorization.
- Unknown or denied authorization fails closed for private or runtime records.
- Tests may use `TEST_FIXTURE_ONLY` only with fictional values.

## Staticity and As-Of Rules

- Static repository data displays as a static reference.
- Historical data displays as a historical record.
- Captured snapshots disclose capture timing and limitations.
- Live runtime data is permitted only when an adapter actually queries a source at request time and declares authorization, source health, and timestamp.
- Generated proposals require review and are not source authority.
- Planned placeholders contain no real records.
- `assembledAt` is not source freshness and cannot substitute for `asOf`.
- Missing dates must be disclosed as unknown.

## Conflict Model

Conflict statuses:

- `NO_CONFLICT`
- `CONFLICT_DISCLOSED`
- `CONFLICT_REQUIRES_REVIEW`
- `BLOCKING_CONFLICT`
- `UNKNOWN`

Rules:

- Blocking conflicts return no trusted records.
- Non-blocking conflicts remain disclosed.
- Newest source does not automatically win.
- Runtime data does not silently replace repository doctrine.
- Provider state does not silently replace operator-confirmed history.

## Static Registry Audit

Targeted audit found `/os` currently relies on static repository registries and presentation data. The main ambiguity was decision memory: S008-era decision records were repository-backed but did not explicitly expose historical/static metadata. G003 adds `recordedAt`, `asOf`, `staticity`, `freshness`, `conflictStatus`, `supersededBy`, and limitations to those records.

The decision surface now says these records are historical repository-backed architecture choices. Professional decision copy now says Professional has a read-only foundation, but no decision records are connected yet.

## Historical Decision Handling

Historical decisions were not rewritten. Instead:

- each record remains auditable;
- earlier context remains visible;
- supersession is explicit where G002 changed Professional from planned-only to foundation-available;
- UI distinguishes historical memory from current runtime state.

## Job Opportunity Adapter Readiness

Future path:

`PRIVATE JOB INTAKE FILE -> PRIVATE NORMALIZED OPPORTUNITY -> SERVER-SIDE PRIVATE SOURCE ADAPTER -> SOURCE SNAPSHOT -> REDACTED OPPORTUNITY QUEUE READ MODEL -> JOB COMMAND`

Readiness status:

`BLOCKED_ON_SERVER_AUTHORIZATION`

Reason:

- no StaffordOS-wide identity gate exists yet;
- no server authorization policy exists yet for private Professional file display;
- the current Job Command must remain disconnected from real private opportunities.

## UI Disclosure Decision

No new visual component was added. Existing panel and text patterns were sufficient for this mission. The only UI change is the narrow Decisions surface disclosure correction.

## Files Changed

- `staffordos/ui/operator-frontend/lib/staffordos/sourceSnapshot.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/sourceSnapshot.test.mjs`
- `staffordos/ui/operator-frontend/lib/staffordos/readModelEnvelope.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/readModelEnvelope.test.mjs`
- `staffordos/ui/operator-frontend/lib/staffordos/decisionRegistry.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/decisionRegistry.test.mjs`
- `staffordos/ui/operator-frontend/components/staffordos/DecisionSurface.tsx`
- `staffordos/governance/G003_00_ADAPTER_ONLY_READ_MODEL_AND_STATICITY_AUTHORITY.md`
- `staffordos/governance/G003_00_ADAPTER_ONLY_READ_MODEL_AND_STATICITY_AUTHORITY.json`

## Validation

- Focused G003 tests: passed, 56 tests.
- Full StaffordOS library regression sweep: passed, 533 tests.
- G002 regression: passed within the full sweep.
- J001 regression: passed within the full sweep.
- S010 regression: passed within the full sweep.
- S009 regression: passed within the full sweep.
- S008 regression: passed within the full sweep.
- Build: passed. Existing non-G003 `/operator` build warnings were observed but did not fail the build.
- Route checks: passed, 16 required routes returned HTTP 200.
- JSON validation: passed.
- Diff checks: `git diff --check` passed before staging; staged diff check is part of the commit gate.

## Known Limitations

- This mission does not add StaffordOS-wide runtime persistence.
- This mission does not implement authentication or authorization.
- This mission does not connect real private Job Opportunity records to UI.
- This mission does not create a provider adapter, database, API, or route.
- Some existing `/operator` write-surface risk remains outside this mission.

## Rollback

Repository rollback:

`git revert <G003 commit SHA>`

Rollback affects only repository documentation and static/read-model contract code. It does not delete private records, provider data, runtime data, database state, or deployments.

## Selected Next Mission

`G004_00_OPERATOR_WRITE_SURFACE_RISK_DECISION`

Reason: the ratified architecture review identified current write-surface risk, and G003 confirms private Job Search UI connection remains blocked until stronger server authorization and adapter boundaries exist.
