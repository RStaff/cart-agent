import fs from 'node:fs'; import path from 'node:path';
const ROOT = process.cwd();
const PUB  = path.join(ROOT, 'web','src','public');
const ASSETS = path.join(PUB,'assets');
const CSS  = path.join(ASSETS,'style.css');
const ONBD = path.join(PUB,'onboarding','index.html');
const LEGAL_DIR  = path.join(PUB,'legal');
const LEGAL_IDX  = path.join(LEGAL_DIR,'index.html');
const LEGAL_TOS  = path.join(LEGAL_DIR,'terms','index.html');
const LEGAL_PRIV = path.join(LEGAL_DIR,'privacy','index.html');
const LEGAL_DPA  = path.join(LEGAL_DIR,'dpa','index.html');

const w = (p,s)=>{ fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,s); console.log('✏️  wrote', p.replace(ROOT+'/','')); }
const r = (p)=> fs.existsSync(p) ? fs.readFileSync(p,'utf8') : '';

/* ---------- 1) Onboarding page: conversation-first + Pricing CTA ---------- */
{
  let h = r(ONBD);
  if (!h) {
    // minimal page if missing
    h = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Onboarding – Abando</title><link rel="stylesheet" href="/assets/style.css"></head>
<body>
<nav><div class="container"><a href="/" class="logo">Abando<sup>™</sup></a></div></nav>
<section class="section"><div class="container">
  <h1>Get set up in minutes</h1>
  <p class="subheadline">Have a quick conversation with the AI Copilot, then connect your store when you’re ready.</p>
  <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin:.8rem 0">
    <a class="btn btn-primary" href="/demo/playground">Start a conversation</a>
    <a class="btn btn-outline" href="/pricing">See pricing</a>
  </div>
  <div class="card" style="margin-top:1rem">
    <h3>What happens next?</h3>
    <ol class="muted">
      <li>Try a few tones/personas in the Playground.</li>
      <li>Pick a CTA and preview the product card.</li>
      <li>When ready, connect your store to go live.</li>
    </ol>
  </div>
</div></section>
<footer class="footer"><small>&copy; 2025 Abando<sup>™</sup> · <a href="/legal/terms">Terms</a> · <a href="/legal/privacy">Privacy</a> · <a href="/legal/dpa">DPA</a></small></footer>
<script src="/assets/main.js"></script>
</body></html>`;
    w(ONBD, h);
  } else {
    // remove any “Launch Copilot” text/links and replace with conversation + pricing
    let next = h;
    next = next
      .replace(/>(?:Launch|Start)[^<]*Copilot[^<]*</gi, '>Start a conversation<')
      .replace(/href="\/dashboard"/g, 'href="/demo/playground"')
      .replace(/href="\/onboarding"/g, 'href="/demo/playground"');
    // inject a Pricing CTA if not present
    if (!/href="\/pricing"/.test(next)) {
      next = next.replace(/(<a[^>]*>Start a conversation<\/a>)/i,
        `$1\n<a class="btn btn-outline" href="/pricing">See pricing</a>`);
    }
    // ensure TM and footer links
    next = next.replace(/Abando™/g,'Abando<sup>™</sup>');
    if (!/\/legal\/terms/.test(next)) {
      if (/<footer[\s\S]*<\/footer>/.test(next)) {
        next = next.replace(/<\/footer>/, `<small> · <a href="/legal/terms">Terms</a> · <a href="/legal/privacy">Privacy</a> · <a href="/legal/dpa">DPA</a></small></footer>`);
      } else {
        next = next.replace(/<\/body>\s*<\/html>/i, `<footer class="footer"><small>&copy; 2025 Abando<sup>™</sup> · <a href="/legal/terms">Terms</a> · <a href="/legal/privacy">Privacy</a> · <a href="/legal/dpa">DPA</a></small></footer>\n</body></html>`);
      }
    }
    w(ONBD, next);
  }
}

/* ---------- 2) Legal pages (force-create if missing) ---------- */
function page(title, body){
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} – Abando</title>
<link rel="stylesheet" href="/assets/style.css"></head>
<body>
<nav><div class="container"><a href="/" class="logo">Abando<sup>™</sup></a></div></nav>
<section class="section"><div class="container"><div class="card">
<h1 style="margin:.2rem 0">${title}</h1>
${body}
</div></div></section>
<footer class="footer"><small>&copy; 2025 Abando<sup>™</sup> · <a href="/legal/terms">Terms</a> · <a href="/legal/privacy">Privacy</a> · <a href="/legal/dpa">DPA</a></small></footer>
<script src="/assets/main.js"></script>
</body></html>`;
}

const hub = page('Legal', `
<p>Find our legal documents below:</p>
<ul>
  <li><a href="/legal/terms">Terms of Service</a></li>
  <li><a href="/legal/privacy">Privacy Policy</a></li>
  <li><a href="/legal/dpa">Data Processing Addendum (DPA)</a></li>
</ul>
<p class="note">Templates only; not legal advice. Review with counsel.</p>
`);
const tos = page('Terms of Service', `
<p>Welcome to Abando™. By using our services, you agree to these terms.</p>
<h3>1. Service</h3><p>AI-assisted cart recovery for ecommerce stores.</p>
<h3>2. Acceptable Use</h3><p>No illegal, harmful, or infringing use.</p>
<h3>3. Data & Privacy</h3><p>See our <a href="/legal/privacy">Privacy Policy</a> and <a href="/legal/dpa">DPA</a>.</p>
<h3>4. Fees</h3><p>As listed on Pricing; trials at our discretion.</p>
<h3>5. Disclaimers & Liability</h3><p>Service “as is”; liability capped to fees paid in prior 3 months.</p>
<h3>6. Termination & Changes</h3><p>We may update terms; we’ll post updates here.</p>
<h3>7. Contact</h3><p>support@abando.ai</p>
`);
const priv = page('Privacy Policy', `
<h3>1. Data We Process</h3><p>Account/store info, cart & order metadata, limited interaction logs.</p>
<h3>2. Uses</h3><p>Provide/improve Service, security, analytics, support.</p>
<h3>3. Sharing</h3><p>Service providers only; no selling personal data.</p>
<h3>4. Rights</h3><p>Access, correction, deletion, portability where applicable.</p>
<h3>5. Security & Retention</h3><p>Reasonable measures; retain as needed for Service/legal.</p>
<h3>6. Contact</h3><p>privacy@abando.ai</p>
`);
const dpa = page('Data Processing Addendum (DPA)', `
<p>Processor: Abando™. Controller: Customer.</p>
<h3>Scope & Purpose</h3><p>Process personal data solely to provide the Service.</p>
<h3>Security</h3><p>Appropriate technical/organizational measures.</p>
<h3>Sub-processors</h3><p>Engaged under written terms; list available on request.</p>
<h3>Transfers</h3><p>SCCs or equivalent safeguards where required.</p>
<h3>Deletion/Return</h3><p>On termination, delete/return unless law requires retention.</p>
`);

if (!fs.existsSync(LEGAL_IDX)) w(LEGAL_IDX, hub); else if (!r(LEGAL_IDX).trim()) w(LEGAL_IDX, hub);
if (!fs.existsSync(LEGAL_TOS)) w(LEGAL_TOS, tos); else if (!r(LEGAL_TOS).trim()) w(LEGAL_TOS, tos);
if (!fs.existsSync(LEGAL_PRIV)) w(LEGAL_PRIV, priv); else if (!r(LEGAL_PRIV).trim()) w(LEGAL_PRIV, priv);
if (!fs.existsSync(LEGAL_DPA)) w(LEGAL_DPA, dpa); else if (!r(LEGAL_DPA).trim()) w(LEGAL_DPA, dpa);

/* ---------- 3) Tiny CSS nicety for onboarding buttons (optional) ---------- */
{
  let css = r(CSS);
  const add = `
/* --- Onboarding CTAs --- */
.subheadline{color:#cbd5e1}
.btn-outline{border:1px solid var(--border);}
`;
  if (css && !/Onboarding CTAs/.test(css)) w(CSS, css + '\n' + add);
}

console.log('✅ Onboarding → conversation + pricing. Legal pages ensured. Footers linked.');
