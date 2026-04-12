import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

function safeRead(path: string) {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return null; }
}

function safeExec(cmd: string) {
  try { return execSync(cmd, { timeout: 5000 }).toString().trim(); } catch { return null; }
}

export async function GET() {
  const leadsPath = join(process.cwd(), "../../products/shopifixer/outreach/shopifixer_outreach_queue.json");
  const heartbeatPath = join(process.cwd(), "../../data/shopifixer_heartbeat_state.json");
  const leads = safeRead(leadsPath);
  const heartbeat = safeRead(heartbeatPath);

  const sent = Array.isArray(leads) ? leads.filter((l: any) => l.status === "sent").length : 0;
  const pending = Array.isArray(leads) ? leads.filter((l: any) => l.status === "backlog").length : 0;
  const withEmail = Array.isArray(leads) ? leads.filter((l: any) => l.email).length : 0;
  const total = Array.isArray(leads) ? leads.length : 0;

  const abackend = safeExec("curl -s --max-time 3 https://pay.abando.ai/healthz || curl -s --max-time 3 https://pay.abando.ai/health");
  const abandoStatus = abackend?.includes("ok") ? "live" : "unknown";

  const photoCount = safeExec("ssh -o ConnectTimeout=3 ross@100.91.225.86 'find ~/media/photos -type f | wc -l' 2>/dev/null");
  const graceCount = safeExec("ssh -o ConnectTimeout=3 ross@100.91.225.86 'find ~/media/daughters/grace -type f | wc -l' 2>/dev/null");
  const mayaCount = safeExec("ssh -o ConnectTimeout=3 ross@100.91.225.86 'find ~/media/daughters/maya -type f | wc -l' 2>/dev/null");

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    services: {
      abando: { status: abandoStatus, url: "pay.abando.ai" },
      shopifixer: { status: "live", url: "staffordmedia.ai/shopifixer" },
      staffordos: { status: "live", url: "localhost:4000" },
    },
    shopifixer: { total, sent, pending, withEmail },
    heartbeat,
    media: {
      photos: parseInt(photoCount || "0"),
      grace: parseInt(graceCount || "0"),
      maya: parseInt(mayaCount || "0"),
    },
  });
}
