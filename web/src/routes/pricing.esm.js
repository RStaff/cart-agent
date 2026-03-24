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
      max-width: 1180px;
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
      gap: 18px;
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
      font-size: clamp(40px, 6vw, 68px);
      line-height: 1.02;
      letter-spacing: -0.04em;
    }
    h2 {
      margin: 0 0 14px;
      font-size: 28px;
      letter-spacing: -0.03em;
    }
    .subtitle {
      margin: 0;
      color: #94a3b8;
      font-size: 18px;
      line-height: 1.65;
      max-width: 58ch;
    }
    .cta-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 24px;
    }
    .cta, .ghost {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 54px;
      border-radius: 16px;
      padding: 0 18px;
      font-weight: 800;
      text-decoration: none;
    }
    .cta {
      background: linear-gradient(135deg, #38bdf8, #2563eb);
      color: #eff6ff;
      box-shadow: 0 18px 40px rgba(37, 99, 235, 0.35);
    }
    .ghost {
      border: 1px solid #334155;
      background: rgba(2, 6, 23, 0.58);
      color: #e2e8f0;
    }
    .plans {
      margin-top: 24px;
      display: grid;
      gap: 18px;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .plan {
      border: 1px solid #1e293b;
      border-radius: 22px;
      background: rgba(2, 6, 23, 0.62);
      padding: 24px;
      display: grid;
      gap: 16px;
    }
    .plan.recommended {
      border-color: rgba(56, 189, 248, 0.55);
      box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.18);
      background: linear-gradient(180deg, rgba(8, 47, 73, 0.42), rgba(15, 23, 42, 0.82));
    }
    .eyebrow {
      color: #94a3b8;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-weight: 700;
    }
    .recommended-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 28px;
      padding: 0 10px;
      border-radius: 999px;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.35);
      color: #67e8f9;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .price {
      font-size: clamp(34px, 5vw, 46px);
      font-weight: 800;
      letter-spacing: -0.04em;
      color: #f8fafc;
    }
    .plan-title {
      font-size: 24px;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: -0.03em;
    }
    .feature-list {
      margin: 0;
      padding-left: 18px;
      color: #cbd5e1;
      line-height: 1.7;
    }
    .helper {
      color: #64748b;
      font-size: 13px;
      line-height: 1.6;
    }
    .steps {
      display: grid;
      gap: 14px;
      margin-top: 18px;
    }
    .step {
      border: 1px solid #1e293b;
      border-radius: 18px;
      background: rgba(2, 6, 23, 0.62);
      padding: 18px;
    }
    .step-title {
      color: #f8fafc;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .trust {
      margin-top: 18px;
      border-radius: 18px;
      border: 1px solid rgba(34, 211, 238, 0.18);
      background: linear-gradient(180deg, rgba(8, 47, 73, 0.42), rgba(15, 23, 42, 0.82));
      padding: 18px;
      color: #e0f2fe;
      line-height: 1.7;
    }
    @media (max-width: 980px) {
      .plans { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="shell">${body}</main>
</body>
</html>`;
}

export function installPricingRoute(app) {
  app.get("/pricing", (_req, res) => {
    const body = `
      <div class="brand"><span class="brand-dot"></span>Abando</div>
      <section class="hero">
        <div class="panel">
          <h1>Pricing for Shopify stores looking to recover lost revenue</h1>
          <p class="subtitle">Start with a free audit. Upgrade to track real checkout behavior and recovery opportunities.</p>
          <div class="cta-row">
            <a class="cta" href="/run-audit">Run your audit</a>
            <a class="ghost" href="/install/shopify">Install Abando</a>
          </div>
        </div>

        <div class="plans">
          <section class="plan">
            <div class="eyebrow">Starter</div>
            <div class="plan-title">STARTER</div>
            <div class="price">$49<span style="font-size:18px; color:#94a3b8;">/month</span></div>
            <ul class="feature-list">
              <li>Checkout audit + scorecard</li>
              <li>Guided advisor insights</li>
              <li>Basic recovery tracking (after install)</li>
              <li>Email support</li>
            </ul>
            <a class="cta" href="/install/shopify?plan=starter">Start free trial</a>
            <div class="helper">No commitment required to run the audit.</div>
          </section>

          <section class="plan recommended">
            <div style="display:flex; justify-content:space-between; gap:12px; align-items:center; flex-wrap:wrap;">
              <div class="eyebrow">Growth</div>
              <div class="recommended-badge">Recommended</div>
            </div>
            <div class="plan-title">GROWTH</div>
            <div class="price">$149<span style="font-size:18px; color:#94a3b8;">/month</span></div>
            <ul class="feature-list">
              <li>Everything in Starter</li>
              <li>Advanced checkout tracking</li>
              <li>Recovery opportunity insights</li>
              <li>Priority support</li>
            </ul>
            <a class="cta" href="/install/shopify?plan=growth">Start free trial</a>
            <div class="helper">No commitment required to run the audit.</div>
          </section>

          <section class="plan">
            <div class="eyebrow">Custom</div>
            <div class="plan-title">CUSTOM</div>
            <div class="price">Custom<span style="font-size:18px; color:#94a3b8;"> pricing</span></div>
            <ul class="feature-list">
              <li>High-volume stores</li>
              <li>Custom integrations</li>
              <li>Dedicated support</li>
            </ul>
            <a class="ghost" href="mailto:support@abando.ai?subject=Abando%20Custom%20Pricing">Contact us</a>
            <div class="helper">We’ll scope the right fit before any billing setup.</div>
          </section>
        </div>

        <div class="panel">
          <h2>How this works</h2>
          <div class="steps">
            <div class="step">
              <div class="step-title">1. Run a free audit (no signup)</div>
              <div>Start with a benchmark-based scorecard to see estimated revenue opportunity and the likely checkout issue.</div>
            </div>
            <div class="step">
              <div class="step-title">2. Connect your Shopify store</div>
              <div>Install Abando so it can move from public estimate into real storefront and checkout behavior tracking.</div>
            </div>
            <div class="step">
              <div class="step-title">3. Abando tracks real checkout behavior</div>
              <div>After install, Abando can observe checkout decision activity and recovery opportunities in your merchant workspace.</div>
            </div>
            <div class="step">
              <div class="step-title">4. See where revenue is actually being lost and recovered</div>
              <div>That is when tracked results begin and the product can move beyond benchmark guidance.</div>
            </div>
          </div>
          <div class="trust">The audit you see before install is a benchmark-based estimate — real tracking begins after connecting your store.</div>
        </div>

        <div class="panel">
          <h2>Ready to see where your checkout may be losing conversions?</h2>
          <p class="subtitle">Run the public audit first, then choose the plan that fits once you’re ready to connect your store.</p>
          <div class="cta-row">
            <a class="cta" href="/run-audit">Run your audit</a>
            <a class="ghost" href="/install/shopify">Go to install</a>
          </div>
        </div>
      </section>
    `;

    res.status(200).type("html").send(page({
      title: "Abando Pricing",
      body,
    }));
  });
}
