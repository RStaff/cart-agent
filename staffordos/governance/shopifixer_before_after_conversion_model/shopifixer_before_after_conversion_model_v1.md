# ShopiFixer Before/After Conversion Model V1

## Verdict
The current codebase supports a **partial** before/after conversion UX, not a fully authoritative one.

It already has:
- a public audit flow that identifies likely checkout friction
- a scorecard flow that frames revenue opportunity and issue selection
- a ShopiFixer offer page that explains the fix sprint and claims before/after proof
- a pricing page that presents the $950 Fix Sprint as the canonical offer
- runtime truth that shows merchant value recovered, client state, and operator next actions

It does **not** yet have:
- a real, governed audit-result artifact in the repo
- a ShopiFixer-specific before/after proof package artifact
- a single authoritative after-state surface that proves the sprint outcome end to end

The biggest structural gap is that the audit-result and audit-status routes point at `staffordos/audit/audit_result_surface.json`, but that file does not exist in this checkout.

## What the current flow already supports

### 1. What is broken
Supported today:
- `abando-frontend/app/run-audit/page.tsx`
- `abando-frontend/app/scorecard/[domain]/page.tsx`
- `abando-frontend/app/audit-result/page.tsx`
- `abando-frontend/app/api/audit/status/route.ts`

Existing before-state language:
- checkout friction
- trust / clarity / mobile experience
- revenue opportunity at risk
- a highest-confidence issue

Runtime-backed before-state data:
- `staffordos/clients/client_registry_v1.json`
  - `shopifixer.audit_status = not_started`
  - `shopifixer.fix_status = not_started`
  - `deal.payment_status = not_billable`
- `staffordos/snapshots/unit_work_snapshot_v1.json`
  - `stage = proposal_sent`
  - `stage = waiting_for_payment`
- `staffordos/cockpit/ceo_truth_snapshot_v1.json`
  - `merchant_revenue_recovered = 100`
  - `stafford_revenue = 0`

### 2. What it may be costing them
Supported today:
- `abando-frontend/app/scorecard/[domain]/page.tsx`
- `abando-frontend/app/audit-result/page.tsx`
- `web/src/routes/pricing.esm.js`
- `abando-frontend/app/shopifixer/page.tsx`

Existing cost framing:
- `revenueOpportunityDisplay`
- `estimated_revenue_leak`
- `merchant revenue recovered` vs `stafford revenue`
- `checkout friction` / `mobile UX friction`

Runtime-backed cost data:
- `staffordos/cockpit/ceo_truth_snapshot_v1.json`
  - `merchant_revenue_recovered = 100`
  - `stafford_revenue = 0`
  - `current_bottleneck = lead_supply_or_contact_quality`

### 3. What ShopiFixer will fix
Supported today:
- `abando-frontend/app/shopifixer/page.tsx`
- `web/src/routes/pricing.esm.js`
- `abando-frontend/app/run-audit/page.tsx`

Existing fix framing:
- fix the visible conversion issue
- implement the correction directly in the store
- scoped fix sprint
- proof-driven delivery

Runtime-backed fix intent:
- `staffordos/clients/client_registry_v1.json`
  - `next_action.instructions = "Run ShopiFixer audit and write findings to client record."`
- `staffordos/snapshots/unit_work_snapshot_v1.json`
  - `next_action = "Follow up on real ShopiFixer offer and close payment."`

### 4. What proof they will receive
Supported today, but only partially:
- `abando-frontend/app/shopifixer/page.tsx`
- `web/src/routes/pricing.esm.js`
- `staffordos/clients/shopifixer_offer_latest.json`
- `staffordos/audits/shopifixer_audit_standard_v1.md`

Existing proof promises:
- before/after evidence
- proof package
- completion summary
- proof-driven delivery

Runtime-backed proof artifacts that already exist:
- `staffordos/leads/send_ledger_v1.json`  
  lead outreach proof only
- `staffordos/leads/send_execution_log_v1.json`  
  proof of dry-run send logging
- `staffordos/clients/shopifixer_offer_latest.json`  
  generated offer with `proof_present: true`
- `staffordos/clients/client_registry_v1.json`  
  notes include an `offer_sent` proof record

