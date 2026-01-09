import fs from 'node:fs'; import path from 'node:path';
const ROOT = process.cwd();
const PUB  = path.join(ROOT,'web','src','public');
const PLAY = path.join(PUB,'demo','playground','index.html');
const DASH = path.join(PUB,'dashboard','index.html');
const ONBD = path.join(PUB,'onboarding','index.html');
const CSS  = path.join(PUB,'assets','style.css');

const R = p => fs.existsSync(p) ? fs.readFileSync(p,'utf8') : '';
const W = (p,s)=>{ fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,s); console.log('✏️  wrote', p.replace(ROOT+'/','')); }

/* 1) Playground: ensure the “Dashboard” destination stays correct */
{
  let h = R(PLAY);
  if (h) {
    h = h.replace(/href="\/onboarding"/g,'href="/dashboard"') // belt+braces
         .replace(/>(?:Launch|Start)[^<]*Copilot[^<]*</gi,'>View AI Copilot Dashboard<')
         .replace(/Abando™/g,'Abando<sup>™</sup>');
    W(PLAY,h);
  }
}

/* 2) Dashboard: CTA should continue to Onboarding */
{
  let h = R(DASH);
  if (h) {
    h = h.replace(/href="\/onboarding"/g,'href="/onboarding"') // no-op if already correct
         .replace(/Abando™/g,'Abando<sup>™</sup>');
    W(DASH,h);
  }
}

/* 3) Onboarding: remove “conversation” + any link back to Playground; push Pricing conversion */
{
  let h = R(ONBD);
  if (!h) {
    // minimal onboarding if missing
    h = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Onboarding – Abando</title><link rel="stylesheet" href="/assets/style.css"></head>
<body>
<nav><div class="container"><a class="logo" href="/">Abando<sup>™</sup></a></div></nav>
<section class="section"><div class="container">
  <h1>Connect your store in minutes</h1>
  <p class="subheadline">Zero code. Safe to try. Measurable impact.</p>
  <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin:.9rem 0">
    <a class="btn btn-primary" href="/pricing">See pricing — plug &amp; play today</a>
    <a class="btn btn-outline" href="/dashboard">Back to dashboard</a>
  </div>
  <div class="card" style="margin-top:1rem">
    <h3>What to expect</h3>
    <ol class="muted">
      <li>Pick a plan on Pricing (you can upgrade later).</li>
      <li>Connect your store (under 5 minutes).</li>
      <li>Turn on the Shopping Copilot and monitor results.</li>
    </ol>
  </div>
</div></section>
<footer class="footer"><small>&copy; 2025 Abando<sup>™</sup> · <a href="/legal/terms">Terms</a> · <a href="/legal/privacy">Privacy</a> · <a href="/legal/dpa">DPA</a></small></footer>
<script src="/assets/main.js"></script>
</body></html>`;
    W(ONBD,h);
  } else {
    let next = h;
    // nuke “conversation” language
    next = next
      .replace(/conversation/gi,'setup')
      .replace(/Start a conversation/gi,'See pricing — plug & play today')
      .replace(/>(?:Launch|Start)[^<]*Copilot[^<]*</gi,'>See pricing — plug &amp; play today<');

    // update primary CTA to Pricing
    next = next
      .replace(/href="\/demo\/playground"/g,'href="/pricing"')
      .replace(/href="\/dashboard" class="btn btn-primary"/g,'href="/pricing" class="btn btn-primary"');

    // ensure there’s a visible secondary “Back to dashboard”
    if (!/Back to dashboard/i.test(next)) {
      // insert after the primary btn (closest run-button area)
      next = next.replace(
        /(class="btn btn-primary"[^>]*>[^<]+<\/a>)/i,
        `$1\n<a class="btn btn-outline" href="/dashboard">Back to dashboard</a>`
      );
    }

    // remove any residual links to the Playground from onboarding CTAs
    next = next.replace(/href="\/demo\/playground"/g,'href="/pricing"');

    // tidy brand ™
    next = next.replace(/Abando™/g,'Abando<sup>™</sup>');

    W(ONBD,next);
  }
}

/* 4) Small CSS nicety (outline button + subheadline) */
{
  let css = R(CSS);
  if (css && !/Funnel CTA/.test(css)) {
    css += `
/* --- Funnel CTA --- */
.btn-outline{border:1px solid var(--border);}
.subheadline{color:#cbd5e1}
`;
    W(CSS,css);
  }
}
console.log('✅ Funnel patched: Playground→Dashboard→Onboarding→Pricing. Onboarding copy de-conversationed.');
