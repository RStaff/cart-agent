"use client";

import React from "react";

export default function AppRootPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        padding: "2rem",
        backgroundColor: "#050816",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, system-ui, -system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 680, width: "100%" }}>
        <p
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            fontSize: 12,
            opacity: 0.7,
            marginBottom: 8,
          }}
        >
          Abando™ for Shopify
        </p>
        <h1
          style={{
            fontSize: "2.4rem",
            margin: 0,
            marginBottom: "0.75rem",
            fontWeight: 650,
          }}
        >
          Abando Admin Entry
        </h1>
        <p
          style={{
            fontSize: "0.98rem",
            lineHeight: 1.7,
            opacity: 0.9,
            marginBottom: "1.5rem",
          }}
        >
          This subdomain is reserved for Abando&apos;s Shopify embedded app.
          Merchants normally access it from within their Shopify admin, not
          directly.
        </p>
        <div
          style={{
            padding: "1rem 1.25rem",
            borderRadius: 10,
            background:
              "linear-gradient(135deg, rgba(93,63,211,0.22), rgba(8,47,133,0.18))",
            border: "1px solid rgba(148,163,184,0.35)",
            fontSize: "0.9rem",
          }}
        >
          <p style={{ margin: 0 }}>
            To install or manage Abando, open your Shopify admin, go to{" "}
            <strong>Apps → Abando</strong>, and launch the app from there.
          </p>
        </div>
      </div>
    </main>
  );
}
