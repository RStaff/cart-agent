import { NextResponse } from "next/server";
import { currentCareerContext, customerMutationAllowed } from "../../../../lib/career/careerP0Auth";
import { answerCapability, getCapabilityProfile } from "../../../../lib/career/careerP0Product.mjs";

export const runtime = "nodejs";

export async function GET() {
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try { return NextResponse.json({ ok: true, profile: await getCapabilityProfile(context) }); }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "CAPABILITIES_FAILED" }, { status: 400 }); }
}

export async function POST(request: Request) {
  if (!customerMutationAllowed(request)) return NextResponse.json({ ok: false, error: "REQUEST_NOT_ALLOWED" }, { status: 403 });
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try { return NextResponse.json({ ok: true, result: await answerCapability(context, await request.json()) }); }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "CAPABILITY_DECISION_FAILED" }, { status: 400 }); }
}
