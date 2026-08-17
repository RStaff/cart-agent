# CareerOS Private Beta Security and Deployment Readiness

The contained CareerOS persistence layer was revalidated against an isolated PostgreSQL instance using synthetic identities and text only. The flow covered invite creation and single-use consumption, signup, login, profile, source, candidate facts, confirmation, export, logout/revocation, cross-tenant denial, rate-limit exhaustion, and deletion.

Production mode now fails closed unless `DATABASE_URL`, `CAREEROS_APP_ORIGIN`, `CAREEROS_SESSION_PEPPER`, and `CAREEROS_INVITE_ONLY=true` are present. Authentication mutations use a database-backed limiter; local in-memory limiting remains development-only. Pasted text is bounded to 50,000 characters and binary uploads remain disabled.

The implementation is not yet externally data-ready because remote migration/smoke testing, deployment secret/TLS validation, provider backup/restore proof, and a recovery/verification delivery policy are not established in this local-only mission.
