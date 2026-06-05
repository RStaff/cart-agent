# UI Convergence Plan v1

## Goal

Make the public experience ShopiFixer-first without removing Abando, StaffordMedia, or future product expansion.

The smallest safe slice is the public front door and its immediate follow-up pages:

`/` → `/shopifixer` → `/run-audit` → `/scorecard/[domain]` → `/audit-result` → `/pricing` → `/__public-checkout`

That slice gives a coherent parent-brand experience that leads merchants into the canonical ShopiFixer offer while leaving Abando as the secondary product.

## Recommended Implementation Slice

### Phase 1 - Revenue-producing UI release

Update the public landing chain so the first answer a merchant sees is ShopiFixer, not Abando.

Change first:

- `abando-frontend/app/page.tsx`
- `abando-frontend/src/components/MarketingLandingPage.tsx`
- `abando-frontend/src/components/brand/PublicHeader.tsx`
- `abando-frontend/app/run-audit/page.tsx`
- `abando-frontend/app/scorecard/[domain]/page.tsx`
- `abando-frontend/app/audit-result/page.tsx`
- `web/src/routes/pricing.esm.js`

### Phase 2 - Secondary Abando preservation

Keep Abando available as the recovery product, but no longer as the primary merchant answer.

Review next:

- `abando-frontend/app/marketing/page.tsx`
- `abando-frontend/src/components/Navbar.tsx`
- `abando-frontend/src/components/NavbarV2.tsx`
- `abando-frontend/src/components/dashboard/DashboardHeader.tsx`
- `abando-frontend/app/install/shopify/page.tsx`
- `abando-frontend/app/dashboard/page.tsx`
- `abando-frontend/app/merchant/page.tsx`

### Phase 3 - Legacy route cleanup

Clean up or retire Abando-first legacy surfaces only after the ShopiFixer-first journey is stable.

Leave unchanged for now:

- `web/src/public/index.html`
- `web/src/routes/landing.esm.js`
- `web/src/routes/runAudit.esm.js`
- `web/src/routes/publicPages.esm.js`
- `web/src/index.shopify-fix-backup.js`

## File Matrix

| File | Purpose | Route | Current CTA | Current Offer | Destination | Target classification |
|---|---|---|---|---|---|---|
| `abando-frontend/app/page.tsx` | Root route wrapper | `/` | redirects to embedded when Shopify context exists | Abando marketing landing | `MarketingLandingPage` | `STAFFORDMEDIA_PARENT` |
| `abando-frontend/src/components/MarketingLandingPage.tsx` | Public landing page | `/` | `Make your first recovery` / `Install on Shopify` | Abando recovery loop | `/api/abando/activation/trigger-test-recovery`, `/install/shopify` | `STAFFORDMEDIA_PARENT` |
| `abando-frontend/src/components/brand/PublicHeader.tsx` | Shared public header | shared | `Recovery test`, `Pricing` | Abando brand nav | `/merchant?shop=...`, `/install/shopify`, `/pricing` | `STAFFORDMEDIA_PARENT` |
| `abando-frontend/app/run-audit/page.tsx` | Audit entry point | `/run-audit` | `Run audit` | free Abando checkout audit | `/scorecard/[domain]` or `/install/shopify` | `PRIMARY_SHOPIFIXER` |
| `abando-frontend/app/scorecard/[domain]/page.tsx` | Audit result / scorecard | `/scorecard/[domain]` | `View Dashboard`, `Install Abando`, `See Pricing` | Abando scorecard estimate | `/dashboard`, `/shopify/install`, `/pricing` | `PRIMARY_SHOPIFIXER` |
| `abando-frontend/app/audit-result/page.tsx` | Audit result landing | `/audit-result` | `View Dashboard`, `Install Abando`, `See Pricing` | Abando audit result | `/dashboard`, `/shopify/install`, `/pricing` | `PRIMARY_SHOPIFIXER` |
| `web/src/routes/pricing.esm.js` | Pricing surface | `/pricing` | `Run your audit`, `Install Abando`, plan CTAs | Abando pricing | `/run-audit`, `/install/shopify`, `/__public-checkout` | `PRIMARY_SHOPIFIXER` |
| `abando-frontend/app/marketing/page.tsx` | Marketing landing | `/marketing` | `Start free trial`, `Try the demo` | Abando AI Shopping Copilot | `/pricing`, `/marketing/demo/playground` | `SECONDARY_ABANDO` |
| `abando-frontend/src/components/Navbar.tsx` | Global Abando nav | shared | `Pricing`, `Onboarding`, `Support`, `Open demo`, `Start free trial` | Abando navigation | Abando pages | `SECONDARY_ABANDO` |
| `abando-frontend/src/components/NavbarV2.tsx` | V2 Abando nav | shared | `Pricing`, `Start free trial`, `Open demo` | Abando navigation | Abando pages | `SECONDARY_ABANDO` |
| `abando-frontend/src/components/dashboard/DashboardHeader.tsx` | Dashboard nav | `/dashboard` embedded dashboard | `Run audit`, `Pricing`, `Open Shopify` | Abando dashboard | `/run-audit`, `/pricing`, Shopify admin | `SECONDARY_ABANDO` |
| `abando-frontend/app/install/shopify/page.tsx` | Install flow | `/install/shopify` | `Connect your store`, install prompts | Abando install path | Shopify approval / merchant dashboard | `SECONDARY_ABANDO` |
| `abando-frontend/app/dashboard/page.tsx` | Dashboard | `/dashboard` | `Run another audit`, `View connection status` | Abando dashboard | dashboard / audit loop | `SECONDARY_ABANDO` |
| `abando-frontend/app/merchant/page.tsx` | Merchant recovery page | `/merchant` | `Send test recovery to myself` / recovered shoppers | Abando recovery dashboard | merchant recovery loop | `SECONDARY_ABANDO` |
| `web/src/public/index.html` | Legacy public root HTML | `/` (legacy host) | `Try audit`, `Install Abando`, `Open demo` | Abando recovery landing | `/fix`, `/install/shopify`, `/demo/playground` | `LEAVE_UNCHANGED` |
| `web/src/routes/landing.esm.js` | Legacy landing route | `/` (legacy host) | `Start Free Trial`, `Try the demo`, `Install on Shopify` | Abando checkout co-pilot | `/pricing`, `/demo/playground`, `/install/shopify` | `LEAVE_UNCHANGED` |
| `web/src/routes/runAudit.esm.js` | Legacy audit route | `/run-audit` (legacy host) | `Run audit`, `Connect Shopify to Abando` | Abando free audit | `/scorecard/...` or `/install/shopify` | `LEAVE_UNCHANGED` |
| `web/src/routes/publicPages.esm.js` | Legacy buy/success/cancel wrappers | `/buy`, `/success`, `/cancel` | plan buttons / checkout | Abando Starter / Pro | `/__public-checkout` | `LEAVE_UNCHANGED` |

