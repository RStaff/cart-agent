# CareerOS V1 P0 Account/Profile Foundation Report

Implemented a customer-only `/career` namespace with local account creation, password login, logout, opaque HTTP-only sessions, one-owner tenant membership, tenant-private CareerProfile creation/read/update, and server-side tenant resolution.

The implementation does not import StaffordOS operator routes or private CareerOS loaders. It does not touch CareerFact, CareerEvidence, capability authority, requirement concepts, V2D, or A3 matching behavior.

Acceptance uses synthetic tenants only. Four focused store tests pass, TypeScript passes, and the production build path is validated separately. The local JSON adapter is an explicit temporary boundary; production database persistence and customer identity hardening remain required before external data is accepted.
