#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
echo "📂 Repo root: $ROOT"

# 1) Figure out which file 'npm start' runs.
#    Strategy: read scripts.start, split by whitespace, take the LAST token
#    that looks like a .js file. If nothing, default to server.js.
ENTRYPOINT_JS="$(node - <<'NODE'
const fs = require("fs");
const path = require("path");

const root = process.cwd();
let entry = "server.js";

try {
  const pkg = require(path.join(root, "package.json"));
  const start = (pkg.scripts && pkg.scripts.start) || "";
  if (start) {
    const parts = start.split(/\s+/).filter(Boolean);
    const jsFile = [...parts].reverse().find(p => p.endsWith(".js"));
    if (jsFile) entry = jsFile;
  }
} catch (e) {
  // fall back to server.js
}

process.stdout.write(entry);
NODE
)"

SERVER_PATH="$ROOT/$ENTRYPOINT_JS"
echo "📝 Backend entrypoint detected: $ENTRYPOINT_JS"

if [ ! -f "$SERVER_PATH" ]; then
  echo "❌ Cannot find backend entrypoint at $SERVER_PATH"
  exit 1
fi

# 2) Ensure lib/aiLabeler.js exists (either root/lib or api/lib already in your repo)
mkdir -p "$ROOT/lib"

if [ -f "$ROOT/lib/aiLabeler.js" ]; then
  echo "✅ lib/aiLabeler.js already exists."
elif [ -f "$ROOT/api/lib/aiLabeler.js" ]; then
  echo "📦 Copying api/lib/aiLabeler.js -> lib/aiLabeler.js"
  cp "$ROOT/api/lib/aiLabeler.js" "$ROOT/lib/aiLabeler.js"
else
  echo "🧠 Creating lib/aiLabeler.js with default heuristics..."
  cat > "$ROOT/lib/aiLabeler.js" <<'JS'
/**
 * Simple heuristics-based AI labeler for cart events.
 * No external API calls — safe to run in any environment.
 */

function basicHeuristics(event) {
  const value = Number(event.value || 0);
  const note =
    (event.metadata && typeof event.metadata.note === "string"
      ? event.metadata.note
      : ""
    ).toLowerCase();

  let segment = "normal";
  if (value >= 200) segment = "high_value";
  else if (value >= 75) segment = "mid_value";

  let urgency = "medium";
  if (note.includes("payment") || note.includes("checkout")) {
    urgency = "high";
  } else if (note.includes("browsing")) {
    urgency = "low";
  }

  let risk = "medium";
  if (note.includes("angry") || note.includes("refund") || note.includes("fraud")) {
    risk = "high";
  } else if (note.includes("curious") || note.includes("just looking")) {
    risk = "low";
  }

  let channelHint = "email";
  if (note.includes("sms") || note.includes("text")) {
    channelHint = "sms";
  } else if (note.includes("whatsapp")) {
    channelHint = "whatsapp";
  }

  return {
    engine: "abando-basic-v0.1",
    segment,
    urgency,
    risk,
    channelHint,
  };
}

async function classifyCartEvent(event) {
  try {
    const base = basicHeuristics(event);
    return {
      ...base,
      version: "0.1.0",
      ts: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[aiLabeler] failed to classify event:", err);
    return {
      engine: "abando-basic-v0.1",
      segment: "unknown",
      urgency: "medium",
      risk: "unknown",
      channelHint: "email",
      error: String(err && err.message ? err.message : err),
      ts: new Date().toISOString(),
    };
  }
}

module.exports = {
  classifyCartEvent,
};
JS
fi

echo "✅ aiLabeler is available at lib/aiLabeler.js"

# 3) Patch the actual backend entrypoint with unified /api/cart-event route
ENTRYPOINT_JS_ENV="$ENTRYPOINT_JS" node - <<'NODE'
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const entry = process.env.ENTRYPOINT_JS_ENV || "server.js";
const serverPath = path.join(root, entry);

console.log("🪛 Patching backend entrypoint:", serverPath);

let src = fs.readFileSync(serverPath, "utf8");

// 3a) Ensure we require the AI labeler
if (!src.includes("aiLabeler")) {
  const requireLine = `const { classifyCartEvent } = require("./lib/aiLabeler");\n`;
  const lines = src.split("\n");
  let insertIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (
      t.startsWith("const ") ||
      t.startsWith("import ") ||
      t.startsWith("'use strict'") ||
      t.startsWith('"use strict"')
    ) {
      insertIdx = i + 1;
    } else if (t.length === 0) {
      insertIdx = i + 1;
    } else {
      break;
    }
  }
  lines.splice(insertIdx, 0, requireLine.trimEnd());
  src = lines.join("\n");
  console.log("➕ Injected classifyCartEvent require into entrypoint");
}

// 3b) Unified /api/cart-event route with AI labeler
const newRoute = `// ⭐ Unified cart-event ingress for real product events + AI labeler
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
});`;

// 3c) Replace existing /api/cart-event or insert it in a sane location
if (src.includes('app.post("/api/cart-event"')) {
  src = src.replace(
    /app\.post\("\/api\/cart-event"[\s\S]*?\}\);\s*/,
    newRoute + "\n"
  );
  console.log("♻️ Replaced existing /api/cart-event route with unified AI-aware version");
} else if (src.includes('app.post("/api/log-test"')) {
  src = src.replace(
    /app\.post\("\/api\/log-test"/,
    newRoute + "\n\napp.post(\"/api/log-test\""
  );
  console.log("➕ Inserted unified /api/cart-event route before /api/log-test");
} else if (src.includes("const PORT =")) {
  src = src.replace(
    /const PORT =[\s\S]*?app\.listen\([\s\S]*?\);\s*/,
    newRoute + "\n\n$&"
  );
  console.log("➕ Inserted unified /api/cart-event route before app.listen");
} else {
  src += "\n\n" + newRoute + "\n";
  console.log("➕ Appended unified /api/cart-event route at end of file");
}

fs.writeFileSync(serverPath, src);
console.log("✅ apply_ai_labeler_to_entrypoint.sh: backend entrypoint patched successfully.");
NODE

