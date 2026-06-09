# PRICE AUTHORITY CANDIDATES SUMMARY

Date:
2026-06-08

The full grep output was intentionally not committed because it was too large.

Key findings:

- Current public pricing path references $950 ShopiFixer Fix Sprint:
  - web/src/routes/pricing.esm.js
  - abando-frontend/app/shopifixer/page.tsx

- Active legacy offer generator still references dynamic/stale pricing:
  - staffordos/clients/generate_shopifixer_offer_v1.mjs

- Legacy generator formula:
  - recovered > 0 ? Math.max(99, Math.floor(recovered * 1.5)) : 149

- Generated stale offer artifact:
  - staffordos/clients/shopifixer_offer_latest.json

- Send path:
  - staffordos/clients/send_shopifixer_offer_v1.mjs

Conclusion:
Repair offer generator before sending any ShopiFixer offer.
