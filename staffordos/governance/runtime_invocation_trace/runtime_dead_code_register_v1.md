# Runtime Dead Code Register v1

## Dead Code Candidates

### 1. `staffordos/clients/next_action_engine_v1.mjs`

- **Why it is a candidate:** It contains live mutation logic for fulfillment lifecycle transitions, including `proposal_sent -> deal_won`, `deal_won -> fix_in_progress`, and `fix_in_progress -> fix_completed`.
- **Why it is dead in runtime terms:** No active runtime entrypoint invokes it.
- **Related governance evidence:** runtime invocation trace, fulfillment lifecycle verification, lifecycle transition verification.
- **Risk if kept:** The repository can claim fulfillment automation in code while the live runtime never executes it.
- **Risk if deleted:** Useful logic and audit history would be lost.
- **Should ever be promoted to truth:** Only if a live caller is proven and the engine is wired into an active runtime path.

### 2. `staffordos/clients/close_engine_v1.mjs`

- **Why it is a candidate:** It mutates the registry for follow-up readiness from proposal state.
- **Why it is dead in runtime terms:** No active runtime entrypoint invokes it.
- **Related governance evidence:** runtime invocation trace, client registry audit, lifecycle audit artifacts.
- **Risk if kept:** A parallel, unexecuted close path can confuse lifecycle ownership.
- **Risk if deleted:** Historical decision logic would be lost.
- **Should ever be promoted to truth:** Only if a live runtime caller is proven.

## Manual-Only Entrypoints

- `staffordos/clients/promote_leads_to_clients_v1.mjs`
  - Standalone CLI/script.
  - No active runtime caller was found.
  - Useful as an operator tool, but not proven live automation.

## Not Dead

- `staffordos/revenue/revenue_agent_v1.mjs`
  - Actively invoked by the verified webhook path and the runtime sync agent.
- `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs`
  - Actively invoked by `revenue_agent_v1.mjs`.

## Conclusion

The live runtime reaches revenue propagation and dashboard rebuilds. It does not reach the fulfillment engines. The fulfillment automation gap remains the highest-risk invocation gap.

