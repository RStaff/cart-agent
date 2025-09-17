export function installPlayground(app) {
  function page({ title, body, head="" }) {
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
      'input,select,button,textarea{font:inherit}',
      'input[type=text],input[type=number],select,textarea{width:100%;padding:10px;border-radius:10px;border:1px solid #333;background:#0e0e10;color:#f2f2f2}',
      'textarea{min-height:120px;white-space:pre-wrap}',
      '</style>',
      head,
      '</head><body><div class="wrap">',
      body,
      '</div></body></html>'
    ].join('');
  }

  // /demo
  app.get('/demo', (_req, res) => {
    const body = [
      '<div class="card">',
      '<h1>Abando Demo</h1>',
      '<p class="lead">Tweak tone, channel, CTA, and see projected lift with your numbers.</p>',
      '<p><a class="cta" href="/demo/playground">Open the Playground</a>',
      ' <a class="ghost" href="/pricing" style="margin-left:8px">View pricing</a></p>',
      '</div>',
      '<footer class="small" style="opacity:.6;margin-top:18px">© <span id="y"></span> Abando™</footer>',
      '<script>document.getElementById("y").textContent=(new Date()).getFullYear()</script>'
    ].join('');
    res.status(200).type('html').send(page({ title: 'Abando – Demo', body }));
  });

  // /demo/playground
  app.get('/demo/playground', (_req, res) => {
    const body = [
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

  // /demo/playground.js – build from plain strings, and send a joined string
  app.get('/demo/playground.js', (_req, res) => {
    try {
      const lines = [];
      lines.push('(function(){try{');
      lines.push('var el=document.getElementById("pg"); if(!el){return;}');
      lines.push('function h(tag,attrs,html){var s="<"+tag;attrs=attrs||{};for(var k in attrs){if(attrs.hasOwnProperty(k)&&attrs[k]!==null){s+=" "+k+"=\\""+String(attrs[k]).replace(/"/g,"&quot;")+"\\"";}}s+=">";if(html){s+=html;}s+="</"+tag+">";return s;}');
      lines.push('var controls=[');
      lines.push('h("div",{class:"row"},');
      lines.push('  h("div",{class:"kv",style:"flex:2 1 320px"},h("b",null,"Audience & Offer")+h("div",null,');
      lines.push('    "<label>First name</label>"+h("input",{type:"text",id:"firstName",placeholder:"Alex"})+');
      lines.push('    "<label style=\\"display:block;margin-top:8px\\">Product name</label>"+h("input",{type:"text",id:"productName",placeholder:"Canvas Tote"})+');
      lines.push('    "<label style=\\"display:block;margin-top:8px\\">Checkout URL</label>"+h("input",{type:"text",id:"checkoutUrl",placeholder:"https://yourstore.com/checkout"})+');
      lines.push('    "<label style=\\"display:block;margin-top:8px\\">Offer</label>"+h("select",{id:"offer"},"<option>None</option><option>Free shipping</option><option>10% off</option><option>$10 off</option>")+');
      lines.push('    "<label style=\\"display:block;margin-top:8px\\">Timing</label>"+h("select",{id:"timing"},"<option>24 hours</option><option>3 days</option><option>7 days</option>")');
      lines.push('  ))+');
      lines.push('  h("div",{class:"kv",style:"flex:1 1 240px"},h("b",null,"Style & Channel")+h("div",null,');
      lines.push('    "<label>Tone</label>"+h("select",{id:"tone"},"<option>Friendly</option><option>Direct</option><option>Playful</option><option>Urgent</option><option>Minimal</option>")+');
      lines.push('    "<label style=\\"display:block;margin-top:8px\\">Channel</label>"+h("select",{id:"channel"},"<option>Email</option><option>SMS</option><option>On-site nudge</option>")+');
      lines.push('    "<label style=\\"display:block;margin-top:8px\\">Length</label>"+h("select",{id:"length"},"<option>Short</option><option>Medium</option><option>Long</option>")+');
      lines.push('    "<label style=\\"display:block;margin-top:8px\\">CTA label</label>"+h("input",{type:"text",id:"ctaLabel",placeholder:"Resume checkout"})');
      lines.push('  ))');
      lines.push('),');
      lines.push('h("div",{class:"row"},');
      lines.push('  h("div",{class:"kv",style:"flex:2 1 420px"},h("b",null,"Tokens")+');
      lines.push('    h("label",null,h("input",{type:"checkbox",id:"tokName",checked:"checked"})+" Include first name")+"<br/>"+');
      lines.push('    h("label",null,h("input",{type:"checkbox",id:"tokProd",checked:"checked"})+" Include product")+"<br/>"+');
      lines.push('    h("label",null,h("input",{type:"checkbox",id:"tokUrl",checked:"checked"})+" Include checkout URL")+"<br/>"+');
      lines.push('    h("label",null,h("input",{type:"checkbox",id:"tokDisc"})+" Include discount code token")');
      lines.push('  )+');
      lines.push('  h("div",{class:"kv",style:"flex:1 1 240px"},h("b",null,"Revenue Estimator")+');
      lines.push('    "<label>AOV ($)</label>"+h("input",{type:"number",id:"aov",value:"80",min:"0"})+');
      lines.push('    "<label style=\\"display:block;margin-top:8px\\">Monthly sessions</label>"+h("input",{type:"number",id:"sessions",value:"10000",min:"0"})+');
      lines.push('    "<label style=\\"display:block;margin-top:8px\\">Abandon rate %</label>"+h("input",{type:"number",id:"aband",value:"70",min:"0",max:"100"})+');
      lines.push('    "<label style=\\"display:block;margin-top:8px\\">Recovery rate %</label>"+h("input",{type:"number",id:"recovery",value:"2",min:"0",max:"100"})+');
      lines.push('    "<button id=\\"calcBtn\\" class=\\"ghost\\" style=\\"margin-top:8px\\">Recalculate</button>"+');
      lines.push('    "<div id=\\"calcOut\\" class=\\"small\\" style=\\"margin-top:6px\\"></div>"');
      lines.push('  )');
      lines.push('),');
      lines.push('h("div",{class:"row"},');
      lines.push('  h("div",{class:"kv",style:"flex:1 1 100%"},h("b",null,"Preview A")+"<textarea id=\\"preview\\"></textarea>")+');
      lines.push('  h("div",{class:"kv",style:"flex:1 1 100%"},h("b",null,"Preview B")+"<textarea id=\\"previewB\\"></textarea>")');
      lines.push('),');
      lines.push('"<div style=\\"margin-top:8px\\">"+');
      lines.push('  "<button id=\\"genBtn\\" class=\\"cta\\">Generate copy</button> "+');
      lines.push('  "<button id=\\"shareBtn\\" class=\\"ghost\\">Share settings</button>"+');
      lines.push('"</div>"');
      lines.push('].join("");');
      lines.push('el.innerHTML=controls;');

      // helper functions (no nested backticks)
      lines.push('function toneWrap(text,tone){var t={"Friendly":[["We noticed","Hey! We noticed"],["Please","Mind taking a look?"],["Reminder:","Quick reminder:"]],"Direct":[["We noticed","You left"],["Please",""],["Reminder",""]],"Playful":[["Hi","Hey"],["We noticed","Psst—"],["Reminder:","Heads up:"]],"Urgent":[["We noticed","Last chance:"],["We\\u2019ll hold your cart","Your cart expires soon!"]],"Minimal":[["Hi",""],["We noticed","Reminder:"],["Please",""]] }[tone]||[];for(var i=0;i<t.length;i++){text=text.split(t[i][0]).join(t[i][1]);}return text;}');
      lines.push('function byChannel(base,ch,cta){if(ch==="SMS"){var s=base.replace(/\\n+/g," ").slice(0,240);return s+(cta?" Reply STOP to opt out. \\n"+cta:"");} if(ch==="On-site nudge"){var one=base.split("\\n").slice(0,2).join(" ");return one+(cta?"\\n[ "+cta+" ]":"");} return base+(cta?"\\n\\n→ "+cta:"");}');
      lines.push('function offerLine(o){if(o==="None")return"";if(o==="Free shipping")return"We\\u2019ll cover shipping\\u2014no code needed.";if(o==="10% off")return"Use code SAVE10 at checkout.";if(o==="$10 off")return"Use code TAKE10 at checkout.";return"";}');
      lines.push('function timingLine(t){return "We\\u2019ll hold your cart for "+t+".";}');
      lines.push('function tokens(s,c){function rep(a,b){return s.split(a).join(b);} s=rep("{{first_name}}",c.firstName||"there"); s=rep("{{product_name}}",c.productName||"your items"); s=rep("{{checkout_url}}",c.checkoutUrl||"your checkout"); s=rep("{{discount_code}}",(c.offer==="10% off")?"SAVE10":(c.offer==="$10 off")?"TAKE10":""); return s;}');
      lines.push('function baseCopy(c){var greet=c.includeName?"Hi {{first_name}},":"Hi,";var prod=c.includeProd?" your {{product_name}}":" your cart";var body=greet+"\\n"+"We noticed you left"+prod+". "+offerLine(c.offer)+"\\n"+timingLine(c.timing)+"\\n"+(c.includeUrl?"Pick up where you left off: {{checkout_url}}":""); return tokens(toneWrap(body,c.tone),c);}');
      lines.push('function altVariant(s){return s.replace(/We noticed/g,"Just a nudge:").replace(/Pick up where you left off/g,"Jump back in").replace(/We\\u2019ll hold your cart/g,"We\\u2019re saving your picks");}');
      lines.push('function cfg(){function v(id){var e=document.getElementById(id);return e?e.value:"";}function c(id){var e=document.getElementById(id);return !!(e&&e.checked);} return {firstName:v("firstName"),productName:v("productName"),checkoutUrl:v("checkoutUrl"),tone:v("tone"),channel:v("channel"),length:v("length"),offer:v("offer"),timing:v("timing"),cta:v("ctaLabel")||"Resume checkout",includeName:c("tokName"),includeProd:c("tokProd"),includeUrl:c("tokUrl"),includeDisc:c("tokDisc")}; }');
      lines.push('function update(){var c=cfg();var text=baseCopy(c);if(c.length==="Short"){text=text.split("\\n").slice(0,2).join(" ");} if(c.length==="Long"){text=text+"\\nP.S. Your picks are popular\\u2014don\\u2019t miss your size.";} var ch=byChannel(text,c.channel,c.cta); var b=altVariant(text); var bCh=byChannel(b,c.channel,c.cta); var a=document.getElementById("preview"); if(a) a.value=ch; var bb=document.getElementById("previewB"); if(bb) bb.value=bCh;}');
      lines.push('function share(){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(location.href).then(function(){alert("Share link copied!");});}}');
      lines.push('function calc(){var a=+document.getElementById("aov").value||0;var s=+document.getElementById("sessions").value||0;var ab=+document.getElementById("aband").value||0;var r=+document.getElementById("recovery").value||0;var off=document.getElementById("offer").value;if(off==="10% off"||off==="$10 off")r+=1.0; if(off==="Free shipping")r+=0.5; var carts=s*(ab/100); var rec=carts*(r/100); var rev=rec*a; var o=document.getElementById("calcOut"); if(o) o.textContent="\\u2248 "+rec.toFixed(0)+" carts / $"+rev.toFixed(0)+" month";}');
      lines.push('var g=document.getElementById("genBtn"); if(g) g.onclick=update; var sh=document.getElementById("shareBtn"); if(sh) sh.onclick=share; var cb=document.getElementById("calcBtn"); if(cb) cb.onclick=calc; update();');
      lines.push('}catch(e){console.error("[playground client] error:",e&&(e.stack||e));}})();');

      res.set('Content-Type','application/javascript; charset=utf-8')
         .send(lines.join('\n'));
    } catch (e) {
      console.error("[playground.js] server assembly error:", e && (e.stack||e));
      const fallback='(function(){var el=document.getElementById("pg"); if(el){ el.innerHTML="<div class=\\"kv\\"><b>Demo fallback</b><div class=\\"small\\">Script error. Please refresh.</div></div>"; }})();';
      res.set('Content-Type','application/javascript; charset=utf-8').status(200).send(fallback);
    }
  });

  console.log("[playground] mounted: /demo, /demo/playground, /demo/playground.js");
}
