import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CAREEROS_SCHEMA_FINGERPRINT_VERSION } from "./careerosSchemaFingerprint.mjs";

const source = await readFile(new URL("./start-careeros.mjs", import.meta.url), "utf8");
assert.match(source, /import\s*\{\s*runCareerosMigrations\s*\}\s*from\s*["']\.\/migrate-careeros\.mjs["']/);
assert.match(source, /await\s+runCareerosMigrations\(\)/);
assert.match(source, /spawn\(process\.execPath,\s*\["node_modules\/next\/dist\/bin\/next",\s*"start"\]/);
assert.doesNotMatch(source, /prisma\s+migrate\s+deploy/);
const runbook = await readFile(new URL("../CAREEROS_SCHEMA_ADOPTION_RUNBOOK.md", import.meta.url), "utf8");
assert.ok(runbook.includes("Record the `" + CAREEROS_SCHEMA_FINGERPRINT_VERSION + "` format"));
assert.doesNotMatch(runbook, /Record the `careeros-schema-fingerprint-v2` format alongside the digest/);
console.log("CareerOS startup authority test passed: CareerOSMigration runner gates Next startup; no competing Prisma command.");
