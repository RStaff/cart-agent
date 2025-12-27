import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function verifyShopifyHmac(req: NextRequest, rawBody: string) {
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
  if (!hmacHeader) return false;

  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) return false;

  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!verifyShopifyHmac(req, rawBody)) {
    return new NextResponse("Invalid HMAC", { status: 401 });
  }

  // Minimal compliance no-op (OK for apps storing no customer PII)
  return NextResponse.json({ ok: true });
}
