import { NextRequest, NextResponse } from "next/server";
import { consumeMagicToken, setSessionCookie } from "@/lib/session";
import { appUrl } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  const sid = consumeMagicToken(token);
  if (!sid) return NextResponse.json({ error: "invalid_or_expired_link" }, { status: 400 });
  const res = NextResponse.redirect(new URL("/dashboard", appUrl()));
  setSessionCookie(res, sid);
  return res;
}
