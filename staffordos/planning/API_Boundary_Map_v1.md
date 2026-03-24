# API Boundary Map v1

Purpose: map how StaffordOS will talk to products without merging codebases.

## Boundary Principle

- StaffordOS UI talks to the operator layer.
- The operator layer talks to products by APIs.
- Product engines keep their own runtime logic and merchant-facing workflows.
- StaffordOS should consume summaries, tasks, and documents rather than absorbing product code directly.

## Current State

- StaffordOS has separate UI and module foundations for operator-oriented work.
- Abando has active product runtime and merchant-facing surfaces.
- The operator-to-product contract is not yet a complete formal API layer.
- The split is visible in the repo structure, but the future boundary still needs to be completed and standardized.

## Future Target State

- StaffordOS owns the operator-facing UI and read models for cross-product work.
- A StaffordOS operator backend mediates requests, aggregation, and scheduling.
- Each product exposes product-specific summary and action endpoints.
- The UI boundary stays clean: operator UI in StaffordOS, merchant UI in product engines.

## Operator-Layer Endpoints

| Endpoint | Purpose | Status |
| --- | --- | --- |
| `POST /api/operator/query` | Ask the operator layer for a routed answer, action, or recommendation. | Planned |
| `GET /api/operator/overview` | Load operator home overview across products and queues. | Planned |
| `GET /api/operator/tasks` | Return the operator task list and current board state. | Planned |
| `GET /api/operator/schedule` | Return today's schedule, due work, and waiting states. | Planned |
| `GET /api/operator/docs` | Return planning docs, operating notes, and restart packets. | Planned |

## Product Summary Endpoints

| Endpoint | Purpose | Status |
| --- | --- | --- |
| `GET /api/abando/merchant-summary` | Return merchant summary data for Abando status, events, and recovery state. | Planned next |
| `GET /api/shopifixer/open-issues` | Return open fix opportunities and job states for Shopifixer. | Planned |
| `GET /api/actinventory/opportunities` | Return prioritized inventory opportunities and their current state. | Planned |
| `GET /api/leads/queue` | Return a cross-product lead queue owned by StaffordOS. | Planned next |
| `GET /api/family/summary` | Return family or portfolio-level summary across products. | Planned |

## Real vs Planned Notes

## Real now

- Abando has real product APIs and product routes in the repo, but not under this exact target naming scheme.
- StaffordOS has real modules and operator UI scaffolding, but not yet a production-ready operator backend.
- The idea of API separation is already the right architectural direction.

## Next

- Define a thin operator backend or API aggregation layer inside StaffordOS.
- Start with read endpoints first: overview, tasks, docs, and product summaries.
- Connect StaffordOS to Abando by API before expanding to additional product engines.

## Later

- Add standardized auth, contracts, and versioning across product summary endpoints.
- Support multiple product engines without changing the StaffordOS UI architecture.

## Practical Boundary Rules

- Do not merge StaffordOS UI into product UIs.
- Do not let product dashboards become the operator control plane.
- Prefer summary and task endpoints over deep direct coupling.
- Build the API contract around real operating needs: overview, queue state, task state, revenue visibility, and restart context.
