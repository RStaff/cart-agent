# CareerOS P0 Data Lifecycle

Export contract: profile, source metadata, candidate facts, review decisions, confirmed CareerFacts, and onboarding state for the authenticated tenant only. Internal research artifacts and other tenants are excluded.

Delete contract: delete tenant-owned sessions, audit events, onboarding state, facts, review decisions, candidates, sources, profiles, membership, tenant, and user in one database transaction/cascade. Global taxonomies remain untouched. The local adapter implements the same lifecycle contract; the production adapter uses tenant cascade deletion.
