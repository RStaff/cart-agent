#!/usr/bin/env bash
set -euo pipefail

OUT="scripts/81_verify_webhook_db.sh"

cat <<'EOF' > "$OUT"
#!/usr/bin/env bash
set -euo pipefail

SHOP="cart-agent-dev.myshopify.com"
TOPIC="checkouts/update"

echo "🧹 Killing old dev processes on :3000 and :3001..."
lsof -ti tcp:3000 | xargs -r kill -9 || true
lsof -ti tcp:3001 | xargs -r kill -9 || true

echo "🚀 Starting dev stack..."
./scripts/dev.sh "$SHOP" >/dev/null 2>&1 || true

# Extra wait (dev.sh already does this, but just in case)
for port in 3000 3001; do
  for i in {1..40}; do
    if lsof -ti tcp:$port >/dev/null 2>&1; then break; fi
    sleep 0.25
  done
done

echo "📨 Triggering local webhook..."
curl -sS -i -X POST "http://localhost:3000/api/webhooks?shop=${SHOP}&topic=${TOPIC}" \
  -H 'Content-Type: application/json' \
  -d '{"ping":true}' | sed -n '1,12p'

echo
echo "🧾 DB proof (latest AbandoWebhookEvent for shop):"
(
  cd web
  SHOP="$SHOP" node - <<'NODE'
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const shop = process.env.SHOP;
const row = await prisma.abandoWebhookEvent.findFirst({
  where: { shop },
  orderBy: { receivedAt: "desc" },
  select: { id:true, shop:true, topic:true, bytes:true, hmacOk:true, receivedAt:true },
});

console.log(row ? row : "❌ No DB row found for shop=" + shop);
await prisma.$disconnect();
NODE
)

echo
echo "🧪 /api/rescue/real (should reflect DB events):"
curl -fsS "http://localhost:3001/api/rescue/real?shop=${SHOP}" | cat
echo

echo
echo "📄 Last 120 lines of express log:"
tail -n 120 .dev_express.log || true
EOF

chmod +x "$OUT"
echo "✅ Rewrote: $OUT"
echo "▶ Running verify..."
"./$OUT"
