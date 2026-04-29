import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const ROOT = path.resolve(process.cwd(), "../../..");
const QUEUE_PATH = path.join(ROOT, "staffordos/leads/follow_up_queue_v1.json");

export async function GET() {
  try {
    if (!fs.existsSync(QUEUE_PATH)) {
      return NextResponse.json({
        ok: true,
        source: "staffordos/leads/follow_up_queue_v1.json",
        count: 0,
        items: []
      });
    }

    const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));

    return NextResponse.json({
      ok: true,
      source: "staffordos/leads/follow_up_queue_v1.json",
      ...queue
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error?.message || "failed_to_load_followups"
    }, { status: 500 });
  }
}
