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
    CREATE TABLE IF NOT EXISTS recovery_actions (
      id SERIAL PRIMARY KEY,
      shop TEXT NOT NULL,
      email TEXT,
      status TEXT,
      source_event_id INT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export function installRecoveryTrigger(app) {
  app.post("/api/recovery/trigger", async (req, res) => {
    try {
      await ensureTable();

      const { shop } = req.body;

      if (!shop) {
        return res.status(400).json({ ok: false, error: "missing_shop" });
      }

      // get latest checkout event
      const eventRes = await getPool().query(
        `
        SELECT * FROM checkout_event_proofs
        WHERE shop = $1
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [shop]
      );

      const event = eventRes.rows[0];

      if (!event) {
        return res.json({
          ok: true,
          triggered: false,
          reason: "no_checkout_event"
        });
      }

      // create recovery action
      const actionRes = await getPool().query(
        `
        INSERT INTO recovery_actions (shop, email, status, source_event_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [shop, event.email, "created", event.id]
      );

      return res.json({
        ok: true,
        triggered: true,
        recoveryStatus: "created",
        action: actionRes.rows[0]
      });

    } catch (err) {
      console.error("❌ RECOVERY TRIGGER ERROR:", err);
      return res.status(500).json({
        ok: false,
        error: "recovery_trigger_failed"
      });
    }
  });
}
