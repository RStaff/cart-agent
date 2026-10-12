# G004.00 Operator Write Surface Risk Decision

Date: 2026-08-03

Final classification: `OPERATOR_WRITE_RISK_CLASSIFIED`

## Checkpoint Authority

- Starting HEAD verified: `64ac3b4b891cf44c97df19d0a87527efb6237b1b`.
- Required prior commits were present in local history: `625b9150`, `eae4f9dd`, `d6a09095`, `f5728284`, and `64ac3b4b`.
- `/operator` remains the current Stafford Media runtime authority.
- `/os` remains the parent workspace shell.
- G003 keeps private Job Opportunity display blocked on server authorization.
- S007 identity and issuer foundations exist locally, but they are not deployed or connected as runtime trust for the operator frontend.

## Worktree Exclusions

The repository had pre-existing dirty runtime JSON, web runtime, S007, production, and architecture artifacts before this mission. They were inspected only where necessary to classify authority or readiness and were not modified, staged, or committed.

## Inventory Result

The ratified review count was reverified against the active operator frontend source:

- POST write or execution API routes: `5`.
- Server-action directives: `10`.
- Additional read-only GET API routes were present but were not counted as write surfaces.
- S007 internal routes exist in the local web worktree and provide future identity/execution-authority building blocks, but they are not connected to the operator frontend protection boundary and are not counted as current `/operator` UI write surfaces.

## Current Authorization Inventory

Current `/operator` write surfaces rely on one or more of:

- UI visibility and button placement.
- Client-side confirmation checkboxes.
- Input validation and precondition checks.
- Local filesystem or local script assumptions.
- Next.js Server Action transport.

No reviewed `/operator` write surface has proven server-side human authentication, role authorization, action-specific approval, or S007 session enforcement.

Authentication, authorization, approval, validation, and audit remain separate:

- Validation exists on some routes and writers.
- Audit or proof artifacts exist for some mutations.
- Validation and audit do not prove caller identity.
- UI controls do not prevent direct server invocation.

## Reachability Decision

Repository deployment files do not prove the operator frontend is currently deployed as a public production service. The reviewed surfaces are therefore classified as `SOURCE_ONLY` from repository evidence, with an explicit limitation: if the operator frontend is started locally, exposed through a tunnel, proxied, or deployed outside the observed config, its write routes become reachable server endpoints.

No public exposure was proven. No private exposure should be assumed safe.

## Overall Risk Decision

Decision: `PARTIAL_ACCEPTANCE_WITH_IMMEDIATE_ISOLATION`

Reason:

- Some local repository JSON and proof-writing surfaces may be tolerable for Ross solo local use only after explicit accepted-risk approval.
- Execution surfaces that run scripts, workers, SSH/SCP, or business completion writers are not acceptable for network-reachable or deployed use without server-side isolation.
- Direct requests can bypass intended UI flow for the five POST API routes.
- Server actions are partially obscured by framework transport, but lack durable human authorization.

No accepted-risk period was activated by this mission.

## Correction Sequencing

Recommended order:

1. `G004_01_MINIMAL_OPERATOR_WRITE_SURFACE_ISOLATION`: add fail-closed local/development isolation for high and critical write/execution surfaces.
2. `S007_01I_OAUTH_SECRET_ROTATION_AND_BROWSER_PROOF_PLAN`: complete the issuer prerequisite without deploying ungoverned trust.
3. `S007_02_OPERATOR_VERIFIER_AND_SESSION_INTEGRATION_ARCHITECTURE`: connect operator identity to application sessions.
4. Add capability-scoped permission checks and action-specific approval records.
5. Add durable audit and request IDs for write operations.
6. Reconsider private Job Opportunity server adapter connection only after server authorization is in place.

## Job Search Impact

Permitted while G004 risk remains unresolved:

- private opportunity storage outside Git;
- read-only architecture;
- static requirement extraction contracts;
- synthetic evidence mapping;
- private career review outside UI.

Blocked until server authorization exists:

- private opportunity display in a deployed UI;
- application creation;
- resume mutation;
- application approval;
- application submission;
- recruiter messaging;
- external job-source fetching when identity or privacy is required.

## S007 Compatibility

S007 readiness classification: `VERIFIER_NOT_CONNECTED`.

The local issuer and verifier contracts are useful, but the current operator frontend does not enforce them. Existing S007 permissions are mainly ShopiFixer-specific and should be extended into workspace/capability-scoped permissions before multi-workspace writes.

## Validation

- Source inventory was performed by static repository inspection only.
- No POST, mutation, server action, worker, SSH, SCP, provider call, or write route was invoked.
- No private Career or Job Search contents were opened.
- No secret values were read or printed.
- No source code, route, identity code, deployment config, database, API behavior, or production state was changed.

## Rollback

Repository rollback:

`git revert <G004 commit SHA>`

Rollback removes only this governance documentation. It does not alter private records, runtime JSON, identity configuration, provider state, databases, routes, or deployments.

## Next Mission

Selected next mission: `G004_01_MINIMAL_OPERATOR_WRITE_SURFACE_ISOLATION`

Reason: it provides the best risk-reduction-to-change ratio by fail-closing high-impact write/execution surfaces before broader identity deployment or private Job Search UI connection.
