import { Router } from "express";

const router = Router();

// Redirect legacy URL -> live preview
router.get("/preview.html", (_req,res) => res.redirect(302, "/preview"));

router.get("/preview", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>abando.ai • Preview</title>
<style>
  :root {
    --bg:#0a0c12;
    --panel:#0f1420;
    --muted:#a4afc0;
    --text:#eef2f8;
    --border:#253049;
    --accent:#7c5cff;      /* primary */
    --accent-2:#32d583;    /* success */
    --accent-3:#00b3ff;    /* info */
    --danger:#ff5c80;
    --shadow: 0 10px 30px rgba(12,16,24,.35);
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--text);font:14px/1.45 Inter,ui-sans-serif,system-ui,Segoe UI,Roboto,Arial}
  a{color:var(--accent-3)}
  .container{max-width:1100px;margin:28px auto;padding:0 18px}
  .header{display:flex;gap:12px;align-items:center;margin-bottom:18px}
  .logo{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,var(--accent),var(--accent-2));box-shadow:var(--shadow)}
  .badge{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#121a2a;border:1px solid var(--border);font-size:12px;color:var(--muted)}
  .ok{color:var(--accent-2)} .err{color:var(--danger)}
  .card{background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:16px;box-shadow:var(--shadow)}
  .grid{display:grid;grid-template-columns:1.05fr 1fr;gap:18px}
  .row{display:flex;gap:12px;flex-wrap:wrap}
  label{display:block;margin:6px 0 6px 2px;color:var(--muted);font-size:12px}
  input,select,textarea{
    width:100%;background:#0b101a;border:1px solid var(--border);border-radius:12px;
    color:var(--text);padding:11px 12px;outline:none
  }
  input:focus,select:focus,textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(124,92,255,.25)}
  textarea{min-height:110px;resize:vertical}
  button{
    background:var(--accent);color:#fff;border:0;border-radius:12px;padding:11px 16px;
    cursor:pointer;font-weight:600;transition:filter .15s ease, transform .02s ease
  }
  button:hover{filter:brightness(1.08)}
  button:active{transform:translateY(1px)}
  button.secondary{background:#182032;color:var(--text)}
  button.ghost{background:transparent;border:1px solid var(--border)}
  .toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  .preview-card{background:#0b101a;border:1px dashed var(--border);border-radius:12px;padding:16px;min-height:220px}
  .subject{font-weight:700;font-size:16px;margin-bottom:10px}
  .muted{color:var(--muted)}
  iframe{width:100%;height:420px;border:1px solid var(--border);border-radius:12px;background:#fff}
  .footer{margin-top:18px;font-size:12px;color:var(--muted)}
  .skel{position:relative;overflow:hidden;background:#10182820;border-radius:8px}
  .skel::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent);
    transform:translateX(-100%);animation:sh 1.2s infinite}
  @keyframes sh{to{transform:translateX(100%)}}
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"></div>
      <div>
        <div style="font-weight:700">abando.ai Preview</div>
        <div class="muted">Generate subject lines & emails from your API</div>
      </div>
      <span class="badge" id="healthBadge">API: checking…</span>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="row">
        <div style="min-width:220px;flex:1">
          <label>Tone</label>
          <select id="tone"></select>
        </div>
        <div style="min-width:220px;flex:1">
          <label>Template</label>
          <select id="templateId"></select>
        </div>
        <div style="min-width:220px;flex:1">
          <label>Customer name</label>
          <input id="name" placeholder="e.g., Ross" />
        </div>
        <div style="min-width:260px;flex:1">
          <label>Checkout URL (used in preview)</label>
          <input id="checkoutUrl" placeholder="https://shop.example/checkout?token=..." />
        </div>
      </div>

      <div class="row">
        <div style="min-width:220px;flex:1">
          <label>Discount code (optional)</label>
          <input id="discountCode" placeholder="HELLO10" />
        </div>
        <div style="min-width:160px;max-width:220px">
          <label>Discount %</label>
          <input id="discountPct" type="number" min="1" max="100" placeholder="10" />
        </div>
        <div style="min-width:300px;flex:2">
          <label>Items (JSON array or one-per-line)</label>
          <textarea id="items" placeholder='[
  {"title":"Fleece Hoodie","url":"https://shop.example/p/hoodie"},
  {"title":"Track Pants","url":"https://shop.example/p/pants"}
]
-- or --
Fleece Hoodie
Track Pants'></textarea>
        </div>
      </div>

      <div class="toolbar" style="margin-top:10px">
        <button id="genSubjects">Generate Subjects</button>
        <button class="secondary" id="genEmail">Compose Email</button>
        <span class="muted">Subjects pick 3 by default; Email uses first tone’s subject unless you override.</span>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="row" style="justify-content:space-between;align-items:center">
          <div style="font-weight:600">Subjects</div>
          <div class="toolbar">
            <button class="ghost" id="copySubject">Copy Subject</button>
          </div>
        </div>
        <div class="preview-card">
          <div class="subject" id="subjectText">—</div>
          <ol id="subjectList" class="muted" style="padding-left:18px;margin:6px 0 0 0"></ol>
        </div>
      </div>

      <div class="card">
        <div class="row" style="justify-content:space-between;align-items:center">
          <div style="font-weight:600">Email Preview</div>
          <div class="toolbar">
            <button class="ghost" id="copyHtml">Copy HTML</button>
          </div>
        </div>
        <iframe id="htmlFrame" title="Email Preview"></iframe>
      </div>
    </div>

    <div class="footer">
      Tip: The page swaps <code>{{checkout_url}}</code> with the Checkout URL above (client-side only for preview).
    </div>
  </div>

  <script>
    (async function () {
      const $ = (sel) => document.querySelector(sel);
      const toneSel = $("#tone");
      const templateSel = $("#templateId");
      const nameInp = $("#name");
      const itemsTa = $("#items");
      const discountCode = $("#discountCode");
      const discountPct = $("#discountPct");
      const checkoutUrl = $("#checkoutUrl");
      const subjectText = $("#subjectText");
      const subjectList = $("#subjectList");
      const frame = $("#htmlFrame");
      let lastSubjects = [];
      window.lastEmailHtml = "";

      // Health badge
      try {
        const ok = await fetch("/api/preview/health").then(r => r.ok);
        const hb = $("#healthBadge");
        hb.textContent = ok ? "API: healthy" : "API: error";
        hb.className = "badge " + (ok ? "ok" : "err");
      } catch {
        const hb = $("#healthBadge");
        hb.textContent = "API: error";
        hb.className = "badge err";
      }

      // Load tones/templates
      try {
        const meta = await fetch("/api/preview/templates").then(r => r.json());
        for (const t of meta.tones) {
          const o = document.createElement("option"); o.value = o.textContent = t; toneSel.appendChild(o);
        }
        for (const tpl of meta.templates) {
          const o = document.createElement("option"); o.value = tpl.id; o.textContent = tpl.name; templateSel.appendChild(o);
        }
        toneSel.value = "friendly";
        templateSel.value = "short-n-sweet";
      } catch (e) {
        console.error(e);
      }

      function parseItems(raw) {
        const val = (raw||"").trim();
        if (!val) return [];
        try { const j = JSON.parse(val); if (Array.isArray(j)) return j; } catch {}
        return val.split(/\\r?\\n/).map(s => s.trim()).filter(Boolean);
      }

      function showPreviewSkeleton() {
        frame.setAttribute("srcdoc",
          \`<!doctype html><html><head><meta charset="utf-8">
           <style>body{margin:0;background:#fff;font:16px/1.5 system-ui}
           .sk{height:18px;margin:18px;border-radius:6px;background:#eee;overflow:hidden;position:relative}
           .sk::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(0,0,0,.06),transparent);
                      animation:sh 1.2s infinite;transform:translateX(-100%)}@keyframes sh{to{transform:translateX(100%)}}
           </style></head><body>
           <div class="sk" style="width:70%"></div>
           <div class="sk" style="width:94%"></div>
           <div class="sk" style="width:88%"></div>
           <div class="sk" style="width:76%"></div>
           </body></html>\`
        );
      }

      function injectHtml(html) {
        const checkout = (checkoutUrl.value || "").trim() || "https://shop.example/checkout/demo";
        const rendered = (html || "<p>(empty)</p>").replaceAll("{{checkout_url}}", checkout);
        const docHtml =
          \`<!doctype html><html><head>
             <meta charset="utf-8">
             <meta name="color-scheme" content="light only">
             <style>
               body{font:16px/1.5 -apple-system,Segoe UI,Roboto,Arial; color:#111827; margin:0; padding:18px;}
               a{color:#2563eb} p{margin:0 0 12px} ul{margin:0 0 12px 18px}
             </style>
           </head><body>\${rendered}</body></html>\`;
        try { frame.setAttribute("srcdoc", docHtml); } catch (e) {
          const doc = frame.contentDocument || frame.contentWindow.document;
          doc.open(); doc.write(docHtml); doc.close();
        }
        window.lastEmailHtml = rendered;
      }

      // Actions
      $("#copySubject").addEventListener("click", async () => {
        const s = subjectText.textContent.trim(); if (!s) return;
        await navigator.clipboard.writeText(s);
        const old = subjectText.textContent; subjectText.textContent = "Copied ✓";
        setTimeout(() => subjectText.textContent = old, 700);
      });

      $("#copyHtml").addEventListener("click", async () => {
        if (!window.lastEmailHtml) return;
        await navigator.clipboard.writeText(window.lastEmailHtml);
        const btn = $("#copyHtml"); const old = btn.textContent; btn.textContent = "Copied ✓";
        setTimeout(() => btn.textContent = old, 700);
      });

      $("#genSubjects").addEventListener("click", async () => {
        const tone = toneSel.value;
        const name = nameInp.value.trim();
        const items = parseItems(itemsTa.value);
        try {
          const data = await fetch("/api/preview/subject", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tone, name, items, count: 3 })
          }).then(r => r.json());
          lastSubjects = data.subjects || [];
          subjectText.textContent = lastSubjects[0] || "—";
          subjectList.innerHTML = "";
          lastSubjects.forEach((s,i) => {
            const li = document.createElement("li"); li.textContent = \`\${i+1}. \${s}\`; subjectList.appendChild(li);
          });
          // auto-compose after subjects so preview isn't blank
          $("#genEmail").click();
        } catch (e) {
          subjectText.textContent = "(error generating subjects)";
          console.error(e);
        }
      });

      $("#genEmail").addEventListener("click", async () => {
        const tone = toneSel.value;
        const templateId = templateSel.value;
        const name = nameInp.value.trim();
        const items = parseItems(itemsTa.value);
        const discount = (discountCode.value.trim() && discountPct.value)
          ? { code: discountCode.value.trim(), pct: Number(discountPct.value) || 10 }
          : undefined;
        try {
          showPreviewSkeleton();
          const data = await fetch("/api/preview/email", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ templateId, tone, name, items, discount })
          }).then(r => r.json());
          subjectText.textContent = data.subject || "—";
          subjectList.innerHTML = "";
          injectHtml(data.html || "<p>(empty)</p>");
        } catch (e) {
          subjectText.textContent = "(error composing email)";
          injectHtml("<p style='color:#b91c1c'>Failed to compose email.</p>");
          console.error(e);
        }
      });

      // Render immediately on load
      window.addEventListener("load", () => { $("#genSubjects").click(); });
    })();
  </script>
</body>
</html>`);
});

export default router;
