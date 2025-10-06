import { NextResponse } from "next/server";

type Tone = "friendly" | "urgent" | "helpful";

function craft(product: string, tone: Tone): string {
  const p = product.trim() || "your item";
  switch (tone) {
    case "urgent":
      return `Still want ${p}? Your cart’s about to time out. Grab it now before it’s gone — checkout takes under a minute.`;
    case "helpful":
      return `We saved ${p} in your cart. Need help with sizing, shipping, or returns? Reply and we’ll sort it out — when you’re ready, finish checkout anytime.`;
    default:
      return `Hey! We noticed you were checking out ${p}. No rush — it’s waiting in your cart whenever you’re ready.`;
  }
}

export async function POST(req: Request) {
  try {
    const { product = "", tone = "friendly" } = await req
      .json()
      .catch(() => ({}));
    const t = (["friendly", "urgent", "helpful"] as Tone[]).includes(tone)
      ? (tone as Tone)
      : "friendly";
    const message = craft(String(product || "").slice(0, 120), t);
    return NextResponse.json({ ok: true, message });
  } catch {
    // Never return an empty message — provide a safe fallback
    return NextResponse.json({
      ok: true,
      message:
        "We saved your item in the cart. When you’re ready, checkout takes under a minute.",
      note: "fallback",
    });
  }
}
