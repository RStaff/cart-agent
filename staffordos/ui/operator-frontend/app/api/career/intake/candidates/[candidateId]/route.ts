import { NextResponse } from "next/server";
import { currentCareerContext, careerP0Store, customerMutationAllowed } from "../../../../../../lib/career/careerP0Auth";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ candidateId: string }> }) {
  if (!customerMutationAllowed(request)) return NextResponse.json({ ok: false, error: "REQUEST_NOT_ALLOWED" }, { status: 403 });
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { candidateId } = await params;
    const body = await request.json();
    const result = await careerP0Store.reviewCandidate(context.session.id, candidateId, body?.decision, body?.correction);
    return NextResponse.json({ ok: true, ...result, onboarding: await careerP0Store.getOnboardingState(context.session.id) });
  } catch (error) {
    const code = error instanceof Error ? (error as Error & { code?: string }).code : "REVIEW_FAILED";
    return NextResponse.json({ ok: false, error: code || "REVIEW_FAILED" }, { status: 400 });
  }
}
