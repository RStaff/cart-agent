#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Missing: $FILE"; exit 1; }

stamp="$(date +%s)"
cp "$FILE" "$FILE.bak_${stamp}"
echo "✅ Backup: $FILE.bak_${stamp}"

perl -0777 -i -pe '
  my $s = $_;

  # 1) Ensure webhooksRouter import exists (ESM)
  if ($s !~ /import\s+webhooksRouter\s+from\s+["\047]\.\/routes\/webhooks\.js["\047]\s*;/) {
    # Insert after the last import ...; at top (best effort)
    if ($s =~ s/(\A(?:\s*import[^\n]*;\s*\n)+)/$1import webhooksRouter from ".\/routes\/webhooks.js";\n/s) {
      # ok
    } else {
      # fallback: prepend
      $s = "import webhooksRouter from \".\/routes\/webhooks.js\";\n" . $s;
    }
  }

  # 2) Mount /api/webhooks if not present
  if ($s !~ /app\.use\(\s*["\047]\/api\/webhooks["\047]\s*,\s*webhooksRouter\s*\)\s*;/) {
    # Prefer to insert before the first app.use(cors()) OR before app.use(express.json()) OR after cookieParser
    if ($s =~ s/(app\.use\(\s*cookieParser\(\)\s*\);\s*\n)/$1app.use("\/api\/webhooks", webhooksRouter);\n/s) {
      # ok
    } elsif ($s =~ s/(app\.use\(\s*cors\(\)\s*\);\s*\n)/app.use("\/api\/webhooks", webhooksRouter);\n$1/s) {
      # ok
    } elsif ($s =~ s/(app\.use\(\s*express\.json\(\)\s*\);\s*\n)/app.use("\/api\/webhooks", webhooksRouter);\n$1/s) {
      # ok
    } else {
      # last resort: mount near top after app is created
      $s =~ s/(const\s+app\s*=\s*express\(\)\s*;\s*\n)/$1app.use("\/api\/webhooks", webhooksRouter);\n/s;
    }
  }

  # 3) Replace global express.json with conditional skip for /api/webhooks
  #    (Prevents raw body from being consumed before HMAC verification)
  if ($s =~ /app\.use\(\s*express\.json\(\)\s*\)\s*;/) {
    $s =~ s/app\.use\(\s*express\.json\(\)\s*\)\s*;/app.use((req, res, next) => {\n  const u = (req.originalUrl || req.url || \"\");\n  if (u.startsWith(\"\\/api\\/webhooks\")) return next();\n  return express.json()(req, res, next);\n});/g;
  }

  $_ = $s;
' "$FILE"

echo "🔍 Sanity check:"
node --check "$FILE"
echo "✅ index.js parses"

echo
echo "🧹 Free ports 3000/3001"
lsof -ti tcp:3000 | xargs -r kill -9 || true
lsof -ti tcp:3001 | xargs -r kill -9 || true

echo
echo "🚀 Restarting dev stack"
./scripts/dev.sh cart-agent-dev.myshopify.com

echo
echo "✅ Listening status:"
lsof -nP -iTCP:3000 -sTCP:LISTEN || true
lsof -nP -iTCP:3001 -sTCP:LISTEN || true

echo
echo "🧪 Validate webhook route exists (should be 401 missing hmac when bypass OFF):"
curl -i http://localhost:3000/api/webhooks -X POST -H "Content-Type: application/json" -d '{}' | sed -n '1,30p' || true

echo
echo "🔎 Tail express log (last 80):"
tail -n 80 .dev_express.log || true

echo
echo "✅ Done."
