import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { createRequire } from "node:module";
import { createPostgresHandoffStore } from "../src/handoffStore.mjs";
import { runHandoffMigrations } from "../src/migrations.mjs";

const require = createRequire(import.meta.url);
const { Pool } = require("pg");
const container = `staffordos-handoff-test-${process.pid}`;
const volume = `staffordos-handoff-volume-${process.pid}`;
const password = crypto.randomBytes(32).toString("base64url");
const suppliedUrl = process.env.STAFFORDOS_TEST_POSTGRES_URL || "";
let pool;

function docker(args) {
  const result = spawnSync("docker", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error("ephemeral PostgreSQL Docker operation failed");
  return result.stdout.trim();
}

async function startDatabase() {
  if (suppliedUrl) {
    pool = new Pool({ connectionString: suppliedUrl, connectionTimeoutMillis: 3_000, query_timeout: 3_000, max: 4 });
    await pool.query("SELECT 1");
    return;
  }
  if (spawnSync("docker", ["info"], { stdio: "ignore" }).status !== 0) {
    throw new Error("Docker is required for test:integration");
  }
  docker(["volume", "create", volume]);
  docker(["run", "-d", "--rm", "--name", container, "-e", `POSTGRES_PASSWORD=${password}`, "-e", "POSTGRES_DB=staffordos_handoff_test", "-v", `${volume}:/var/lib/postgresql/data`, "-p", "127.0.0.1::5432", "postgres:16-alpine"]);
  const port = Number(docker(["port", container, "5432/tcp"]).split(":").pop());
  pool = new Pool({ connectionString: `postgres://postgres:${encodeURIComponent(password)}@127.0.0.1:${port}/staffordos_handoff_test`, connectionTimeoutMillis: 3_000, query_timeout: 3_000, max: 4 });
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try { await pool.query("SELECT 1"); return; } catch { await new Promise((resolve) => setTimeout(resolve, 250)); }
  }
  throw new Error("ephemeral PostgreSQL did not become ready");
}

test.after(async () => {
  await pool?.end().catch(() => {});
  if (!suppliedUrl) spawnSync("docker", ["rm", "-f", container], { stdio: "ignore" });
  if (!suppliedUrl) spawnSync("docker", ["volume", "rm", "-f", volume], { stdio: "ignore" });
});

test("PostgreSQL migrations and handoff redemption work across adapter instances", async () => {
  await startDatabase();
  const activeKey = crypto.randomBytes(32).toString("base64url");
  const previousKey = crypto.randomBytes(32).toString("base64url");
  const config = {
    handoffDatabaseUrl: "ephemeral",
    handoffEncryptionKey: activeKey,
    handoffPreviousEncryptionKey: "",
  };
  await runHandoffMigrations(config, { pool });
  await runHandoffMigrations(config, { pool });
  await Promise.all([runHandoffMigrations(config, { pool }), runHandoffMigrations(config, { pool })]);
  const migration = await fs.readFile(new URL("../migrations/001_staffordos_operator_handoff_grants.sql", import.meta.url), "utf8");
  const migrationId = "001_staffordos_operator_handoff_grants.sql";
  const migrationChecksum = crypto.createHash("sha256").update(migration, "utf8").digest("hex");
  await pool.query("UPDATE staffordos_operator_handoff_schema_migrations SET checksum = 'bad' WHERE id = $1", [migrationId]);
  await assert.rejects(runHandoffMigrations(config, { pool }), /handoff_migration_checksum_mismatch/);
  await pool.query("UPDATE staffordos_operator_handoff_schema_migrations SET checksum = $1 WHERE id = $2", [migrationChecksum, migrationId]);

  const storeA = createPostgresHandoffStore(config, { pool });
  const storeB = createPostgresHandoffStore(config, { pool });
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier, "ascii").digest("base64url");
  const makeGrant = async (store, overrides = {}) => store.create({
    code: crypto.randomBytes(24).toString("base64url"),
    jwt: "synthetic-jwt",
    header: { kid: "synthetic" },
    payload: { exp: Math.floor(Date.now() / 1000) + 30 },
    returnTo: "/operator/cockpit",
    browserChallenge: challenge,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30_000).toISOString(),
    ...overrides,
  });
  const grant = await makeGrant(storeA);
  const rows = await pool.query("SELECT code_hash, ciphertext, auth_tag, nonce FROM staffordos_operator_handoff_grants");
  assert.equal(rows.rowCount, 1);
  assert.equal(rows.rows[0].ciphertext.includes("synthetic-jwt"), false);
  assert.equal(rows.rows[0].code_hash.toString("utf8").includes(grant.code), false);
  await assert.rejects(storeB.consume(grant.code, `${verifier}wrong`), /browser_binding_invalid/);
  const redeemed = await storeB.consume(grant.code, verifier);
  assert.equal(redeemed.jwt, "synthetic-jwt");
  await assert.rejects(storeA.consume(grant.code, verifier), /handoff_store|handoff_code/);

  const concurrent = await makeGrant(storeA);
  const concurrentResults = await Promise.allSettled([storeA.consume(concurrent.code, verifier), storeB.consume(concurrent.code, verifier)]);
  assert.equal(concurrentResults.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(concurrentResults.filter((result) => result.status === "rejected").length, 1);

  const expired = await makeGrant(storeA, { expiresAt: new Date(Date.now() - 1_000).toISOString() });
  await assert.rejects(storeB.consume(expired.code, verifier), /handoff_code_expired/);
  assert.equal((await storeA.cleanupExpired(100)).toString() !== "0", true);

  const corrupted = await makeGrant(storeA);
  const corruptedHash = crypto.createHash("sha256").update(corrupted.code, "utf8").digest();
  await pool.query("UPDATE staffordos_operator_handoff_grants SET ciphertext = decode('00', 'hex') WHERE code_hash = $1", [corruptedHash]);
  await assert.rejects(storeB.consume(corrupted.code, verifier), /decrypt_failed/);
  assert.equal((await pool.query("SELECT 1 FROM staffordos_operator_handoff_grants WHERE code_hash = $1", [corruptedHash])).rowCount, 1);
  await pool.query("DELETE FROM staffordos_operator_handoff_grants WHERE code_hash = $1", [corruptedHash]);

  const oldConfig = { ...config, handoffEncryptionKey: previousKey };
  const oldStore = createPostgresHandoffStore(oldConfig, { pool });
  const rotatedGrant = await makeGrant(oldStore);
  const rotatedStore = createPostgresHandoffStore({ ...config, handoffPreviousEncryptionKey: previousKey }, { pool });
  assert.equal((await rotatedStore.consume(rotatedGrant.code, verifier)).jwt, "synthetic-jwt");

  const unexpired = await makeGrant(storeA);
  assert.equal(await storeA.cleanupExpired(100), 0);
  const unexpiredHash = crypto.createHash("sha256").update(unexpired.code, "utf8").digest();
  assert.equal((await pool.query("SELECT 1 FROM staffordos_operator_handoff_grants WHERE code_hash = $1", [unexpiredHash])).rowCount, 1);
  assert.throws(() => createPostgresHandoffStore({ ...config, handoffEncryptionKey: "weak" }, { pool }), /handoff_encryption_key_invalid/);
  assert.throws(() => createPostgresHandoffStore({ ...config, handoffDatabaseUrl: "" }, { pool }), /handoff_database_required/);
  assert.throws(() => createPostgresHandoffStore({ ...config, handoffPreviousEncryptionKey: activeKey }, { pool }), /handoff_encryption_key_duplicate/);
});
