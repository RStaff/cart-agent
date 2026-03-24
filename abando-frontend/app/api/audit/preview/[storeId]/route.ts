import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuditPreviewData = {
  store_id: string;
  store_domain: string;
  estimated_revenue_leak: string;
  primary_issue: string;
  benchmark_label: string;
  confidence: string;
  install_cta_label: string;
  created_at: string;
};

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "audit", "audit_screenshot_data.json"))) {
      return candidate;
    }
  }

  return process.cwd();
}

export async function GET(_: Request, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const { storeId } = await params;
    const rootDir = findCanonicalRoot();
    const data = JSON.parse(
      readFileSync(join(rootDir, "staffordos", "audit", "audit_screenshot_data.json"), "utf8"),
    ) as { previews?: AuditPreviewData[] };
    const previews = Array.isArray(data.previews) ? data.previews : [];
    const preview = previews.find((entry) => entry.store_id === storeId);

    if (!preview) {
      return NextResponse.json({ error: "Preview not found." }, { status: 404 });
    }

    return NextResponse.json(preview, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load audit preview.",
      },
      { status: 500 },
    );
  }
}
