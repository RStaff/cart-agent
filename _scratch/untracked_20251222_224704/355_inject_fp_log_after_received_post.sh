#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }
TS="$(date +%s)"
cp "$FILE" "$FILE.bak_${TS}"

# 0) Clean up common broken leftovers (safe no-ops if absent)
#    - remove any CommonJS require("node:path") (breaks ESM)
perl -0777 -i -pe 's/\n[ \t]*const[ \t]+path[ \t]*=[ \t]*require\("node:path"\);\s*\n/\n/g' "$FILE" || true

#    - remove ANY default import "path" that can conflict (we'll use namespace import)
perl -0777 -i -pe 's/^import\s+path\s+from\s+"node:path";\s*\n//mg' "$FILE" || true

# 1) Ensure ESM-safe namespace imports exist once
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

# 3) Inject debug block right AFTER the existing "received POST /api/webhooks" console.log call
perl -0777 -i -pe '
  if ($_ =~ /ABANDO_WEBHOOK_FP_DEBUG_BEGIN/) { $_ }
  else {
    my $block = qq{
// ABANDO_WEBHOOK_FP_DEBUG_BEGIN
try {
  const fp = abandoSecretFp();
  const raw = String(process.env.ABANDO_EVENT_INBOX_PATH || "");
  const resolved = raw ? abandoPath.resolve(process.cwd(), raw) : "(none)";
  console.log("[abando][SECRET_FP]", fp);
  console.log("[abando][INBOX_ENABLED]", String(process.env.ABANDO_EVENT_INBOX || ""));
  console.log("[abando][INBOX_PATH] cwd=", process.cwd(), "raw=", raw, "resolved=", resolved);
} catch (e) {
  console.log("[abando][FP_DEBUG] failed", e?.message || e);
}
// ABANDO_WEBHOOK_FP_DEBUG_END
};

    # Match the *call* that prints "[webhooks] received POST /api/webhooks" even if it has objects/commas/newlines
    # We capture from "console.log(" up through the first ");" following that message.
    my $re = qr/(console\.log\([\s\S]*?\[webhooks\][\s\S]*?received\s+POST\s+\/api\/webhooks[\s\S]*?\)\s*;)/m;

    if ($_ =~ $re) {
      $_ =~ s/$re/$1\n$block\n/;
      $_
    } else {
      die "❌ Could not find the console.log for '[webhooks] received POST /api/webhooks' in $ARGV\n";
    }
  }
' "$FILE"

echo "✅ Patched $FILE"
echo "🧾 Backup: $FILE.bak_${TS}"
echo "ℹ️ Nodemon should auto-restart (Terminal A). If it doesn’t, type: rs in Terminal A."
