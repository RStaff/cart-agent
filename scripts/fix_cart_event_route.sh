#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const serverPath = path.resolve(__dirname, '..', 'api', 'server.js');
let src = fs.readFileSync(serverPath, 'utf8');

// 1) Ensure classifyCartEvent import exists
if (!src.includes('const { classifyCartEvent } = require("./lib/aiLabeler");')) {
  src = src.replace(
    'const { logEvent } = require("./lib/eventLogger");',
    'const { logEvent } = require("./lib/eventLogger");\nconst { classifyCartEvent } = require("./lib/aiLabeler");'
  );
}

// 2) Remove ANY existing /api/cart-event handlers
src = src.replace(/\/\/ ⭐ Unified cart-event ingress[\s\S]*?app\.post\("\/api\/cart-event"[\s\S]*?\}\);\s*/g, '');
src = src.replace(/app\.post\("\/api\/cart-event"[\s\S]*?\}\);\s*/g, '');

// 3) Canonical unified route
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

// 4) Insert unified route before /api/log-test if possible, else before app.listen
const logTestMarker = '// -----------------------------------------------------------------------------\n// Optional: keep /api/log-test so your existing test_unified_events.sh works';

if (src.includes(logTestMarker)) {
  src = src.replace(logTestMarker, newRoute + "\n\n" + logTestMarker);
} else if (src.includes("const PORT =")) {
  src = src.replace(
    /const PORT =[\s\S]*?app\.listen\([\s\S]*?\);\s*/,
    newRoute + "\n\n$&"
  );
} else {
  src += "\n" + newRoute + "\n";
}

fs.writeFileSync(serverPath, src);
console.log("✅ fix_cart_event_route.sh applied unified /api/cart-event");
