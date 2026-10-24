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

function validateRoleMapping(roleMapping) {
  for (const [from, to] of Object.entries(roleMapping)) {
    if (from === "PUBLIC" || to === "PUBLIC") {
      throw new Error("CAREEROS_PUBLIC_ROLE_MAPPING_FORBIDDEN");
    }
  }
}

function mapRoleName(value, roleMapping) {
  return roleMapping[value] || value;
}

function mapPrincipal(value, roleMapping) {
  if (value && typeof value === "object") {
    if (value.kind === "public") return { kind: "public" };
    if (value.kind === "role") return { kind: "role", name: mapRoleName(value.name, roleMapping) };
  }
  // Keep compatibility with older captured references while never treating
  // the PUBLIC pseudo-principal as a private role.
  if (value === "PUBLIC") return { kind: "public" };
  return { kind: "role", name: mapRoleName(value, roleMapping) };
}

function mapPrivilegeJson(value, roleMapping) {
  const privileges = typeof value === "string" ? JSON.parse(value || "[]") : (value || []);
  return privileges.map((privilege) => ({
    ...privilege,
    grantee: mapPrincipal(privilege.grantee, roleMapping),
    grantor: mapPrincipal(privilege.grantor, roleMapping),
  })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

export async function readCareerOSSchema(client, { roleMapping = {} } = {}) {
  validateRoleMapping(roleMapping);
  const [columns, constraints, indexes, tables, objects, triggers, routines, policies, schemaPrivileges, relationPrivileges, columnPrivileges, sequences, roleMemberships, defaultPrivileges] = await Promise.all([
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
      pg_get_userbyid(p.proowner) AS owner_role,
      COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'grantee',CASE WHEN e.grantee=0 THEN jsonb_build_object('kind','public') ELSE jsonb_build_object('kind','role','name',pg_get_userbyid(e.grantee)) END,
        'grantor',CASE WHEN e.grantor=0 THEN jsonb_build_object('kind','public') ELSE jsonb_build_object('kind','role','name',pg_get_userbyid(e.grantor)) END,'privilege',e.privilege_type,'grantable',e.is_grantable)
        ORDER BY e.grantee,e.privilege_type)::text FROM aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) e),'[]') AS privileges,
      pg_get_function_identity_arguments(p.oid) AS identity_arguments,
      pg_get_functiondef(p.oid) AS definition
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname=current_schema()
      ORDER BY p.proname,p.prokind,identity_arguments`),
    client.query(`SELECT c.relname AS table_name,pol.polname AS policy_name,
      pol.polpermissive,pol.polcmd,
        COALESCE((SELECT jsonb_agg(CASE WHEN role_oid=0 THEN jsonb_build_object('kind','public') ELSE jsonb_build_object('kind','role','name',r.rolname) END ORDER BY role_oid)
        FROM unnest(pol.polroles) role_oid LEFT JOIN pg_roles r ON r.oid=role_oid),'[]')::text AS roles,
      COALESCE(pg_get_expr(pol.polqual,pol.polrelid),'') AS using_expression,
      COALESCE(pg_get_expr(pol.polwithcheck,pol.polrelid),'') AS check_expression
      FROM pg_policy pol
      JOIN pg_class c ON c.oid=pol.polrelid
      JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname=current_schema()
      ORDER BY c.relname,pol.polname`),
    client.query(`SELECT n.nspname AS schema_name, pg_get_userbyid(n.nspowner) AS owner_role,
      COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'grantee',CASE WHEN e.grantee=0 THEN jsonb_build_object('kind','public') ELSE jsonb_build_object('kind','role','name',pg_get_userbyid(e.grantee)) END,
        'grantor',CASE WHEN e.grantor=0 THEN jsonb_build_object('kind','public') ELSE jsonb_build_object('kind','role','name',pg_get_userbyid(e.grantor)) END,'privilege',e.privilege_type,'grantable',e.is_grantable)
        ORDER BY e.grantee,e.privilege_type)::text FROM aclexplode(COALESCE(n.nspacl,acldefault('n',n.nspowner))) e),'[]') AS privileges
      FROM pg_namespace n WHERE n.nspname=current_schema()`),
    client.query(`SELECT c.relname AS object_name,c.relkind AS object_kind,
      pg_get_userbyid(c.relowner) AS owner_role,
      COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'grantee',CASE WHEN e.grantee=0 THEN jsonb_build_object('kind','public') ELSE jsonb_build_object('kind','role','name',pg_get_userbyid(e.grantee)) END,
        'grantor',CASE WHEN e.grantor=0 THEN jsonb_build_object('kind','public') ELSE jsonb_build_object('kind','role','name',pg_get_userbyid(e.grantor)) END,'privilege',e.privilege_type,'grantable',e.is_grantable)
        ORDER BY e.grantee,e.privilege_type)::text FROM aclexplode(COALESCE(c.relacl,acldefault(CASE WHEN c.relkind='S' THEN 'S'::"char" ELSE 'r'::"char" END,c.relowner))) e),'[]') AS privileges
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname=current_schema()
        AND (c.relname IN (${tableList},'_prisma_migrations') OR c.relkind='S')
      ORDER BY c.relname,c.relkind`),
    client.query(`SELECT c.relname AS table_name,a.attname AS column_name,
      CASE WHEN a.attacl IS NULL THEN '[]' ELSE COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'grantee',CASE WHEN e.grantee=0 THEN jsonb_build_object('kind','public') ELSE jsonb_build_object('kind','role','name',pg_get_userbyid(e.grantee)) END,
        'grantor',CASE WHEN e.grantor=0 THEN jsonb_build_object('kind','public') ELSE jsonb_build_object('kind','role','name',pg_get_userbyid(e.grantor)) END,
        'privilege',e.privilege_type,'grantable',e.is_grantable)
        ORDER BY e.grantee,e.privilege_type)::text FROM aclexplode(a.attacl) e),'[]') END AS privileges
      FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname=current_schema() AND c.relname IN (${tableList}) AND a.attnum>0 AND NOT a.attisdropped
      ORDER BY c.relname,a.attnum`),
    client.query(`SELECT c.relname AS sequence_name,pg_get_userbyid(c.relowner) AS owner_role,
      COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'grantee',CASE WHEN e.grantee=0 THEN jsonb_build_object('kind','public') ELSE jsonb_build_object('kind','role','name',pg_get_userbyid(e.grantee)) END,
        'grantor',CASE WHEN e.grantor=0 THEN jsonb_build_object('kind','public') ELSE jsonb_build_object('kind','role','name',pg_get_userbyid(e.grantor)) END,'privilege',e.privilege_type,'grantable',e.is_grantable)
        ORDER BY e.grantee,e.privilege_type)::text FROM aclexplode(COALESCE(c.relacl,acldefault('S',c.relowner))) e),'[]') AS privileges
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname=current_schema() AND c.relkind='S'
      ORDER BY c.relname`),
    client.query(`WITH RECURSIVE relevant_owners AS (
        SELECT n.nspowner AS oid FROM pg_namespace n WHERE n.nspname=current_schema()
        UNION SELECT c.relowner FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
          WHERE n.nspname=current_schema() AND (c.relname IN (${tableList},'_prisma_migrations') OR c.relkind='S')
        UNION SELECT p.proowner FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname=current_schema()
      ), relevant AS (
        SELECT oid FROM relevant_owners
        UNION SELECT e.grantee FROM pg_namespace n CROSS JOIN LATERAL aclexplode(COALESCE(n.nspacl,acldefault('n',n.nspowner))) e WHERE n.nspname=current_schema()
        UNION SELECT e.grantor FROM pg_namespace n CROSS JOIN LATERAL aclexplode(COALESCE(n.nspacl,acldefault('n',n.nspowner))) e WHERE n.nspname=current_schema()
        UNION SELECT e.grantee FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl,acldefault(CASE WHEN c.relkind='S' THEN 'S'::"char" ELSE 'r'::"char" END,c.relowner))) e
          WHERE n.nspname=current_schema() AND (c.relname IN (${tableList},'_prisma_migrations') OR c.relkind='S')
        UNION SELECT e.grantor FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl,acldefault(CASE WHEN c.relkind='S' THEN 'S'::"char" ELSE 'r'::"char" END,c.relowner))) e
          WHERE n.nspname=current_schema() AND (c.relname IN (${tableList},'_prisma_migrations') OR c.relkind='S')
        UNION SELECT e.grantee FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace CROSS JOIN LATERAL aclexplode(a.attacl) e
          WHERE a.attacl IS NOT NULL AND n.nspname=current_schema() AND c.relname IN (${tableList}) AND a.attnum>0 AND NOT a.attisdropped
        UNION SELECT e.grantor FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace CROSS JOIN LATERAL aclexplode(a.attacl) e
          WHERE a.attacl IS NOT NULL AND n.nspname=current_schema() AND c.relname IN (${tableList}) AND a.attnum>0 AND NOT a.attisdropped
        UNION SELECT e.grantee FROM pg_default_acl d CROSS JOIN LATERAL aclexplode(d.defaclacl) e
          WHERE d.defaclnamespace=0 OR d.defaclnamespace=(SELECT oid FROM pg_namespace WHERE nspname=current_schema())
        UNION SELECT e.grantor FROM pg_default_acl d CROSS JOIN LATERAL aclexplode(d.defaclacl) e
          WHERE d.defaclnamespace=0 OR d.defaclnamespace=(SELECT oid FROM pg_namespace WHERE nspname=current_schema())
      ), memberships AS (
        SELECT am.member,am.roleid,am.admin_option,am.inherit_option,am.set_option,1 AS depth
        FROM pg_auth_members am WHERE am.member IN (SELECT oid FROM relevant) OR am.roleid IN (SELECT oid FROM relevant)
        UNION ALL
        SELECT am.member,am.roleid,(m.admin_option AND am.admin_option),(m.inherit_option AND am.inherit_option),
          (m.set_option AND am.set_option),m.depth + 1
        FROM memberships m JOIN pg_auth_members am ON am.member=m.roleid OR am.roleid=m.member
        WHERE m.depth < 32
      )
      SELECT DISTINCT pg_get_userbyid(member) AS member_role, pg_get_userbyid(roleid) AS granted_role,
        admin_option,inherit_option,set_option,depth
      FROM memberships ORDER BY member_role,granted_role,depth`),
    client.query(`SELECT COALESCE(n.nspname,'') AS schema_name, pg_get_userbyid(d.defaclrole) AS owner_role,
      d.defaclobjtype,
      COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'grantee',CASE WHEN e.grantee=0 THEN jsonb_build_object('kind','public') ELSE jsonb_build_object('kind','role','name',pg_get_userbyid(e.grantee)) END,
        'grantor',CASE WHEN e.grantor=0 THEN jsonb_build_object('kind','public') ELSE jsonb_build_object('kind','role','name',pg_get_userbyid(e.grantor)) END,
        'privilege',e.privilege_type,'grantable',e.is_grantable)
        ORDER BY e.grantee,e.privilege_type)::text FROM aclexplode(d.defaclacl) e),'[]') AS privileges
      FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace
      WHERE (d.defaclnamespace=0 OR d.defaclnamespace=(SELECT oid FROM pg_namespace WHERE nspname=current_schema()))
        AND d.defaclrole IN (SELECT nspowner FROM pg_namespace WHERE nspname=current_schema()
          UNION SELECT c.relowner FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace WHERE ns.nspname=current_schema())
      ORDER BY d.defaclrole,d.defaclnamespace,d.defaclobjtype`),
  ]);
  const catalogObjects = objects.rows;
  const canonicalSort = (rows) => [...rows].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const normalizeRoles = (rows, fields) => rows.map((row) => {
    const copy = { ...row };
    for (const field of fields) if (copy[field] != null) copy[field] = mapRoleName(copy[field], roleMapping);
    if (copy.privileges != null) copy.privileges = mapPrivilegeJson(copy.privileges, roleMapping);
    return copy;
  });
  const value = {
    fingerprintVersion: CAREEROS_SCHEMA_FINGERPRINT_VERSION,
    tables: tables.rows.map((row) => row.tablename).sort(),
    columns: canonicalSort(columns.rows),
    constraints: canonicalSort(constraints.rows),
    indexes: canonicalSort(indexes.rows),
    triggers: canonicalSort(triggers.rows),
    routines: canonicalSort(normalizeRoles(routines.rows, ["owner_role"])),
    policies: canonicalSort(policies.rows.map((row) => ({ ...row, roles: JSON.parse(row.roles || "[]").map((role) => mapPrincipal(role, roleMapping)).sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) }))),
    roleMapping: Object.fromEntries(Object.entries(roleMapping).sort(([a], [b]) => a.localeCompare(b))),
    schemaPrivileges: canonicalSort(normalizeRoles(schemaPrivileges.rows, ["owner_role"])),
    relationPrivileges: canonicalSort(normalizeRoles(relationPrivileges.rows, ["owner_role"])),
    columnPrivileges: canonicalSort(normalizeRoles(columnPrivileges.rows, [])),
    sequences: canonicalSort(normalizeRoles(sequences.rows, ["owner_role"])),
    roleMemberships: canonicalSort(normalizeRoles(roleMemberships.rows, ["member_role", "granted_role"])),
    defaultPrivileges: canonicalSort(normalizeRoles(defaultPrivileges.rows, ["owner_role"])),
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
