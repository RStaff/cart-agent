import { NextResponse } from "next/server";
import { currentCareerContext, customerMutationAllowed } from "../../../../lib/career/careerP0Auth";
import { importOpportunityBatchToInbox, importOpportunityToInbox, listOpportunityInbox } from "../../../../lib/career/careerP0Product.mjs";
export const runtime = "nodejs";
export async function GET() {
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json({ ok: true, items: await listOpportunityInbox(context) });
}
export async function POST(request: Request) {
  if (!customerMutationAllowed(request)) return NextResponse.json({ ok: false, error: "REQUEST_NOT_ALLOWED" }, { status: 403 });
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const body = await request.json();
    const result = Array.isArray(body.items) ? await importOpportunityBatchToInbox(context, body.items) : await importOpportunityToInbox(context, body);
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "INBOX_IMPORT_FAILED" }, { status: 400 }); }
}
