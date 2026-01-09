import fs from 'node:fs'; import path from 'node:path';
const ROOT = process.cwd();
const PUB  = path.join(ROOT,'web','src','public');
const LEG  = path.join(PUB,'legal');
const TERMS= path.join(LEG,'terms','index.html');
const PRIV = path.join(LEG,'privacy','index.html');
const DPA  = path.join(LEG,'dpa','index.html');
const HUB  = path.join(LEG,'index.html');
const CSS  = path.join(PUB,'assets','style.css');

const w=(p,s)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s);console.log('✏️  wrote',p.replace(ROOT+'/',''))}
const r=(p)=>fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';

const footerLinks=`&copy; 2025 Abando<sup>™</sup> · <a href="/legal/terms">Terms</a> · <a href="/legal/privacy">Privacy</a> · <a href="/legal/dpa">DPA</a>`;

function page(title, body){
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} – Abando</title>
<link rel="stylesheet" href="/assets/style.css">
</head><body>
<nav><div class="container"><a class="logo" href="/">Abando<sup>™</sup></a></div></nav>
<section class="section"><div class="container"><div class="card">
<h1 style="margin:.2rem 0">${title}</h1>
${body}
</div></div></section>
<footer class="footer"><small>${footerLinks}</small></footer>
<script src="/assets/main.js"></script>
</body></html>`;
}

/* Shared, explicit anti-impersonation section (idempotent via markers) */
const CELEB_SECTION = `
<!-- BEGIN:NO_CELEB_SECTION -->
<h3>No Celebrity Endorsements; Style-Only Tones; No Impersonation</h3>
<p>Abando’s “tone/persona” settings are <strong>generic style descriptors only</strong>. They do not use or claim any celebrity’s
name, image, voice, or likeness, and they do not imply endorsement, sponsorship, or affiliation. The Service is designed
to avoid impersonation and to produce brand-safe, generic messaging.</p>
<p><strong>You agree not to configure or deploy outputs that:</strong> (a) state or suggest that any public figure or brand endorses or
is affiliated with you or your products; (b) use a person’s name, image, voice, or likeness in a manner that violates
applicable <em>right of publicity</em> laws; or (c) create a likelihood of consumer confusion as to endorsement, sponsorship,
or affiliation, including under the <em>U.S. Lanham Act § 43(a)</em> (15 U.S.C. §1125(a)).</p>
<p>For the avoidance of doubt, references to styles like “high-energy comedian” or “empowering pop icon” are provided as
non-attributive stylistic prompts. Abando does not permit, and you will not enable, outputs that name, impersonate, or
otherwise exploit a specific individual’s identity without permission.</p>
<!-- END:NO_CELEB_SECTION -->
`;

/* Terms */
(function(){
  const base = `
<p>Welcome to Abando<sup>™</sup>. By using our services (“Service”), you agree to these Terms.</p>
<h3>1. Service</h3><p>AI-assisted cart recovery messaging and related tools for ecommerce stores.</p>
<h3>2. Acceptable Use</h3><p>No illegal, harmful, infringing, deceptive, or misleading use. You are responsible for the legality of your campaigns.</p>
${CELEB_SECTION}
<h3>3. Privacy & Data</h3><p>Processing per our <a href="/legal/privacy">Privacy Policy</a> and, if applicable, our <a href="/legal/dpa">DPA</a>.</p>
<h3>4. Fees</h3><p>As listed on our Pricing page; trials at our discretion.</p>
<h3>5. Disclaimers; Limitation</h3><p>Service provided “as is”. To the fullest extent permitted by law, our aggregate liability is limited to fees paid to Abando in the 3 months preceding the claim.</p>
<h3>6. Indemnity</h3><p>You will indemnify and hold Abando harmless from third-party claims arising from your use of outputs, including any alleged false endorsement, right-of-publicity, or trademark claims, except to the extent caused by Abando’s willful misconduct.</p>
<h3>7. Changes</h3><p>We may update these Terms by posting a revised version with an updated date.</p>
<h3>8. Contact</h3><p>support@abando.ai</p>
`;
  let html = r(TERMS);
  if (!html) { w(TERMS, page('Terms of Service', base)); return; }
  // idempotently insert/replace the marked celeb section
  if (/BEGIN:NO_CELEB_SECTION[\s\S]*END:NO_CELEB_SECTION/.test(html)){
    html = html.replace(/<!-- BEGIN:NO_CELEB_SECTION[\s\S]*END:NO_CELEB_SECTION -->/m, CELEB_SECTION);
  } else {
    html = html.replace(/(<\/section>)/i, CELEB_SECTION + '$1');
  }
  w(TERMS, html.replace(/Abando™/g,'Abando<sup>™</sup>'));
})();

/* Privacy */
(function(){
  const base = `
