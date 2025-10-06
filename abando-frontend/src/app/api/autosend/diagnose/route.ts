import { NextResponse } from "next/server";
import {
  getAutoSendMode,
  getAutoSendThresholdMin,
  requireCronSecret,
} from "@/lib/autosend-config";

export async function GET(req: Request) {
  if (!requireCronSecret(req)) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }
  const mode = getAutoSendMode();
  const thresholdMin = getAutoSendThresholdMin();
  return NextResponse.json({
    ok: true,
    env: process.env.NODE_ENV,
    mode,
    thresholdMin,
    autosendEnabled: mode === "auto",
  });
}
