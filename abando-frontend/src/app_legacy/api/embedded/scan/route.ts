import { NextRequest, NextResponse } from "next/server";
import { getEmbeddedScanResult } from "@/lib/embeddedScan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleRequest(req: NextRequest) {
  const url = new URL(req.url);
  const storeFromQuery = url.searchParams.get("store");
  const body =
    req.method === "POST" ? await req.json().catch(() => ({} as { store?: string; sample?: boolean })) : {};
  const sample = url.searchParams.get("sample") === "1" || Boolean(body?.sample);
  const storeFromBody = String(body?.store || "");
  const store = storeFromBody || storeFromQuery || "";
  const data = await getEmbeddedScanResult(store, sample);

  return NextResponse.json(data, { status: 200 });
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  return handleRequest(req);
}
