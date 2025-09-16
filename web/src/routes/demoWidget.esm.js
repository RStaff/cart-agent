/**
 * Demo widget:
 *  - GET /demo          : minimal interactive demo (mock chat)
 *  - GET /demo/embed.js : floating button + modal that loads /demo?embedded=1
 * Idempotent, no external deps.
 */
export function installDemo(app) {
  // ---- 1) Demo page ----
  app.get("/demo", (req, res) => {
    const embedded = String(req.query.embedded||"") === "1";
    const title = embedded ? "Abando Demo" : "Try Abando — Demo";
    const pad = embedded ? "8px" : "40px";
    const back = embedded ? "" : `<p style="opacity:.7"><a href="/">← Back</a></p>`;
    res.status(200).type("html").send(`<!doctype html><html lang="en"><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:#0b0b0c;color:#f2f2f2;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.wrap{max-width:820px;margin:0 auto;padding:${pad}}
h1{font-size:clamp(22px,4vw,28px);margin:0 0 6px}
.card{background:#121214;border:1px solid #222;border-radius:14px;padding:14px}
.row{display:flex;gap:10px;margin:8px 0}
.bot,.you{padding:10px 12px;border-radius:12px;max-width:80%}
.bot{background:#1a1a1c;border:1px solid #2a2a2e}
.you{background:#23d18b;color:#002a15;font-weight:700}
input{width:100%;padding:12px;border-radius:10px;border:1px solid #333;background:#0e0e10;color:#f2f2f2}
.small{opacity:.65;font-size:12px;margin-top:8px}
</style>
<div class="wrap" role="region" aria-label="Abando demo conversation">
  ${embedded ? "" : "<h1>Abando live demo</h1><p class='small'>Ask about shipping, returns, sizing, and feel the guided checkout flow. (This mock is read-only.)</p>"}
  <div class="card">
    <div class="row"><div class="bot">👋 Hey! I answer questions and guide checkout. What are you shopping for?</div></div> 
    <div class="row" style="justify-content:flex-end"><div class="you">Essentials Hoodie—how long is shipping?</div></div>
    <div class="row"><div class="bot">Most US orders arrive in 3–5 business days. Express is 1–2. Add Medium, black to your cart?</div></div>
    <div class="row" style="justify-content:flex-end"><div class="you">Yes, please.</div></div>
    <div class="row"><div class="bot">Done ✅ Free 30-day returns. Ready to checkout?</div></div>
    <div class="small">Demo mode: input disabled. The real app is fully interactive & connected to your store.</div>
    <div style="display:flex;gap:8px;margin-top:8px"><input disabled aria-disabled="true" placeholder="Type your question… (demo)"/></div>
  </div>
  ${back}
</div>`);
  });

  // ---- 2) Embed script ----
  app.get("/demo/embed.js", (_req,res) => {
    res.type("application/javascript").send(`(function(){
      if (window.__abandoDemoLoaded) return; window.__abandoDemoLoaded = true;
      function el(t,css,props){const e=document.createElement(t); if(css) Object.assign(e.style,css); if(props) for(const k in props) e[k]=props[k]; return e;}
      const MODAL_ID="ab-demo-modal", TITLE_ID="ab-demo-title";
      const btn = el("button",{position:"fixed",right:"18px",bottom:"18px",zIndex:999999,background:"#5b8cff",color:"#0b0b0c",border:"0",borderRadius:"999px",padding:"12px 16px",fontWeight:"800",cursor:"pointer",boxShadow:"0 6px 20px rgba(0,0,0,.35)"},{innerText:"Try the Abando demo"});
      btn.setAttribute("aria-haspopup","dialog"); btn.setAttribute("aria-expanded","false"); btn.setAttribute("aria-controls",MODAL_ID);
      const overlay = el("div",{position:"fixed",inset:"0",background:"rgba(0,0,0,.55)",backdropFilter:"blur(2px)",zIndex:999998,display:"none"}); overlay.setAttribute("aria-hidden","true");
      const modal = el("div",{position:"fixed",right:"18px",bottom:"78px",width:"min(420px,92vw)",height:"min(580px,80vh)",background:"#0b0b0c",border:"1px solid #222",borderRadius:"14px",overflow:"hidden",boxShadow:"0 10px 30px rgba(0,0,0,.45)",display:"none",zIndex:999999}); modal.id=MODAL_ID; modal.setAttribute("role","dialog"); modal.setAttribute("aria-modal","true"); modal.setAttribute("aria-labelledby",TITLE_ID);
      const bar = el("div",{height:"42px",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 10px",background:"#121214",borderBottom:"1px solid #222"});
      const title = el("div",null,{innerText:"Abando Demo"}); title.id=TITLE_ID;
      const x = el("button",{background:"transparent",border:"0",color:"#f2f2f2",fontSize:"18px",cursor:"pointer",padding:"6px"},{innerText:"×",title:"Close demo"});
      const frame = el("iframe",{border:"0",width:"100%",height:"calc(100% - 42px)"},{src:"/demo?embedded=1",allow:"clipboard-read; clipboard-write",tabIndex:"-1"});
      bar.appendChild(title); bar.appendChild(x); modal.appendChild(bar); modal.appendChild(frame);

      function open(){overlay.style.display="block"; overlay.setAttribute("aria-hidden","false"); modal.style.display="block"; btn.setAttribute("aria-expanded","true"); x.focus();}
      function close(){overlay.style.display="none"; overlay.setAttribute("aria-hidden","true"); modal.style.display="none"; btn.setAttribute("aria-expanded","false"); btn.focus();}
      btn.addEventListener("click",open); overlay.addEventListener("click",close); x.addEventListener("click",close);
      document.addEventListener("keydown",e=>{ if(e.key==="Escape") close(); if(e.key==="Tab"&&modal.style.display==="block"){e.preventDefault(); x.focus();}});
      document.body.appendChild(btn); document.body.appendChild(overlay); document.body.appendChild(modal);
    })();`);
  });
}
