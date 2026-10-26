import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Client } from "pg";
import { assertPublicSchema, postgresSslForConnection } from "./careerosConnection.mjs";
import { assertAppliedSchemaContract } from "./careerosMigrationSchemaContract.mjs";

const ROOT = new URL("../", import.meta.url);
const MIGRATIONS = [
  {
    id: "20260816000000_careeros_p0_foundation",
    objects: ["CareerUser", "CareerTenant", "CareerTenantMembership", "CareerProfile", "CareerSource", "CareerFactCandidate", "CareerFactReviewDecision", "CareerFact", "CareerSession", "CareerOnboardingState", "CareerAuditEvent", "CareerInvite", "CareerRateLimitBucket"].map((name) => ({ kind: "table", name })),
  },
  {
    id: "20260817000000_careeros_capability_match_product",
    objects: ["CareerCapabilityAuthority", "CareerCapabilityDecision", "CareerOpportunity", "CareerOpportunityRequirement", "CareerMatchEvaluation"].map((name) => ({ kind: "table", name })),
  },
  {
    id: "20260817010000_add_career_story_status",
    objects: [{ kind: "column", table: "CareerOnboardingState", name: "storyStatus" }],
  },
  {
    id: "20260817020000_add_opportunity_decision_state",
    objects: [{ kind: "column", table: "CareerOpportunity", name: "decisionState" }],
  },
  {
    id: "20260818030000_add_resume_drafts",
    objects: [
      { kind: "table", name: "CareerResumeDraft" },
      { kind: "column", table: "CareerOpportunity", name: "lifecycleState" },
      { kind: "table", name: "CareerOpportunityEvent" },
      { kind: "table", name: "CareerOpportunityNote" },
      { kind: "column", table: "CareerResumeDraft", name: "materialType" },
      { kind: "column", table: "CareerResumeDraft", name: "generationMethod" },
      { kind: "column", table: "CareerResumeDraft", name: "provider" },
      { kind: "column", table: "CareerResumeDraft", name: "model" },
      { kind: "table", name: "CareerOpportunityInboxItem" },
    ],
  },
  {
    id: "20260820050000_add_career_search_preferences",
    objects: [{ kind: "table", name: "CareerSearchPreference" }],
  },
  {
    id: "20260822010000_add_career_fact_context_claims",
    objects: [{ kind: "table", name: "CareerFactContextClaim" }],
  },
  {
    id: "20260830100000_add_role_intent_and_relevance_feedback",
    objects: [
      { kind: "table", name: "CareerRelevanceFeedback" },
      { kind: "column", table: "CareerSearchPreference", name: "requestedTitle" },
      { kind: "column", table: "CareerSearchPreference", name: "normalizedTitle" },
      { kind: "column", table: "CareerSearchPreference", name: "roleFamily" },
      { kind: "column", table: "CareerSearchPreference", name: "specialization" },
      { kind: "column", table: "CareerSearchPreference", name: "seniority" },
      { kind: "column", table: "CareerSearchPreference", name: "excludedTitles" },
    ],
  },
];

const migrationPath = (root, id) => new URL(`prisma/migrations/${id}/migration.sql`, root);
const checksum = (sql) => createHash("sha256").update(sql, "utf8").digest("hex");
const postgresIdentifier = (name) => Buffer.from(name, "utf8").subarray(0, 63).toString("utf8");

async function columnExists(client, table, column) {
  const result = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = current_schema() AND table_name = $1 AND column_name = $2
     ) AS exists`,
    [table, column],
  );
  return result.rows[0].exists;
}

async function tableExists(client, table) {
  const result = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM pg_class
       WHERE relnamespace = current_schema()::regnamespace AND relname = $1
     ) AS exists`,
    [table],
  );
  return result.rows[0].exists;
}

async function ledgerColumnExists(client, column) {
  return columnExists(client, "CareerOSMigration", column);
}

async function ledgerRelationKind(client) {
  const result = await client.query(`SELECT c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname=current_schema() AND c.relname='CareerOSMigration'`);
  return result.rows[0]?.relkind || null;
}

