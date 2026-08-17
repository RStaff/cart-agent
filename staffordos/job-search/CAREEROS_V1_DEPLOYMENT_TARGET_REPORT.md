# CareerOS Deployment Target Authority Report

## Decision

`DEPLOYMENT_TARGET_AUTHORITY_READY_PENDING_OPERATOR_APPROVAL`.

The repository audit is sufficient to select one bounded architecture, but not to claim an authorized or provisioned CareerOS environment. The preferred target is a separate Render application plus a dedicated managed PostgreSQL database, provider-managed secrets, and an approved CareerOS origin. The existing Render authority is for Abando/cart-agent and does not itself authorize this new service.

## Evidence

- `render.backend.yaml` defines `cart-agent-api`, not CareerOS.
- `render.yaml` defines Abando/static web services, not the Next CareerOS customer runtime.
- Kubernetes manifests define the `cart-agent` namespace and backend, not CareerOS.
- Existing production database evidence names `cart_agent_db`; sharing it is explicitly rejected.
- No CareerOS origin, DNS/TLS binding, secret set, backup authority, or governed CareerOS deployment workflow was found.
- Local CareerOS product artifacts and matching authority remain unchanged.

## Five-user path

Approve the target, create the isolated database/service/secrets/origin, enable backups, run the additive migration, deploy through the governed path, and run synthetic acceptance. No provisioning occurred here.

## Evolution

The isolated tenant schema and service contract can serve 10 and 100 users without changing authority boundaries. At approximately 1,000 users, reassess database capacity, connection pooling, background processing, and observability; do not pre-build that complexity for five users.

## Final boundary

The target is explicit as a recommended architecture. External provisioning is not authorized. The next mission is `CAREEROS_V1_PRODUCTIZATION_P0_DEPLOYMENT_PROVISION_AND_PROOF`, only after explicit operator approval.
