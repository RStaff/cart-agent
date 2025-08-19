#!/usr/bin/env bash
set -euo pipefail
kubectl apply -f k8s/namespace.yaml
kubectl -n cart-agent delete secret cart-agent-secrets --ignore-not-found
kubectl -n cart-agent create secret generic cart-agent-secrets \
  --from-literal=DATABASE_URL="${DATABASE_URL:-}" \
  --from-literal=EMAIL_PROVIDER="${EMAIL_PROVIDER:-}" \
  --from-literal=RESEND_API_KEY="${RESEND_API_KEY:-}" \
  --from-literal=RESEND_FROM="${RESEND_FROM:-}" \
  --from-literal=SENDGRID_API_KEY="${SENDGRID_API_KEY:-}" \
  --from-literal=SENDGRID_FROM="${SENDGRID_FROM:-}" \
  --from-literal=SHOPIFY_API_KEY="${SHOPIFY_API_KEY:-}" \
  --from-literal=SHOPIFY_API_SECRET="${SHOPIFY_API_SECRET:-}" \
  --from-literal=SHOPIFY_SCOPES="${SHOPIFY_SCOPES:-write_products}" \
  --from-literal=WEBHOOK_SECRET="${WEBHOOK_SECRET:-}"
echo "✅ secrets updated"
