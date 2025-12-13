import { createProxyMiddleware } from "http-proxy-middleware";

export function attachUiProxy(app) {
  const target = process.env.ABANDO_UI_ORIGIN || "http://localhost:3001";

  const common = {
    target,
    changeOrigin: true,
    ws: true,
    xfwd: true,
    logLevel: "silent",
  };

  // Compatibility across http-proxy-middleware major versions:
  // - v3: createProxyMiddleware(options) + pathFilter
  // - v2: createProxyMiddleware(context, options)
  let proxy;
  if (createProxyMiddleware.length === 1) {
    proxy = createProxyMiddleware({
      ...common,
      pathFilter: ["/demo", "/embedded"],
    });
  } else {
    proxy = createProxyMiddleware(["/demo", "/embedded"], common);
  }

  // Attach early so /demo/* and /embedded* never hit other handlers
  app.use(proxy);

  console.log(`[UI PROXY] [/demo,/embedded] -> ${target}`);
}
