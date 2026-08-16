# CareerOS V1 Persistence Architecture

## Current state

The repository has a PostgreSQL Prisma system with generic `User` and `Usage` models, but CareerOS facts, evidence, capability decisions, and requirement mappings remain private filesystem/NDJSON authorities. The existing web models are not a CareerOS tenant schema.

## Production system of record

Use the existing PostgreSQL/Prisma foundation only after adding a separate, tenant-scoped CareerOS schema. Minimum entities: Tenant, UserIdentity, CareerProfile, CareerSource, CareerFact, CareerEvidence, CapabilityAuthority, CapabilityDecision, Opportunity, Requirement, MatchEvaluation, MatchRelationship, PursuitState, AuditEvent, and Entitlement.

Use immutable/versioned records for authority decisions and derived projections. Store raw documents in private object storage with database references, not in JSON columns by default. Every derived record stores source/version references and graph/taxonomy versions.

## Do not migrate

Do not make Ross private NDJSON, V1.26 manifests, calibration/holdout artifacts, operator reports, commit-gate outputs, or temporary replay files production tables. They remain research/control artifacts.
