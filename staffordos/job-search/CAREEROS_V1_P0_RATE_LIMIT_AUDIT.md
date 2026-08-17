# CareerOS P0 Rate Limit Audit

Signup and login use a bounded in-memory limiter only in development. Production does not pretend that process-local memory is sufficient: customer mutation is allowed only when `CAREEROS_RATE_LIMIT_BACKEND` is configured, and the external/shared limiter implementation remains a deployment dependency.

Required production limits cover signup, login, recovery, and source-intake submission. No credentials or limiter configuration is committed.
