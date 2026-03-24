import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "verify", "verify_surface.js"))) {
      return candidate;
    }
  }

  return process.cwd();
}

function readVerification(rootDir: string, surface: "marketing" | "embedded") {
  const filePath = join(rootDir, "staffordos", "verify", `${surface}_verification.json`);

  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return {
      surface,
      verified_at: "",
      final_status: "UNKNOWN",
    };
  }
}

export async function GET() {
  const rootDir = findCanonicalRoot();

  return NextResponse.json({
    marketing: readVerification(rootDir, "marketing"),
    embedded: readVerification(rootDir, "embedded"),
  }, { headers: { "Cache-Control": "no-store" } });
}
