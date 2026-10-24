import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { Client } from "pg";
import { generateKeyPairSync, sign } from "node:crypto";
import { assertNoUnexpectedApplicationObjects, CAREEROS_SCHEMA_FINGERPRINT_VERSION, readCareerOSSchema } from "./careerosSchemaFingerprint.mjs";
import { approvalPayload, verifyAdoptionApproval } from "./careerosAdoptionApproval.mjs";
import { referenceFingerprint } from "./careerosSchemaReference.mjs";
import { postgresSslForConnection } from "./careerosConnection.mjs";
import { ADOPTION_CRITICAL_FILES, sourceFileDigests, sourceFileDigestsAtRevision, assertReviewedSourceDigests } from "./careerosAdoptionSource.mjs";

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

const sourceRevision = (await exec(process.execPath, ["-e", "process.stdout.write(require('child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim())"], { cwd: new URL("../", import.meta.url).pathname })).stdout.trim();
const sourceDigests = await sourceFileDigests(new URL("../", import.meta.url).pathname);
const reviewedDigests = await sourceFileDigestsAtRevision(new URL("../", import.meta.url).pathname, sourceRevision);
assert.ok(ADOPTION_CRITICAL_FILES.includes("prisma/migrations/20261021000000_reconcile_existing_story_status/migration.sql"), "reconciliation SQL is source-bound");
assert.deepEqual(sourceDigests, reviewedDigests, "executing and reviewed source digests agree");
const modifiedReconciliation = { ...sourceDigests, "prisma/migrations/20261021000000_reconcile_existing_story_status/migration.sql": "0".repeat(64) };
assert.notDeepEqual(modifiedReconciliation, reviewedDigests, "modified reconciliation SQL cannot satisfy source binding");
assert.throws(() => assertReviewedSourceDigests(modifiedReconciliation, reviewedDigests, "CAREEROS_RECONCILIATION_SOURCE_FILES_MODIFIED"), /CAREEROS_RECONCILIATION_SOURCE_FILES_MODIFIED:prisma\/migrations\/20261021000000_reconcile_existing_story_status\/migration\.sql/);

function urlFor(database) { const url = new URL(baseUrl); url.pathname = `/${database}`; return url.toString(); }
async function withClient(url, fn) {
  const client = new Client({ connectionString: url, ssl: postgresSslForConnection(url) });
  await client.connect(); try { return await fn(client); } finally { await client.end(); }
}
async function createDatabase(label) { const name = `careeros_adopt_${label}_${Date.now()}`; await withClient(urlFor("postgres"), (c) => c.query(`CREATE DATABASE "${name}"`)); return name; }
async function dropDatabase(name) { await withClient(urlFor("postgres"), (c) => c.query(`DROP DATABASE IF EXISTS "${name}"`)); }
async function runScript(script, url, env = {}) { return exec(process.execPath, [script], { env: { ...process.env, DATABASE_URL: url, ...env } }); }
async function runMigrations(url) { return runScript(runner, url); }
async function checksums() { const result = {}; for (const id of migrationIds) result[id] = (await import("node:crypto")).createHash("sha256").update(await readFile(new URL(`../prisma/migrations/${id}/migration.sql`, import.meta.url), "utf8"), "utf8").digest("hex"); return result; }
async function approvalFor(url, manifest, path) {
  const identity = await withClient(url, async (c) => (await c.query(`SELECT current_database() AS database_name,current_user AS database_user,current_schema() AS schema_name,COALESCE(inet_server_addr()::text,'') AS server_address,inet_server_port() AS server_port`)).rows[0]);
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const keyId = "synthetic-review-key";
  const target = { databaseIdentity: identity, fingerprintVersion: CAREEROS_SCHEMA_FINGERPRINT_VERSION, sourceRevision: manifest.sourceRevision, sourceFiles: manifest.sourceFiles, referenceFingerprint: manifest.referenceFingerprint, schemaFingerprint: manifest.schemaFingerprint, migrationChecksums: manifest.migrationChecksums };
  const payload = approvalPayload({ target: identity, fingerprintVersion: CAREEROS_SCHEMA_FINGERPRINT_VERSION, sourceRevision: manifest.sourceRevision, sourceFiles: manifest.sourceFiles, referenceFingerprint: manifest.referenceFingerprint, schemaFingerprint: manifest.schemaFingerprint, migrationChecksums: manifest.migrationChecksums, reviewedBy: manifest.reviewedBy });
  const approval = { kind: "CAREEROS_SCHEMA_ADOPTION_APPROVAL_V1", target, reviewedBy: manifest.reviewedBy, signature: { algorithm: "Ed25519", keyId, value: sign(null, Buffer.from(payload), privateKey).toString("base64url") } };
  await writeFile(path, JSON.stringify(approval));
  return { CAREEROS_ADOPTION_APPROVAL_PATH: path, CAREEROS_ADOPTION_TRUSTED_KEYS_JSON: JSON.stringify({ [keyId]: publicKey.export({ format: "der", type: "spki" }).toString("base64") }) };
}

