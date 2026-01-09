#!/usr/bin/env bash
set -euo pipefail

FILE="abando-frontend/app/page.tsx"
TS="$(date +%Y%m%d_%H%M%S)"

cp "$FILE" "$FILE.bak_$TS"

cat << 'TSX' > "$FILE"
export default function Page() {
  return (
    <html>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: 'window.location.replace("/embedded?embedded=1")'
          }}
        />
      </body>
    </html>
  );
}
TSX

echo "✅ Next root now client-redirects safely"
