/* Abando – Playground: Personas + Product Preview (idempotent) */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = process.cwd();
const PUB  = path.join(ROOT, 'web', 'src', 'public');
const MAIN = path.join(PUB, 'assets', 'main.js');
const CSS  = path.join(PUB, 'assets', 'style.css');
const PLAY = path.join(PUB, 'demo', 'playground', 'index.html');

const ensure = (p)=>fs.mkdirSync(p,{recursive:true});
const exists = (p)=>fs.existsSync(p);

// ---- 1) CSS additions (tiny & safe) ----
const cssAdd = `
/* --- Personas + product preview (addon) --- */
.product-card{display:flex;gap:.75rem;align-items:flex-start;background:#0b142a;
  border:1px solid var(--border);border-radius:12px;padding:.75rem;margin:.5rem 0}
.product-card img{width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid #1f2937;background:#0b1020}
.product-meta{display:flex;flex-direction:column}
.product-meta .name{font-weight:800}
.product-meta .price{color:#a0aec0;font-weight:700}
.persona-pills{display:flex;flex-wrap:wrap;gap:.4rem;margin:.5rem 0}
.persona{border:1px dashed var(--border);color:var(--muted);padding:.35rem .55rem;border-radius:999px;cursor:pointer}
.persona.active,.persona:hover{border-style:solid;color:#fff}
.preview-bubble{background:#1f2937;color:#fff;border-radius:12px;padding:.8rem}
.preview-wrap{display:grid;grid-template-columns:120px 1fr;gap:.75rem}
.preview-avatar{width:48px;height:48px;border-radius:999px;background:#111826;display:flex;align-items:center;justify-content:center;font-weight:800}
`;

if (!exists(CSS)) ensure(path.dirname(CSS));
const cssNow = exists(CSS) ? fs.readFileSync(CSS,'utf8') : '';
if (!cssNow.includes('/* --- Personas + product preview (addon) --- */')) {
  fs.writeFileSync(CSS, cssNow + '\n' + cssAdd);
  console.log('✓ appended CSS');
} else { console.log('• CSS already patched'); }

// ---- 2) JS additions: personas + product rendering ----
const jsAdd = `
/* Personas + product preview (addon) */
(function(){
  const personaStyles = {
    brand: (msg)=>msg, // pass-through
    kevin: (msg)=>"Yo! 😂 " + msg.replace(/\\.$/,'!') + " Let’s get you hooked up—real quick.",
    beyonce: (msg)=>"✨ " + msg + " You deserve a flawless checkout—ready when you are.",
    taylor: (msg)=>"Hey! 🧣 " + msg + " We’ll make this easy—no bad blood with returns."
  };
  function personaWrap(kind, base){
    const fn = personaStyles[kind] || personaStyles.brand;
    return fn(base);
  }
  function q(id){ return document.getElementById(id); }

  function wirePersonaAndProduct(){
    // *Inputs*
    const productUrl = q('product-url');
    const productName= q('product-name');
    const productPrice=q('product-price');

    const tone=q('tone'), channel=q('channel'), offer=q('offer'), cta=q('cta');
    const run=q('generate'), copy=q('copy'), preview=q('preview-message');
    const personaButtons = document.querySelectorAll('.persona');
    const imgEl = q('product-img'), nameEl=q('product-name-out'), priceEl=q('product-price-out');
    const avatar=q('preview-avatar');

    if(!preview) return;

    let persona = 'brand'; // default

    personaButtons.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        personaButtons.forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        persona = btn.getAttribute('data-persona') || 'brand';
        build(); // re-render
      });
    });

    function build(){
      // Avatar hint (first letter for brand; emoji for personas)
      avatar.textContent = persona==='brand' ? 'A' : (persona==='kevin'?'😄':persona==='beyonce'?'✨':'🧣');

      // Product card reflect inputs
      const url = (productUrl?.value||'').trim();
      imgEl.src = url || imgEl.getAttribute('data-fallback');
      nameEl.textContent = (productName?.value||'Essentials Hoodie (Black, M)');
      priceEl.textContent = productPrice?.value ? ('$'+Number(productPrice.value).toFixed(2)) : '$68.00';

      // Base message
      let msg = (tone?.value==='professional'?'Hello,':'Hey there,') + " I’m your Shopping Copilot. ";
      msg += "We noticed you left " + (nameEl.textContent||'an item') + " in your cart. ";
      if (offer?.value?.trim()) msg += "Here’s an offer: " + offer.value.trim() + ". ";
      msg += "I can answer questions on " + (channel?.value||'email') + " and help you complete your purchase.";
      msg += "\\n\\n" + (cta?.value?.trim() || 'Finish your order') + " →";

      // Persona flavor
      preview.textContent = personaWrap(persona, msg);
    }

    function copyMsg(){
      navigator.clipboard.writeText(preview.textContent||'').then(()=> {
        let t=document.getElementById('toast'); if(!t){ t=document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
        t.textContent='Copied'; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 1200);
      });
    }

    // Bindings
    [productUrl, productName, productPrice, tone, channel, offer, cta].forEach(el=> el && el.addEventListener('input', build));
    run && run.addEventListener('click', build);
    copy && copy.addEventListener('click', copyMsg);

    // Initial paint
    build();
  }

  document.addEventListener('DOMContentLoaded', wirePersonaAndProduct);
})();
`;

