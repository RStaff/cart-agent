import Stripe from 'stripe';

function readEnv(name, fallback = undefined) {
  const v = process.env[name];
  return (v === undefined || v === null || v === '') ? fallback : v;
}

export async function handlePublicCheckout(req, res) {
  try {
    const { plan, email } = req.body ?? {};

    // Map plan -> price
    const priceMap = {
      starter: readEnv('PRICE_STARTER'),
      pro:     readEnv('PRICE_PRO'),
      scale:   readEnv('PRICE_SCALE'),
    };
    const priceId = priceMap[plan];
    if (!priceId) return res.status(400).json({ ok:false, code:'unknown_plan', plan });

    // Feature flags
    const enableStripe = readEnv('CHECKOUT_ENABLE_STRIPE', '1') !== '0';
    const forceJson    = readEnv('CHECKOUT_FORCE_JSON', '0') === '1';

    // Dry-run path (works even without Stripe env)
    if (!enableStripe || forceJson || !readEnv('STRIPE_SECRET_KEY')) {
      return res.status(200).json({ ok:true, dryRun:true, plan, email: email || null });
    }

    // Real Stripe session
    const stripe = new Stripe(readEnv('STRIPE_SECRET_KEY'));
    const successUrl = readEnv('CHECKOUT_SUCCESS_URL', 'https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}');
    const cancelUrl  = readEnv('CHECKOUT_CANCEL_URL',  'https://yourapp.com/cancel');

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: { plan, source: 'public' },
    });

    return res.status(200).json({ ok:true, plan, sessionId: session.id, url: session.url });
  } catch (err) {
    return res.status(500).json({ ok:false, code:'checkout_error', message:String(err?.message || err) });
  }
}
