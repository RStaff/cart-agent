#!/usr/bin/env bash
set -Eeuo pipefail
: "${CF_API_TOKEN:?Missing CF_API_TOKEN}"

echo "→ /user/tokens/verify"
curl -sS -D /tmp/cf.hdr -o /tmp/cf.body \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  https://api.cloudflare.com/client/v4/user/tokens/verify || true
printf "\n--- status/headers ---\n"; sed -n '1,20p' /tmp/cf.hdr
printf "\n--- body (first 40 lines) ---\n"; sed -n '1,40p' /tmp/cf.body

echo
echo "→ /accounts (to list accounts accessible by token)"
curl -sS -D /tmp/cf2.hdr -o /tmp/cf2.body \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  https://api.cloudflare.com/client/v4/accounts || true
printf "\n--- status/headers ---\n"; sed -n '1,20p' /tmp/cf2.hdr
printf "\n--- body (first 60 lines) ---\n"; sed -n '1,60p' /tmp/cf2.body
