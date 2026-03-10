import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function backendBase(): string {
  const base =
    process.env.CART_AGENT_API_BASE ||
    process.env.ABANDO_BACKEND_ORIGIN ||
    process.env.BACKEND_URL;

  if (!base) {
    throw new Error("Missing backend base URL for test recovery proxy.");
  }

  return base.replace(/\/+$/, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = `${backendBase()}/abando/activation/trigger-test-recovery`;
    const devToken = process.env.BACKEND_DEV_AUTH_TOKEN || "";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(devToken ? { Authorization: `Bearer ${devToken}` } : {}),
      },
      body: JSON.stringify({
        ...body,
        source: "shopify_embedded_admin",
        surface: "embedded_home",
      }),
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const payload = isJson
      ? await response.json().catch(() => ({ ok: false, error: "invalid_json" }))
      : { ok: response.ok, message: await response.text().catch(() => "") };

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to trigger test recovery.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
