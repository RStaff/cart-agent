import { careerP0Pool } from "./careerP0Auth";

function requireContext(context) {
  if (!context?.tenant?.id || !context?.user?.id) throw Object.assign(new Error("UNAUTHORIZED"), { code: "UNAUTHORIZED" });
}

export async function getDiscoveryAuthorityModel(context) {
  requireContext(context);
  const pool = await careerP0Pool();
  const profile = (await pool.query('SELECT id FROM "CareerProfile" WHERE "tenantId"=$1 AND "userId"=$2 LIMIT 1', [context.tenant.id, context.user.id])).rows[0];
  if (!profile) return { profileId: null, facts: [], capabilities: [], contextClaims: [] };
  const [facts, capabilities, contextClaims] = await Promise.all([
    pool.query('SELECT id,"sourceId",statement,"factType","authorityState" FROM "CareerFact" WHERE "tenantId"=$1 AND "userId"=$2 AND "profileId"=$3 AND "authorityState"=$4 ORDER BY "createdAt"', [context.tenant.id, context.user.id, profile.id, "CUSTOMER_CONFIRMED_SOURCE_BACKED"]),
    pool.query('SELECT id,"capabilityKey",label,domain,scope,"authorityState",provenance FROM "CareerCapabilityAuthority" WHERE "tenantId"=$1 AND "userId"=$2 AND "profileId"=$3', [context.tenant.id, context.user.id, profile.id]),
    pool.query('SELECT id,dimension,"displayValue","authorityState",status FROM "CareerFactContextClaim" WHERE "tenantId"=$1 AND "userId"=$2 AND "profileId"=$3 AND status=$4', [context.tenant.id, context.user.id, profile.id, "ACTIVE"]),
  ]);
  return { profileId: profile.id, facts: facts.rows, capabilities: capabilities.rows, contextClaims: contextClaims.rows };
}
