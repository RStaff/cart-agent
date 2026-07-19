# STAFFORDOS_CANONICAL_CONTINUITY_ROUTE_AUDIT_V1

Scope: repository audit only. No code changes.

## Executive answer

- **Canonical post-payment continuity route in the active payment flow:** `/fix-status`
- **Legacy continuity implementation still present in this repository:** `/shopifixer/status`
- **Durable source of truth for packet state:** `/api/packets/:packetId`

The repository currently contains a split between:
1. the active payment-return handoff target (`/fix-status`), and
2. the older continuity screen implementation (`/shopifixer/status`).

## 1. Code references

### `/fix-status`

| File | Line | Purpose | Inbound caller | Outbound navigation |
|---|---:|---|---|---|
| `web/src/routes/packetAuthority.esm.js` | 99 | `payment-return` redirect target | `/payment-return` route after payment binding | Redirects to `/fix-status` with `packet_id`, `session_id`, `store`, and optional `reservation_id` |

Notes:
- No Next page or route handler named `/fix-status` exists in this repository.
- The only live reference in code is the redirect target from `payment-return`.

### `/shopifixer/status`

| File | Line | Purpose | Inbound caller | Outbound navigation |
|---|---:|---|---|---|
| `abando-frontend/app/shopifixer/status/page.tsx` | 110-129 | Reads live packet authority via `GET /api/packets/:packet_id` | Direct browser navigation, legacy continuity links, or any caller still pointing at the route | Read-only page; no redirect |
| `abando-frontend/app/shopifixer/status/page.tsx` | 137-149 | Loads local StaffordOS continuity projections | Same as above | Read-only page |
| `abando-frontend/app/shopifixer/status/page.tsx` | 182-276 | Derives and renders continuity state | Same as above | No outbound route change |

Key behavior:
- The page reads `packet_id`, `session_id`, `store`, and `reservation_id`.
- It hydrates the packet from `GET /api/packets/:packet_id`.
- It then combines packet, lifecycle, fulfillment, and revenue projections to render continuity state.

### `/payment-return`

| File | Line | Purpose | Inbound caller | Outbound navigation |
|---|---:|---|---|---|
| `web/src/routes/packetAuthority.esm.js` | 74-107 | Binds packet payment and redirects after payment | Public checkout return URL from Stripe session success | Redirects to `/fix-status` |
| `web/src/checkout-public.js` | 5-14 | Defines the canonical checkout success URL used by public checkout | Stripe Checkout session creation | Points success URL at `/payment-return` by default |
| `web/src/checkout-public.js` | 44-45 | Materializes the chosen return URL | Public checkout endpoint | Uses the canonical return URL |
| `web/src/checkout-public.js` | 70-107 | Creates checkout session, packet, and payment reference | `/__public-checkout` | Checkout session success URL returns to `/payment-return` |

### `lookupPacket`

- **No exact `lookupPacket` symbol was found anywhere in this repository.**
- The equivalent live packet fetch in the continuity page is `readPacket(...)` at `abando-frontend/app/shopifixer/status/page.tsx:110-129`.

### `GET /api/packets`

| File | Line | Purpose | Inbound caller | Outbound navigation |
|---|---:|---|---|---|
| `web/src/routes/packetAuthority.esm.js` | 45-49 | Live packet read API | Continuity pages and operator tooling | Returns packet JSON |
| `abando-frontend/app/shopifixer/status/page.tsx` | 120-125 | Calls live packet API for packet hydration | `/shopifixer/status` page | Consumes packet JSON |

## 2. Planning-document references

These documents still refer to the split route model:

- `STAFFORDOS_OPERATOR_SURFACE_INVENTORY_V1.md:39` — `/shopifixer/status` listed as merchant post-payment continuity view.
- `STAFFORDOS_OPERATOR_SURFACE_INVENTORY_V1.md:83` — `/payment-return` listed as live redirect route.
- `STAFFORDOS_OPERATOR_DAILY_WORKFLOW_V1.md:109` — workflow still names `/payment-return` then `/shopifixer/status`.
- `STAFFORDOS_OPERATOR_DAILY_WORKFLOW_V1.md:255-256` — `/shopifixer/status` described as merchant continuity surface; `/payment-return` as handoff route.
- `STAFFORDOS_WAVE1_EXECUTION_PLAN_V1.md:14-19` — Sprint 1 explicitly centers `/shopifixer/status` and `GET /api/packets/:packet_id`.
- `SHOPIFIXER_FIRST_CUSTOMER_OPERATIONS_RUNBOOK_V1.md:22-35` — operational target is `/fix-status`, with `Request unavailable` as a failure condition.
- `SHOPIFIXER_PRODUCTION_PILOT_DECISION_RECORD_V1.md:25, 80-90` — approved pilot references `/payment-return` -> `/fix-status`.

## 3. Canonicality answers

### 1) Which continuity route is actually canonical?

**Operationally canonical:** `/fix-status`

Reason:
- the active payment-return handler redirects there (`web/src/routes/packetAuthority.esm.js:99-107`)
- the production pilot and runbook both treat `/fix-status` as the required post-payment surface

### 2) Is `/shopifixer/status` still reachable by any production path?

**Yes, but not through the current payment-return path.**

It remains reachable by:
- direct browser navigation
- any legacy link that still points to it
- the route implementation in this repository

It is **not** the current redirect target from `/payment-return`.

### 3) Can it be removed?

**Not safely yet.**

Why:
- it still exists as a live route implementation in this repository
- the workflow/inventory documents still refer to it
- removing it without a compatibility step would strand any legacy callers

### 4) Should it redirect to `/fix-status`?

**Yes.**

If `/shopifixer/status` remains present for compatibility, it should become a thin redirect or alias to `/fix-status`.

### 5) Is there duplicated continuity logic?

**Yes.**

Duplicated logic exists at two levels:
- route contract level: `/shopifixer/status` legacy continuity screen vs `/fix-status` payment-return target
- data-hydration level: packet API plus local StaffordOS projections are both used to derive merchant continuity state

### 6) Which page should become the single source of truth?

**`/fix-status` should be the single customer-facing continuity page after payment.**

Durable truth underneath it should still come from:
- `GET /api/packets/:packetId`

`/shopifixer/status` should be treated as legacy compatibility unless and until it is explicitly retired.

## 4. Route ownership summary

| Route | Current status in this repository | Canonical role |
|---|---|---|
| `/fix-status` | Redirect target only; no route implementation found | Canonical post-payment handoff target |
| `/shopifixer/status` | Implemented continuity page | Legacy continuity implementation / compatibility surface |
| `/payment-return` | Implemented packet payment binding + redirect | Canonical handoff route from payment completion |
| `/api/packets/:packetId` | Implemented packet authority read API | Durable data authority for continuity |

## 5. Bottom line

The repo still contains two continuity concepts:
- the older implemented page at `/shopifixer/status`
- the newer canonical handoff target `/fix-status`

The active payment flow has moved to `/fix-status`. The durable authority remains packet API + packet repository. The legacy continuity page is still present and reachable, but it is no longer the payment-return destination.
