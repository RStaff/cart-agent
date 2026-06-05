# Next Action Engine Provenance Audit v1

## 1. Executive Summary

`staffordos/clients/next_action_engine_v1.mjs` was introduced as an explicit lifecycle decision engine, not as an incidental helper. Its commit history shows it was meant to derive next actions and lifecycle stage transitions from client truth, including `proposal_sent`, `deal_won`, and `fix_completed` branches. Later commits tightened its behavior around revenue proof precedence and added scoring / blocker metadata.

What the repository does **not** prove is equally important: no active runtime entrypoint currently invokes the file. The engine exists, contains transition logic, and is referenced by governance and operator-daemon binding artifacts, but it is not on the live invocation chain that now carries verified payment truth through revenue propagation. The file is therefore best classified as a **dormant intended authority**: it looks like the originally intended lifecycle transition owner, but it is currently disconnected from runtime execution.

## 2. Creation History

- **First appearance:** `95438db81c21b8b24daac781dad344eee9302e26`
- **Commit message:** `add StaffordOS next action engine v1`
- **Date:** `2026-05-03 18:58:23 -0400`
- **Initial shape:** standalone script with `run()` at the bottom, reading and writing `staffordos/clients/client_registry_v1.json`
- **Initial intent:** deterministically derive lifecycle stage and next action from client truth

The initial code already modeled a broad client progression ladder:

- `lead` -> outreach
- `audit_requested` -> audit
- `proposal_sent` -> close
- `payment_status === "paid" && fix_status === "not_started"` -> `deal_won`
- `fix_status === "completed"` -> `fix_completed`
- `abando_installed` / `revenue_active` transitions for downstream commercial flow

That means the file was not a narrow utility. It was created as a lifecycle/next-action engine from the start.

## 3. Commit History

### `95438db81c21b8b24daac781dad344eee9302e26`

- Introduced `staffordos/clients/next_action_engine_v1.mjs`
- Added deterministic lifecycle and next-action computation
- Wrote back to `client_registry_v1.json`

### `ca4e0e9e4ac85d27967679ec52ea69ec7a574671`

- Commit message: `fix next action engine revenue proof precedence`
- Reordered the `merchantRevenueRecovered > 0` branch ahead of other fallthrough behavior
- This shows the engine was still being treated as a meaningful decision surface after creation

### `7dd25287`

- Commit message: `add client priority scoring and blocker detection`
- Added scoring / blocker metadata to the engine
- Expanded the file from pure stage derivation into a more opinionated client decision engine

## 4. Reference Graph

### Active runtime references

| Reference | Classification | Why |
|---|---|---|
| `staffordos/revenue/revenue_agent_v1.mjs` | ACTIVE_RUNTIME_REFERENCE | Live payment propagation path currently invokes revenue propagation, not next-action execution |
| `staffordos/clients/client_registry_v1.json` | ACTIVE_RUNTIME_REFERENCE | The engine writes this file in code, but the live runtime chain that updates it today is elsewhere |
| `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs` | ACTIVE_RUNTIME_REFERENCE | Reads client truth downstream in the live commercial path |

### Architectural references

| Reference | Classification | Why |
|---|---|---|
| `staffordos/operator_daemon/write_router_decision_agent_binding_v1.mjs` | ARCHITECTURAL_REFERENCE | Names `next_action_engine_v1.mjs` as the `next_action_owner` in a binding manifest |
| `staffordos/operator_daemon/output/router_decision_agent_binding_v1.json` | ARCHITECTURAL_REFERENCE | Persisted binding manifest naming `next_action_engine_v1.mjs` as an intended owner |
| `staffordos/operator_daemon/output/neck_router_inventory_v1.json` | ARCHITECTURAL_REFERENCE | Inventory-level mention of the file as part of routing architecture |
| `staffordos/operator_daemon/output/system_brain_inventory_v1.json` | ARCHITECTURAL_REFERENCE | Inventory mention, not runtime proof |

### Historical references

| Reference | Classification | Why |
|---|---|---|
| `staffordos/governance/runtime_invocation_trace/runtime_invocation_trace_v1.md` | HISTORICAL_REFERENCE | Shows no proven live runtime invocation |
| `staffordos/governance/lifecycle_transition_verification/lifecycle_transition_verification_v1.md` | HISTORICAL_REFERENCE | Confirms code-level lifecycle writes but no live caller |
| `staffordos/governance/fulfillment_lifecycle_verification/fulfillment_lifecycle_verification_v1.md` | HISTORICAL_REFERENCE | Treats the engine as unproven for fulfillment execution |
| `staffordos/governance/fulfillment_authority_challenge_review/fulfillment_authority_challenge_review_v1.md` | HISTORICAL_REFERENCE | Challenges the idea that revenue propagation should own fulfillment; points back to this engine as the closer fit |

