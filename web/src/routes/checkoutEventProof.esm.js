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

async function ensureTable() {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS checkout_event_proofs (
      id SERIAL PRIMARY KEY,
      shop TEXT NOT NULL,
      event_type TEXT NOT NULL,
      checkout_token TEXT,
      cart_token TEXT,
      email TEXT,
      source TEXT,
      payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function saveEvent(body = {}) {
  await ensureTable();

  const shop = String(body.shop || "unknown").trim();
  const eventType = String(body.eventType || body.event_type || "checkout_started").trim();
  const checkoutToken = body.checkoutToken || body.checkout_token || null;
  const cartToken = body.cartToken || body.cart_token || null;
  const email = body.email || null;
  const source = body.source || "checkout_event_proof";

  const result = await getPool().query(
    `
    INSERT INTO checkout_event_proofs
      (shop, event_type, checkout_token, cart_token, email, source, payload)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, shop, event_type, checkout_token, cart_token, email, source, created_at
    `,
    [shop, eventType, checkoutToken, cartToken, email, source, body]
  );

  return result.rows[0];
}

export function installCheckoutEventProof(app) {
  app.post("/api/checkout-events", async (req, res) => {
    try {
      const saved = await saveEvent(req.body || {});
      return res.status(200).json({
        ok: true,
        status: "CHECKOUT_EVENT_INGESTED",
        storage: "database",
        event: saved
      });
    } catch (err) {
      console.error("❌ CHECKOUT EVENT PROOF ERROR:", err);
      return res.status(500).json({
        ok: false,
        error: "checkout_event_ingestion_failed"
      });
    }
  });

  app.get("/api/checkout-events/status", async (req, res) => {
    try {
      await ensureTable();

      const shop = String(req.query.shop || "").trim();

      const result = await getPool().query(
        `
        SELECT id, shop, event_type, checkout_token, cart_token, email, source, created_at
        FROM checkout_event_proofs
        WHERE ($1::text = '' OR shop = $1)
        ORDER BY created_at DESC
        LIMIT 10
        `,
        [shop]
      );

      return res.json({
        ok: true,
        storage: "database",
        count: result.rows.length,
        latest: result.rows[0] || null,
        events: result.rows
      });
    } catch (err) {
      console.error("❌ CHECKOUT EVENT STATUS ERROR:", err);
      return res.status(500).json({
        ok: false,
        error: "checkout_event_status_failed"
      });
    }
  });
}
