import { NextRequest, NextResponse } from "next/server";
import { markShopDisconnected } from "@/lib/dashboard/storage/repository";

export const runtime = "nodejs";

async function handle(req: NextRequest) {
  const url = new URL(req.url);
  const body = req.method === "POST" ? await req.json().catch(() => null) : null;
  const shop = String(body?.shop || url.searchParams.get("shop") || "").trim();

  if (!shop) {
    return NextResponse.json({ ok: false, error: "missing_shop" }, { status: 400 });
  }

  const record = await markShopDisconnected(shop);
  return NextResponse.json({
    ok: true,
    shop,
    installStatus: record.installStatus,
    uninstalledAt: record.uninstalledAt,
  });
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
