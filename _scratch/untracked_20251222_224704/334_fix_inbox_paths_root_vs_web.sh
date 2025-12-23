#!/usr/bin/env bash
set -euo pipefail
TS="$(date +%s)"
ROOT_ENV=".env"
WEB_ENV="web/.env"

write_kv () {
  local file="$1" key="$2" val="$3"
  mkdir -p "$(dirname "$file")"
  touch "$file"
  cp "$file" "$file.bak_${TS}" || true
  perl -i -ne "next if /^\\Q${key}\\E=/; print;" "$file"
  echo "${key}=${val}" >> "$file"
}

echo "🧩 Enabling inbox logging + fixing path resolution..."

write_kv "$ROOT_ENV" "ABANDO_EVENT_INBOX" "1"
write_kv "$WEB_ENV"  "ABANDO_EVENT_INBOX" "1"

# Root env: used by scripts from repo root
write_kv "$ROOT_ENV" "ABANDO_EVENT_INBOX_PATH" "web/.abando_webhook_inbox.jsonl"

# Web env: used by node server whose CWD is usually web/
write_kv "$WEB_ENV"  "ABANDO_EVENT_INBOX_PATH" ".abando_webhook_inbox.jsonl"

mkdir -p web
touch web/.abando_webhook_inbox.jsonl
touch web/.abando_webhook_inbox.jsonl

echo "✅ Done."
echo "🧾 Backups: .env.bak_${TS} and web/.env.bak_${TS}"
echo "📥 Inbox file (repo view): web/.abando_webhook_inbox.jsonl"
