import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { Client } from "pg";
import { generateKeyPairSync, sign } from "node:crypto";
import { assertNoUnexpectedApplicationObjects, CAREEROS_SCHEMA_FINGERPRINT_VERSION, readCareerOSSchema } from "./careerosSchemaFingerprint.mjs";
import { approvalPayload, verifyAdoptionApproval } from "./careerosAdoptionApproval.mjs";
import { referenceFingerprint, compareReferenceFields } from "./careerosSchemaReference.mjs";
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
let quotedPublicCreated = false;
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
  await withClient(url, async (c) => {
    const role = `careeros_attribute_probe_${Date.now()}`;
    await c.query(`CREATE ROLE ${quoteIdentifier(role)} NOLOGIN`);
    await c.query(`GRANT SELECT ON TABLE "CareerUser" TO ${quoteIdentifier(role)}`);
    const baseline = await readCareerOSSchema(c);
    await c.query(`ALTER ROLE ${quoteIdentifier(role)} SUPERUSER BYPASSRLS`);
    const changed = await readCareerOSSchema(c);
    assert.notDeepEqual(changed.roleAttributes, baseline.roleAttributes, "authorization-relevant role attributes change the fingerprint");
    assert.ok(changed.roleAttributes.some((entry) => entry.rolname === role && entry.rolsuper && entry.rolbypassrls), "rolsuper and rolbypassrls are captured");
    await c.query(`ALTER ROLE ${quoteIdentifier(role)} NOSUPERUSER NOBYPASSRLS`);
    await c.query(`REVOKE SELECT ON TABLE "CareerUser" FROM ${quoteIdentifier(role)}`);
    await c.query(`DROP ROLE ${quoteIdentifier(role)}`);
  });
  await withClient(url, async (c) => {
    const columnRole = `careeros_column_attribute_probe_${Date.now()}`;
    await c.query(`CREATE ROLE ${quoteIdentifier(columnRole)} NOLOGIN`);
    await c.query(`GRANT SELECT ("id") ON TABLE "CareerUser" TO ${quoteIdentifier(columnRole)}`);
    const baseline = await readCareerOSSchema(c);
    await c.query(`ALTER ROLE ${quoteIdentifier(columnRole)} SUPERUSER BYPASSRLS`);
    const changed = await readCareerOSSchema(c);
    assert.notDeepEqual(changed.roleAttributes, baseline.roleAttributes, "column-only ACL principals seed role-attribute capture");
    assert.ok(changed.roleAttributes.some((entry) => entry.rolname === columnRole && entry.rolsuper && entry.rolbypassrls), "column-only principal attributes are captured");
    await c.query(`ALTER ROLE ${quoteIdentifier(columnRole)} NOSUPERUSER NOBYPASSRLS`);
    await c.query(`REVOKE SELECT ("id") ON TABLE "CareerUser" FROM ${quoteIdentifier(columnRole)}`);
    await c.query(`DROP ROLE ${quoteIdentifier(columnRole)}`);
  });
  await withClient(url, async (c) => {
    const defaultRole = `careeros_default_attribute_probe_${Date.now()}`;
    await c.query(`CREATE ROLE ${quoteIdentifier(defaultRole)} NOLOGIN`);
    await c.query(`ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT SELECT ON TABLES TO ${quoteIdentifier(defaultRole)}`);
    const baseline = await readCareerOSSchema(c);
    await c.query(`ALTER ROLE ${quoteIdentifier(defaultRole)} SUPERUSER BYPASSRLS`);
    const changed = await readCareerOSSchema(c);
    assert.notDeepEqual(changed.roleAttributes, baseline.roleAttributes, "relevant default-ACL principals seed role attributes");
    assert.ok(changed.roleAttributes.some((entry) => entry.rolname === defaultRole && entry.rolsuper && entry.rolbypassrls), "default-ACL principal attributes are captured");
    await c.query(`ALTER ROLE ${quoteIdentifier(defaultRole)} NOSUPERUSER NOBYPASSRLS`);
    await c.query(`ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE SELECT ON TABLES FROM ${quoteIdentifier(defaultRole)}`);
    await c.query(`DROP ROLE ${quoteIdentifier(defaultRole)}`);
  });
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
  await withClient(url, async (c) => {
    await c.query(`CREATE RULE "careeros_rule_probe" AS ON INSERT TO "CareerUser" DO INSTEAD NOTHING`);
    const created = await readCareerOSSchema(c);
    assert.equal(created.rewriteRules.length, 1, "user-defined table rewrite rules are captured");
    assert.match(created.rewriteRules[0].definition, /DO INSTEAD NOTHING/);
    const clean = await readCareerOSSchema(c);
    await c.query(`DROP RULE "careeros_rule_probe" ON "CareerUser"`);
    await c.query(`CREATE RULE "careeros_rule_probe" AS ON INSERT TO "CareerUser" DO INSTEAD SELECT 1`);
    const changedDefinition = await readCareerOSSchema(c);
    assert.notDeepEqual(changedDefinition.rewriteRules, clean.rewriteRules, "changed rewrite definitions are reference-visible");
    await c.query(`ALTER TABLE "CareerUser" DISABLE RULE "careeros_rule_probe"`);
    const changedState = await readCareerOSSchema(c);
    assert.notDeepEqual(changedState.rewriteRules, changedDefinition.rewriteRules, "rewrite enabled state is reference-visible");
    await c.query(`DROP RULE "careeros_rule_probe" ON "CareerUser"`);
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
  const staleReferenceDigestPath = `${referencePath}.stale-digest`;
  const referenceArtifact = JSON.parse(await readFile(referencePath, "utf8"));
  await writeFile(staleReferenceDigestPath, JSON.stringify({ ...referenceArtifact, roleMemberships: [...referenceArtifact.roleMemberships, { member_role: "tampered", granted_role: "tampered", admin_option: false, inherit_option: true, set_option: true, depth: 1 }] }));
  await assert.rejects(runScript(prepare, url, { CAREEROS_ADOPTION_MANIFEST_PATH: `${manifestPath}.stale-digest`, CAREEROS_SCHEMA_REFERENCE_PATH: staleReferenceDigestPath, CAREEROS_REVIEWED_SOURCE_REVISION: reviewedSourceRevision, CAREEROS_REVIEWED_BY: "synthetic-review" }), /CAREEROS_REFERENCE_DIGEST_MISMATCH/);
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
    await c.query(`ALTER TABLE "CareerUser" OWNER TO "${renderRole}"`);
    const mappedReference = await readCareerOSSchema(c, { roleMapping });
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
    try {
      await c.query(`CREATE ROLE "PUBLIC" NOLOGIN`);
      quotedPublicCreated = true;
    } catch (error) {
      assert.match(error.message, /already exists|reserved/i, "only PostgreSQL versions that reserve PUBLIC may reject the quoted role");
    }
    if (quotedPublicCreated) {
      const identity = (await c.query(`SELECT oid FROM pg_roles WHERE rolname='PUBLIC'`)).rows[0];
      assert.ok(identity, "quoted PUBLIC role has a catalog identity");
      assert.notEqual(Number(identity.oid), 0, "quoted PUBLIC role is distinct from PUBLIC pseudo-principal OID zero");
    }
    await c.query(`GRANT UPDATE ("id") ON TABLE "CareerUser" TO PUBLIC`);
    const mapped = await readCareerOSSchema(c, { roleMapping: { postgres: "reviewed-app", [specialRole]: "reviewed-special" } });
    assert.ok(compareReferenceFields(referenceFingerprint(mapped), referenceFingerprint(expected)).includes("relationPrivileges"), "PUBLIC grant drift is reference-visible");
    const relation = mapped.relationPrivileges.find((row) => row.object_name === "CareerUser");
    const grantees = relation.privileges.map((privilege) => privilege.grantee);
    assert.ok(grantees.some((p) => p.kind === "role" && p.name === adminRole), "mapping postgres does not alter postgres_admin");
    assert.ok(grantees.some((p) => p.kind === "role" && p.name === "reviewed-special"), "quoted role mapping is exact and structured");
    assert.notEqual(grantees.findIndex((p) => p.kind === "role" && p.name === adminRole), grantees.findIndex((p) => p.kind === "role" && p.name === "reviewed-special"), "different principals remain distinct");
    assert.ok(grantees.some((p) => p.kind === "public"), "PUBLIC remains a distinct pseudo-principal");
    const column = mapped.columnPrivileges.find((row) => row.table_name === "CareerUser" && row.column_name === "id");
    assert.ok(column.privileges.some((p) => p.grantee.kind === "public"), "column PUBLIC grant is preserved as pseudo-principal");
    await assert.rejects(readCareerOSSchema(c, { roleMapping: { PUBLIC: "reviewed-app" } }), /CAREEROS_PUBLIC_ROLE_MAPPING_FORBIDDEN/);
    await c.query(`CREATE ROLE "careeros_membership_${Date.now()}"`);
    const memberRole = (await c.query(`SELECT rolname FROM pg_roles WHERE rolname LIKE 'careeros_membership_%' ORDER BY rolname DESC LIMIT 1`)).rows[0].rolname;
    const parentRole = `careeros_parent_${Date.now()}`;
    await c.query(`CREATE ROLE ${quoteIdentifier(parentRole)} NOLOGIN`);
    const unauthorizedLogin = `careeros_unexpected_login_${Date.now()}`;
    await c.query(`CREATE ROLE ${quoteIdentifier(unauthorizedLogin)} NOLOGIN`);
    const routineRole = `careeros_routine_role_${Date.now()}`;
    const routineLogin = `careeros_routine_login_${Date.now()}`;
    const routineName = `careeros_membership_probe_${Date.now()}`;
    await c.query(`CREATE ROLE ${quoteIdentifier(routineRole)} NOLOGIN`);
    await c.query(`CREATE ROLE ${quoteIdentifier(routineLogin)} NOLOGIN`);
    await c.query(`CREATE FUNCTION ${quoteIdentifier(routineName)}() RETURNS integer LANGUAGE SQL AS 'SELECT 1'`);
    await c.query(`GRANT EXECUTE ON FUNCTION ${quoteIdentifier(routineName)}() TO ${quoteIdentifier(routineRole)}`);
    await c.query(`GRANT ${quoteIdentifier(routineRole)} TO ${quoteIdentifier(routineLogin)} WITH INHERIT TRUE, SET TRUE`);
    const policyRole = `careeros_policy_role_${Date.now()}`;
    const policyLogin = `careeros_policy_login_${Date.now()}`;
    const policyName = `careeros_membership_policy_${Date.now()}`;
    await c.query(`CREATE ROLE ${quoteIdentifier(policyRole)} NOLOGIN`);
    await c.query(`CREATE ROLE ${quoteIdentifier(policyLogin)} NOLOGIN`);
    await c.query(`ALTER TABLE "CareerUser" ENABLE ROW LEVEL SECURITY`);
    await c.query(`CREATE POLICY ${quoteIdentifier(policyName)} ON "CareerUser" TO ${quoteIdentifier(policyRole)} USING (true)`);
    await c.query(`GRANT ${quoteIdentifier(policyRole)} TO ${quoteIdentifier(policyLogin)} WITH INHERIT TRUE, SET TRUE`);
    const routineOwner = `careeros_routine_owner_${Date.now()}`;
    const routineDefaultRecipient = `careeros_routine_default_recipient_${Date.now()}`;
    const ownedRoutineName = `careeros_owned_probe_${Date.now()}`;
    await c.query(`CREATE ROLE ${quoteIdentifier(routineOwner)} NOLOGIN`);
    await c.query(`CREATE ROLE ${quoteIdentifier(routineDefaultRecipient)} NOLOGIN`);
    await c.query(`CREATE FUNCTION ${quoteIdentifier(ownedRoutineName)}() RETURNS integer LANGUAGE SQL AS 'SELECT 1'`);
    await c.query(`ALTER FUNCTION ${quoteIdentifier(ownedRoutineName)}() OWNER TO ${quoteIdentifier(routineOwner)}`);
    await c.query(`ALTER DEFAULT PRIVILEGES FOR ROLE ${quoteIdentifier(routineOwner)} IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO ${quoteIdentifier(routineDefaultRecipient)}`);
    const unrelatedRole = `careeros_unrelated_${Date.now()}`;
    await c.query(`CREATE ROLE ${quoteIdentifier(unrelatedRole)} NOLOGIN`);
    const unrelatedGrantedRole = `careeros_unrelated_granted_${Date.now()}`;
    await c.query(`CREATE ROLE ${quoteIdentifier(unrelatedGrantedRole)} NOLOGIN`);
    await c.query(`GRANT ${quoteIdentifier(memberRole)} TO postgres WITH INHERIT TRUE, SET TRUE`);
    await c.query(`GRANT ${quoteIdentifier(parentRole)} TO ${quoteIdentifier(memberRole)} WITH INHERIT TRUE, SET TRUE`);
    await c.query(`GRANT SELECT ON TABLE "CareerUser" TO ${quoteIdentifier(memberRole)}`);
    await c.query(`GRANT SELECT ON TABLE "CareerUser" TO ${quoteIdentifier(parentRole)}`);
    await c.query(`GRANT ${quoteIdentifier(memberRole)} TO ${quoteIdentifier(unauthorizedLogin)} WITH INHERIT TRUE, SET TRUE`);
    await c.query(`GRANT ${quoteIdentifier(unrelatedGrantedRole)} TO ${quoteIdentifier(unrelatedRole)} WITH INHERIT TRUE, SET TRUE`);
    const memberships = await readCareerOSSchema(c);
    const expectedGrant = (await c.query(`SELECT pg_get_userbyid(member) AS member_role, pg_get_userbyid(roleid) AS granted_role, pg_get_userbyid(grantor) AS grantor_role, admin_option, inherit_option, set_option FROM pg_auth_members WHERE member = 'postgres'::regrole AND roleid = $1::regrole`, [memberRole])).rows[0];
    assert.ok(expectedGrant, "the GRANT statement created a membership row");
    assert.ok(!memberships.roleMemberships.some((m) => m.member_role === unrelatedRole || m.granted_role === unrelatedGrantedRole), "unrelated cluster membership is excluded");
    assert.ok(memberships.roleMemberships.some((m) => m.member_role === expectedGrant.member_role && m.granted_role === expectedGrant.granted_role && m.grantor_role === expectedGrant.grantor_role && m.admin_option === expectedGrant.admin_option && m.inherit_option === expectedGrant.inherit_option && m.set_option === expectedGrant.set_option), "role membership options and grantor are captured exactly as PostgreSQL recorded them");
    assert.ok(memberships.roleMemberships.some((m) => m.member_role === memberRole && m.granted_role === parentRole), "indirect role membership edge is captured");
    assert.ok(memberships.roleMemberships.some((m) => m.member_role === unauthorizedLogin && m.granted_role === memberRole), "direct unauthorized login membership is captured");
    assert.ok(memberships.roleMemberships.some((m) => m.member_role === routineLogin && m.granted_role === routineRole), "routine ACL principals seed relevant membership checks");
    assert.ok(memberships.roleMemberships.some((m) => m.member_role === policyLogin && m.granted_role === policyRole), "RLS policy principals seed relevant membership checks");
    assert.ok(memberships.defaultPrivileges.some((row) => row.owner_role === routineOwner && row.privileges.some((p) => p.grantee?.name === routineDefaultRecipient)), "routine-only owners seed default privilege capture");
    const optionRoot = `careeros_option_root_${Date.now()}`;
    const optionMember = `careeros_option_member_${Date.now()}`;
    const optionLogin = `careeros_option_login_${Date.now()}`;
    for (const role of [optionRoot, optionMember, optionLogin]) await c.query(`CREATE ROLE ${quoteIdentifier(role)} NOLOGIN`);
    await c.query(`GRANT SELECT ON TABLE "CareerUser" TO ${quoteIdentifier(optionRoot)}`);
    await c.query(`GRANT ${quoteIdentifier(optionRoot)} TO ${quoteIdentifier(optionMember)} WITH INHERIT FALSE, SET FALSE`);
    await c.query(`GRANT ${quoteIdentifier(optionMember)} TO ${quoteIdentifier(optionLogin)} WITH INHERIT TRUE, SET TRUE`);
    const optionEvidence = await readCareerOSSchema(c);
    assert.ok(optionEvidence.roleMemberships.some((m) => m.member_role === optionMember && m.granted_role === optionRoot && !m.inherit_option && !m.set_option), "root membership options are preserved per edge");
    assert.ok(optionEvidence.roleMemberships.some((m) => m.member_role === optionLogin && m.granted_role === optionMember && m.inherit_option && m.set_option), "downstream membership options are not cumulatively ANDed");
    const chainRoles = Array.from({ length: 34 }, (_, i) => `careeros_chain_${Date.now()}_${i}`);
    for (const role of chainRoles) await c.query(`CREATE ROLE ${quoteIdentifier(role)} NOLOGIN`);
    await c.query(`GRANT SELECT ON TABLE "CareerUser" TO ${quoteIdentifier(chainRoles[chainRoles.length - 1])}`);
    await c.query(`GRANT ${quoteIdentifier(chainRoles[0])} TO postgres WITH INHERIT TRUE, SET TRUE`);
    for (let i = 1; i < chainRoles.length; i += 1) await c.query(`GRANT ${quoteIdentifier(chainRoles[i])} TO ${quoteIdentifier(chainRoles[i - 1])} WITH INHERIT TRUE, SET TRUE`);
    const longChain = await readCareerOSSchema(c);
    const longChainEdges = new Set(longChain.roleMemberships
      .filter((m) => m.granted_role === chainRoles[chainRoles.length - 1] || chainRoles.includes(m.granted_role))
      .map((m) => `${m.member_role}->${m.granted_role}`));
    const expectedChainEdges = [
      ...chainRoles.slice(1).map((role, index) => `${chainRoles[index]}->${role}`),
      `postgres->${chainRoles[0]}`,
    ];
    assert.deepEqual(expectedChainEdges.filter((edge) => longChainEdges.has(edge)), expectedChainEdges, "every edge in the membership path longer than 32 edges is captured");
    assert.ok(longChain.roleMemberships.some((m) => m.member_role === chainRoles[chainRoles.length - 2] && m.granted_role === chainRoles[chainRoles.length - 1] && !m.admin_option && m.inherit_option && m.set_option), "individual membership options remain unchanged");
    const diamondRoles = [`careeros_diamond_a_${Date.now()}`, `careeros_diamond_b_${Date.now()}`, `careeros_diamond_shared_${Date.now()}`];
    for (const role of diamondRoles) await c.query(`CREATE ROLE ${quoteIdentifier(role)} NOLOGIN`);
    await c.query(`GRANT SELECT ON TABLE "CareerUser" TO ${quoteIdentifier(diamondRoles[2])}`);
    await c.query(`GRANT ${quoteIdentifier(diamondRoles[0])} TO postgres WITH INHERIT TRUE, SET TRUE`);
    await c.query(`GRANT ${quoteIdentifier(diamondRoles[1])} TO postgres WITH INHERIT TRUE, SET TRUE`);
    await c.query(`GRANT ${quoteIdentifier(diamondRoles[2])} TO ${quoteIdentifier(diamondRoles[0])} WITH INHERIT TRUE, SET TRUE`);
    await c.query(`GRANT ${quoteIdentifier(diamondRoles[2])} TO ${quoteIdentifier(diamondRoles[1])} WITH INHERIT TRUE, SET TRUE`);
    const diamond = await readCareerOSSchema(c);
    const diamondEdges = diamond.roleMemberships.filter((m) => m.granted_role === diamondRoles[2]);
    assert.equal(new Set(diamondEdges.map((m) => `${m.member_role}:${m.granted_role}:${m.depth}`)).size, diamondEdges.length, "branching membership paths have no duplicate evidence");
    const membershipBaseline = await readCareerOSSchema(c);
    assert.ok(compareReferenceFields(referenceFingerprint(memberships), referenceFingerprint(expected)).includes("roleMemberships"), "membership drift is reference-visible");
    await c.query(`ALTER DEFAULT PRIVILEGES FOR ROLE ${quoteIdentifier(unrelatedRole)} GRANT SELECT ON TABLES TO ${quoteIdentifier(unrelatedGrantedRole)}`);
    const unrelatedDefaultAndMembership = await readCareerOSSchema(c);
    assert.deepEqual(unrelatedDefaultAndMembership.roleMemberships, membershipBaseline.roleMemberships, "unrelated default-ACL role membership is excluded");
    assert.deepEqual(unrelatedDefaultAndMembership.defaultPrivileges, membershipBaseline.defaultPrivileges, "unrelated global default ACL is excluded");
    assert.deepEqual(unrelatedDefaultAndMembership.roleAttributes, membershipBaseline.roleAttributes, "unrelated default-ACL owners do not seed role attributes");
    await c.query(`ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO PUBLIC`);
    const defaults = await readCareerOSSchema(c);
    assert.notDeepEqual(defaults.defaultPrivileges, expected.defaultPrivileges, "schema-scoped default privileges are fingerprinted");
    assert.ok(compareReferenceFields(referenceFingerprint(defaults), referenceFingerprint(expected)).includes("defaultPrivileges"), "default-ACL drift is reference-visible");
    await c.query(`CREATE SCHEMA "other_acl"`);
    await c.query(`ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "other_acl" GRANT INSERT ON TABLES TO PUBLIC`);
    const otherSchemaDefaults = await readCareerOSSchema(c);
    assert.deepEqual(otherSchemaDefaults.defaultPrivileges, defaults.defaultPrivileges, "other-schema default ACLs are excluded");
    await c.query(`DROP SCHEMA "other_acl" CASCADE`);
    await c.query(`ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE SELECT ON TABLES FROM PUBLIC`);
    await c.query(`ALTER DEFAULT PRIVILEGES FOR ROLE ${quoteIdentifier(unrelatedRole)} REVOKE SELECT ON TABLES FROM ${quoteIdentifier(unrelatedGrantedRole)}`);
    await c.query(`REVOKE ${quoteIdentifier(memberRole)} FROM postgres`);
    await c.query(`REVOKE ${quoteIdentifier(parentRole)} FROM ${quoteIdentifier(memberRole)}`);
    await c.query(`REVOKE ${quoteIdentifier(memberRole)} FROM ${quoteIdentifier(unauthorizedLogin)}`);
    await c.query(`REVOKE SELECT ON TABLE "CareerUser" FROM ${quoteIdentifier(memberRole)},${quoteIdentifier(parentRole)}`);
    await c.query(`REVOKE ${quoteIdentifier(routineRole)} FROM ${quoteIdentifier(routineLogin)}`);
    await c.query(`REVOKE EXECUTE ON FUNCTION ${quoteIdentifier(routineName)}() FROM ${quoteIdentifier(routineRole)}`);
    await c.query(`DROP FUNCTION ${quoteIdentifier(routineName)}()`);
    await c.query(`DROP ROLE ${quoteIdentifier(parentRole)}`);
    await c.query(`DROP ROLE ${quoteIdentifier(unrelatedRole)}`);
    await c.query(`DROP ROLE ${quoteIdentifier(unrelatedGrantedRole)}`);
    await c.query(`DROP ROLE ${quoteIdentifier(memberRole)}`);
    await c.query(`DROP ROLE ${quoteIdentifier(unauthorizedLogin)}`);
    await c.query(`DROP ROLE ${quoteIdentifier(routineLogin)}`);
    await c.query(`DROP ROLE ${quoteIdentifier(routineRole)}`);
    await c.query(`ALTER DEFAULT PRIVILEGES FOR ROLE ${quoteIdentifier(routineOwner)} IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM ${quoteIdentifier(routineDefaultRecipient)}`);
    await c.query(`ALTER FUNCTION ${quoteIdentifier(ownedRoutineName)}() OWNER TO postgres`);
    await c.query(`DROP FUNCTION ${quoteIdentifier(ownedRoutineName)}()`);
    await c.query(`DROP POLICY ${quoteIdentifier(policyName)} ON "CareerUser"`);
    await c.query(`ALTER TABLE "CareerUser" DISABLE ROW LEVEL SECURITY`);
    await c.query(`REVOKE ${quoteIdentifier(policyRole)} FROM ${quoteIdentifier(policyLogin)}`);
    await c.query(`DROP ROLE ${quoteIdentifier(policyLogin)}`);
    await c.query(`DROP ROLE ${quoteIdentifier(policyRole)}`);
    await c.query(`DROP ROLE ${quoteIdentifier(routineDefaultRecipient)}`);
    await c.query(`DROP ROLE ${quoteIdentifier(routineOwner)}`);
    await c.query(`REVOKE ${quoteIdentifier(optionMember)} FROM ${quoteIdentifier(optionLogin)}`);
    await c.query(`REVOKE ${quoteIdentifier(optionRoot)} FROM ${quoteIdentifier(optionMember)}`);
    await c.query(`REVOKE SELECT ON TABLE "CareerUser" FROM ${quoteIdentifier(optionRoot)}`);
    for (const role of [optionLogin, optionMember, optionRoot]) await c.query(`DROP ROLE ${quoteIdentifier(role)}`);
    for (let i = chainRoles.length - 1; i >= 1; i -= 1) await c.query(`REVOKE ${quoteIdentifier(chainRoles[i])} FROM ${quoteIdentifier(chainRoles[i - 1])}`);
    await c.query(`REVOKE ${quoteIdentifier(chainRoles[0])} FROM postgres`);
    await c.query(`REVOKE SELECT ON TABLE "CareerUser" FROM ${quoteIdentifier(chainRoles[chainRoles.length - 1])}`);
    for (const role of chainRoles) await c.query(`DROP ROLE ${quoteIdentifier(role)}`);
    await c.query(`REVOKE ${quoteIdentifier(diamondRoles[2])} FROM ${quoteIdentifier(diamondRoles[0])},${quoteIdentifier(diamondRoles[1])}`);
    await c.query(`REVOKE ${quoteIdentifier(diamondRoles[0])},${quoteIdentifier(diamondRoles[1])} FROM postgres`);
    await c.query(`REVOKE SELECT ON TABLE "CareerUser" FROM ${quoteIdentifier(diamondRoles[2])}`);
    for (const role of diamondRoles) await c.query(`DROP ROLE ${quoteIdentifier(role)}`);
    await c.query(`REVOKE ALL PRIVILEGES ON TABLE "CareerUser" FROM ${quoteIdentifier(adminRole)},${quoteIdentifier(specialRole)}`);
    await c.query(`REVOKE UPDATE ON TABLE "CareerUser" FROM PUBLIC`);
    await c.query(`DROP ROLE ${quoteIdentifier(adminRole)}`);
    await c.query(`DROP ROLE ${quoteIdentifier(specialRole)}`);
  });
  console.log("CareerOS adoption tests passed: observed-schema correction, fingerprint rejection, atomic adoption, checksum rejection, normal-runner repeat.");
} finally {
  if (quotedPublicCreated) {
    await withClient(urlFor("postgres"), async (c) => {
      await c.query(`DROP ROLE IF EXISTS "PUBLIC"`);
    });
  }
  for (const db of databases) await dropDatabase(db);
}
