#!/usr/bin/env bash
set -euo pipefail

cd ~/projects/cart-agent/abando-frontend

echo "📁 Working dir: $(pwd)"

#
# 1) Tailwind content globs
#
TAILWIND_FILE="tailwind.config.ts"

if [ -f "$TAILWIND_FILE" ]; then
  TS_BACKUP="tailwind.config.ts.backup_$(date +%Y%m%d_%H%M%S)"
  cp "$TAILWIND_FILE" "$TS_BACKUP"
  echo "🛟 Backed up $TAILWIND_FILE -> $TS_BACKUP"

  node <<'NODE'
const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'tailwind.config.ts');
let src = fs.readFileSync(file, 'utf8');

const desired = `  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],`;

if (src.includes('./app/**/*') && src.includes('./src/**/*')) {
  console.log('✅ Tailwind content globs already include app + src');
} else {
  const replaced = src.replace(/content:\s*\[[\s\S]*?\],/, desired);
  if (replaced === src) {
    console.log('⚠️ Could not find existing content: [...] block; appending desired one.');
    src = src.replace(/export default/, desired + '\n\nexport default');
  } else {
    src = replaced;
  }
  fs.writeFileSync(file, src);
  console.log('✅ Tailwind content globs updated');
}
NODE

else
  echo "⚠️ $TAILWIND_FILE not found (skipping Tailwind patch)"
fi

#
# 2) Ensure layout imports globals.css
#
LAYOUT_FILE="app/layout.tsx"

if [ -f "$LAYOUT_FILE" ]; then
  L_BACKUP="app/layout.tsx.backup_$(date +%Y%m%d_%H%M%S)"
  cp "$LAYOUT_FILE" "$L_BACKUP"
  echo "🛟 Backed up $LAYOUT_FILE -> $L_BACKUP"

  node <<'NODE'
const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'app/layout.tsx');
let src = fs.readFileSync(file, 'utf8');

if (src.includes('globals.css')) {
  console.log('✅ layout.tsx already imports ./globals.css');
} else {
  if (/['"]use client['"]/.test(src.slice(0, 80))) {
    src = src.replace(/(['"]use client['"];?\s*)/, `$1\nimport "./globals.css";\n`);
  } else {
    src = `import "./globals.css";\n` + src;
  }
  fs.writeFileSync(file, src);
  console.log('✅ Added import \"./globals.css\" to layout.tsx');
}
NODE

else
  echo "⚠️ $LAYOUT_FILE not found (skipping layout patch)"
fi

#
# 3) Verify with production build
#
echo "🏗  Running npm run build (production check)…"
npm run build
echo "✅ Build finished"
