# PROVIDER AUTHORITY DRIFT V1

DISCOVERY

Stripe webhook destination currently appears to be:

https://cart-agent-backend.onrender.com/stripe/webhook

Canonical StaffordOS production references overwhelmingly point to:

https://cart-agent-api.onrender.com

RISK

Stripe may be delivering verified payment events to a different authority than the one currently serving production packet lifecycle operations.

REQUIRED VERIFICATION

Determine whether:

cart-agent-backend.onrender.com

and

cart-agent-api.onrender.com

resolve to the same Render service.

STATUS

BLOCKING S2G
