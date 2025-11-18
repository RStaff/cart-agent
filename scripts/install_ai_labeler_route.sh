#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER="$ROOT/api/server.js"

echo "📂 Repo: $ROOT"
echo "📝 Patching: $SERVER"

# Ensure we have the AI labeler require at the top
if ! grep -q "classifyCartEvent" "$SERVER"; then
  perl -0pi -e 's|(const { logEvent } = require\("./lib/eventLogger"\);)|$1\nconst { classifyCartEvent } = require("./lib/aiLabeler");|' "$SERVER"
fi

node << 'NODE'
const fs = require("fs");
const path = require("path");
const serverPath = path.join(process.cwd(), "api", "server.js");

let src = fs.readFileSync(serverPath, "utf8");

const newRoute = `
// ⭐ Unified cart-event ingress for real product events + AI labeler
// This is what Shopify / your app will POST to.
// -----------------------------------------------------------------------------
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

    // Normalized metadata object
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
        console.log("[aiLabeler] classified:", finalAiLabel);
      }
    } catch (err) {
      console.error(
        "[/api/cart-event] classifyCartEvent error:",
        err && err.message ? err.message : err
      );
      // Do NOT fail the request if the AI labeler has issues.
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

// Replace existing /api/cart-event block if present
if (src.includes('app.post("/api/cart-event"')) {
  src = src.replace(
    /\/\/ ⭐ Unified cart-event ingress[\s\S]*?app\.post\("\/api\/cart-event"[\s\S]*?\}\);\s*/,
    newRoute + "\n"
  );
} else {
  // If no existing route, insert before /api/log-test or before app.listen
  if (src.includes('app.post("/api/log-test"')) {
    src = src.replace(
      /\/\/ -----------------------------------------------------------------------------[\s\S]*?app\.post\("\/api\/log-test"/,
      newRoute + "\n\n// -----------------------------------------------------------------------------\n// Optional: keep /api/log-test so your existing test_unified_events.sh works\n// -----------------------------------------------------------------------------\napp.post(\"/api/log-test\""
    );
  } else if (src.includes("const PORT =")) {
    src = src.replace(
      /const PORT =[\s\S]*?app\.listen\([\s\S]*?\);\s*/,
      newRoute + "\n\n$&"
    );
  } else {
    src += "\n" + newRoute + "\n";
  }
}

fs.writeFileSync(serverPath, src);
NODE

echo "✅ install_ai_labeler_route.sh applied."