if (!exists(MAIN)) ensure(path.dirname(MAIN));
const jsNow = exists(MAIN) ? fs.readFileSync(MAIN,'utf8') : '';
if (!jsNow.includes('/* Personas + product preview (addon) */')) {
  fs.writeFileSync(MAIN, jsNow + '\n' + jsAdd);
  console.log('✓ appended JS');
} else { console.log('• JS already patched'); }

// ---- 3) Patch Playground HTML to add fields + persona UI ----
function patchHTML(html){
  if (/id="product-url"/.test(html) && html.includes('persona-pills')) {
    return html; // already patched
  }
  // Insert product inputs above message controls (simple, robust replace)
  html = html.replace(
    /<div class="card">\s*<h2[^>]*>Message Setup<\/h2>/,
    `$&
    <div class="persona-pills">
      <button class="persona active" data-persona="brand">Brand voice</button>
      <button class="persona" data-persona="kevin">Kevin Hart tone</button>
      <button class="persona" data-persona="beyonce">Beyoncé tone</button>
      <button class="persona" data-persona="taylor">Taylor Swift tone</button>
    </div>
    <div class="row" style="margin-top:.5rem">
      <label class="col">Product image URL
        <input id="product-url" class="input" placeholder="https://.../product.jpg">
        <div class="help">Optional. Leave blank to use a neutral placeholder.</div>
      </label>
      <label class="col">Product name
        <input id="product-name" class="input" placeholder="Essentials Hoodie (Black, M)">
      </label>
      <label class="col" style="max-width:160px">Price
        <input id="product-price" class="input" type="number" min="0" step="0.01" placeholder="68.00">
      </label>
    </div>`
  );

  // Replace simple preview with avatar + product card + bubble
  html = html.replace(
    /<h3>Preview<\/h3>\s*<p id="preview-message"[^>]*>[^<]*<\/p>/,
    `<h3>Preview</h3>
     <div class="preview-wrap">
       <div id="preview-avatar" class="preview-avatar">A</div>
       <div>
         <div class="product-card">
           <img id="product-img" data-fallback="https://dummyimage.com/320x320/0b1020/ffffff&text=Item" alt="">
           <div class="product-meta">
             <span class="name" id="product-name-out">Essentials Hoodie (Black, M)</span>
             <span class="price" id="product-price-out">$68.00</span>
           </div>
         </div>
         <div class="preview-bubble">
           <p id="preview-message" style="white-space:pre-wrap;margin:0">Your message will appear here.</p>
         </div>
       </div>
     </div>`
  );

  // Ensure TM is small (just in case)
  html = html.replace(/class="logo">Abando™<\/a>/g,'class="logo">Abando<sup>™</sup></a>');
  // Ensure main.js present
  if (!/\/assets\/main\.js/.test(html)) {
    html = html.replace(/<\/body>\s*<\/html>/i, `<script src="/assets/main.js"></script>\n</body></html>`);
  }
  return html;
}

if (!exists(PLAY)) throw new Error('Playground file not found: ' + PLAY);
const orig = fs.readFileSync(PLAY,'utf8');
const next = patchHTML(orig);
if (next !== orig) {
  fs.writeFileSync(PLAY, next);
  console.log('✓ patched Playground HTML');
} else {
  console.log('• Playground already has personas & product preview');
}

console.log('✅ Personas + product preview applied.');
