#!/usr/bin/env bash
set -euo pipefail

BASE="http://localhost:3000"
JS="/assets/index-B1lemyBr.js"
CSS="/assets/index-BeH9TshR.css"

echo "== 1) HTML headers =="
curl -sI "$BASE/demo/playground" | sed -n '1,25p'
echo

echo "== 2) First 80 lines of HTML (look for script tag + root div) =="
curl -s "$BASE/demo/playground" | sed -n '1,80p'
echo

echo "== 3) JS headers (must be 200 + javascript-ish content-type) =="
curl -sI "$BASE$JS" | sed -n '1,25p'
echo

echo "== 4) CSS headers =="
curl -sI "$BASE$CSS" | sed -n '1,25p'
echo

echo "== 5) Does the JS mention Shopify app-bridge / host / shop? (signals embedded gating) =="
curl -s "$BASE$JS" | grep -Eo "app-bridge|AppBridge|shopify|host=|[?&]host|[?&]shop|myshopify|authenticate|redirect" | head -n 60 || true
echo

echo "== 6) Look for 'Missing host'/'Missing shop'/'Invalid host' strings in JS (super common) =="
curl -s "$BASE$JS" | grep -Eo "Missing host|Missing shop|Invalid host|host is required|shop is required|Not embedded|App Bridge" | head -n 60 || true
echo

echo "✅ Forensics complete."
