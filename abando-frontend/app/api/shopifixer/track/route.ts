import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const QUEUE_PATH_CANDIDATES = [
  path.join(
    "/Users/rossstafford/projects/cart-agent",
    "staffordos/products/shopifixer/outreach/shopifixer_outreach_queue.json",
  ),
  path.join(
    process.cwd(),
    "staffordos/products/shopifixer/outreach/shopifixer_outreach_queue.json",
  ),
  path.join(
    process.cwd(),
    "..",
    "staffordos/products/shopifixer/outreach/shopifixer_outreach_queue.json",
  ),
];

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeStoreDomain(value: unknown) {
  const raw = cleanText(value);
  if (!raw) return "";

  try {
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(candidate);
    return parsed.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return raw
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0]
      .toLowerCase();
  }
}

function normalizeEvent(value: unknown) {
  const normalized = cleanText(value);
  return ["fix_page_view", "fix_cta_click"].includes(normalized) ? normalized : "";
}

function resolveQueuePath() {
  return QUEUE_PATH_CANDIDATES.find((candidate) => fs.existsSync(candidate)) || "";
}

function readQueue(queuePath: string) {
  if (!queuePath || !fs.existsSync(queuePath)) {
    return [];
  }

  const parsed = JSON.parse(fs.readFileSync(queuePath, "utf8"));
  return Array.isArray(parsed) ? parsed : [];
}

function writeQueue(queuePath: string, rows: unknown[]) {
  fs.mkdirSync(path.dirname(queuePath), { recursive: true });
  fs.writeFileSync(queuePath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      event?: string;
      store?: string;
    };

    const event = normalizeEvent(payload?.event);
    const store = normalizeStoreDomain(payload?.store);

    if (!event) {
      throw new Error("invalid_tracking_event");
    }

    if (!store) {
      throw new Error("store_missing");
    }

    const queuePath = resolveQueuePath();
    const queue = readQueue(queuePath);
    const index = queue.findIndex((row) => normalizeStoreDomain((row as { store_url?: string }).store_url) === store);

    if (index === -1) {
      return NextResponse.json({
        ok: true,
        matched: false,
        timestamp: new Date().toISOString(),
      });
    }

    const existingRow = queue[index] as Record<string, unknown>;
    queue[index] = {
      ...existingRow,
      tracking: {
        ...((existingRow.tracking && typeof existingRow.tracking === "object")
          ? (existingRow.tracking as Record<string, unknown>)
          : {}),
        [event]: new Date().toISOString(),
      },
    };

    if (!queuePath) {
      throw new Error("queue_path_missing");
    }

    writeQueue(queuePath, queue);

    return NextResponse.json({
      ok: true,
      matched: true,
      queuePath,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "shopifixer_tracking_failed",
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    );
  }
}
