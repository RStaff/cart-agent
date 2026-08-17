export const VOICE_TRANSCRIPTION_MODEL = "gpt-4o-transcribe";
const ENDPOINT = "https://api.openai.com/v1/audio/transcriptions";

export async function transcribeAudio({ bytes, mimeType, filename, apiKey = process.env.OPENAI_API_KEY, fetchImpl = fetch, timeoutMs = 30000 }) {
  if (!apiKey) throw Object.assign(new Error("VOICE_PROVIDER_CREDENTIAL_REQUIRED"), { code: "VOICE_PROVIDER_CREDENTIAL_REQUIRED" });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const form = new FormData();
    form.append("file", new Blob([bytes], { type: mimeType }), filename);
    form.append("model", VOICE_TRANSCRIPTION_MODEL);
    const response = await fetchImpl(ENDPOINT, { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: form, signal: controller.signal });
    if (!response.ok) throw Object.assign(new Error("VOICE_TRANSCRIPTION_PROVIDER_ERROR"), { code: "VOICE_TRANSCRIPTION_PROVIDER_ERROR", status: response.status });
    const body = await response.json();
    const transcript = String(body?.text || "").trim();
    if (!transcript) throw Object.assign(new Error("VOICE_TRANSCRIPTION_EMPTY"), { code: "VOICE_TRANSCRIPTION_EMPTY" });
    return { transcript, provider: "openai", model: VOICE_TRANSCRIPTION_MODEL };
  } catch (error) {
    if (error?.name === "AbortError") throw Object.assign(new Error("VOICE_TRANSCRIPTION_TIMEOUT"), { code: "VOICE_TRANSCRIPTION_TIMEOUT" });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
