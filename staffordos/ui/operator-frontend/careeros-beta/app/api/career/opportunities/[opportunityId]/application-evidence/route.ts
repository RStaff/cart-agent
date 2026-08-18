import { NextResponse } from "next/server";
import { currentCareerContext } from "../../../../../../lib/career/careerP0Auth";
import { getApplicationEvidencePacket } from "../../../../../../lib/career/careerP0Product.mjs";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ opportunityId: string }> }) {
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try { return NextResponse.json({ ok: true, packet: await getApplicationEvidencePacket(context, (await params).opportunityId) }); }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "OPPORTUNITY_NOT_FOUND" }, { status: 404 }); }
}
