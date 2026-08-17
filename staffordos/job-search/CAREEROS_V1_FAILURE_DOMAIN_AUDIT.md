# CareerOS Failure-Domain Audit

| Failure | Required behavior |
|---|---|
| App runtime unavailable | Existing sessions fail safely; no fallback to local JSON; provider health/restart path used |
| Database unavailable | Customer operations fail closed with safe error; no authority mutation or local fallback |
| Migration failure | Deployment stops before traffic; inspect/restore through provider procedure; no destructive repair |
| Missing secret | Production startup fails closed |
| Rate limiter unavailable | Authentication-sensitive routes fail closed or remain explicitly bounded; never silently use in-memory fallback |
| Origin/TLS mismatch | Do not issue production customer sessions; deployment fails preflight |
| Backup unavailable | No external customer data; deployment remains blocked |

The isolated Render stack minimizes operational burden for five users. Cloud Run/Cloud SQL offers a stronger managed-service fallback but requires new account/secret/backup authority.
