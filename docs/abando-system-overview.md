# Abando System Overview

## Current system loop

```text
signals
→ signal_interpreter
→ candidate_opportunities
→ opportunity_scoring
→ slices
→ execution_packets
→ packet_validator
→ execution_gate
→ packet_executor
→ feedback_registry
→ system_state_snapshot
→ operator_brain
```

## What each layer does

- `signals`: stores normalized merchant signals
- `signal_interpreter`: turns raw signals into clearer friction meanings
- `candidate_opportunities`: converts interpreted meanings into product opportunities
- `opportunity_scoring`: ranks opportunities deterministically
- `slices`: breaks opportunities into the smallest shippable steps
- `execution_packets`: turns slices into implementation-ready contracts
- `packet_validator`: checks packet quality before execution
- `execution_gate`: decides whether a recommended action is allowed to proceed
- `packet_executor`: prepares execution prompts and execution records
- `feedback_registry`: captures implementation outcomes and lessons
- `system_state_snapshot`: aggregates the current system state into one read model
- `operator_brain`: recommends the next best operator action from the latest state

## Shared side-input rule

`system_state_snapshot` is not just another linear stage.

It acts as a shared side-input to the decision layers when needed, especially:
- `signal_interpreter`
- `operator_brain`
- `execution_gate`
- `packet_validator`

This keeps state inspection explicit and avoids hidden decision state.
