# CareerOS P0 Identity Hardening

Implemented/defined:

- scrypt password hashing with per-account random salt
- no plaintext password persistence or response
- database-backed production sessions with SHA-256 token digests
- expiry, last-used timestamp, revocation, logout
- session resolution joined to active tenant membership
- production mode fails closed without `DATABASE_URL`
- production mutating routes require configured same-origin checks

Remaining before invite-only external beta: email verification/recovery, external rate limiting, production secret rotation, account enumeration review, and deployment environment validation.
