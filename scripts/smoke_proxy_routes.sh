#!/usr/bin/env bash
set -euo pipefail

fail(){ echo "❌ $1"; exit 1; }

# Must be up
curl -sI http://localhost:3000/ >/dev/null || fail "3000 not reachable"
curl -sI http://localhost:3001/ >/dev/null || fail "3001 not reachable"

# / should redirect to /demo/playground
loc="$(curl -sI http://localhost:3000/ | awk -F': ' 'tolower($1)=="location"{print $2}' | tr -d '\r')"
[[ "$loc" == "/demo/playground" ]] || fail "Expected 3000 / Location:/demo/playground, got: ${loc:-<none>}"

# /demo/playground should be 200 and Next.js powered
hdr="$(curl -sI http://localhost:3000/demo/playground | tr -d '\r')"
echo "$hdr" | grep -q "200" || fail "3000 /demo/playground not 200"
echo "$hdr" | grep -qi "x-powered-by: Next.js" || fail "3000 /demo/playground not served by Next.js"

# /embedded should be 200 and Next.js powered
hdr2="$(curl -sI http://localhost:3000/embedded | tr -d '\r')"
echo "$hdr2" | grep -q "200" || fail "3000 /embedded not 200"
echo "$hdr2" | grep -qi "x-powered-by: Next.js" || fail "3000 /embedded not served by Next.js"

echo "✅ smoke_proxy_routes: PASS"
