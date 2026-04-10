import { NextResponse } from "next/server";
import {
  createLead,
  LEADS_STORE_PATH,
  LEAD_STATUSES,
  readLeads,
} from "../../../../../products/shopifixer/assisted/leads_store.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    ok: true,
    leads: readLeads(),
    store_path: LEADS_STORE_PATH,
    allowed_statuses: LEAD_STATUSES,
  });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = createLead(payload || {});
    if (!result.ok) {
      return NextResponse.json({
        ok: false,
        errors: result.errors,
        leads: result.leads,
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      lead: result.lead,
      leads: result.leads,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "lead_create_failed",
    }, { status: 500 });
  }
}
