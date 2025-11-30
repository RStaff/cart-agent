// file: abando-frontend/app/embedded/page.tsx
import React from "react";

export default function EmbeddedPage() {
  return (
    <main
      style={{
        padding: "1.5rem",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
        Abando – Shopify Embedded App
      </h1>
      <p style={{ maxWidth: 520, lineHeight: 1.5 }}>
        This is the embedded shell for Abando inside the Shopify admin.
        The full cart-recovery controls and merchant settings will live here.
      </p>
      <p style={{ marginTop: "0.75rem", fontSize: "0.9rem", opacity: 0.85 }}>
        Current state: v0.1 shell only. Safe to load and demo without any
        Shopify-specific wiring yet.
      </p>
    </main>
  );
}
