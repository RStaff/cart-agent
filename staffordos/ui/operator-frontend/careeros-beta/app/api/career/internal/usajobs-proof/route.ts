import { NextResponse } from "next/server";
import { currentCareerContext } from "../../../../../lib/career/careerP0Auth";
import { proveUsajobsRuntime } from "../../../../../lib/career/usajobsProof.mjs";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  if (new URL(request.url).search) return NextResponse.json({ ok: false, error: "QUERY_NOT_ALLOWED" }, { status: 400 });
  return NextResponse.json({ ok: true, ...(await proveUsajobsRuntime()) }, { status: 200 });
}
