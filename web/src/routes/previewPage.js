import { Router } from "express";

const router = Router();

router.get("/preview", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>abando.ai • Preview</title>
<style>
  :root { --bg:#0b0c10; --panel:#101218; --muted:#9aa3af; --text:#e5e7eb; --accent:#3b82f6; --accent-2:#22c55e; --red:#ef4444; }
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--text);font:14px/1.4 ui-sans-serif,system-ui,Segoe UI,Roboto,Inter,Arial}
  a{color:var(--accent)} .container{max-width:1100px;margin:24px auto;padding:0 16px}
  .header{display:flex;gap:12px;align-items:center;margin-bottom:16px}
  .logo{width:28px;height:28px;border-radius:6px;background:linear-gradient(135deg,var(--accent),var(--accent-2))}
  .card{background:var(--panel);border:1px solid #222534;border-radius:12px;padding:16px}
  .grid{display:grid;grid-template-columns:1.1fr 1fr;gap:16px}
  .row{display:flex;gap:12px;flex-wrap:wrap}
  label{display:block;margin:6px 0 6px 2px;color:var(--muted);font-size:12px}
  input,select,textarea{width:100%;background:#0f1117;border:1px solid #2a2f3a;border-radius:10px;color:var(--text);padding:10px 12px}
  textarea{min-height:96px;resize:vertical}
  button{background:var(--accent);color:#fff;border:0;border-radius:10px;padding:10px 14px;cursor:pointer}
  button.secondary{background:#1f2430}
  button.ghost{background:transparent;border:1px solid #2a2f3a}
  .toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .badge{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#151927;border:1px solid #242b38;font-size:12px;color:var(--muted)}
  .preview-card{background:#0f1117;border:1px dashed #303646;border-radius:12px;padding:16px;min-height:200px}
  .subject{font-weight:600;font-size:15px;margin-bottom:8px}
  .muted{color:var(--muted)}
  .split{display:flex;gap:16px;flex-wrap:wrap}
  iframe{width:100%;height:360px;border:1px solid #2a2f3a;border-radius:10px;background:white}
  .footer{margin-top:18px;font-size:12px;color:var(--muted)}
  .hint{font-size:12px;color:var(--muted)}
  .ok{color:var(--accent-2)} .err{color:var(--red)}
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
        <div style="min-width:240px;flex:1">
          <label>Tone</label>
          <select id="tone"></select>
        </div>
        <div style="min-width:240px;flex:1">
          <label>Template</label>
          <select id="templateId"></select>
        </div>
        <div style="min-width:240px;flex:1">
          <label>Customer name</label>
          <input id="name" placeholder="e.g., Ross" />
        </div>
        <div style="min-width:260px;flex:1">
          <label>Checkout URL (used in preview)</label>
          <input id="checkoutUrl" placeholder="https://shop.example/checkout?token=..." />
        </div>
      </div>

      <div class="row">
        <div style="min-width:260px;flex:1">
          <label>Discount code (optional)</label>
          <input id="discountCode" placeholder="HELLO10" />
        </div>
        <div style="min-width:200px;max-width:240px">
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
        <span class="hint">Subjects pick 3 by default; Email uses first tone’s subject unless you override.</span>
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
        <div class="split">
          <iframe id="htmlFrame"></iframe>
        </div>
      </div>
    </div>

    <div class="footer">
      Tip: Your API returns <code>{{checkout_url}}</code> placeholders—this page swaps them with the Checkout URL you enter above (client-side only for preview).
    </div>
  </div>

  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <script>
    (async function () {
      const $ = (sel) => document.querySelector(sel);
      const healthBadge = $("#healthBadge");
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
      let lastHtml = "";

      try {
        const ok = await fetch("/api/preview/health").then(r => r.ok);
        healthBadge.textContent = ok ? "API: healthy" : "API: error";
        healthBadge.className = "badge " + (ok ? "ok" : "err");
      } catch {
        healthBadge.textContent = "API: error";
        healthBadge.className = "badge err";
      }

      try {
        const meta = await fetch("/api/preview/templates").then(r => r.json());
        for (const t of meta.tones) {
          const o = document.createElement("option");
          o.value = o.textContent = t;
          toneSel.appendChild(o);
        }
        for (const tpl of meta.templates) {
          const o = document.createElement("option");
          o.value = tpl.id; o.textContent = tpl.name;
          templateSel.appendChild(o);
        }
        toneSel.value = "friendly";
        templateSel.value = "short-n-sweet";
      } catch (e) {
        console.error(e);
      }

      function parseItems(raw) {
        const val = raw.trim();
        if (!val) return [];
        try {
          const j = JSON.parse(val);
          if (Array.isArray(j)) return j;
        } catch {}
        return val.split(/\\r?\\n/).map(s => s.trim()).filter(Boolean);
      }

      function injectHtml(html) {
        const checkout = checkoutUrl.value.trim() || "https://shop.example/checkout/demo";
        const rendered = html.replaceAll("{{checkout_url}}", checkout);
        lastHtml = rendered;
        const doc = frame.contentDocument || frame.contentWindow.document;
        doc.open();
        doc.write(\`<!doctype html><html><head><meta charset="utf-8"><meta name="color-scheme" content="light only"></head><body>\${rendered}</body></html>\`);
        doc.close();
      }

      $("#genSubjects").addEventListener("click", async () => {
        const tone = toneSel.value;
        const name = nameInp.value.trim();
        const items = parseItems(itemsTa.value);
        const res = await fetch("/api/preview/subject", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tone, name, items, count: 3 })
        });
        const data = await res.json();
        lastSubjects = data.subjects || [];
        subjectText.textContent = lastSubjects[0] || "—";
        subjectList.innerHTML = "";
        lastSubjects.forEach(s => {
          const li = document.createElement("li");
          li.textContent = s;
          subjectList.appendChild(li);
        });
      });

      $("#genEmail").addEventListener("click", async () => {
        const tone = toneSel.value;
        const templateId = templateSel.value;
        const name = nameInp.value.trim();
        const items = parseItems(itemsTa.value);
        const discount = (discountCode.value.trim() && discountPct.value)
          ? { code: discountCode.value.trim(), pct: Number(discountPct.value) || 10 }
          : undefined;

        const res = await fetch("/api/preview/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId, tone, name, items, discount })
        });
        const data = await res.json();
        subjectText.textContent = data.subject || "—";
        subjectList.innerHTML = "";
        injectHtml(data.html || "<p>(empty)</p>");
      });

      $("#copySubject").addEventListener("click", async () => {
        const s = subjectText.textContent.trim();
        if (!s) return;
        await navigator.clipboard.writeText(s);
        const old = subjectText.textContent;
        subjectText.textContent = "Copied ✓";
        setTimeout(() => subjectText.textContent = old, 700);
      });

      $("#copyHtml").addEventListener("click", async () => {
        if (!lastHtml) return;
        await navigator.clipboard.writeText(lastHtml);
        const btn = $("#copyHtml");
        const old = btn.textContent;
        btn.textContent = "Copied ✓";
        setTimeout(() => btn.textContent = old, 700);
      });
    })();
  </script>
</body>
</html>`);
});

export default router;