async function assertMigrationLedgerDefinition(client) {
  const relation = await client.query(`SELECT c.oid, c.relkind, c.relpersistence
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname=current_schema() AND c.relname='CareerOSMigration'`);
  if (!relation.rowCount) return false;
  if (relation.rows[0].relkind !== "r" || relation.rows[0].relpersistence !== "p") throw new Error("CAREEROS_MIGRATION_LEDGER_UNVERIFIED");
  const oid = relation.rows[0].oid;
  const columns = (await client.query(`SELECT a.attname, format_type(a.atttypid,a.atttypmod) AS type_name,
      a.attnotnull, COALESCE(pg_get_expr(d.adbin,d.adrelid),'') AS column_default
    FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
    WHERE a.attrelid=$1 AND a.attnum>0 AND NOT a.attisdropped ORDER BY a.attnum`, [oid])).rows;
  const expectedColumns = [
    { attname: "id", type_name: "text", attnotnull: true, column_default: "" },
    { attname: "checksum", type_name: "text", attnotnull: true, column_default: "" },
    { attname: "appliedAt", type_name: "timestamp with time zone", attnotnull: true, column_default: "CURRENT_TIMESTAMP" },
  ];
  if (JSON.stringify(columns) !== JSON.stringify(expectedColumns)) throw new Error("CAREEROS_MIGRATION_LEDGER_UNVERIFIED");
  const constraints = (await client.query(`SELECT c.contype, c.conname, array_to_json(array_agg(a.attname ORDER BY u.ord)) AS columns
    FROM pg_constraint c LEFT JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS u(attnum,ord) ON true
    LEFT JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=u.attnum
    WHERE c.conrelid=$1 GROUP BY c.oid,c.contype,c.conname ORDER BY c.conname`, [oid])).rows;
  const primaryKeys = constraints.filter((constraint) => constraint.contype === "p" && JSON.stringify(constraint.columns) === JSON.stringify(["id"]));
  if (primaryKeys.length !== 1 || constraints.length !== 1) throw new Error("CAREEROS_MIGRATION_LEDGER_UNVERIFIED");
  const triggers = await client.query(`SELECT 1 FROM pg_trigger WHERE tgrelid=$1 AND NOT tgisinternal LIMIT 1`, [oid]);
  if (triggers.rowCount) throw new Error("CAREEROS_MIGRATION_LEDGER_UNVERIFIED");
  const rules = await client.query(`SELECT 1 FROM pg_rewrite WHERE ev_class=$1 LIMIT 1`, [oid]);
  if (rules.rowCount) throw new Error("CAREEROS_MIGRATION_LEDGER_UNVERIFIED");
  return true;
}

