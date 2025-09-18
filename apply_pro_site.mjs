import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.env.HOME + '/projects/cart-agent';
const PUB = path.join(ROOT, 'web', 'src', 'public');

const ensure = (p) => fs.mkdirSync(p, { recursive: true });
const write = (rel, txt) => {
  const fp = path.join(PUB, ...rel.split('/'));
  ensure(path.dirname(fp));
  fs.writeFileSync(fp, txt);
  console.log('Wrote', rel);
};

/* --------- STYLE (dark, conversion-focused) ---------- */
const css = `
:root{
  --primary:#3b82f6; --primary-hover:#265fd5;
  --bg:#0e121f; --card:#161d31; --border:#2d3748;
  --text:#ffffff; --muted:#a0aec0;
  --bot:#1f2937; --user:#19a463;
  --light-bot:#f3f4f6; --light-user:#e1f3e8; --light-text:#0f172a;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.container{width:90%;max-width:1140px;margin:0 auto}
nav{padding:16px 0}
nav .container{display:flex;justify-content:space-between;align-items:center}
nav a{color:var(--text);text-decoration:none;font-weight:500;margin-left:16px}
nav a.logo{margin-left:0;font-size:24px;font-weight:800}
nav .nav-links{display:flex;gap:16px}
nav .nav-links a.active{border-bottom:2px solid var(--primary)}
.hero{display:flex;flex-wrap:wrap;align-items:center;gap:24px;padding:64px 0}
.hero h1{margin:0 0 12px;font-size:42px;line-height:1.2}
.hero .sub{color:var(--muted);max-width:640px;margin:0 0 16px}
.buttons{display:flex;gap:12px;flex-wrap:wrap}
.badge{display:inline-block;background:var(--primary);color:#fff;
  padding:4px 8px;border-radius:4px;font-size:12px;margin-bottom:8px}
.btn{display:inline-block;padding:12px 18px;border-radius:6px;font-weight:700;
  cursor:pointer;text-decoration:none;border:1px solid transparent}
.btn-primary{background:var(--primary);color:#fff}
.btn-primary:hover{background:var(--primary-hover)}
.btn-secondary{background:transparent;color:var(--primary);border-color:var(--primary)}
.btn-secondary:hover{background:var(--primary);color:#fff}
.features{display:flex;flex-wrap:wrap;gap:16px;padding:40px 0}
.card{flex:1 1 calc(50% - 8px);min-width:260px;background:var(--card);
  border:1px solid var(--border);border-radius:10px;padding:16px}
.card h3{margin:0 0 6px;color:var(--primary)}
.card p{margin:0;color:var(--muted)}
.chat{border:1px solid var(--border);border-radius:10px;padding:16px;max-width:420px}
.chat.dark{background:#111827}
.chat.light{background:var(--light-bot);color:var(--light-text);border-color:#d1d5db}
.bubble{border-radius:10px;padding:10px 12px;margin:6px 0;max-width:80%}
.dark .bot{background:#1f2937;color:#fff}
.dark .user{background:var(--user);color:#fff;margin-left:auto}
.light .bot{background:var(--light-bot);color:var(--light-text)}
.light .user{background:var(--light-user);color:var(--light-text);margin-left:auto}
.note{font-size:12px;color:var(--muted)}
.pricing{padding:56px 0}
.pricing .sub{color:var(--muted);margin:8px 0 24px}
.price-row{display:flex;flex-wrap:wrap;gap:16px;justify-content:center}
.price{background:var(--card);border:1px solid var(--border);border-radius:10px;
  padding:24px;flex:1 1 300px;max-width:340px;display:flex;flex-direction:column}
.price h3{margin:0 0 6px;color:var(--primary)}
.price .num{font-size:32px;color:var(--primary);margin:10px 0}
.price ul{list-style:none;padding:0;margin:0 0 16px;color:var(--muted)}
.price ul li{margin:6px 0}
.footer{border-top:1px solid var(--border);text-align:center;color:var(--muted);padding:16px 0;margin-top:40px}
@media(max-width:600px){.hero h1{font-size:32px}}
`;

