#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

ROOT="abando-frontend"
if [ ! -d "$ROOT" ]; then
  echo "❌ Missing abando-frontend/ at repo root."
  exit 1
fi

# Candidates (App Router first, then Pages Router)
CANDIDATES=(
  "$ROOT/app/embedded/page.tsx"
  "$ROOT/app/embedded/page.jsx"
  "$ROOT/pages/embedded.tsx"
  "$ROOT/pages/embedded.jsx"
)

TARGET=""
for f in "${CANDIDATES[@]}"; do
  if [ -f "$f" ]; then TARGET="$f"; break; fi
done

# If none exist, create App Router file
if [ -z "$TARGET" ]; then
  mkdir -p "$ROOT/app/embedded"
  TARGET="$ROOT/app/embedded/page.tsx"
  echo "⚠️ No existing embedded page found. Creating: $TARGET"
else
  echo "✅ Found embedded page: $TARGET"
fi

# Backup if present
if [ -f "$TARGET" ]; then
  cp "$TARGET" "$TARGET.bak_$(date +%s)" || true
fi

cat > "$TARGET" <<'PAGE'
/**
 * Embedded App Home (MVP)
 * - Shows billing status + gating immediately after install/purchase.
 * - Requires ?shop=your-store.myshopify.com
 */
export const dynamic = "force-dynamic";

type BillingStatus = {
  shop: string;
  plan: string;
  active: boolean;
  trial?: boolean;
  can_auto_rescue: boolean;
  can_send_messages: boolean;
  needs_subscription: boolean;
  source?: string;
};

async function getStatus(shop: string): Promise<BillingStatus | null> {
  try {
    const base = process.env.API_BASE_URL || "http://localhost:3000";
    const url = `${base}/api/billing/status?shop=${encodeURIComponent(shop)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as BillingStatus;
  } catch {
    return null;
  }
}

export default async function EmbeddedPage({
  searchParams,
}: {
  searchParams: { shop?: string };
}) {
  const shop = (searchParams?.shop || "").trim();
  const status = shop ? await getStatus(shop) : null;

  return (
    <main style={{ maxWidth: 860, margin: "40px auto", padding: "0 16px", fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: 8 }}>Abando — Embedded Dashboard</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        {shop ? <>Shop: <b>{shop}</b></> : <>Missing <code>?shop=</code> in URL</>}
      </p>

      {!shop && (
        <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 10 }}>
          <p style={{ marginTop: 0 }}>
            Add <code>?shop=example.myshopify.com</code> to the URL.
          </p>
          <code>/embedded?shop=example.myshopify.com</code>
        </div>
      )}

      {shop && !status && (
        <div style={{ padding: 16, border: "1px solid #f2c037", borderRadius: 10 }}>
          <b>Cannot reach billing status API.</b>
          <div style={{ marginTop: 8, opacity: 0.85 }}>
            Expected Express on <code>http://localhost:3000</code> and route <code>/api/billing/status</code>.
          </div>
        </div>
      )}

      {status && (
        <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", rowGap: 8 }}>
            <div><b>Plan</b></div><div>{status.plan}</div>
            <div><b>Active</b></div><div>{String(status.active)}</div>
            <div><b>Needs subscription</b></div><div>{String(status.needs_subscription)}</div>
            <div><b>Can send messages</b></div><div>{String(status.can_send_messages)}</div>
            <div><b>Can auto rescue</b></div><div>{String(status.can_auto_rescue)}</div>
            <div><b>Source</b></div><div>{status.source || "unknown"}</div>
          </div>

          <hr style={{ margin: "16px 0" }} />

          {status.active ? (
            <div>
              ✅ <b>Unlocked.</b> Your account is active. Next: connect real events (webhooks) to show “real” metrics.
            </div>
          ) : (
            <div>
              🔒 <b>Locked.</b> Activate via stub billing (dev) or Shopify billing (prod).
            </div>
          )}

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a href={`/demo/playground?shop=${encodeURIComponent(shop)}`} style={{ textDecoration: "underline" }}>
              Open Playground
            </a>
            <a href={`/api/rescue/preview?shop=${encodeURIComponent(shop)}`} style={{ textDecoration: "underline" }}>
              Rescue Preview JSON
            </a>
            <a href={`/api/rescue/real?shop=${encodeURIComponent(shop)}`} style={{ textDecoration: "underline" }}>
              Rescue Real JSON
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
PAGE

echo "✅ Wrote embedded billing dashboard to: $TARGET"
echo "NEXT:"
echo "  We'll run a single command to boot both servers and verify the paid loop + UI."
