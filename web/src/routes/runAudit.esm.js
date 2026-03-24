import { getRunAuditStats, resolveRunAuditTarget } from "../../../staffordos/scorecards/runAuditResolver.js";

function page({ title, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at top, rgba(56, 189, 248, 0.12), transparent 28%),
        linear-gradient(180deg, #020617 0%, #0f172a 100%);
      color: #e2e8f0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .shell {
      max-width: 1120px;
      margin: 0 auto;
      padding: 52px 24px 80px;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid #1e293b;
      background: rgba(15, 23, 42, 0.78);
      color: #93c5fd;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .brand-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #38bdf8;
      box-shadow: 0 0 24px rgba(56, 189, 248, 0.55);
    }
    .hero {
      margin-top: 20px;
      display: grid;
      gap: 24px;
      grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
    }
    .panel {
      border: 1px solid #1e293b;
      border-radius: 24px;
      background: rgba(15, 23, 42, 0.88);
      box-shadow: 0 24px 90px rgba(2, 6, 23, 0.45);
      padding: 28px;
    }
    h1 {
      margin: 14px 0 12px;
      font-size: clamp(38px, 6vw, 64px);
      line-height: 1.02;
      letter-spacing: -0.04em;
    }
    .subtitle {
      margin: 0;
      color: #94a3b8;
      font-size: 18px;
      line-height: 1.65;
      max-width: 58ch;
    }
    .form-shell {
      margin-top: 24px;
      display: grid;
      gap: 12px;
    }
    .input {
      width: 100%;
      min-height: 56px;
      border-radius: 16px;
      border: 1px solid #334155;
      background: rgba(2, 6, 23, 0.7);
      color: #f8fafc;
      padding: 0 16px;
      font: inherit;
    }
    .cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #38bdf8, #2563eb);
      color: #eff6ff;
      text-decoration: none;
      font-weight: 800;
      font-size: 16px;
      letter-spacing: 0.01em;
      box-shadow: 0 18px 40px rgba(37, 99, 235, 0.35);
      border: 0;
      cursor: pointer;
      padding: 0 18px;
    }
    .ghost {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      border-radius: 14px;
      border: 1px solid #334155;
      background: rgba(2, 6, 23, 0.58);
      color: #e2e8f0;
      text-decoration: none;
      font-weight: 700;
      padding: 0 16px;
    }
    .notice {
      margin-top: 18px;
      border-radius: 18px;
      border: 1px solid rgba(34, 211, 238, 0.18);
      background: linear-gradient(180deg, rgba(8, 47, 73, 0.42), rgba(15, 23, 42, 0.82));
      padding: 18px;
    }
    .notice strong { display: block; color: #e0f2fe; margin-bottom: 8px; }
    .meta-item {
      border: 1px solid #1e293b;
      border-radius: 18px;
      background: rgba(2, 6, 23, 0.62);
      padding: 18px;
      margin-bottom: 14px;
    }
    .meta-label {
      color: #94a3b8;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    .meta-value {
      margin-top: 10px;
      color: #f8fafc;
      font-size: 18px;
      font-weight: 700;
      line-height: 1.5;
    }
    .small {
      color: #64748b;
      font-size: 13px;
      line-height: 1.6;
    }
    @media (max-width: 900px) {
      .hero { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="shell">${body}</main>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderRunAuditPage({ value = "", fallback = null, scorecardCount = 0 }) {
  const installUrl = fallback?.redirectPath || "/install/shopify";
  const body = `
    <div class="brand"><span class="brand-dot"></span>Abando</div>
    <section class="hero">
      <div class="panel">
        <h1>Run a 30-second checkout audit on your Shopify store</h1>
        <p class="subtitle">See where your checkout may be losing conversions based on Shopify benchmark patterns, then move into a real scorecard or the truthful next install step.</p>
        <form class="form-shell" method="GET" action="/run-audit">
          <input
            class="input"
            type="text"
            name="store"
            placeholder="northstar-outdoors.myshopify.com or yourstore.com"
            value="${escapeHtml(value)}"
            aria-label="Store domain"
            required
          />
          <button class="cta" type="submit">Run audit</button>
        </form>
        <p class="small" style="margin-top:18px;">This is a directional estimate, not tracked revenue yet. Tracked results begin after install.</p>
        ${fallback ? `
          <div class="notice">
            <strong>We don’t have a public scorecard for this store yet.</strong>
            <div>Abando can still take you to the next truthful step. Connect Shopify to let Abando analyze checkout decision activity after install.</div>
            <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
              <a class="cta" href="${installUrl}">Connect Shopify to Abando</a>
              <a class="ghost" href="/install/shopify">Open install path</a>
            </div>
          </div>
        ` : ""}
      </div>
      <div class="panel">
        <div class="meta-item">
          <div class="meta-label">What this route does</div>
          <div class="meta-value">Abando checks for a real generated public scorecard first. If one exists, you go there. If not, you go to the install path without a fake audit claim.</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Available public scorecards</div>
          <div class="meta-value">${scorecardCount}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Examples</div>
          <div class="meta-value">northstar-outdoors.myshopify.com<br/>northstar-outdoors<br/>cutsclothing.com</div>
        </div>
      </div>
    </section>
  `;

  return page({
    title: "Run a 30-Second Checkout Audit",
    body,
  });
}

export function installRunAuditRoute(app) {
  app.get("/run-audit", (req, res) => {
    const rawStore = typeof req.query?.store === "string"
      ? req.query.store
      : typeof req.query?.shop === "string"
        ? req.query.shop
        : typeof req.query?.domain === "string"
          ? req.query.domain
          : "";

    if (rawStore) {
      const resolved = resolveRunAuditTarget(rawStore);
      if (resolved.matched) {
        return res.redirect(302, resolved.redirectPath);
      }
      return res.status(200).type("html").send(renderRunAuditPage({
        value: rawStore,
        fallback: resolved,
        scorecardCount: getRunAuditStats().scorecardCount,
      }));
    }

    return res.status(200).type("html").send(renderRunAuditPage({
      scorecardCount: getRunAuditStats().scorecardCount,
    }));
  });
}
