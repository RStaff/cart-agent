# CareerOS P0 Production Persistence Decision

Decision: `P0_PRODUCTION_PERSISTENCE_BLOCKED` for real external data; local private-beta controls pass, but deployment, backup/restore, and recovery/verification authority remain outside this repository.

The contained Prisma model, additive migration, production PostgreSQL adapter, token-digest sessions, tenant predicates, transactions, export/delete contracts, audit events, and fail-closed production configuration are implemented. External data remains blocked until migration execution, identity recovery/verification, shared rate limiting, deployment validation, and privacy lifecycle acceptance are completed.