### Dead / disconnected references

| Reference | Classification | Why |
|---|---|---|
| `staffordos/clients/next_action_engine_v1.mjs` as a runtime target | DEAD_REFERENCE | No active runtime entrypoint invokes it |
| `staffordos/clients/close_engine_v1.mjs` | DEAD_REFERENCE | Same pattern: code exists, but no live caller was found |

## 5. Runtime References

The runtime traces established that the active commercial runtime currently reaches:

`web/src/index.js` -> `web/src/routes/stripeWebhook.esm.js` -> `staffordos/revenue/revenue_agent_v1.mjs` -> `staffordos/clients/client_registry_v1.mjs` -> `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs`

`next_action_engine_v1.mjs` is **not** part of that live chain.

The runtime invocation audit also showed:

- no active runtime entrypoint invoking `next_action_engine_v1.mjs`
- no proven invocation from `package.json`
- no proven invocation from the operator daemon runtime loop
- no proven invocation from the task/command resolver path

## 6. Authority References

No canonical authority document explicitly names `next_action_engine_v1.mjs` as the fulfilled live owner of the chain.

Authority documents and governance artifacts do, however, consistently support these facts:

- payment propagation is owned by `revenue_agent_v1.mjs`
- fulfillment remains unproven at runtime
- `next_action_engine_v1.mjs` is the closest code-level fulfillment transition candidate
- the canonical lifecycle includes stages that the engine already models in code

So the authority surface supports the file as an intended lifecycle decision engine, but not as a proven live fulfillment authority.

## 7. Architectural Intent

The file’s original design shows intent to own operational lifecycle transitions across the client record:

- stage derivation
- next action selection
- blocker detection
- client decision trace persistence
- write-back into the canonical client registry

That is more than a dashboard helper. It is a transition engine.

The later operator-daemon binding artifacts reinforce that intent by naming `next_action_engine_v1.mjs` as `next_action_owner`, even though the current runtime traces do not prove that binding is active.

## 8. Lifecycle Ownership Analysis

### What it was intended to own

- `proposal_sent` -> close / deal decision support
- `deal_won` derivation from paid client truth
- `fix_completed` derivation from completed fix truth
- next-action derivation for the client lifecycle

### What it actually owns today

- code-level lifecycle decision logic
- registry mutation logic
- decision trace persistence into the client registry

### What it does not own in runtime today

- live invocation
- live fulfillment orchestration
- proven execution of the `deal_won -> fix_in_progress -> fix_completed` boundary

## 9. Provenance Classification

**Final determination:** `DORMANT_INTENDED_AUTHORITY`

Reason:

- The file was explicitly introduced as the next action engine.
- Its code intentionally encodes lifecycle transitions and next actions.
- Later commits expanded and refined that role.
- The repository does **not** prove a live caller today.
- It is not replaced by a newer fulfillment engine; instead, it is disconnected from runtime while payment propagation moved elsewhere.

That makes it dormant, but not accidental.

## 10. Direct Answer: Was It Intended To Own Fulfillment?

**Yes, at the code / design level it appears intended to own the lifecycle transition side of fulfillment.**

It contains the transition logic that would drive `deal_won`, `fix_in_progress`, and `fix_completed`-adjacent decisions, and the initial commit introduced it as a next-action engine rather than a generic helper.

## 11. Direct Answer: Was It Ever Active?

**No proven live runtime activity was found.**

The file is active as code in the repository, but no current runtime entrypoint was found invoking it.

## 12. Direct Answer: What Happened To It?

It became **dormant and disconnected**.

The repository’s live commercial chain shifted to revenue propagation and dashboard truth updates, while this engine remained as a standalone registry-writer with lifecycle logic but no proven caller.

## 13. Explicit Warning If Ownership Remains Unclear

The repository still does not prove a live fulfillment authority. The presence of lifecycle logic in `next_action_engine_v1.mjs` is not enough to treat it as operational fulfillment ownership. Any further action should treat this as an intended authority that is currently disconnected, not as proven runtime truth.
