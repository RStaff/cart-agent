#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

TS="$(date +%s)"
cp "$FILE" "$FILE.bak_${TS}"

# 0) If you previously inserted a bad default import, remove it (it can cause duplicate identifiers)
#    We will use namespace imports instead.
perl -i -ne '
  next if /^\s*import\s+path\s+from\s+"node:path";\s*$/;
  next if /^\s*import\s+crypto\s+from\s+"node:crypto";\s*$/;
  print;
' "$FILE"

# 1) Ensure we have ESM namespace imports ONCE (idempotent)
perl -0777 -i -pe '
  my $hasPath   = ($_ =~ /import\s+\*\s+as\s+abandoPath\s+from\s+"node:path";/);
  my $hasCrypto = ($_ =~ /import\s+\*\s+as\s+abandoCrypto\s+from\s+"node:crypto";/);

  if (!$hasPath) {
    if ($_ =~ m/^(import[^\n]*\n)/m) { s/^(import[^\n]*\n)/$1import * as abandoPath from "node:path";\n/m; }
    else { $_ = "import * as abandoPath from \"node:path\";\n" . $_; }
  }
  if (!$hasCrypto) {
    if ($_ =~ m/^(import[^\n]*\n)/m) { s/^(import[^\n]*\n)/$1import * as abandoCrypto from "node:crypto";\n/m; }
    else { $_ = "import * as abandoCrypto from \"node:crypto\";\n" . $_; }
  }
  $_
' "$FILE"

# 2) Inject debug blocks near top (only if not already injected)
perl -0777 -i -pe '
  if ($_ =~ /ABANDO_DEBUG_SECRET_FP_BEGIN/) { $_ }
  else {
    my $ins = qq{
// ABANDO_DEBUG_SECRET_FP_BEGIN
try {
  const secret = String(process.env.SHOPIFY_API_SECRET || "");
  const fp = abandoCrypto.createHash("sha256").update(secret, "utf8").digest("hex").slice(0, 12);
  console.log("[abando][SECRET_FP]", fp);
} catch (e) {
  console.log("[abando][SECRET_FP] failed", e?.message || e);
}
// ABANDO_DEBUG_SECRET_FP_END

// ABANDO_DEBUG_INBOX_PATH_BEGIN
try {
  const raw = String(process.env.ABANDO_EVENT_INBOX_PATH || "");
  const resolved = raw ? abandoPath.resolve(process.cwd(), raw) : "(none)";
  console.log("[abando][INBOX_PATH] cwd=", process.cwd(), "raw=", raw, "resolved=", resolved);
  console.log("[abando][INBOX_ENABLED]", String(process.env.ABANDO_EVENT_INBOX || ""));
} catch (e) {
  console.log("[abando][INBOX_PATH] failed", e?.message || e);
}
// ABANDO_DEBUG_INBOX_PATH_END

};
    # insert after imports block if present, otherwise prepend
    if ($_ =~ m/\A((?:import[^\n]*\n)+)/) {
      s/\A((?:import[^\n]*\n)+)/$1$ins/;
    } else {
      $_ = $ins . $_;
    }
    $_
  }
' "$FILE"

echo "✅ Patched $FILE"
echo "🧾 Backup: $FILE.bak_${TS}"
echo "ℹ️ Nodemon should restart automatically (Terminal A)."
