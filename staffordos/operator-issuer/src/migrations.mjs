import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { HandoffStoreError } from "./handoffStore.mjs";

const require = createRequire(import.meta.url);
const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../migrations");
const LOCK_KEY = "staffordos_operator_handoff_schema_v1";

function migrationChecksum(sql) {
  return crypto.createHash("sha256").update(sql, "utf8").digest("hex");
}

async function migrationFiles() {
  const names = (await fs.readdir(MIGRATIONS_DIR)).filter((name) => name.endsWith(".sql")).sort();
  if (!names.length) throw new HandoffStoreError("handoff_migrations_missing", 500);
  return Promise.all(names.map(async (name) => {
    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, name), "utf8");
    return { id: name, checksum: migrationChecksum(sql), sql };
  }));
}

export async function runHandoffMigrations(config, { pool: providedPool = null } = {}) {
  if (typeof config?.handoffDatabaseUrl !== "string" || !config.handoffDatabaseUrl) {
    throw new HandoffStoreError("handoff_database_required", 500);
  }
  const pool = providedPool || (() => {
    const { Pool } = require("pg");
    return new Pool({ connectionString: config.handoffDatabaseUrl, connectionTimeoutMillis: 3_000, query_timeout: 3_000, max: 2 });
  })();
  const files = await migrationFiles();
  const client = await pool.connect().catch(() => { throw new HandoffStoreError("handoff_migrations_unavailable", 503); });
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [LOCK_KEY]);
    await client.query("CREATE TABLE IF NOT EXISTS staffordos_operator_handoff_schema_migrations (id TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL)");
    const applied = await client.query("SELECT id, checksum FROM staffordos_operator_handoff_schema_migrations");
    const byId = new Map(applied.rows.map((row) => [row.id, row.checksum]));
    for (const migration of files) {
      const existing = byId.get(migration.id);
      if (existing && existing !== migration.checksum) throw new HandoffStoreError("handoff_migration_checksum_mismatch", 500);
      if (existing) continue;
      await client.query(migration.sql);
      await client.query("INSERT INTO staffordos_operator_handoff_schema_migrations (id, checksum, applied_at) VALUES ($1, $2, NOW())", [migration.id, migration.checksum]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    if (error instanceof HandoffStoreError) throw error;
    throw new HandoffStoreError("handoff_migrations_failed", 503);
  } finally {
    client.release();
    if (!providedPool) await pool.end().catch(() => {});
  }
}

export const HANDOFF_MIGRATION_LOCK_KEY = LOCK_KEY;
