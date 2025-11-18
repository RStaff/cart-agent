const { logEvent } = require("./lib/eventLogger");
const { classifyCartEvent } = require("./lib/aiLabeler");
const express = require("express");
const cors = require("cors");

const app = express();

// -----------------------------------------------------------------------------

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

res.json({ ok: true });
  } catch (err) {
    console.error("[/api/cart-event] error:", err);
    res
      .status(500)
      .json({ ok: false, error: String(err.message || err) });
  }
});


// ⭐ Unified cart-event ingress for real product events + AI labeler
// This is what Shopify / your app will POST to.
// -----------------------------------------------------------------------------
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


// -----------------------------------------------------------------------------
// Optional: keep /api/log-test so your existing test_unified_events.sh works
// -----------------------------------------------------------------------------

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


app.post("/api/log-test", async (_req, res) => {
  try {
    await logEvent({
      storeId: "test-store-log",
      eventType: "log_test",
      eventSource: "api/log-test",
      metadata: {
        note: "log-test route hit",
        ts: new Date().toISOString(),
      },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("[log-test] failed:", err);
    res
      .status(500)
      .json({ ok: false, error: "log-test-failed" });
  }
});

// -----------------------------------------------------------------------------
// (Optional) simple /api/test-event for manual hits
// -----------------------------------------------------------------------------
app.post("/api/test-event", async (_req, res) => {
  try {
    await logEvent({
      storeId: "test-store",
      eventType: "test_event",
      eventSource: "backend",
      metadata: { note: "manual test hit" },
    });
    res.json({ ok: true });
  } catch (e) {
    console.error("[/api/test-event] error:", e.message);
    res.status(500).json({ ok: false, error: "test-event-failed" });
  }
});

// -----------------------------------------------------------------------------
// IMPORTANT: bind to Render's port (must be last)
// -----------------------------------------------------------------------------
const PORT = process.env.PORT ? Number(process.env.PORT) : 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("API listening on http://0.0.0.0:" + PORT);
});

