# CareerOS P0 Account/Profile Authority

The P0 customer boundary is implemented as a tenant-scoped account, session, profile, and source-metadata contract in the customer frontend.

Authority rules:

- A session resolves to one user and one owner membership.
- The tenant is resolved from the server-side session, never from client input.
- Profiles are unique to `(tenantId, userId)` and all reads/writes use that resolved pair.
- Career source records are reserved for later intake and are tenant-scoped metadata only.
- CareerFact, CareerEvidence, capability authority, and operator-private loaders remain outside this customer boundary.
- A3 matching code and semantics are not imported or changed.

The current runtime adapter is a local durable JSON store selected by `CAREEROS_P0_STORE_PATH`. It proves ownership and session behavior without introducing an unauthorized external auth provider. A production beta must replace this adapter with the approved tenant-scoped database/object-storage implementation before external customer data is accepted.
