/**
 * Public checkout endpoint mount
 * - Guards GET/etc with 405 JSON
 * - ALWAYS mounts POST /__public-checkout
 * - Honors CHECKOUT_FORCE_JSON=1 to return {ok:true,dryRun:true}
 */
module.exports = function mountPublicCheckout(app, express, helpers) {
  const { mapPlanSafe, checkoutDryRun, checkoutPublic, ensureResponse, checkoutError } = helpers;

  // Guard: POST only
  app.all('/__public-checkout', (req, res, next) => {
    if (req.method !== 'POST') {
      res.set('Allow', 'POST');
      return res.status(405).json({ ok:false, code:'method_not_allowed', route:'/__public-checkout' });
    }
    return next();
  });

  // Unconditional POST mount; behavior switches via env
  app.post(
    '/__public-checkout',
    express.json(),
    mapPlanSafe,
    (req, res, next) => {
      if (process.env.CHECKOUT_FORCE_JSON === '1') return checkoutDryRun(req, res);
      return checkoutPublic(req, res, next);
    },
    ensureResponse,
    checkoutError
  );

  console.log('[checkout] public POST mounted for /__public-checkout');
};
