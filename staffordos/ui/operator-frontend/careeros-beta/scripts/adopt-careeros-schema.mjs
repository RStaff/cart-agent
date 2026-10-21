import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Client } from "pg";
import { assertExactCareerOSSchema, readCareerOSSchema } from "./careerosSchemaFingerprint.mjs";

const connectionString = process.env.DATABASE_URL;
const evidencePath = process.env.CAREEROS_ADOPTION_MANIFEST_PATH;
if (!connectionString) throw new Error("DATABASE_URL_REQUIRED");
if (!evidencePath) throw new Error("CAREEROS_ADOPTION_MANIFEST_PATH_REQUIRED");
const evidence = JSON.parse(await readFile(evidencePath, "utf8"));
const { schemaFingerprint: reviewedFingerprint, sourceRevision, reviewedBy, migrationChecksums: supplied } = evidence;
if (evidence.kind !== "REVIEWED_SCHEMA_ADOPTION_EVIDENCE" || !reviewedFingerprint || !sourceRevision || !reviewedBy || !supplied) throw new Error("CAREEROS_ADOPTION_EVIDENCE_INVALID");

const migrationsRoot = new URL("../", import.meta.url);
const migrationIds = [
  "20260816000000_careeros_p0_foundation",
  "20260817000000_careeros_capability_match_product",
  "20260817010000_add_career_story_status",
  "20260817020000_add_opportunity_decision_state",
  "20260818030000_add_resume_drafts",
  "20260820050000_add_career_search_preferences",
  "20260822010000_add_career_fact_context_claims",
  "20260830100000_add_role_intent_and_relevance_feedback",
];
const checksums = {};
for (const id of migrationIds) {
  const sql = await readFile(new URL(`prisma/migrations/${id}/migration.sql`, migrationsRoot), "utf8");
  checksums[id] = createHash("sha256").update(sql, "utf8").digest("hex");
  if (supplied[id] !== checksums[id]) throw new Error(`CAREEROS_MIGRATION_CHECKSUM_REVIEW_MISMATCH:${id}`);
}

const hostname = (() => { try { return new URL(connectionString).hostname; } catch { return ""; } })();
const client = new Client({ connectionString, ssl: ["127.0.0.1", "localhost", "::1"].includes(hostname) ? false : { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", ["careeros-migration-v1"]);
  const schema = await readCareerOSSchema(client);
  assertExactCareerOSSchema(schema);
  if (schema.fingerprint !== reviewedFingerprint) throw new Error(`CAREEROS_REVIEWED_SCHEMA_FINGERPRINT_MISMATCH:${schema.fingerprint}`);
  const existingLedger = await client.query(`SELECT to_regclass('"CareerOSMigration"') AS table_name`);
  const existingAdoption = await client.query(`SELECT to_regclass('"CareerOSMigrationAdoption"') AS table_name`);
  if (existingLedger.rows[0].table_name || existingAdoption.rows[0].table_name) throw new Error("CAREEROS_SCHEMA_ALREADY_ADOPTED");

  await client.query(`CREATE TABLE "CareerOSMigration" (
    "id" TEXT PRIMARY KEY, "checksum" TEXT NOT NULL, "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  await client.query(`CREATE TABLE "CareerOSMigrationAdoption" (
    "id" TEXT PRIMARY KEY, "kind" TEXT NOT NULL, "sourceRevision" TEXT NOT NULL,
    "schemaFingerprint" TEXT NOT NULL, "migrationChecksums" JSONB NOT NULL,
    "reviewedBy" TEXT NOT NULL, "reviewedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  if (process.env.NODE_ENV === "test" && process.env.CAREEROS_ADOPTION_TEST_FAIL_AFTER_LEDGER === "1") {
    throw new Error("CAREEROS_TEST_FAILURE_AFTER_LEDGER");
  }
  for (const id of migrationIds) await client.query(`INSERT INTO "CareerOSMigration" ("id","checksum") VALUES ($1,$2)`, [id, checksums[id]]);
  const adoptionId = `schema-adoption-${createHash("sha256").update(`${sourceRevision}:${reviewedFingerprint}`).digest("hex").slice(0, 24)}`;
  await client.query(`INSERT INTO "CareerOSMigrationAdoption" ("id","kind","sourceRevision","schemaFingerprint","migrationChecksums","reviewedBy") VALUES ($1,$2,$3,$4,$5::jsonb,$6)`, [adoptionId, "REVIEWED_SCHEMA_ADOPTION", sourceRevision, reviewedFingerprint, JSON.stringify(checksums), reviewedBy]);
  await client.query("COMMIT");
  console.log(`CareerOS reviewed schema adoption recorded: ${adoptionId}`);
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally { await client.end(); }
