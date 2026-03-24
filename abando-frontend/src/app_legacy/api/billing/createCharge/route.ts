import { NextRequest, NextResponse } from "next/server";
import { createRecurringCharge } from "@/lib/shopifyBilling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveAccessToken(req: NextRequest) {
  const headerToken = req.headers.get("x-shopify-access-token");
  return (
    headerToken ||
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ||
    process.env.SHOPIFY_ACCESS_TOKEN ||
    ""
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as { shop?: string }));
    const shop = String(body?.shop || "").trim();

    if (!shop) {
      return NextResponse.json({ error: "shop_required" }, { status: 400 });
    }

    const accessToken = resolveAccessToken(req);
    if (!accessToken) {
      return NextResponse.json({ error: "shopify_access_token_missing" }, { status: 500 });
    }

    const billing = await createRecurringCharge(shop, accessToken);
    return NextResponse.json(
      {
        ok: true,
        confirmationUrl: billing.confirmationUrl,
        chargeId: billing.chargeId,
        plan: {
          name: "Abando Pro",
          price: 29,
          trialDays: 7,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "billing_create_failed",
      },
      { status: 500 },
    );
  }
}
