import Stripe from "stripe";

/**
 * Central Stripe client.
 * - Do NOT hard-pin apiVersion in code (types drift with SDK updates).
 * - If you really need to pin, set STRIPE_API_VERSION in the env and we'll pass it through.
 */
let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeSingleton) return stripeSingleton;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");

  const apiVersion = process.env.STRIPE_API_VERSION; // optional
  stripeSingleton = apiVersion
    ? // Pass through ONLY if provided, so TS uses the literal type from your installed SDK
      new Stripe(key, {
        apiVersion: apiVersion as Stripe.StripeConfig["apiVersion"],
      })
    : // Otherwise rely on SDK default (avoids literal-type mismatch on upgrades)
      new Stripe(key);

  return stripeSingleton;
}

/** Public app URL helper used by routes/webhooks. */
export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
