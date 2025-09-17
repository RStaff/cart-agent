/**
 * Demo Playground (no external APIs)
 *  - GET /demo                -> 302 to /demo/playground
 *  - GET /demo/playground     -> interactive UI
 */
export function installPlayground(app) {
  app.get("/demo", (_req, res) => res.redirect(302, "/demo/playground"));

  app.get("/demo/playground", (_req, res) => {
    const html = `<!doctype html><html lang="en">
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Abando Playground – Try it live</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:#0b0b0c;color:#f2f2f2;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.wrap{max-width:1100px;margin:0 auto;padding:32px 18px}
h1{font-size:clamp(26px,4.8vw,40px);margin:0 0 10px}
.lead{opacity:.9;line-height:1.6;margin:0 0 18px}
.grid{display:grid;grid-template-columns: 360px 1fr;gap:16px}
@media (max-width:960px){.grid{grid-template-columns: 1fr}}
.card{background:#121214;border:1px solid #222;border-radius:16px;padding:16px}
.row{display:flex;gap:8px;flex-wrap:wrap}
label{display:block;font-size:12px;opacity:.75;margin:8px 0 4px}
input,select,button,textarea{font:inherit}
input[type=text],input[type=number],select,textarea{width:100%;padding:10px;border-radius:10px;border:1px solid #333;background:#0e0e10;color:#f2f2f2}
textarea{min-height:80px;resize:vertical}
small{opacity:.65}
.kv{display:grid;grid-template-columns:120px 1fr;gap:6px;margin:8px 0}
.preview{background:#0f0f11;border:1px solid #222;border-radius:12px;padding:14px;min-height:220px;white-space:pre-wrap;line-height:1.55}
.badge{display:inline-block;font-size:12px;padding:4px 8px;border-radius:999px;background:#0f0f11;border:1px solid #333;margin-right:6px}
.cta{display:inline-block;padding:10px 14px;border-radius:10px;background:#5b8cff;color:#0b0b0c;font-weight:800;text-decoration:none;border:0;cursor:pointer}
.ghost{display:inline-block;padding:10px 14px;border-radius:10px;background:#0f0f11;border:1px solid #333;color:#f2f2f2;text-decoration:none;cursor:pointer}
hr{border:0;border-top:1px solid #222;margin:14px 0}
footer{opacity:.6;font-size:13px;margin-top:20px}
.code{font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;background:#0e0e10;border:1px solid #222;border-radius:8px;padding:8px}
</style>
<body><div class="wrap">
  <h1>Abando Playground</h1>
  <p class="lead">Shape the recovery message you'll send when a shopper leaves. Switch tone, channel, offer, timing, and see A/B variants instantly.</p>

  <div class="grid">
    <div class="card" id="controls">
      <div class="row">
        <span class="badge">1</span><b>Audience & Context</b>
      </div>
      <label>First name (optional)</label>
      <input id="firstName" type="text" placeholder="Alex">

      <label>Product name (optional)</label>
      <input id="productName" type="text" placeholder="Soft Touch Hoodie">

      <label>Checkout URL (optional)</label>
      <input id="checkoutUrl" type="text" placeholder="https://yourstore.com/checkout?token=...">

      <hr>
      <div class="row">
        <span class="badge">2</span><b>Message Style</b>
      </div>
      <label>Tone</label>
      <select id="tone">
        <option>Friendly</option>
        <option>Direct</option>
        <option>Playful</option>
        <option>Luxury</option>
        <option>Urgent</option>
        <option>Minimal</option>
      </select>

      <label>Channel</label>
      <select id="channel">
        <option>Email</option>
        <option>SMS</option>
        <option>On-site nudge</option>
      </select>

      <label>Length</label>
      <select id="length">
        <option>Short</option>
        <option selected>Standard</option>
        <option>Long</option>
      </select>

      <label>CTA label</label>
      <input id="ctaLabel" type="text" value="Resume checkout">

      <div class="row" style="margin-top:8px">
        <label><input type="checkbox" id="tokName" checked> Include {{first_name}}</label>
        <label><input type="checkbox" id="tokProd" checked> Include {{product_name}}</label>
        <label><input type="checkbox" id="tokUrl" checked> Include {{checkout_url}}</label>
        <label><input type="checkbox" id="tokDisc"> Include {{discount_code}}</label>
      </div>

      <hr>
      <div class="row">
        <span class="badge">3</span><b>Offer & Cadence</b>
      </div>
      <label>Offer</label>
      <select id="offer">
        <option>None</option>
        <option>Free shipping</option>
        <option>10% off</option>
        <option>$10 off</option>
      </select>

      <label>Send timing</label>
      <select id="timing">
        <option>15 minutes</option>
        <option>4 hours</option>
        <option>24 hours</option>
      </select>

      <label>Language</label>
      <select id="lang">
        <option value="en" selected>English</option>
        <option value="es">Español (beta)</option>
        <option value="fr">Français (beta)</option>
      </select>

      <hr>
      <div class="row">
        <span class="badge">4</span><b>ROI quick calc</b>
      </div>
      <div class="kv"><small>Avg order value</small> <input id="aov" type="number" min="1" value="80"></div>
      <div class="kv"><small>Monthly sessions</small> <input id="sessions" type="number" min="100" value="25000"></div>
      <div class="kv"><small>Abandon rate (%)</small> <input id="aband" type="number" min="10" max="99" value="70"></div>
      <div class="kv"><small>Recovery rate (est.)</small> <input id="recovery" type="number" min="0.1" max="20" step="0.1" value="3.0"></div>
      <div class="row" style="margin-top:8px">
        <button class="ghost" id="calcBtn" type="button">Estimate revenue</button>
        <div id="calcOut" class="small" style="margin-left:8px;opacity:.8"></div>
      </div>

      <hr>
      <div class="row" style="justify-content:space-between">
        <button class="cta" id="genBtn" type="button">Update preview</button>
        <button class="ghost" id="abBtn" type="button">Create A/B Variant</button>
        <button class="ghost" id="shareBtn" type="button">Share preview link</button>
      </div>
    </div>

    <div class="card" id="previewPane">
      <div class="row" style="justify-content:space-between;align-items:center">
        <b>Preview</b>
        <div><span class="badge" id="badgeTone">Friendly</span><span class="badge" id="badgeChannel">Email</span><span class="badge" id="badgeOffer">No offer</span></div>
      </div>
      <div id="preview" class="preview"></div>
      <hr>
      <b>Variant B</b>
      <div id="previewB" class="preview" style="opacity:.9"></div>
      <hr>
      <div class="small">Webhook sample (cart recovered):</div>
      <pre class="code" id="hook">{ "event":"cart.recovered", "order_value": 128.00, "currency":"USD", "email":"alex@example.com" }</pre>
    </div>
  </div>

  <footer>© <span id="y"></span> Abando™</footer>
</div>

<script>
// --- tiny "copywriter" engine (deterministic) ---
function toneWrap(text, tone){
  const tweaks={
    Friendly:[["Hi","Hey"],["We noticed","We saw"],["complete","wrap up"]],
    Direct:[["Hi",""],["We noticed","You left"],["please",""]],
    Playful:[["Hi","Psst"],["We noticed","We peeked at your cart—"],["complete","finish up"]],
    Luxury:[["Hi","Greetings"],["deal","offer"],["save","benefit"]],
    Urgent:[["Hi","Heads up"],["We noticed","Time-sensitive:"],["soon","today"]],
    Minimal:[["Hi",""],["We noticed","Reminder:"],["Please",""]]
  }[tone]||[];
  let out=text;
  for(const [a,b] of tweaks){ out=out.replaceAll(a,b); }
  return out;
}
function byChannel(base, ch, cta){
  if(ch==="SMS"){
    const s = base.replace(/\n+/g," ").slice(0,240);
    return s + (cta?(" Reply STOP to opt out. \n"+cta):"");
  }
  if(ch==="On-site nudge"){
    return base.split("\n").slice(0,2).join(" ") + (cta?("\\n[ "+cta+" ]"):"");
  }
  return base + (cta?("\n\n→ "+cta):"");
}
function offerLine(offer){
  if(offer==="None") return "";
  if(offer==="Free shipping") return "We’ll cover shipping—no code needed.";
  if(offer==="10% off") return "Use code SAVE10 at checkout.";
  if(offer==="$10 off") return "Use code TAKE10 at checkout.";
  return "";
}
function timingLine(timing){ return `We’ll hold your cart for ${timing}.`; }
function tokens(s, cfg){
  s = s.replaceAll("{{first_name}}", cfg.firstName || "there");
  s = s.replaceAll("{{product_name}}", cfg.productName || "your items");
  s = s.replaceAll("{{checkout_url}}", cfg.checkoutUrl || "your checkout");
  s = s.replaceAll("{{discount_code}}", (cfg.offer==="10% off")?"SAVE10":(cfg.offer==="$10 off")?"TAKE10":"");
  return s;
}
function baseCopy(cfg){
  const greet = cfg.includeName ? "Hi {{first_name}}," : "Hi,";
  const prod = cfg.includeProd ? " your {{product_name}}" : " your cart";
  const body = `${greet}
We noticed you left${prod}. ${offerLine(cfg.offer)}
${timingLine(cfg.timing)}
${cfg.includeUrl ? "Pick up where you left off: {{checkout_url}}" : ""}`;
  return tokens(toneWrap(body, cfg.tone), cfg);
}
function altVariant(text){
  return text
    .replaceAll("We noticed","Just a nudge:")
    .replaceAll("Pick up where you left off","Jump back in")
    .replaceAll("We’ll hold your cart","We’re saving your picks");
}
function localize(s, lang){
  if(lang==="es"){
    return s
      .replaceAll("Hi","Hola")
      .replaceAll("We noticed","Vimos")
      .replaceAll("Pick up where you left off","Continúa tu compra")
      .replaceAll("We’ll hold your cart","Guardaremos tu carrito");
  }
  if(lang==="fr"){
    return s
      .replaceAll("Hi","Salut")
      .replaceAll("We noticed","Nous avons remarqué")
      .replaceAll("Pick up where you left off","Reprenez votre commande")
      .replaceAll("We’ll hold your cart","Nous gardons votre panier");
  }
  return s;
}
function update(){
  const cfg={
    firstName:document.getElementById("firstName").value.trim(),
    productName:document.getElementById("productName").value.trim(),
    checkoutUrl:document.getElementById("checkoutUrl").value.trim(),
    tone:document.getElementById("tone").value,
    channel:document.getElementById("channel").value,
    length:document.getElementById("length").value,
    offer:document.getElementById("offer").value,
    timing:document.getElementById("timing").value,
    lang:document.getElementById("lang").value,
    cta:document.getElementById("ctaLabel").value.trim()||"Resume checkout",
    includeName:document.getElementById("tokName").checked,
    includeProd:document.getElementById("tokProd").checked,
    includeUrl:document.getElementById("tokUrl").checked,
    includeDisc:document.getElementById("tokDisc").checked
  };
  let text = baseCopy(cfg);
  if(cfg.length==="Short"){ text = text.split("\n").slice(0,2).join(" "); }
  if(cfg.length==="Long"){ text = text + "\nP.S. Your picks are popular—don’t miss your size."; }
  text = localize(text, cfg.lang);
  const chText = byChannel(text, cfg.channel, cfg.cta);

  const b = altVariant(text);
  const bCh = byChannel(localize(b, cfg.lang), cfg.channel, cfg.cta);

  document.getElementById("badgeTone").textContent = cfg.tone;
  document.getElementById("badgeChannel").textContent = cfg.channel;
  document.getElementById("badgeOffer").textContent = (cfg.offer==="None"?"No offer":cfg.offer);
  document.getElementById("preview").textContent = chText;
  document.getElementById("previewB").textContent = bCh;

  const params = new URLSearchParams(cfg).toString();
  history.replaceState(null,"", "?"+params);
}
function calc(){
  const aov=+document.getElementById("aov").value||0;
  const sessions=+document.getElementById("sessions").value||0;
  const aband=+document.getElementById("aband").value||0;
  let rec=+document.getElementById("recovery").value||0;
  const offer=document.getElementById("offer").value;
  // simple uplift for demo
  if(offer==="10% off" || offer==="$10 off") rec+=1.0;
  if(offer==="Free shipping") rec+=0.5;
  const carts = sessions * (aband/100);
  const recovered = carts * (rec/100);
  const revenue = recovered * aov;
  document.getElementById("calcOut").textContent = "≈ " + recovered.toFixed(0) + " carts / $" + revenue.toFixed(0) + " month";
}
function share(){
  navigator.clipboard.writeText(location.href).then(()=>alert("Share link copied!"));
}
// hydrate from query
(function(){
  const q=new URLSearchParams(location.search);
  for(const [k,v] of q.entries()){
    const el=document.getElementById(k);
    if(!el) continue;
    if(el.type==="checkbox"){ el.checked = (v==="true"||v==="1"); }
    else el.value = v;
  }
  document.getElementById("y").textContent = new Date().getFullYear();
  update();
})();
document.getElementById("genBtn").onclick=update;
document.getElementById("abBtn").onclick=update;
document.getElementById("shareBtn").onclick=share;
document.getElementById("calcBtn").onclick=calc;
for(const id of ["tone","channel","length","offer","timing","lang","ctaLabel","firstName","productName","checkoutUrl","tokName","tokProd","tokUrl","tokDisc"]){
  const el=document.getElementById(id); el && el.addEventListener("change",update);
}
</script>
</body></html>`;
    res.status(200).type("html").send(html);
  });
}
