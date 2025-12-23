#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

DIR="abando-frontend/app/embeddeded"
FILE="$DIR/page.tsx"

mkdir -p "$DIR"

cat > "$FILE" <<'TSX'
import { redirect } from "next/navigation";

export default async function EmbeddededRedirect({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string }>;
}) {
  const sp = await searchParams;
  const shop = String(sp?.shop || "").trim();

  if (shop) redirect(`/embedded?shop=${encodeURIComponent(shop)}`);
  redirect(`/embedded`);
}
TSX

echo "✅ Added redirect route: $FILE"
echo "NEXT:"
echo "  ./scripts/step5_restart_and_smoke_ui.sh example.myshopify.com"
