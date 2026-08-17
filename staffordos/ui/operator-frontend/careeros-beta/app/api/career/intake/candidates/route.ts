import { NextResponse } from "next/server";
import { currentCareerContext, careerP0Store } from "../../../../../lib/career/careerP0Auth";

export const runtime = "nodejs";

export async function GET() {
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json({ ok: true, candidates: await careerP0Store.listCandidateFacts(context.session.id), onboarding: await careerP0Store.getOnboardingState(context.session.id) });
}
