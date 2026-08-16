import { NextResponse } from "next/server";
import { careerP0Store, currentCareerContext } from "../../../../lib/career/careerP0Auth";

export const runtime = "nodejs";

export async function GET() {
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json({ ok: true, sources: await careerP0Store.listSources(context.session.id) });
}

export async function POST(request: Request) {
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const source = await careerP0Store.createSource(context.session.id, await request.json());
    return NextResponse.json({ ok: true, source }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? (error as Error & { code?: string }).code : "SOURCE_CREATE_FAILED";
    return NextResponse.json({ ok: false, error: code || "SOURCE_CREATE_FAILED" }, { status: 400 });
  }
}
