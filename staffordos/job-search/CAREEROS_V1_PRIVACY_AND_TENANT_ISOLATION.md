# CareerOS V1 Privacy and Tenant Isolation

## Finding

The existing CareerOS authority is private filesystem/NDJSON and the existing web identity uses email lookup and shop API-key middleware. Neither is sufficient as the customer CareerOS boundary.

## Required controls

- authenticated session resolves exactly one user and tenant;
- every CareerOS query includes an authorized tenant/profile predicate;
- raw documents and evidence are private-object access, never public URLs;
- derived facts, capabilities, decisions, matches, and audit events inherit tenant ownership;
- exports are tenant-scoped and complete enough to be useful;
- deletion is a governed cascade with retention exceptions recorded separately;
- retention and document deletion are explicit, not implicit filesystem cleanup;
- audit records contain actor, tenant, entity, action, and version without raw sensitive payloads;
- background jobs carry tenant context and reject missing context;
- support access is explicit, time-bounded, audited, and read-only by default.

## Unsafe current assumptions

Email header/query identity, shop API-key identity, shared private roots, operator-only route assumptions, and unscoped filesystem loaders cannot be reused as customer authorization.
