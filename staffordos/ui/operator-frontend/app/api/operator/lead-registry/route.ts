import { NextResponse } from "next/server";
import { loadOperatorLeads } from "../../../../lib/leads/loadOperatorLeads";

export async function GET() {
  try {
    const data = await loadOperatorLeads();

    return NextResponse.json({
      ok: true,
      ...data
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err?.message || "failed_to_load_leads"
    }, { status: 500 });
  }
}
