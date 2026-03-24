import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { NextResponse } from "next/server";

type InstallEvent = {
  timestamp: string;
  event_type: "audit_view" | "audit_run" | "install_click" | "install_success";
  store_domain: string;
  metadata: Record<string, unknown>;
};

type InstallEventsFile = {
  events: InstallEvent[];
};

function findCanonicalRoot() {
  const candidates = [
    process.cwd(),
    resolve(process.cwd(), ".."),
    resolve(process.cwd(), "../.."),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "analytics", "install_events.json"))) {
      return candidate;
    }
  }

  return resolve(process.cwd(), "..");
}

async function readInstallEvents(eventsPath: string) {
  try {
    const raw = await readFile(eventsPath, "utf8");
    const parsed = JSON.parse(raw) as InstallEventsFile;
    return Array.isArray(parsed?.events) ? parsed : { events: [] };
  } catch {
    return { events: [] };
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      store_domain?: string;
      source?: string;
    };

    const rootDir = findCanonicalRoot();
    const eventsPath = join(rootDir, "staffordos", "analytics", "install_events.json");
    const payload = await readInstallEvents(eventsPath);

    payload.events.push({
      timestamp: new Date().toISOString(),
      event_type: "install_click",
      store_domain: String(body.store_domain || "unknown"),
      metadata: {
        source: String(body.source || "unknown"),
      },
    });

    await writeFile(eventsPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "install_click_log_failed" },
      { status: 500 },
    );
  }
}
