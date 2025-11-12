import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Root-cause: dashboard must be public for sales/demo.
// We keep middleware file present to avoid import errors elsewhere, but do nothing.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [] // no protected routes
};
