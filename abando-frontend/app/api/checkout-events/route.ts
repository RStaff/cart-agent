import { NextRequest, NextResponse } from "next/server";
import { saveCheckoutEvents } from "@/lib/dashboard/storage/saveCheckoutEvents";
import { refreshConfirmationStateForShop } from "@/lib/dashboard/storage/refreshConfirmationStateForShop";
import { getShopConnection } from "@/lib/dashboard/storage/repository";
import { validateCheckoutEventPayload } from "@/lib/dashboard/storage/checkoutEventValidator";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const results = (Array.isArray(body) ? body : [body]).map(validateCheckoutEventPayload);
  const invalid = results.find((result) => !result.ok);

  if (invalid || !results.length) {
    return NextResponse.json(
      { ok: false, error: invalid && !invalid.ok ? invalid.error : "invalid_events" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const records = results.flatMap((result) => (result.ok ? [result.record] : []));
  const shops = Array.from(new Set(records.map((record) => record.shop)));

  for (const shop of shops) {
    const connection = await getShopConnection(shop);
    const source = records.find((record) => record.shop === shop)?.source;

    if (source !== "seeded_dev") {
      if (!connection) {
        return NextResponse.json({ ok: false, error: "unknown_shop" }, { status: 404, headers: CORS_HEADERS });
      }

      if (connection.installStatus !== "installed") {
        return NextResponse.json(
          { ok: false, error: "shop_not_connected" },
          { status: 409, headers: CORS_HEADERS },
        );
      }
    }
  }

  await saveCheckoutEvents(records);
  const snapshots = await Promise.all(shops.map((shop) => refreshConfirmationStateForShop(shop)));

  return NextResponse.json({
    ok: true,
    saved: records.length,
    shops,
    confirmationStatus: snapshots[0]?.confirmationStatus || null,
  }, {
    headers: CORS_HEADERS,
  });
}
