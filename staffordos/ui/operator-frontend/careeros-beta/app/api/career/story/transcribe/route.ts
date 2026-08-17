import { NextResponse } from "next/server";
import { currentCareerContext, customerMutationAllowed } from "../../../../../lib/career/careerP0Auth";
import { transcribeAudio } from "../../../../../lib/career/transcriptionProvider.mjs";

export const runtime = "nodejs";
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["audio/webm", "audio/webm;codecs=opus", "audio/mp4"]);

export async function POST(request: Request) {
  if (!customerMutationAllowed(request)) return NextResponse.json({ ok: false, error: "REQUEST_NOT_ALLOWED" }, { status: 403 });
  if (!await currentCareerContext()) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File) || !audio.size) return NextResponse.json({ ok: false, error: "AUDIO_REQUIRED" }, { status: 400 });
    const mimeType = String(audio.type || "").toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) return NextResponse.json({ ok: false, error: "UNSUPPORTED_AUDIO_TYPE" }, { status: 415 });
    if (audio.size > MAX_AUDIO_BYTES) return NextResponse.json({ ok: false, error: "AUDIO_TOO_LARGE" }, { status: 413 });
    const result = await transcribeAudio({ bytes: await audio.arrayBuffer(), mimeType, filename: audio.name || "careeros-voice.webm" });
    return NextResponse.json({ ok: true, transcript: result.transcript, provider: result.provider, model: result.model });
  } catch (error) {
    const code = error instanceof Error ? (error as Error & { code?: string }).code : "VOICE_TRANSCRIPTION_FAILED";
    const status = code === "VOICE_PROVIDER_CREDENTIAL_REQUIRED" ? 503 : code === "VOICE_TRANSCRIPTION_TIMEOUT" ? 504 : 502;
    return NextResponse.json({ ok: false, error: code || "VOICE_TRANSCRIPTION_FAILED" }, { status });
  }
}
