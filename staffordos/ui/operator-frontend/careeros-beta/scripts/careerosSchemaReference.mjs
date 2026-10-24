import { createHash } from "node:crypto";
import { CAREEROS_SCHEMA_FINGERPRINT_VERSION } from "./careerosSchemaFingerprint.mjs";

// Reference artifacts contain only fingerprint-bearing fields. `canonical` and
// `fingerprint` are derived outputs and are intentionally excluded.
export function referenceFields(schema) {
  return {
    fingerprintVersion: CAREEROS_SCHEMA_FINGERPRINT_VERSION,
    tables: schema.tables,
    columns: schema.columns,
    constraints: schema.constraints,
    indexes: schema.indexes,
    objects: schema.objects,
    triggers: schema.triggers,
    routines: schema.routines,
    policies: schema.policies,
    roleMapping: schema.roleMapping || {},
    schemaPrivileges: schema.schemaPrivileges || [],
    relationPrivileges: schema.relationPrivileges || [],
    columnPrivileges: schema.columnPrivileges || [],
    sequences: schema.sequences || [],
  };
}

export function referenceFingerprint(schema) {
  const fields = referenceFields(schema);
  return { ...fields, fingerprint: createHash("sha256").update(JSON.stringify(fields), "utf8").digest("hex") };
}

export function compareReferenceFields(actual, expected) {
  const fields = ["fingerprintVersion", "tables", "columns", "constraints", "indexes", "objects", "triggers", "routines", "policies", "roleMapping", "schemaPrivileges", "relationPrivileges", "columnPrivileges", "sequences"];
  return fields.filter((field) => JSON.stringify(actual[field]) !== JSON.stringify(expected[field]));
}
