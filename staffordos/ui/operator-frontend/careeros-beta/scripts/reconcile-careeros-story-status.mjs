import { readFile } from "node:fs/promises";
import { Client } from "pg";
import { readCareerOSSchema, assertExactCareerOSSchema } from "./careerosSchemaFingerprint.mjs";

const connectionString = process.env.DATABASE_URL;
const expectedLegacyFingerprint = process.env.CAREEROS_LEGACY_SCHEMA_FINGERPRINT;
if (!connectionString) throw new Error("DATABASE_URL_REQUIRED");
if (!expectedLegacyFingerprint) throw new Error("CAREEROS_LEGACY_SCHEMA_FINGERPRINT_REQUIRED");

const hostname = (() => { try { return new URL(connectionString).hostname; } catch { return ""; } })();
const client = new Client({ connectionString, ssl: ["127.0.0.1", "localhost", "::1"].includes(hostname) ? false : { rejectUnauthorized: false } });
const correctionSql = await readFile(new URL("../prisma/migrations/20261021000000_reconcile_existing_story_status/migration.sql", import.meta.url), "utf8");
await client.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", ["careeros-migration-v1"]);
  const ledger = await client.query(`SELECT to_regclass('"CareerOSMigration"') AS table_name`);
  if (ledger.rows[0].table_name) throw new Error("CAREEROS_RECONCILIATION_REQUIRES_UNLEDGERED_SCHEMA");
  const schema = await readCareerOSSchema(client);
  assertExactCareerOSSchema({ ...schema, tables: schema.tables.filter((name) => name !== "CareerOSMigration") });
  if (schema.fingerprint !== expectedLegacyFingerprint) throw new Error(`CAREEROS_LEGACY_SCHEMA_FINGERPRINT_MISMATCH:${schema.fingerprint}`);
  const existing = await client.query(`SELECT data_type,udt_name,is_nullable,COALESCE(column_default,'') AS column_default
    FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='CareerOnboardingState' AND column_name='storyStatus'`);
  if (existing.rowCount === 0) {
    await client.query(correctionSql);
  } else if (existing.rows[0].data_type !== "text" || existing.rows[0].udt_name !== "text" || existing.rows[0].is_nullable !== "NO" || existing.rows[0].column_default !== "'CURRENT_FACTS_REVIEWED'::text") {
    throw new Error("CAREEROS_STORY_STATUS_DEFINITION_MISMATCH");
  }
  await client.query("COMMIT");
  console.log("CareerOS storyStatus reconciliation completed; no ledger or adoption provenance was written.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally { await client.end(); }
