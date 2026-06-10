# ShopiFixer Offer Outcome Authority V1

## Current Outcome State

`offer_sent`

The current observable state is a sent offer with proof in the active client record and the action unit.

## Allowed Next States

- `offer_opened`
- `offer_replied`
- `offer_declined`
- `offer_expired`
- `offer_paid`
- `offer_converted`

## Outcome States

### `offer_generated`

- Status: observed
- Authority source: generated offer file plus send authority
- Required evidence: the merchant-facing offer exists, the sections are populated, and the merchant identity matches the active client
- Downstream action: authorize send
- Next owner: `staffordos/clients/send_shopifixer_offer_v1.mjs`

### `offer_sent`

- Status: observed
- Authority source: client registry note, action unit proof status, and send authority
- Required evidence: the active client record contains an `offer_sent` proof note and the action unit records `offer_sent_logged`
- Downstream action: wait for open, reply, decline, expiry, or payment
- Next owner: merchant

### `offer_opened`

- Status: not observed
- Required evidence: open-tracking event tied to the same merchant
- Downstream action: follow up or wait for engagement
- Next owner: merchant

### `offer_replied`

- Status: not observed
- Required evidence: inbound reply tied to the sent offer
- Downstream action: route the response toward close, decline, or payment
- Next owner: StaffordOS operator

### `offer_declined`

- Status: not observed
- Required evidence: explicit merchant decline
- Downstream action: close or retain for future follow-up
- Next owner: StaffordOS operator

### `offer_expired`

- Status: not observed
- Required evidence: time-based expiry without conversion
- Downstream action: send follow-up or mark stale
- Next owner: StaffordOS operator

### `offer_paid`

- Status: not observed
- Required evidence: verified paid deal truth for the same merchant
- Downstream action: activate fulfillment truth
- Next owner: StaffordOS fulfillment operator

### `offer_converted`

- Status: not observed
- Required evidence: verified payment plus fulfillment truth readiness for the same merchant
- Downstream action: start or continue proof-backed fulfillment
- Next owner: StaffordOS fulfillment operator

## Conversion Definition

A ShopiFixer offer converts when the authorized offer is accepted and verified payment exists for the same merchant, with the fulfillment truth model ready to enter or already in the paid delivery loop.

## Payment Definition

A payment event exists when client registry truth records a verified paid ShopiFixer deal for the same merchant, with payment status, amount, and closure evidence available.

## Fulfillment Start Definition

Fulfillment starts when the ShopiFixer fulfillment truth item for the same merchant becomes `payment_received` with `execution_status = not_started`, `proof_status = not_started`, and `completion_status = not_started`.

## Sources

- `staffordos/shopifixer/shopifixer_send_authority_v1.json`
- `staffordos/clients/client_registry_v1.json`
- `staffordos/units/opportunity_units_v1.json`
- `staffordos/units/action_units_v1.json`
- `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`

## Unavailable Evidence

No evidence is present in the current read set for opened, replied, declined, expired, paid, or converted states.
