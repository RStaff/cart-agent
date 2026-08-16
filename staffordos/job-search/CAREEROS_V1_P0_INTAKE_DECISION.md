# CareerOS P0 Intake Decision

Decision: `P0_CAREER_INTAKE_FOUNDATION_READY_WITH_LIMITATIONS`

Tenant-safe source metadata, bounded pasted-text intake, deterministic candidate CareerFacts, provenance, customer confirmation/correction/rejection states, idempotent parsing, and cross-tenant isolation are implemented for synthetic/local use.

The next dependency is production persistence and identity hardening. Capability onboarding may be designed or tested with synthetic data, but real external customer data must wait for that hardening.
