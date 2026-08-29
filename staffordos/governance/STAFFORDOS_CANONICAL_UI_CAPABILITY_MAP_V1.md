# StaffordOS Canonical UI Capability Map V1

Status: READ-ONLY GOVERNANCE MAP
Date: 2026-08-29
Canonical contract: `staffordos/governance/STAFFORDOS_CANONICAL_UI_AUTHORITY_CONTRACT_V1.md`

This map connects current runtime capabilities to the canonical `/os` taxonomy. It does not move routes, add adapters, or change business or security authority.

All current `/operator` entries use `staffordos/ui/operator-frontend/components/operator/OperatorShell.tsx`. The canonical target shell is `StaffordOsShell` under `/os`.

| Capability | Current route | Purpose | `/os` section | Workspace | Status | Logic / authority source | Write authority | Relocation required |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Operator Home | `/operator` | Daily priority, validation, workday, and operating guidance | Home | Stafford Media | CURRENTLY_MAPPED | `app/operator/page.tsx`, `OperatorHomeV1`, primary-action and artifact loaders | Workday and primary-action controls exist | No; presentation adapter later |
| Executive / Command Center | `/operator/command-center` | Customer-work, fulfillment, and proof command surface | Work | Stafford Media | NEEDS_PRESENTATION_ADAPTER | `app/operator/command-center/page.tsx`, ShopiFixer command-center loaders | ShopiFixer proof/completion actions and related server actions | No immediate relocation |
| CareerOS Beta Operations | `/operator/careeros/beta-users` | Privacy-safe beta operational aggregates | System | Stafford Media operator control plane | NEEDS_PRESENTATION_ADAPTER | `careerosBetaOperationsReadModel.ts`, `authorizeStaffordOsOperatorRead` | None; read-only | No immediate relocation |
| Marketing | `/operator/campaigns` | Marketing activity and campaign visibility | Pipeline | Stafford Media | CURRENTLY_MAPPED | `campaignResolver.ts`, campaign registry | Campaign surface is read-oriented | No |
| Campaigns | `/operator/campaigns` | Campaign registry, coverage, and activity | Pipeline | Stafford Media | CURRENTLY_MAPPED | `campaignResolver.ts`, campaign registry | No new authority | No |
| Sales | `/operator/leads` | Lead command and contact readiness | Pipeline | Stafford Media | CURRENTLY_MAPPED | `loadOperatorLeads.ts`, `LeadQueue.tsx` | Lead lifecycle actions | No immediate relocation |
| Leads | `/operator/leads` | Lead queue and readiness | Pipeline | Stafford Media | CURRENTLY_MAPPED | Lead registry and `LeadActions` | Lead lifecycle action route | No immediate relocation |
| Finance / Revenue Command | `/operator/revenue-command` | Revenue queue and money-to-collect visibility | Pipeline | Stafford Media | NEEDS_PRESENTATION_ADAPTER | Revenue truth, dashboard snapshot, revenue command page | Read-oriented current surface | No |
| Execution Log | `/operator/execution-log` | Execution, outcome, agent, and rule evidence | Knowledge | Stafford Media | NEEDS_PRESENTATION_ADAPTER | `loadExecutionLog.ts`, execution/outcome artifacts | None | No |
| System Map | `/operator/system-map` | System connections, source map, and health context | System | Stafford Media | NEEDS_PRESENTATION_ADAPTER | System-map loaders and manifest components | Existing proof action panel must remain bounded | No |
| Validators | None; planned sidebar item | Future validation and system-check capability | Governance | Stafford Media | PLANNED | Existing validator artifacts and governance validators | None established | Not applicable |
| AI Operations | None; planned sidebar item | Future agent and automation operations | System | Stafford Media | PLANNED | Agent/capability registries; no dedicated UI route | None established | Not applicable |
| Engineering | None; planned sidebar item | Future engineering/system maintenance view | System | Stafford Media | PLANNED | No dedicated current UI authority | None established | Not applicable |
| Customer Success | None; planned sidebar item | Future post-delivery outcome and relationship support | Knowledge | Stafford Media | PLANNED | Relationship and outcome resolvers are partial sources | None established | Not applicable |
| Delivery | `/operator/shopifixer-pilot` capability lens | Product delivery and proof workflow | Work | Stafford Media | NEEDS_ROUTE_PARITY | `ShopifixerPilotWorkspace.tsx`, proof and completion authority | ShopiFixer proof/completion writers | No immediate relocation |

## CareerOS Placement

CareerOS customer experience remains outside StaffordOS operator authority. The current operational route is an authenticated StaffordOS read surface requiring `careeros.beta.operations.read`.

The best canonical section is `System`: the view reports product operational health, workflow progress, and bounded platform status. It is not a new top-level `CareerOS` section and it does not expose Professional customer records or private career evidence.

## Migration Order

1. Preserve `/operator` runtime compatibility and all existing write boundaries.
2. Use this map as the single read-only route-to-section index.
3. Add presentation-only links or adapters under `/os`.
4. Verify read parity and privacy boundaries.
5. Verify write and side-effect parity for action-capable surfaces.
6. Verify authentication, session, and authorization behavior.
7. Obtain human visual and workflow acceptance.
8. Consider route retirement only after separate replacement authority and rollback evidence.
