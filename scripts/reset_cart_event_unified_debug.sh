#!/usr/bin/env bash
set -euo pipefail

SERVER_PATH="api/server.js"

if [ ! -f "$SERVER_PATH" ]; then
  echo "❌ api/server.js not found"
  exit 1
fi

node <<'NODE'
const fs = require("fs");
const path = "api/server.js";

let src = fs.readFileSync(path, "utf8");

const marker = 'app.post("/api/cart-event"';
const start = src.indexOf(marker);
if (start === -1) {
  console.error("❌ Could not find /api/cart-event in api/server.js");
  process.exit(1);
}

// Find the opening { of the handler body
let braceStart = src.indexOf("{", start);
if (braceStart === -1) {
  console.error("❌ Could not find opening { for /api/cart-event handler");
  process.exit(1);
}

// Walk forward and match braces to find the end of the handler body
let depth = 0;
let endBodyIndex = -1;
for (let i = braceStart; i < src.length; i++) {
  const ch = src[i];
  if (ch === "{") depth++;
  else if (ch === "}") {
    depth--;
    if (depth === 0) {
      endBodyIndex = i;
      break;
    }
  }
}

if (endBodyIndex === -1) {
  console.error("❌ Failed to find end of /api/cart-event handler body");
  process.exit(1);
}

// Include the following ');' that closes app.post(...)
const afterBody = src.indexOf(");", endBodyIndex);
if (afterBody === -1) {
  console.error("❌ Failed to find closing ');' for /api/cart-event handler");
  process.exit(1);
}
const endIndex = afterBody + 2;

const before = src.slice(0, start);
const after = src.slice(endIndex);

// New, clean unified handler:
// - calls classifyCartEvent (your debug version)
// - embeds aiLabel into metadata
// - returns aiLabel + metadata in the JSON response
const newHandler = `
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

    const baseMetadata =
      rawMetadata && typeof rawMetadata === "object" ? rawMetadata : {};

    let finalAiLabel = incomingAiLabel || null;

    try {
      if (!finalAiLabel) {
        // Use your existing debug classifier in ./api/lib/aiLabeler.js
        const { classifyCartEvent } = require("./lib/aiLabeler");
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
      console.log("[/api/cart-event] classified:", finalAiLabel);
    } catch (err) {
      console.error(
        "[/api/cart-event] classifyCartEvent error:",
        err && err.message ? err.message : err
      );
      // Do NOT fail the request if the AI labeler has issues.
    }

    const metadataWithAi = {
      ...baseMetadata,
      aiLabel: finalAiLabel || null,
    };

    const { logEvent } = require("./lib/eventLogger");

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
      metadata: metadataWithAi,
    });
  } catch (err) {
    console.error(
      "[/api/cart-event] error:",
      err && err.message ? err.message : err
    );
    res.status(500).json({
      ok: false,
      error: String(err && err.message ? err.message : err),
    });
  }
});
`;

const next = before + newHandler + after;
fs.writeFileSync(path, next);
console.log("✅ Rewrote /api/cart-event handler in api/server.js");
NODE