Missing proof artifact:
- no ShopiFixer-specific before/after proof package exists as a runtime truth file

### 5. Why the $950 Fix Sprint is a no-brainer
Supported today in copy:
- `web/src/routes/pricing.esm.js`
- `abando-frontend/app/shopifixer/page.tsx`
- `abando-frontend/app/audit-result/page.tsx`

The offer can already say:
- scoped Shopify conversion fix
- proof-driven delivery
- before/after evidence
- $950 flat fee

What prevents this from feeling fully authoritative:
- the system does not yet emit a governed audit-result artifact
- the system does not yet emit a governed before/after proof package
- the after-state is still mostly an offer/recovery story, not a completed merchant proof story

## Before-state data already exists

| Source | What it already proves |
|---|---|
| `abando-frontend/app/scorecard/[domain]/page.tsx` | visible issue, revenue risk estimate, benchmark comparison, confidence |
| `abando-frontend/app/audit-result/page.tsx` | intended audit result fields: score, revenue at risk, issue, benchmark, recommendation |
| `abando-frontend/app/api/audit/status/route.ts` | live bridge expects a completed audit surface |
| `staffordos/clients/client_registry_v1.json` | audit not started, fix not started, payment not billable |
| `staffordos/snapshots/unit_work_snapshot_v1.json` | proposal sent / waiting for payment |
| `staffordos/cockpit/ceo_truth_snapshot_v1.json` | merchant value recovered but Stafford revenue not captured |

## After-state data already exists

| Source | What it already proves |
|---|---|
| `staffordos/clients/shopifixer_offer_latest.json` | a generated offer exists, includes recovered revenue and `proof_present: true` |
| `staffordos/clients/client_registry_v1.json` | offer sent proof note exists for the sample client |
| `staffordos/cockpit/ceo_truth_snapshot_v1.json` | recovered revenue is real runtime truth, but fulfillment and proof completion are still null |

This is not yet a true merchant after-state. It is only a partial commercial after-story.

## Proof artifacts already exist

Existing proof-like artifacts:
- `staffordos/leads/send_ledger_v1.json`
- `staffordos/leads/send_execution_log_v1.json`
- `staffordos/clients/shopifixer_offer_latest.json`
- `staffordos/clients/client_registry_v1.json`
- `staffordos/cockpit/ceo_truth_snapshot_v1.json`

What these do **not** yet provide:
- a ShopiFixer before-state screenshot artifact
- a ShopiFixer after-state screenshot artifact
- a governed proof package pairing the two
- a completion summary tied to a real merchant fix outcome

## Missing proof gaps

1. `staffordos/audit/audit_result_surface.json` does not exist in this checkout.
2. The audit-status route depends on that missing file.
3. The audit-result page depends on that missing file.
4. The system has no ShopiFixer-specific before/after proof package artifact.
5. The system has no governed completion artifact for the paid sprint outcome.

## Smallest next implementation slice

The smallest useful slice is to create the missing audit result surface and connect the audit status route to it so the merchant-facing result page is backed by real runtime data.

### Exact files to change next
1. `abando-frontend/app/api/audit/status/route.ts`
2. Add the missing `staffordos/audit/audit_result_surface.json` materialization path

### What should not be touched
- `staffordos/clients/client_registry_v1.json`
- `staffordos/revenue/revenue_truth_v1.json`
- `staffordos/snapshots/unit_work_snapshot_v1.json`
- `web/src/routes/stripeWebhook.esm.js`
- `web/src/routes/pricing.esm.js`
- `web/src/checkout-public.js`
- lifecycle authority files
- Abando install/dashboard/merchant flows
- Stripe or payment truth logic
- any new lifecycle model or metrics

## Final answers

- **Verdict:** partial support, not yet a full authoritative before/after conversion UX
- **Missing proof gaps:** missing audit-result surface, missing ShopiFixer before/after proof package, missing completed after-state artifact
- **Smallest next implementation slice:** wire the audit-status route to a real audit-result surface artifact
- **Exact files to change next:** `abando-frontend/app/api/audit/status/route.ts` and the missing `staffordos/audit/audit_result_surface.json` materialization path
