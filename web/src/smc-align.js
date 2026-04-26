export function installSmcAlign(app) {
  app.get("/smc-align", (_req, res) => {
    res.status(200).json({
      ok: true,
      service: "cart-agent",
      layer: "abando-align",
      status: "aligned"
    });
  });
}
