import { NextResponse } from "next/server";
import { careerP0Store, currentCareerContext } from "../../../../../lib/career/careerP0Auth";
import { exportProductAccount } from "../../../../../lib/career/careerP0Product.mjs";

export const runtime = "nodejs";

export async function GET() {
  const context = await currentCareerContext();
  if (!context) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json({ ok: true, exportVersion: "CAREEROS_P0_EXPORT_V2", tenant: context.tenant, data: { ...(await careerP0Store.exportAccount(context.session.id)), ...(await exportProductAccount(context)) } });
}
