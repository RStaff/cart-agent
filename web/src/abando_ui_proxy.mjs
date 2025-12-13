import { createProxyMiddleware } from "http-proxy-middleware";

/**
 * Proxy ONLY the UI routes to Next.js (default :3001).
 * This keeps Shopify's embedded iframe origin on :3000 while serving UI from :3001.
 */
export function attachAbandoUiProxy(app) {
  const target = process.env.ABANDO_UI_ORIGIN || "http://localhost:3001";

  // Proxy UI-only paths. Do NOT proxy /api or Shopify auth routes.
  const uiPaths = ["/embedded", "/demo"];

  app.use(
    uiPaths,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      ws: true,
      xfwd: true,
      // keep the path as-is (Next expects /embedded and /demo/...)
      // default behavior already preserves path
      logLevel: process.env.ABANDO_PROXY_LOG_LEVEL || "silent",
      onProxyReq(proxyReq) {
        // Some dev setups benefit from forcing Host header to the target.
        // (Safe in dev; remove later if you dislike it.)
        proxyReq.setHeader("host", target.replace(/^https?:\/\//, ""));
      },
    })
  );

  // Helpful console line
  // eslint-disable-next-line no-console
  console.log(`[ABANDO_UI_PROXY] UI -> ${target} for ${uiPaths.join(", ")}`);
}
