# CareerOS P0 Identity Hardening

Implemented/defined:

- scrypt password hashing with per-account random salt
- no plaintext password persistence or response
- database-backed production sessions with SHA-256 token digests
- expiry, last-used timestamp, revocation, logout
- session resolution joined to active tenant membership
- production mode fails closed without `DATABASE_URL`
- production mutating routes require configured same-origin checks
- production mode requires invite-only signup, app origin, and a session pepper
- signup consumes a single-use, email-bound invitation

Remaining before invite-only external beta: authorized deployment migration/smoke testing, email verification/recovery, backup/restore proof, production secret/TLS validation, and deployment environment validation.
