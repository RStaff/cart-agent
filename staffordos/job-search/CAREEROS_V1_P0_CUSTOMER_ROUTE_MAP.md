# CareerOS P0 Customer Routes

| Route | Protection | Purpose |
| --- | --- | --- |
| `/career` | authenticated | Resolve profile state and redirect to onboarding/profile |
| `/career/signup` | public | Create a local beta account and owner tenant |
| `/career/login` | public | Create a customer session |
| `/career/onboarding` | authenticated | Create the first tenant-owned profile |
| `/career/profile` | authenticated | Read and bounded-update the profile |
| `/api/career/auth/*` | route-specific | Account/session operations |
| `/api/career/profile` | authenticated | Tenant-scoped profile CRUD boundary |

`/os/professional/*` remains an operator surface and is not imported, linked as customer authority, or exposed through the customer routes.
