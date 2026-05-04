import { NextResponse } from "next/server";
import { loadDashboardSnapshot } from "../../../../lib/operator/loadDashboardSnapshot";

export async function GET() {
  try {
    const snapshot = loadDashboardSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "dashboard_snapshot_load_failed",
        detail: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
