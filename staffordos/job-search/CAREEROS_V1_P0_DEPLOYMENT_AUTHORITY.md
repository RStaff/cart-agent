# CareerOS Deployment Authority

Deployment proof stopped before operations. The repository contains an authorized Render configuration for `cart-agent-api`, an existing Abando/ShopiFixer service. It does not contain an authorized service definition, domain, TLS binding, secret set, or governed deployment path for `staffordos/ui/operator-frontend` and its CareerOS customer namespace.

The documented production database is the shared `cart_agent_db`. Existing production migration evidence explicitly states that the reviewed migration was not applied. Applying the CareerOS migration there would be an unapproved shared-schema operation, so no deployment or migration was attempted.
