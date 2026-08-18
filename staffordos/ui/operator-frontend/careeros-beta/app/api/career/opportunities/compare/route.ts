import { NextResponse } from "next/server";
import { currentCareerContext } from "../../../../../lib/career/careerP0Auth";
import { compareOpportunities } from "../../../../../lib/career/careerP0Product.mjs";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const ids = new URL(request.url).searchParams.getAll("id");
    const csv = new URL(request.url).searchParams.get("ids");
    return NextResponse.json({ ok: true, ...(await compareOpportunities(context, ids.length ? ids : String(csv || "").split(","))) });
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "COMPARISON_FAILED" }, { status: 400 }); }
}
