# Commercial Surface Map v1

## Executive Summary

The canonical ShopiFixer commercial path exists as a direct offer surface and payment path, but the public merchant front door is still Abando-first.

Canonical commercial path today:

`/shopifixer` → `/__public-checkout` → Stripe Checkout → `/stripe/webhook` → packet/client/revenue/dashboard/CEO truth

Canonical audit intake:

`POST /api/fix-audit` → lead registry + audit payload + follow-up email

The conflicting surfaces are the public home, marketing, audit, pricing, install, scorecard, audit-result, merchant, dashboard, and legacy checkout pages that still frame the journey as Abando recovery / install / free audit instead of the $950 ShopiFixer Fix Sprint.

## Surface Inventory

| Route / Surface | File owner | Offer presented | CTA destination | Conversion destination | Status | Notes |
|---|---|---:|---|---|---|---|
| `/` | `abando-frontend/app/page.tsx` → `src/components/MarketingLandingPage.tsx` | Abando recovery loop, “make your first recovery” | `/install/shopify`, `/marketing/demo/playground`, `/merchant?shop=...` | merchant recovery page / install flow | CONFLICTING | Current public root is Abando-first and bypasses ShopiFixer. |
| `/marketing` | `abando-frontend/app/marketing/page.tsx` | Abando AI Shopping Copilot | `/pricing`, `/marketing/demo/playground` | pricing / demo | CONFLICTING | Strong Abando-first marketing surface. |
| `/run-audit` | `abando-frontend/app/run-audit/page.tsx` | free Abando checkout audit | `/run-audit?store=...` → `/scorecard/[domain]` or `/install/shopify` | scorecard or install path | CONFLICTING | Audit entry exists, but it is Abando-framed, not ShopiFixer-first. |
| `/scorecard/[domain]` | `abando-frontend/app/scorecard/[domain]/page.tsx` | benchmark scorecard estimate | `/dashboard`, `/shopify/install`, `/pricing` | install / dashboard / pricing | CONFLICTING | Scorecard is pre-install estimate copy. |
| `/audit-result` | `abando-frontend/app/audit-result/page.tsx` | Abando audit result | `/dashboard`, `/shopify/install`, `/pricing` | install / dashboard / pricing | CONFLICTING | Result page remains Abando-first. |
| `/install/shopify` | `abando-frontend/app/install/shopify/page.tsx` | Abando install / connect-your-store flow | Shopify approval / merchant dashboard | installed Abando merchant dashboard | CONFLICTING | Conversion is install-first, not ShopiFixer purchase-first. |
| `/merchant` | `abando-frontend/app/merchant/page.tsx` | Abando recovery dashboard | `/embedded/dashboard?shop=...` or recovery test | merchant dashboard / recovery loop | LEGACY | Merchant surface is revenue-recovery oriented, not ShopiFixer commercial flow. |
| `/dashboard` | `abando-frontend/app/dashboard/page.tsx` | Abando merchant dashboard | `/run-audit`, `/pricing`, open Shopify | embedded dashboard / run-audit | CONFLICTING | Dashboard nav still loops back to Abando audit/pricing. |
| `/shopifixer` | `abando-frontend/app/shopifixer/page.tsx` | ShopiFixer Fix Sprint · $950 flat fee | `/__public-checkout`, `/pricing`, in-page audit demo | Stripe Checkout | CANONICAL | This is the direct canonical ShopiFixer offer surface. |
| `POST /api/fix-audit` | `web/src/index.js` (`createFixAuditLead`, `upsertShopifixerLead`) | ShopiFixer audit intake / lead capture | lead registry + saved audit payload + email follow-up | audit payload + lead registry | CANONICAL | Canonical acquisition API for the ShopiFixer audit side. |
| `GET /api/fix-audit` | `web/src/index.js` | saved ShopiFixer audit payload | none (read only) | audit payload reader | CANONICAL | Retrieval path for the canonical audit payload. |
| `/api/audit/status` | `abando-frontend/app/api/audit/status/route.ts` | audit state polling | `redirect_to: /audit-result` | audit-result page | LEGACY | Supports the Abando audit flow, not the canonical ShopiFixer offer. |
| `/buy` | `web/src/routes/publicPages.esm.js` | Abando Starter / Pro pricing | `/__public-checkout` | Stripe Checkout | LEGACY | Legacy Abando purchase page; not ShopiFixer-first. |
| `/success`, `/cancel` | `web/src/routes/publicPages.esm.js` | post-checkout result pages | back to site / back to plans | post-payment landing | LEGACY | Legacy Abando checkout wrappers. |
| `/pricing` | `web/src/routes/pricing.esm.js` and `abando-frontend/src/app_legacy/pricing/page.tsx` | Abando pricing / plan selection | `/run-audit`, `/install/shopify`, plan CTAs | install / trial / quote | CONFLICTING | Conflicts directly with the canonical $950 Fix Sprint. |
| `/` legacy HTML landing | `web/src/public/index.html` / `web/src/routes/landing.esm.js` | Abando recovery revenue landing | `/fix` (broken), `/install/shopify`, `/demo/playground` | install / demo | BROKEN | Legacy root landing uses a broken `/fix` CTA and Abando-first copy. |

## Navigation Inventory

