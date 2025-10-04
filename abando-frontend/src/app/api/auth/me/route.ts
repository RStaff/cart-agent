import { NextRequest, NextResponse } from "next/server";
import { getSessionEmailFromCookie } from "@/lib/session";

export async function GET(req: NextRequest) {
  const email = getSessionEmailFromCookie(req);
  return NextResponse.json({ email });
}
