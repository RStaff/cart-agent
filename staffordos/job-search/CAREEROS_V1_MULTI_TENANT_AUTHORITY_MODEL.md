# CareerOS V1 Multi-Tenant Authority Model

## Ownership hierarchy

`Tenant -> User -> CareerProfile -> CareerSource -> CareerFact -> CareerEvidence -> Capability -> CapabilityAuthority -> RequirementConcept -> Requirement -> MatchEvaluation -> PursuitState`

## Entity ownership

| Entity | Ownership | Classification |
|---|---|---|
| Tenant, User, CareerProfile | customer tenant | tenant-private source data |
| CareerSource, CareerFact, CareerEvidence | customer tenant | tenant-private career authority |
| Capability, CapabilityAuthority, CapabilityDecision | customer tenant plus versioned global taxonomy | derived tenant data and user authority |
| Capability taxonomy, scope lattice, specialist taxonomy | product | global product taxonomy, versioned |
| RequirementConcept | product-derived taxonomy with tenant-safe provenance | derived normalization |
| Opportunity, Requirement | source/customer tenant | opportunity source data |
| MatchEvaluation, MatchRelationship | customer tenant | derived match output |
| PursuitState | customer tenant | workflow data, never capability truth |

Every tenant-owned row requires `tenantId`, every user-owned row requires `userId` or profile ownership, and every read path must authorize both. Cross-tenant lookup by human-readable fields is prohibited.

## Authority rule

CareerFact and CareerEvidence remain upstream career truth. Capability authority is derived and versioned. Requirement concepts normalize employer demand. Match results never mutate upstream authority. Pursuit and application outcomes never become capability truth automatically.
