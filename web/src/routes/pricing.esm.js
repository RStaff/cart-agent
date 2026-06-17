export function installPricingRoute(app) {
  app.get("/pricing", (_req, res) => {
    return res.redirect(302, "/shopifixer");
  });
}
