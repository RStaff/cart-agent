import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET() {
  const repoRoot = path.resolve(process.cwd(), "../../..");
  const file = path.join(repoRoot, "staffordos/system_inventory/output/discovery_sync_runner_status_v1.json");

  try {
    if (!fs.existsSync(file)) {
      return NextResponse.json({
        ok: false,
        error: "discovery_status_missing",
        file
      }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      file,
      status: JSON.parse(fs.readFileSync(file, "utf8"))
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
}
