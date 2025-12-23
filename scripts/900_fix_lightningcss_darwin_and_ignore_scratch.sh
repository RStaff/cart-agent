#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
STAMP="$(date +%Y%m%d_%H%M%S)"

echo "==[1/6] Ensure scripts dir =="
mkdir -p scripts

echo "==[2/6] Backup key files =="
mkdir -p .backup
cp -f package.json ".backup/package.json.$STAMP.bak" || true
[ -f package-lock.json ] && cp -f package-lock.json ".backup/package-lock.json.$STAMP.bak" || true

echo "==[3/6] Remove darwin-only dep from ROOT package.json (no editor) =="
npm pkg delete dependencies.lightningcss-darwin-arm64 \
  devDependencies.lightningcss-darwin-arm64 \
  optionalDependencies.lightningcss-darwin-arm64 >/dev/null 2>&1 || true

echo "==[4/6] Add ignores (scratch/backups/node_modules) =="
touch .gitignore
# append only if missing
grep -q '^node_modules/$' .gitignore || cat >> .gitignore <<'GIT'
node_modules/
_scratch/
.backup/
**/.backup/
*.bak
*.bak_*
*.backup
*.log
*.pid
GIT

echo "==[5/6] Reinstall clean to regenerate lockfile deterministically =="
rm -rf node_modules package-lock.json
npm install

# If abando-frontend is a real subproject with its own package.json, refresh its lock too
if [ -f abando-frontend/package.json ]; then
  ( cd abando-frontend
    rm -rf node_modules package-lock.json
    npm install
  )
fi

echo "==[6/6] Verification (ignore node_modules) =="
echo "--- package.json occurrences (should be none) ---"
rg -n '"lightningcss-darwin-arm64"' -S --glob '!**/node_modules/**' **/package.json package.json || true

echo "--- lockfile occurrences (OK if present ONLY as optional/platform-specific) ---"
rg -n 'lightningcss-darwin-arm64' -S --glob '!**/node_modules/**' **/package-lock.json package-lock.json || true

echo "DONE."
