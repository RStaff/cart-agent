import React from "react";

export default function AdminEntry() {
  return (
    <div
      style={{
        minHeight: "100vh",
        margin: 0,
        backgroundColor: "#020617", // slate-950
        color: "#e5e7eb",            // slate-200
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        fontFamily: `system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text",
          "Segoe UI", sans-serif`,
      }}
    >
      <main style={{ maxWidth: "680px", lineHeight: 1.6 }}>
        <p
          style={{
            fontSize: "0.7rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#9ca3af", // slate-400
            marginBottom: "0.75rem",
          }}
        >
          Abando™ for Shopify
        </p>

        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 600,
            marginBottom: "1rem",
          }}
        >
          Abando Admin Entry
        </h1>

        <p style={{ color: "#d1d5db", marginBottom: "0.75rem" }}>
          This subdomain is reserved for Abando&apos;s Shopify embedded app.
          Merchants normally access it from within their Shopify admin, not
          directly.
        </p>

        <p style={{ color: "#d1d5db", marginBottom: "0.75rem" }}>
          To install or manage Abando, open your Shopify admin, go to{" "}
          <span style={{ fontWeight: 600 }}>Apps → Abando</span>, and launch
          the app from there.
        </p>

        <p
          style={{
            fontSize: "0.8rem",
            color: "#9ca3af",
            borderRadius: "0.5rem",
            border: "1px solid #1f2937", // slate-800
            padding: "0.75rem 1rem",
            backgroundColor: "rgba(15, 23, 42, 0.8)", // slate-900/80
            marginTop: "0.75rem",
          }}
        >
          If you&apos;re seeing this page during testing, it confirms that the{" "}
          <code
            style={{
              padding: "0.1rem 0.3rem",
              borderRadius: "0.25rem",
              backgroundColor: "#020617",
              fontFamily: "Menlo, ui-monospace, SFMono-Regular, monospace",
            }}
          >
            /admin-entry
          </code>{" "}
          route is reachable and ready to be wired into Shopify&apos;s embedded
          app flow.
        </p>
      </main>
    </div>
  );
}
