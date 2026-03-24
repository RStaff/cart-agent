# Checkout Benchmark Intelligence Demo

## What this demo shows

This demo shows that Abando can turn merchant checkout signals into one actionable benchmark report.

The report answers:
- how the merchant is doing right now
- how similar stores appear to do
- what the top likely checkout friction is
- what the first fix to test should be

## Demo endpoints

Primary demo endpoint:

```bash
curl -s http://localhost:8081/api/checkout-benchmark/demo
```

Direct merchant endpoint:

```bash
curl -s http://localhost:8081/api/checkout-benchmark/demo-merchant
```

Generate and persist a fresh demo report:

```bash
curl -s -X POST http://localhost:8081/api/checkout-benchmark/run \
  -H 'Content-Type: application/json' \
  -d '{"merchant_id":"demo-merchant"}'
```

## Sample response

```json
{
  "merchant_id": "demo-merchant",
  "checkout_abandonment_rate": 0.267,
  "peer_checkout_abandonment_rate": 0.215,
  "mobile_checkout_completion_rate": 0.63,
  "peer_mobile_checkout_completion_rate": 0.66,
  "top_likely_friction": "mobile_checkout_friction",
  "recommended_first_fix": "Simplify mobile checkout steps and reduce mobile form friction first.",
  "why_this_recommendation": [
    "checkout abandonment is above the current peer baseline",
    "interpreted signals rank mobile friction highest",
    "mobile completion is lagging enough to justify a mobile-first fix"
  ],
  "recommended_next_action": "Simplify the mobile checkout flow before testing broader checkout changes.",
  "confidence": "medium"
}
```

## What is real vs heuristic in the current demo

Real in v1:
- merchant-side benchmark values are derived from available merchant checkout signals
- top likely friction comes from interpreted signals
- recommended fix is a deterministic mapping from the top interpreted friction

Heuristic in v1:
- peer comparison falls back to category baselines when peer signal coverage is incomplete
- the demo merchant itself is seeded inside the benchmark module so the endpoint always returns a complete example

The API makes this explicit through `field_sources`.
