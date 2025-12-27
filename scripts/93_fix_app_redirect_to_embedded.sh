#!/usr/bin/env bash
set -euo pipefail

TARGET="web/src/index.js"
test -f "$TARGET" || { echo "❌ Missing $TARGET"; exit 1; }

echo "🔒 Backing up $TARGET..."
cp "$TARGET" "$TARGET.bak_$(date +%Y%m%d_%H%M%S)"

# Replace any existing /app redirect to /demo/playground with /embedded
perl -0777 -i -pe '
  s#app\.get\("\/app",\s*\(req,res\)=>\s*res\.redirect\(307,\s*"\/demo\/playground"\)\);#app.get("/app", (req,res)=> res.redirect(307, "/embedded"));#g;
  s#app\.get\("\/app\\\\\/",\s*\(req,res\)=>\s*res\.redirect\(307,\s*"\/demo\/playground"\)\);#app.get("/app/", (req,res)=> res.redirect(307, "/embedded"));#g;
  s#app\.get\("\/app\\\\\/\.\*",\s*\(req,res\)=>\s*res\.redirect\(307,\s*"\/demo\/playground"\)\);#app.get("/app/.*", (req,res)=> res.redirect(307, "/embedded"));#g;
' "$TARGET"

echo "✅ Patched /app redirects to /embedded."
echo "🔎 Current /app lines:"
grep -nE 'app\.get\("?/app' "$TARGET" || true
