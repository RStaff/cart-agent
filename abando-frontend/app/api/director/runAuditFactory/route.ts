import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "audit", "audit_factory.js"))) {
      return candidate;
    }
  }

  return process.cwd();
}

export async function GET() {
  try {
    const rootDir = findCanonicalRoot();
    const scriptPath = join(rootDir, "staffordos", "audit", "audit_factory.js");
    const { stdout } = await execFileAsync("node", [scriptPath], {
      cwd: rootDir,
      maxBuffer: 1024 * 1024,
    });

    return NextResponse.json(JSON.parse(stdout), {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Audit Factory failed.",
      },
      {
        status: 500,
      },
    );
  }
}
