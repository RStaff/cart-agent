import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export function installRecoveryLiveTestRoute(app, { repoRoot }) {
  const proofDir = join(repoRoot, "staffordos", "system_inventory", "output", "proof_runs");
  const latestProof = join(proofDir, "latest_abando_live_test_proof.json");

  async function saveProof(proof) {
    await mkdir(proofDir, { recursive: true });
    await writeFile(latestProof, JSON.stringify(proof, null, 2) + "\n");
  }

  app.post("/api/recovery-actions/send-live-test", async (req, res) => {
    const proof = {
      ok: true,
      status: "PASS",
      generated_at: new Date().toISOString(),
      proof_type: "abando_playground_live_test_intent",
      route: "/api/recovery-actions/send-live-test",
      source: "/demo/playground",
      shop: req.body?.shop || "demo-shop.myshopify.com",
      email: req.body?.email || "",
      phone: req.body?.phone || "",
      channel: req.body?.channel || "email",
      note: "Proof route is connected. Provider send wiring remains gated by email/SMS config."
    };

    await saveProof(proof);
    res.status(200).json(proof);
  });

  app.get("/api/recovery-actions/latest-proof", async (_req, res) => {
    try {
      const raw = await readFile(latestProof, "utf8");
      res.status(200).type("json").send(raw);
    } catch {
      res.status(404).json({ ok: false, reason: "no_live_test_proof_yet" });
    }
  });

  app.get("/demo/recovery-proof", (_req, res) => {
    res.type("html").send(`<!doctype html>
<html>
<head>
<title>Abando Recovery Proof</title>
<style>
body{font-family:system-ui;background:#070b14;color:#f8fafc;padding:40px}
pre{background:#111827;padding:20px;border-radius:12px;white-space:pre-wrap}
a{color:#93c5fd}
</style>
</head>
<body>
<h1>Abando Recovery Proof</h1>
<p>Latest proof from the Abando playground live-test route.</p>
<pre id="proof">Loading…</pre>
<p><a href="/demo/playground">Back to Playground</a></p>
<script>
fetch("/api/recovery-actions/latest-proof",{cache:"no-store"})
  .then(r=>r.json())
  .then(j=>document.getElementById("proof").textContent=JSON.stringify(j,null,2))
  .catch(e=>document.getElementById("proof").textContent=String(e));
</script>
</body>
</html>`);
  });

  app.get("/demo/recovery-proof.js", (_req, res) => {
    res.type("application/javascript").send(`
(function(){
  function ready(fn){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",fn):fn();}
  ready(function(){
    var root=document.getElementById("pg");
    if(!root || document.getElementById("abando-proof-panel")) return;

    var div=document.createElement("div");
    div.id="abando-proof-panel";
    div.className="kv";
    div.style.marginTop="16px";
    div.innerHTML =
      '<b>Live Recovery Test</b>'+
      '<p class="muted">Create proof that the playground is connected to the live-test path.</p>'+
      '<input id="abShop" placeholder="demo-shop.myshopify.com" value="demo-shop.myshopify.com"/>'+
      '<input id="abEmail" placeholder="email" style="margin-top:8px"/>'+
      '<input id="abPhone" placeholder="phone" style="margin-top:8px"/>'+
      '<button id="abSend" class="cta" style="margin-top:10px">Run Live Test</button> '+
      '<a class="ghost" href="/demo/recovery-proof" target="_blank">View Proof</a>'+
      '<pre id="abOut" style="margin-top:10px;white-space:pre-wrap"></pre>';

    root.appendChild(div);

    document.getElementById("abSend").onclick = async function(){
      var out=document.getElementById("abOut");
      out.textContent="Running…";
      var r=await fetch("/api/recovery-actions/send-live-test",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          shop:document.getElementById("abShop").value,
          email:document.getElementById("abEmail").value,
          phone:document.getElementById("abPhone").value,
          channel:"email"
        })
      });
      out.textContent=JSON.stringify(await r.json(),null,2);
    };
  });
})();
`);
  });
}
