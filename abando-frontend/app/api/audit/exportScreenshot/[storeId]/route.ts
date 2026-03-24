import { NextResponse } from "next/server";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "audit", "export_screenshot.js"))) {
      return candidate;
    }
  }

  return process.cwd();
}

export async function GET(_: Request, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const { storeId } = await params;
    const rootDir = findCanonicalRoot();
    const exporterPath = join(rootDir, "staffordos", "audit", "export_screenshot.js");
    const { stdout } = await execFileAsync(
      process.execPath,
      [exporterPath, storeId],
      {
        cwd: rootDir,
        env: {
          ...process.env,
          ABANDO_BASE_URL: process.env.ABANDO_BASE_URL || "http://127.0.0.1:3000",
        },
      },
    );
    const result = JSON.parse(stdout);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to export screenshot.",
      },
      { status: 500 },
    );
  }
}
