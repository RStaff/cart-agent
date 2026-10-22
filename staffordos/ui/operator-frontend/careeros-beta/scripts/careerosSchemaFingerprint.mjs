import { createHash } from "node:crypto";

export const CAREEROS_TABLES = [
  "CareerUser", "CareerTenant", "CareerTenantMembership", "CareerProfile", "CareerSource",
  "CareerFactCandidate", "CareerFactReviewDecision", "CareerFact", "CareerSession",
  "CareerOnboardingState", "CareerAuditEvent", "CareerInvite", "CareerRateLimitBucket",
  "CareerCapabilityAuthority", "CareerCapabilityDecision", "CareerOpportunity",
  "CareerOpportunityRequirement", "CareerMatchEvaluation", "CareerResumeDraft",
  "CareerOpportunityEvent", "CareerOpportunityNote", "CareerOpportunityInboxItem",
  "CareerSearchPreference", "CareerFactContextClaim", "CareerRelevanceFeedback",
];

export const HISTORICAL_SCHEMA_OBJECTS = Object.freeze(["_prisma_migrations"]);
export const OPERATIONAL_SCHEMA_OBJECTS = Object.freeze(["CareerOSMigration", "CareerOSMigrationAdoption"]);
const tableList = CAREEROS_TABLES.map((table) => `'${table.replaceAll("'", "''")}'`).join(",");

const CATALOG_SQL = `
  SELECT
    c.relname AS object_name,
    c.relkind AS object_kind,
    c.relpersistence,
    c.relreplident,
    c.relrowsecurity,
    c.relforcerowsecurity
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = current_schema()
    AND c.relkind IN ('r','p','v','m','S','f')
  ORDER BY c.relname,c.relkind`;

export async function readCareerOSSchema(client) {
  const [columns, constraints, indexes, tables, objects] = await Promise.all([
    client.query(`SELECT c.table_name,c.column_name,c.data_type,c.udt_schema,c.udt_name,c.is_nullable,
      COALESCE(c.column_default,'') AS column_default,c.character_maximum_length,c.numeric_precision,
      c.numeric_scale,c.datetime_precision,COALESCE(a.attidentity,'') AS identity_kind,
      COALESCE(a.attgenerated,'') AS generated_kind,COALESCE(coll.collname,'') AS collation_name,
      a.atttypmod
      FROM information_schema.columns c
      JOIN pg_class pc ON pc.relname=c.table_name
      JOIN pg_namespace pn ON pn.oid=pc.relnamespace AND pn.nspname=c.table_schema
      JOIN pg_attribute a ON a.attrelid=pc.oid AND a.attname=c.column_name
      LEFT JOIN pg_collation coll ON coll.oid=a.attcollation
      WHERE c.table_schema=current_schema() AND c.table_name IN (${tableList})
      ORDER BY c.table_name,c.ordinal_position`),
    client.query(`SELECT tc.table_name,tc.constraint_name,tc.constraint_type,pc.condeferrable,pc.condeferred,
      pc.convalidated,pg_get_constraintdef(pc.oid) AS definition
      FROM information_schema.table_constraints tc
      JOIN pg_constraint pc ON pc.conname=tc.constraint_name
      JOIN pg_class c ON c.oid=pc.conrelid AND c.relname=tc.table_name
      WHERE tc.table_schema=current_schema() AND tc.table_name IN (${tableList})
      ORDER BY tc.table_name,tc.constraint_type,definition`),
    client.query(`SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes
      WHERE schemaname=current_schema() AND tablename IN (${tableList})
      ORDER BY tablename,indexname`),
    client.query(`SELECT tablename FROM pg_tables WHERE schemaname=current_schema() AND tablename IN (${tableList}) ORDER BY tablename`),
    client.query(CATALOG_SQL),
  ]);
  const catalogObjects = objects.rows;
  const value = {
    tables: tables.rows.map((row) => row.tablename),
    columns: columns.rows,
    constraints: constraints.rows,
    indexes: indexes.rows,
    // Operational ledgers are intentionally excluded from the application
    // fingerprint; catalogObjects remains available for unexpected-object checks.
    objects: objects.rows.filter((row) => CAREEROS_TABLES.includes(row.object_name) || HISTORICAL_SCHEMA_OBJECTS.includes(row.object_name)),
  };
  const canonical = JSON.stringify(value);
  return { ...value, catalogObjects, canonical, fingerprint: createHash("sha256").update(canonical, "utf8").digest("hex") };
}

export function assertExactCareerOSSchema(schema) {
  const actual = [...schema.tables].sort();
  const expected = [...CAREEROS_TABLES].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`CAREEROS_SCHEMA_TABLE_SET_MISMATCH:${JSON.stringify({ expected, actual })}`);
  }
}

export function assertNoUnexpectedApplicationObjects(schema) {
  const allowed = new Set([...CAREEROS_TABLES, ...HISTORICAL_SCHEMA_OBJECTS, ...OPERATIONAL_SCHEMA_OBJECTS]);
  const unexpected = (schema.catalogObjects || schema.objects || []).filter((row) => !allowed.has(row.object_name));
  if (unexpected.length) throw new Error(`CAREEROS_UNEXPECTED_SCHEMA_OBJECTS:${JSON.stringify(unexpected.map(({ object_name, object_kind }) => ({ object_name, object_kind })))}`);
}
