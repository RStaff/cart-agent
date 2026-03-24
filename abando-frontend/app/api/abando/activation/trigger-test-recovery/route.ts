import { NextRequest, NextResponse } from "next/server";
import { postBackendJson } from "@/server/abandoBackend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Malformed JSON request body.",
        errorKind: "request_shape",
      },
      { status: 400 }
    );
  }

  const payload: Record<string, unknown> = {
    ...(body as Record<string, unknown>),
    source: "shopify_embedded_admin",
    surface: "embedded_home",
  };

  const result = await postBackendJson(
    "/abando/activation/trigger-test-recovery",
    payload
  );

  if (!result.ok) {
    console.error("[abando:test-recovery] backend request failed", {
      errorKind: result.error.kind,
      status: result.status,
      shop: typeof payload.shop === "string" ? payload.shop : null,
      message: result.error.message,
      backendMessage: result.error.backendMessage || null,
    });

    return NextResponse.json(
      {
        ok: false,
        error: result.error.message,
        errorKind: result.error.kind,
        backendStatus: result.status,
        ...(result.error.backendMessage
          ? { backendMessage: result.error.backendMessage }
          : {}),
      },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data, { status: result.status });
}
