#!/usr/bin/env bash
set -euo pipefail

# Anchor the embedded dashboard copy to the demo:
# - Take a timestamped backup
# - Inject a short "alignment with demo" note near the bottom of the page
# - Safe to run multiple times (idempotent)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FILE="$ROOT_DIR/app/embedded/page.tsx"

if [ ! -f "$FILE" ]; then
  echo "❌ Could not find $FILE"
  exit 1
fi

TS="$(date +%s)"
BACKUP="${FILE}.before_demo_alignment_${TS}"
cp "$FILE" "$BACKUP"
echo "💾 Backup written to: $BACKUP"

node << 'JS'
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "app", "embedded", "page.tsx");
let text = fs.readFileSync(file, "utf8");

// If we've already added the note, do nothing
if (text.includes("This view is designed to line up with what you saw in the Abando demo")) {
  console.log("ℹ️ Demo-alignment note already present. No changes made.");
  process.exit(0);
}

// We’ll inject just before the final </main> so it sits at the bottom of the dashboard.
const marker = "</main>";
const idx = text.lastIndexOf(marker);

if (idx === -1) {
  console.log("⚠️ Could not find </main> in embedded page. No changes made.");
  process.exit(0);
}

const note = `
        <p className="mt-4 text-xs text-slate-400">
          This view is designed to line up with what you saw in the Abando demo
          wherever it makes sense — same patterns, same recovered-orders math —
          but using your real storefront data.
        </p>
`;

const newText = text.slice(0, idx) + note + "\n" + text.slice(idx);
fs.writeFileSync(file, newText, "utf8");
console.log("✅ Added demo-alignment note to app/embedded/page.tsx");
JS

