import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const destination = new URL("/install/shopify", url.origin);

  url.searchParams.forEach((value, key) => {
    destination.searchParams.set(key, value);
  });

  return NextResponse.redirect(destination, 302);
}
