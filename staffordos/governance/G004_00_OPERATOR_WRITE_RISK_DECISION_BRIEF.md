# G004.00 Operator Write Risk Decision Brief

Date: 2026-08-03

## Plain-Language Answer

StaffordOS currently has operator UI paths that can change local Stafford Media operating records, create proof artifacts, start or stop local workday scripts, and run a proof worker. These controls are useful for Ross solo local operation, but the server endpoints behind them do not yet prove who clicked or called them.

No repository evidence proves the operator frontend is publicly deployed today. That is not the same as protection. If the operator frontend is started locally, exposed through a tunnel, or deployed later, direct requests can reach the POST routes unless a server-side guard is added.

## What Can Change State

- Primary Action execution can update runtime JSON and run the local execution spine.
- Workday start can write a local report and probe local runtime health.
- Workday stop can write local checkpoint files and attempt a home-server checkpoint.
- Lead actions can change lead lifecycle state and write event/proof ledgers.
- Abando proof run can execute the web worker once and write proof artifacts; the worker has database and email-send code paths.
- ShopiFixer proof server actions can write before/after evidence, scope, proof packages, seals, and completion truth.

## What Is Safe Enough Now

Read-only discovery and local documentation are safe. Some low/moderate local artifact writes may be acceptable for Ross solo local use only after Ross explicitly accepts the risk and the app is not network-reachable.

## What Must Not Be Used Yet

High-impact or externally consequential routes should not be used from any deployed, tunneled, shared, or multi-user environment until isolated or protected. That includes worker execution, workday stop checkpointing, primary-action execution, fulfillment completion, and any future external communication or application-submission authority.

## Direct Request Risk

For the five POST API routes, a direct HTTP request can bypass the intended UI button, checkbox, or navigation flow because the route itself does not enforce a human operator session. Server actions are less obvious to call directly because of Next.js transport, but they still lack durable operator authorization.

## Smallest Safe Correction

The next mission should implement minimal write-surface isolation before full identity deployment. The target is a fail-closed server guard for high and critical routes outside explicitly approved local development, plus clear route-level prohibition of deployed use until S007 verifier/session integration exists.

## Ross Approval

Ross has not approved an accepted-risk period in this mission. A separate accepted-risk decision is required before treating any unresolved write surface as intentionally usable under local-solo assumptions.

## Identity Dependency

S007 identity and issuer work exists locally, but it is not deployed or wired into the operator frontend. Private Job Search UI display and any operator write authority should remain blocked until server authorization is connected.
