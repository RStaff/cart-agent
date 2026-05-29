import crypto from "node:crypto";
import pg from "pg";

const { Pool } = pg;

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("render.com")
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }

  return pool;
}

export function normalizeStoreDomain(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

function makePacketId(storeDomain) {
  const safeStore = normalizeStoreDomain(storeDomain)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = crypto.randomBytes(5).toString("hex");
  return `packet_${safeStore || "store"}_${suffix}`;
}

function mapPacket(row) {
  if (!row) return null;

  return {
    packet_id: row.packet_id,
    store_domain: row.store_domain,
    payment_reference: row.payment_reference,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    execution_status: row.execution_status,
    proof_status: row.proof_status,
    completion_status: row.completion_status,
  };
}

export async function ensurePacketTable() {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS packets (
      packet_id TEXT PRIMARY KEY,
      store_domain TEXT NOT NULL,
      payment_reference TEXT,
      status TEXT NOT NULL DEFAULT 'prepared',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      execution_status TEXT NOT NULL DEFAULT 'not_started',
      proof_status TEXT NOT NULL DEFAULT 'not_started',
      completion_status TEXT NOT NULL DEFAULT 'not_started'
    )
  `);

  await getPool().query(`
    CREATE INDEX IF NOT EXISTS packets_store_domain_created_at_idx
    ON packets (store_domain, created_at)
  `);

  await getPool().query(`
    CREATE INDEX IF NOT EXISTS packets_payment_reference_idx
    ON packets (payment_reference)
  `);
}

export async function createPacket(input = {}) {
  await ensurePacketTable();

  const storeDomain = normalizeStoreDomain(input.store_domain || input.storeDomain || input.store);
  if (!storeDomain) {
    throw new Error("missing_store_domain");
  }

  const packetId = input.packet_id || input.packetId || makePacketId(storeDomain);
  const paymentReference = input.payment_reference || input.paymentReference || null;
  const status = input.status || (paymentReference ? "payment_pending" : "prepared");

  const result = await getPool().query(
    `
    INSERT INTO packets
      (packet_id, store_domain, payment_reference, status)
    VALUES
      ($1, $2, $3, $4)
    ON CONFLICT (packet_id) DO UPDATE SET
      store_domain = EXCLUDED.store_domain,
      payment_reference = COALESCE(EXCLUDED.payment_reference, packets.payment_reference),
      status = EXCLUDED.status,
      updated_at = NOW()
    RETURNING *
    `,
    [packetId, storeDomain, paymentReference, status],
  );

  return mapPacket(result.rows[0]);
}

export async function getPacket(packetId) {
  await ensurePacketTable();

  const result = await getPool().query(
    `SELECT * FROM packets WHERE packet_id = $1 LIMIT 1`,
    [String(packetId || "").trim()],
  );

  return mapPacket(result.rows[0]);
}

export async function listPackets(input = {}) {
  await ensurePacketTable();

  const storeDomain = normalizeStoreDomain(input.store_domain || input.storeDomain || input.store);
  const result = await getPool().query(
    `
    SELECT *
    FROM packets
    WHERE ($1::text = '' OR store_domain = $1)
    ORDER BY created_at DESC
    LIMIT 50
    `,
    [storeDomain],
  );

  return result.rows.map(mapPacket);
}

export async function bindPacketPayment(input = {}) {
  await ensurePacketTable();

  const packetId = String(input.packet_id || input.packetId || "").trim();
  const storeDomain = normalizeStoreDomain(input.store_domain || input.storeDomain || input.store);
  const paymentReference = String(input.payment_reference || input.paymentReference || "").trim();
  const status = input.status || "payment_received";

  if (!packetId) throw new Error("missing_packet_id");
  if (!storeDomain) throw new Error("missing_store_domain");
  if (!paymentReference) throw new Error("missing_payment_reference");

  const result = await getPool().query(
    `
    INSERT INTO packets
      (packet_id, store_domain, payment_reference, status)
    VALUES
      ($1, $2, $3, $4)
    ON CONFLICT (packet_id) DO UPDATE SET
      store_domain = EXCLUDED.store_domain,
      payment_reference = EXCLUDED.payment_reference,
      status = EXCLUDED.status,
      updated_at = NOW()
    RETURNING *
    `,
    [packetId, storeDomain, paymentReference, status],
  );

  return mapPacket(result.rows[0]);
}

export async function updatePacketLifecycle(packetId, input = {}) {
  await ensurePacketTable();

  const current = await getPacket(packetId);
  if (!current) return null;

  const nextStatus = input.status || current.status;
  const nextExecutionStatus = input.execution_status || input.executionStatus || current.execution_status;
  const nextProofStatus = input.proof_status || input.proofStatus || current.proof_status;
  const nextCompletionStatus = input.completion_status || input.completionStatus || current.completion_status;

  const result = await getPool().query(
    `
    UPDATE packets
    SET
      status = $2,
      execution_status = $3,
      proof_status = $4,
      completion_status = $5,
      updated_at = NOW()
    WHERE packet_id = $1
    RETURNING *
    `,
    [current.packet_id, nextStatus, nextExecutionStatus, nextProofStatus, nextCompletionStatus],
  );

  return mapPacket(result.rows[0]);
}
