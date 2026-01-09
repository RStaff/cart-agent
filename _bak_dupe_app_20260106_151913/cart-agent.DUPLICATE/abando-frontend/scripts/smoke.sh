#!/usr/bin/env bash
set -euo pipefail

echo "→ /api/status"
curl -s http://localhost:3000/api/status | jq '.ok, .stripe.hasPublishable, .stripe.hasSecret, .autosend.mode' >/dev/null

echo "→ demo generate"
curl -s -X POST -H 'content-type: application/json' \
  -d '{"product":"Eco-rubber yoga mat (4mm)","tone":"helpful"}' \
  http://localhost:3000/api/demo/generate | jq -e '.ok and (.message|length>0)' >/dev/null

echo "✅ smoke passed"
