import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Client } from "pg";
import { postgresSslForConnection } from "./careerosConnection.mjs";

const exec = promisify(execFile);
const root = new URL("../", import.meta.url);
const runner = new URL("scripts/migrate-careeros.mjs", root).pathname;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL_REQUIRED_FOR_TEST");

function connectionFor(database) {
  const url = new URL(databaseUrl);
  url.pathname = `/${database}`;
  return url.toString();
}

async function withClient(url, fn) {
  const client = new Client({ connectionString: url, ssl: postgresSslForConnection(url) });
  await client.connect();
  try { return await fn(client); } finally { await client.end(); }
}

async function createDatabase(label) {
  const name = `careeros_test_${label}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  await withClient(connectionFor("postgres"), (client) => client.query(`CREATE DATABASE "${name}"`));
  return name;
}

async function dropDatabase(name) {
  await withClient(connectionFor("postgres"), (client) => client.query(`DROP DATABASE IF EXISTS "${name}"`));
}

async function run(url, migrationsRoot = root) {
  const wrapper = await mkdtemp(join(tmpdir(), "careeros-runner-wrapper-"));
  const modulePath = join(wrapper, "run.mjs");
  const rootPath = new URL(migrationsRoot).href;
  await writeFile(modulePath, `import { runCareerosMigrations } from ${JSON.stringify(new URL("scripts/migrate-careeros.mjs", root).href)}; await runCareerosMigrations({ connectionString: process.env.DATABASE_URL, migrationsRoot: new URL(${JSON.stringify(rootPath)}) });`);
  try {
    return await exec(process.execPath, [modulePath], { env: { ...process.env, DATABASE_URL: url } });
  } finally { await rm(wrapper, { recursive: true, force: true }); }
}

async function expectFailure(url, migrationsRoot = root, pattern) {
  await assert.rejects(run(url, migrationsRoot), pattern);
}

async function count(url, table) {
  return withClient(url, async (client) => {
    const result = await client.query(`SELECT COUNT(*)::int AS count FROM "${table}"`);
    return result.rows[0].count;
  });
}

const databases = [];
try {
  const fresh = await createDatabase("fresh"); databases.push(fresh);
  const freshUrl = connectionFor(fresh);
  await run(freshUrl);
  await run(freshUrl);
  assert.equal(await count(freshUrl, "CareerOSMigration"), 8, "fresh and repeat runs ledger eight migrations");

  for (const [label, mutate, expected] of [
    ["missing-applied-table", async (client) => client.query(`DROP TABLE "CareerSearchPreference" CASCADE`), "CAREEROS_MIGRATION_APPLIED_SCHEMA_MISMATCH:tables"],
    ["missing-applied-column", async (client) => client.query(`ALTER TABLE "CareerOnboardingState" DROP COLUMN "storyStatus"`), "CAREEROS_MIGRATION_APPLIED_SCHEMA_MISMATCH:columns"],
    ["missing-applied-index", async (client) => { const row = (await client.query(`SELECT ix.relname AS indexname, c.relname AS tablename FROM pg_index i JOIN pg_class c ON c.oid=i.indrelid JOIN pg_class ix ON ix.oid=i.indexrelid JOIN pg_namespace n ON n.oid=ix.relnamespace WHERE n.nspname=current_schema() AND c.relname='CareerSearchPreference' AND NOT EXISTS (SELECT 1 FROM pg_constraint k WHERE k.conindid=i.indexrelid) LIMIT 1`)).rows[0]; await client.query(`DROP INDEX "${row.indexname.replaceAll('"', '""')}"`); }, "CAREEROS_MIGRATION_APPLIED_SCHEMA_MISMATCH:indexes"],
    ["missing-applied-constraint", async (client) => { const row = (await client.query(`SELECT constraint_name, table_name FROM information_schema.table_constraints WHERE table_schema=current_schema() AND table_name='CareerResumeDraft' AND constraint_name='CareerResumeDraft_tenantId_fkey'`)).rows[0]; await client.query(`ALTER TABLE "${row.table_name}" DROP CONSTRAINT "${row.constraint_name.replaceAll('"', '""')}"`); }, "CAREEROS_MIGRATION_APPLIED_SCHEMA_MISMATCH:constraints"],
  ]) {
    const database = await createDatabase(label); databases.push(database); const databaseUrl = connectionFor(database);
    await run(databaseUrl);
    await withClient(databaseUrl, mutate);
    await expectFailure(databaseUrl, root, new RegExp(expected));
    await withClient(databaseUrl, async (client) => {
      assert.equal((await client.query(`SELECT COUNT(*)::int AS count FROM "CareerOSMigration"`)).rows[0].count, 8, `${label} preserves ledger`);
    });
  }

  const changedRootPath = await mkdtemp(join(tmpdir(), "careeros-changed-"));
  const changedRoot = pathToFileURL(`${changedRootPath}/`);
  await cp(new URL("../", import.meta.url), changedRootPath, { recursive: true });
  const changedMigration = join(changedRootPath, "prisma/migrations/20260816000000_careeros_p0_foundation/migration.sql");
  await writeFile(changedMigration, `${await readFile(changedMigration, "utf8")}\n-- changed for checksum test\n`);
  await expectFailure(freshUrl, changedRoot, /CAREEROS_MIGRATION_CHECKSUM_MISMATCH/);
  await rm(changedRootPath, { recursive: true, force: true });

  const combinedState = await createDatabase("combined-state"); databases.push(combinedState);
  const combinedStateUrl = connectionFor(combinedState);
  await withClient(combinedStateUrl, async (client) => {
    await client.query(`CREATE TABLE "CareerOSMigration" ("id" TEXT PRIMARY KEY, "checksum" TEXT NOT NULL, "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
    await client.query(`CREATE TABLE "MigrationSentinel" ("id" TEXT PRIMARY KEY)`);
    await client.query(`INSERT INTO "MigrationSentinel" ("id") VALUES ('untouched')`);
    await client.query(`INSERT INTO "CareerOSMigration" ("id", "checksum") VALUES ($1, $2)`, ["20260830100000_add_role_intent_and_relevance_feedback", "incorrect-later-checksum"]);
  });
  await expectFailure(combinedStateUrl, root, /CAREEROS_MIGRATION_CHECKSUM_MISMATCH:20260830100000_add_role_intent_and_relevance_feedback/);
  await withClient(combinedStateUrl, async (client) => {
    assert.equal((await client.query(`SELECT COUNT(*)::int AS count FROM "CareerOSMigration"`)).rows[0].count, 1, "combined missing-earlier/incorrect-later state creates no ledger rows");
    assert.equal((await client.query(`SELECT COUNT(*)::int AS count FROM "MigrationSentinel" WHERE "id"='untouched'`)).rows[0].count, 1, "combined invalid state preserves application data");
    assert.equal((await client.query(`SELECT to_regclass('"CareerUser"') AS table_name`)).rows[0].table_name, null, "combined invalid state applies no missing earlier schema");
  });

  const failed = await createDatabase("resume"); databases.push(failed);
  const failedUrl = connectionFor(failed);
  const brokenRootPath = await mkdtemp(join(tmpdir(), "careeros-broken-"));
  const brokenRoot = pathToFileURL(`${brokenRootPath}/`);
  await cp(new URL("../", import.meta.url), brokenRootPath, { recursive: true });
  const brokenMigration = join(brokenRootPath, "prisma/migrations/20260817000000_careeros_capability_match_product/migration.sql");
  await writeFile(brokenMigration, `${await readFile(brokenMigration, "utf8")}\nTHIS IS INVALID SQL;\n`);
  await expectFailure(failedUrl, brokenRoot, /syntax error|42601|CAREEROS/);
  assert.equal(await count(failedUrl, "CareerOSMigration"), 1, "failed migration leaves only committed predecessor");
  await withClient(failedUrl, async (client) => {
    const result = await client.query(`SELECT to_regclass('"CareerCapabilityAuthority"') AS table_name`);
    assert.equal(result.rows[0].table_name, null, "failed migration rolls back its SQL");
  });
  await withClient(failedUrl, async (client) => {
    await client.query(`CREATE TABLE "CareerRelevanceFeedback" ("id" TEXT PRIMARY KEY)`);
    await client.query(`INSERT INTO "CareerRelevanceFeedback" ("id") VALUES ('partial-ledger-row')`);
  });
  await expectFailure(failedUrl, root, /CAREEROS_MIGRATION_STATE_UNVERIFIED/);
  await withClient(failedUrl, async (client) => {
    assert.equal((await client.query(`SELECT COUNT(*)::int AS count FROM "CareerOSMigration"`)).rows[0].count, 1, "partial-ledger conflict creates no further ledger row");
    assert.equal((await client.query(`SELECT COUNT(*)::int AS count FROM "CareerRelevanceFeedback"`)).rows[0].count, 1, "partial-ledger conflict preserves data");
    await client.query(`DROP TABLE "CareerRelevanceFeedback"`);
  });
  await run(failedUrl);
  assert.equal(await count(failedUrl, "CareerOSMigration"), 8, "correct runner resumes after failure");
  await rm(brokenRootPath, { recursive: true, force: true });

  const indexConflict = await createDatabase("index-conflict"); databases.push(indexConflict);
  const indexConflictUrl = connectionFor(indexConflict);
  const indexBrokenRootPath = await mkdtemp(join(tmpdir(), "careeros-index-broken-"));
  const indexBrokenRoot = pathToFileURL(`${indexBrokenRootPath}/`);
  await cp(new URL("../", import.meta.url), indexBrokenRootPath, { recursive: true });
  const indexBrokenMigration = join(indexBrokenRootPath, "prisma/migrations/20260817000000_careeros_capability_match_product/migration.sql");
  await writeFile(indexBrokenMigration, `${await readFile(indexBrokenMigration, "utf8")}\nTHIS IS INVALID SQL;\n`);
  await expectFailure(indexConflictUrl, indexBrokenRoot, /syntax error|42601|CAREEROS/);
  await withClient(indexConflictUrl, async (client) => {
    await client.query(`CREATE TABLE "IndexNameHost" ("id" INTEGER NOT NULL) PARTITION BY RANGE ("id")`);
    await client.query(`CREATE TABLE "IndexNameHostPart" PARTITION OF "IndexNameHost" FOR VALUES FROM (0) TO (100)`);
    await client.query(`CREATE INDEX "CareerRelevanceFeedback_tenantId_userId_targetRoleNormalized_idx" ON ONLY "IndexNameHost" ("id")`);
  });
  await expectFailure(indexConflictUrl, root, /CAREEROS_MIGRATION_STATE_UNVERIFIED/);
  await withClient(indexConflictUrl, async (client) => {
    assert.equal((await client.query(`SELECT COUNT(*)::int AS count FROM "CareerOSMigration"`)).rows[0].count, 1, "partitioned-index conflict creates no further ledger row");
    assert.equal((await client.query(`SELECT COUNT(*)::int AS count FROM "IndexNameHostPart"`)).rows[0].count, 0, "partitioned-index conflict preserves data");
    await client.query(`DROP TABLE "IndexNameHost" CASCADE`);
  });
  await run(indexConflictUrl);
  await withClient(indexConflictUrl, async (client) => {
    assert.equal((await client.query(`SELECT EXISTS (SELECT 1 FROM pg_class WHERE relkind='i' AND relname LIKE 'CareerRelevanceFeedback_tenantId_userId_targetRoleNormalized%') AS exists`)).rows[0].exists, true, "required index is created after conflict is removed");
  });
  await rm(indexBrokenRootPath, { recursive: true, force: true });

  const constraintConflict = await createDatabase("constraint-conflict"); databases.push(constraintConflict);
  const constraintConflictUrl = connectionFor(constraintConflict);
  const constraintBrokenRootPath = await mkdtemp(join(tmpdir(), "careeros-constraint-broken-"));
  const constraintBrokenRoot = pathToFileURL(`${constraintBrokenRootPath}/`);
  await cp(new URL("../", import.meta.url), constraintBrokenRootPath, { recursive: true });
  const constraintBrokenMigration = join(constraintBrokenRootPath, "prisma/migrations/20260817000000_careeros_capability_match_product/migration.sql");
  await writeFile(constraintBrokenMigration, `${await readFile(constraintBrokenMigration, "utf8")}\nTHIS IS INVALID SQL;\n`);
  await expectFailure(constraintConflictUrl, constraintBrokenRoot, /syntax error|42601|CAREEROS/);
  await withClient(constraintConflictUrl, async (client) => {
    await client.query(`CREATE DOMAIN "ShadowDomain" AS TEXT CONSTRAINT "CareerFactContextClaim_tenantId_fkey" CHECK (VALUE <> '')`);
  });
  await expectFailure(constraintConflictUrl, root, /CAREEROS_MIGRATION_STATE_UNVERIFIED/);
  await withClient(constraintConflictUrl, async (client) => {
    assert.equal((await client.query(`SELECT COUNT(*)::int AS count FROM "CareerOSMigration"`)).rows[0].count, 1, "domain-constraint conflict creates no further ledger row");
    assert.equal((await client.query(`SELECT COUNT(*)::int AS count FROM pg_constraint WHERE conname='CareerFactContextClaim_tenantId_fkey'`)).rows[0].count, 1, "domain constraint remains unchanged");
    await client.query(`DROP DOMAIN "ShadowDomain"`);
  });
  await run(constraintConflictUrl);
  await withClient(constraintConflictUrl, async (client) => {
    assert.equal((await client.query(`SELECT COUNT(*)::int AS count FROM pg_constraint WHERE conname='CareerFactContextClaim_tenantId_fkey'`)).rows[0].count, 1, "required constraint is created after cross-schema conflict is removed");
  });
  await rm(constraintBrokenRootPath, { recursive: true, force: true });

  const ledgerView = await createDatabase("ledger-view"); databases.push(ledgerView);
  const ledgerViewUrl = connectionFor(ledgerView);
  await run(ledgerViewUrl);
  await withClient(ledgerViewUrl, async (client) => {
    const row = (await client.query(`SELECT "id", "checksum" FROM "CareerOSMigration" ORDER BY "id" LIMIT 1`)).rows[0];
    await client.query(`DROP TABLE "CareerOSMigration"`);
    await client.query(`CREATE TABLE "CareerOSMigrationBacking" ("id" TEXT PRIMARY KEY, "checksum" TEXT NOT NULL, "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
    await client.query(`INSERT INTO "CareerOSMigrationBacking" ("id", "checksum") VALUES ($1, $2)`, [row.id, row.checksum]);
    await client.query(`CREATE VIEW "CareerOSMigration" AS SELECT "id", "checksum", "appliedAt" FROM "CareerOSMigrationBacking"`);
  });
  await expectFailure(ledgerViewUrl, root, /CAREEROS_MIGRATION_LEDGER_UNVERIFIED/);
  await withClient(ledgerViewUrl, async (client) => {
    assert.equal((await client.query(`SELECT c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=current_schema() AND c.relname='CareerOSMigration'`)).rows[0].relkind, "v", "unsupported ledger relation remains a view");
    assert.equal((await client.query(`SELECT COUNT(*)::int AS count FROM "CareerOSMigrationBacking"`)).rows[0].count, 1, "view-backed ledger data remains unchanged");
  });

  const concurrent = await createDatabase("concurrent"); databases.push(concurrent);
  const concurrentUrl = connectionFor(concurrent);
  const results = await Promise.allSettled([run(concurrentUrl), run(concurrentUrl)]);
  assert(results.every((result) => result.status === "fulfilled"), "concurrent runners serialize safely");
  assert.equal(await count(concurrentUrl, "CareerOSMigration"), 8);

  const unledgered = await createDatabase("unledgered"); databases.push(unledgered);
  const unledgeredUrl = connectionFor(unledgered);
  await withClient(unledgeredUrl, (client) => client.query(`CREATE TABLE "CareerUser" ("id" TEXT PRIMARY KEY)`));
  await expectFailure(unledgeredUrl, root, /CAREEROS_MIGRATION_STATE_UNVERIFIED/);
  await withClient(unledgeredUrl, async (client) => {
    const result = await client.query(`SELECT to_regclass('"CareerOSMigration"') AS table_name`);
    assert.equal(result.rows[0].table_name, null, "unledgered schema is not adopted");
  });

  const laterObject = await createDatabase("later-object"); databases.push(laterObject);
  const laterObjectUrl = connectionFor(laterObject);
  await withClient(laterObjectUrl, async (client) => {
    await client.query(`CREATE TABLE "CareerRelevanceFeedback" ("id" TEXT PRIMARY KEY)`);
    await client.query(`INSERT INTO "CareerRelevanceFeedback" ("id") VALUES ('fixture-row')`);
  });
  await expectFailure(laterObjectUrl, root, /CAREEROS_MIGRATION_STATE_UNVERIFIED/);
  await withClient(laterObjectUrl, async (client) => {
    const result = await client.query(`SELECT to_regclass('"CareerRelevanceFeedback"') AS table_name, to_regclass('"CareerOSMigration"') AS ledger_name`);
    assert.equal(result.rows[0].table_name, '"CareerRelevanceFeedback"', "later-migration object remains unchanged");
    assert.equal(result.rows[0].ledger_name, null, "later-migration rejection creates no ledger");
    assert.equal((await client.query(`SELECT COUNT(*)::int AS count FROM "CareerRelevanceFeedback"`)).rows[0].count, 1, "later-migration data remains unchanged");
  });
} finally {
  for (const database of databases) await dropDatabase(database);
}

console.log("CareerOS migration runner disposable tests passed: fresh, repeat, checksum, rollback/resume, concurrency, unledgered refusal.");
