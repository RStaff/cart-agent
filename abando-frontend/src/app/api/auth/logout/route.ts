import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  clearSession(res);
  return res;
}