/* --------- CLIENT JS (pricing + playground) ---------- */
const js = `
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-plan]').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      const plan = btn.getAttribute('data-plan');
      try{
        const r = await fetch('/api/billing/checkout',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({plan})
        });
        const d = await r.json();
        if(d.url) window.location.href=d.url;
        else alert('Unable to start checkout');
      }catch(e){ alert('Error. Please try again.'); }
    });
  });
  const tone=document.getElementById('tone');
  const channel=document.getElementById('channel');
  const offer=document.getElementById('offer');
  const cta=document.getElementById('cta');
  const out=document.getElementById('preview');
  const gen=document.getElementById('generate');
  const copy=document.getElementById('copy');
  if(gen && out){
    const build=()=>{
      let m=(tone?.value==='professional'?'Hello,':'Hey there,')+' ';
      m+='we noticed you left items in your cart. ';
      if(offer?.value.trim()) m+='Here is an offer: '+offer.value.trim()+'. ';
      m+='We can answer questions on '+(channel?.value||'email')+'. ';
      m+='\n\n'+(cta?.value.trim()||'Finish your order')+' ->';
      out.textContent=m;
    };
    gen.addEventListener('click',build);
    [tone,channel,offer,cta].forEach(el=>el&&el.addEventListener('input',build));
    copy?.addEventListener('click',()=>navigator.clipboard.writeText(out.textContent||''));
  }
});
`;

/* --------- PAGES ---------- */
const head = (title) => `
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title><link rel="stylesheet" href="/assets/style.css">
`;

const nav = (active='') => `
<nav><div class="container">
  <a href="/" class="logo">Abando</a>
  <div class="nav-links">
    <a href="/demo"${active==='demo'?' class="active"':''}>Demo</a>
    <a href="/pricing"${active==='pricing'?' class="active"':''}>Pricing</a>
    <a href="/onboarding"${active==='onb'?' class="active"':''}>Onboarding</a>
  </div>
</div></nav>
`;

const home = `<!DOCTYPE html><html lang="en"><head>${head('Abando – AI Cart Recovery')}</head>
<body>
${nav()}
<header class="hero"><div class="container">
  <div style="max-width:620px">
    <span class="badge">New • 14-day free trial</span>
    <h1>Recover more checkouts with an AI cart co-pilot</h1>
    <p class="sub subheadline">Abando answers questions, handles objections, and guides buyers through checkout so abandonment turns into orders.</p>
    <div class="buttons">
      <a class="btn btn-primary" href="/onboarding">Start Free Trial</a>
      <a class="btn btn-secondary" href="/demo">Try the demo</a>
    </div>
    <p class="note">Pays for itself after a single recovered cart.</p>
  </div>
  <div>
    <div class="chat dark">
      <div class="bubble bot">Hi! I can answer questions and guide you to checkout.</div>
      <div class="bubble user">Do you have free returns?</div>
      <div class="bubble bot">Yes — 30 days, no questions asked. Ready to checkout?</div>
    </div>
    <p class="note">This is a preview. Click “Try the demo”.</p>
  </div>
</div></header>
<section class="features container">
  <div class="card"><h3>Answers that convert</h3><p>Resolve shipping, sizing and returns before customers leave.</p></div>
  <div class="card"><h3>Guided checkout</h3><p>Collect only what’s needed and hand off to Stripe/Shopify.</p></div>
  <div class="card"><h3>Playbooks</h3><p>Proven objection-handling flows you can toggle.</p></div>
  <div class="card"><h3>Analytics</h3><p>See recovered carts and the moments that mattered.</p></div>
</section>
<footer class="footer"><small>&copy; 2025 Abando</small></footer>
</body></html>`;

const demo = `<!DOCTYPE html><html lang="en"><head>${head('Abando – Demo')}</head>
<body>
${nav('demo')}
<header class="hero"><div class="container">
  <div style="max-width:620px">
    <h1>Experience Abando in action</h1>
    <p class="sub">See how our AI cart co-pilot handles questions and guides to checkout.</p>
    <div class="buttons">
      <a class="btn btn-secondary" href="/demo/light/">See light demo</a>
      <a class="btn btn-primary" href="/pricing">View pricing</a>
    </div>
  </div>
</div></header>
<section class="container">
  <h3 style="color:var(--primary)">Dark demo</h3>
  <div class="chat dark">
    <div class="bubble bot">Hi! I can answer questions and guide you to checkout.</div>
    <div class="bubble user">Do you have free returns?</div>
    <div class="bubble bot">Yes — 30 days, no questions asked. Ready to checkout?</div>
  </div>
  <p class="note">Preview of dark interface. Use the button above for a light version.</p>
</section>
<footer class="footer"><small>&copy; 2025 Abando</small></footer>
</body></html>`;

const demoLight = `<!DOCTYPE html><html lang="en"><head>${head('Abando – Light Demo')}</head>
<body>
${nav()}
<header class="hero"><div class="container">
  <div style="max-width:620px">
    <h1>Light demo</h1>
    <p class="sub">See how our chat looks in a light interface.</p>
    <div class="buttons">
      <a class="btn btn-secondary" href="/demo">Back to dark demo</a>
      <a class="btn btn-primary" href="/pricing">View pricing</a>
    </div>
  </div>
</div></header>
<section class="container">
  <div class="chat light">
    <div class="bubble bot">Hi! I can answer questions and guide you to checkout.</div>
    <div class="bubble user">Do you have free returns?</div>
    <div class="bubble bot">Yes — 30 days, no questions asked. Ready to checkout?</div>
  </div>
</section>
<footer class="footer"><small>&copy; 2025 Abando</small></footer>
</body></html>`;

