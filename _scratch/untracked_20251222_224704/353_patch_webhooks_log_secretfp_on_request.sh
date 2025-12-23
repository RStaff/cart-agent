#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

TS="$(date +%s)"
cp "$FILE" "$FILE.bak_${TS}"

# 1) Remove older debug lines that used require() or the old [abando][inbox] tag
perl -i -ne '
  next if /\[abando\]\[inbox\]/;
  next if /require\("node:path"\)/;
  print;
' "$FILE"

# 2) Ensure ESM imports exist ONCE (namespace imports, zero collision risk)
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

# 3) Inject helper + request log hook ONCE
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

# 4) Insert a log line inside the webhook POST handler.
#    We match the existing log "received POST /api/webhooks" you already see in Terminal A.
perl -0777 -i -pe '
  if ($_ =~ /\[abando\]\[SECRET_FP\]/) { $_ }
  else {
    s/(console\.log\(\s*"\[webhooks\]\s+received\s+POST\s+\/api\/webhooks[^;]*;\s*)/$1\n    try {\n      const fp = abandoSecretFp();\n      const raw = String(process.env.ABANDO_EVENT_INBOX_PATH || \"\");\n      const resolved = raw ? abandoPath.resolve(process.cwd(), raw) : \"(none)\";\n      console.log(\"[abando][SECRET_FP]\", fp);\n      console.log(\"[abando][INBOX_ENABLED]\", String(process.env.ABANDO_EVENT_INBOX || \"\"));\n      console.log(\"[abando][INBOX_PATH] cwd=\", process.cwd(), \"raw=\", raw, \"resolved=\", resolved);\n    } catch (e) {\n      console.log(\"[abando][DEBUG] failed\", e?.message || e);\n    }\n/s;
    $_
  }
' "$FILE"

echo "✅ Patched $FILE"
echo "🧾 Backup: $FILE.bak_${TS}"
echo "ℹ️ Nodemon should auto-restart (Terminal A). If it doesn’t, type: rs (in Terminal A)."
