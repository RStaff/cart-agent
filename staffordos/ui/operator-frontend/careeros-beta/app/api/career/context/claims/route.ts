import { NextResponse } from "next/server";
import { careerP0Store, currentCareerContext, customerMutationAllowed } from "../../../../../lib/career/careerP0Auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function GET() {
  const context = await currentCareerContext();
  if (!context) return response({ ok: false, error: "UNAUTHORIZED" }, 401);
  try { return response({ ok: true, ...(await careerP0Store.listContextClaims(context.session.id)) }); }
  catch (error) { return response({ ok: false, error: error instanceof Error ? error.message : "CONTEXT_CLAIMS_FAILED" }, 400); }
}

export async function POST(request: Request) {
  if (!customerMutationAllowed(request)) return response({ ok: false, error: "REQUEST_NOT_ALLOWED" }, 403);
  const context = await currentCareerContext();
  if (!context) return response({ ok: false, error: "UNAUTHORIZED" }, 401);
  try {
    const body = await request.json();
    return response({ ok: true, ...(await careerP0Store.reviewContextClaim(context.session.id, body?.claimId, body?.decision, body?.correction)) });
  } catch (error) { return response({ ok: false, error: error instanceof Error ? error.message : "CONTEXT_CLAIM_REVIEW_FAILED" }, 400); }
}
