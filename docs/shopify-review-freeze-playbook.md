# Shopify Review Freeze Playbook

Use this while the app is in Shopify review.

## 1) Freeze policy

- Do not change production behavior unless there is an outage or a reviewer-blocking defect.
- Do not rotate Shopify credentials unless required.
- Keep current deployed commit pinned until reviewer feedback arrives.

## 2) What is considered safe during review

- Updating internal docs.
- Collecting logs/diagnostics.
- Preparing reviewer response text.

## 3) What is not safe during review

- UX copy changes on live routes.
- Auth/session changes.
- Billing flow changes.
- URL/redirect/GDPR endpoint changes.

## 4) If Shopify reports an issue

- Create a hotfix branch from the current remediation branch.
- Fix only the reviewer-reported item.
- Retest only affected paths:
  - Embedded load: `/embedded`
  - Auth check: `/embedded/diagnostics?debug=1`
  - Context API: `/api/shopify/context`
  - GDPR webhook endpoint: `/api/webhooks/gdpr`
- Deploy and update the reviewer with exact fix summary.

## 5) Release-state checklist

- Embedded app loads in Shopify admin.
- `Run Auth Check` returns `200` and `ok: true`.
- Render logs redact `id_token`, `hmac`, and `session` query values.
- GDPR endpoint exists at `/api/webhooks/gdpr`.
- App Store review page status is `Submitted`.

