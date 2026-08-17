import { NextResponse } from "next/server";
import { currentCareerContext, customerMutationAllowed } from "../../../../lib/career/careerP0Auth";
import { createOpportunity, listOpportunities } from "../../../../lib/career/careerP0Product.mjs";

export const runtime = "nodejs";

export async function GET() {
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json({ ok: true, opportunities: await listOpportunities(context) });
}

export async function POST(request: Request) {
  if (!customerMutationAllowed(request)) return NextResponse.json({ ok: false, error: "REQUEST_NOT_ALLOWED" }, { status: 403 });
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try { return NextResponse.json({ ok: true, ...await createOpportunity(context, await request.json()) }, { status: 201 }); }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "OPPORTUNITY_CREATE_FAILED" }, { status: 400 }); }
}
