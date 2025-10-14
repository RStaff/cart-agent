#!/usr/bin/env bash
set -Eeuo pipefail
need() { command -v "$1" >/dev/null 2>&1 || { echo "✖ Missing $1"; exit 1; }; }

need curl
need sed

: "${CF_API_TOKEN:?Set CF_API_TOKEN}"
: "${CF_ACCOUNT_ID:?Set CF_ACCOUNT_ID}"
: "${CF_ZONE_ID:?Set CF_ZONE_ID}"
: "${AB_DOMAIN:=abando.ai}"

echo "✓ curl present"
echo "✓ env present"
echo "→ Using domain: $AB_DOMAIN"
