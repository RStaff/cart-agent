# ShopiFixer Loader Boundary Audit v1

Verdict: REFACTOR_BEFORE_COMMIT

`loadShopifixerCommandCenter.ts` is no longer a pure UI adapter.

## What the loader does now

It still performs presentation mapping, but it also:

- selects the active merchant record
- applies ranking logic
- derives lifecycle booleans
- exposes provenance wrappers

That means the loader now contains read-model logic and lifecycle logic, not just UI adaptation.

## Derived logic found in the loader

### Read-model transformation

- `normalizeStage`
- `source_files / field_sources / registry_source`
- `overall.current_stage`
- `overall.next_required_action`
- `overall.readiness_score`
- `fallbackCommandCenter`

### Business logic

- `scoreRecord`
- `selectActiveRecord`

### Lifecycle logic

- `lifecycle.offer_generated`
- `lifecycle.offer_sent`
- `lifecycle.payment_received`
- `lifecycle.fulfillment_started`
- `lifecycle.proof_complete`
- `lifecycle.completed`

### Pure presentation mapping

These are safe to keep in the loader because they only reshape already-materialized fields into the UI’s expected object:

- `merchant.store`
- `merchant.client_id`
- `audit.score`
- `audit.top_issue`
- `audit.recommendation`
- `offer.offer_status`
- `offer.offer_price`
- `offer.send_allowed`
- `payment.payment_status`
- `payment.readiness`
- `fulfillment.fulfillment_status`
- `fulfillment.execution_status`
- `fulfillment.proof_status`

## What should move to the builder

The following logic belongs in `build_merchant_lifecycle_registry_v1.mjs`:

- `normalizeStage`
- `scoreRecord`
- `selectActiveRecord`
- all lifecycle boolean derivations

Those are model decisions, not UI decisions.

## Conclusion

The UI layer is acting as more than a loader. It is carrying selection and lifecycle behavior that should be upstream in the merchant lifecycle read model.

The safe state is:

- keep the loader as a presentation adapter only
- move active-record selection and lifecycle derivation into the registry builder or a dedicated read-model materializer

