import { NextResponse } from "next/server";
import { currentCareerContext, customerMutationAllowed } from "../../../../../lib/career/careerP0Auth";
import { updateOpportunityInboxItem } from "../../../../../lib/career/careerP0Product.mjs";
export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  if (!customerMutationAllowed(request)) return NextResponse.json({ ok: false, error: "REQUEST_NOT_ALLOWED" }, { status: 403 });
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({ ok: true, ...(await updateOpportunityInboxItem(context, (await params).itemId, String(body.action || ""))) });
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "INBOX_ACTION_FAILED" }, { status: 400 }); }
}
