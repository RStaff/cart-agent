# Shopifixer

Shopifixer is a manual execution product for identifying storefront conversion friction on Shopify stores and closing a focused fix-plan offer.

Ross uses Shopifixer inside StaffordOS as an operator workflow for targeting stores, sending outreach manually, handling responses, closing the offer, delivering the work, and logging what happened for future improvement.

Execution loop:
ICP -> outreach -> response -> close -> delivery -> log -> improve

Ross is the operator. This system supports execution.

## Outreach Console

Location:
- StaffordOS -> Products -> Shopifixer -> Outreach Console
- UI route: `/operator/products/shopifixer/outreach`

What it does:
- collects `store_url`, `contact_email`, `niche`, and optional `contact_name`
- generates a first-touch outreach draft
- produces a Gmail compose link for Ross to open manually
- logs explicit outreach statuses to `staffordos/products/shopifixer/logs/shopifixer_conversation_log_v1.md`

Status meanings:
- `draft_generated`: a draft was generated and logged, but Ross still needs to review and send it manually
- `sent`: Ross manually sent the message and explicitly marked it sent in the console

Integrity rules:
- no auto-send
- no Gmail API integration
- no hidden status transitions
- Ross remains the sender
