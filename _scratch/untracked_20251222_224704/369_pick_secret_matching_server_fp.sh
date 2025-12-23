#!/usr/bin/env bash
set -euo pipefail

TUNNEL="${1:-}"
if [[ -z "$TUNNEL" ]]; then
  echo "usage: $0 <TUNNEL_URL>" >&2
  exit 2
fi

DBG_JSON="$(curl -sS "$TUNNEL/__abando/debug-env" || true)"
if [[ -z "$DBG_JSON" ]]; then
  echo "ERR: empty response from $TUNNEL/__abando/debug-env" >&2
  exit 3
fi

SERVER_FP="$(
  DBG_JSON="$DBG_JSON" node -e '
    try {
      const j = JSON.parse(process.env.DBG_JSON || "{}");
      process.stdout.write(String(j.secret_fp || ""));
    } catch (e) {
      process.exit(4);
    }
  '
)"

if [[ -z "$SERVER_FP" ]]; then
  echo "ERR: server secret_fp missing from /__abando/debug-env JSON" >&2
  echo "DBG_JSON=$DBG_JSON" >&2
  exit 4
fi

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

CAND_FILES=( ".env" "web/.env" )
CAND_KEYS=( "SHOPIFY_API_SECRET" "SHOPIFY_API_SECRET_KEY" )

BEST_SECRET=""
BEST_FILE=""
BEST_FP=""

for f in "${CAND_FILES[@]}"; do
  for k in "${CAND_KEYS[@]}"; do
    v="$(pick_key "$f" "$k" || true)"
    [[ -n "$v" ]] || continue

    fp="$(
      SECRET="$v" node -e '
        const crypto = require("node:crypto");
        const s = process.env.SECRET || "";
        process.stdout.write(
          crypto.createHash("sha256").update(s, "utf8").digest("hex").slice(0,12)
        );
      '
    )"

    if [[ "$fp" == "$SERVER_FP" ]]; then
      BEST_SECRET="$v"
      BEST_FILE="$f:$k"
      BEST_FP="$fp"
      break 2
    fi
  done
done

if [[ -z "$BEST_SECRET" ]]; then
  echo "ERR: could not find a local secret matching server secret_fp=$SERVER_FP" >&2
  echo "Tried files: ${CAND_FILES[*]} keys: ${CAND_KEYS[*]}" >&2
  exit 5
fi

cat <<OUT
export ABANDO_SERVER_SECRET_FP="$SERVER_FP"
export ABANDO_MATCHED_SECRET_FP="$BEST_FP"
export ABANDO_MATCHED_SECRET_FILE="$BEST_FILE"
export ABANDO_MATCHED_SECRET="$(printf "%q" "$BEST_SECRET")"
OUT
