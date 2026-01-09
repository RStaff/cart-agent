import fs from 'node:fs'; import path from 'node:path';

const ROOT = process.cwd();
const SRC  = path.join(ROOT, 'web','src');
const PUB  = path.join(SRC, 'public');
const ASSETS = path.join(PUB, 'assets');
const MAIN_JS = path.join(ASSETS,'main.js');
const CSS     = path.join(ASSETS,'style.css');

const HOME       = path.join(PUB,'index.html');
const PRICING    = path.join(PUB,'pricing','index.html');
const ONBOARD    = path.join(PUB,'onboarding','index.html');
const DASHBOARD  = path.join(PUB,'dashboard','index.html');
const PLAY       = path.join(PUB,'demo','playground','index.html');
const INDEX_JS   = path.join(SRC,'index.js');

const LEGAL_DIR  = path.join(PUB,'legal');
const LEGAL_IDX  = path.join(LEGAL_DIR, 'index.html');
const LEGAL_TOS  = path.join(LEGAL_DIR, 'terms','index.html');
const LEGAL_PRIV = path.join(LEGAL_DIR, 'privacy','index.html');
const LEGAL_DPA  = path.join(LEGAL_DIR, 'dpa','index.html');

function r(p){ return fs.existsSync(p) ? fs.readFileSync(p,'utf8') : ''; }
function w(p, s){ fs.mkdirSync(path.dirname(p), {recursive:true}); fs.writeFileSync(p, s); console.log('✏️  wrote', p.replace(ROOT+'/','')); }

