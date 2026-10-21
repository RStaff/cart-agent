# Clipping evaluation pilot — first working slice

Status: local scenario engine only. No live campaign, clip generation, publishing,
credentials, payment processing or production integration is implemented.
No dependency installation required; Node 20+ is sufficient.

## Run

```bash
node --test clipping-engine/evaluate.test.mjs
node clipping-engine/cli.mjs clipping-engine/example.assumptions.json
node clipping-engine/server.mjs clipping-engine/example.assumptions.json
```

Read `http://127.0.0.1:8789/v1/evaluation`; health is `/health`.
The server binds localhost only. Do not expose it publicly; deploy behind an
authenticated operator boundary before adding real campaign records.
Stop with Ctrl+C. There are no automatic external actions.

Copy the example to an untracked local input file and replace assumptions.
Do not commit real campaign/private account data. The sample is hypothetical:
`eligible` is an input assumption, not campaign approval. Low/base/high views
are user-entered payable views during `earningWindowDays`, not model predictions.
The service has no persistence or writes and reads only its startup-specified file.

## Money model

Compute gross payout per clip; apply the minimum and cap; consume a shared budget
in base-contribution-per-minute order; subtract fees and direct costs. Subtract
the subscription once for the batch. Unknown/ineligible clips contribute zero.
The shared budget is hypothetical available capacity, not reserved funds;
other participants can consume it first. All eligible clips are assumed accepted.
Rejection can reduce payout to zero. Reported money amounts are rounded down to
cents; actual provider accounting may differ. Display `mode` and warnings with
every result. `actualReceivedRevenueUsd` stays null; never turn scenarios into
real revenue states. The scoring is conditional, not a probability model.

## StaffordOS integration boundary

Follow `staffordos/SYSTEM_RULES.md`: product calculation lives here; StaffordOS
consumes the read-only JSON API through a server-side adapter. Do not import
the calculation engine or access a product database from the operator UI.
The adapter needs timeout/unavailable handling, schema validation, authentication
and a conspicuous scenario label. No operator UI integration is included in this slice.

## Build and launch gates

1. Inspect full campaign terms, authorized assets, eligible social account and
   payout setup. Test a source in the editor before buying a monthly plan.
2. Produce five clips using the editor; record pre-publication rankings, source
   timecodes, version checksums, review decisions and submission timestamps.
3. Add persistent campaign, clip/version, publication/submission, metric and payment
   records in the execution service. Add explicit consent and duplicate prevention.
4. Add an authenticated read-only StaffordOS summary adapter and review display.
   Approval/publishing writes need a separately reviewed API contract.
5. Verify OpusClip account API entitlement before implementing its adapter. Use
   the web editor if access is unavailable; do not block the first paid test.
6. Track actual verified views, settlements and received withdrawals separately.
   Expand only after positive actual earnings/hour, not the example output.

Proposed dates: eligibility Oct 3–4; first five clips Oct 5–7; persistent workflow
and editor adapter Oct 8–12 if access is available; accounting Oct 13–18.
First bank payment Oct 19–26 is conditional on approval, qualifying views and
processing. It is not guaranteed by deployment.

Budget: at most $30 initial editor spend including applicable tax; monthly billing.
No extra hosting, scheduler or AI API purchase for the pilot. Development time,
existing subscriptions and compute costs are separate. Use existing supported
publishing tools; do not build a private TikTok uploader.

## Acceptance and evaluation

Tests cover minimums/caps, shared budgets, fees, one subscription charge, ranking,
unknown eligibility, malformed inputs, read-only HTTP behavior and unavailable
data. Validate forecasts on future batches; retain failures and rejections.
Avoid training on outcomes that occurred after the prediction timestamp.
No clip-selection accuracy or financial return has been demonstrated yet.
