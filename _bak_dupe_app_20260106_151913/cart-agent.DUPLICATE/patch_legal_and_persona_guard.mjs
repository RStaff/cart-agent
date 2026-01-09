import fs from 'node:fs'; import path from 'node:path';
const ROOT=process.cwd();
const PUB = path.join(ROOT,'web','src','public');
const ASSETS = path.join(PUB,'assets');
const CSS = path.join(ASSETS,'style.css');
const MAIN = path.join(ASSETS,'main.js');

const LEGAL_DIR  = path.join(PUB,'legal');
const TOS   = path.join(LEGAL_DIR,'terms','index.html');
const PRIV  = path.join(LEGAL_DIR,'privacy','index.html');
const DPA   = path.join(LEGAL_DIR,'dpa','index.html');
const LEGAL = path.join(LEGAL_DIR,'index.html');

// helpers
const r = p => fs.existsSync(p) ? fs.readFileSync(p,'utf8') : '';
const w = (p,s)=>{ fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,s); console.log('✏️  wrote', p.replace(ROOT+'/','')); };

// ensure a base doc shell
function page(title, body){
  return `<!doctype html><html lang="en"><head>
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

// 1) Ensure files exist
if(!fs.existsSync(LEGAL))  w(LEGAL, page('Legal', `<ul><li><a href="/legal/terms">Terms of Service</a></li><li><a href="/legal/privacy">Privacy Policy</a></li><li><a href="/legal/dpa">Data Processing Addendum (DPA)</a></li></ul>`));
if(!fs.existsSync(TOS))    w(TOS,   page('Terms of Service', `<p>Welcome to Abando™. By using our services, you agree to these terms.</p>`));
if(!fs.existsSync(PRIV))   w(PRIV,  page('Privacy Policy', `<p>This policy describes how we process information.</p>`));
if(!fs.existsSync(DPA))    w(DPA,   page('Data Processing Addendum', `<p>Processor: Abando™. Controller: Customer.</p>`));

// 2) Inject persona/likeness clauses into Terms, plus cross-link in Privacy
(function patchTerms(){
  let h = r(TOS);
  if(!/Persona & Likeness\./.test(h)){
    const clause = `
<h3>Persona &amp; Likeness</h3>
<p>The Service may offer “persona” styles for tone (e.g., “high-energy”, “confident”, “friendly”) to help generate copy. These styles are generic and do not imply endorsement, sponsorship, affiliation, or involvement by any public figure or third party. Customer will not use outputs to impersonate any person or to mislead recipients into believing that a public figure endorses Customer’s products or services.</p>
<h3>User Representations &amp; Liability</h3>
<p>Customer is responsible for its use of generated content and will ensure compliance with applicable laws (including marketing, advertising, and right-of-publicity laws). Customer will not use the Service to violate rights of publicity or to create deceptive or infringing content.</p>`;
    // insert before footer
    h = h.replace(/<\/section>[\s\S]*<\/body>/i, `${clause}\n</section>\n</body>`);
    w(TOS,h);
  }
})();

(function patchPrivacy(){
  let h = r(PRIV);
  if(!/Model Use & Persona Styles/.test(h)){
    const add = `
<h3>Model Use & Persona Styles</h3>
<p>When you choose a persona style, we apply general tone instructions to the model (e.g., “confident” or “friendly”). We do not claim association with any public figure and instruct the model to avoid implying celebrity endorsement. See <a href="/legal/terms">Terms of Service</a> for your responsibilities and restrictions.</p>`;
    h = h.replace(/<\/section>[\s\S]*<\/body>/i, `${add}\n</section>\n</body>`);
    w(PRIV,h);
  }
})();

// 3) Add a tiny in-app disclaimer when a celeb-like persona is active
(function patchMain(){
  let js = r(MAIN);
  const MARK = '/* === persona disclaimer banner === */';
  if(!js.includes(MARK)){
    js += `
${MARK}
(function(){
  const bannerId='persona-disclaimer';
  function ensureBanner(){
    let el=document.getElementById(bannerId);
    if(!el){
      el=document.createElement('div');
      el.id=bannerId;
      el.className='note persona-banner';
      el.style.display='none';
      el.textContent='Style is inspired by a general tone. No affiliation or endorsement is implied.';
      const container=document.querySelector('.container, main, body')||document.body;
      container.prepend(el);
    }
    return el;
  }
  function currentPersona(){
    let p='brand';
    document.querySelectorAll('.persona').forEach(b=>{ if(b.classList.contains('active')) p=b.dataset.persona||p; });
    return p;
  }
  function update(){
    const el=ensureBanner();
    const p=currentPersona();
    const show = p==='kevin' || p==='beyonce' || p==='taylor';
    el.style.display = show ? 'block' : 'none';
  }
  document.addEventListener('click', (e)=>{
    if(e.target && e.target.classList && e.target.classList.contains('persona')) {
      setTimeout(update, 10);
    }
  });
  document.addEventListener('DOMContentLoaded', update);
})();
`;
    w(MAIN,js);
  }

  let css = r(CSS);
  if(css && !/persona-banner/.test(css)){
    css += `
/* persona banner */
.persona-banner{margin:.5rem 0;padding:.5rem .75rem;border:1px dashed var(--border);background:#0b142a;border-radius:8px;color:#cbd5e1;font-size:.9rem}
`;
    w(CSS,css);
  }
})();
