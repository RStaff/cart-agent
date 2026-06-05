# Runtime Owner Ranking v1

## Rank 1

`staffordos/revenue/revenue_agent_v1.mjs`

- authority support: strongest active commercial authority
- runtime evidence: live webhook path and runtime sync path invoke it
- ownership fit: best existing runtime fit for initiating fulfillment handoff
- governance risk: medium
- implementation risk: medium

## Rank 2

`staffordos/operator_daemon/persistent_operator_v1.mjs`

- authority support: strong operator-control authority
- runtime evidence: recent heartbeat proves execution
- ownership fit: top-level orchestrator, but too generic for fulfillment ownership
- governance risk: medium-high
- implementation risk: medium

## Rank 3

`staffordos/agents/system_truth_sync_agent_v1.mjs`

- authority support: runtime truth maintenance
- runtime evidence: invoked by persistent operator; invokes revenue_agent_v1
- ownership fit: indirect bridge, not fulfillment authority
- governance risk: medium
- implementation risk: medium