// ---------- 0) Make sure /dashboard route exists ----------
{
  let s = r(INDEX_JS);
  if (s && !/app\.get\("\/dashboard"/.test(s)) {
    s += `

app.get("/dashboard", (_req, res) => res.sendFile(require("path").join(__dirname, "public", "dashboard", "index.html")));
`;
    w(INDEX_JS, s);
  }
}

// ---------- 1) Playground: Launch → Dashboard ----------
{
  let h = r(PLAY);
  if (h) {
    // Rename button text if it says “Launch Copilot” etc.
    h = h.replace(/>(?:Launch|Start)[^<]*Copilot[^<]*</i, '>View AI Copilot Dashboard<');
    // Point the button/link to /dashboard
    h = h.replace(/href="\/onboarding"/g, 'href="/dashboard"')
         .replace(/data-dest="onboarding"/g, 'data-dest="dashboard"');
    // If there’s a JS click handler that navigates to onboarding, nudge it to /dashboard
    h = h.replace(/\/onboarding/g, '/dashboard');
    // ensure TM superscript
    h = h.replace(/class="logo">Abando™<\/a>/g,'class="logo">Abando<sup>™</sup></a>')
         .replace(/class="logo">Abando<\/a>/g,'class="logo">Abando<sup>™</sup></a>');
    w(PLAY, h);
  }
}

// ---------- 2) Dashboard: add KPIs, sparkline, and big CTA ----------
{
  let h = r(DASHBOARD);
  if (!h) {
    // Minimal page if missing
    h = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Abando – Dashboard</title>
<link rel="stylesheet" href="/assets/style.css">
</head>
<body>
<nav><div class="container">
  <a href="/" class="logo">Abando<sup>™</sup></a>
  <div class="nav-links">
    <a href="/demo/playground">Demo (Playground)</a>
    <a href="/pricing">Pricing</a>
    <a href="/onboarding">Onboarding</a>
  </div>
</div></nav>

<section class="hero"><div class="container">
  <h1>AI Shopping Copilot — Dashboard</h1>
  <p class="subheadline">Track recoveries, iterate your message, and go live with confidence.</p>
</div></section>

<section class="section"><div class="container">
  <div class="card trial-card">
    <strong>Trial Mode</strong>
    <div class="trial-bar">
      <div class="trial-bar-fill" id="trial-progress"></div>
    </div>
    <div class="trial-meta">
      <span id="trial-progress-label" class="note">0% used</span>
      <span><strong id="trial-days-left">14</strong> days left</span>
    </div>
    <a href="/pricing" data-upgrade class="btn btn-primary">Upgrade plan</a>
  </div>
</div></section>

<section class="section"><div class="container kpi-grid">
  <div class="card kpi"><div class="kpi-title">Recovered revenue</div><div class="kpi-value" id="kpi-rev">$—</div><div id="spark-rev" class="spark"></div></div>
  <div class="card kpi"><div class="kpi-title">Recovered orders</div><div class="kpi-value" id="kpi-ord">—</div><div id="spark-ord" class="spark"></div></div>
  <div class="card kpi"><div class="kpi-title">CTR</div><div class="kpi-value" id="kpi-ctr">—</div><div id="spark-ctr" class="spark"></div></div>
</div></section>

<section class="section"><div class="container">
  <div class="card">
    <h3>Next best actions</h3>
    <ul class="muted">
      <li>Try the “FAQ Reassurance” example in the Playground</li>
      <li>Test a 10% “Discount Nudge” for high AOV items</li>
      <li>Shorten CTA to “Finish your order” and retest</li>
    </ul>
  </div>
</div></section>

<section class="section"><div class="container">
  <div class="card" style="display:flex;align-items:center;justify-content:space-between;gap:.75rem;flex-wrap:wrap">
    <div>
      <h3 style="margin:.2rem 0">Ready to go live?</h3>
      <p class="muted" style="margin:.2rem 0">Connect your store and start recovering carts in under 5 minutes.</p>
    </div>
    <a class="btn btn-primary" href="/onboarding">Onboard now — under 5 minutes</a>
  </div>
</div></section>

<footer class="footer">
  <small>&copy; 2025 Abando<sup>™</sup> · <a href="/legal/terms">Terms</a> · <a href="/legal/privacy">Privacy</a> · <a href="/legal/dpa">DPA</a></small>
</footer>
<script src="/assets/main.js"></script>
</body></html>`;
    w(DASHBOARD, h);
  } else {
    // Patch existing: ensure KPIs + CTA + footer links exist; safe no-op if already present
    let next = h;
    if (!/kpi-grid/.test(next)) {
      next = next.replace(/<\/body>\s*<\/html>/i, `
<section class="section"><div class="container kpi-grid">
  <div class="card kpi"><div class="kpi-title">Recovered revenue</div><div class="kpi-value" id="kpi-rev">$—</div><div id="spark-rev" class="spark"></div></div>
  <div class="card kpi"><div class="kpi-title">Recovered orders</div><div class="kpi-value" id="kpi-ord">—</div><div id="spark-ord" class="spark"></div></div>
  <div class="card kpi"><div class="kpi-title">CTR</div><div class="kpi-value" id="kpi-ctr">—</div><div id="spark-ctr" class="spark"></div></div>
</div></section>

<section class="section"><div class="container">
  <div class="card" style="display:flex;align-items:center;justify-content:space-between;gap:.75rem;flex-wrap:wrap">
    <div>
      <h3 style="margin:.2rem 0">Ready to go live?</h3>
      <p class="muted" style="margin:.2rem 0">Connect your store and start recovering carts in under 5 minutes.</p>
    </div>
    <a class="btn btn-primary" href="/onboarding">Onboard now — under 5 minutes</a>
  </div>
</div></section>

<footer class="footer">
  <small>&copy; 2025 Abando<sup>™</sup> · <a href="/legal/terms">Terms</a> · <a href="/legal/privacy">Privacy</a> · <a href="/legal/dpa">DPA</a></small>
</footer>
<script src="/assets/main.js"></script>
</body></html>`);
    }
    // ensure TM
    next = next.replace(/Abando™/g,'Abando<sup>™</sup>');
    w(DASHBOARD, next);
  }
}

// ---------- 3) CSS bumps for KPIs/sparks ----------
{
  let css = r(CSS);
  const add = `
/* --- Dashboard KPI & spark --- */
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem}
.kpi{display:flex;flex-direction:column;gap:.4rem}
.kpi-title{color:var(--muted);font-size:.9rem}
.kpi-value{font-weight:800;font-size:1.6rem}
.spark{height:44px}
.trial-card{display:grid;gap:.5rem;background:#0b142a;border:1px solid var(--border);border-radius:12px;padding:.9rem}
.trial-bar{height:8px;background:#1f2937;border-radius:999px;overflow:hidden}
.trial-bar-fill{height:8px;width:0;background:var(--primary)}
.trial-meta{display:flex;align-items:center;justify-content:space-between;color:#cbd5e1}
`;
  if (css && !/Dashboard KPI & spark/.test(css)) w(CSS, css + '\n' + add);
}

// ---------- 4) JS: tiny sparkline renderer + KPI demo data ----------
{
  let js = r(MAIN_JS);
  const marker = '/* === dashboard demo charts === */';
  if (js && !js.includes(marker)) {
    js += `
${marker}
(function(){
  function byId(i){return document.getElementById(i)}
  function spark(elId, data){
    const el = byId(elId); if (!el) return;
    const w = el.clientWidth || 220, h = el.clientHeight || 44;
    const max = Math.max(...data, 1); const min = Math.min(...data, 0);
    const xs = data.map((_,i)=> i*(w/(data.length-1||1)));
    const ys = data.map(v => h - ((v-min)/(max-min||1))* (h-6) - 3);
    const path = xs.map((x,i)=> (i?'L':'M')+x.toFixed(1)+','+ys[i].toFixed(1)).join(' ');
    el.innerHTML = '<svg width="'+w+'" height="'+h+'"><path d="'+path+'" fill="none" stroke="currentColor" stroke-width="2" opacity="0.9"/></svg>';
  }
  function rnd(n=7,base=50,spread=30){ return Array.from({length:n},()=> Math.max(1, Math.round(base + (Math.random()*2-1)*spread)))}
  function dollars(n){ return '$'+(n||0).toLocaleString() }
  function pct(n){ return (n||0).toFixed(1)+'%' }

  document.addEventListener('DOMContentLoaded', ()=>{
    // demo numbers
    const rev = rnd(7, 1200, 400); const ord = rnd(7, 14, 6); const ctr = rnd(7, 4, 1.5);
    const sum = rev.reduce((a,b)=>a+b,0);

    const kRev = byId('kpi-rev'); if (kRev) kRev.textContent = dollars(sum);
    const kOrd = byId('kpi-ord'); if (kOrd) kOrd.textContent = ord.reduce((a,b)=>a+b,0);
    const kCtr = byId('kpi-ctr'); if (kCtr) kCtr.textContent = pct(ctr[ctr.length-1]);

    spark('spark-rev', rev);
    spark('spark-ord', ord);
    spark('spark-ctr', ctr);
  });
})();
`;
    w(MAIN_JS, js);
  }
}

// ---------- 5) Legal pages ----------
function baseLegalPage(title, body){
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} – Abando</title>
<link rel="stylesheet" href="/assets/style.css">
</head><body>
<nav><div class="container"><a href="/" class="logo">Abando<sup>™</sup></a></div></nav>
<section class="section"><div class="container"><div class="card">
<h1 style="margin:.2rem 0">${title}</h1>
${body}
</div></div></section>
<footer class="footer"><small>&copy; 2025 Abando<sup>™</sup> · <a href="/legal/terms">Terms</a> · <a href="/legal/privacy">Privacy</a> · <a href="/legal/dpa">DPA</a></small></footer>
<script src="/assets/main.js"></script>
</body></html>`;
}

if (!fs.existsSync(LEGAL_IDX)) {
  const hub = baseLegalPage('Legal', `
<p>Find our legal documents below:</p>
<ul>
  <li><a href="/legal/terms">Terms of Service</a></li>
  <li><a href="/legal/privacy">Privacy Policy</a></li>
  <li><a href="/legal/dpa">Data Processing Addendum (DPA)</a></li>
</ul>
<p class="note">These templates are provided for convenience and do not constitute legal advice. Please review with counsel.</p>
`);
  w(LEGAL_IDX, hub);
}

if (!fs.existsSync(LEGAL_TOS)) {
  const tos = baseLegalPage('Terms of Service', `
<p>Welcome to Abando™. By using our services, you agree to these terms.</p>
<h3>1. Service</h3>
<p>Abando provides an AI-assisted cart recovery tool (“Service”) for ecommerce stores.</p>
<h3>2. Eligibility</h3>
<p>You must have authority to bind your business to these terms.</p>
<h3>3. Acceptable Use</h3>
<p>No illegal, harmful, or deceptive use. No infringement or misrepresentation.</p>
<h3>4. Data & Privacy</h3>
<p>We process data per our <a href="/legal/privacy">Privacy Policy</a> and, if applicable, our <a href="/legal/dpa">DPA</a>.</p>
<h3>5. Fees</h3>
<p>Fees are stated on our pricing page. Trials may be offered at our discretion.</p>
<h3>6. Disclaimers</h3>
<p>Service is provided “as is”. We disclaim warranties to the extent permitted by law.</p>
<h3>7. Liability</h3>
<p>To the maximum extent permitted, Abando’s liability is limited to fees paid in the prior 3 months.</p>
<h3>8. Termination</h3>
<p>You may stop using the Service at any time. We may suspend/terminate for violations.</p>
<h3>9. Changes</h3>
<p>We may update these terms; we’ll post updates here.</p>
<h3>10. Contact</h3>
<p>Questions? Email support@abando.ai</p>
`);
  w(LEGAL_TOS, tos);
}

if (!fs.existsSync(LEGAL_PRIV)) {
  const priv = baseLegalPage('Privacy Policy', `
<p>We respect your privacy. This policy explains how we collect, use, and share information.</p>
<h3>1. Information We Process</h3>
<p>Account and store info, cart and order metadata, and limited end-customer interaction logs for recovery.</p>
<h3>2. How We Use Information</h3>
<p>To provide and improve the Service, security, analytics, and customer support.</p>
<h3>3. Legal Basis</h3>
<p>Performance of contract, legitimate interests, consent where required.</p>
<h3>4. Sharing</h3>
<p>Service providers (e.g., hosting, analytics). We don’t sell personal data.</p>
<h3>5. International Transfers</h3>
<p>We rely on appropriate safeguards where applicable.</p>
<h3>6. Security</h3>
<p>We use reasonable technical and organizational measures.</p>
<h3>7. Your Rights</h3>
<p>Access, correction, deletion, objection, and portability as applicable by law.</p>
<h3>8. Data Retention</h3>
<p>We retain data as needed for the Service and legal obligations.</p>
<h3>9. Contact</h3>
<p>privacy@abando.ai</p>
`);
  w(LEGAL_PRIV, priv);
}

if (!fs.existsSync(LEGAL_DPA)) {
  const dpa = baseLegalPage('Data Processing Addendum (DPA)', `
<p>This DPA forms part of the Agreement between Abando™ (“Processor”) and the customer (“Controller”).</p>
<h3>1. Subject Matter & Duration</h3>
<p>Processing customer personal data solely to provide the Service; duration aligns with the Agreement.</p>
<h3>2. Nature & Purpose</h3>
<p>Hosting, analytics, message generation, and delivery operations for cart recovery.</p>
<h3>3. Roles & Instructions</h3>
<p>Controller instructs Processor to process personal data as necessary to provide the Service.</p>
<h3>4. Sub-processors</h3>
<p>Processor may engage sub-processors under written terms and will maintain a list upon request.</p>
<h3>5. Security</h3>
<p>Processor implements appropriate technical and organizational measures.</p>
<h3>6. International Transfers</h3>
<p>Standard contractual clauses or equivalent safeguards where applicable.</p>
<h3>7. Assistance & Cooperation</h3>
<p>Processor assists with data subject requests and security incidents per law.</p>
<h3>8. Deletion/Return</h3>
<p>Upon termination, Processor deletes or returns personal data unless retention is legally required.</p>
<h3>9. Audits</h3>
<p>Limited audits upon reasonable notice and subject to confidentiality.</p>
<h3>10. Miscellaneous</h3>
<p>This DPA prevails over conflicting terms regarding data protection.</p>
`);
  w(LEGAL_DPA, dpa);
}

// ---------- 6) Add footer links on key pages ----------
[HOME, PRICING, ONBOARD, PLAY].forEach(fp=>{
  let h = r(fp); if (!h) return;
  // add a simple footer if none
  if (!/\/legal\/terms/.test(h)) {
    if (/<footer[\s\S]*<\/footer>/.test(h)) {
      h = h.replace(/<\/footer>/, `<small> · <a href="/legal/terms">Terms</a> · <a href="/legal/privacy">Privacy</a> · <a href="/legal/dpa">DPA</a></small></footer>`);
    } else {
      h = h.replace(/<\/body>\s*<\/html>/i, `<footer class="footer"><small>&copy; 2025 Abando<sup>™</sup> · <a href="/legal/terms">Terms</a> · <a href="/legal/privacy">Privacy</a> · <a href="/legal/dpa">DPA</a></small></footer>\n</body></html>`);
    }
    h = h.replace(/Abando™/g,'Abando<sup>™</sup>');
    w(fp, h);
  }
});

console.log('✅ Dashboard wired to /dashboard, KPIs/spark added, Legal pages created, footers linked.');
