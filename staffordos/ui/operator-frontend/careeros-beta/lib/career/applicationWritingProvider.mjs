export const APPLICATION_WRITING_MODEL = "gpt-4o-mini";
const ENDPOINT = "https://api.openai.com/v1/chat/completions";

export async function generateApplicationWriting({
  materialType,
  target,
  deterministicDraft,
  evidence,
  question = "",
  userIntent = "",
  style = "PROFESSIONAL",
  apiKey = process.env.OPENAI_API_KEY,
  fetchImpl = fetch,
  timeoutMs = 20000,
}) {
  if (!apiKey) throw Object.assign(new Error("APPLICATION_WRITING_PROVIDER_REQUIRED"), { code: "APPLICATION_WRITING_PROVIDER_REQUIRED" });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const instructions = [
    "You improve wording of a customer-approved application draft. You are a writer, not a source of career facts.",
    "Use only the supplied deterministic draft and evidence. Do not add facts, numbers, employers, titles, dates, technologies, certifications, scope, outcomes, motivation, or relationships.",
    "Keep TRANSFERABLE evidence transferable and do not turn PARTIAL or UNKNOWN into support.",
    "Return JSON only with keys draft and claims. claims must be an array of {text, supportRefs, classification}.",
    "supportRefs must contain only numeric evidence indexes from the supplied evidence. Use NEEDS_REVIEW when a sentence cannot be fully grounded. Never use UNSUPPORTED for a sentence you include.",
  ].join(" ");
  const payload = {
    model: APPLICATION_WRITING_MODEL,
    temperature: 0.2,
    max_tokens: 900,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: instructions },
      { role: "user", content: JSON.stringify({ materialType, style, target, deterministicDraft, evidence, question, userIntent }) },
    ],
  };
  try {
    const response = await fetchImpl(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) throw Object.assign(new Error("APPLICATION_WRITING_PROVIDER_ERROR"), { code: "APPLICATION_WRITING_PROVIDER_ERROR", status: response.status });
    const body = await response.json();
    const raw = body?.choices?.[0]?.message?.content;
    if (typeof raw !== "string" || !raw.trim()) throw Object.assign(new Error("APPLICATION_WRITING_EMPTY"), { code: "APPLICATION_WRITING_EMPTY" });
    let parsed;
    try { parsed = JSON.parse(raw); } catch { throw Object.assign(new Error("APPLICATION_WRITING_INVALID_OUTPUT"), { code: "APPLICATION_WRITING_INVALID_OUTPUT" }); }
    if (typeof parsed.draft !== "string" || !parsed.draft.trim() || !Array.isArray(parsed.claims)) throw Object.assign(new Error("APPLICATION_WRITING_INVALID_OUTPUT"), { code: "APPLICATION_WRITING_INVALID_OUTPUT" });
    return { draft: parsed.draft.trim(), claims: parsed.claims, provider: "openai", model: APPLICATION_WRITING_MODEL };
  } catch (error) {
    if (error?.name === "AbortError") throw Object.assign(new Error("APPLICATION_WRITING_TIMEOUT"), { code: "APPLICATION_WRITING_TIMEOUT" });
    throw error;
  } finally { clearTimeout(timeout); }
}
