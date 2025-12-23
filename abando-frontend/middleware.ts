import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // only redirect the exact root path
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/demo/playground";
    url.search = search;
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|robots.txt|sitemap.xml).*)"],
};
