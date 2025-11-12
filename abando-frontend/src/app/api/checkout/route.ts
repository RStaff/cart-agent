import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const backend = process.env.BACKEND_URL!;
  const devToken = process.env.BACKEND_DEV_AUTH_TOKEN || "";
  try {
    const body = await req.json().catch(() => ({}));
    const r = await fetch(`${backend}/api/billing/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://example.com",
        ...(devToken ? { Authorization: `Bearer ${devToken}` } : {}),
      },
      body: JSON.stringify(body),
      // Avoid caching on the edge
      cache: "no-store",
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch {
    return NextResponse.json({ error: "proxy_failed" }, { status: 500 });
  }
}
