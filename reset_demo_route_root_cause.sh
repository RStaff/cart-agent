#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Root-cause reset of /demo/playground route…"

cd ~/projects/cart-agent/abando-frontend

# 1) Backup any existing demo folders
ts=$(date +%Y%m%d_%H%M%S)
backup_dir="demo_playground_backup_${ts}"

mkdir -p "${backup_dir}"

if [ -d app/demo/playground ]; then
  echo "🛟 Backing up app/demo/playground -> ${backup_dir}/app_demo_playground"
  cp -R app/demo/playground "${backup_dir}/app_demo_playground"
fi

if [ -d src/app/demo/playground ]; then
  echo "🛟 Backing up src/app/demo/playground -> ${backup_dir}/src_app_demo_playground"
  cp -R src/app/demo/playground "${backup_dir}/src_app_demo_playground"
fi

# 2) Remove ALL existing demo/playground implementations
echo "🧹 Removing existing demo/playground routes…"
rm -rf app/demo/playground
rm -rf src/app/demo/playground

# Ensure parent folders exist
mkdir -p src/app/demo/playground

# 3) Write ONE canonical static, styled page at src/app/demo/playground/page.tsx
cat <<'TSX' > src/app/demo/playground/page.tsx
// Canonical static, styled Abando demo page – no Client component, no API calls.

export const dynamic = "force-static";

export default function PlaygroundPage() {
  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    margin: 0,
    padding: "40px 16px",
    backgroundColor: "#020617", // slate-950
    color: "#e5e7eb",           // slate-200
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  };

  const containerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "960px",
    borderRadius: "18px",
    border: "1px solid #1f2937", // slate-800
    background: "rgba(15,23,42,0.9)", // slate-900
    padding: "24px 24px 28px",
    boxShadow: "0 24px 60px rgba(0,0,0,0.65)",
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: "20px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: 700,
    letterSpacing: "-0.03em",
    margin: 0,
    marginBottom: "6px",
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "#94a3b8", // slate-400
    margin: 0,
  };

  const smallTextStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "#cbd5f5",
    marginTop: "10px",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: 700,
    marginTop: "4px",
    marginBottom: "10px",
  };

  const sectionStyle: React.CSSProperties = {
    borderRadius: "12px",
    border: "1px solid #1f2937",
    background: "rgba(15,23,42,0.85)",
    padding: "14px 16px",
    marginTop: "8px",
    fontSize: "13px",
    lineHeight: 1.5,
  };

  const pillRowStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "6px",
  };

  const pillStyle: React.CSSProperties = {
    fontSize: "11px",
    padding: "4px 8px",
    borderRadius: "999px",
    border: "1px solid #374151", // gray-700
    background: "rgba(15,23,42,0.9)",
  };

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>Abando Merchant Daily Play – Live Demo</h1>
          <p style={subtitleStyle}>
            This playground shows a representative example of the live segments
            and recommendations you&apos;d see inside the Abando merchant
            dashboard.
          </p>
          <p style={smallTextStyle}>
            <span style={{ fontWeight: 600 }}>Store ID or Shopify domain</span>{" "}
            cart-agent-dev.myshopify.com
            <br />
            Tip: use <code>cart-agent-dev.myshopify.com</code> during testing.
          </p>
        </header>

        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Merchant Daily Play</h2>
          <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: 0 }}>
            Store: <code>cart-agent-dev.myshopify.com</code>
          </p>

          <p style={{ marginTop: "10px" }}>
            <strong>Today&apos;s #1 Play</strong>
            <br />
            Show an exit-intent popup with a small first-order incentive
            (5–10% off or free shipping).
            <br />
            <span style={{ color: "#9ca3af" }}>
              Channel: ONSITE · Timing: next visit, at exit-intent
            </span>
          </p>

          <p style={{ marginTop: "10px" }}>
            Low-value visitor bounced quickly. A small, time-boxed incentive is
            usually enough to convert curious browsers into first-time buyers
            without eroding margin.
          </p>

          <div style={{ marginTop: "14px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: 4 }}>
              Context for this play
            </div>

            <div style={pillRowStyle}>
              <span style={pillStyle}>Event: browse_only</span>
              <span style={pillStyle}>Segment: low_value</span>
              <span style={pillStyle}>Urgency: normal</span>
              <span style={pillStyle}>Risk: standard</span>
              <span style={pillStyle}>Value: $15.00</span>
              <span style={pillStyle}>Created: 12/3/2025, 12:36:55 PM</span>
            </div>
          </div>

          <div style={{ marginTop: "14px", fontSize: "12px" }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Note</div>
            <div style={{ color: "#9ca3af" }}>
              Mobile visitor bounced quickly after viewing a single product
              page. Test a limited-time incentive before sending them back to
              organic search or social.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
TSX

echo "✅ Wrote canonical static demo at src/app/demo/playground/page.tsx"

echo "🏗  Building frontend…"
npm run build

echo "📦 Commit & push static demo page…"
cd ~/projects/cart-agent
git add abando-frontend/src/app/demo/playground/page.tsx
git add abando-frontend/demo_playground_backup_* || true

git commit -m "Root-cause: replace /demo/playground with single static styled page" || echo "ℹ️ No changes to commit"
git push origin main

echo "✅ Deployed. In the browser, hard-reload:"
echo "   https://app.abando.ai/demo/playground"
echo "   (Cmd+Shift+R or Ctrl+Shift+R)"
