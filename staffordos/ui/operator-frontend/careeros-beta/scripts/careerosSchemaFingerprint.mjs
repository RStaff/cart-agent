import { createHash } from "node:crypto";

export const CAREEROS_SCHEMA_FINGERPRINT_VERSION = "careeros-schema-fingerprint-v2";

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

function mapRoleName(value, roleMapping) {
  return roleMapping[value] || value;
}

function mapRoleText(value, roleMapping) {
  let result = value || "";
  for (const [from, to] of Object.entries(roleMapping)) {
    result = result.replaceAll(`"${from}"`, `"${to}"`).replaceAll(from, to);
  }
  return result;
}

export async function readCareerOSSchema(client, { roleMapping = {} } = {}) {
  const [columns, constraints, indexes, tables, objects, triggers, routines, policies, schemaPrivileges, relationPrivileges, columnPrivileges, sequences] = await Promise.all([
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
      ORDER BY c.table_name,c.column_name`),
    client.query(`SELECT tc.table_name,tc.constraint_name,tc.constraint_type,pc.condeferrable,pc.condeferred,
      pc.convalidated,pg_get_constraintdef(pc.oid) AS definition
      FROM information_schema.table_constraints tc
      JOIN pg_constraint pc ON pc.conname=tc.constraint_name
      JOIN pg_class c ON c.oid=pc.conrelid AND c.relname=tc.table_name
      JOIN pg_namespace cn ON cn.oid=c.relnamespace AND cn.nspname=tc.table_schema
      WHERE tc.table_schema=current_schema() AND tc.table_name IN (${tableList})
      ORDER BY tc.table_name,tc.constraint_type,definition`),
    client.query(`SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes
      WHERE schemaname=current_schema() AND tablename IN (${tableList})
      ORDER BY tablename,indexname`),
    client.query(`SELECT tablename FROM pg_tables WHERE schemaname=current_schema() AND tablename IN (${tableList}) ORDER BY tablename`),
    client.query(CATALOG_SQL),
    client.query(`SELECT c.relname AS table_name,t.tgname AS trigger_name,t.tgenabled,
      pg_get_triggerdef(t.oid) AS definition
      FROM pg_trigger t
      JOIN pg_class c ON c.oid=t.tgrelid
      JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname=current_schema() AND NOT t.tgisinternal
      ORDER BY c.relname,t.tgname`),
    client.query(`SELECT p.proname AS routine_name,p.prokind,p.provolatile,p.prosecdef,
      pg_get_function_identity_arguments(p.oid) AS identity_arguments,
      pg_get_functiondef(p.oid) AS definition
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname=current_schema()
      ORDER BY p.proname,p.prokind,identity_arguments`),
    client.query(`SELECT c.relname AS table_name,pol.polname AS policy_name,
      pol.polpermissive,pol.polcmd,pol.polroles::text AS roles,
      COALESCE(pg_get_expr(pol.polqual,pol.polrelid),'') AS using_expression,
      COALESCE(pg_get_expr(pol.polwithcheck,pol.polrelid),'') AS check_expression
      FROM pg_policy pol
      JOIN pg_class c ON c.oid=pol.polrelid
      JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname=current_schema()
      ORDER BY c.relname,pol.polname`),
    client.query(`SELECT n.nspname AS schema_name, pg_get_userbyid(n.nspowner) AS owner_role,
      COALESCE(n.nspacl::text,'') AS acl
      FROM pg_namespace n WHERE n.nspname=current_schema()`),
    client.query(`SELECT c.relname AS object_name,c.relkind AS object_kind,
      pg_get_userbyid(c.relowner) AS owner_role,COALESCE(c.relacl::text,'') AS acl
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname=current_schema()
        AND (c.relname IN (${tableList},'_prisma_migrations') OR c.relkind='S')
      ORDER BY c.relname,c.relkind`),
    client.query(`SELECT table_name,column_name,grantee,grantor,privilege_type,is_grantable
      FROM information_schema.column_privileges
      WHERE table_schema=current_schema() AND table_name IN (${tableList})
      ORDER BY table_name,column_name,grantee,privilege_type`),
    client.query(`SELECT c.relname AS sequence_name,pg_get_userbyid(c.relowner) AS owner_role,
      COALESCE(c.relacl::text,'') AS acl
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname=current_schema() AND c.relkind='S'
      ORDER BY c.relname`),
  ]);
  const catalogObjects = objects.rows;
  const canonicalSort = (rows) => [...rows].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const normalizeRoles = (rows, fields) => rows.map((row) => {
    const copy = { ...row };
    for (const field of fields) if (copy[field] != null) copy[field] = mapRoleName(copy[field], roleMapping);
    if (copy.acl != null) copy.acl = mapRoleText(copy.acl, roleMapping);
    return copy;
  });
  const value = {
    fingerprintVersion: CAREEROS_SCHEMA_FINGERPRINT_VERSION,
    tables: tables.rows.map((row) => row.tablename).sort(),
    columns: canonicalSort(columns.rows),
    constraints: canonicalSort(constraints.rows),
    indexes: canonicalSort(indexes.rows),
    triggers: canonicalSort(triggers.rows),
    routines: canonicalSort(routines.rows),
    policies: canonicalSort(policies.rows),
    roleMapping: Object.fromEntries(Object.entries(roleMapping).sort(([a], [b]) => a.localeCompare(b))),
    schemaPrivileges: canonicalSort(normalizeRoles(schemaPrivileges.rows, ["owner_role"])),
    relationPrivileges: canonicalSort(normalizeRoles(relationPrivileges.rows, ["owner_role"])),
    columnPrivileges: canonicalSort(normalizeRoles(columnPrivileges.rows, ["grantee", "grantor"])),
    sequences: canonicalSort(normalizeRoles(sequences.rows, ["owner_role"])),
    // Operational ledgers are intentionally excluded from the application
    // fingerprint; catalogObjects remains available for unexpected-object checks.
    objects: canonicalSort(objects.rows.filter((row) => CAREEROS_TABLES.includes(row.object_name) || HISTORICAL_SCHEMA_OBJECTS.includes(row.object_name))),
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
