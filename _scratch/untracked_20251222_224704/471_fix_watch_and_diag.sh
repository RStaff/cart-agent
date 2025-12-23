#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

mkdir -p scripts

# 1) Create webhook watcher script (missing)
cat > scripts/470_webhook_watch.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1
FILE="web/.abando_webhook_inbox.jsonl"

test -f "$FILE" || { echo "❌ Missing $FILE (no inbox yet)"; exit 1; }

echo "📡 Watching $FILE (Ctrl+C to stop)"
tail -n 0 -f "$FILE"
SH
chmod +x scripts/470_webhook_watch.sh
echo "✅ Created scripts/470_webhook_watch.sh"

# 2) Quick crash diagnosis: show last 120 lines of backend output if present
echo
echo "🔎 Checking current backend listener + likely crash cause..."
lsof -nP -iTCP:3000 -sTCP:LISTEN || echo "ℹ️ nothing listening on :3000 right now"

# If nodemon crashed, the cause is in the terminal scrollback.
# We can't read terminal scrollback, so we scan for common fatal errors in repo.
echo
echo "🔎 Grepping for recent fatal markers in web/ (best-effort):"
grep -RIn --exclude-dir=node_modules --exclude='*.map' -E \
  "EADDRINUSE|SyntaxError:|ReferenceError:|TypeError:|Cannot find module|ERR_MODULE_NOT_FOUND|UnhandledPromiseRejection|listen EACCES" \
  web 2>/dev/null | tail -n 30 || echo "ℹ️ No obvious fatal markers found via grep."

echo
echo "✅ Next actions:"
echo "  1) In ONE terminal, run:  ./scripts/460_dev_single_session.sh   (if you created it) OR just: shopify app dev --reset"
echo "  2) In ANOTHER terminal, run: ./scripts/470_webhook_watch.sh"
echo
echo "If your dev terminal says 'app crashed - waiting for file changes', force restart with:"
echo "  mkdir -p web/lib && touch web/index.js web/lib/.nodemon_restart"
