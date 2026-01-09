/**
 * Public snippet + install flow
 *  - GET /abando.js       : embeddable script (merchant drops this on their site)
 *  - POST /abando-ping    : CORS ping endpoint (telemetry light)
 *  - GET /install         : copy/paste instructions
 *  - GET /embed-test      : quick local verification page
 */
export function installSnippet(app) {
  // ---------- /abando.js (embeddable) ----------
  app.get("/abando.js", (_req, res) => {
    res.type("application/javascript").send(`(function(){
      if (window.__abandoLoaded) return; window.__abandoLoaded = true;
      var s=document.currentScript||(function(){var a=document.getElementsByTagName('script');return a[a.length-1]||null})();
      var cfg={
        position:(s&&s.getAttribute('data-position'))||'right',        // right|left
        accent:(s&&s.getAttribute('data-accent'))||'#5b8cff',
        label:(s&&s.getAttribute('data-label'))||'Need help?',
        demo:(s&&s.getAttribute('data-demo'))||'0'
      };
      function el(t,css,props){var e=document.createElement(t); if(css) for(var k in css) e.style[k]=css[k]; if(props) for(var k in props) e[k]=props[k]; return e;}
      var btn=el('button',{position:'fixed',zIndex:'2147483647',bottom:'18px',right:cfg.position==='right'?'18px':'auto',left:cfg.position==='left'?'18px':'auto',padding:'12px 16px',borderRadius:'999px',background:cfg.accent,color:'#0b0b0c',border:'0',fontWeight:'800',boxShadow:'0 6px 20px rgba(0,0,0,.35)',cursor:'pointer'},{innerText:cfg.label,ariaLabel:'Open Abando'});
      var overlay=el('div',{position:'fixed',inset:'0',display:'none',background:'rgba(0,0,0,.55)',backdropFilter:'blur(2px)',zIndex:'2147483646'});
      var modal=el('div',{position:'fixed',bottom:'78px',right:cfg.position==='right'?'18px':'auto',left:cfg.position==='left'?'18px':'auto',width:'min(420px,92vw)',height:'min(520px,78vh)',background:'#0b0b0c',color:'#f2f2f2',border:'1px solid #222',borderRadius:'14px',overflow:'hidden',boxShadow:'0 10px 30px rgba(0,0,0,.45)',display:'none',zIndex:'2147483647'});
      var bar=el('div',{height:'42px',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 10px',background:'#121214',borderBottom:'1px solid #222'});
      var title=el('div',null,{innerText:'Abando'});
      var x=el('button',{background:'transparent',border:'0',color:'#f2f2f2',fontSize:'18px',cursor:'pointer',padding:'6px'},{innerText:'×',title:'Close'});
      var body=el('div',{padding:'12px',fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,sans-serif',lineHeight:'1.55'});
      var demoHTML='<div style="opacity:.9">👋 I help recover more checkouts. Ask me about shipping, returns, or sizing—then I can guide checkout.</div><div style="margin-top:10px;opacity:.65;fontSize:12px">This is a lightweight preview. <a href="/demo" target="_blank" rel="noopener" style="color:'+cfg.accent+';text-decoration:none">See full demo ↗</a></div>';
      body.innerHTML=demoHTML;
      bar.appendChild(title); bar.appendChild(x); modal.appendChild(bar); modal.appendChild(body);
      function open(){overlay.style.display='block'; modal.style.display='block';}
      function close(){overlay.style.display='none'; modal.style.display='none';}
      btn.addEventListener('click',open); overlay.addEventListener('click',close); x.addEventListener('click',close);
      document.addEventListener('keydown',function(e){ if(e.key==='Escape') close();});
      document.addEventListener('DOMContentLoaded',function(){ document.body.appendChild(btn); document.body.appendChild(overlay); document.body.appendChild(modal); });
      // telemetry ping (best-effort)
      try{ fetch('https://abando.ai/abando-ping',{method:'POST',mode:'cors',headers:{'content-type':'application/json'},body:JSON.stringify({href:location.href,origin:location.origin,title:document.title,ua:navigator.userAgent,ts:Date.now()})}).catch(function(){});}catch(e){}
    })();`);
  });

  // ---------- /abando-ping (CORS) ----------
  const pings = [];
  app.options("/abando-ping", (_req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "content-type");
    res.set("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.status(204).end();
  });
  app.post("/abando-ping", (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    try {
      const { href, origin, title, ua } = req.body || {};
      pings.push({ ts: Date.now(), ip: (req.headers["x-forwarded-for"]||req.ip||"").toString(), origin, href, title, ua });
      if (pings.length > 200) pings.shift();
    } catch {}
    res.json({ ok: true });
  });

  // ---------- /install (copy/paste) ----------
  app.get("/install", (_req, res) => {
    const SNIP = `<script src="https://abando.ai/abando.js" defer></script>`;
    res.status(200).type("html").send(`<!doctype html><html lang="en"><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Install Abando</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:#0b0b0c;color:#f2f2f2;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.wrap{max-width:880px;margin:0 auto;padding:40px 20px}
.card{background:#121214;border:1px solid #222;border-radius:16px;padding:22px}
h1{font-size:clamp(28px,5vw,42px);margin:.2rem 0 1rem}
.lead{opacity:.9;font-size:clamp(16px,2.2vw,19px);line-height:1.7}
pre{background:#0f0f11;border:1px solid #222;border-radius:12px;padding:12px;overflow:auto}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px}
.kv{display:flex;gap:12px;margin:14px 0;flex-wrap:wrap}
.btn{display:inline-block;padding:12px 16px;border-radius:12px;background:#5b8cff;color:#0b0b0c;font-weight:800;text-decoration:none}
.ghost{display:inline-block;padding:12px 16px;border-radius:12px;background:#0f0f11;border:1px solid #222;color:#f2f2f2;text-decoration:none}
.small{opacity:.65;font-size:12px;margin-top:8px}
</style>
<body><div class="wrap">
  <div class="card">
    <h1>Install Abando</h1>
    <p class="lead">Copy this into your site's <strong>&lt;head&gt;</strong> (or theme header). That’s it—the blue “Need help?” bubble appears and opens the assistant.</p>
    <pre><code>${SNIP.replace(/</g,"&lt;")}</code></pre>
    <div class="kv">
      <a class="btn" href="/embed-test" target="_blank" rel="noopener">Open Test Page ↗</a>
      <a class="ghost" href="/">Back to site</a>
    </div>
    <p class="small">Options: <code>data-position="left|right"</code>, <code>data-accent="#5b8cff"</code>, <code>data-label="Need help?"</code></p>
  </div>
  <footer class="small" style="opacity:.6;margin-top:16px">© ${new Date().getFullYear()} Abando</footer>
</div></body></html>`);
  });

  // ---------- /embed-test (quick verification) ----------
  app.get("/embed-test", (_req, res) => {
    res.status(200).type("html").send(`<!doctype html><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Abando Embed Test</title>
<style>body{background:#0b0b0c;color:#f2f2f2;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;display:grid;place-items:center;height:100vh}</style>
<h1>Embed test page</h1>
<script src="/abando.js" defer></script>`);
  });
}
