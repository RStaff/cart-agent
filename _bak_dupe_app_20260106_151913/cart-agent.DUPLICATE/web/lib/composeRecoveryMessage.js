import OpenAI from "openai";

const client = (() => {
  try {
    if (!process.env.OPENAI_API_KEY) throw new Error("missing");
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch {
    return null; // graceful fallback
  }
})();

/**
 * Returns {subject, body}. Falls back to simple copy if no/invalid key.
 */
export async function composeRecovery({ name, items, total }) {
  const who = name || "there";
  const list = (items && items.length) ? items.join(", ") : "your items";
  const amount = isFinite(+total) ? (+total).toFixed(2) : "0.00";

  if (!client) {
    return {
      subject: `Your ${list} awaits, ${who}!`,
      body: `Hi ${who}! You left ${list} in your cart (total $${amount}). Finish checkout—your order is just a click away.`
    };
  }

  try {
    const prompt = `
You are an upbeat Shopify assistant. Write a short abandoned-cart email.
Return EXACT JSON: {"subject":"...","body":"..."}

Name: ${who}
Items: ${list}
Total: $${amount}
Tone: friendly, concise, 1–2 sentences body.
    `.trim();

    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const raw = res?.choices?.[0]?.message?.content?.trim() || "";
    try {
      const parsed = JSON.parse(raw);
      if (parsed.subject && parsed.body) return parsed;
    } catch (_) {
      // fallthrough to regex parse
    }

    const sm = raw.match(/"subject"\s*:\s*"([^"]+)"/i);
    const bm = raw.match(/"body"\s*:\s*"([\s\S]*?)"/i);
    if (sm && bm) return { subject: sm[1], body: bm[1] };

    return {
      subject: `Complete your order, ${who}!`,
      body: `Quick reminder—${list} is waiting (total $${amount}). Pick up where you left off in just one tap!`
    };
  } catch (e) {
    console.error("AI compose error:", e?.status || "", e?.message || e);
    return {
      subject: `Your ${list} is still in your cart`,
      body: `Hi ${who}, you left ${list} (total $${amount}). Finish checkout anytime—need help?`
    };
  }
}