<p>This policy explains how we collect, use, and share information when you use Abando<sup>™</sup>.</p>
<h3>1. Data We Process</h3><p>Account/store info, cart & order metadata, and limited interaction logs.</p>
<h3>2. Uses</h3><p>Providing and improving the Service, security, support, and analytics.</p>
<h3>3. Sharing</h3><p>With service providers under appropriate safeguards. We do not sell personal data.</p>
<h3>4. International Transfers</h3><p>We rely on appropriate safeguards where required by law.</p>
<h3>5. Security & Retention</h3><p>Reasonable technical/organizational measures. We retain data as needed for the Service and legal compliance.</p>
<h3>6. Your Rights</h3><p>Depending on your location, you may have rights to access, correct, delete, or port your data, and to object or restrict certain processing.</p>
<h3>7. Contact</h3><p>privacy@abando.ai</p>
${CELEB_SECTION}
<p class="note">This policy does not constitute legal advice. You are responsible for your use of any outputs.</p>
`;
  let html = r(PRIV);
  if (!html) { w(PRIV, page('Privacy Policy', base)); return; }
  if (/BEGIN:NO_CELEB_SECTION[\s\S]*END:NO_CELEB_SECTION/.test(html)){
    html = html.replace(/<!-- BEGIN:NO_CELEB_SECTION[\s\S]*END:NO_CELEB_SECTION -->/m, CELEB_SECTION);
  } else {
    html = html.replace(/(<\/section>)/i, CELEB_SECTION + '$1');
  }
  w(PRIV, html.replace(/Abando™/g,'Abando<sup>™</sup>'));
})();

/* DPA */
(function(){
  const base = `
<p>This Data Processing Addendum (“DPA”) forms part of the Agreement between Abando (“Processor”) and the customer (“Controller”).</p>
<h3>1. Subject Matter & Duration</h3><p>Processing customer personal data solely to provide the Service, for the Agreement’s duration.</p>
<h3>2. Nature & Purpose</h3><p>Hosting, analytics, message generation, delivery operations, and support.</p>
<h3>3. Roles & Instructions</h3><p>Processor processes personal data per Controller’s documented instructions and the Agreement.</p>
<h3>4. Sub-processors</h3><p>Processor may engage sub-processors under written terms; list available on request.</p>
<h3>5. Security</h3><p>Appropriate technical and organizational measures to protect personal data.</p>
<h3>6. International Transfers</h3><p>Standard Contractual Clauses (SCCs) or equivalent safeguards where required.</p>
<h3>7. Assistance</h3><p>Processor assists with data subject requests, DPIAs, and incident notifications as required by law.</p>
<h3>8. Deletion/Return</h3><p>Upon termination, Processor deletes or returns personal data unless retention is legally required.</p>
<h3>9. Audits</h3><p>Reasonable audits on notice, subject to confidentiality and scope limits.</p>
${CELEB_SECTION}
`;
  let html = r(DPA);
  if (!html) { w(DPA, page('Data Processing Addendum (DPA)', base)); return; }
  if (/BEGIN:NO_CELEB_SECTION[\s\S]*END:NO_CELEB_SECTION/.test(html)){
    html = html.replace(/<!-- BEGIN:NO_CELEB_SECTION[\s\S]*END:NO_CELEB_SECTION -->/m, CELEB_SECTION);
  } else {
    html = html.replace(/(<\/section>)/i, CELEB_SECTION + '$1');
  }
  w(DPA, html.replace(/Abando™/g,'Abando<sup>™</sup>'));
})();

/* Legal hub */
(function(){
  const hub = page('Legal', `
<p>Find our legal documents below:</p>
<ul>
  <li><a href="/legal/terms">Terms of Service</a></li>
  <li><a href="/legal/privacy">Privacy Policy</a></li>
  <li><a href="/legal/dpa">Data Processing Addendum (DPA)</a></li>
</ul>
<p class="note">Templates are for informational purposes only and are not legal advice. Please review with your counsel.</p>
`);
  w(HUB, hub);
})();

/* Small CSS nicety (only once) */
(function(){
  const css = r(CSS);
  if (css && !/Legal niceties/.test(css)) {
    const add = `
/* Legal niceties */
.card h3{margin:.6rem 0 .3rem}
.card p{margin:.35rem 0}
.card .note{color:#9ca3af}
`;
    w(CSS, css + '\n' + add);
  }
})();
console.log('✅ Legal pages ensured/updated with No-Celebrity section + footer links.');
