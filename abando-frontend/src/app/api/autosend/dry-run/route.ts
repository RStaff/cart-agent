import { NextResponse } from "next/server";
import {
  getAutoSendMode,
  getAutoSendThresholdMin,
  requireCronSecret,
} from "@/lib/autosend-config";

type Body = {
  cartAgeMinutes?: number; // age of the cart in minutes
  itemCount?: number; // optional: can gate on >0 items
};

export async function POST(req: Request) {
  if (!requireCronSecret(req)) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }

  let body: Body = {};
  try {
    body = await req.json();
  } catch {}

  const age = Math.max(0, Math.floor(Number(body.cartAgeMinutes ?? 0)));
  const items = Math.max(0, Math.floor(Number(body.itemCount ?? 0)));

  const mode = getAutoSendMode();
  const thresholdMin = getAutoSendThresholdMin();

  // Decision logic — mirror your real worker’s first-pass rules
  const qualifies = mode === "auto" && items > 0 && age >= thresholdMin;

  return NextResponse.json({
    ok: true,
    env: process.env.NODE_ENV,
    mode,
    thresholdMin,
    input: { age, items },
    wouldSend: qualifies,
    reason:
      mode !== "auto"
        ? "mode=manual"
        : items <= 0
          ? "no items"
          : age < thresholdMin
            ? "below threshold"
            : "qualified",
  });
}
