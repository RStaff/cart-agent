# STAFFORDOS_ARCHITECTURE_DECISION_RECORD_V1

Status: Accepted

Scope: governance and architecture only. No code, route, or UI changes are made by this record.

This ADR consolidates the completed StaffordOS planning documents:
- `STAFFORDOS_OPERATOR_SURFACE_INVENTORY_V1.md`
- `STAFFORDOS_OPERATOR_DAILY_WORKFLOW_V1.md`
- `STAFFORDOS_OPERATOR_GAP_CLOSURE_PLAN_V1.md`
- `STAFFORDOS_WAVE1_EXECUTION_PLAN_V1.md`
- `STAFFORDOS_CANONICAL_CONTINUITY_ROUTE_AUDIT_V1.md`
- `STAFFORDOS_MERCHANT_WORKSPACE_ARCHITECTURE_V1.md`

## 1. Canonical Operator Entry Point

### Decision
`/operator` is the canonical operator entry point.

### Rationale
- It is the existing StaffordOS executive home.
- It is the first screen in the approved daily workflow.
- It already aggregates revenue, blockers, relationships, execution logs, and snapshot-based decision support.

### Alternatives Considered
- `/operator/command-center`
- `/operator/cockpit`
- `/director`

### Consequences
- Ross starts every day in one place.
- Other operator surfaces remain specialized subviews, not the home screen.

### Status
Accepted

## 2. Canonical Merchant Entry Point

### Decision
`/fix-status` is the canonical merchant workspace entry point after verified payment.

### Rationale
- It is the active payment-return target.
- It receives packet, session, store, and reservation context.
- It is the correct shell for the post-payment merchant workspace.

### Alternatives Considered
- `/shopifixer/status`
- a new post-payment route

### Consequences
- The merchant journey remains on a single customer-facing continuity surface.
- Legacy continuity logic can remain only as compatibility until retired.

### Status
Accepted

## 3. Canonical Payment Authority

### Decision
The canonical payment authority is:
- packet authority: `GET /api/packets/:packetId`
- packet payment binding and lifecycle mutation in `web/src/routes/packetAuthority.esm.js`
- durable packet storage in Postgres `packets`

### Rationale
- Packet rows are the durable record of the paid merchant handoff.
- Payment-return binds verified payment to packet authority.
- The merchant continuity surface must hydrate from packet truth first.

### Alternatives Considered
- local StaffordOS JSON projections
- continuity page fallback state
- Stripe event history as the primary merchant-facing authority

### Consequences
- Packet authority remains the source of truth for paid state.
- Projection files become presentation layers, not authoritative payment records.

### Status
Accepted

## 4. Canonical Customer Lifecycle

### Decision
The approved customer lifecycle is:

1. Discover
2. Qualify
3. Audit
4. Checkout
5. Payment
6. Merchant Workspace / Fulfillment
7. Delivery
8. Follow-Up
9. Recurring Client

### Rationale
- This is the minimal lifecycle already implied by the planning documents.
- It aligns the operator workflow, merchant workspace, and evidence package.
- It supports progression from a one-time fix to a recurring Stafford Media Consulting client.

### Alternatives Considered
- separate merchant and operator lifecycle tracks
- leaving payment as the end of the customer journey

### Consequences
- Merchant continuity is treated as an active post-payment phase, not a terminal state.
- Delivery and follow-up become part of the approved operating model.

### Status
Accepted

## 5. Canonical Data Authorities

### Decision
The canonical data authorities are:
- Live Postgres for packet state
- Stripe for external payment/session facts
- StaffordOS runtime JSON only where no durable authority yet exists
- Generated projections for operator presentation layers

### Rationale
- Durable business state must live in Postgres and Stripe-linked authorities.
- JSON snapshots are useful for views, but not for primary business truth.
- The continuity workspace must hydrate from durable state before projection layers.

### Alternatives Considered
- filesystem JSON as the source of truth
- direct Stripe session history as the merchant state
- operator screens as authoritative data stores

### Consequences
- Generated views can be changed without altering authority.
- Any screen using a projection where durable authority already exists is considered read-model only.

### Status
Accepted

## 6. Canonical StaffordOS Layers

### 6A. Executive / Decision Layer

#### Decision
`/operator`, `/operator/cockpit`, `/operator/revenue-command`, `/operator/relationship/[id]`, `/briefing`, and `/director` constitute the Executive / Decision layer.

#### Rationale
- These surfaces help Ross decide what to do next.
- They aggregate priority, revenue, relationship context, and governance signals.

#### Alternatives Considered
- collapsing all decisioning into a single page
- using merchant-facing surfaces for executive decisions

#### Consequences
- Decision support remains distinct from execution and runtime handoff.
- Projection-heavy surfaces remain acceptable only as decision aids.

#### Status
Accepted

### 6B. Operations Layer

#### Decision
`/operator/command-center`, `/operator/leads`, `/operator/campaigns`, `/operator/system-map`, `/operator/execution-log`, `/operator/products`, `/operator/send-console`, and `/merchant` constitute the Operations layer.

