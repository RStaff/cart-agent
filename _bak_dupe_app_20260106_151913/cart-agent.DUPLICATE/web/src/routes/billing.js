import express from "express";
import { Router } from "express";
import { stripe, ensureStripe } from "../clients/stripe.js";
import { prisma } from "../clients/prisma.js";
export const billingRouter = Router();

// Guard all billing endpoints if Stripe is not configured

billingRouter.post("/checkout", async (req, res) => {
  if (ensureStripe(req, res)) return;
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "unauthenticated" });
    let u = await prisma.user.findUnique({ where: { id: user.id } });
    let customerId = u.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: u.email });
      customerId = customer.id;
      u = await prisma.user.update({ where: { id: u.id }, data: { stripeCustomerId: customerId } });
    }
    const origin = req.headers.origin || "https://abando.ai";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      client_reference_id: u.id,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing`,
      allow_promotion_codes: true,
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "stripe_error" });
  }
});

billingRouter.post("/portal", async (req, res) => {
  if (ensureStripe(req, res)) return;
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "unauthenticated" });
    const u = await prisma.user.findUnique({ where: { id: user.id } });
    if (!u?.stripeCustomerId) return res.status(400).json({ error: "no_stripe_customer" });
    const portal = await stripe.billingPortal.sessions.create({
      customer: u.stripeCustomerId,
      return_url: `${req.headers.origin || "https://abando.ai"}/dashboard`,
    });
    res.json({ url: portal.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "stripe_error" });
  }
});

export async function stripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  try {
    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
      const sub = event.data.object;
      const user = await prisma.user.findFirst({ where: { stripeCustomerId: sub.customer } });
      if (user) await prisma.user.update({ where: { id: user.id }, data: { stripeSubStatus: sub.status } });
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      const user = await prisma.user.findFirst({ where: { stripeCustomerId: sub.customer } });
      if (user) await prisma.user.update({ where: { id: user.id }, data: { stripeSubStatus: "canceled" } });
    }
    res.json({ received: true });
  } catch (e) {
    console.error("Webhook handling error", e);
    res.status(500).json({ error: "webhook_failed" });
  }
}
