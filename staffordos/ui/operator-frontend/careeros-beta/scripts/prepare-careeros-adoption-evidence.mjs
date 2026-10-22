import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { Client } from "pg";
import { assertExactCareerOSSchema, assertNoUnexpectedApplicationObjects, CAREEROS_SCHEMA_FINGERPRINT_VERSION, readCareerOSSchema } from "./careerosSchemaFingerprint.mjs";

const exec = promisify(execFile);
const connectionString = process.env.DATABASE_URL;
const outputPath = process.env.CAREEROS_ADOPTION_MANIFEST_PATH;
const reviewedBy = process.env.CAREEROS_REVIEWED_BY;
if (!connectionString) throw new Error("DATABASE_URL_REQUIRED");
if (!outputPath) throw new Error("CAREEROS_ADOPTION_MANIFEST_PATH_REQUIRED");
if (!reviewedBy) throw new Error("CAREEROS_REVIEWED_BY_REQUIRED");
const migrationIds = [
  "20260816000000_careeros_p0_foundation", "20260817000000_careeros_capability_match_product",
  "20260817010000_add_career_story_status", "20260817020000_add_opportunity_decision_state",
  "20260818030000_add_resume_drafts", "20260820050000_add_career_search_preferences",
  "20260822010000_add_career_fact_context_claims", "20260830100000_add_role_intent_and_relevance_feedback",
];
const migrationsRoot = new URL("../", import.meta.url);
const migrationChecksums = {};
for (const id of migrationIds) migrationChecksums[id] = createHash("sha256").update(await readFile(new URL(`prisma/migrations/${id}/migration.sql`, migrationsRoot), "utf8"), "utf8").digest("hex");
const sourceRevision = process.env.CAREEROS_REVIEWED_SOURCE_REVISION || (await exec("git", ["rev-parse", "HEAD"], { cwd: new URL("../", import.meta.url).pathname })).stdout.trim();
const hostname = (() => { try { return new URL(connectionString).hostname; } catch { return ""; } })();
const client = new Client({ connectionString, ssl: ["127.0.0.1", "localhost", "::1"].includes(hostname) ? false : { rejectUnauthorized: false } });
await client.connect();
try {
  const ledger = await client.query(`SELECT to_regclass('"CareerOSMigration"') AS name`);
  const adoption = await client.query(`SELECT to_regclass('"CareerOSMigrationAdoption"') AS name`);
  if (ledger.rows[0].name || adoption.rows[0].name) throw new Error("CAREEROS_SCHEMA_ALREADY_ADOPTED");
  const schema = await readCareerOSSchema(client); assertExactCareerOSSchema(schema); assertNoUnexpectedApplicationObjects(schema);
  await writeFile(outputPath, `${JSON.stringify({ kind: "REVIEWED_SCHEMA_ADOPTION_EVIDENCE", fingerprintVersion: CAREEROS_SCHEMA_FINGERPRINT_VERSION, sourceRevision, reviewedBy, schemaFingerprint: schema.fingerprint, migrationChecksums }, null, 2)}\n`, { flag: "wx" });
  console.log(`CareerOS adoption evidence written: ${outputPath}`);
} finally { await client.end(); }
