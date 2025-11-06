#!/usr/bin/env bash
set -euo pipefail
cyan(){ printf "\033[36m%s\033[0m\n" "$1"; }
ok(){ printf "✓ %s\n" "$1"; }
warn(){ printf "⚠ %s\n" "$1"; }

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
APP="$ROOT/abando-frontend"
cd "$APP" || { echo "Can't cd to $APP"; exit 1; }

cyan "1) Clean up globals.css (remove legacy tokens & gold-as-bg)"
GL="src/app/globals.css"
[ -f "$GL" ] || { echo "Missing $GL"; exit 1; }

# Remove legacy gold tokens if any
perl -0777 -i -pe 's/--gold-primary:.*?;//g; s/--gold-light:.*?;//g; s/--gold-dark:.*?;//g;' "$GL"

# Ensure final gold tokens exist (won't duplicate)
perl -0777 -i -pe '
  if (!/--performance-gold:/s) {
    s/(:root\s*\{)/$1\n  --performance-gold: #D4AF37;\n  --performance-gold-light: #F2D675;\n  --performance-gold-dark: #957526;\n/s;
  }
' "$GL"

# Replace any direct gold backgrounds (including the “visual violation” helper) with outline-only
perl -0777 -i -pe '
  s/background:\s*var\(--performance-gold\)\s*!important;[^\n]*/outline: 3px solid red !important;/g;
  s/background-color:\s*var\(--performance-gold\)\s*!important;[^\n]*/outline: 3px solid red !important;/g;
' "$GL"

ok "globals.css sanitized"

cyan "2) Repo-wide: replace Tailwind amber/yellow & hex-yellow"
FILES=$(git ls-files | grep -E '\.(ts|tsx|css|mdx)$' || true)
for f in $FILES; do
  # Backgrounds -> dark surface
  perl -0777 -i -pe 's/\bbg-(amber|yellow)-[0-9]+\b/bg-slate-800/g' "$f"
  # Text -> gold accent utility (you already have .gold-accent)
  perl -0777 -i -pe 's/\btext-(amber|yellow)-[0-9]+\b/gold-accent/g' "$f"
  # Very bright yellow hexes -> brand gold
  perl -0777 -i -pe 's/#ff[0-9a-fA-F]{2,6}/#D4AF37/g' "$f"
done
ok "Color replacements complete"

cyan "3) Ensure Brand Gold Guard is installed"
mkdir -p scripts
BG="scripts/brand-gold-guard.sh"
if [ ! -f "$BG" ]; then
cat > "$BG" <<'BASH'
#!/usr/bin/env bash
set -euo pipefail
PATTERNS=(
  "bg-yellow-[0-9]+"
  "bg-amber-[0-9]+"
  "text-yellow-[0-9]+"
  "text-amber-[0-9]+"
  "#ff[0-9a-fA-F]{2,6}"
  "\-gold\-primary"
  "--gold-"
  "background:\s*var\(--performance-gold\)"
  "background-color:\s*var\(--performance-gold\)"
)
FAILED=0
while IFS= read -r -d '' f; do
  for rx in "${PATTERNS[@]}"; do
    if grep -InE "$rx" "$f" >/dev/null 2>&1; then
      echo "✗ Gold-Guard: $f matches /$rx/"
      FAILED=1
    fi
  done
done < <(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" -o -name "*.mdx" \) -print0)
[ "$FAILED" -eq 0 ] && echo "✓ Gold-Guard clean" || exit 1
BASH
chmod +x "$BG"
fi

if ! grep -q '"gold:guard"' package.json; then
  node - <<'NODE'
const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json','utf8'));
p.scripts ??= {}; p.scripts["gold:guard"]="scripts/brand-gold-guard.sh";
fs.writeFileSync('package.json', JSON.stringify(p,null,2));
console.log("✓ Added npm script: gold:guard");
NODE
fi

cyan "4) Rebuild, guard, preview"
pkill -f "next start .*4016" 2>/dev/null || true
rm -rf .next
npm ci --ignore-scripts >/dev/null
npm run -s gold:guard
npx next build >/dev/null
( PORT=4016 npx next start >/dev/null 2>&1 & echo $! > .next.pid.gold ); sleep 2
ok "Local preview up: http://localhost:4016"

cyan "5) Smoke routes"
probe(){ curl -sk -o /dev/null -w "%{http_code}" "$1"; }
for u in \
  "http://localhost:4016/" \
  "http://localhost:4016/pricing" \
  "http://localhost:4016/onboarding?trial=1&plan=basic" \
  "http://localhost:4016/demo/playground" \
  "http://localhost:4016/dashboard"
do printf "%-60s → %s\n" "$u" "$(probe "$u")"; done

cyan "6) Commit (no push)"
cd "$ROOT"
git add -A
git commit -m "brand(gold-lock): remove legacy gold; ban gold-as-bg; replace amber/yellow; enforce guard" || true
ok "Committed locally."
