import { NextResponse } from "next/server";
import { getPriceId } from "@/lib/pricing";

const isProd = process.env.NODE_ENV === "production";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:4000";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const plan = url.searchParams.get("plan") ?? undefined;
  const email = url.searchParams.get("email") ?? undefined;
  const priceId = getPriceId(plan ?? "");

  // Dev/Preview or missing key → go straight to onboarding
  if (!isProd || !process.env.STRIPE_SECRET_KEY) {
    const qs = new URLSearchParams();
    if (plan) qs.set("plan", plan);
    if (email) qs.set("email", email);
    return NextResponse.redirect(
      `${APP_URL}/onboarding${qs.size ? `?${qs}` : ""}`,
      { status: 302 },
    );
  }

  // Prod → create Checkout session
  if (!priceId) {
    // fall back to pricing with a soft error
    return NextResponse.redirect(`${APP_URL}/pricing?error=missing_price`, {
      status: 302,
    });
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const sQ = new URLSearchParams();
  if (plan) sQ.set("plan", plan);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/onboarding${sQ.size ? `?${sQ}` : ""}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/pricing${plan ? `?plan=${encodeURIComponent(plan)}` : ""}`,
    customer_email: email || undefined,
    allow_promotion_codes: true,
  });

  return NextResponse.redirect(session.url!, { status: 302 });
}
