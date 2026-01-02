import { createProxyMiddleware } from "http-proxy-middleware";

export default function applyAbandoDevProxy(app) {
  const always = String(process.env.ABANDO_PROXY_ALWAYS || "") === "1";
  const target = process.env.ABANDO_NEXT_ORIGIN || "http://localhost:3000";

  if (process.env.NODE_ENV === "production" && !always) return;

  const nextProxy = createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: true,
    // NOTE: We mount at "/" so Express does NOT strip the prefix.
    // This preserves paths like /embedded, /_next, /marketing, etc.
    logLevel: "warn",
  on: {
    proxyRes(proxyRes) {
      try {
        proxyRes.headers["x-abando-proxied"] = "1";
      } catch (_e) {}
    },
  },
  });

  // If Shopify hits / with embedded=1, bounce into /embedded (preserve querystring)
  app.get("/", (req, res, next) => {
    try {
      const embedded =
        always ||
        String(req.query?.embedded || "") === "1" ||
        String(req.query?.embedded || "") === "true";

      if (!embedded) return next();

      const qs = req.originalUrl.includes("?") ? req.originalUrl.split("?")[1] : "";
      const dest = qs ? `/embedded?${qs}` : "/embedded";
      return res.redirect(302, dest);
    } catch (_e) {
      return next();
    }
  });

  // Path-preserving proxy: only forward these paths to Next
  app.use((req, res, next) => {
    const p = req.path || "";
    if (
      p === "/embedded" ||
      p.startsWith("/embedded/") ||
      p === "/marketing" ||
      p.startsWith("/marketing/") ||
      p === "/demo" ||
      p.startsWith("/demo/") ||
      p.startsWith("/_next/") ||
      p === "/_next"
    ) {
      return nextProxy(req, res, next);
    }
    return next();
  });

  console.log(`[abandoDevProxy] enabled → ${target} (path preserved)`);
}