## Why this slice is smallest

It changes the first answer the merchant sees, the next decision pages, and the pricing handoff without touching the payment backend or the ShopiFixer fulfillment pipeline.

That is enough to make the public journey feel coherent:

1. Merchant lands on a parent-branded entry page.
2. Merchant sees ShopiFixer first.
3. Merchant can request the audit.
4. Merchant sees the result and the $950 pricing path.
5. Merchant checks out through the existing canonical payment flow.

Abando remains present, but as the secondary recovery product and not the primary commercial answer.

## Files that should not be touched in the first slice

These are backend truth or secondary execution surfaces and should stay intact while the front door is converged:

- `web/src/checkout-public.js`
- `web/src/routes/stripeWebhook.esm.js`
- `web/src/lib/packetRepository.js`
- `staffordos/revenue/revenue_agent_v1.mjs`
- `staffordos/clients/client_registry_v1.mjs`
- `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs`
- `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts`
- `abando-frontend/app/install/shopify/page.tsx`
- `abando-frontend/app/dashboard/page.tsx`
- `abando-frontend/app/merchant/page.tsx`

## Final Answers

### 1. What is the smallest implementation slice?

The smallest slice is the ShopiFixer-first front door and decision path:

`abando-frontend/app/page.tsx`
`abando-frontend/src/components/MarketingLandingPage.tsx`
`abando-frontend/src/components/brand/PublicHeader.tsx`
`abando-frontend/app/run-audit/page.tsx`
`abando-frontend/app/scorecard/[domain]/page.tsx`
`abando-frontend/app/audit-result/page.tsx`
`web/src/routes/pricing.esm.js`

### 2. What exact files should change first?

The first files to change are the same seven above.

### 3. Which files should not be touched?

The payment backend, CFO/operator truth surfaces, and the secondary Abando install/dashboard/merchant surfaces listed above should not be touched in the first slice.

### 4. What routes become ShopiFixer-first?

`/`, `/run-audit`, `/scorecard/[domain]`, `/audit-result`, `/pricing`, and the existing `/shopifixer` entry point.

### 5. How is Abando preserved without competing with the primary offer?

Abando stays available as the secondary product in the marketing, install, dashboard, and merchant recovery surfaces. The primary hero, audit path, and pricing path point to ShopiFixer first.

### 6. What implementation order minimizes risk?

1. Reframe the public root and shared header/nav around StaffordMedia + ShopiFixer.
2. Reframe the audit/result chain around ShopiFixer.
3. Reframe pricing around the $950 Fix Sprint.
4. Leave the payment backend alone.
5. Clean up secondary Abando screens afterward.

### 7. What is the first revenue-producing UI release?

The first revenue-producing UI release is the public front door that sends merchants from the StaffordMedia landing page into the ShopiFixer audit/result/pricing path and then into the already-working checkout.
