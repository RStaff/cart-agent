# Control Plane vs Product Engine

Purpose: make the architecture boundary explicit so StaffordOS can grow as a control plane without being merged into individual product runtimes.

## Core Boundary

- StaffordOS = control plane.
- Products = execution engines.
- Family, Leads, Revenue Command, and Analytics belong in StaffordOS.
- Abando, Shopifixer, and Actinventory own product-specific workflows and dashboards.
- The systems should connect through APIs and shared contracts, not through one merged UI codebase.

## Boundary Rule

If a workflow is cross-product, operator-facing, or service-coordination-oriented, it belongs in StaffordOS.

If a workflow is merchant-facing, product-specific, or tightly coupled to one product's execution logic, it belongs in that product engine.

## Area Map

| Area | Belongs To | Why | Current Status |
| --- | --- | --- | --- |
| Operator Console | StaffordOS | It is the operator's cross-product working surface, not a merchant product screen. | Real now, partial |
| Operator Home | StaffordOS | It should summarize operator work across products and service queues. | Planned next |
| Leads System | StaffordOS | Lead intake and prioritization should span products, not live inside one product dashboard. | Planned next |
| Revenue Command | StaffordOS | Revenue command is a control-plane operating function for delivery and commercial visibility. | Real now, partial |
| Analytics | StaffordOS | Shared analytics should explain portfolio and operator performance across products. | Planned next |
| Family Summary | StaffordOS | Family-level or portfolio-level visibility is a control-plane concern. | Planned |
| Cross-product lead queue | StaffordOS | It coordinates opportunities across products and routing decisions. | Planned next |
| Product Routing Layer | StaffordOS | Routing determines which product or service path should own the next action. | Real now, partial |
| Merchant Dashboard | Abando | It is product-specific and merchant-facing. | Real now |
| Recovery Action Creation | Abando | It is tied to Abando's product logic and recovery workflow. | Real now, partial |
| Recovery Queue and Workers | Abando | These are execution-engine responsibilities tied to Abando outcomes. | Real now, partial |
| Abando Honest Messaging | Abando | Product truth must stay coupled to actual recovery state and tracked outcomes. | Real now, partial |
| Shopifixer Workspace | Shopifixer | Product-specific operations should live with that product engine. | Planned |
| Actinventory Workspace | Actinventory | Product-specific inventory workflows belong to that engine. | Planned |

## Current State

- StaffordOS already has separate modules for routing, execution, optimization, revenue, outreach, and an operator UI scaffold.
- Abando already has product-facing surfaces and runtime behavior that make it the clearest current execution engine.
- The boundary exists conceptually and structurally, but it is not yet fully enforced through a complete StaffordOS backend and API contract layer.

## Target State

- StaffordOS becomes the control plane used by operators to run service delivery and cross-product coordination.
- Each product engine remains independently responsible for its own merchant workflows, dashboards, and domain-specific runtime.
- StaffordOS pulls summaries, task states, and product outputs through APIs.
- Product engines do not become generic operator shells.

## Practical Examples

- Operator Console -> StaffordOS
- Merchant Dashboard -> Abando
- Revenue Command -> StaffordOS
- Recovery Action Creation -> Abando
- Cross-product lead queue -> StaffordOS

## What This Prevents

- StaffordOS being swallowed by Abando's UI.
- Product runtimes accumulating unrelated control-plane responsibilities.
- A false sense that one merged app is the same thing as a platform.

## Restart Note

When future work resumes, use this rule first: build shared operator and service systems in StaffordOS, and keep product-specific merchant execution inside the product engines.
