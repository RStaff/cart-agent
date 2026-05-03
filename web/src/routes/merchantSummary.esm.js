import pg from "pg";
const { Pool } = pg;

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("render.com")
        ? { rejectUnauthorized: false }
        : undefined
    });
  }
  return pool;
}

export function installMerchantSummary(app) {
  app.get("/api/abando/merchant-summary", async (req, res) => {
    try {
      const shop = String(req.query.shop || "").trim();

      if (!shop) {
        return res.status(400).json({ ok: false, error: "missing_shop" });
      }

      const result = await getPool().query(
        `
        SELECT *
        FROM checkout_event_proofs
        WHERE shop = $1
        ORDER BY created_at DESC
        `,
        [shop]
      );

      const events = result.rows;
      const eventCount = events.length;

      const recoveryStatus =
        eventCount >= 1 ? "ready" : "not_ready";

      return res.json({
        ok: true,
        shop,
        checkoutEventCount: eventCount,
        latestCheckoutEvent: events[0] || null,
        recoveryStatus,
        system: {
          checkout_events: eventCount >= 1,
          recovery_ready: recoveryStatus === "ready"
        }
      });

    } catch (err) {
      console.error("❌ MERCHANT SUMMARY ERROR:", err);
      return res.status(500).json({
        ok: false,
        error: "merchant_summary_failed"
      });
    }
  });
}