| Surface | Nav items | Destination | Why it conflicts or aligns |
|---|---|---|---|
| `abando-frontend/src/components/brand/PublicHeader.tsx` | `Recovery test`, `Pricing` | `/merchant?shop=...` or `/install/shopify`, `/pricing` | Abando-first navigation. |
| `abando-frontend/src/components/Navbar.tsx` | `Pricing`, `Onboarding`, `Support`, `Open demo`, `Start free trial` | `/pricing`, `/onboarding`, `/support`, `/marketing/demo/playground`, `/trial` | Abando-first navigation. |
| `abando-frontend/src/components/NavbarV2.tsx` | `Pricing`, `Start free trial`, `Open demo` | `/pricing`, `/trial`, `/marketing/demo/playground` | Abando-first navigation. |
| `abando-frontend/src/components/dashboard/DashboardHeader.tsx` | `Run audit`, `Pricing`, `Open Shopify` | `/run-audit`, `/pricing`, external Shopify admin | Keeps dashboard in the Abando loop. |
| `abando-frontend/app/marketing/layout.tsx` | `Marketing`, `Pricing`, `Onboarding`, `Support`, `Demo`, `Open app` | `/marketing`, `/pricing`, `/onboarding`, `/support`, `/marketing/demo/playground`, `/embedded` | Abando marketing nav, not ShopiFixer. |
| `web/src/public/index.html` legacy nav | `Try audit`, `Install Abando`, `Open demo` | `/fix` (no route found), `/install/shopify`, `/demo/playground` | Broken + Abando-first. |
| `abando-frontend/app/shopifixer/page.tsx` buttons | `Get the $950 Fix Sprint`, `Run ShopiFixer Audit`, `View pricing` | `/__public-checkout`, in-page demo, `/pricing` | Canonical offer button is aligned; pricing link still conflicts. |

## Final Answers

### 1. What is the canonical merchant path today?

The canonical merchant path is the direct ShopiFixer path:

`/shopifixer` → `/__public-checkout` → Stripe Checkout → `/stripe/webhook` → packet/client/revenue/dashboard/CEO truth.

The broader public site is not yet aligned to that path; it still routes merchants through Abando-first pages.

### 2. Which pages still present Abando-first messaging?

`/`, `/marketing`, `/run-audit`, `/scorecard/[domain]`, `/audit-result`, `/install/shopify`, `/merchant`, `/dashboard`, `/pricing`, `/buy`, `/success`, `/cancel`, plus the legacy root HTML landing files.

### 3. Which pages conflict with the $950 ShopiFixer Fix Sprint offer?

Any page that offers Abando trial, install, scorecard, or pricing before ShopiFixer:

`/`, `/marketing`, `/run-audit`, `/scorecard/[domain]`, `/audit-result`, `/install/shopify`, `/dashboard`, `/merchant`, `/pricing`, `/buy`.

### 4. What is the smallest set of files required to create a single canonical merchant journey?

Minimum merchant-front-door set:

- `abando-frontend/app/page.tsx`
- `abando-frontend/src/components/MarketingLandingPage.tsx`
- `abando-frontend/src/components/brand/PublicHeader.tsx`
- `abando-frontend/src/components/Navbar.tsx`
- `abando-frontend/src/components/NavbarV2.tsx`
- `abando-frontend/src/components/dashboard/DashboardHeader.tsx`
- `abando-frontend/app/marketing/page.tsx`
- `abando-frontend/app/run-audit/page.tsx`
- `abando-frontend/app/scorecard/[domain]/page.tsx`
- `abando-frontend/app/audit-result/page.tsx`
- `abando-frontend/app/install/shopify/page.tsx`
- `abando-frontend/app/dashboard/page.tsx`
- `abando-frontend/app/merchant/page.tsx`

If the web Express app remains public, deprecate the legacy Abando HTML and route files in parallel:

- `web/src/public/index.html`
- `web/src/routes/landing.esm.js`
- `web/src/routes/pricing.esm.js`
- `web/src/routes/runAudit.esm.js`
- `web/src/routes/publicPages.esm.js`

### 5. What exact files should be modified first?

First, align the merchant-facing front door and navigation:

1. `abando-frontend/app/page.tsx`
2. `abando-frontend/src/components/MarketingLandingPage.tsx`
3. `abando-frontend/src/components/brand/PublicHeader.tsx`
4. `abando-frontend/src/components/Navbar.tsx`
5. `abando-frontend/src/components/NavbarV2.tsx`
6. `abando-frontend/src/components/dashboard/DashboardHeader.tsx`
7. `abando-frontend/app/run-audit/page.tsx`
8. `abando-frontend/app/scorecard/[domain]/page.tsx`
9. `abando-frontend/app/install/shopify/page.tsx`
10. `abando-frontend/app/audit-result/page.tsx`
11. `abando-frontend/app/dashboard/page.tsx`
12. `abando-frontend/app/merchant/page.tsx`

The payment backend is already canonical and should stay untouched for this surface-map phase:

- `web/src/checkout-public.js`
- `web/src/routes/stripeWebhook.esm.js`
- `web/src/lib/packetRepository.js`
- `staffordos/revenue/revenue_agent_v1.mjs`
- `staffordos/clients/client_registry_v1.mjs`
- `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs`
- `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts`
