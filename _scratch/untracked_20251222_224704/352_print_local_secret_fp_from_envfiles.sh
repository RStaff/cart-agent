#!/usr/bin/env bash
set -euo pipefail

pick_secret () {
  local f="$1"
  [[ -f "$f" ]] || return 0
  perl -ne 'if(/^SHOPIFY_API_SECRET=(.*)\s*$/){ print $1; exit 0 }' "$f" || true
}

SECRET="$(pick_secret .env)"
[[ -n "$SECRET" ]] || SECRET="$(pick_secret web/.env)"

if [[ -z "${SECRET:-}" ]]; then
  echo "❌ Could not find SHOPIFY_API_SECRET in .env or web/.env" >&2
  exit 1
fi

FP="$(SECRET="$SECRET" node - <<'NODE'
import * as crypto from "node:crypto";
const s = process.env.SECRET || "";
process.stdout.write(
  crypto.createHash("sha256").update(s, "utf8").digest("hex").slice(0,12)
);
NODE
)"

echo "LOCAL secret_fp = $FP"
