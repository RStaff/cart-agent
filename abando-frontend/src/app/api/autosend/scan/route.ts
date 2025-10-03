import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/autosend-config";
import { scanAndMaybeSend, DemoRepo, DemoMessenger } from "@/lib/autosend-worker";

/**
 * GET /api/autosend/scan
 * - In prod, must include header: X-Cron-Secret: $CRON_SECRET
 * - Uses DemoRepo/DemoMessenger until you wire in your real ones.
 */
export async function GET(req: Request) {
  if (!requireCronSecret(req)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  // TODO: swap DemoRepo/DemoMessenger for your real implementations
  const result = await scanAndMaybeSend(new DemoRepo(), new DemoMessenger());

  return NextResponse.json({ ok: true, result });
}
