# ShopiFixer Operator Experience Audit

## Current Operator Experience

Ross sees the StaffordOS Command Center at `/operator/command-center`. The page shows the usual StaffordOS primary-action cockpit and now includes a read-only ShopiFixer panel with:

- merchant identity
- audit score
- top issue
- offer status
- send allowance
- payment status
- fulfillment status
- current stage
- next required action
- readiness score

## Operator Decision

Ross can tell whether the ShopiFixer opportunity is still only send-ready, whether it has moved into payment collection, and whether fulfillment is still waiting. The screen supports a decision about where the merchant sits in the lifecycle, but it does not itself execute the next step.

## Operator Action

The screen does not trigger payment or fulfillment. The practical action is to follow the displayed next required action, which is to collect a verified Stripe payment for the authorized $950 Fix Sprint, then let the runtime path move fulfillment truth forward.

## Missing Information

The command center still lacks:

- verified payment proof on the screen
- fulfillment start evidence
- before/after evidence
- proof package readiness
- completion evidence
- a direct operator action control for ShopiFixer

## Highest-Value Improvements

### UI

Add a dedicated ShopiFixer lifecycle lane with explicit state transitions and proof timeline, not just summary badges.

### Operations

Make the payment-to-fulfillment handoff visibly closed so the operator can see the conversion state without opening JSON files.

### Revenue

Turn the send-ready offer into a visible paid state and surface that transition immediately in the command center.

## Audit Summary

- Current operator maturity: `74/100`
- Biggest visibility gap: no proof timeline in one place
- Biggest revenue gap: paid conversion is not surfaced as a first-class command-center action
- Biggest operational gap: no operator action affordance on the ShopiFixer lane
- Next implementation: add a compact lifecycle lane to `/operator/command-center`
