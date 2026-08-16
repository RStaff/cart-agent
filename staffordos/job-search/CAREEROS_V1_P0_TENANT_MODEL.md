# CareerOS P0 Tenant Model

`User` identifies the customer account. `Tenant` is the ownership boundary for the account's CareerOS data. `TenantMembership` binds the user to the tenant with `OWNER` role. `CareerProfile` and all future sources, facts, evidence, capabilities, opportunities, and matches must carry tenant ownership.

The beta implementation uses one owner membership per account and leaves team membership extensible. No client-provided tenant identifier is accepted as authorization. The server derives the tenant from the session and checks the membership before every customer-data operation.

StaffordOS operator identities and sessions are a separate authority and are not accepted by `/career` routes.