#### Rationale
- These are the action and coordination surfaces Ross uses during the day.
- They bridge decisioning into work execution.

#### Alternatives Considered
- merging operations into the executive home
- splitting operations into customer-facing views

#### Consequences
- Operational screens remain specialized.
- Command center remains the primary work surface but not the only one.

#### Status
Accepted

### 6C. Runtime Layer

#### Decision
`/payment-return`, `/fix-status`, `/shopifixer/status` (legacy compatibility), and `GET /api/packets/:packetId` constitute the Runtime layer for merchant continuity.

#### Rationale
- These paths are tied to live customer state transitions.
- They are the authoritative post-payment runtime surfaces.

#### Alternatives Considered
- making `/shopifixer/status` the canonical payment-return destination
- introducing another customer-facing runtime route

#### Consequences
- `/fix-status` becomes the canonical merchant workspace shell.
- `/shopifixer/status` remains a legacy compatibility implementation unless formally retired.

#### Status
Accepted

## 7. Approved Customer Journey

### Decision
The approved customer journey is:

1. Merchant lands on `/shopifixer`
2. Merchant reviews `/pricing`
3. Merchant completes public checkout
4. Stripe success returns to `/payment-return`
5. `/payment-return` redirects to `/fix-status`
6. `/fix-status` shows the paid merchant workspace
7. Merchant proceeds through fulfillment, delivery, follow-up, and recurring-client progression

### Rationale
- This is the verified customer flow described in the runbook and pilot record.
- It preserves a single merchant continuity thread after payment.

### Alternatives Considered
- redirecting to `/shopifixer/status`
- sending the merchant back to a generic success page

### Consequences
- Merchant continuity remains centered on `/fix-status`.
- A paid merchant should never see a broken continuity state.

### Status
Accepted

## 8. Approved Operator Workflow

### Decision
The approved operator workflow is:

`/operator` → `/operator/command-center` → `/operator/leads` → `/operator/campaigns` → `/operator/cockpit` → `/operator/revenue-command` → `/run-audit` / `/audit-result` → `/shopifixer` / `/pricing` → `/payment-return` / `/fix-status` → `/operator/system-map` → `/operator/execution-log` → `/operator/relationship/[id]` → `/merchant` → `/briefing` → `/director` → end-of-day review in `/operator`

### Rationale
- This sequence is derived from the daily workflow and pilot runbook.
- It reflects the current state of the actual surfaces instead of an idealized future system.

### Alternatives Considered
- a shorter operator-only loop
- collapsing merchant and operator work into a single page

### Consequences
- Ross can operate in StaffordOS without inventing new routes.
- Some steps remain projection-heavy until Wave 1 items are completed.

### Status
Accepted

## 9. Approved Implementation Sequence

### Decision
Wave 1 implementation order is:

1. Continuity screen that never shows request-unavailable for paid packets
2. Unified operator home with live paid packet state
3. Merchant 360 with live packet authority
4. Operator-visible checkout linkage
5. End-of-day operator consolidation

### Rationale
- The continuity repair protects the first paying customer.
- The remaining items reduce operator friction and collapse the daily workflow into StaffordOS.

### Alternatives Considered
- building the operator home first
- adding new merchant screens before fixing continuity

### Consequences
- Customer continuity is stabilized before broader workspace consolidation.
- Later work can safely depend on the paid-packet shell.

### Status
Accepted

## 10. Legacy or Deprecated Components

### Decision
The following are designated as legacy or compatibility surfaces:
- `/shopifixer/status` as the legacy continuity implementation
- placeholder operator pages such as `/operator/capacity`, `/operator/analytics`, and `/ops/beta`
- legacy static dashboard artifacts where newer dashboard surfaces exist

### Rationale
- They either duplicate canonical continuity behavior or provide placeholder/demo content.
- They should not become the primary source of truth for the post-payment workspace.

### Alternatives Considered
- treating all current surfaces as equally authoritative
- deleting legacy surfaces immediately

### Consequences
- Legacy surfaces remain available only until compatibility is no longer needed.
- Placeholder surfaces are not candidates for the canonical Merchant Workspace.

### Status
Deprecated for primary use; retained for compatibility where necessary

## 11. Architecture Freeze

During Wave 1 implementation, the following architectural areas should not change unless a formal ADR supersedes this one:

- canonical operator entry point: `/operator`
- canonical merchant entry point: `/fix-status`
- payment-return route contract
- packet authority as the durable payment state source
- live packet hydration via `GET /api/packets/:packetId`
- the approved operator workflow order
- the approved customer journey order
- the canonical layering model:
  - Executive / Decision
  - Operations
  - Runtime
- the decision that `/shopifixer/status` is legacy compatibility rather than the active payment-return target
- the Wave 1 implementation order
- the merchant workspace shell concept centered on `/fix-status`

## 12. Final Decision

StaffordOS architecture is now frozen for Wave 1 around:
- `/operator` as the operator home
- `/fix-status` as the merchant workspace shell
- packet authority as the payment truth source
- the approved operator and customer journeys defined above

Any deviation from these decisions requires a new ADR.
