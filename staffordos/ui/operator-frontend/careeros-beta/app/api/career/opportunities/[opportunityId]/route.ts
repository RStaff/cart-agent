import { NextResponse } from "next/server";
import { currentCareerContext, customerMutationAllowed } from "../../../../../lib/career/careerP0Auth";
import { evaluateOpportunity, getOpportunity, updateOpportunityDecision } from "../../../../../lib/career/careerP0Product.mjs";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ opportunityId: string }> }) {
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try { const { opportunityId } = await params; return NextResponse.json({ ok: true, ...(await getOpportunity(context, opportunityId)) }); }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "OPPORTUNITY_NOT_FOUND" }, { status: 404 }); }
}

export async function POST(request: Request, { params }: { params: Promise<{ opportunityId: string }> }) {
  if (!customerMutationAllowed(request)) return NextResponse.json({ ok: false, error: "REQUEST_NOT_ALLOWED" }, { status: 403 });
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { opportunityId } = await params;
    const body = await request.json().catch(() => ({}));
    if (body.decisionState !== undefined) return NextResponse.json({ ok: true, opportunity: await updateOpportunityDecision(context, opportunityId, body.decisionState) });
    return NextResponse.json({ ok: true, match: await evaluateOpportunity(context, opportunityId) });
  }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "MATCH_FAILED" }, { status: 400 }); }
}
