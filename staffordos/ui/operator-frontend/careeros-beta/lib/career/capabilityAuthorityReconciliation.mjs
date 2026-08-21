import crypto from "node:crypto";

const id = (prefix) => `${prefix}_${crypto.randomUUID()}`;

export async function reconcileCapabilityAuthority(pool, context, profile, candidate, authorityState = candidate.authorityState) {
  const provenance = JSON.stringify(candidate.provenance);
  const updated = await pool.query('UPDATE "CareerCapabilityAuthority" SET "authorityState"=$1,provenance=$2::jsonb,"taxonomyVersion"=$3,version=version+1,"updatedAt"=NOW() WHERE "tenantId"=$4 AND "userId"=$5 AND "profileId"=$6 AND "capabilityKey"=$7 AND ("authorityState" IS DISTINCT FROM $1 OR provenance IS DISTINCT FROM $2::jsonb) RETURNING *', [authorityState, provenance, candidate.taxonomyVersion, context.tenant.id, context.user.id, profile, candidate.capabilityKey]);
  if (!updated.rowCount) {
    await pool.query('INSERT INTO "CareerCapabilityAuthority" ("id","tenantId","userId","profileId","capabilityKey",label,domain,scope,"authorityState",provenance,"taxonomyVersion","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,NOW()) ON CONFLICT ("tenantId","profileId","capabilityKey") DO NOTHING', [id("capability"), context.tenant.id, context.user.id, profile, candidate.capabilityKey, candidate.label, candidate.domain, candidate.scope, authorityState, provenance, candidate.taxonomyVersion]);
  }
  const persisted = (await pool.query('SELECT "authorityState",provenance FROM "CareerCapabilityAuthority" WHERE "tenantId"=$1 AND "userId"=$2 AND "profileId"=$3 AND "capabilityKey"=$4 LIMIT 1', [context.tenant.id, context.user.id, profile, candidate.capabilityKey])).rows[0];
  if (!persisted || persisted.authorityState !== authorityState) throw new Error("CAPABILITY_AUTHORITY_RECONCILIATION_FAILED");
  return persisted;
}
