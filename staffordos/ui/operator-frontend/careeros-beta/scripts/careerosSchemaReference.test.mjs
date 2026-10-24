import assert from "node:assert/strict";
import { CAREEROS_SCHEMA_FINGERPRINT_VERSION } from "./careerosSchemaFingerprint.mjs";
import { compareReferenceFields, referenceFingerprint, referenceFields } from "./careerosSchemaReference.mjs";

const fixture = {
  tables: ["CareerOnboardingState"],
  columns: [{ table_name: "CareerOnboardingState", column_name: "id", data_type: "text" }],
  constraints: [],
  indexes: [],
  objects: [{ object_name: "_prisma_migrations", object_kind: "r", relpersistence: "p", relreplident: "d", relrowsecurity: false, relforcerowsecurity: false }],
  triggers: [],
  routines: [],
  policies: [],
  roleMapping: { postgres: "reviewed-app" },
  schemaPrivileges: [],
  relationPrivileges: [],
  columnPrivileges: [],
  sequences: [],
};
const generated = referenceFingerprint(fixture);
assert.equal(generated.fingerprintVersion, CAREEROS_SCHEMA_FINGERPRINT_VERSION);
assert.ok(generated.objects.some((object) => object.object_name === "_prisma_migrations"));
assert.deepEqual(Object.keys(referenceFields(fixture)).sort(), ["columnPrivileges", "columns", "constraints", "defaultPrivileges", "fingerprintVersion", "indexes", "objects", "policies", "relationPrivileges", "roleMapping", "roleMemberships", "routines", "schemaPrivileges", "sequences", "tables", "triggers"]);
assert.deepEqual(compareReferenceFields({ ...generated, canonical: "derived", fingerprint: "derived" }, { ...generated, canonical: "different", fingerprint: "different" }), []);
const changed = { ...generated, fingerprintVersion: "careos-schema-fingerprint-v2" };
assert.deepEqual(compareReferenceFields(changed, generated), ["fingerprintVersion"]);
console.log("CareerOS reference generation tests passed");
