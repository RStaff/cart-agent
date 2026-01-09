import { NextResponse } from "next/server";
import { getPriceId } from "@/lib/pricing";

type Body = { plan?: string; priceId?: string; email?: string };

const isProd = process.env.NODE_ENV === "production";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:4000";

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    // ignore invalid JSON; we'll treat as empty body
  }

  const plan = body.plan || undefined;
  const resolvedPriceId = body.priceId || getPriceId(plan ?? "");

  // --- DEV / PREVIEW / NO STRIPE KEY → skip Stripe and continue onboarding
  if (!isProd || !process.env.STRIPE_SECRET_KEY) {
    const qs = new URLSearchParams();
    if (plan) qs.set("plan", plan);
    if (body.email) qs.set("email", body.email);
    return NextResponse.json(
      { ok: true, redirectUrl: `/onboarding${qs.toString() ? `?${qs}` : ""}` },
      { status: 200 },
    );
  }

  // --- PROD → real Stripe Checkout session
  try {
    if (!resolvedPriceId) {
      return NextResponse.json(
        { ok: false, error: "Missing priceId for selected plan." },
        { status: 400 },
      );
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const successQs = new URLSearchParams();
    if (plan) successQs.set("plan", plan);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      success_url: `${APP_URL}/onboarding${successQs.toString() ? `?${successQs}` : ""}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/pricing${plan ? `?plan=${encodeURIComponent(plan)}` : ""}`,
      customer_email: body.email || undefined,
      allow_promotion_codes: true,
    });

    return NextResponse.json(
      { ok: true, redirectUrl: session.url },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("trial/start error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unexpected error" },
      { status: 500 },
    );
  }
}
