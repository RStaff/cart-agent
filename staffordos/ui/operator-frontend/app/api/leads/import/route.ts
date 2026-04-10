import { NextResponse } from "next/server";
import {
  createLead,
  readLeads,
} from "../../../../../../products/shopifixer/assisted/leads_store.js";

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const rows = Array.isArray(payload?.rows) ? payload.rows : [];
    const rejectionReasons: string[] = [];
    const importedLeads: Record<string, unknown>[] = [];

    for (const [index, rawRow] of rows.entries()) {
      const row = rawRow && typeof rawRow === "object" ? rawRow as Record<string, unknown> : {};
      const result = createLead({
        company: cleanText(row.company),
        url: cleanText(row.url),
        email: cleanText(row.email),
        niche: cleanText(row.niche),
        observed_issue: cleanText(row.observed_issue),
        why_it_matters: cleanText(row.why_it_matters),
        confidence: cleanText(row.confidence),
        lead_quality: cleanText(row.lead_quality),
        source: "csv",
        status: "backlog",
      });

      if (!result.ok || !result.lead) {
        rejectionReasons.push(`row_${index + 1}:${(result.errors || [result.error || "import_failed"]).join(",")}`);
        continue;
      }

      importedLeads.push(result.lead);
    }

    return NextResponse.json({
      ok: true,
      imported_count: importedLeads.length,
      rejected_count: rejectionReasons.length,
      rejection_reasons: rejectionReasons,
      imported_leads: importedLeads,
      leads: readLeads(),
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "lead_csv_import_failed",
      imported_count: 0,
      rejected_count: 0,
      rejection_reasons: [],
      leads: readLeads(),
    }, { status: 500 });
  }
}
