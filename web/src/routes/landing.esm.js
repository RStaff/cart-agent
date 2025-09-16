/**
 * High-converting landing page mounted at "/"
 * - Clear hero + CTA
 * - 3 benefit cards
 * - Social proof strip (replace logos later)
 * - FAQ accordion
 * - Single primary CTA -> /pricing (already live)
 */
export function installLanding(app) {
  const SITE = process.env.APP_URL || "https://abando.ai";
  const CTA = "/pricing";

  app.get("/", (_req, res) => {
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Abando — Recover more carts (14-day free trial)</title>
  <meta name="description" content="Abando adds a smart on-site conversion agent that guides shoppers and recovers abandoned carts. 14-day free trial. Cancel anytime.">
  <meta property="og:title" content="Recover more carts with Abando"/>
  <meta property="og:description" content="On-site conversion agent. Break even after one recovered cart."/>
  <meta property="og:url" content="${SITE}"/>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box }
    body { margin:0; font-family: system-ui,-apple-system,Segoe UI,Roboto,sans-serif; background:#0b0b0c; color:#f2f2f2; }
    a { color:#8ab4ff; text-decoration:none }
    header, .wrap { max-width: 1040px; margin: 0 auto; padding: 0 20px; }
    header { height: 68px; display:flex; align-items:center; justify-content:space-between; }
    .logo { font-weight:900; letter-spacing:.3px; }
    .cta { display:inline-block; padding:12px 16px; border-radius:10px; background:#5b8cff; color:#0b0b0c; font-weight:800; }
    .hero { padding: 52px 0 22px; }
    h1 { font-size: clamp(30px,5vw,54px); margin:0 0 12px }
    .lead { opacity:.9; font-size: clamp(16px,2.2vw,20px); line-height:1.6; max-width: 780px; }
    .strip { opacity:.65; font-size:14px; margin: 22px 0 10px }
    .logos { display:flex; gap:18px; flex-wrap:wrap; opacity:.5 }
    .logo-pill { padding:6px 10px; border:1px solid #222; border-radius:8px; }
    .grid { display:grid; gap:18px; grid-template-columns: repeat(auto-fit,minmax(260px,1fr)); margin-top:26px }
    .card { background:#121214; border:1px solid #222; border-radius:14px; padding:18px }
    .faq { margin: 28px 0 40px }
    details { background:#121214; border:1px solid #222; border-radius:12px; padding:14px 16px; margin-top:10px }
    summary { cursor:pointer; font-weight:700 }
    footer { opacity:.65; font-size:14px; padding: 28px 0 60px }
  </style>
</head>
<body>
  <header>
    <div class="logo">Abando</div>
    <nav><a class="cta" href="${CTA}">Start Free Trial</a></nav>
  </header>

  <div class="wrap hero">
    <h1>Recover more carts, automatically.</h1>
    <p class="lead">Abando adds a smart on-site conversion agent that answers questions, reduces friction, and brings shoppers back if they drift. Most stores break even after a single recovered cart.</p>
    <p style="margin:18px 0 0">
      <a class="cta" href="${CTA}">Start Free Trial</a>
      <span style="opacity:.7; margin-left:10px; font-size:14px">14-day free trial • Cancel anytime</span>
    </p>

    <div class="strip">Trusted by teams like</div>
    <div class="logos">
      <div class="logo-pill">Your Logo</div>
      <div class="logo-pill">Soon™</div>
      <div class="logo-pill">Add Later</div>
    </div>

    <div class="grid">
      <div class="card"><strong>On-site agent</strong><br/>Guides shoppers, handles objections, nudges to checkout.</div>
      <div class="card"><strong>Recovery plays</strong><br/>Proven flows that re-engage and convert abandoned carts.</div>
      <div class="card"><strong>Fast install</strong><br/>Works with or without Shopify. Be live in minutes.</div>
    </div>

    <div class="faq">
      <h3>FAQ</h3>
      <details><summary>How long is the trial?</summary><div>14 days. Cancel anytime in one click.</div></details>
      <details><summary>Will it slow down my site?</summary><div>No. The agent loads asynchronously and is optimized for speed.</div></details>
      <details><summary>What’s included on Pro?</summary><div>All Starter features plus advanced playbooks, integrations, and priority support.</div></details>
    </div>

    <p><a class="cta" href="${CTA}">Start Free Trial</a></p>
    <footer>© <span id="y"></span> Abando • <a href="${CTA}">Pricing</a></footer>
  </div>

  <script>document.getElementById('y').textContent = new Date().getFullYear()</script>
</body>
</html>`;
    res.status(200).type("html").send(html);
  });
}
