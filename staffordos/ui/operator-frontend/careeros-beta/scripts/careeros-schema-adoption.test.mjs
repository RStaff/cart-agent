import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { Client } from "pg";
import { readCareerOSSchema } from "./careerosSchemaFingerprint.mjs";

const exec = promisify(execFile);
const root = new URL("../", import.meta.url);
const baseUrl = process.env.DATABASE_URL;
if (!baseUrl) throw new Error("DATABASE_URL_REQUIRED_FOR_TEST");
const runner = new URL("./migrate-careeros.mjs", import.meta.url).pathname;
const reconcile = new URL("./reconcile-careeros-story-status.mjs", import.meta.url).pathname;
const adopt = new URL("./adopt-careeros-schema.mjs", import.meta.url).pathname;
const prepare = new URL("./prepare-careeros-adoption-evidence.mjs", import.meta.url).pathname;
const migrationIds = [
  "20260816000000_careeros_p0_foundation", "20260817000000_careeros_capability_match_product",
  "20260817010000_add_career_story_status", "20260817020000_add_opportunity_decision_state",
  "20260818030000_add_resume_drafts", "20260820050000_add_career_search_preferences",
  "20260822010000_add_career_fact_context_claims", "20260830100000_add_role_intent_and_relevance_feedback",
];

function urlFor(database) { const url = new URL(baseUrl); url.pathname = `/${database}`; return url.toString(); }
async function withClient(url, fn) {
  const host = new URL(url).hostname;
  const client = new Client({ connectionString: url, ssl: ["127.0.0.1", "localhost", "::1"].includes(host) ? false : { rejectUnauthorized: false } });
  await client.connect(); try { return await fn(client); } finally { await client.end(); }
}
async function createDatabase(label) { const name = `careeros_adopt_${label}_${Date.now()}`; await withClient(urlFor("postgres"), (c) => c.query(`CREATE DATABASE "${name}"`)); return name; }
async function dropDatabase(name) { await withClient(urlFor("postgres"), (c) => c.query(`DROP DATABASE IF EXISTS "${name}"`)); }
async function runScript(script, url, env = {}) { return exec(process.execPath, [script], { env: { ...process.env, DATABASE_URL: url, ...env } }); }
async function runMigrations(url) { return runScript(runner, url); }
async function checksums() { const result = {}; for (const id of migrationIds) result[id] = (await import("node:crypto")).createHash("sha256").update(await readFile(new URL(`../prisma/migrations/${id}/migration.sql`, import.meta.url), "utf8"), "utf8").digest("hex"); return result; }

