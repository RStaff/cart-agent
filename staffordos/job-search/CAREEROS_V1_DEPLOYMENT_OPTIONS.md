# CareerOS Private-Beta Deployment Options

## Recommendation

Preferred: `CAREEROS_RENDER_ISOLATED_STACK`.

This is a proposed architecture, not an existing authorized target. It uses a separate Render web service for the CareerOS Next runtime, a dedicated CareerOS PostgreSQL service/database, a separate secret namespace, and a customer origin approved by the domain owner. It must not reuse `cart-agent-api`, `cart_agent_db`, Abando domains, or operator tooling.

Secondary fallback: `CAREEROS_GCP_CLOUD_RUN_CLOUD_SQL`, only if GCP ownership, billing, secret, backup, and deployment authority are explicitly confirmed before provisioning.

## Options

| Option | Isolation | Beta operations | Backups/restore | Existing evidence | Decision |
|---|---|---|---|---|---|
| Render isolated stack | High if separately provisioned | Low | Managed PostgreSQL capability must be confirmed for the selected service | Existing Render knowledge, but only Abando authority is evidenced | Preferred pending approval |
| Cloud Run + Cloud SQL | High | Low/medium | Strong managed-service path if account authority exists | No CareerOS GCP authority evidenced | Fallback |
| Existing GKE/ArgoCD namespace | Potentially high | High for five users | Depends on separately proven PostgreSQL backup | Only cart-agent manifests are evidenced | Reject for beta |
| Existing Abando Render/DB | Low product isolation | Low | Shared boundary is unsuitable | Authorized for another product | Reject |

The comparison is deliberately qualitative. No provider pricing, account ownership, or backup capability is asserted without current provider authority.
