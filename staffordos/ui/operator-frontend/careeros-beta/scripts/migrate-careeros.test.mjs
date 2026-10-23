import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Client } from "pg";

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
  const hostname = new URL(url).hostname;
  const client = new Client({ connectionString: url, ssl: ["127.0.0.1", "localhost", "::1"].includes(hostname) ? false : { rejectUnauthorized: false } });
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

  const changedRootPath = await mkdtemp(join(tmpdir(), "careeros-changed-"));
  const changedRoot = pathToFileURL(`${changedRootPath}/`);
  await cp(new URL("../", import.meta.url), changedRootPath, { recursive: true });
  const changedMigration = join(changedRootPath, "prisma/migrations/20260816000000_careeros_p0_foundation/migration.sql");
  await writeFile(changedMigration, `${await readFile(changedMigration, "utf8")}\n-- changed for checksum test\n`);
  await expectFailure(freshUrl, changedRoot, /CAREEROS_MIGRATION_CHECKSUM_MISMATCH/);
  await rm(changedRootPath, { recursive: true, force: true });

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
    await client.query(`CREATE INDEX "CareerRelevanceFeedback_tenantId_userId_targetRoleNormalized_idx" ON "CareerUser" ("id")`);
  });
  await expectFailure(indexConflictUrl, root, /CAREEROS_MIGRATION_STATE_UNVERIFIED/);
  await withClient(indexConflictUrl, (client) => client.query(`DROP INDEX "CareerRelevanceFeedback_tenantId_userId_targetRoleNormalized_idx"`));
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
    await client.query(`CREATE SCHEMA "shadow_schema"`);
    await client.query(`CREATE TABLE "shadow_schema"."Shadow" ("id" TEXT NOT NULL, CONSTRAINT "CareerFactContextClaim_tenantId_fkey" UNIQUE ("id"))`);
  });
  await expectFailure(constraintConflictUrl, root, /CAREEROS_MIGRATION_STATE_UNVERIFIED/);
  await withClient(constraintConflictUrl, async (client) => {
    await client.query(`DROP SCHEMA "shadow_schema" CASCADE`);
  });
  await run(constraintConflictUrl);
  await withClient(constraintConflictUrl, async (client) => {
    assert.equal((await client.query(`SELECT COUNT(*)::int AS count FROM pg_constraint WHERE conname='CareerFactContextClaim_tenantId_fkey'`)).rows[0].count, 1, "required constraint is created after cross-schema conflict is removed");
  });
  await rm(constraintBrokenRootPath, { recursive: true, force: true });

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
