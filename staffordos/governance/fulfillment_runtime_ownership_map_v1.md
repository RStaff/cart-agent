# Fulfillment Runtime Ownership Map v1

## Runtime and Intent Map

### Intended fulfillment transition owner

- `staffordos/clients/next_action_engine_v1.mjs`
- Role: derives lifecycle stage and next action from client truth
- Intended transitions:
  - `deal_won -> fix_in_progress`
  - `fix_in_progress -> fix_completed`
- Status: intended, now runnable, but not yet a proven complete fulfillment owner

### Runtime execution stack

- `staffordos/operator_daemon/task_command_resolver_v1.mjs`
  - resolves `next_action_execution`
- `staffordos/operator_daemon/run_task_with_commit_gate_v1.sh`
  - gated launcher
- `staffordos/execution/run_agent_loop.mjs`
  - execution harness
- `staffordos/clients/next_action_engine_v1.mjs`
  - target engine

### Proven commercial propagation stack

- `staffordos/revenue/revenue_agent_v1.mjs`
- `staffordos/clients/client_registry_v1.mjs`
- `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs`
- CEO cockpit readers

This stack is proven for payment / revenue / dashboard propagation, but not for full fulfillment completion.

### Fulfillment artifacts and packet plumbing

- `web/src/routes/packetAuthority.esm.js`
- `web/src/lib/packetRepository.js`
- `staffordos/authority/output/shopifixer_fulfillment_authority_v1.md`
- `staffordos/authority/output/shopifixer_fulfillment_packet_template_v1.md`

These define and mutate packet truth, but they are not yet a proven full ShopiFixer fulfillment orchestrator.

### Proof / review / referral

- Proof package requirements are authority-defined.
- Review/referral requirements are authority-defined.
- No runtime writer is proven for:
  - proof-package generation
  - QA approval
  - review-request generation
  - referral-request generation

### Dead / non-owner components

- `staffordos/clients/close_engine_v1.mjs`
  - follow-up intelligence only; not fulfillment authority

### Final governance answer

- **Who owns fulfillment?**
  - Intended owner: `staffordos/clients/next_action_engine_v1.mjs`
  - Proven live owner: none yet

- **What writes `fix_in_progress`?**
  - `staffordos/clients/next_action_engine_v1.mjs`

- **What writes `fix_completed`?**
  - `staffordos/clients/next_action_engine_v1.mjs`

- **What generates proof?**
  - No proven ShopiFixer runtime owner; closest concrete generator is `staffordos/proof_loop/merchant_proof_loop_completion_pack_v1.js`, but it is not ShopiFixer-proven

- **What triggers review/referral?**
  - Authority only; no runtime-proven writer yet

- **Is there already an intended orchestrator?**
  - Yes: the `next_action_execution` path into `next_action_engine_v1.mjs`

- **Single next implementation justified by governance**
  - Connect the paid-client handoff so `next_action_engine_v1.mjs` can drive `fix_in_progress` and the fulfillment packet/proof chain from the existing gated execution path.
