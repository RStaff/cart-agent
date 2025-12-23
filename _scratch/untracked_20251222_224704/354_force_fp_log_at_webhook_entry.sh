#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }
TS="$(date +%s)"
cp "$FILE" "$FILE.bak_${TS}"

# 0) Remove any old "require is not defined" debug remnants + old [abando][inbox] spam we injected earlier
perl -i -ne '
  next if /\[abando\]\[inbox\]/;
  next if /require\("node:path"\)/;
  print;
' "$FILE"

# 1) Ensure ESM-safe imports exist once (namespace = no collisions)
perl -0777 -i -pe '
  my $hasPath   = ($_ =~ /import\s+\*\s+as\s+abandoPath\s+from\s+"node:path";/);
  my $hasCrypto = ($_ =~ /import\s+\*\s+as\s+abandoCrypto\s+from\s+"node:crypto";/);

  if (!$hasPath) {
    if ($_ =~ m/\A((?:import[^\n]*\n)+)/) { $_ =~ s/\A((?:import[^\n]*\n)+)/$1import * as abandoPath from "node:path";\n/; }
    else { $_ = qq{import * as abandoPath from "node:path";\n} . $_; }
  }
  if (!$hasCrypto) {
    if ($_ =~ m/\A((?:import[^\n]*\n)+)/) { $_ =~ s/\A((?:import[^\n]*\n)+)/$1import * as abandoCrypto from "node:crypto";\n/; }
    else { $_ = qq{import * as abandoCrypto from "node:crypto";\n} . $_; }
  }
  $_
' "$FILE"

# 2) Add helper once
perl -0777 -i -pe '
  if ($_ =~ /ABANDO_SECRET_FP_HELPER_BEGIN/) { $_ }
  else {
    my $helper = qq{

// ABANDO_SECRET_FP_HELPER_BEGIN
function abandoSecretFp() {
  try {
    const secret = String(process.env.SHOPIFY_API_SECRET || "");
    return abandoCrypto.createHash("sha256").update(secret, "utf8").digest("hex").slice(0, 12);
  } catch (e) {
    return "(fp_failed)";
  }
}
// ABANDO_SECRET_FP_HELPER_END

};
    if ($_ =~ m/\A((?:import[^\n]*\n)+)/) { s/\A((?:import[^\n]*\n)+)/$1$helper/; }
    else { $_ = $helper . $_; }
    $_
  }
' "$FILE"

# 3) Inject entry-log block at the top of the /api/webhooks handler (robust multi-pattern)
perl -0777 -i -pe '
  my $block = qq{
// ABANDO_WEBHOOK_ENTRY_DEBUG_BEGIN
try {
  const fp = abandoSecretFp();
  const raw = String(process.env.ABANDO_EVENT_INBOX_PATH || "");
  const resolved = raw ? abandoPath.resolve(process.cwd(), raw) : "(none)";
  console.log("[abando][SECRET_FP]", fp);
  console.log("[abando][INBOX_ENABLED]", String(process.env.ABANDO_EVENT_INBOX || ""));
  console.log("[abando][INBOX_PATH] cwd=", process.cwd(), "raw=", raw, "resolved=", resolved);
} catch (e) {
  console.log("[abando][ENTRY_DEBUG] failed", e?.message || e);
}
// ABANDO_WEBHOOK_ENTRY_DEBUG_END
};

  if ($_ =~ /ABANDO_WEBHOOK_ENTRY_DEBUG_BEGIN/) { $_ }
  else {
    # Try several common handler signatures:
    my $done = 0;

    # Pattern A: router.post("/api/webhooks", ... => { <here> ... })
    $done ||= (s/(router\.post\(\s*["'\'']\/api\/webhooks["'\''][^\{]*\{\s*\n)/$1$block\n/s);

    # Pattern B: app.post("/api/webhooks", ... => { <here> ... })
    $done ||= (s/(app\.post\(\s*["'\'']\/api\/webhooks["'\''][^\{]*\{\s*\n)/$1$block\n/s);

    # Pattern C: export default + router style (still has .post("/api/webhooks"...))
    $done ||= (s/(\.post\(\s*["'\'']\/api\/webhooks["'\''][^\{]*\{\s*\n)/$1$block\n/s);

    if (!$done) {
      die "Could not find a /api/webhooks POST handler signature to patch in $FILE\n";
    }
    $_
  }
' "$FILE"

echo "✅ Patched $FILE"
echo "🧾 Backup: $FILE.bak_${TS}"
echo "ℹ️ Nodemon should auto-restart (Terminal A). If it doesn’t, type: rs in Terminal A."
