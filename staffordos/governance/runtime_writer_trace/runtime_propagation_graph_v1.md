# Runtime Propagation Graph v1

## Proven lead/client summary propagation

`lead_registry_v1.json`
-> `promote_leads_to_clients_v1.mjs`
-> `client_registry_v1.json`
-> `build_operator_dashboard_snapshot_v1.mjs`
-> `operator_dashboard_snapshot_v1.json`
-> `ceo-snapshot API`
-> `Command Center`

This path is real and actively used.

## Proven packet/payment propagation

`ShopiFixer page`
-> `/__public-checkout`
-> `Stripe Checkout Session`
-> `stripeWebhook.esm.js`
-> `packets table`

This path is real and actively used.

## Missing bridge

There is no inspected runtime bridge from packet payment truth to:

- `client_registry_v1.json`
- `revenue_truth_v1.json`
- `operator_dashboard_snapshot_v1.json`
- `ceo-snapshot API`

## Exact terminal boundary

The verified Stripe payment event becomes terminal at the packet table write in `bindPacketPayment(...)`.
