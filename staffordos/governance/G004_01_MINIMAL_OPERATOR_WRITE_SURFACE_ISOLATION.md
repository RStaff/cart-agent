# G004.01 Minimal Operator Write Surface Isolation

Date: 2026-08-03

Final classification: `MINIMAL_OPERATOR_WRITE_ISOLATION_COMMITTED`

## Checkpoint Authority

- Starting HEAD: `d121d6eb394a7303349ec51d27731ec8a5675e2f`
- Required G004.00 authority was present:
  - `G004_00_OPERATOR_WRITE_SURFACE_RISK_DECISION.md`
  - `G004_00_OPERATOR_WRITE_SURFACE_MATRIX.md`
  - `G004_00_OPERATOR_WRITE_RISK_DECISION_BRIEF.md`
- Prior governance authorities were present:
  - G003 adapter-only read-model and staticity authority
  - G002 Professional workspace-mode reconciliation
  - G001 private-data Git backstop
  - S007 local identity and issuer artifacts

## Scope

This mission adds an interim fail-closed server-side write gate for existing `/operator` mutation surfaces. It does not add authentication, role authorization, action approval, replay protection, multi-user access, persistence, provider integration, or deployment.

No write route was invoked. No server action was invoked. No private Career or Job Search content was read. No secrets were read.

## Surfaces Protected

### POST Routes

| Surface ID | Route handler | Result |
| --- | --- | --- |
| `G004-API-001` | `app/api/operator/execute-primary-action/route.ts` | Guarded before execution timestamp and runtime JSON writes |
| `G004-API-002` | `app/api/operator/workday/start/route.ts` | Guarded before workday script path creation |
| `G004-API-003` | `app/api/operator/workday/stop/route.ts` | Guarded before workday script path creation |
| `G004-API-004` | `app/api/operator/lead-registry/action/route.ts` | Guarded before request-body parsing |
| `G004-API-005` | `app/api/proof/abando-recovery/run/route.ts` | Guarded before environment-file reads, worker execution, and proof writes |
| `G004-API-006` | `app/api/operator/blueprints/[engagementId]/commands/route.ts` | Guarded before onboarding command forwarding |

### Server Actions

| Surface IDs | Source file | Result |
| --- | --- | --- |
| `G004-SA-001` through `G004-SA-005` | `app/operator/command-center/page.tsx` | Each mutation-capable action calls the gate before form reads and write helpers |
| `G004-SA-006` through `G004-SA-010` | `app/operator/shopifixer-pilot/page.tsx` | Each mutation-capable action calls the gate before form reads and write helpers |

## Canonical Gate

Canonical utility:

`staffordos/ui/operator-frontend/lib/operator/operatorWriteIsolation.ts`

The gate requires both:

1. Explicit local write enablement through `STAFFORDOS_LOCAL_OPERATOR_WRITES_ENABLED=true`.
2. A server-observed loopback request boundary.

The flag is not a credential and is not authentication.

## Local Boundary Rules

Allowed loopback hosts:

- `localhost`
- `127.0.0.1`
- `::1`

Denied boundaries:

- missing host
- LAN host
- public host
- `.local` host
- incoming browser/proxy forwarding metadata
- preview deployment marker
- cloud deployment marker
- non-development runtime
- malformed enablement flag
- absent enablement flag

The implementation denies production-mode processes even on loopback. That is a deliberate interim choice until S007 verifier/session integration defines production-safe write authority.

## Approved Local Transport Amendment

For local development only, framework-generated forwarding metadata may coexist with the gate when a custom Next server has already proven the original transport boundary. The server binds exclusively to `127.0.0.1`, verifies a loopback socket peer, rejects incoming `Forwarded`, `X-Forwarded-*`, `X-Real-IP`, `True-Client-IP`, and `CF-Connecting-IP` headers before Next handling, and creates a private request-scoped proof. The proof is carried through private `AsyncLocalStorage`, consumed once by the canonical gate, and cannot be supplied by a browser, copied into a header, or reused on another request.

