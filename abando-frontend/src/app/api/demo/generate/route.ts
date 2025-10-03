import { NextRequest, NextResponse } from "next/server";

/** Types */
type Channel = "email" | "sms" | "chat";
type Length = "short" | "medium" | "long";
type Payload = {
  product: string;
  offer: string;
  channel: Channel;
  length: Length;
  persona?: string;
  concerns?: string;
  voiceId: string;       // e.g. "brand", "confident", etc.
  customVoice?: string;  // optional freeform
};

/** Simple rate limit (soft; per-IP) */
const BUCKET = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 15_000;
const MAX_REQS = 6;

function rlOk(ip: string) {
  const now = Date.now();
  const s = BUCKET.get(ip) ?? { count: 0, ts: now };
  if (now - s.ts > WINDOW_MS) { s.count = 0; s.ts = now; }
  s.count += 1;
  BUCKET.set(ip, s);
  return s.count <= MAX_REQS;
}

/** Deterministic mock copy for offline/invalid-key scenarios */
function mockCopy(p: Payload): string {
  const tone =
    (p.customVoice && p.customVoice.trim()) ||
    ({
      brand: "friendly, clear benefits, gentle urgency",
      confident: "empowering tone, decisive call-to-action",
      playful: "light humor, approachable",
      storyteller: "warm narrative with before→after arc",
      technical: "precise, spec-forward, reduces uncertainty",
      minimalist: "short, clean, no fluff",
      luxury: "premium cues, restrained confidence",
      urgency: "time-bound nudge, clear next step",
    } as Record<string,string>)[p.voiceId] || "straightforward brand tone";

  const opening =
    p.channel === "email" ? "Hey there," :
    p.channel === "sms"   ? "Quick nudge —" :
                            "Hi!";

  const len = p.length;
  const offer = p.offer ? ` ${p.offer}.` : "";
  const persona = p.persona ? ` For ${p.persona},` : "";
  const concerns = p.concerns ? ` We hear concerns about ${p.concerns}.` : "";

  const coreShort = `${opening} your ${p.product} is still in your cart.${offer}${persona}${concerns} In ${tone}, here's your next step → complete checkout.`;
  const coreMedium = `${opening}
We saved your ${p.product} for you.${offer}${persona}${concerns}
${p.customVoice ? "In your specified tone" : "In a " + tone + " voice"}, here’s why it’s a great fit and how to finish up now.`;
  const coreLong = `${opening}
Good news — your ${p.product} is reserved.${offer}${persona}${concerns}
${p.customVoice ? "Per your custom tone," : "Using a " + tone + " tone,"} we’ll address hesitations, reinforce value, and guide you to finish in a tap. Free returns and instant support if you need help.`;

  return len === "short" ? coreShort : len === "long" ? coreLong : coreMedium;
}

/** Try OpenAI, otherwise fall back to mock — but NEVER error out. */
async function tryOpenAI(p: Payload): Promise<string | null> {
  // Force mock via env (handy for demos)
  if (process.env.DEMO_FORCE_MOCK === "1") return null;

  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  try {
    // Use the lightweight Responses API if available to you; keep a minimal dependency footprint
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":"application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: `You write persuasive ${p.channel.toUpperCase()} copy for ecommerce. Tone: ${
            p.customVoice?.trim() || p.voiceId
          }.` },
          { role: "user", content:
            `Product: ${p.product}\nOffer: ${p.offer}\nPersona: ${p.persona}\nConcerns: ${p.concerns}\nLength: ${p.length}\nWrite conversion-ready copy.` }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!r.ok) {
      // 401s etc. become mock, not hard errors
      return null;
    }
    const j = await r.json();
    const text = j?.choices?.[0]?.message?.content?.toString?.().trim?.();
    return text || null;
  } catch {
    return null;
  }
}

/** Route */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rlOk(ip)) {
    // Soft limit — still return mock so the demo never blocks
    const p = (await req.json()) as Payload;
    return NextResponse.json(
      { message: mockCopy(p), source: "mock", limited: true },
      { status: 200 }
    );
  }

  let p: Payload;
  try {
    p = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Try upstream, fall back to mock
  const upstream = await tryOpenAI(p);
  const message = upstream ?? mockCopy(p);
  const source = upstream ? "openai" : "mock";

  return NextResponse.json({ message, source }, { status: 200 });
}

export const dynamic = "force-dynamic";
