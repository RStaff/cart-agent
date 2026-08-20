import { NextResponse } from "next/server";
import { currentCareerContext } from "../../../../../lib/career/careerP0Auth";

export const runtime = "nodejs";

export async function GET() {
  if (!(await currentCareerContext())) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  const key = String(process.env.JOOBLE_API_KEY || "").trim();
  const presence = key ? "PRESENT" : "ABSENT";
  if (!key) return NextResponse.json({ apiKey: presence, authentication: "FAIL" }, { status: 503 });
  try {
    const response = await fetch(`https://jooble.org/api/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ keywords: "project manager", location: "United States", page: 1 }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    let body: unknown = null;
    try { body = await response.json(); } catch { /* sanitized proof only */ }
    const data = body && typeof body === "object" ? body as { jobs?: unknown[]; totalCount?: unknown } : {};
    const recognized = Array.isArray(data.jobs) || typeof data.totalCount === "number";
    return NextResponse.json({ apiKey: presence, providerHttpStatus: response.status, providerRecognized: recognized, resultCount: Array.isArray(data.jobs) ? data.jobs.length : null, authentication: response.ok && recognized ? "PASS" : "FAIL" });
  } catch {
    return NextResponse.json({ apiKey: presence, providerHttpStatus: null, providerRecognized: false, resultCount: null, authentication: "FAIL" }, { status: 502 });
  }
}
