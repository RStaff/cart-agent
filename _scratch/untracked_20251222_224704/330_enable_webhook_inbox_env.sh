#!/usr/bin/env bash
set -euo pipefail

ROOT_ENV=".env"
WEB_ENV="web/.env"
INBOX_PATH="web/.abando_webhook_inbox.jsonl"
TS="$(date +%s)"

mkdir -p "$(dirname "$INBOX_PATH")"
touch "$INBOX_PATH"

write_kv () {
  local file="$1"
  local key="$2"
  local val="$3"
  touch "$file"
  [[ -f "$file" ]] && cp "$file" "$file.bak_${TS}" || true

  # remove existing key line (no sed -i)
  perl -i -ne "next if /^\\Q${key}\\E=/; print;" "$file"
  echo "${key}=${val}" >> "$file"
}

echo "🧩 Enabling inbox logging in $ROOT_ENV and $WEB_ENV ..."
write_kv "$ROOT_ENV" "ABANDO_EVENT_INBOX" "1"
write_kv "$WEB_ENV"  "ABANDO_EVENT_INBOX" "1"
write_kv "$ROOT_ENV" "ABANDO_EVENT_INBOX_PATH" "\$PWD/${INBOX_PATH}"
write_kv "$WEB_ENV"  "ABANDO_EVENT_INBOX_PATH" "\$PWD/${INBOX_PATH}"

echo "✅ Enabled."
echo "🧾 Backups: ${ROOT_ENV}.bak_${TS} and ${WEB_ENV}.bak_${TS}"
echo "📥 Inbox path: $INBOX_PATH"
