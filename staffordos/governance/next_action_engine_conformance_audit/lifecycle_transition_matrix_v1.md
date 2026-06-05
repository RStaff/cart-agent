# Lifecycle Transition Matrix v1

| Implemented transition / branch | Authority source | Classification |
| --- | --- | --- |
| Stage-preservation guard on red health | Operational guard only; no canonical lifecycle authority | BROKEN |
| `merchantRevenueRecovered > 0 -> revenue_active` | `upgrade_client_registry_operating_model_v1.mjs`, UI mapping only | PROVEN_UNAUTHORIZED |
| `stage === "lead" -> lead` | Canonical lifecycle + client promotion authority | PROVEN_AUTHORIZED |
| `auditStatus === "not_started" && stage !== "proof_client" -> audit_requested` | Client promotion + product routing + ShopiFixer audit authority, but exact label is implementation-level | PARTIALLY_DEFINED |
| `auditStatus === "completed" && paymentStatus !== "paid" -> proposal_sent` | Client promotion + product routing + ShopiFixer audit authority | PROVEN_AUTHORIZED |
| `paymentStatus === "paid" && fixStatus === "not_started" -> deal_won` | Payment authority + business-core done + client registry operating model | PROVEN_AUTHORIZED |
| `fixStatus === "completed" && !abandoInstalled -> fix_completed` | ShopiFixer fulfillment authority + operating model, exact label is implementation-level | PARTIALLY_DEFINED |
| `abandoInstalled && checkoutEvents === 0 -> abando_installed` | Product routing authority for Abando + client registry operating model | PARTIALLY_DEFINED |
| `abandoInstalled && checkoutEvents > 0 && recoveryActions === 0 -> abando_installed` | Product routing authority for Abando + client registry operating model | PARTIALLY_DEFINED |
| Fallback follow-up branch | No lifecycle authority; fallback action only | BROKEN |

## Missing Authority

The engine has no authority-backed branch for:

- `fix_in_progress`
- explicit `QA`
- explicit `proof package`
- explicit review/referral progression

