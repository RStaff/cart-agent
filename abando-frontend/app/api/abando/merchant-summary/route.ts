import { NextRequest, NextResponse } from "next/server";
import { getMerchantSummary } from "@/lib/dashboard/merchantSummary";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop") || "";
  const summary = await getMerchantSummary(shop);

  return NextResponse.json(summary);
}
