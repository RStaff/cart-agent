import { NextResponse } from "next/server";

export async function GET() {
  const mode = process.env.STRIPE_MODE || "LIVE";
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  const sk = process.env.STRIPE_SECRET_KEY || "";

  // In dev/demo, we allow MOCK secrets to count as "present"
  const hasPublishable = !!pk;
  const hasSecret = mode === "MOCK" ? !!sk : sk.startsWith("sk_");

  return NextResponse.json({
    ok: true,
    env: {
      mode,
      hasPublishable,
      hasSecret,
      publishablePreview: pk ? pk.replace(/(.{7}).+/, "$1…") : null,
    },
  });
}
