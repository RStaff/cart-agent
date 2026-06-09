# SOURCE TRUTH MISMATCH

Date:
2026-06-08

Context:
The internal ShopiFixer dry-run proof package exposed a mismatch between older offer artifacts and the newer ShopiFixer commercial model.

Observed older offer artifact:
staffordos/clients/shopifixer_offer_latest.json

Older offer says:
- One-time fix: $150
- Optional Abando: $49/month
- Recovered revenue: $100
- Framing: fix plus continuous recovery

Current strategic direction:
- ShopiFixer is a proof-backed Fix Sprint
- Current canonical public offer has moved toward $950
- Abando is a separate SaaS product, not merely an optional add-on
- The product being sold is not just an audit or basic fix; it is diagnosis, scoped fix, before evidence, after evidence, and merchant-facing proof package

Risk:
If old $150 offer artifacts remain active, StaffordOS may recommend, send, or reason from stale pricing and stale product framing.

Required future resolution:
- Identify canonical ShopiFixer price authority
- Retire or mark stale the older $150 offer artifact
- Ensure offer generation, pricing page, checkout, CEO cockpit, and fulfillment proof all reference the same commercial truth
- Keep Abando as a separate SaaS product that may also be offered after ShopiFixer, not as the only continuation path

Do not resolve this by editing revenue truth or client registry manually.
