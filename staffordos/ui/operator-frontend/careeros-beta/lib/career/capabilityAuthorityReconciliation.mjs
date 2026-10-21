import crypto from "node:crypto";

const id = (prefix) => `${prefix}_${crypto.randomUUID()}`;

export async function reconcileCapabilityAuthority(pool, context, profile, candidate, authorityState = candidate.authorityState, trace = null, prior = {}) {
  const provenance = JSON.stringify(candidate.provenance);
  const event = { capabilityKey: candidate.capabilityKey, expectedAuthorityState: authorityState, profileId: profile, priorAuthorityState: prior.authorityState || null, existingAuthority: Boolean(prior.exists), updateAttempted: true, updateRowCount: null, insertAttempted: false, readbackAuthorityState: null, returnedAuthorityState: null };
  const updated = await pool.query('UPDATE "CareerCapabilityAuthority" SET "authorityState"=$1,provenance=$2::jsonb,"taxonomyVersion"=$3,version=version+1,"updatedAt"=NOW() WHERE "tenantId"=$4 AND "userId"=$5 AND "profileId"=$6 AND "capabilityKey"=$7 AND ("authorityState" IS DISTINCT FROM $1 OR provenance IS DISTINCT FROM $2::jsonb) RETURNING *', [authorityState, provenance, candidate.taxonomyVersion, context.tenant.id, context.user.id, profile, candidate.capabilityKey]);
  event.updateRowCount = updated.rowCount;
  if (!updated.rowCount) {
    event.insertAttempted = true;
    await pool.query('INSERT INTO "CareerCapabilityAuthority" ("id","tenantId","userId","profileId","capabilityKey",label,domain,scope,"authorityState",provenance,"taxonomyVersion","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,NOW()) ON CONFLICT ("tenantId","profileId","capabilityKey") DO NOTHING', [id("capability"), context.tenant.id, context.user.id, profile, candidate.capabilityKey, candidate.label, candidate.domain, candidate.scope, authorityState, provenance, candidate.taxonomyVersion]);
  }
  const persisted = (await pool.query('SELECT "authorityState",provenance FROM "CareerCapabilityAuthority" WHERE "tenantId"=$1 AND "userId"=$2 AND "profileId"=$3 AND "capabilityKey"=$4 LIMIT 1', [context.tenant.id, context.user.id, profile, candidate.capabilityKey])).rows[0];
  event.readbackAuthorityState = persisted?.authorityState || null;
  event.returnedAuthorityState = persisted?.authorityState || null;
  event.reconciliationSucceeded = Boolean(persisted && persisted.authorityState === authorityState);
  if (trace) trace.push(event);
  if (!event.reconciliationSucceeded) {
    const error = new Error("CAPABILITY_AUTHORITY_RECONCILIATION_FAILED");
    if (trace) error.reconciliationTrace = trace;
    throw error;
  }
  return persisted;
}
