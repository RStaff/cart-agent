#!/usr/bin/env bash
set -e

FILE="app/demo/playground/page.tsx"

echo "🔧 Patching card hover states…"

sed -i '' 's#rounded-3xl border[^"]*#rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6 transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20#g' "$FILE"

echo "✅ Card hover animations improved."
