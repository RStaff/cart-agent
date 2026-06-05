# Fulfillment Engine Candidate Matrix v1

| Candidate | Authority owner? | Runtime orchestrator? | Packet builder? | Registry writer? | Dashboard reader? | Dead code candidate? | Supporting utility? | Not fulfillment engine? | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `staffordos/clients/next_action_engine_v1.mjs` | No | No proven live caller | No | Yes | No | Yes | Yes | Yes | Contains stage transitions, but is disconnected at runtime. |
| `staffordos/clients/close_engine_v1.mjs` | No | No proven live caller | No | Yes | No | Yes | Yes | Yes | Follow-up helper only. |
| `staffordos/clients/client_registry_v1.mjs` | No | No | No | Yes | Indirectly | No | Yes | Yes | Canonical client truth writer; not a fulfillment engine. |
| `staffordos/optimization/executionPacketGenerator.js` | No | No | Yes | No | No | No | Yes | Yes | Packet builder for execution packets. |
| `staffordos/optimization/executionPacketRepository.js` | No | No | No | Yes | No | No | Yes | Yes | Execution packet registry, not merchant fulfillment authority. |
| `staffordos/optimization/persistExecutionPacket.js` | No | No | Yes | No | No | No | Yes | Yes | Thin wrapper over execution packet creation. |
| `staffordos/optimization/packetTemplates.js` | No | No | No | No | No | No | Yes | Yes | Static templates only. |
| `staffordos/operator_daemon/*.mjs` | No | Partial | No | Some | Some | No | Yes | Yes | Active runtime helpers, but not proven fulfillment owners. |
| `staffordos/agents/*.mjs` | No | Partial | No | Some | Some | No | Yes | Yes | `system_truth_sync_agent_v1` is active for revenue truth, not fulfillment. |
| `staffordos/units/lock_schema_foundation_v1.mjs` | No | No | No | No | No | No | Yes | Yes | Delivery-unit model and proof gating, not runtime ownership. |
| `staffordos/packets/*.json` | No | No | No | No | No | No | Yes | Yes | Runtime data only. |
| CEO Cockpit / dashboard readers | No | No | No | No | Yes | No | No | Yes | Read surfaces only. |