Missing, mismatched, or reused proof remains fail-closed. The wrapper also requires the canonical `127.0.0.1` host and same-origin `Origin` on unsafe methods before Next handling. Authentication, exact permission, origin, explicit enablement, development mode, cloud/preview denial, and all other gate rules remain required. This amendment affects only the guarded local write surfaces and does not enable production or read-only routes.

## Denial Behavior

POST routes return HTTP `403` with:

```json
{
  "ok": false,
  "error": "OPERATOR_WRITE_DISABLED",
  "message": "Operator changes are not available in this runtime."
}
```

Server actions throw the same operator-safe denial message through `OperatorWriteIsolationError`.

No raw request headers, environment values, secret values, or internal paths are exposed by the gate result.

## Operator Workflow

Intentional local writes require starting the operator frontend locally with an explicit non-secret flag:

```bash
STAFFORDOS_LOCAL_OPERATOR_WRITES_ENABLED=true npm run dev
```

This command is run from `staffordos/ui/operator-frontend`.

Rules:

- without the flag, writes are disabled;
- with the flag but a non-loopback request, writes remain disabled;
- restarting without the flag returns to the fail-closed default;
- the flag must not be committed in `.env.local`;
- the flag must not be used with tunnels, proxies, preview deployments, or public deployments;
- the flag does not prove Ross’s identity or approve an action.

## Operator Disclosure Result

No broad page-level disclosure component was added. Write routes and server actions now fail with a calm operator-facing message when writes are disabled. A later UI polish slice may add visible per-surface status once the S007 session model is known.

## Future S007 Integration Seam

The current gate is intentionally narrow and reusable. Later S007 integration should add:

- authenticated session;
- operator identity;
- workspace membership;
- role authorization;
- capability permission;
- action-specific approval;
- request/audit context.

The target control stack remains:

`runtime boundary + authenticated session + workspace membership + capability permission + action-specific approval when required + audit`.

## Static Coverage Scan

Focused tests verify:

- all five POST route handlers call the canonical gate;
- the gate appears before the mutation marker for each route;
- all ten server-action directives have a guard;
- server-action guards occur before form reads and write helpers;
- no duplicate isolation utility exists;
- no hardcoded bypass or permissive fallback exists;
- `/os` routes and read-only operator loaders do not import the gate.

## Validation

| Check | Result |
| --- | --- |
| G004.01 focused tests | `PASS` |
| G004/G003/G002/J001/S010/S009/S008 regression tests | `PASS` |
| Build | `PASS_WITH_EXISTING_NON_FATAL_DIAGNOSTICS` |
| GET-only route checks | `PASS` |
| JSON validation | `PASS` |
| Diff checks | `PASS` |

Build note: `npm run build` exited `0`. Next emitted an existing Turbopack NFT warning and non-fatal `/operator/shopifixer-pilot` server-action serialization diagnostics during static page generation; the route returned HTTP `200` in GET-only validation.

## Known Limitations

- This is not authentication.
- This is not authorization.
- This is not action-specific approval.
- This is not production-ready.
- Framework transport is accepted only with the approved local proof; server actions remain subject to the same gate and are not production-enabled.
- Private Job Opportunity UI display remains blocked until server authorization exists.
- S007 verifier/session integration is still required before any deployment or multi-user write usage.

## Rollback

Repository rollback:

```bash
git revert <G004.01 commit SHA>
```

Rollback disables the custom local server/proof integration or reverts this amendment; the canonical gate then fails closed on framework-forwarded requests. No data, identity, provider, database, private-record, or deployment rollback should be required.

## Selected Next Mission

`S007_01I_OAUTH_SECRET_ROTATION_AND_BROWSER_PROOF_PLAN`

Reason: write isolation reduces immediate operator-surface risk, but private UI connection and deployed write use remain blocked on trusted browser/session proof. The OAuth rotation and browser-proof plan is the next prerequisite before verifier/session integration.
