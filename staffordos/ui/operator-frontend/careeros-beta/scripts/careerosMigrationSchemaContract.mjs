import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { readCareerOSSchema } from "./careerosSchemaFingerprint.mjs";

const CONTRACT_URL = new URL("./careerosMigrationSchemaContract.v1.json.gz", import.meta.url);
const structuralFields = ["tables", "columns", "constraints", "indexes", "rewriteRules", "triggers"];

export async function assertAppliedSchemaContract(client, appliedRows, migrationsRoot) {
  if (!appliedRows.length) return;
  const contract = JSON.parse(gunzipSync(await readFile(CONTRACT_URL)).toString("utf8"));
  const migrationChecksums = {};
  for (const row of appliedRows) {
    const sql = await readFile(new URL(`prisma/migrations/${row.id}/migration.sql`, migrationsRoot), "utf8");
    migrationChecksums[row.id] = createHash("sha256").update(sql, "utf8").digest("hex");
    if (contract.migrationChecksums[row.id] !== migrationChecksums[row.id]) {
      throw new Error(`CAREEROS_SCHEMA_CONTRACT_SOURCE_MISMATCH:${row.id}`);
    }
  }
  const prefix = contract.prefixes.find((entry) => entry.migrationId === appliedRows.at(-1).id);
  if (!prefix || appliedRows.some((row, index) => contract.prefixes[index]?.migrationId !== row.id)) {
    throw new Error("CAREEROS_SCHEMA_CONTRACT_LEDGER_SEQUENCE_MISMATCH");
  }
  const actual = await readCareerOSSchema(client);
  for (const field of structuralFields) {
    if (JSON.stringify(actual[field]) !== JSON.stringify(prefix.structural[field])) {
      throw new Error(`CAREEROS_MIGRATION_APPLIED_SCHEMA_MISMATCH:${field}`);
    }
  }
}
