# AUDIT System Boundary Report

Generated: 2026-03-23  
Scope: repo audit only. No fixes applied.

## 1. Executive Summary

This repo contains three systems that are not cleanly separated yet:

- **Abando**: merchant-facing abandoned checkout recovery product
- **Shop Fixer Analyzer**: intended GitHub repository analyzer for Shopify developers
- **StaffordOS**: operator control plane

The strongest conclusion from this audit is:

- **Abando merchant recovery flow is the most real system in the repo**
- **Shop Fixer Analyzer has drifted into a storefront/store audit funnel rather than a GitHub repository analyzer**
- **StaffordOS has real operator surfaces, but many are placeholders or mixed placeholder + real summary views**
- **There are multiple boundary violations where Abando and Shop Fixer logic directly depend on StaffordOS code or files instead of staying behind API-only, read-only boundaries**

The biggest execution blocker for Abando is not message generation or dashboard state. It is **missing real outbound provider configuration**, which keeps the system honestly stuck at `email_not_configured` / `sms_not_configured`.

## 2. What Is Actually Real Right Now

### Abando

Real and working:

- Shopify install route and merchant-facing install page
- merchant connected/listening states
- checkout event ingestion
- recovery-ready state
- recovery action creation with persisted `SystemEvent`
- deterministic recovery message preview
- return link generation
- customer return tracking
- merchant dashboard state derived from persisted events

Real but incomplete:

- real outbound send pipeline exists in code for email and SMS
- test send endpoints exist
- live test UI exists
- no delivery proof exists in the audited environment because provider config is missing

### Shop Fixer Analyzer

Real and connected:

- `/fix` route
- `/api/fix-audit`
- lead capture to local JSON
- issue/opportunity output rendered in UI

But it is **not currently behaving like a GitHub repository analyzer**. It is behaving like a **store/storefront checkout leak analyzer**.

### StaffordOS

Real and connected:

- operator shell routes render
- `/operator/products` consumes Abando merchant summary via API
- operator console query UI exists

Placeholder or mixed:

- analytics
- capacity
- revenue command
- leads queue API
- non-Abando product cards

## 3. What Is Stubbed / Placeholder

### Honest placeholders

- Abando checkout placeholder redirect page
- StaffordOS analytics panels
- StaffordOS capacity planning values
- StaffordOS revenue command cards
- StaffordOS lead queue placeholder API

### Risky placeholders

- `web/src/lib/mailer.js` fabricates a fake email ID when unconfigured
- several Abando and StaffordOS demo or mock surfaces remain in the repo and can confuse which product is actually live

## 4. Abando Audit

### Install flow

Status: **real and working**

Evidence:

- `web/src/routes/installShopify.esm.js`
- `web/src/index.js`

What is real:

- install route renders
- OAuth/install handoff exists
- success page exists
- script enable/manual enable path exists

Risks / inconsistencies:

- install page still includes manual shop-domain entry UI
- that is inconsistent with the stricter “OAuth-based install only” expectation

### Merchant connected/listening state

Status: **real and working**

Evidence:

- `web/src/lib/dashboardSummary.js`
- `web/src/components/abandoStatusCard.js`
- `web/src/index.js`

What is real:

- `connectionStatus`
- `listeningStatus`
- `checkoutEventsCount`
- `lastCheckoutEventAt`
- merchant dashboard cards

### Checkout event ingestion

Status: **real and working**

Evidence:

- `POST /api/checkout-events` in `web/src/index.js`
- `web/src/routes/checkoutSignals.esm.js`

What is real:

- persisted checkout event records
- merchant dashboard updates from persisted events

### Abandonment detection

Status: **real but incomplete**

Evidence:

- `web/src/routes/checkoutSignals.esm.js`

What is real:

- checkout-risk signal handling
- job creation / decision logging paths exist

Why incomplete:

- current decisioning path calls StaffordOS (`/abando/decision`)
- when unavailable, Abando falls back honestly
- this is a boundary risk because Abando execution is not fully self-contained

