# OFFER GENERATOR DRIFT FINDINGS

Date:
2026-06-08

Finding:
The legacy ShopiFixer offer is not only a stale generated artifact. It is produced by an active generator.

Active generator:
staffordos/clients/generate_shopifixer_offer_v1.mjs

Drift source:
The generator derives ShopiFixer one-time price from recovered revenue:

const fixPrice = recovered > 0 ? Math.max(99, Math.floor(recovered * 1.5)) : 149;

It also hardcodes:
const abandoPrice = 49;

Generated output:
staffordos/clients/shopifixer_offer_latest.json

Send path:
staffordos/clients/send_shopifixer_offer_v1.mjs

Risk:
This can regenerate and potentially send a stale $150 ShopiFixer offer even though the current public commercial model presents a $950 proof-backed ShopiFixer Fix Sprint.

Current canonical commercial direction:
- ShopiFixer Fix Sprint: $950 flat fee
- ShopiFixer sells diagnosis, scoped fix, before evidence, after evidence, and proof package
- Abando is a separate SaaS product, not simply the optional continuation path inside the legacy offer

Required future repair:
- Do not manually edit shopifixer_offer_latest.json as the primary repair
- Repair or retire generate_shopifixer_offer_v1.mjs
- Ensure offer generation reads a canonical pricing/product authority
- Ensure send_shopifixer_offer_v1.mjs cannot send stale offer artifacts
- Revalidate product boundary, pricing page, ShopiFixer checkout page, CEO cockpit, and fulfillment proof package after repair

Do not modify client registry, revenue truth, checkout, Stripe, lifecycle authority, or Abando flows as part of the first repair.
