#!/usr/bin/env bash
set -euo pipefail

VALUE="${1:-https://api.abando.ai}"

echo "🌐 Syncing CART_AGENT_API_BASE across:"
echo "   • Local .env.local"
echo "   • Vercel (prod/preview/dev - create if missing)"
echo "   • Render helper (prints dashboard instructions)"
echo "   New value: $VALUE"
echo

# 1) Vercel + local (prod/preview/dev)
./scripts/set_vercel_env.sh CART_AGENT_API_BASE "$VALUE" production
./scripts/set_vercel_env.sh CART_AGENT_API_BASE "$VALUE" preview
./scripts/set_vercel_env.sh CART_AGENT_API_BASE "$VALUE" development

# 2) Render + local (manual dashboard step at the end)
./scripts/set_render_env.sh cart-agent-api CART_AGENT_API_BASE "$VALUE"

echo
echo "✅ Sync script finished."
echo "   • Local .env.local is updated."
echo "   • Vercel envs created if they were missing."
echo "   • Complete the Render dashboard step if prompted above."
