import { NextResponse } from "next/server";
import { careerP0Store, currentCareerContext, customerMutationAllowed } from "../../../../lib/career/careerP0Auth";

export const runtime = "nodejs";

export async function GET() {
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json({ ok: true, profile: await careerP0Store.getProfile(context.session.id), tenant: context.tenant });
}

export async function POST(request: Request) {
  if (!customerMutationAllowed(request)) return NextResponse.json({ ok: false, error: "REQUEST_NOT_ALLOWED" }, { status: 403 });
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const body = await request.json();
    const profile = await careerP0Store.saveProfile(context.session.id, body || {});
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "PROFILE_SAVE_FAILED" }, { status: 400 });
  }
}
