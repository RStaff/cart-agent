# CareerOS P0 Security Audit

Passed boundaries:

- Customer sessions use opaque, HTTP-only, same-site cookies.
- Session resolution fails closed for missing, expired, revoked, or incomplete membership records.
- Tenant identity is derived server-side.
- Profile access is scoped by the resolved tenant and user.
- Customer routes do not import private CareerOS loaders or operator route modules.
- Profile responses contain no private source payloads, internal digests, or operator identifiers.

Remaining P0-before-beta work:

- Replace local JSON persistence with the approved database adapter.
- Add production password policy, rate limiting, recovery, email verification, CSRF strategy, audit events, deletion/export, and secure object storage.
- Add deployment secret/environment validation and operational error telemetry.

The current implementation is suitable for synthetic local acceptance, not for accepting external customer data yet.
