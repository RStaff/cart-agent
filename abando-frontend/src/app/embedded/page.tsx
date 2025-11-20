"use client";

import React from "react";

export default function EmbeddedAppShell() {
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
      <div style={{ maxWidth: 720, width: "100%" }}>
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
          Abando Embedded App Shell
        </h1>
        <p
          style={{
            fontSize: "0.98rem",
            lineHeight: 1.7,
            opacity: 0.9,
            marginBottom: "1.5rem",
          }}
        >
          If you are seeing this inside your Shopify admin, Abando&apos;s
          embedded app frame is wired correctly in production.
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
          <p style={{ margin: 0, marginBottom: 6, fontWeight: 600 }}>
            Next step (implementation note)
          </p>
          <p style={{ margin: 0, opacity: 0.9 }}>
            This shell is where we&apos;ll render the full merchant dashboard:
            plan selection, AI cart segments, and configuration. For now it
            confirms that{" "}
            <code style={{ fontSize: "0.85em" }}>
              https://app.abando.ai/embedded
            </code>{" "}
            is reachable by Shopify.
          </p>
        </div>

        <p
          style={{
            fontSize: "0.85rem",
            opacity: 0.7,
            marginTop: "1.5rem",
          }}
        >
          If you see this in a standalone browser tab, you can safely close it
          and launch Abando again from your Shopify admin Apps menu.
        </p>
      </div>
    </main>
  );
}
