import { NextResponse } from "next/server";
import {
  loadSystemMapManifest,
  getSystemMapManifestPath
} from "../../../../lib/system-map/loadSystemMapManifest";

export async function GET() {
  try {
    const manifest = loadSystemMapManifest();

    return NextResponse.json({
      ok: true,
      source: getSystemMapManifestPath(),
      manifest
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
