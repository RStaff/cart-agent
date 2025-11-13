import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const backend = process.env.CART_AGENT_API_BASE!;
  const url = `${backend}/trial/start`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  return NextResponse.json(json, { status: res.status });
}
