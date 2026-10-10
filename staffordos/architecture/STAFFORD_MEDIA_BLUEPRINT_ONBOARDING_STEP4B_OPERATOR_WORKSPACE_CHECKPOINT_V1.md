# Stafford Media Blueprint Onboarding Step 4B Operator Workspace Checkpoint v1

Status: **LOCAL PATCH — NOT PROMOTED**

Base verified once on 2026-10-09: GitHub `main` and live Render `cart-agent-api` both `233591e54cc6e7c67e2779883221cf072a4bb251` (`dep-db23qfjncjis73c78o1g`, live).

## Scope

- Adds the authenticated operator location `/operator/blueprints`; engagements remain keyed by `StaffordosBlueprintEngagement.id` and are not forced into client relationship routes.
- Adds governed server proxies under `/api/operator/blueprints` and the bounded internal collection read `GET /api/staffordos/blueprint-engagements`.
- Displays durable verified-payment facts, provider buyer evidence explicitly marked as unconfirmed identity, Ross's identity decision, onboarding readiness/deadlines, and append-only audit history.
- Exposes only Step 4A commands allowed by the current state. Existing-client confirmation and new-client establishment remain disabled because no compatible durable client verifier/creator exists.
- Adds no schema, migration, email, onboarding automation, delivery execution, DBM scoring, credit, implementation, portal, or social behavior.

## Authorization boundary

Browser code receives neither the internal API key nor operator authority headers. Next server routes require the established encrypted operator session with exact `staffordos.revenue_operations.write`, derive the actor subject server-side, and apply the existing local-loopback write-isolation gate before proxying commands. The API repeats exact permission/state/version validation. Missing, expired, and wrong-permission session behavior is inherited from the established session authority.

Dependency closure: the review patch restores the approved committed authority from `75a6713d` (durable PostgreSQL-backed sessions, auth routes, encrypted session guard, and write-isolation gate), with its existing `20260730120000_add_staffordos_operator_identity_authority` migration and locked `pg@8.16.3` dependency. The only additive permission mapping is the already-approved `staffordos.revenue_operations.write` role used by Step 4A/4B. The later uncommitted local 8-hour/forwarded-peer behavior is not copied into this patch; it is a separate authentication policy change. No browser credential or internal key crosses the server boundary.
Tracked dependency files: `app/api/operator/auth/{login,callback,logout}/route.ts`, `lib/operator/staffordosOperatorSession.ts` plus its `.test.mjs`, `lib/operator/staffordosOperatorSessionRepository.ts`, `lib/operator/operatorWriteIsolation.ts` plus its `.test.mjs`, and operator-frontend package/lock updates. The inbound-automation route’s auth import was corrected only as dependency wiring; no permission behavior was relaxed.

## Evidence and local QA

- Seven Step 4B proxy/view-model/responsive/keyboard source tests pass.
- The affected real HTTP Step 4A lifecycle test passes against disposable PostgreSQL with the new authenticated list assertions; it also re-proves persistence, stale concurrency, audit atomicity, payment immutability, and engagement isolation.
- Focused TypeScript checks pass for the workspace and, when resolved against the existing approved auth files, its three server routes.
- Clean-tree validation: `npm ci --offline` succeeded; the 23 targeted session/write-gate tests and four Step 4B proxy/view-model tests pass from the isolated checkout, with server-only credential assertions. The production build remains blocked by the pre-existing untracked `staffordos/leads/staffordmedia_revenue_transaction_v1.mjs` imported by both inbound-automation routes; restoring that revenue authority is outside this auth-only dependency slice. The full gate/session suites also contain fixture checks for other absent base routes/governance files, so those checks are not claimed as clean-tree passes.
- A mechanical auth dependency patch is therefore reviewable but not promotion-ready: it tracks the approved auth files, migration-backed session dependency, package lock, and exact permission mapping without copying the newer uncommitted authentication-policy changes.
- Clean-build dependency closure: restored `staffordos/leads/staffordmedia_revenue_transaction_v1.mjs` verbatim from approved commit `3d3fa72e` (same implementation also present in `5549c96c`). The inbound routes consume only its `REVENUE_OPERATIONS_PERMISSION` export (`staffordos.revenue_operations.write`); the module uses only Node `crypto`, `fs`, and `path`, is not the write-isolation gate, and no registry/provider file is needed for this import. Its broader revenue operations remain behaviorally unchanged and are not invoked by Step 4B.
- After restoration, `npm run build` compiles and type-checks successfully and exits zero. Next still emits existing ShopiFixer pilot prerender warnings about functions passed to Client Components; these are outside Step 4B and are not treated as new failures.

Local QA: use the approved secure launcher and issuer, sign in normally, open `http://127.0.0.1:3210/operator/blueprints`, select only synthetic/disposable fixtures, exercise save/error/refresh and keyboard navigation, and confirm the list/detail refresh from durable authority. Do not use production engagements.
