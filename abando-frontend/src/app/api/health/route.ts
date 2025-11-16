import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    service: "abando-frontend",
    connected_to: "abando-backend",
    ok: true,
  });
}