const databases = [];
const unexpectedRole = `careeros_unexpected_role_${Date.now()}`;
const quoteIdentifier = (value) => `"${value.replaceAll('"', '""')}"`;
try {
  const db = await createDatabase("observed"); databases.push(db); const url = urlFor(db);
  await runMigrations(url);
  await withClient(url, async (c) => {
    await c.query(`CREATE TABLE "_prisma_migrations" (
      id VARCHAR(36) PRIMARY KEY,
      checksum VARCHAR(64) NOT NULL,
      finished_at TIMESTAMPTZ,
      migration_name VARCHAR(255) NOT NULL,
      logs TEXT,
      rolled_back_at TIMESTAMPTZ,
      started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      applied_steps_count INTEGER NOT NULL DEFAULT 0
    )`);
  });
  const expected = await withClient(url, (c) => readCareerOSSchema(c));
  assert.ok(expected.objects.some((object) => object.object_name === "_prisma_migrations"), "historical Prisma table participates in the v2 fingerprint");
  const referencePath = `${process.env.TMPDIR || "/tmp"}/careeros-reference-${Date.now()}.json`;
  const manifestPath = `${process.env.TMPDIR || "/tmp"}/careeros-adoption-${Date.now()}.json`;
  await writeFile(referencePath, JSON.stringify(referenceFingerprint(expected)));
  await assert.rejects(runScript(prepare, url, { CAREEROS_ADOPTION_MANIFEST_PATH: `${manifestPath}.wrong-source`, CAREEROS_SCHEMA_REFERENCE_PATH: referencePath, CAREEROS_REVIEWED_SOURCE_REVISION: "0000000000000000000000000000000000000000", CAREEROS_REVIEWED_BY: "synthetic-review" }), /CAREEROS_EXECUTING_SOURCE_REVISION_MISMATCH/);
  await withClient(url, async (c) => {
    const constraint = (await c.query(`SELECT constraint_name FROM information_schema.table_constraints WHERE table_schema=current_schema() AND table_name='CareerUser' ORDER BY constraint_name LIMIT 1`)).rows[0].constraint_name;
    const quoted = constraint.replaceAll('"', '""');
    await c.query(`CREATE SCHEMA "shadow_schema"`);
    await c.query(`CREATE TABLE "shadow_schema"."CareerUser" ("id" TEXT NOT NULL, CONSTRAINT "${quoted}" UNIQUE ("id"))`);
    const shadowed = await readCareerOSSchema(c);
    assert.equal(shadowed.fingerprint, expected.fingerprint, "same-named objects in another schema do not affect the intended fingerprint");
    await c.query(`DROP SCHEMA "shadow_schema" CASCADE`);
  });
  await withClient(url, async (c) => {
    await c.query(`ALTER TABLE "CareerSearchPreference" ALTER COLUMN "roleFamily" SET DEFAULT 'CHANGED_FOR_TEST'`);
    const changed = await readCareerOSSchema(c);
    assert.notEqual(changed.fingerprint, expected.fingerprint, "definition-bearing default changes fingerprint");
    await c.query(`ALTER TABLE "CareerSearchPreference" ALTER COLUMN "roleFamily" SET DEFAULT ''`);
  });
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
  const reviewedSourceRevision = (await exec("git", ["rev-parse", "HEAD"], { cwd: new URL("../", import.meta.url).pathname })).stdout.trim();
  await runScript(prepare, url, { CAREEROS_ADOPTION_MANIFEST_PATH: manifestPath, CAREEROS_SCHEMA_REFERENCE_PATH: referencePath, CAREEROS_REVIEWED_SOURCE_REVISION: reviewedSourceRevision, CAREEROS_REVIEWED_BY: "synthetic-review" });
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  await withClient(url, async (c) => {
    await c.query(`CREATE FUNCTION "unexpected_adoption_function"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$`);
    await c.query(`CREATE TRIGGER "unexpected_adoption_trigger" BEFORE INSERT ON "CareerUser" FOR EACH ROW EXECUTE FUNCTION "unexpected_adoption_function"()`);
    await c.query(`ALTER TABLE "CareerUser" ENABLE ROW LEVEL SECURITY`);
    await c.query(`CREATE POLICY "unexpected_adoption_policy" ON "CareerUser" USING (true)`);
  });
  await assert.rejects(runScript(prepare, url, { CAREEROS_ADOPTION_MANIFEST_PATH: `${manifestPath}.catalog`, CAREEROS_SCHEMA_REFERENCE_PATH: referencePath, CAREEROS_REVIEWED_SOURCE_REVISION: manifest.sourceRevision, CAREEROS_REVIEWED_BY: manifest.reviewedBy }), /CAREEROS_REFERENCE_MISMATCH/);
  await withClient(url, async (c) => {
    await c.query(`DROP POLICY "unexpected_adoption_policy" ON "CareerUser"`);
    await c.query(`ALTER TABLE "CareerUser" DISABLE ROW LEVEL SECURITY`);
    await c.query(`DROP TRIGGER "unexpected_adoption_trigger" ON "CareerUser"`);
    await c.query(`DROP FUNCTION "unexpected_adoption_function"()`);
  });
  await withClient(url, async (c) => { await c.query(`CREATE TABLE "UnexpectedApplicationTable" ("id" TEXT PRIMARY KEY)`); });
  await assert.rejects(runScript(prepare, url, { CAREEROS_ADOPTION_MANIFEST_PATH: `${manifestPath}.unexpected`, CAREEROS_SCHEMA_REFERENCE_PATH: referencePath, CAREEROS_REVIEWED_SOURCE_REVISION: manifest.sourceRevision, CAREEROS_REVIEWED_BY: manifest.reviewedBy }), /CAREEROS_UNEXPECTED_SCHEMA_OBJECTS/);
  await withClient(url, (c) => c.query(`DROP TABLE "UnexpectedApplicationTable"`));
  const approvalPath = `${process.env.TMPDIR || "/tmp"}/careeros-approval-${Date.now()}.json`;
  const approvalEnv = await approvalFor(url, manifest, approvalPath);
  const rollbackDb = await createDatabase("rollback"); databases.push(rollbackDb); const rollbackUrl = urlFor(rollbackDb);
  await runMigrations(rollbackUrl);
  await withClient(rollbackUrl, async (c) => {
    await c.query(`CREATE TABLE "_prisma_migrations" (
      id VARCHAR(36) PRIMARY KEY,
      checksum VARCHAR(64) NOT NULL,
      finished_at TIMESTAMPTZ,
      migration_name VARCHAR(255) NOT NULL,
      logs TEXT,
      rolled_back_at TIMESTAMPTZ,
      started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      applied_steps_count INTEGER NOT NULL DEFAULT 0
    )`);
  });
  const rollbackExpected = await withClient(rollbackUrl, (c) => readCareerOSSchema(c));
  await withClient(rollbackUrl, async (c) => { await c.query(`DROP TABLE "CareerOSMigration"`); await c.query(`ALTER TABLE "CareerOnboardingState" DROP COLUMN "storyStatus"`); });
  const rollbackLegacy = await withClient(rollbackUrl, (c) => readCareerOSSchema(c));
  await runScript(reconcile, rollbackUrl, { CAREEROS_LEGACY_SCHEMA_FINGERPRINT: rollbackLegacy.fingerprint });
  const rollbackCorrected = await withClient(rollbackUrl, (c) => readCareerOSSchema(c));
  const rollbackManifestPath = `${process.env.TMPDIR || "/tmp"}/careeros-adoption-rollback-${Date.now()}.json`;
  await writeFile(rollbackManifestPath, JSON.stringify({ ...manifest, schemaFingerprint: rollbackCorrected.fingerprint }));
  const rollbackApprovalPath = `${process.env.TMPDIR || "/tmp"}/careeros-approval-rollback-${Date.now()}.json`;
  const rollbackApprovalEnv = await approvalFor(rollbackUrl, { ...manifest, schemaFingerprint: rollbackCorrected.fingerprint }, rollbackApprovalPath);
  await assert.rejects(runScript(adopt, rollbackUrl, { NODE_ENV: "test", CAREEROS_ADOPTION_TEST_FAIL_AFTER_LEDGER: "1", CAREEROS_ADOPTION_MANIFEST_PATH: rollbackManifestPath, CAREEROS_SCHEMA_REFERENCE_PATH: referencePath, ...rollbackApprovalEnv }), /CAREEROS_TEST_FAILURE_AFTER_LEDGER/);
  const forgedApprovalPath = `${process.env.TMPDIR || "/tmp"}/careeros-approval-forged-${Date.now()}.json`;
  const forgedApproval = JSON.parse(await readFile(rollbackApprovalPath, "utf8"));
  forgedApproval.target.sourceRevision = "edited-source";
  await writeFile(forgedApprovalPath, JSON.stringify(forgedApproval));
  await assert.rejects(runScript(adopt, rollbackUrl, { CAREEROS_ADOPTION_MANIFEST_PATH: rollbackManifestPath, CAREEROS_SCHEMA_REFERENCE_PATH: referencePath, CAREEROS_ADOPTION_APPROVAL_PATH: forgedApprovalPath, CAREEROS_ADOPTION_TRUSTED_KEYS_JSON: rollbackApprovalEnv.CAREEROS_ADOPTION_TRUSTED_KEYS_JSON }), /CAREEROS_ADOPTION_APPROVAL_TARGET_MISMATCH/);
  const reorderedApprovalPath = `${process.env.TMPDIR || "/tmp"}/careeros-approval-reordered-${Date.now()}.json`;
  const reorderedApproval = JSON.parse(await readFile(rollbackApprovalPath, "utf8"));
  const originalTarget = reorderedApproval.target;
  reorderedApproval.target = {
    migrationChecksums: originalTarget.migrationChecksums,
    schemaFingerprint: originalTarget.schemaFingerprint,
    referenceFingerprint: originalTarget.referenceFingerprint,
    sourceFiles: originalTarget.sourceFiles,
    sourceRevision: originalTarget.sourceRevision,
    fingerprintVersion: originalTarget.fingerprintVersion,
    databaseIdentity: originalTarget.databaseIdentity,
  };
  await writeFile(reorderedApprovalPath, JSON.stringify(reorderedApproval));
  await verifyAdoptionApproval({ approvalPath: reorderedApprovalPath, trustedKeysJson: rollbackApprovalEnv.CAREEROS_ADOPTION_TRUSTED_KEYS_JSON, target: originalTarget.databaseIdentity, fingerprintVersion: originalTarget.fingerprintVersion, sourceRevision: originalTarget.sourceRevision, sourceFiles: originalTarget.sourceFiles, referenceFingerprint: originalTarget.referenceFingerprint, schemaFingerprint: originalTarget.schemaFingerprint, migrationChecksums: originalTarget.migrationChecksums });
  const modifiedSourceManifestPath = `${process.env.TMPDIR || "/tmp"}/careeros-adoption-modified-source-${Date.now()}.json`;
  await writeFile(modifiedSourceManifestPath, JSON.stringify({ ...JSON.parse(await readFile(rollbackManifestPath, "utf8")), sourceFiles: { ...manifest.sourceFiles, "scripts/adopt-careeros-schema.mjs": "0" } }));
  await assert.rejects(runScript(adopt, rollbackUrl, { CAREEROS_ADOPTION_MANIFEST_PATH: modifiedSourceManifestPath, CAREEROS_SCHEMA_REFERENCE_PATH: referencePath, ...rollbackApprovalEnv }), /CAREEROS_ADOPTION_SOURCE_FILES_MISMATCH/);
  await withClient(rollbackUrl, async (c) => { assert.equal((await c.query(`SELECT to_regclass('"CareerOSMigration"') AS name`)).rows[0].name, null); assert.equal((await c.query(`SELECT to_regclass('"CareerOSMigrationAdoption"') AS name`)).rows[0].name, null); });
  assert.equal(rollbackExpected.fingerprint, expected.fingerprint);
  await runScript(adopt, url, { CAREEROS_ADOPTION_MANIFEST_PATH: manifestPath, CAREEROS_SCHEMA_REFERENCE_PATH: referencePath, ...approvalEnv });
  await runMigrations(url); await runMigrations(url);
  const badManifestPath = `${process.env.TMPDIR || "/tmp"}/careeros-adoption-bad-${Date.now()}.json`;
  await writeFile(badManifestPath, JSON.stringify({ ...manifest, migrationChecksums: { ...migrationChecksums, [migrationIds[0]]: "bad" } }));
  await assert.rejects(runScript(adopt, url, { CAREEROS_ADOPTION_MANIFEST_PATH: badManifestPath, CAREEROS_SCHEMA_REFERENCE_PATH: referencePath }), /CAREEROS_MIGRATION_CHECKSUM_REVIEW_MISMATCH/);
  await assert.rejects(runScript(adopt, url, { CAREEROS_ADOPTION_MANIFEST_PATH: manifestPath, CAREEROS_SCHEMA_REFERENCE_PATH: referencePath }), /CAREEROS_ADOPTION_APPROVAL_REQUIRED/);
  await withClient(url, async (c) => { assert.equal((await c.query(`SELECT COUNT(*)::int AS n FROM "CareerOSMigration"`)).rows[0].n, 8); assert.equal((await c.query(`SELECT COUNT(*)::int AS n FROM "CareerOSMigrationAdoption"`)).rows[0].n, 1); });
  await withClient(url, async (c) => {
    await c.query(`CREATE ROLE "${unexpectedRole}" NOLOGIN`);
    await c.query(`GRANT SELECT ON TABLE "CareerUser" TO "${unexpectedRole}"`);
    const privileged = await readCareerOSSchema(c);
    assert.notDeepEqual(referenceFingerprint(privileged).relationPrivileges, referenceFingerprint(expected).relationPrivileges, "unexpected relation ownership/grants reject against independent reference");
    await c.query(`REVOKE SELECT ON TABLE "CareerUser" FROM "${unexpectedRole}"`);
    await c.query(`DROP ROLE "${unexpectedRole}"`);
  });
  await withClient(url, async (c) => {
    const renderRole = `careeros_render_role_${Date.now()}`;
    await c.query(`CREATE ROLE "${renderRole}" NOLOGIN`);
    const roleMapping = { postgres: "reviewed-app", [renderRole]: "reviewed-app" };
    const mappedReference = await readCareerOSSchema(c, { roleMapping });
    await c.query(`ALTER TABLE "CareerUser" OWNER TO "${renderRole}"`);
    const mappedObserved = await readCareerOSSchema(c, { roleMapping });
    assert.deepEqual(referenceFingerprint(mappedObserved), referenceFingerprint(mappedReference), "explicit reviewed role mapping accepts disposable and Render role names");
    await c.query(`ALTER TABLE "CareerUser" OWNER TO postgres`);
    await c.query(`DROP ROLE "${renderRole}"`);
  });
  await withClient(url, async (c) => {
    const adminRole = `postgres_admin_${Date.now()}`;
    const specialRole = `role-quoted-"${Date.now()}`;
    await c.query(`CREATE ROLE ${quoteIdentifier(adminRole)} NOLOGIN`);
    await c.query(`CREATE ROLE ${quoteIdentifier(specialRole)} NOLOGIN`);
    await c.query(`GRANT SELECT ON TABLE "CareerUser" TO ${quoteIdentifier(adminRole)}`);
    await c.query(`GRANT INSERT ON TABLE "CareerUser" TO ${quoteIdentifier(specialRole)}`);
    await c.query(`GRANT UPDATE ON TABLE "CareerUser" TO PUBLIC`);
    await assert.rejects(runScript(prepare, url, { CAREEROS_ADOPTION_MANIFEST_PATH: `${manifestPath}.public-mismatch`, CAREEROS_SCHEMA_REFERENCE_PATH: referencePath, CAREEROS_REVIEWED_SOURCE_REVISION: reviewedSourceRevision, CAREEROS_REVIEWED_BY: "synthetic-review" }), /CAREEROS_REFERENCE_MISMATCH/);
    const mapped = await readCareerOSSchema(c, { roleMapping: { postgres: "reviewed-app", [specialRole]: "reviewed-special" } });
    const relation = mapped.relationPrivileges.find((row) => row.object_name === "CareerUser");
    const grantees = relation.privileges.map((privilege) => privilege.grantee);
    assert.ok(grantees.some((p) => p.kind === "role" && p.name === adminRole), "mapping postgres does not alter postgres_admin");
    assert.ok(grantees.some((p) => p.kind === "role" && p.name === "reviewed-special"), "quoted role mapping is exact and structured");
    assert.notEqual(grantees.findIndex((p) => p.kind === "role" && p.name === adminRole), grantees.findIndex((p) => p.kind === "role" && p.name === "reviewed-special"), "different principals remain distinct");
    assert.ok(grantees.some((p) => p.kind === "public"), "PUBLIC remains a distinct pseudo-principal");
    await assert.rejects(readCareerOSSchema(c, { roleMapping: { PUBLIC: "reviewed-app" } }), /CAREEROS_PUBLIC_ROLE_MAPPING_FORBIDDEN/);
    await c.query(`CREATE ROLE "careeros_membership_${Date.now()}"`);
    const memberRole = (await c.query(`SELECT rolname FROM pg_roles WHERE rolname LIKE 'careeros_membership_%' ORDER BY rolname DESC LIMIT 1`)).rows[0].rolname;
    const parentRole = `careeros_parent_${Date.now()}`;
    await c.query(`CREATE ROLE ${quoteIdentifier(parentRole)} NOLOGIN`);
    await c.query(`GRANT ${quoteIdentifier(memberRole)} TO postgres WITH INHERIT TRUE, SET TRUE`);
    await c.query(`GRANT ${quoteIdentifier(parentRole)} TO ${quoteIdentifier(memberRole)} WITH INHERIT TRUE, SET TRUE`);
    const memberships = await readCareerOSSchema(c);
    assert.ok(memberships.roleMemberships.some((m) => m.member_role === "postgres" && m.granted_role === memberRole && m.inherit_option && m.set_option), "role membership options are captured");
    assert.ok(memberships.roleMemberships.some((m) => m.member_role === "postgres" && m.granted_role === parentRole && m.depth === 2), "indirect role membership is captured");
    await assert.rejects(runScript(prepare, url, { CAREEROS_ADOPTION_MANIFEST_PATH: `${manifestPath}.membership-mismatch`, CAREEROS_SCHEMA_REFERENCE_PATH: referencePath, CAREEROS_REVIEWED_SOURCE_REVISION: reviewedSourceRevision, CAREEROS_REVIEWED_BY: "synthetic-review" }), /CAREEROS_REFERENCE_MISMATCH/);
    await c.query(`ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO PUBLIC`);
    const defaults = await readCareerOSSchema(c);
    assert.notDeepEqual(defaults.defaultPrivileges, expected.defaultPrivileges, "schema-scoped default privileges are fingerprinted");
    await assert.rejects(runScript(prepare, url, { CAREEROS_ADOPTION_MANIFEST_PATH: `${manifestPath}.default-mismatch`, CAREEROS_SCHEMA_REFERENCE_PATH: referencePath, CAREEROS_REVIEWED_SOURCE_REVISION: reviewedSourceRevision, CAREEROS_REVIEWED_BY: "synthetic-review" }), /CAREEROS_REFERENCE_MISMATCH/);
    await c.query(`ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE SELECT ON TABLES FROM PUBLIC`);
    await c.query(`REVOKE ${quoteIdentifier(memberRole)} FROM postgres`);
    await c.query(`REVOKE ${quoteIdentifier(parentRole)} FROM ${quoteIdentifier(memberRole)}`);
    await c.query(`DROP ROLE ${quoteIdentifier(parentRole)}`);
    await c.query(`DROP ROLE ${quoteIdentifier(memberRole)}`);
    await c.query(`REVOKE ALL PRIVILEGES ON TABLE "CareerUser" FROM ${quoteIdentifier(adminRole)},${quoteIdentifier(specialRole)}`);
    await c.query(`REVOKE UPDATE ON TABLE "CareerUser" FROM PUBLIC`);
    await c.query(`DROP ROLE ${quoteIdentifier(adminRole)}`);
    await c.query(`DROP ROLE ${quoteIdentifier(specialRole)}`);
  });
  console.log("CareerOS adoption tests passed: observed-schema correction, fingerprint rejection, atomic adoption, checksum rejection, normal-runner repeat.");
} finally { for (const db of databases) await dropDatabase(db); }