### Recovery-ready state

Status: **real and working**

Evidence:

- `web/src/lib/dashboardSummary.js`
- `web/src/components/abandoStatusCard.js`

What is real:

- merchant sees listening vs recovery-ready based on real event state

### Recovery action creation

Status: **real and working**

Evidence:

- `POST /api/recovery-actions/create` in `web/src/index.js`

What is real:

- creates `abando.recovery_action.v1`
- persists action payload
- dashboard reflects created state

### Recovery message preview

Status: **real and working**

Evidence:

- `web/src/lib/recoveryMessageEngine.js`

What is real:

- deterministic email subject
- email body
- SMS text
- return link

### Real send pipeline

Status: **real but incomplete**

Evidence:

- `web/src/lib/emailSender.js`
- `web/src/lib/smsSender.js`
- `POST /api/recovery-actions/create`
- `POST /api/recovery-actions/send-test`
- `POST /api/recovery-actions/send-live-test`

What is real:

- real Nodemailer sender module
- real Twilio sender module
- send attempt status plumbing
- dashboard send state

Why incomplete:

- no SMTP env configured
- no Twilio env configured
- therefore no live provider success proof

### Return tracking

Status: **real and working**

Evidence:

- `POST /api/recovery/return`
- `GET /recover/:token`
- `GET /checkout-placeholder`

What is real:

- customer return event persisted as `abando.customer_return.v1`
- return link triggers persistence before redirect

### Merchant dashboard truthfulness

Status: **mostly real and honest**

Evidence:

- `web/src/lib/dashboardSummary.js`
- `web/src/components/abandoStatusCard.js`

What is honest:

- no fake revenue in audited Abando dashboard paths
- no fake send status in current merchant send-test path
- missing provider config is surfaced explicitly

Risks:

- repo still contains unrelated placeholder/demo surfaces
- copy drift can make it harder to tell which surfaces are canonical

### Abando answers to required questions

#### 1. Where does “Send not configured” come from?

It comes from real provider config checks:

- `web/src/lib/emailSender.js`
- `web/src/lib/smsSender.js`
- send attempt result assembly in `web/src/index.js`
- dashboard summary/rendering in `web/src/lib/dashboardSummary.js` and `web/src/components/abandoStatusCard.js`

#### 2. What exact env vars are checked for email?

Checked by current code:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- sender from `FROM_EMAIL` or fallback `DEFAULT_FROM` or `SMTP_FROM`

#### 3. What exact env vars are checked for SMS?

Checked by current code:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- sender from `TWILIO_FROM` or fallback `TWILIO_FROM_NUMBER`

#### 4. Can any code mark a message as sent without provider success?

For the **current Abando merchant recovery send path**:

- audit result: **no evidence found**
- `sent_email`, `sent_sms`, and `sent_email_and_sms` depend on actual sender success
- `POST /api/recovery-actions/create` only marks `status: "sent"` if one or more channels actually succeed

Separate risk elsewhere in repo:

- `web/src/lib/mailer.js` fabricates a fake email ID when Resend is unconfigured
- this is dangerous and misleading, even though it is not the primary merchant recovery send path audited above

#### 5. What exact endpoints are intended for real test send?

- `POST /api/recovery-actions/send-test`
- `POST /api/recovery-actions/send-live-test`

#### 6. What exact blockers prevent one real outbound proof?

