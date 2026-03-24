import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { notFound } from "next/navigation";
import AuditPreviewLayout from "@/components/audit/AuditPreviewLayout";

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

function readPreview(storeId: string) {
  try {
    const rootDir = findCanonicalRoot();
    const data = JSON.parse(
      readFileSync(join(rootDir, "staffordos", "audit", "audit_screenshot_data.json"), "utf8"),
    ) as { previews?: AuditPreviewData[] };
    const previews = Array.isArray(data.previews) ? data.previews : [];
    return previews.find((preview) => preview.store_id === storeId) || null;
  } catch {
    return null;
  }
}

export default async function AuditPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ screenshot?: string }>;
}) {
  const { storeId } = await params;
  const resolvedSearchParams = await searchParams;
  const preview = readPreview(storeId);

  if (!preview) {
    notFound();
  }

  return <AuditPreviewLayout preview={preview} screenshotMode={resolvedSearchParams.screenshot === "1"} />;
}
