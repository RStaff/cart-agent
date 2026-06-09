You are working in:

/Users/rossstafford/projects/cart-agent

MISSION

Repair ShopiFixer offer pricing authority drift.

AUTHORITY / CONTEXT

Use:

- staffordos/proof_runs/internal_shopifixer_dry_run_v1/source_truth_mismatch.md
- staffordos/proof_runs/internal_shopifixer_dry_run_v1/offer_generator_drift_findings.md
- web/src/routes/pricing.esm.js
- abando-frontend/app/shopifixer/page.tsx
- staffordos/operator_daemon/output/product_boundary_validator_v1.json
- staffordos/operator_daemon/write_product_boundary_validator_v1.mjs
- staffordos/revenue_authority/revenue_flow_logic_validator_v1.mjs

PROBLEM

The current public/commercial model is:

- ShopiFixer Fix Sprint: $950 flat fee
- ShopiFixer is a proof-backed fix sprint
- Abando is a separate SaaS product

But the active generator:

- staffordos/clients/generate_shopifixer_offer_v1.mjs

still produces a legacy offer derived from recovered revenue:

const fixPrice = recovered > 0 ? Math.max(99, Math.floor(recovered * 1.5)) : 149;

and emits:

- $150-ish ShopiFixer one-time fix
- $49/month Abando add-on

OBJECTIVE

Implement the smallest governance-safe repair so the generator cannot produce stale $150 ShopiFixer offers.

DO NOT MODIFY

- client_registry_v1.json
- lead_registry_v1.json
- revenue_truth_v1.json
- checkout
- Stripe
- Abando install/dashboard/merchant flows
- lifecycle authority
- CEO cockpit

TASK

1. Inspect current pricing references.
2. Identify the smallest source-of-truth repair.
3. Patch staffordos/clients/generate_shopifixer_offer_v1.mjs so:
   - ShopiFixer one-time price is $950
   - generated language frames ShopiFixer as a proof-backed Fix Sprint
   - Abando is described as a separate optional SaaS product, not bundled continuation logic
   - recovered revenue is treated as context/proof only, not as a pricing formula
4. Regenerate staffordos/clients/shopifixer_offer_latest.json.
5. Do not send the offer.
6. Do not modify send_shopifixer_offer_v1.mjs unless required to prevent stale sends; if changed, explain why.

VALIDATION

Run:

node staffordos/clients/generate_shopifixer_offer_v1.mjs

jq . staffordos/clients/shopifixer_offer_latest.json >/dev/null

grep -Rni "\$150\|149\|Math.max(99\|recovered \* 1.5" \
  staffordos/clients/generate_shopifixer_offer_v1.mjs \
  staffordos/clients/shopifixer_offer_latest.json

grep -Rni "\$950\|Fix Sprint\|proof-backed" \
  staffordos/clients/generate_shopifixer_offer_v1.mjs \
  staffordos/clients/shopifixer_offer_latest.json

git diff --stat

git status --short

FINAL RESPONSE

Report:

- files changed
- whether stale price formula was removed
- generated price
- whether Abando was preserved as separate SaaS
- whether any business truth files were modified
- do not commit
