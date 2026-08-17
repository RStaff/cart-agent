# Production Environment Contract

Production requires `DATABASE_URL`, `CAREEROS_APP_ORIGIN`, `CAREEROS_SESSION_PEPPER`, and `CAREEROS_INVITE_ONLY=true`. Missing values fail closed through `careerP0Environment.mjs`. Production uses PostgreSQL; local JSON is never selected in production.

The deployment must provide TLS, secret storage, database backups, migration execution, and a shared PostgreSQL limiter. Secret values are never logged or committed. Mail/recovery configuration is intentionally absent until an authorized delivery path exists.
