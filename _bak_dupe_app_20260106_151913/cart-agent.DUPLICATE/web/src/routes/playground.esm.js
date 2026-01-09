/**
 * Demo Playground:
 *  - GET /demo
 *  - GET /demo/playground
 *  - GET /demo/playground.js (client code built from plain strings)
 */
export function installPlayground(app) {
  function page(o){
    var title=o.title||"Abando";
    var body=o.body||"";
    var head=o.head||"";
    return [
      '<!doctype html><html lang="en"><head>',
      '<meta charset="utf-8"/>',
      '<meta name="viewport" content="width=device-width,initial-scale=1"/>',
      '<title>' + title + '</title>',
      '<style>',
      ':root{color-scheme:dark}',
      '*{box-sizing:border-box}',
      'body{margin:0;background:#0b0b0c;color:#f2f2f2;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}',
      '.wrap{max-width:980px;margin:0 auto;padding:40px 20px}',
      '.card{background:#121214;border:1px solid #222;border-radius:16px;padding:22px}',
      'h1{font-size:clamp(28px,5vw,42px);margin:.2rem 0 1rem}',
      '.lead{opacity:.9;font-size:clamp(16px,2.2vw,19px);line-height:1.7}',
      '.row{display:flex;flex-wrap:wrap;gap:12px;margin:14px 0}',
      '.kv{flex:1 1 240px;background:#0f0f11;border:1px solid #222;border-radius:12px;padding:12px}',
      '.kv b{display:block;opacity:.75;font-weight:600;margin-bottom:4px}',
      '.cta{display:inline-block;padding:12px 16px;border-radius:12px;background:#5b8cff;color:#0b0b0c;font-weight:800;text-decoration:none}',
      '.ghost{display:inline-block;padding:12px 16px;border-radius:12px;background:#0f0f11;border:1px solid #222;color:#f2f2f2;text-decoration:none}',
      '.small{opacity:.65;font-size:12px;margin-top:10px}',
      '.muted{opacity:.7;font-size:13px;margin-top:6px}',
      'input,select,button,textarea{font:inherit}',
      'input[type=text],input[type=number],select,textarea{width:100%;padding:10px;border-radius:10px;border:1px solid #333;background:#0e0e10;color:#f2f2f2}',
      'textarea{min-height:120px;white-space:pre-wrap}',
      'ul{margin:8px 0 0 18px;padding:0}',
      'li{margin:4px 0}',
      '</style>',
      head,
      '</head><body><div class="wrap">',
      body,
      '</div></body></html>'
    ].join('');
  }

  // /demo
  app.get('/demo', (_req, res) => {
    var body = [
      '<div class="card">',
      '<h1>Abando Demo</h1>',
      '<p class="lead">Tweak tone, channel, CTA, language, and see projected lift with your numbers.</p>',
      '<div class="kv" style="margin-top:12px">',
      '<b>How the nudge works</b>',
      '<ul>',
      '<li><b>Detect</b> when a shopper abandons checkout (no purchase after a short window).</li>',
      '<li><b>Nudge</b> via Email, SMS, or an on-site reminder—polite, on-brand, and helpful.</li>',
      '<li><b>Guide back</b> with a clear CTA (Call-To-Action) to resume checkout.</li>',
      '<li><b>Measure</b> recovery rate and incremental revenue.</li>',
      '</ul>',
      '<div class="small" style="margin-top:6px">No jargon—every acronym is defined in the Playground glossary.</div>',
      '</div>',
      '<p style="margin-top:12px"><a class="cta" href="/demo/playground">Open the Playground</a>',
      ' <a class="ghost" href="/pricing" style="margin-left:8px">View pricing</a></p>',
      '</div>',
      '<footer class="small" style="opacity:.6;margin-top:18px">© <span id="y"></span> Abando™</footer>',
      '<script>document.getElementById("y").textContent=(new Date()).getFullYear()</script>'
    ].join('');
    res.status(200).type('html').send(page({ title: 'Abando – Demo', body }));
  });

  // /demo/playground
  app.get('/demo/playground', (_req, res) => {
    var body = [
      '<div class="card">',
      '<h1>Interactive Playground</h1>',
      '<p class="lead">Configure the message you\'d send to recover carts. Then copy or share the setup.</p>',
      '<div id="pg"></div>',
      '<p style="margin-top:12px"><a class="ghost" href="/pricing">Back to pricing</a></p>',
      '</div>',
      '<footer class="small" style="opacity:.6;margin-top:18px">© <span id="y"></span> Abando™</footer>',
      '<script>document.getElementById("y").textContent=(new Date()).getFullYear()</script>',
      '<script src="/demo/playground.js" defer></script>'
    ].join('');
    res.status(200).type('html').send(page({ title: 'Abando – Playground', body }));
  });

  // /demo/playground.js – plain strings, no backticks
  app.get('/demo/playground.js', (_req, res) => {
    try {
      var lines = [];
      lines.push('(function(){try{');
      lines.push('var el=document.getElementById("pg"); if(!el){return;}');
      lines.push('function h(t,a,html){var s="<"+t; a=a||{}; for(var k in a){if(a.hasOwnProperty(k)&&a[k]!==null){s+=" "+k+"=\\""+String(a[k]).replace(/"/g,"&quot;")+"\\"";}} s+=">"; if(html){s+=html;} s+="</"+t+">"; return s;}');

      // Controls (includes Language)
      lines.push('var controls=[');
      lines.push('h("div",{class:"row"},');
      lines.push('  h("div",{class:"kv",style:"flex:2 1 340px"},h("b",null,"Audience & Offer")+h("div",null,');
      lines.push('    "<label>First name</label>"+h("input",{type:"text",id:"firstName",placeholder:"Alex"})+');
      lines.push('    "<label style=\\"display:block;margin-top:8px\\">Product name</label>"+h("input",{type:"text",id:"productName",placeholder:"Canvas Tote"})+');
      lines.push('    "<label style=\\"display:block;margin-top:8px\\">Checkout URL</label>"+h("input",{type:"text",id:"checkoutUrl",placeholder:"https://yourstore.com/checkout"})+');
      lines.push('    "<label style=\\"display:block;margin-top:8px\\">Offer</label>"+h("select",{id:"offer"},"<option>None</option><option>Free shipping</option><option>10% off</option><option>$10 off</option>")+');
      lines.push('    "<label style=\\"display:block;margin-top:8px\\">Timing</label>"+h("select",{id:"timing"},"<option>24 hours</option><option>3 days</option><option>7 days</option>")');
      lines.push('  ))+');
      lines.push('  h("div",{class:"kv",style:"flex:1 1 260px"},h("b",null,"Style & Channel")+h("div",null,');
      lines.push('    "<label>Tone</label>"+h("select",{id:"tone"},"<option>Friendly</option><option>Direct</option><option>Playful</option><option>Urgent</option><option>Minimal</option>")+');
      lines.push('    "<label style=\\"display:block;margin-top:8px\\">Channel</label>"+h("select",{id:"channel"},"<option>Email</option><option>SMS</option><option>On-site nudge</option>")+');
      lines.push('    "<label style=\\"display:block;margin-top:8px\\">Length</label>"+h("select",{id:"length"},"<option>Short</option><option>Medium</option><option>Long</option>")+');
      lines.push('    "<label style=\\"display:block;margin-top:8px\\">CTA label</label>"+h("input",{type:"text",id:"ctaLabel",placeholder:"Resume checkout"})+');
      lines.push('    "<label style=\\"display:block;margin-top:8px\\">Language</label>"+h("select",{id:"lang"},');
      lines.push('      "<option value=\\"en\\">English</option><option value=\\"es\\">Español</option><option value=\\"fr\\">Français</option><option value=\\"de\\">Deutsch</option><option value=\\"pt-BR\\">Português (Brasil)</option><option value=\\"it\\">Italiano</option><option value=\\"nl\\">Nederlands</option><option value=\\"sv\\">Svenska</option><option value=\\"ja\\">日本語</option><option value=\\"ko\\">한국어</option><option value=\\"zh-CN\\">简体中文</option><option value=\\"zh-TW\\">繁體中文</option><option value=\\"ar\\">العربية</option>"');
      lines.push('    )');
      lines.push('  ))');
      lines.push('),');

      // Tokens + Revenue Estimator (with AOV explainer line)
      lines.push('h("div",{class:"row"},');
      lines.push('  h("div",{class:"kv",style:"flex:2 1 420px"},h("b",null,"Tokens")+');
      lines.push('    h("label",null,h("input",{type:"checkbox",id:"tokName",checked:"checked"})+" Include first name")+"<br/>"+');
      lines.push('    h("label",null,h("input",{type:"checkbox",id:"tokProd",checked:"checked"})+" Include product")+"<br/>"+');
      lines.push('    h("label",null,h("input",{type:"checkbox",id:"tokUrl",checked:"checked"})+" Include checkout URL")+"<br/>"+');
      lines.push('    h("label",null,h("input",{type:"checkbox",id:"tokDisc"})+" Include discount code token")');
      lines.push('  )+');
      lines.push('  h("div",{class:"kv",style:"flex:1 1 260px"},h("b",null,"Revenue Estimator")+');
      lines.push('    "<label>AOV ($)</label>"+h("input",{type:"number",id:"aov",value:"80",min:"0"})+');
      lines.push('    "<div class=\\"muted\\">AOV = Average Order Value — the typical amount each customer spends per order.</div>"+');
      lines.push('    "<label style=\\"display:block;margin-top:8px\\">Monthly sessions</label>"+h("input",{type:"number",id:"sessions",value:"10000",min:"0"})+');
      lines.push('    "<label style=\\"display:block;margin-top:8px\\">Abandon rate %</label>"+h("input",{type:"number",id:"aband",value:"70",min:"0",max:"100"})+');
      lines.push('    "<div class=\\"muted\\">Abandon rate = % of shoppers who add to cart but don’t finish checkout.</div>"+');
      lines.push('    "<label style=\\"display:block;margin-top:8px\\">Recovery rate %</label>"+h("input",{type:"number",id:"recovery",value:"2",min:"0",max:"100"})+');
      lines.push('    "<div class=\\"muted\\">Recovery rate = % of abandoned carts you win back with nudges.</div>"+');
      lines.push('    "<button id=\\"calcBtn\\" class=\\"ghost\\" style=\\"margin-top:8px\\">Recalculate</button>"+');
      lines.push('    "<div id=\\"calcOut\\" class=\\"small\\" style=\\"margin-top:6px\\"></div>"');
      lines.push('  )');
      lines.push('),');

      // Previews
      lines.push('h("div",{class:"row"},');
      lines.push('  h("div",{class:"kv",style:"flex:1 1 100%"},h("b",null,"Preview A")+"<textarea id=\\"preview\\"></textarea>"+');
      lines.push('    "<button id=\\"copyA\\" class=\\"ghost\\" style=\\"margin-top:6px\\">Copy text</button>")+');
      lines.push('  h("div",{class:"kv",style:"flex:1 1 100%"},h("b",null,"Preview B")+"<textarea id=\\"previewB\\"></textarea>"+');
      lines.push('    "<button id=\\"copyB\\" class=\\"ghost\\" style=\\"margin-top:6px\\">Copy text</button>")');
      lines.push('),');

      // Glossary card (plain-language acronyms)
      lines.push('h("div",{class:"row"},');
      lines.push('  h("div",{class:"kv",style:"flex:1 1 100%"},');
      lines.push('    h("b",null,"Glossary (plain language)")+');
      lines.push('    "<ul>"+');
      lines.push('      "<li><b>AOV</b>: Average Order Value — average spend per order.</li>"+');
      lines.push('      "<li><b>CTA</b>: Call-To-Action — the button or link (e.g., \\"Resume checkout\\").</li>"+');
      lines.push('      "<li><b>Abandon rate</b>: % of shoppers who add to cart but don’t buy.</li>"+');
      lines.push('      "<li><b>Recovery rate</b>: % of abandoned carts won back with nudges.</li>"+');
      lines.push('    "</ul>"');
      lines.push('),');

      // Bottom buttons
      lines.push('"<div style=\\"margin-top:8px\\">"+');
      lines.push('  "<button id=\\"genBtn\\" class=\\"cta\\">Generate copy</button> "+');
      lines.push('  "<button id=\\"shareBtn\\" class=\\"ghost\\">Share settings</button>"+');
      lines.push('"</div>"');
      lines.push('].join("");');
      lines.push('el.innerHTML=controls;');

      // --- helpers (no template literals) ---
      lines.push('function toneWrap(text,tone){var t={"Friendly":[["We noticed","Hey! We noticed"],["Please","Mind taking a look?"],["Reminder:","Quick reminder:"]],"Direct":[["We noticed","You left"],["Please",""],["Reminder:",""]],"Playful":[["Hi","Hey"],["We noticed","Psst—"],["Reminder:","Heads up:"]],"Urgent":[["We noticed","Last chance:"],["We\\u2019ll hold your cart","Your cart expires soon!"]],"Minimal":[["Hi",""],["We noticed","Reminder:"],["Please",""]] }[tone]||[];for(var i=0;i<t.length;i++){text=text.split(t[i][0]).join(t[i][1]);}return text;}');
      lines.push('function byChannel(base,ch,cta){if(ch==="SMS"){var s=base.replace(/\\n+/g," ").slice(0,240);return s+(cta?" Reply STOP to opt out. \\n"+cta:"");} if(ch==="On-site nudge"){var one=base.split("\\n").slice(0,2).join(" ");return one+(cta?"\\n[ "+cta+" ]":"");} return base+(cta?"\\n\\n→ "+cta:"");}');
      lines.push('function offerLine(o){if(o==="None")return"";if(o==="Free shipping")return"We\\u2019ll cover shipping\\u2014no code needed.";if(o==="10% off")return"Use code SAVE10 at checkout.";if(o==="$10 off")return"Use code TAKE10 at checkout.";return"";}');
      lines.push('function timingLine(t){return "We\\u2019ll hold your cart for "+t+".";}');
      lines.push('function tokens(s,c){function rep(a,b){return s.split(a).join(b);} s=rep("{{first_name}}",c.firstName||"there"); s=rep("{{product_name}}",c.productName||"your items"); s=rep("{{checkout_url}}",c.checkoutUrl||"your checkout"); s=rep("{{discount_code}}",(c.offer==="10% off")?"SAVE10":(c.offer==="$10 off")?"TAKE10":""); return s;}');
      lines.push('function baseCopy(c){var greet=c.includeName?"Hi {{first_name}},":"Hi,";var prod=c.includeProd?" your {{product_name}}":" your cart";var body=greet+"\\n"+"We noticed you left"+prod+". "+offerLine(c.offer)+"\\n"+timingLine(c.timing)+"\\n"+(c.includeUrl?"Pick up where you left off: {{checkout_url}}":""); return tokens(toneWrap(body,c.tone),c);}');
      lines.push('function altVariant(s){return s.replace(/We noticed/g,"Just a nudge:").replace(/Pick up where you left off/g,"Jump back in").replace(/We\\u2019ll hold your cart/g,"We\\u2019re saving your picks");}');
      lines.push('function localize(s,lang){var map={' +
        '{"Hi":{"es":"Hola","fr":"Salut","de":"Hallo","pt-BR":"Olá","it":"Ciao","nl":"Hoi","sv":"Hej","ja":"こんにちは","ko":"안녕하세요","zh-CN":"你好","zh-TW":"你好","ar":"مرحبا"},' +
        '"We noticed":{"es":"Vimos","fr":"Nous avons remarqué","de":"Wir haben bemerkt","pt-BR":"Vimos","it":"Abbiamo notato","nl":"We merkten","sv":"Vi såg","ja":"気づきました","ko":"놓고 가셨어요","zh-CN":"我们注意到","zh-TW":"我們注意到","ar":"لاحظنا"},' +
        '"Pick up where you left off":{"es":"Continúa tu compra","fr":"Reprenez votre commande","de":"Machen Sie dort weiter","pt-BR":"Continue sua compra","it":"Riprendi da dove eri rimasto","nl":"Ga verder waar je was gebleven","sv":"Fortsätt där du slutade","ja":"続きから購入","ko":"이어서 진행하기","zh-CN":"继续结账","zh-TW":"繼續結帳","ar":"أكمل عملية الشراء"},' +
        '"We’ll hold your cart":{"es":"Guardaremos tu carrito","fr":"Nous gardons votre panier","de":"Wir reservieren Ihren Warenkorb","pt-BR":"Guardaremos seu carrinho","it":"Terremo il tuo carrello","nl":"We bewaren je winkelwagen","sv":"Vi sparar din varukorg","ja":"カートをお取り置きします","ko":"장바구니를 보관해둘게요","zh-CN":"我们将为你保留购物车","zh-TW":"我們將為你保留購物車","ar":"سنحتفظ بعربة التسوق الخاصة بك"}}}; for(var k in map){var t=map[k][lang]; if(t){ s=s.split(k).join(t); }} document.documentElement.dir=(lang==="ar")?"rtl":"ltr"; return s;}');
      lines.push('function fmt(n,lang){try{return new Intl.NumberFormat(lang).format(n);}catch(_){return String(n);}}');

      lines.push('function gv(id){var e=document.getElementById(id);return e?e.value:"";}');
      lines.push('function gc(id){var e=document.getElementById(id);return !!(e&&e.checked);}');
      lines.push('function cfg(){return {firstName:gv("firstName"),productName:gv("productName"),checkoutUrl:gv("checkoutUrl"),tone:gv("tone"),channel:gv("channel"),length:gv("length"),offer:gv("offer"),timing:gv("timing"),lang:gv("lang")||"en",cta:gv("ctaLabel")||"Resume checkout",includeName:gc("tokName"),includeProd:gc("tokProd"),includeUrl:gc("tokUrl"),includeDisc:gc("tokDisc")};}');

      lines.push('function update(){var c=cfg();var text=baseCopy(c); if(c.length==="Short"){text=text.split("\\n").slice(0,2).join(" ");} if(c.length==="Long"){text=text+"\\nP.S. Your picks are popular\\u2014don\\u2019t miss your size.";} text=localize(text,c.lang); var ch=byChannel(text,c.channel,c.cta); var b=altVariant(text); b=localize(b,c.lang); var bCh=byChannel(b,c.channel,c.cta); var a=document.getElementById("preview"); if(a) a.value=ch; var bb=document.getElementById("previewB"); if(bb) bb.value=bCh; var q=new URLSearchParams(c).toString(); history.replaceState(null,"","?"+q);}');
      lines.push('function calc(){var a=+document.getElementById("aov").value||0;var s=+document.getElementById("sessions").value||0;var ab=+document.getElementById("aband").value||0;var r=+document.getElementById("recovery").value||0;var off=document.getElementById("offer").value;if(off==="10% off"||off==="$10 off")r+=1.0; if(off==="Free shipping")r+=0.5; var carts=s*(ab/100); var rec=carts*(r/100); var rev=rec*a; var langSel=(document.getElementById("lang")||{}).value||"en"; var o=document.getElementById("calcOut"); if(o) o.textContent="\\u2248 "+fmt(rec,langSel)+" carts / $"+fmt(rev,langSel)+" month";}');
      lines.push('function share(){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(location.href).then(function(){alert("Share link copied!");});}}');
      lines.push('function addRandomize(){var g=document.getElementById("genBtn"); if(!g||!g.parentNode) return; var rb=document.createElement("button"); rb.id="randBtn"; rb.className="ghost"; rb.style.marginLeft="8px"; rb.textContent="Randomize"; g.parentNode.appendChild(rb); rb.onclick=function(){var tones=["Friendly","Direct","Playful","Urgent","Minimal"]; var offers=["None","Free shipping","10% off","$10 off"]; var times=["24 hours","3 days","7 days"]; document.getElementById("tone").value=tones[Math.floor(Math.random()*tones.length)]; document.getElementById("offer").value=offers[Math.floor(Math.random()*offers.length)]; document.getElementById("timing").value=times[Math.floor(Math.random()*times.length)]; update();};}');
      lines.push('(function wire(){ var g=document.getElementById("genBtn"); if(g) g.onclick=update; var sh=document.getElementById("shareBtn"); if(sh) sh.onclick=share; var cb=document.getElementById("calcBtn"); if(cb) cb.onclick=calc; var ch=["tone","channel","length","offer","timing","lang","ctaLabel","firstName","productName","checkoutUrl","tokName","tokProd","tokUrl","tokDisc"]; for(var i=0;i<ch.length;i++){var e=document.getElementById(ch[i]); if(e){e.addEventListener("change",function(){update();calc();});}} var q=new URLSearchParams(location.search); q.forEach(function(v,k){var e=document.getElementById(k); if(!e) return; if(e.type==="checkbox"){e.checked=(v==="true"||v==="1");} else {e.value=v;}}); var cA=document.getElementById("copyA"); if(cA){cA.onclick=function(){var v=(document.getElementById("preview")||{}).value||""; if(navigator.clipboard) navigator.clipboard.writeText(v); alert("Copied A!");};} var cB=document.getElementById("copyB"); if(cB){cB.onclick=function(){var v=(document.getElementById("previewB")||{}).value||""; if(navigator.clipboard) navigator.clipboard.writeText(v); alert("Copied B!");};} addRandomize(); calc(); update(); })();');
      lines.push('}catch(e){console.error("[playground client] error:",e&&(e.stack||e));}})();');

      var js = lines.join('\n');
      res.set('Content-Type','application/javascript; charset=utf-8').status(200).send(js);
    } catch (e) {
      console.error("[playground.js] assembly error:", e && (e.stack||e));
      var fallback='(function(){var el=document.getElementById("pg"); if(el){ el.innerHTML="<div class=\\"kv\\"><b>Demo fallback</b><div class=\\"small\\">Script error. Please refresh.</div></div>"; }})();';
      res.set('Content-Type','application/javascript; charset=utf-8').status(200).send(fallback);
    }
  });

  console.log("[playground] mounted: /demo, /demo/playground, /demo/playground.js");
}
