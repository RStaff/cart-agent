import { NextResponse } from "next/server";
import { stripeEnvStatus } from "@/lib/stripeEnv";

export async function GET() {
  const env = stripeEnvStatus();
  return NextResponse.json({ ok: true, env });
}
