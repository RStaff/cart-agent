#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(pwd)"
WEB_DIR="$ROOT_DIR/web"
FRONT_DIR="$ROOT_DIR/abando-frontend"

echo "[postinstall] start (root=$ROOT_DIR)"

# --- sanity ---
if [ ! -d "$WEB_DIR" ]; then
  echo "[postinstall] ERROR: web/ missing at $WEB_DIR"
  ls -la "$ROOT_DIR" || true
  exit 2
fi

# prevent sub-install lifecycle scripts from re-triggering postinstall loops
export npm_config_ignore_scripts=true

install_dir() {
  local dir="$1"
  local name="$2"

  echo "[postinstall] install deps: $name ($dir)"

  if [ -f "$dir/package-lock.json" ]; then
    echo "[postinstall] try: npm ci ($name)"
    if ! (cd "$dir" && npm ci --no-audit --no-fund --workspaces=false); then
      echo "[postinstall] WARN: npm ci failed for $name (lock mismatch). Fallback: npm install --package-lock=false"
      (cd "$dir" && npm install --no-audit --no-fund --package-lock=false --workspaces=false)
    fi
  else
    echo "[postinstall] no lockfile for $name; running npm install --package-lock=false"
    (cd "$dir" && npm install --no-audit --no-fund --package-lock=false --workspaces=false)
  fi
}

# --- REQUIRED: web deps (this is where @prisma/client must exist) ---
install_dir "$WEB_DIR" "web"

# --- OPTIONAL: abando-frontend deps ---
if [ -d "$FRONT_DIR" ]; then
  install_dir "$FRONT_DIR" "abando-frontend"
else
  echo "[postinstall] WARN: abando-frontend not found; skipping"
fi

# --- prisma generate (web/) ---
SCHEMA_PATH=""
if [ -f "$WEB_DIR/prisma/schema.prisma" ]; then
  SCHEMA_PATH="$WEB_DIR/prisma/schema.prisma"
elif [ -f "$ROOT_DIR/prisma/schema.prisma" ]; then
  SCHEMA_PATH="$ROOT_DIR/prisma/schema.prisma"
else
  echo "[postinstall] ERROR: could not find schema.prisma"
  ls -la "$WEB_DIR" || true
  ls -la "$WEB_DIR/prisma" || true
  ls -la "$ROOT_DIR/prisma" || true
  exit 2
fi

echo "[postinstall] prisma schema: $SCHEMA_PATH"
echo "[postinstall] running: npx prisma generate (from web/)"
(cd "$WEB_DIR" && npx --yes prisma generate --schema "$SCHEMA_PATH")

echo "[postinstall] done"
