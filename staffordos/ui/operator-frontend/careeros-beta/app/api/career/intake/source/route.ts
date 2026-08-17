import { NextResponse } from "next/server";
import { currentCareerContext, careerP0Store, customerMutationAllowed } from "../../../../../lib/career/careerP0Auth";
import { parseCareerText, CAREEROS_INTAKE_EXTRACTOR_VERSION, CAREEROS_MAX_TEXT_LENGTH } from "../../../../../lib/career/careerP0Intake.mjs";

export const runtime = "nodejs";

const SOURCE_TYPES = new Set(["RESUME_TEXT", "EMPLOYMENT", "CONSULTING", "MANUAL_WORK_HISTORY", "PROJECT", "ACCOMPLISHMENT", "TECHNICAL_BUILD", "CERTIFICATION", "EDUCATION", "SPEAKING_TEACHING", "LEADERSHIP", "VOLUNTEER_COMMUNITY", "PORTFOLIO_DESCRIPTION", "OTHER_USER_PROVIDED_TEXT", "VOICE_TRANSCRIPT"]);

export async function POST(request: Request) {
  if (!customerMutationAllowed(request)) return NextResponse.json({ ok: false, error: "REQUEST_NOT_ALLOWED" }, { status: 403 });
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const body = await request.json();
    if (!SOURCE_TYPES.has(body?.sourceType)) return NextResponse.json({ ok: false, error: "INVALID_SOURCE_TYPE" }, { status: 400 });
    const text = String(body?.text || "").trim();
    if (!text || text.length > CAREEROS_MAX_TEXT_LENGTH) return NextResponse.json({ ok: false, error: "SOURCE_TEXT_REQUIRED_OR_TOO_LARGE" }, { status: 400 });
    const source = await careerP0Store.createSource(context.session.id, { sourceType: body.sourceType, textContent: text });
    const parsed = parseCareerText({ sourceId: source.id, sourceType: source.sourceType, text, extractorVersion: CAREEROS_INTAKE_EXTRACTOR_VERSION });
    const candidates = await careerP0Store.saveCandidates(context.session.id, source.id, parsed);
    return NextResponse.json({ ok: true, source, candidates, extractorVersion: parsed.extractorVersion });
  } catch (error) {
    const code = error instanceof Error ? (error as Error & { code?: string }).code : "INTAKE_FAILED";
    return NextResponse.json({ ok: false, error: code || "INTAKE_FAILED" }, { status: 400 });
  }
}
