#!/bin/bash

TARGET="app/demo/playground/page.tsx"
BACKUP="${TARGET}.bak-$(date +%Y%m%d-%H%M%S)"

echo "[abando] Backing up ${TARGET} -> ${BACKUP}"
cp "$TARGET" "$BACKUP"

INSERT='
<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 rounded-lg border border-emerald-600/40 p-6 bg-emerald-900/10">
  <div>
    <h4 className="text-emerald-300 font-semibold mb-2 text-sm">Raw shopper events</h4>
    <p className="text-emerald-200/80 text-xs">Clicks, searches, add-to-cart actions, pauses.</p>
  </div>

  <div>
    <h4 className="text-emerald-300 font-semibold mb-2 text-sm">Behavior patterns</h4>
    <p className="text-emerald-200/80 text-xs">Abando clusters sessions into hesitation types like Size Checkers, Cart Parkers, and Drop Watchers.</p>
  </div>

  <div>
    <h4 className="text-emerald-300 font-semibold mb-2 text-sm">Automated plays</h4>
    <p className="text-emerald-200/80 text-xs">Each pattern triggers a guided play to recover the order—without guesswork.</p>
  </div>
</div>
'

gsed -i '' "/<\/pre>/a\\
$INSERT
" "$TARGET"

echo "[abando] Pattern transformer block inserted."
