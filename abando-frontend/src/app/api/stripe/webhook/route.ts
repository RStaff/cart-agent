import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createMagicToken } from "@/lib/session";
import { appUrl } from "@/lib/stripe";

export const runtime = "nodejs";

async function sendMagicLink(email: string, url: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`\n[magic-link] ${email} → ${url}\n`);
    return;
  }
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "Abando <noreply@abando.ai>",
      to: [email],
      subject: "Your Abando sign-in link",
      html: `<p>Click to sign in:</p><p><a href="${url}">${url}</a></p>`,
    }),
  }).catch(() => {
    /* ignore email errors in dev */
  });
}

export async function POST(req: NextRequest) {
  try {
    const sig = req.headers.get("stripe-signature");
    if (!sig)
      return NextResponse.json({ error: "no_signature" }, { status: 400 });
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret)
      return NextResponse.json({ error: "no_webhook_secret" }, { status: 400 });

    const stripe = getStripe();
    const buf = Buffer.from(await req.arrayBuffer());
    const event = stripe.webhooks.constructEvent(buf, sig, secret);

    if (event.type === "checkout.session.completed") {
      const s = event.data.object as any;
      const email: string | undefined = s.customer_details?.email;
      if (email) {
        const token = createMagicToken(email);
        const url = `${appUrl}/api/auth/magic/consume?token=${token}&from=webhook`;
        await sendMagicLink(email, url);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("stripe webhook error", e?.message);
    return NextResponse.json({ error: "webhook_error" }, { status: 400 });
  }
}
