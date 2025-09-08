import { Router } from "express";
const router = Router();

// Redirect legacy URL
router.get("/preview.html", (_req, res) => res.redirect(302, "/preview"));

router.get("/preview", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>abando.ai • Preview</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  :root{
    --bg:#0b0f19; --panel:#0f1629; --muted:#a9b1c6; --text:#eef2ff;
    --border:#243049; --accent:#7c5cff; --accent2:#22d3a6; --danger:#ff5c80;
  }
  html,body{height:100%} body{background:var(--bg);color:var(--text);}
  .card{background:var(--panel);border:1px solid var(--border);border-radius:16px;box-shadow:0 10px 30px rgba(12,16,24,.35)}
  .input{background:#0b1222;border:1px solid var(--border);border-radius:12px;padding:.7rem .9rem;outline:none}
  .input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(124,92,255,.25)}
  .btn{border-radius:12px;padding:.7rem 1rem;font-weight:600}
  .btn-primary{background:var(--accent);color:#fff}
  .btn-secondary{background:#1a2033;color:#fff;border:1px solid var(--border)}
  .badge{background:#121a2a;border:1px solid var(--border);border-radius:999px;padding:.25rem .6rem;color:var(--muted)}
  .pulse{box-shadow:0 0 0 0 rgba(34,211,166,.6);animation:pulse 2s infinite}
  @keyframes pulse{70%{box-shadow:0 0 0 12px rgba(34,211,166,0)}100%{box-shadow:0 0 0 0 rgba(34,211,166,0)}}
  .skel{position:relative;overflow:hidden;background:#10182833;border-radius:10px}
  .skel::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent);transform:translateX(-100%);animation:sh 1.2s infinite}
  @keyframes sh{to{transform:translateX(100%)}}
</style>
</head>
<body class="min-h-full">
  <div class="max-w-6xl mx-auto px-5 sm:px-6 py-7">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-5">
      <div class="w-8 h-8 rounded-xl" style="background:linear-gradient(135deg,var(--accent),var(--accent2))"></div>
      <div class="mr-2">
        <div class="font-bold text-lg">abando.ai Preview</div>
        <div class="text-[13px] text-[var(--muted)] -mt-0.5">Generate subject lines & emails from your API</div>
      </div>
      <span id="healthBadge" class="badge ml-auto">API: checking…</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- Controls -->
      <div class="card p-4 lg:p-5">
        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-[var(--muted)] mb-1">Tone</label>
            <select id="tone" class="input w-full"></select>
          </div>
          <div>
            <label class="block text-xs text-[var(--muted)] mb-1">Template</label>
            <select id="templateId" class="input w-full"></select>
          </div>
          <div>
            <label class="block text-xs text-[var(--muted)] mb-1">Customer name</label>
            <input id="name" class="input w-full" placeholder="e.g., Ross"/>
          </div>
          <div>
            <label class="block text-xs text-[var(--muted)] mb-1">Checkout URL (used in preview)</label>
            <input id="checkoutUrl" class="input w-full" placeholder="https://shop.example/checkout?token=..." />
          </div>
          <div>
            <label class="block text-xs text-[var(--muted)] mb-1">Discount code (optional)</label>
            <input id="discountCode" class="input w-full" placeholder="HELLO10"/>
          </div>
          <div>
            <label class="block text-xs text-[var(--muted)] mb-1">Discount %</label>
            <input id="discountPct" type="number" min="1" max="100" class="input w-full" placeholder="10"/>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs text-[var(--muted)] mb-1">Items (JSON array or one-per-line)</label>
            <textarea id="items" class="input w-full min-h-[120px]" placeholder='[
  {"title":"Fleece Hoodie","url":"https://shop.example/p/hoodie"},
  {"title":"Track Pants","url":"https://shop.example/p/pants"}
]
-- or --
Fleece Hoodie
Track Pants'></textarea>
          </div>
        </div>

        <div class="flex flex-wrap gap-3 items-center mt-4">
          <button id="genSubjects" class="btn btn-primary">✨ Generate Subjects</button>
          <button id="genEmail" class="btn btn-secondary">📧 Compose Email</button>
          <div class="text-[13px] text-[var(--muted)]">Subjects pick 3 by default; Email uses first tone’s subject unless you override.</div>
        </div>
      </div>

      <!-- Preview -->
      <div class="card p-4 lg:p-5">
        <!-- Inbox mock header -->
        <div class="rounded-xl border border-[var(--border)] bg-[#0c1224] p-3 mb-3">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--accent2)]"></div>
            <div class="min-w-0">
              <div id="mockSubject" class="font-semibold truncate">—</div>
              <div class="text-[12px] text-[var(--muted)] truncate">From: abando.ai &nbsp;·&nbsp; to: customer@example.com</div>
            </div>
          </div>
        </div>

        <!-- Subjects panel -->
        <div class="grid md:grid-cols-2 gap-4">
          <div class="rounded-xl border border-[var(--border)] p-3">
            <div class="flex items-center justify-between mb-2">
              <div class="font-semibold">Subjects</div>
              <button id="copySubject" class="btn btn-secondary !py-2 !px-3">Copy Subject</button>
            </div>
            <div class="bg-[#0b1222] rounded-xl p-3 min-h-[160px]">
              <div id="subjectHead" class="font-semibold mb-2">—</div>
              <ol id="subjectList" class="list-decimal pl-5 space-y-1 text-[var(--muted)]"></ol>
            </div>
          </div>

          <!-- Tabs + iframe -->
          <div class="rounded-xl border border-[var(--border)] p-3">
            <div class="flex items-center justify-between mb-2">
              <div class="font-semibold">Email Preview</div>
              <div class="flex gap-2">
                <button data-tab="render" class="tab btn btn-secondary !py-2 !px-3">Preview</button>
                <button data-tab="html" class="tab btn btn-secondary !py-2 !px-3">Raw HTML</button>
                <button id="copyHtml" class="btn btn-secondary !py-2 !px-3">Copy HTML</button>
              </div>
            </div>
            <div id="tab-render">
              <iframe id="htmlFrame" title="Email Preview" class="w-full h-[380px] rounded-xl border border-[var(--border)] bg-white"></iframe>
            </div>
            <div id="tab-html" class="hidden">
              <textarea id="htmlRaw" class="input w-full min-h-[380px] font-mono text-sm"></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- small footer -->
    <div class="mt-4 text-[12px] text-[var(--muted)]">Tip: The page swaps <code>{{'{{'}}checkout_url{{'}}'}}</code> with the Checkout URL above (client-side only for preview).</div>
  </div>

  <!-- Toast -->
  <div id="toast" class="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm bg-[#111827] border border-[var(--border)] opacity-0 pointer-events-none transition">
    Copied ✓
  </div>

  <script>
    (async function () {
      const $ = (s) => document.querySelector(s);
      const toneSel = $("#tone"), templateSel = $("#templateId");
      const nameInp = $("#name"), itemsTa = $("#items");
      const discountCode = $("#discountCode"), discountPct = $("#discountPct");
      const checkoutUrl = $("#checkoutUrl");
      const subjectHead = $("#subjectHead"), subjectList = $("#subjectList");
      const mockSubject = $("#mockSubject");
      const frame = $("#htmlFrame"); const htmlRaw = $("#htmlRaw");
      const toast = $("#toast");
      let lastSubjects = [];
      window.lastEmailHtml = "";

      // health badge
      try {
        const ok = await fetch("/api/preview/health").then(r => r.ok);
        const hb = $("#healthBadge");
        hb.textContent = ok ? "API: healthy" : "API: error";
        hb.className = "badge " + (ok ? "text-[var(--accent2)] pulse" : "text-[var(--danger)]");
      } catch { /* ignore */ }

      // templates / tones
      try {
        const meta = await fetch("/api/preview/templates").then(r => r.json());
        for (const t of meta.tones) {
          const o = document.createElement("option"); o.value=o.textContent=t; toneSel.appendChild(o);
        }
        for (const tpl of meta.templates) {
          const o = document.createElement("option"); o.value=tpl.id; o.textContent=tpl.name; templateSel.appendChild(o);
        }
        toneSel.value = "friendly"; templateSel.value = "short-n-sweet";
      } catch (e) { console.error(e); }

      function parseItems(raw) {
        const val=(raw||"").trim(); if(!val) return [];
        try{const j=JSON.parse(val); if(Array.isArray(j)) return j;}catch{}
        return val.split(/\\r?\\n/).map(s=>s.trim()).filter(Boolean);
      }

      function showSkeleton() {
        const sk = \`
          <!doctype html><html><head><meta charset="utf-8">
          <style>body{margin:0;background:#fff;font:16px/1.5 system-ui}
          .sk{height:18px;margin:18px;border-radius:6px;background:#eee;overflow:hidden;position:relative}
          .sk::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(0,0,0,.06),transparent);
            animation:sh 1.2s infinite;transform:translateX(-100%)}@keyframes sh{to{transform:translateX(100%)}}</style>
          </head><body>
          <div class="sk" style="width:70%"></div><div class="sk" style="width:94%"></div>
          <div class="sk" style="width:88%"></div><div class="sk" style="width:76%"></div></body></html>\`;
        frame.setAttribute("srcdoc", sk);
      }

      function injectHtml(html) {
        const checkout=(checkoutUrl.value||"").trim() || "https://shop.example/checkout/demo";
        const rendered=(html||"<p>(empty)</p>").replaceAll("{{checkout_url}}", checkout);
        const docHtml=\`
          <!doctype html><html><head><meta charset="utf-8"><meta name="color-scheme" content="light only">
          <style>body{font:16px/1.55 -apple-system,Segoe UI,Roboto,Arial;color:#111827;margin:0;padding:18px}
          a{color:#2563eb} p{margin:0 0 12px} ul{margin:0 0 12px 18px}</style></head>
          <body>\${rendered}</body></html>\`;
        frame.setAttribute("srcdoc", docHtml);
        htmlRaw.value = rendered;
        window.lastEmailHtml = rendered;
      }

      function toastOK(msg="Copied ✓"){
        toast.textContent = msg; toast.style.opacity = 1;
        setTimeout(()=>toast.style.opacity=0, 900);
      }

      function typeSubject(text){
        mockSubject.textContent = "";
        let i=0; const id=setInterval(()=>{
          mockSubject.textContent = text.slice(0, ++i);
          if(i>=text.length) clearInterval(id);
        }, 12);
      }

      // tabs
      document.querySelectorAll(".tab").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          const tab = btn.dataset.tab;
          $("#tab-render").classList.toggle("hidden", tab!=="render");
          $("#tab-html").classList.toggle("hidden", tab!=="html");
        });
      });

      // actions
      $("#copySubject").addEventListener("click", async ()=>{
        const s = subjectHead.textContent.trim(); if(!s) return;
        await navigator.clipboard.writeText(s); toastOK();
      });
      $("#copyHtml").addEventListener("click", async ()=>{
        if(!window.lastEmailHtml) return;
        await navigator.clipboard.writeText(window.lastEmailHtml); toastOK();
      });

      $("#genSubjects").addEventListener("click", async ()=>{
        const tone=toneSel.value, name=nameInp.value.trim(), items=parseItems(itemsTa.value);
        try{
          const data = await fetch("/api/preview/subject", {
            method:"POST", headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ tone, name, items, count:3 })
          }).then(r=>r.json());
          lastSubjects = data.subjects || [];
          subjectHead.textContent = lastSubjects[0] || "—";
          typeSubject(lastSubjects[0] || "—");
          subjectList.innerHTML = "";
          lastSubjects.forEach((s, i)=>{
            const li=document.createElement("li"); li.textContent = s; subjectList.appendChild(li);
          });
          // auto-compose
          $("#genEmail").click();
        }catch(e){
          subjectHead.textContent="(error generating subjects)";
          console.error(e);
        }
      });

      $("#genEmail").addEventListener("click", async ()=>{
        const tone=toneSel.value, templateId=templateSel.value, name=nameInp.value.trim(), items=parseItems(itemsTa.value);
        const discount = (discountCode.value.trim() && discountPct.value) ? { code:discountCode.value.trim(), pct:Number(discountPct.value)||10 } : undefined;
        try{
          showSkeleton();
          const data = await fetch("/api/preview/email", {
            method:"POST", headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ templateId, tone, name, items, discount })
          }).then(r=>r.json());
          subjectHead.textContent = data.subject || "—";
          typeSubject(data.subject || "—");
          injectHtml(data.html || "<p>(empty)</p>");
        }catch(e){
          subjectHead.textContent="(error composing email)";
          injectHtml("<p style='color:#b91c1c'>Failed to compose email.</p>");
          console.error(e);
        }
      });

      // boot
      window.addEventListener("load", ()=> { $("#genSubjects").click(); });
    })();
  </script>
</body>
</html>`);
});
export default router;
