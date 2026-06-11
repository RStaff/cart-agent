# ShopiFixer Completion Refresh Audit

## Stale artifacts after completion
After the fulfillment truth is updated, the merchant lifecycle registry and any UI surfaces reading it become stale until refreshed:
- `staffordos/merchant_registry/merchant_lifecycle_registry_v1.json`
- `staffordos/merchant_registry/merchant_lifecycle_registry_v1.md`
- the ShopiFixer command-center readout in the operator UI

## Regeneration required
Only the merchant lifecycle registry needs regeneration.

## Command-center refresh required
The operator command-center surfaces that read the merchant lifecycle registry must refresh:
- `loadShopifixerCommandCenter.ts`
- `OperatorHomeV1.tsx`
- `/operator/command-center`

## Smallest automatic refresh chain
1. Completion writes the governed update to `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`.
2. The merchant lifecycle registry is regenerated from fulfillment truth.
3. The command center reloads and reads the refreshed registry.

## Safe trigger source
The best source-of-truth trigger is `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`.

## Can completion trigger registry rebuild safely?
Yes. The rebuild is safe if it is downstream of the fulfillment truth writeback and does not mutate client registry or revenue truth directly.

## Complexity
Small to medium. The data flow is already established; what is missing is automatic orchestration from completion writeback to registry regeneration and UI refresh.

## Readiness after refresh automation
94/100

## Final answer
- Stale artifacts: merchant lifecycle registry and the ShopiFixer command-center read model
- Refresh chain: fulfillment truth -> merchant lifecycle registry rebuild -> command-center reload
- Source-of-truth trigger: `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`
- Implementation complexity: small to medium
- Readiness score after refresh automation: 94/100
