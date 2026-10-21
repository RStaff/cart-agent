import { NextResponse } from "next/server";
import { currentCareerContext, careerP0Pool } from "../../../../lib/career/careerP0Auth";
import { buildCapabilityDiagnostic } from "../../../../lib/career/capabilityDiagnostic.mjs";

export const runtime = "nodejs";

export async function GET() {
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const pool: any = await careerP0Pool();
    const profile = (await pool.query('SELECT id FROM "CareerProfile" WHERE "tenantId"=$1 AND "userId"=$2 LIMIT 1', [context.tenant.id, context.user.id])).rows[0] || null;
    if (!profile) return NextResponse.json({ ok: true, diagnostic: buildCapabilityDiagnostic({ profile: null, sources: [], candidates: [], careerFacts: [], authorities: [], decisions: [] }) });
    const [sources, candidates, careerFacts, authorities, decisions] = await Promise.all([
      pool.query('SELECT id,"profileId" FROM "CareerSource" WHERE "tenantId"=$1 AND "userId"=$2 AND "profileId"=$3', [context.tenant.id, context.user.id, profile.id]),
      pool.query('SELECT "candidateFactId",status,"profileId" FROM "CareerFactCandidate" WHERE "tenantId"=$1 AND "userId"=$2 AND "profileId"=$3', [context.tenant.id, context.user.id, profile.id]),
      pool.query('SELECT id,"profileId","sourceId",statement,"sourceExcerpt","scopeStatement","factType","authorityState" FROM "CareerFact" WHERE "tenantId"=$1 AND "userId"=$2 AND "profileId"=$3', [context.tenant.id, context.user.id, profile.id]),
      pool.query('SELECT id,"profileId","capabilityKey",label,"authorityState",provenance FROM "CareerCapabilityAuthority" WHERE "tenantId"=$1 AND "userId"=$2 AND "profileId"=$3', [context.tenant.id, context.user.id, profile.id]),
      pool.query('SELECT "capabilityId",answer,"decisionState","supersededAt" FROM "CareerCapabilityDecision" WHERE "tenantId"=$1 AND "userId"=$2 AND "supersededAt" IS NULL', [context.tenant.id, context.user.id]),
    ]);
    const diagnostic = buildCapabilityDiagnostic({ profile, sources: sources.rows, candidates: candidates.rows, careerFacts: careerFacts.rows, authorities: authorities.rows, decisions: decisions.rows });
    return NextResponse.json({ ok: true, diagnostic });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "CAPABILITY_DIAGNOSTIC_FAILED" }, { status: 400 });
  }
}
