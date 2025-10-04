export function stripeEnvStatus() {
  const pub = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "").trim();
  const sec = (process.env.STRIPE_SECRET_KEY || "").trim();
  return {
    hasPublishable: pub.length > 0,
    hasSecret: sec.length > 0,
    publishablePreview: pub ? pub.slice(0, 7) + "…" : "",
  };
}
