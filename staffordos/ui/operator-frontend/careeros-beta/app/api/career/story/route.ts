import { NextResponse } from "next/server";
import { currentCareerContext, careerP0Store, customerMutationAllowed } from "../../../../lib/career/careerP0Auth";
import { nextStoryStatus } from "../../../../lib/career/careerStory.mjs";

export const runtime = "nodejs";

export async function GET() {
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json({ ok: true, story: await careerP0Store.getOnboardingState(context.session.id) });
}

export async function POST(request: Request) {
  if (!customerMutationAllowed(request)) return NextResponse.json({ ok: false, error: "REQUEST_NOT_ALLOWED" }, { status: 403 });
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const body = await request.json();
    return NextResponse.json({ ok: true, story: await careerP0Store.updateStoryStatus(context.session.id, nextStoryStatus(body?.action)) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "STORY_STATUS_FAILED" }, { status: 400 });
  }
}
