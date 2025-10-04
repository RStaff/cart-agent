import { NextRequest, NextResponse } from "next/server";
import { createMagicToken } from "@/lib/session";
import { appUrl } from "@/lib/stripe";

async function send(email: string, link: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.log(`\n[magic-link] ${email} → ${link}\n`); return; }
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type":"application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: "Abando <noreply@abando.ai>",
      to: [email],
      subject: "Your Abando sign-in link",
      html: `<p>Click to sign in:</p><p><a href="${link}">${link}</a></p>`,
    }),
  }).catch(()=>{});
}

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(()=> ({}));
  if (!email || typeof email !== "string") return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  const token = createMagicToken(email);
  const url = `${appUrl}/api/auth/magic/consume?token=${token}`;
  await send(email, url);
  return NextResponse.json({ ok: true });
}
