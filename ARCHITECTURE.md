# Abando Architecture (Source of Truth)

## Backend (Express) — System of Record
Path: web/src/index.js
Owns:
- Shopify OAuth (/shopify/install, /shopify/callback)
- Billing creation + verification
- Webhooks + data ingestion
- DB persistence + entitlements
- API: /api/billing/* and /api/rescue/*

## Frontend (Next.js)
Path: abando-frontend/
Owns:
- Embedded UI routes (/embedded, /demo/playground)
- UI-only route verification:
  - /app/api/shopify/verify-embedded (Next App Router)

## Boundary Rules
- Next does NOT call Shopify Admin API directly.
- Express exposes JSON APIs used by Next UI.