const playground = `<!DOCTYPE html><html lang="en"><head>${head('Abando – Playground')}</head>
<body>
${nav()}
<header class="hero"><div class="container">
  <div style="max-width:620px">
    <h1>Customize your recovery message</h1>
    <p class="sub">Pick tone, channel, and offers. Copy the output.</p>
  </div>
</div></header>
<section class="container" style="display:grid;gap:16px;grid-template-columns:1fr 1fr">
  <div class="card">
    <label>Tone<br><select id="tone"><option value="friendly">Friendly</option><option value="professional">Professional</option><option value="casual">Casual</option></select></label><br><br>
    <label>Channel<br><select id="channel"><option value="email">Email</option><option value="sms">SMS</option><option value="on-site">On-site</option></select></label><br><br>
    <label>Offer (optional)<br><input id="offer" placeholder="10% off shipping"></label><br><br>
    <label>Call to action text<br><input id="cta" placeholder="Complete your order"></label><br><br>
    <button id="generate" class="btn btn-primary">Generate message</button>
  </div>
  <div class="card">
    <h3>Preview</h3>
    <pre id="preview" style="white-space:pre-wrap;min-height:120px"></pre>
    <button id="copy" class="btn btn-secondary">Copy message</button>
  </div>
</section>
<section class="container">
  <div class="card">
    <h3>Glossary</h3>
    <ul>
      <li><strong>CTA</strong>: Call to Action.</li>
      <li><strong>ROI</strong>: Return on Investment.</li>
      <li><strong>AOV</strong>: Average Order Value.</li>
      <li><strong>LTV</strong>: Lifetime Value.</li>
      <li><strong>CTR</strong>: Click-through Rate.</li>
      <li><strong>FAQ</strong>: Frequently Asked Questions.</li>
    </ul>
  </div>
</section>
<section class="container" style="text-align:center;margin:24px 0">
  <a class="btn btn-primary" href="/pricing">View pricing and plans</a>
</section>
<footer class="footer"><small>&copy; 2025 Abando</small></footer>
<script src="/assets/main.js"></script>
</body></html>`;

const pricing = `<!DOCTYPE html><html lang="en"><head>${head('Abando – Pricing')}</head>
<body>
${nav('pricing')}
<section class="pricing container">
  <h1>Choose your plan</h1>
  <p class="sub">Pays for itself after a single recovered cart. 14-day free trial. Cancel anytime.</p>
  <div class="price-row">
    <div class="price">
      <h3>Starter</h3>
      <div class="num">$59.99/mo</div>
      <ul><li>Core conversion agent</li><li>Email support</li></ul>
      <button class="btn btn-primary" data-plan="starter">Start Free Trial</button>
    </div>
    <div class="price">
      <h3>Pro</h3>
      <div class="num">$149.99/mo</div>
      <ul><li>All Starter features</li><li>Advanced playbooks & integrations</li><li>Priority support</li></ul>
      <button class="btn btn-primary" data-plan="pro">Start Free Trial</button>
    </div>
  </div>
</section>
<footer class="footer"><small>&copy; 2025 Abando</small></footer>
<script src="/assets/main.js"></script>
</body></html>`;

const onboarding = `<!DOCTYPE html><html lang="en"><head>${head('Abando – Onboarding')}</head>
<body>
${nav('onb')}
<header class="hero"><div class="container">
  <div style="max-width:620px">
    <h1>Welcome to Abando</h1>
    <p class="sub">Connect your store, customize messaging, and go live.</p>
  </div>
</div></header>
<section class="features container">
  <div class="card"><h3>Connect your store</h3><p>Link Shopify or your checkout. Share Stripe key to create recovery sessions.</p></div>
  <div class="card"><h3>Customize messaging</h3><p>Set tone, choose channels, add optional offers.</p></div>
  <div class="card"><h3>Go live</h3><p>Activate flows and monitor results in your dashboard.</p></div>
</section>
<section class="container" style="text-align:center;margin:24px 0">
  <a class="btn btn-primary" href="/dashboard">Go to dashboard</a>
</section>
<footer class="footer"><small>&copy; 2025 Abando</small></footer>
</body></html>`;

/* --------- WRITE FILES ---------- */
write('assets/style.css', css);
write('assets/main.js', js);
write('index.html', home);
write('demo/index.html', demo);
write('demo/light/index.html', demoLight);
write('demo/playground/index.html', playground);
write('pricing/index.html', pricing);
write('onboarding/index.html', onboarding);

console.log('Done: professional pages written.');
