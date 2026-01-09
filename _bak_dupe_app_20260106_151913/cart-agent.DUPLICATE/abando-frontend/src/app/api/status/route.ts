import { NextResponse } from "next/server";
import { stripeEnvStatus } from "@/lib/stripeEnv";

export async function GET() {
  const stripe = stripeEnvStatus();
  const autosendMode = process.env.AUTOSEND_MODE ?? "auto";
  const autosendEnabled = autosendMode === "auto";
  return NextResponse.json({
    ok: true,
    stripe,
    autosend: { mode: autosendMode, autosendEnabled },
  });
}
