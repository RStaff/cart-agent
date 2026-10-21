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

const tableList = CAREEROS_TABLES.map((table) => `'${table.replaceAll("'", "''")}'`).join(",");

export async function readCareerOSSchema(client) {
  const [columns, constraints, indexes, tables] = await Promise.all([
    client.query(`SELECT table_name,column_name,data_type,udt_name,is_nullable,COALESCE(column_default,'') AS column_default
      FROM information_schema.columns WHERE table_schema=current_schema() AND table_name IN (${tableList})
      ORDER BY table_name,column_name`),
    client.query(`SELECT tc.table_name,tc.constraint_type,pg_get_constraintdef(pc.oid) AS definition
      FROM information_schema.table_constraints tc
      JOIN pg_constraint pc ON pc.conname=tc.constraint_name
      JOIN pg_class c ON c.oid=pc.conrelid AND c.relname=tc.table_name
      WHERE tc.table_schema=current_schema() AND tc.table_name IN (${tableList})
      ORDER BY tc.table_name,tc.constraint_type,definition`),
    client.query(`SELECT tablename,indexname,indexdef FROM pg_indexes
      WHERE schemaname=current_schema() AND tablename IN (${tableList})
      ORDER BY tablename,indexname`),
    client.query(`SELECT tablename FROM pg_tables WHERE schemaname=current_schema() AND tablename IN (${tableList})
      ORDER BY tablename`),
  ]);
  const value = {
    tables: tables.rows.map((row) => row.tablename),
    columns: columns.rows,
    constraints: constraints.rows,
    indexes: indexes.rows,
  };
  const canonical = JSON.stringify(value);
  return { ...value, canonical, fingerprint: createHash("sha256").update(canonical, "utf8").digest("hex") };
}

export function assertExactCareerOSSchema(schema) {
  const actual = [...schema.tables].sort();
  const expected = [...CAREEROS_TABLES].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`CAREEROS_SCHEMA_TABLE_SET_MISMATCH:${JSON.stringify({ expected, actual })}`);
  }
}
