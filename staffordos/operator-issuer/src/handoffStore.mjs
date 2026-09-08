import crypto from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const FORMAT = "staffordos_handoff_v1";
const MAX_GRANT_TTL_MS = 60_000;

export class HandoffStoreError extends Error {
  constructor(code, status = 500) { super(code); this.code = code; this.status = status; }
}

function decodeKey(value) {
  if (typeof value !== "string" || value.length !== 43 || value.trim() !== value || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const key = Buffer.from(value, "base64url");
    return key.length === 32 && key.toString("base64url") === value ? key : null;
  } catch { return null; }
}

function keyId(key) { return crypto.createHash("sha256").update(key).digest("hex").slice(0, 16); }
function codeHash(code) { return crypto.createHash("sha256").update(code, "utf8").digest(); }
function aad(grant) { return Buffer.from(JSON.stringify({ v: FORMAT, codeHash: grant.codeHash, browserChallenge: grant.browserChallenge, returnTo: grant.returnTo, expiresAt: grant.expiresAt }), "utf8"); }

function keysFor(config) {
  const active = decodeKey(config.handoffEncryptionKey);
  const previous = config.handoffPreviousEncryptionKey ? decodeKey(config.handoffPreviousEncryptionKey) : null;
  if (!active || (config.handoffPreviousEncryptionKey && !previous)) throw new HandoffStoreError("handoff_encryption_key_invalid");
  if (previous && keyId(active) === keyId(previous)) throw new HandoffStoreError("handoff_encryption_key_duplicate");
  return { active, previous };
}

function encryptGrant(grant, key) {
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(aad(grant));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify({ jwt: grant.jwt, header: grant.header, payload: grant.payload }), "utf8"), cipher.final()]);
  return { ciphertext, authTag: cipher.getAuthTag(), nonce, keyId: keyId(key) };
}

function decryptGrant(row, grant, keys) {
  const key = keys.get(row.key_id);
  if (!key) throw new HandoffStoreError("staffordos_handoff_decrypt_failed", 401);
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, row.nonce);
    decipher.setAAD(aad(grant));
    decipher.setAuthTag(row.auth_tag);
    const value = JSON.parse(Buffer.concat([decipher.update(row.ciphertext), decipher.final()]).toString("utf8"));
    if (!value.jwt || !value.header || !value.payload) throw new Error("invalid");
    return value;
  } catch { throw new HandoffStoreError("staffordos_handoff_decrypt_failed", 401); }
}

