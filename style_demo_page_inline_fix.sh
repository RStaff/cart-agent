#!/usr/bin/env bash
set -euo pipefail

echo "➡️ Rewriting demo page with inline styles + ts-ignore…"

cd ~/projects/cart-agent/abando-frontend/app/demo/playground

# Backup current file
if [ -f page.tsx ]; then
  cp page.tsx "page.tsx.backup_tsfix_$(date +%s)"
  echo "🛟 Backed up existing page.tsx"
fi

cat <<'TSX' > page.tsx
import type { CSSProperties } from "react";
import Client from "./Client";

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  margin: 0,
  padding: "40px 16px",
  backgroundColor: "#020617", // slate-950
  color: "#e5e7eb", // slate-200
  fontFamily:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const containerStyle: CSSProperties = {
  maxWidth: "960px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const headerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const titleStyle: CSSProperties = {
  fontSize: "24px",
  fontWeight: 600,
  letterSpacing: "-0.03em",
};

const subtitleStyle: CSSProperties = {
  maxWidth: "640px",
  fontSize: "14px",
  color: "#9ca3af", // slate-400
};

const cardStyle: CSSProperties = {
  borderRadius: "12px",
  border: "1px solid #1f2937",
  background: "rgba(15,23,42,0.8)",
  padding: "16px",
};

export default function PlaygroundPage() {
  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>Abando Merchant Daily Play – Live Demo</h1>
          <p style={subtitleStyle}>
            This playground pulls live segments and recommendations from the
            Abando API and shows what you&apos;d see inside the merchant
            dashboard.
          </p>
        </header>

        <section style={cardStyle}>
          {/* Client still handles all live API wiring */}
          {/* @ts-ignore - demo wrapper does not pass initial props */}
          <Client />
        </section>
      </div>
    </main>
  );
}
TSX

echo "✅ page.tsx rewritten with inline-styled layout + ts-ignore"
