import { NextResponse } from "next/server";
import { LEADS_STORE_PATH } from "../../../../../../products/shopifixer/assisted/leads_store.js";
import { trackShopifixerOutcome } from "../../../../../../products/shopifixer/assisted/track_outcome.js";

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      event?: string;
      store?: string;
    };

    const result = trackShopifixerOutcome({
      event: cleanText(payload?.event),
      store: cleanText(payload?.store),
    });

    return NextResponse.json({
      ok: true,
      matched: result.matched,
      queuePath: LEADS_STORE_PATH,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "shopifixer_tracking_failed",
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    );
  }
}
