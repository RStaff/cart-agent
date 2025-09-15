/**
 * Public checkout endpoint mount (idempotent)
 * - Guards GET/etc with 405 JSON
 * - Always mounts POST handler for /__public-checkout
 * - Honors CHECKOUT_FORCE_JSON=1 to return {ok:true,dryRun:true}
 *
 * Expects these helpers to already exist in scope of index.js:
 *  - mapPlanSafe(req,res,next)
 *  - checkoutDryRun(req,res)
 *  - checkoutPublic(req,res,next)   // your real Stripe flow
 *  - ensureResponse(err,req,res,next) // fallback if no response
 *  - checkoutError(err,req,res,next)  // route-local error handler
 */
module.exports = function mountPublicCheckout(app, express, helpers) {
  const {
    mapPlanSafe,
    checkoutDryRun,
    checkoutPublic,
    ensureResponse,
    checkoutError
  } = helpers;

  // Guard: only allow POST to the public route
  app.all('/__public-checkout', (req, res, next) => {
    if (req.method !== 'POST') {
      res.set('Allow', 'POST');
      return res.status(405).json({ ok:false, code:'method_not_allowed', route:'/__public-checkout' });
    }
    return next();
  });

  // Always mount the POST; behavior branches on env
  app.post(
    '/__public-checkout',
    express.json(),
    mapPlanSafe,
    (req, res, next) => {
      if (process.env.CHECKOUT_FORCE_JSON === '1') {
        return checkoutDryRun(req, res); // { ok:true, dryRun:true, ... }
      }
      return checkoutPublic(req, res, next); // Should res.json({ ok:true, url: ... })
    },
    ensureResponse,   // fallback if checkoutPublic forgot to respond
    checkoutError     // route-local error handler
  );

  // Optional: basic status/probe (if not already implemented elsewhere)
  // Leave this here harmlessly; your main index may already expose a _status.
  // Comment out if you duplicate routes.
  // app.get('/__public-checkout/_status', (req, res) => {
  //   return res.json({ ok:true, public:"true" });
  // });
};