- missing SMTP configuration:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `FROM_EMAIL`
- missing Twilio configuration:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_FROM`

Observed live result in this repo state:

- `email_not_configured`
- `sms_not_configured`
- no `messageId`
- no `smsSid`
- no provider success

## 5. Shop Fixer Analyzer Audit

### Intended boundary

Target definition from this audit:

- developer-facing GitHub repository analyzer for Shopify developers

### Current observed system shape

#### `/fix` route

Status: **real and connected, but identity-drifted**

Evidence:

- `web/src/index.js`
- `GET /fix`
- `POST /api/fix-audit`

What it currently does:

- asks for a store URL
- captures email
- analyzes storefront/store signals
- frames checkout leakage
- CTA points into Abando

This is **not currently a GitHub repository intake flow**.

#### Analyzer logic

Status: **mixed**

Evidence:

- `web/src/lib/storeAnalyzer.js`

What it currently does:

- fetches storefront/store data
- detects no email capture / no exit intent / missing cart recovery / slow checkout signals
- uses directional heuristics and benchmark helpers

Why mixed:

- functionally real as a directional storefront analyzer
- misaligned to the intended “GitHub repository analyzer for Shopify developers” definition

#### Scoring / findings pipeline

Status: **directional / mixed**

Evidence:

- `web/src/lib/storeAnalyzer.js`

Why:

- outputs are not empty
- outputs are not fully stubbed
- but the logic is heuristic and storefront-oriented rather than repository-analysis-oriented

#### Separation from Abando

Status: **boundary-risk**

Evidence:

- `/fix` funnels into Abando demo/install CTA
- analyzer logic overlaps with merchant recovery framing

#### Separation from StaffordOS

Status: **boundary-risk**

Evidence:

- `web/src/lib/storeAnalyzer.js` imports `../../../staffordos/scorecards/askAbandoEngine.js`
- `web/src/lib/fixCheckout.js` imports `../../../staffordos/truth/lead_truth_store.mjs`

Conclusion:

- Shop Fixer Analyzer is **not cleanly separated**
- current implementation is partially real, but conceptually drifted and coupled

## 6. StaffordOS Audit

### `/operator` / operator console

Status: **live and connected**

Evidence:

- `staffordos/ui/operator-frontend/app/operator/page.tsx`
- `staffordos/ui/operator-frontend/components/operator/OperatorConsole.tsx`

What is real:

- route renders
- query UI works through operator API client

Boundary note:

- operator console is correctly operator-facing

### `/operator/capacity`

Status: **live but stubbed**

Evidence:

- `staffordos/ui/operator-frontend/app/operator/capacity/page.tsx`

Why:

- explicitly manual planning values
- placeholder structure, not live capacity instrumentation

Boundary status:

- **boundary-safe**

### `/operator/leads`

Status: **mixed real + placeholder**

Evidence:

- `staffordos/ui/operator-frontend/app/operator/leads/page.tsx`
- `staffordos/ui/operator-frontend/app/api/leads/queue/route.ts`

Why:

- route is live
- queue API returns placeholder stub data

Boundary status:

- **mostly boundary-safe**, but not production-real

### `/operator/revenue-command`

Status: **placeholder-only**

Evidence:

- `staffordos/ui/operator-frontend/app/operator/revenue-command/page.tsx`

Boundary status:

- **boundary-safe**

### `/operator/analytics`

Status: **placeholder-only**

Evidence:

- `staffordos/ui/operator-frontend/app/operator/analytics/page.tsx`

Boundary status:

- **boundary-safe**

### `/operator/products`

Status: **mixed real + placeholder**

Evidence:

- `staffordos/ui/operator-frontend/app/operator/products/page.tsx`
- `staffordos/ui/operator-frontend/components/operator/AbandoProductSummaryCard.tsx`

What is real:

- Abando summary fetch through API

What is placeholder:

- non-Abando product summary cards

Boundary status:

- **mostly boundary-safe on this route**
- uses read-only summary consumption for Abando

### StaffordOS read-only summary rule audit

Result: **partially respected**

What is boundary-safe:

- operator products page fetches Abando summary via API

What violates or risks the rule elsewhere in repo:

- multiple Abando frontend director/control surfaces read StaffordOS files directly from disk
- Abando execution code calls StaffordOS APIs for decisioning/event upsert paths

## 7. Send Pipeline Audit

### Current merchant-recovery send path

Real components:

- `web/src/lib/recoveryMessageEngine.js`
- `web/src/lib/emailSender.js`
- `web/src/lib/smsSender.js`
- `POST /api/recovery-actions/create`
- `POST /api/recovery-actions/send-test`
- `POST /api/recovery-actions/send-live-test`
- dashboard summary + status card

### Current live audited state

Observed result:

- message generation works
- send attempts are wired
- missing provider config is reported honestly
- no fake `sent` status is recorded in the main recovery path

### Risk outside the main path

- `web/src/lib/mailer.js` prints `=== FAKE SENT ===` and returns `{ id: "fake-..." }` when unconfigured
- that behavior is dangerous because it can blur whether real delivery happened

## 8. Env / Config Audit

### High-level findings

- env usage is broad and inconsistent across systems
- multiple fallback names exist for the same concept
- there are signs of config drift between backend, frontend, Abando, Shop Fixer, and StaffordOS
- committed `.env` / `.env.local` files appear to contain live or semi-live secrets/tokens

That is a security and operational clarity risk.

### Env/config table

| Variable | Where used | Required? | System | Surface |
|---|---|---:|---|---|
| `SMTP_HOST` | `web/src/lib/emailSender.js` | Yes for real email send | Abando | backend |
| `SMTP_PORT` | `web/src/lib/emailSender.js` | Yes for real email send | Abando | backend |
| `SMTP_USER` | `web/src/lib/emailSender.js` | Yes for real email send | Abando | backend |
| `SMTP_PASS` | `web/src/lib/emailSender.js` | Yes for real email send | Abando | backend |
| `FROM_EMAIL` | `web/src/lib/emailSender.js` | Yes for primary sender identity | Abando | backend |
| `DEFAULT_FROM` | `web/src/lib/emailSender.js`, `web/src/lib/mailer.js` | Optional fallback | Abando | backend |
| `SMTP_FROM` | `web/src/lib/emailSender.js` | Optional fallback | Abando | backend |
| `TWILIO_ACCOUNT_SID` | `web/src/lib/smsSender.js` | Yes for real SMS send | Abando | backend |
| `TWILIO_AUTH_TOKEN` | `web/src/lib/smsSender.js` | Yes for real SMS send | Abando | backend |
| `TWILIO_FROM` | `web/src/lib/smsSender.js` | Yes for primary sender identity | Abando | backend |
| `TWILIO_FROM_NUMBER` | `web/src/lib/smsSender.js` | Optional fallback | Abando | backend |
| `ABANDO_RECOVERY_TOKEN_SECRET` | `web/src/lib/recoveryMessageEngine.js` | Yes for non-dev secure tokens | Abando | backend |
| `SHOPIFY_API_KEY` | install/auth paths | Required in real install | Abando | backend |
| `SHOPIFY_API_SECRET` / `SHOPIFY_API_SECRET_KEY` / `SHOPIFY_SECRET` | install/auth paths | Required in real install | Abando | backend |
| `APP_URL` | install/auth/callback/origin use | Required in real deployment | Abando | backend |
| `ABANDO_PUBLIC_APP_ORIGIN` | install/copy/origin path | Optional but important | Abando | backend/frontend copy |
| `NEXT_PUBLIC_ABANDO_PUBLIC_APP_ORIGIN` | install/copy/origin path | Optional fallback | Abando | frontend |
| `ABANDO_STOREFRONT_SCRIPT_SRC` | script injection | Required for storefront script path | Abando | backend |
| `STAFFORDOS_URL` | `web/src/lib/staffordosUrl.js`, webhook/signal routes | Required for coupled control-plane paths | Abando / StaffordOS boundary | backend |
| `DATABASE_URL` | Prisma/data access | Required | Abando | backend |
| `ABANDO_API_BASE` / `NEXT_PUBLIC_ABANDO_API_BASE` | operator products summary | Required for real StaffordOS summary fetch | StaffordOS | frontend |
| `ABANDO_SUMMARY_SHOP` / `NEXT_PUBLIC_ABANDO_SUMMARY_SHOP` | operator products summary | Optional but needed for useful summary | StaffordOS | frontend |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | StaffordOS truth/reply workflows | Required for StaffordOS Gmail integration | StaffordOS | backend |
| `FIX_RETURN_BASE_URL` | fix checkout/payment flow | Optional/flow-specific | Shop Fixer Analyzer | backend |
| `LEADS_STRIPE_SUCCESS_URL` / `LEADS_STRIPE_CANCEL_URL` | fix checkout/payment flow | Flow-specific | Shop Fixer Analyzer | backend |

### Likely missing or mismatched names

- email sending uses `FROM_EMAIL` as the primary sender, while other files still reference `DEFAULT_FROM`
- SMS sending prefers `TWILIO_FROM`, while some code still tolerates `TWILIO_FROM_NUMBER`
- multiple public/back-end origin variables exist for Abando frontend/backend addressing
- `STAFFORDOS_URL` inside Abando execution paths indicates boundary coupling rather than pure summary consumption

## 9. Boundary Violations or Risks

### Confirmed boundary risks

1. **Abando execution depends on StaffordOS for decisioning**
   - `web/src/routes/checkoutSignals.esm.js`
   - calls StaffordOS `/abando/decision`

2. **Abando execution posts event data into StaffordOS**
   - `web/src/routes/orderWebhook.esm.js`
   - posts to StaffordOS recovery-events endpoint

3. **Shop Fixer Analyzer imports StaffordOS logic directly**
   - `web/src/lib/storeAnalyzer.js`
   - imports `staffordos/scorecards/askAbandoEngine.js`

4. **Shop Fixer payment logic imports StaffordOS truth store directly**
   - `web/src/lib/fixCheckout.js`
   - imports `staffordos/truth/lead_truth_store.mjs`

5. **Abando frontend contains StaffordOS director/control surfaces**
   - `abando-frontend/app/director/page.tsx`
   - related `abando-frontend/app/api/director/*`
   - `abando-frontend/app/control/page.tsx`
   - these read StaffordOS files directly from disk

### Why these matter

- they violate “API boundary only”
- they weaken product/control-plane separation
- they increase copy/paste drift
- they make it harder to prove which system owns execution

## 10. Highest-Risk Copy/Paste Drift Areas

1. **`/fix` product identity drift**
   - intended as GitHub repository analyzer
   - currently implemented as storefront/store audit with Abando CTA

2. **Abando frontend containing StaffordOS director/control pages**
   - strongest UI-merging signal in repo

3. **Shared or cross-imported truth/scoring logic**
   - Shop Fixer and Abando both touch StaffordOS-origin logic/files

4. **Legacy fake-send mailer path**
   - `web/src/lib/mailer.js`
   - high risk for misleading delivery assumptions

5. **Config-name drift**
   - multiple env names for sender/origin concepts

## 11. Exact Blockers to Real Outbound Message Delivery in Abando

Primary blockers:

- `SMTP_HOST` missing
- `SMTP_PORT` missing
- `SMTP_USER` missing
- `SMTP_PASS` missing
- `FROM_EMAIL` missing
- `TWILIO_ACCOUNT_SID` missing
- `TWILIO_AUTH_TOKEN` missing
- `TWILIO_FROM` missing

Additional practical blocker:

- no audited provider success proof exists in the current environment, so dashboard state correctly remains unproven for real delivery

Important non-blockers:

- message generation is not the blocker
- return link generation is not the blocker
- dashboard rendering is not the blocker
- merchant test endpoints are not the blocker

## 12. Confidence / Uncertainty Notes

High confidence:

- Abando merchant recovery state machine is substantially real
- send pipeline is blocked by provider configuration, not by missing message-generation code
- boundary violations between Abando / Shop Fixer / StaffordOS are real and code-proven
- `/fix` is currently not cleanly aligned with “GitHub repository analyzer” positioning

Medium confidence:

- some older or alternate surfaces may not be the current canonical entrypoints
- there are multiple overlapping frontend/backend surfaces in the repo

Audit caution:

- this report treats code-level evidence as the source of truth
- it does not assume a rendered UI proves a workflow is real
- it does not assume Gmail/Twilio connectivity unless provider success is actually recorded
