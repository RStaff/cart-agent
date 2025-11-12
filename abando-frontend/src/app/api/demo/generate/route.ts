import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const { product = "Your product", concerns = "shipping, returns", voice = "Direct Closer" } = await req.json().catch(()=>({}));
  const copy = `Hey — saw you eyeballing ${product}.
Yes: ${concerns.split(",")[0].trim()} is covered.
Add to cart and I’ll apply a launch perk automatically. Ready to checkout?`;
  return NextResponse.json({ ok: true, copy, voice, stats: { ctr: 0.12, recovery: 0.17 } });
}