async function migrationGuardedObjects(migration, migrationsRoot) {
  const sql = await readFile(migrationPath(migrationsRoot, migration.id), "utf8");
  const objects = [...migration.objects];
  for (const match of sql.matchAll(/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+"([^"]+)"/gi)) objects.push({ kind: "table", name: match[1] });
  for (const match of sql.matchAll(/ALTER\s+TABLE\s+"([^"]+)"\s+ADD\s+COLUMN(?:\s+IF\s+NOT\s+EXISTS)?\s+"([^"]+)"/gi)) objects.push({ kind: "column", table: match[1], name: match[2] });
  for (const match of sql.matchAll(/CREATE\s+(?:UNIQUE\s+)?INDEX(?:\s+IF\s+NOT\s+EXISTS)?\s+"([^"]+)"\s+ON\s+"([^"]+)"/gi)) objects.push({ kind: "index", table: match[2], name: match[1] });
  for (const match of sql.matchAll(/IF\s+NOT\s+EXISTS\s*\(\s*SELECT\s+1\s+FROM\s+pg_constraint\s+WHERE\s+conname\s*=\s*'([^']+)'[\s\S]*?THEN\s+ALTER\s+TABLE\s+"([^"]+)"\s+ADD\s+CONSTRAINT/gi)) objects.push({ kind: "constraint", table: match[2], name: match[1] });
  return [...new Map(objects.map((object) => [`${object.kind}:${object.table || ""}:${object.name}`, object])).values()];
}

async function migrationObjectExists(client, object) {
  if (object.kind === "table") return tableExists(client, object.name);
  if (object.kind === "column") return columnExists(client, object.table, object.name);
  if (object.kind === "index") return (await client.query(`SELECT EXISTS (
    SELECT 1 FROM pg_class i JOIN pg_namespace n ON n.oid=i.relnamespace
    WHERE n.nspname=current_schema() AND i.relname=$1 AND i.relkind IN ('i','I')
      AND EXISTS (SELECT 1 FROM pg_index x JOIN pg_class base ON base.oid=x.indrelid
        WHERE x.indexrelid=i.oid AND base.relname=$2 AND base.relnamespace=n.oid)
  ) AS exists`, [postgresIdentifier(object.name), postgresIdentifier(object.table)])).rows[0].exists;
  return (await client.query(`SELECT EXISTS (
    SELECT 1 FROM pg_constraint k JOIN pg_class t ON t.oid=k.conrelid
    JOIN pg_namespace n ON n.oid=t.relnamespace
    WHERE n.nspname=current_schema() AND k.conname=$1 AND t.relname=$2
  ) AS exists`, [postgresIdentifier(object.name), postgresIdentifier(object.table)])).rows[0].exists;
}

async function assertAppliedMigrationObjectsPresent(client, migrations, migrationsRoot) {
  for (const migration of migrations) for (const object of await migrationGuardedObjects(migration, migrationsRoot)) {
    if (!(await migrationObjectExists(client, object))) {
      throw new Error(`CAREEROS_MIGRATION_APPLIED_OBJECT_MISSING:${migration.id}:${object.kind}:${object.table ? `${object.table}.` : ""}${object.name}`);
    }
  }
}

async function assertUnledgeredSchemaAbsent(client, migrations, migrationsRoot) {
  for (const migration of migrations) for (const object of await migrationGuardedObjects(migration, migrationsRoot)) {
    const exists = object.kind === "index"
      ? (await client.query(`SELECT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=current_schema() AND c.relname=$1) AS exists`, [postgresIdentifier(object.name)])).rows[0].exists
      : object.kind === "constraint"
        ? (await client.query(`SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname=$1) AS exists`, [postgresIdentifier(object.name)])).rows[0].exists
        : await migrationObjectExists(client, object);
    if (exists) {
      throw new Error(`CAREEROS_MIGRATION_STATE_UNVERIFIED:${migration.id}:${object.kind}:${object.name}`);
    }
  }
}

async function assertAppliedMigrationChecksums(client, applied, migrations, migrationsRoot) {
  const known = new Map(migrations.map((migration) => [migration.id, migration]));
  for (const row of applied) {
    const migration = known.get(row.id);
    if (!migration) throw new Error(`CAREEROS_MIGRATION_UNKNOWN_LEDGER:${row.id}`);
    const digest = checksum(await readFile(migrationPath(migrationsRoot, migration.id), "utf8"));
    if (row.checksum !== digest) throw new Error(`CAREEROS_MIGRATION_CHECKSUM_MISMATCH:${migration.id}`);
  }
}

async function applyMigration(client, migration, migrationsRoot) {
  const sql = await readFile(migrationPath(migrationsRoot, migration.id), "utf8");
  const digest = checksum(sql);
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", ["careeros-migration-v1"]);
    await client.query(`CREATE TABLE IF NOT EXISTS "CareerOSMigration" (
      "id" TEXT PRIMARY KEY,
      "checksum" TEXT NOT NULL,
      "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    if (!(await ledgerColumnExists(client, "checksum"))) {
      throw new Error("CAREEROS_MIGRATION_LEDGER_UNVERIFIED");
    }
    const existing = await client.query(
      `SELECT "checksum" FROM "CareerOSMigration" WHERE "id" = $1`,
      [migration.id],
    );
    if (existing.rowCount) {
      if (existing.rows[0].checksum !== digest) {
        throw new Error(`CAREEROS_MIGRATION_CHECKSUM_MISMATCH:${migration.id}`);
      }
    } else {
      await client.query(sql);
      await client.query(
        `INSERT INTO "CareerOSMigration" ("id", "checksum") VALUES ($1, $2)`,
        [migration.id, digest],
      );
      const persisted = await client.query(`SELECT "checksum" FROM "CareerOSMigration" WHERE "id"=$1`, [migration.id]);
      if (persisted.rowCount !== 1 || persisted.rows[0].checksum !== digest) throw new Error(`CAREEROS_MIGRATION_LEDGER_WRITE_UNVERIFIED:${migration.id}`);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

export async function runCareerosMigrations({ connectionString = process.env.DATABASE_URL, migrationsRoot = ROOT } = {}) {
  if (!connectionString) throw new Error("DATABASE_URL_REQUIRED");
  const client = new Client({ connectionString, ssl: postgresSslForConnection(connectionString) });
  await client.connect();
  try {
    await assertPublicSchema(client);
    await client.query("SELECT pg_advisory_lock(hashtext($1))", ["careeros-migration-v1"]);
    try {
    const ledgerExists = await assertMigrationLedgerDefinition(client);
    const appliedRows = ledgerExists
      ? (await client.query('SELECT "id", "checksum" FROM "CareerOSMigration"')).rows
      : [];
    await assertAppliedMigrationChecksums(client, appliedRows, MIGRATIONS, migrationsRoot);
    const applied = appliedRows.map((row) => row.id);
    await assertAppliedSchemaContract(client, appliedRows, migrationsRoot);
    const missing = MIGRATIONS.filter((migration) => !applied.includes(migration.id));
    await assertUnledgeredSchemaAbsent(client, missing, migrationsRoot);
    for (const migration of MIGRATIONS) await applyMigration(client, migration, migrationsRoot);
    } finally {
      await client.query("SELECT pg_advisory_unlock(hashtext($1))", ["careeros-migration-v1"]).catch(() => {});
    }
  } finally {
    await client.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runCareerosMigrations();
}
