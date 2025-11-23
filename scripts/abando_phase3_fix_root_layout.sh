#!/usr/bin/env bash
set -euo pipefail

echo "=== Abando Phase 3 – Root Layout Fix ==="

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/abando-frontend"
APP_DIR="$FRONTEND/app"

echo "→ Frontend app dir: $APP_DIR"

mkdir -p "$APP_DIR"
cd "$APP_DIR"

if [ -f "layout.tsx" ]; then
  echo "→ Removing auto-generated app/layout.tsx ..."
  rm layout.tsx
else
  echo "→ No app/layout.tsx found (nothing to remove)."
fi

echo "→ Writing clean app/layout.jsx ..."
cat << 'LAYOUT' > layout.jsx
export const metadata = {
  title: "Abando",
  description: "Abando – AI Cart Recovery",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
LAYOUT

echo "✅ app/layout.jsx written."

cd "$FRONTEND"
echo
echo "Current app/ tree (max depth 2):"
find app -maxdepth 2 -type f | sed 's/^/  - /'

echo
echo "=== Root Layout Fix Complete ==="
