export async function handlePublicCheckout(req, res) {
  // Validate plan here or trust the precheck; create Stripe session, etc.
  const plan = req.body?.plan;
  // TODO: integrate your existing checkoutPublic logic
  return res.status(200).json({ ok:true, message:"placeholder real checkout", plan });
}