const databases = [];
try {
  const db = await createDatabase("observed"); databases.push(db); const url = urlFor(db);
  await runMigrations(url);
  const expected = await withClient(url, (c) => readCareerOSSchema(c));
  await withClient(url, async (c) => { await c.query(`DROP TABLE "CareerOSMigration"`); await c.query(`ALTER TABLE "CareerOnboardingState" DROP COLUMN "storyStatus"`); });
  const legacy = await withClient(url, (c) => readCareerOSSchema(c));
  await assert.rejects(runScript(reconcile, url, { CAREEROS_LEGACY_SCHEMA_FINGERPRINT: "wrong" }), /CAREEROS_LEGACY_SCHEMA_FINGERPRINT_MISMATCH/);
  await runScript(reconcile, url, { CAREEROS_LEGACY_SCHEMA_FINGERPRINT: legacy.fingerprint });
  const corrected = await withClient(url, (c) => readCareerOSSchema(c));
  if (corrected.fingerprint !== expected.fingerprint) {
    for (const key of ["tables", "columns", "constraints", "indexes"]) {
      if (JSON.stringify(corrected[key]) !== JSON.stringify(expected[key])) {
        console.error(`schema mismatch ${key}`);
        const exp = new Set(expected[key].map((row) => JSON.stringify(row)));
        const act = new Set(corrected[key].map((row) => JSON.stringify(row)));
        console.error(JSON.stringify({ expectedOnly: [...exp].filter((row) => !act.has(row)).slice(0, 10), actualOnly: [...act].filter((row) => !exp.has(row)).slice(0, 10) }, null, 2));
      }
    }
  }
  assert.equal(corrected.fingerprint, expected.fingerprint, "correction reproduces reviewed schema");
  const migrationChecksums = await checksums();
  const manifestPath = `${process.env.TMPDIR || "/tmp"}/careeros-adoption-${Date.now()}.json`;
  await runScript(prepare, url, { CAREEROS_ADOPTION_MANIFEST_PATH: manifestPath, CAREEROS_REVIEWED_SOURCE_REVISION: "806ff6ce6b79d347029b3514352da42eab470e09", CAREEROS_REVIEWED_BY: "synthetic-review" });
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const rollbackDb = await createDatabase("rollback"); databases.push(rollbackDb); const rollbackUrl = urlFor(rollbackDb);
  await runMigrations(rollbackUrl);
  const rollbackExpected = await withClient(rollbackUrl, (c) => readCareerOSSchema(c));
  await withClient(rollbackUrl, async (c) => { await c.query(`DROP TABLE "CareerOSMigration"`); await c.query(`ALTER TABLE "CareerOnboardingState" DROP COLUMN "storyStatus"`); });
  const rollbackLegacy = await withClient(rollbackUrl, (c) => readCareerOSSchema(c));
  await runScript(reconcile, rollbackUrl, { CAREEROS_LEGACY_SCHEMA_FINGERPRINT: rollbackLegacy.fingerprint });
  const rollbackCorrected = await withClient(rollbackUrl, (c) => readCareerOSSchema(c));
  const rollbackManifestPath = `${process.env.TMPDIR || "/tmp"}/careeros-adoption-rollback-${Date.now()}.json`;
  await writeFile(rollbackManifestPath, JSON.stringify({ ...manifest, schemaFingerprint: rollbackCorrected.fingerprint }));
  await assert.rejects(runScript(adopt, rollbackUrl, { NODE_ENV: "test", CAREEROS_ADOPTION_TEST_FAIL_AFTER_LEDGER: "1", CAREEROS_ADOPTION_MANIFEST_PATH: rollbackManifestPath }), /CAREEROS_TEST_FAILURE_AFTER_LEDGER/);
  await withClient(rollbackUrl, async (c) => { assert.equal((await c.query(`SELECT to_regclass('"CareerOSMigration"') AS name`)).rows[0].name, null); assert.equal((await c.query(`SELECT to_regclass('"CareerOSMigrationAdoption"') AS name`)).rows[0].name, null); });
  assert.equal(rollbackExpected.fingerprint, expected.fingerprint);
  await runScript(adopt, url, { CAREEROS_ADOPTION_MANIFEST_PATH: manifestPath });
  await runMigrations(url); await runMigrations(url);
  const badManifestPath = `${process.env.TMPDIR || "/tmp"}/careeros-adoption-bad-${Date.now()}.json`;
  await writeFile(badManifestPath, JSON.stringify({ ...manifest, migrationChecksums: { ...migrationChecksums, [migrationIds[0]]: "bad" } }));
  await assert.rejects(runScript(adopt, url, { CAREEROS_ADOPTION_MANIFEST_PATH: badManifestPath }), /CAREEROS_MIGRATION_CHECKSUM_REVIEW_MISMATCH/);
  await withClient(url, async (c) => { assert.equal((await c.query(`SELECT COUNT(*)::int AS n FROM "CareerOSMigration"`)).rows[0].n, 8); assert.equal((await c.query(`SELECT COUNT(*)::int AS n FROM "CareerOSMigrationAdoption"`)).rows[0].n, 1); });
  console.log("CareerOS adoption tests passed: observed-schema correction, fingerprint rejection, atomic adoption, checksum rejection, normal-runner repeat.");
} finally { for (const db of databases) await dropDatabase(db); }
