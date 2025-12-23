#!/usr/bin/env bash
set -euo pipefail

TARGET_FP="${1:-}"
if [[ -z "$TARGET_FP" ]]; then
  echo "usage: $0 <target_secret_fp_12chars>" >&2
  exit 2
fi

echo "Scanning for secrets that hash to fp=$TARGET_FP ..."
echo

# 1) Check common env files explicitly (including hidden / local variants)
CAND_FILES=(
  ".env" ".env.local" ".env.development" ".env.production"
  "web/.env" "web/.env.local" "web/.env.development" "web/.env.production"
  ".shopify.env" ".shopify/.env" ".shopify/.env.local"
)

pick_key () {
  local f="$1" key="$2"
  [[ -f "$f" ]] || return 0
  perl -ne '
    my $k = $ENV{KEY};
    if (/^\s*\Q$k\E\s*=\s*(.*)\s*$/) {
      my $v=$1;
      $v =~ s/^["'\'']//; $v =~ s/["'\'']$//;
      print $v;
      exit 0;
    }
  ' KEY="$key" "$f" 2>/dev/null || true
}

fp_of () {
  SECRET="$1" node -e '
    const crypto=require("node:crypto");
    const s=process.env.SECRET||"";
    process.stdout.write(crypto.createHash("sha256").update(s,"utf8").digest("hex").slice(0,12));
  '
}

for f in "${CAND_FILES[@]}"; do
  for k in SHOPIFY_API_SECRET SHOPIFY_API_SECRET_KEY; do
    v="$(pick_key "$f" "$k" || true)"
    [[ -n "$v" ]] || continue
    fp="$(fp_of "$v")"
    printf "%-28s %-24s fp=%s\n" "$f" "$k" "$fp"
    if [[ "$fp" == "$TARGET_FP" ]]; then
      echo
      echo "✅ MATCH FOUND: $f ($k) fp=$fp"
      exit 0
    fi
  done
done

echo
echo "No match in common env files."
echo

# 2) Ripgrep the repo for assignments and test them
#    (We extract RHS of lines like KEY=VALUE, stripping quotes)
RG_OUT="$(rg -n --hidden --no-ignore-vcs '^\s*SHOPIFY_API_SECRET(_KEY)?\s*=' -S . || true)"
if [[ -z "$RG_OUT" ]]; then
  echo "No SHOPIFY_API_SECRET assignments found by ripgrep either."
  echo
  echo "Likely source: Shopify CLI injected env in the running process (not stored in files)."
  exit 1
fi

echo "Candidates from rg:"
echo "$RG_OUT" | head -n 80
echo

while IFS= read -r line; do
  file="${line%%:*}"
  rest="${line#*:}"
  # rest is: lineno:KEY=VALUE...
  rhs="${rest#*=}"
  rhs="$(printf "%s" "$rhs" | perl -pe 's/^\s+|\s+$//g; s/^["'\'']//; s/["'\'']$//;')"
  [[ -n "$rhs" ]] || continue
  fp="$(fp_of "$rhs")"
  if [[ "$fp" == "$TARGET_FP" ]]; then
    echo "✅ MATCH FOUND via rg: $file :: $rest (fp=$fp)"
    exit 0
  fi
done <<< "$(printf "%s\n" "$RG_OUT")"

echo "No rg-extracted value matched fp=$TARGET_FP"
echo
echo "Likely source: Shopify CLI injected env in the running process (not stored in files)."
exit 1
