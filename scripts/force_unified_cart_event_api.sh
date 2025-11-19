#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

node <<'NODE'
const fs = require("fs");
const path = require("path");

const serverPath = path.join(process.cwd(), "api", "server.js");
console.log("📄 Patching", serverPath);

let src = fs.readFileSync(serverPath, "utf8");

// 1) Remove ANY existing /api/cart-event handlers (old or broken)
const before = src;
src = src.replace(/app\.post\("\/api\/cart-event"[\s\S]*?\}\);\s*/g, "");
if (before !== src) {
  console.log("🧹 Removed existing /api/cart-event handlers");
} else {
  console.log("ℹ️ No existing /api/cart-event handlers found to remove");
}

// 2) Ensure classifyCartEvent import in api/server.js
if (!src.includes("classifyCartEvent")) {
  const marker = 'const express = require("express");';
  if (src.includes(marker)) {
    src = src.replace(
      marker,
      marker + '\nconst { classifyCartEvent } = require("./lib/aiLabeler");'
    );
    console.log("➕ Added classifyCartEvent require to api/server.js");
  } else {
    console.log("⚠️ Could not find express require; classifyCartEvent require not injected");
  }
}

// 3) Unified /api/cart-event route with AI labeler
const newRoute = `
/**
 * Unified cart-event ingress for real events + AI labeler.
 * This is what Shopify / your app will POST to.
 */
app.post("/api/cart-event", async (req, res) => {
  try {
    const body = req.body || {};

    const {
      storeId,
      eventType,
      eventSource,
      customerId,
      cartId,
      checkoutId,
      value,
      aiLabel: incomingAiLabel,
      metadata: rawMetadata,
    } = body;

    const finalStoreId = storeId || "unknown-store";
    const finalEventType = eventType || "cart_event";
    const finalEventSource = eventSource || "cart-event-endpoint";

    // Normalized metadata
    const baseMetadata =
      rawMetadata && typeof rawMetadata === "object" ? rawMetadata : {};

    // --- AI label: use incoming if provided, otherwise classify ---
    let finalAiLabel = incomingAiLabel || null;

    try {
      if (!finalAiLabel) {
        finalAiLabel = await classifyCartEvent({
          storeId: finalStoreId,
          eventType: finalEventType,
          eventSource: finalEventSource,
          customerId,
          cartId,
          checkoutId,
          value,
          metadata: baseMetadata,
        });
      }
    } catch (err) {
      console.error(
        "[/api/cart-event] classifyCartEvent error:",
        err && err.message ? err.message : err
      );
      // Do not fail the request if the AI labeler has issues.
    }

    // Attach AI label into metadata so it's always queryable via metadata->'aiLabel'
    const metadataWithAi = {
      ...baseMetadata,
      aiLabel: finalAiLabel || null,
    };

    await logEvent({
      storeId: finalStoreId,
      eventType: finalEventType,
      eventSource: finalEventSource,
      customerId,
      cartId,
      checkoutId,
      value,
      aiLabel: finalAiLabel || null,
      metadata: metadataWithAi,
    });

    res.json({
      ok: true,
      storeId: finalStoreId,
      eventType: finalEventType,
      eventSource: finalEventSource,
      aiLabel: finalAiLabel || null,
    });
  } catch (err) {
    console.error("[/api/cart-event] error:", err);
    res.status(500).json({
      ok: false,
      error: String(err && err.message ? err.message : err),
    });
  }
});
`;

// 4) Insert unified route in a sane place
if (src.includes('app.post("/api/log-test"')) {
  // Place AI route before /api/log-test block
  src = src.replace(
    'app.post("/api/log-test"',
    newRoute + '\n\napp.post("/api/log-test"'
  );
  console.log("🔗 Inserted unified /api/cart-event before /api/log-test");
} else if (src.includes("const PORT =")) {
  // Or before app.listen
  src = src.replace(
    /const PORT =[\s\S]*?app\.listen\([\s\S]*?\);\s*/,
    newRoute + "\n\n$&"
  );
  console.log("🔗 Inserted unified /api/cart-event before app.listen");
} else {
  // Worst-case: append
  src += "\n" + newRoute + "\n";
  console.log("🔗 Appended unified /api/cart-event at end of file");
}

fs.writeFileSync(serverPath, src);
console.log("✅ force_unified_cart_event_api.sh: api/server.js patched");
NODE
