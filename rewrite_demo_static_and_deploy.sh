#!/usr/bin/env bash
set -euo pipefail

echo "➡️ Rewriting app/demo/playground/page.tsx to static styled demo…"

cd ~/projects/cart-agent/abando-frontend/app/demo/playground

cat <<'TSX' > page.tsx
// Static, styled Abando demo page – no Client, no API calls.
export default function PlaygroundPage() {
  const pageStyle = {
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
  } as const;

  const containerStyle = {
    width: "100%",
    maxWidth: "960px",
    borderRadius: "18px",
    border: "1px solid #1f2937", // slate-800
    background: "rgba(15,23,42,0.9)", // slate-900
    padding: "24px 24px 28px",
    boxShadow: "0 24px 60px rgba(0,0,0,0.65)",
  } as const;

  const headerStyle = {
    marginBottom: "20px",
  } as const;

  const titleStyle = {
    fontSize: "24px",
    fontWeight: 700,
    letterSpacing: "-0.03em",
    margin: 0,
    marginBottom: "6px",
  } as const;

  const subtitleStyle = {
    fontSize: "13px",
    color: "#94a3b8", // slate-400
    margin: 0,
  } as const;

  const smallTextStyle = {
    fontSize: "11px",
    color: "#cbd5f5",
    marginTop: "10px",
  } as const;

  const sectionTitleStyle = {
    fontSize: "16px",
    fontWeight: 700,
    marginTop: "24px",
    marginBottom: "6px",
  } as const;

  const sectionStyle = {
    borderRadius: "12px",
    border: "1px solid #1f2937",
    background: "rgba(15,23,42,0.85)",
    padding: "14px 16px",
    marginTop: "8px",
    fontSize: "13px",
    lineHeight: 1.5,
  } as const;

  const labelStyle = {
    display: "inline-block",
    minWidth: "120px",
    color: "#9ca3af", // gray-400
  } as const;

  const pillRowStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "6px",
  } as const;

  const pillStyle = {
    fontSize: "11px",
    padding: "4px 8px",
    borderRadius: "999px",
    border: "1px solid #374151", // gray-700
    background: "rgba(15,23,42,0.9)",
  } as const;

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

echo "✅ page.tsx written."

echo "🏗  Building frontend…"
cd ~/projects/cart-agent/abando-frontend
npm run build

echo "📦 Commit & push static demo page…"
cd ~/projects/cart-agent
git add abando-frontend/app/demo/playground/page.tsx
git commit -m "Replace demo playground with static styled version" || echo "ℹ️ No changes to commit"
git push origin main

echo "✅ Done. Hard-reload https://app.abando.ai/demo/playground (Cmd+Shift+R)"
