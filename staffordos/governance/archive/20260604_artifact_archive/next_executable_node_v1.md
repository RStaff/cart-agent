# Next Executable Node v1

Generated: 2026-06-03

## One Node

Packet Lifecycle -> Client Registry -> CEO Cockpit binding.

## Answer

If Ross completes only one thing next, it should be the read-only packet lifecycle binding into the existing CEO Cockpit and Client Registry.

## Definition

Use existing packet authority and packet repository state to make the CEO Cockpit show, for each merchant or store:

- packet_id
- store_domain
- payment_reference
- payment status
- execution_status
- proof_status
- completion_status
- nearest Client Registry record
- next required operator action from existing status fields

This is not a new dashboard, state machine, scoring model, LLM router, or fulfillment framework. It is convergence of existing truth into the canonical UI.

## Why This Is The Highest-Leverage Unfinished Node

StaffordOS UI cannot run the business if it cannot see paid packet state.

Current repository truth already has:

- acquisition and lead state
- audit artifacts
- ShopiFixer offer definition
- Stripe checkout creation
- webhook payment authority
- packet lifecycle fields
- client registry
- fulfillment authority
- proof register
- CEO Cockpit sections

The break is that packet/payment/proof lifecycle state is not visible in the cockpit or bound to the Client Registry. That single break prevents StaffordOS UI from operating payment, fulfillment, proof, and revenue.

## Why It Outranks No Kings Work

No Kings work proves ShopiFixer can deliver a service. That matters, but it does not by itself make StaffordOS UI run the business.

If No Kings implementation is completed first while packet/client/proof state remains outside the cockpit, the output is still another proof artifact requiring manual reconciliation. The business still cannot be operated cleanly from StaffordOS UI.

The packet lifecycle binding makes every future No Kings or paid merchant execution visible and governable through the cockpit.

## Why It Outranks UI Work

The UI shell already exists.

The CEO Cockpit already has sections for:

- next best action
- revenue
- acquisition
- conversion
- fulfillment
- proof
- review/referral
- executive control

The unfinished work is not another UI page or redesign. It is the missing source binding for packet/payment/proof lifecycle truth.

## Why It Outranks LLM Router Work

The next decision does not require natural-language reasoning.

The packet record already has deterministic fields:

- `status`
- `execution_status`
- `proof_status`
- `completion_status`

The Client Registry already has lifecycle and payment fields. A deterministic adapter can expose the business state without a router.

## Why It Outranks Ollama Work

Ollama cannot create payment proof, packet visibility, fulfillment state, or client lifecycle reconciliation.

The blocker is not model availability. The blocker is that existing business state is not visible in the canonical operating UI.

## Exact Technical Steps

1. Keep `web/src/routes/packetAuthority.esm.js` and `web/src/lib/packetRepository.js` as packet authority.
2. Add a read-only packet summary source to `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts`.
3. Source packet data from the existing packet authority/API or existing repository function, depending on runtime environment availability.
4. Join packet `store_domain` to Client Registry `merchant_shop`, `shop`, or `domain`.
5. Add cockpit summary fields:
   - `payment_pending_packets`
   - `payment_received_packets`
   - `execution_not_started`
   - `execution_in_progress`
   - `proof_not_started`
   - `completion_not_started`
   - latest packet records
6. Preserve existing cockpit layout and section structure.
7. Report missing packet source as `partial`, not fabricated zero-state.
8. Do not mark revenue/proof as complete until `payment_received`, fulfillment, QA, and proof package evidence exist.

## Completion Standard

This node is complete when Ross can open the CEO Cockpit and answer:

- Which merchants have payment pending?
- Which merchants have payment received?
- Which paid packets need fulfillment?
- Which packets need proof?
- Which packets are complete?
- Which Client Registry record owns the packet?

without terminal archaeology.
