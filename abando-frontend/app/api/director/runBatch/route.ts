import { NextRequest, NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "operator", "run_batch.js"))) {
      return candidate;
    }
  }

  return process.cwd();
}

export async function POST(request: NextRequest) {
  const rootDir = findCanonicalRoot();
  const body = await request.json().catch(() => ({}));
  const limit = Number.isFinite(Number(body?.limit)) && Number(body.limit) > 0 ? String(Number(body.limit)) : "8";

  try {
    const { stdout, stderr } = await execFileAsync("node", ["staffordos/operator/run_batch.js", limit], {
      cwd: rootDir,
    });

    return NextResponse.json({
      ...JSON.parse(stdout || "{}"),
      stderr,
    });
  } catch (error) {
    const stderr = error && typeof error === "object" && "stderr" in error ? String(error.stderr || "") : String(error);
    return NextResponse.json({ error: stderr || "Failed to run operator batch." }, { status: 500 });
  }
}
