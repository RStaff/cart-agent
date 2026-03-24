# Shopify Approved Webhook Topics Reference

These webhook subscriptions are intentionally **not** present in the local
`shopify app dev` configs because Shopify CLI dev preview currently fails when
the app is not approved for protected customer data access.

Re-enable these only in an approved environment after the app has the required
protected customer data approval:

```toml
[webhooks]
api_version = "2025-07"

  [[webhooks.subscriptions]]
  uri = "/api/webhooks/gdpr"
  compliance_topics = [ "customers/data_request", "customers/redact", "shop/redact" ]

  [[webhooks.subscriptions]]
  topics = [ "orders/paid" ]
  uri = "/api/webhooks/orders/paid"

  [[webhooks.subscriptions]]
  topics = [ "orders/create" ]
  uri = "/api/webhooks/orders/create"
```
