import fs from 'node:fs'; import path from 'node:path';
const ROOT=process.cwd();
const SRC = path.join(ROOT,'web','src');
const PUB = path.join(SRC,'public');
const ASSETS = path.join(PUB,'assets');
const INDEX = path.join(SRC,'index.js');
const DASH  = path.join(PUB,'dashboard','index.html');
const MAIN  = path.join(ASSETS,'main.js');
const CSS   = path.join(ASSETS,'style.css');

const r = p => fs.existsSync(p) ? fs.readFileSync(p,'utf8') : '';
const w = (p,s)=>{ fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,s); console.log('✏️  wrote', p.replace(ROOT+'/','')); };

/* ---------- 1) /healthz + DB retry + /api/stats/demo ---------- */
{
  let s = r(INDEX);
  if (!s) throw new Error('web/src/index.js not found');

  // Add /healthz
  if (!/app\.get\("\/healthz"/.test(s)) {
    const block = `
/* === healthz: app + optional DB status === */
app.get("/healthz", async (_req,res)=>{
  const info = { ok:true, db:{ ok:false } };
  try{
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    try { await prisma.$queryRaw\`SELECT 1\`; info.db.ok = true; }
    catch(e){ info.db.error = String(e); }
    finally { await prisma.$disconnect().catch(()=>{}); }
  } catch { /* prisma not present at runtime; fine */ }
  res.status(200).json(info);
});
`;
    s += '\n' + block;
  }

  // Add DB startup retry (non-fatal; logs only)
  if (!/async function waitForDB/.test(s)) {
    const block = `
/* === best-effort DB warmup with retry === */
async function waitForDB(max=12, delayMs=2500){
  try{
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    for (let i=1;i<=max;i++){
      try { await prisma.$queryRaw\`SELECT 1\`; console.log("[db] ready on attempt", i); break; }
      catch(e){ console.warn("[db] not ready (attempt", i, "of", max+"):", String(e)); if (i===max) { console.warn("[db] continuing without DB"); } await new Promise(r=>setTimeout(r,delayMs)); }
    }
    await prisma.$disconnect().catch(()=>{});
  } catch { console.log("[db] prisma not present; skipping warmup"); }
}
waitForDB().catch(()=>{});
`;
    s += '\n' + block;
  }

  // Add /api/stats/demo (deterministic demo stats)
  if (!/app\.get\("\/api\/stats\/demo"/.test(s)) {
    const block = `
/* === demo stats endpoint === */
app.get("/api/stats/demo", (req,res)=>{
  const seedStr = (req.query.seed || "abando") + ":" + new Date().toISOString().slice(0,10);
  let h=2166136261>>>0;
  for (let i=0;i<seedStr.length;i++){ h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
  function rand(){ h += 0x6D2B79F5; let t=Math.imul(h^h>>>15,1|h); t^=t+Math.imul(t^t>>>7,61|t); return ((t^t>>>14)>>>0)/4294967296; }
  const days=7, rev=[], ord=[], ctr=[];
  for(let i=0;i<days;i++){ rev.push(Math.round(900 + rand()*900)); ord.push(Math.max(1, Math.round(8 + rand()*10))); ctr.push(+ (3 + rand()*2).toFixed(1)); }
  const totals={ revenue: rev.reduce((a,b)=>a+b,0), orders: ord.reduce((a,b)=>a+b,0), ctr: ctr[ctr.length-1] };
  res.json({ days, rev, ord, ctr, totals, demo:true });
});
`;
    s += '\n' + block;
  }

  w(INDEX, s);
}

/* ---------- 2) Dashboard HTML: add a tiny "Demo data" badge spot ---------- */
{
  let h = r(DASH);
  if (h && !/id="stats-badge"/.test(h)) {
    h = h.replace(/<h1>[^<]*Dashboard[^<]*<\/h1>/i, match => `${match} <span id="stats-badge" class="badge">Loading…</span>`);
    w(DASH, h);
  }
}

/* ---------- 3) Front-end: fetch stats endpoint; fallback to existing demo ---------- */
{
  let js = r(MAIN);
  const marker = '/* === dashboard stats via API === */';
  if (js && !js.includes(marker)) {
    js += `
${marker}
(function(){
  function $(id){ return document.getElementById(id); }
  function dollars(n){ return '$'+(n||0).toLocaleString(); }
  function pct(n){ return (n||0).toFixed ? (n||0).toFixed(1)+'%' : (n+'%'); }
  function spark(elId, data){
    const el = $(elId); if (!el) return;
    const w = el.clientWidth || 220, h = el.clientHeight || 44;
    const max = Math.max(...data, 1), min = Math.min(...data, 0);
    const xs = data.map((_,i)=> i*(w/(data.length-1||1)));
    const ys = data.map(v => h - ((v-min)/(max-min||1))*(h-6) - 3);
    const d  = xs.map((x,i)=>(i?'L':'M')+x.toFixed(1)+','+ys[i].toFixed(1)).join(' ');
    el.innerHTML = '<svg width="'+w+'" height="'+h+'"><path d="'+d+'" fill="none" stroke="currentColor" stroke-width="2" opacity="0.9"/></svg>';
  }
  async function load(){
    const badge = $('stats-badge');
    try{
      const r = await fetch('/api/stats/demo');
      if (!r.ok) throw new Error('bad status '+r.status);
      const j = await r.json();
      if ($('kpi-rev')) $('kpi-rev').textContent = dollars(j.totals.revenue);
      if ($('kpi-ord')) $('kpi-ord').textContent = j.totals.orders;
      if ($('kpi-ctr')) $('kpi-ctr').textContent = pct(j.totals.ctr);
      spark('spark-rev', j.rev); spark('spark-ord', j.ord); spark('spark-ctr', j.ctr);
      if (badge) { badge.textContent = 'Demo data'; badge.classList.add('ok'); }
    }catch(e){
      if (badge) { badge.textContent = 'Offline demo'; badge.classList.add('warn'); }
      // falls back to existing random demo (if present)
      document.dispatchEvent(new Event('dashboard-demo-fallback'));
    }
  }
  document.addEventListener('DOMContentLoaded', load);
})();
`;
    w(MAIN, js);
  }

  let css = r(CSS);
  if (css && !/badge\}/.test(css)) {
    css += `
/* tiny badge */
.badge{display:inline-block;margin-left:.5rem;font-size:.75rem;padding:.15rem .4rem;border-radius:6px;border:1px solid var(--border);color:#cbd5e1}
.badge.ok{border-color:#16a34a}
.badge.warn{border-color:#f59e0b}
`;
    w(CSS, css);
  }
}

console.log('✅ Added /healthz + DB warmup + /api/stats/demo + dashboard fetch.');