export function createPostgresHandoffStore(config, { pool: providedPool = null } = {}) {
  if (typeof config.handoffDatabaseUrl !== "string" || !config.handoffDatabaseUrl) throw new HandoffStoreError("handoff_database_required");
  const encryptionKeys = keysFor(config);
  const pool = providedPool || (() => {
    const { Pool } = require("pg");
    return new Pool({ connectionString: config.handoffDatabaseUrl, connectionTimeoutMillis: 3_000, query_timeout: 3_000, max: 5 });
  })();
  const keyMap = new Map([[keyId(encryptionKeys.active), encryptionKeys.active]]);
  if (encryptionKeys.previous) keyMap.set(keyId(encryptionKeys.previous), encryptionKeys.previous);
  return {
    async create(grant) {
      const hash = codeHash(grant.code);
      const record = { ...grant, codeHash: hash.toString("hex") };
      const encrypted = encryptGrant(record, encryptionKeys.active);
      try {
        await pool.query({ text: `INSERT INTO staffordos_operator_handoff_grants (code_hash,ciphertext,auth_tag,nonce,key_id,browser_challenge,return_to,created_at,expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, values: [hash, encrypted.ciphertext, encrypted.authTag, encrypted.nonce, encrypted.keyId, grant.browserChallenge, grant.returnTo, grant.createdAt, grant.expiresAt], query_timeout: 3_000 });
      } catch { throw new HandoffStoreError("handoff_store_unavailable", 503); }
      return { code: grant.code, expiresAt: grant.expiresAt, returnTo: grant.returnTo };
    },
    async consume(code, browserVerifier, now = new Date()) {
      const client = await pool.connect().catch(() => { throw new HandoffStoreError("handoff_store_unavailable", 503); });
      try {
        await client.query("BEGIN");
        const hash = codeHash(code);
        const result = await client.query({ text: "SELECT code_hash,ciphertext,auth_tag,nonce,key_id,browser_challenge,return_to,created_at,expires_at FROM staffordos_operator_handoff_grants WHERE code_hash=$1 FOR UPDATE", values: [hash], query_timeout: 3_000 });
        const row = result.rows[0];
        if (!row) throw new HandoffStoreError("staffordos_handoff_code_invalid", 401);
        if (new Date(row.expires_at).getTime() <= now.getTime()) throw new HandoffStoreError("staffordos_handoff_code_expired", 401);
        const actual = Buffer.from(crypto.createHash("sha256").update(browserVerifier, "ascii").digest("base64url"), "ascii");
        const expected = Buffer.from(String(row.browser_challenge || ""), "ascii");
        if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) throw new HandoffStoreError("staffordos_handoff_browser_binding_invalid", 401);
        const grant = { codeHash: row.code_hash.toString("hex"), browserChallenge: String(row.browser_challenge), returnTo: row.return_to || "", expiresAt: new Date(row.expires_at).toISOString() };
        const value = decryptGrant(row, grant, keyMap);
        const deleted = await client.query({ text: "DELETE FROM staffordos_operator_handoff_grants WHERE code_hash=$1", values: [hash], query_timeout: 3_000 });
        if (deleted.rowCount !== 1) throw new HandoffStoreError("handoff_store_ambiguous", 503);
        await client.query("COMMIT");
        return { ...value, returnTo: grant.returnTo };
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        if (error instanceof HandoffStoreError) throw error;
        throw new HandoffStoreError("handoff_store_unavailable", 503);
      } finally { client.release(); }
    },
    async cleanupExpired(limit = 100, now = new Date()) {
      // A bounded scheduler or post-create hook may call this; redemption never depends on cleanup.
      if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw new HandoffStoreError("handoff_cleanup_limit_invalid", 500);
      try {
        const result = await pool.query({
          text: "WITH expired AS (SELECT code_hash FROM staffordos_operator_handoff_grants WHERE expires_at <= $1 ORDER BY expires_at LIMIT $2 FOR UPDATE SKIP LOCKED) DELETE FROM staffordos_operator_handoff_grants WHERE code_hash IN (SELECT code_hash FROM expired)",
          values: [now, limit],
          query_timeout: 3_000,
        });
        return result.rowCount;
      } catch { throw new HandoffStoreError("handoff_store_unavailable", 503); }
    },
    async close() { await pool.end(); },
  };
}

export function createInMemoryHandoffStore() {
  const records = new Map();
  return {
    async create(grant) { records.set(grant.code, { ...grant }); return { code: grant.code, expiresAt: grant.expiresAt, returnTo: grant.returnTo }; },
    async consume(code, browserVerifier, now = new Date()) {
      const grant = records.get(code);
      if (!grant) throw new HandoffStoreError("staffordos_handoff_code_invalid", 401);
      if (new Date(grant.expiresAt).getTime() <= now.getTime()) { records.delete(code); throw new HandoffStoreError("staffordos_handoff_code_expired", 401); }
      const expected = grant.browserChallenge;
      const actual = crypto.createHash("sha256").update(browserVerifier, "ascii").digest("base64url");
      if (!expected || actual !== expected) throw new HandoffStoreError("staffordos_handoff_browser_binding_invalid", 401);
      records.delete(code);
      return { jwt: grant.jwt, header: grant.header, payload: grant.payload, returnTo: grant.returnTo };
    },
  };
}

export const HANDOFF_GRANT_MAX_TTL_MS = MAX_GRANT_TTL_MS;
