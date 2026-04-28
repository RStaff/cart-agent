import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const ROOT = path.resolve(process.cwd(), "../../..");

const SEND_CONSOLE_DATA_PATH = path.join(ROOT, ".tmp/send_console_data.json");
const SEND_READY_PATH = path.join(ROOT, ".tmp/send_ready.json");
const LEAD_REGISTRY_PATH = path.join(ROOT, "staffordos/leads/lead_registry_v1.json");

type AnyRecord = Record<string, any>;

function readJson(filePath: string): any | null {
  try {
    if (!existsSync(filePath)) return null;
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function normalizeArray(payload: any): AnyRecord[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.leads)) return payload.leads;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function normalizeLead(item: AnyRecord, index: number) {
  return {
    id: item.id || `lead_${index + 1}`,
    leadName: item.name || item.leadName || item.store_domain || item.domain || `Lead ${index + 1}`,
    productSource: item.productSource || item.product || item.routing?.primary || "shopifixer",
    status: item.status || item.leadStage || item.lifecycleStage || "new",
    lastActivity:
      item.lastActivity ||
      item.generatedAt ||
      item.updatedAt ||
      item.truth?.lastActivity ||
      "Generated lead artifact",
    nextAction:
      item.nextAction ||
      item.nextBestActionLabel ||
      item.nextMessage ||
      item.message ||
      "Review lead",
    score: item.score ?? item.urgencyScore ?? null,
    sendTarget: item.sendTarget || item.url || item.website || null,
    problemSummary: item.problemSummary || item.detectedProblem || item.issueTitle || null,
    channel: item.channel || "unknown",
    contactConfidence: item.contactConfidence || null,
    paymentStatus: item.paymentStatus || item.truth?.payment?.status || null,
    paymentUrl: item.paymentUrl || item.truth?.payment?.url || null,
    source: item.source || "operator-leads-real-data"
  };
}

export async function GET() {
  const sources = [
    {
      label: ".tmp/send_console_data.json",
      path: SEND_CONSOLE_DATA_PATH
    },
    {
      label: ".tmp/send_ready.json",
      path: SEND_READY_PATH
    },
    {
      label: "staffordos/leads/lead_registry_v1.json",
      path: LEAD_REGISTRY_PATH
    }
  ];

  for (const source of sources) {
    const payload = readJson(source.path);
    const records = normalizeArray(payload);

    if (records.length > 0) {
      return NextResponse.json({
        ok: true,
        placeholder: false,
        source: source.label,
        count: records.length,
        leads: records.map(normalizeLead)
      });
    }
  }

  return NextResponse.json({
    ok: true,
    placeholder: false,
    source: "no-live-lead-data-found",
    count: 0,
    leads: []
  });
}
