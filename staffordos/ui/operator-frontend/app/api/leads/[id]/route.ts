import { NextResponse } from "next/server";
import {
  archiveLead,
  readLeads,
  updateLead,
} from "../../../../../../products/shopifixer/assisted/leads_store.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const payload = await request.json();
    const result = updateLead(id, payload || {});

    if (!result.ok) {
      return NextResponse.json({
        ok: false,
        error: result.error,
        errors: result.errors || [],
        leads: result.leads,
      }, { status: result.error === "lead_not_found" ? 404 : 400 });
    }

    return NextResponse.json({
      ok: true,
      lead: result.lead,
      leads: result.leads,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "lead_update_failed",
    }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    const result = archiveLead(id);

    if (!result.ok) {
      return NextResponse.json({
        ok: false,
        error: result.error,
        errors: result.errors || [],
        leads: result.leads || readLeads(),
      }, { status: result.error === "lead_not_found" ? 404 : 400 });
    }

    return NextResponse.json({
      ok: true,
      lead: result.lead,
      leads: result.leads,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "lead_archive_failed",
    }, { status: 500 });
  }
}
