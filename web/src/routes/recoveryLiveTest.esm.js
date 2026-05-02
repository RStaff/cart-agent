import { readFile, writeFile, mkdir } from "node:fs/promises";
import { sendAbandoRecoveryEmail } from "../lib/abandoRecoverySender.js";
import { sendRecoveryEmail, getEmailReadiness } from "../lib/emailSender.js";
import { sendRecoverySMS } from "../lib/smsSender.js";
import { generateRecoveryMessage } from "../lib/recoveryMessageEngine.js";
import { join } from "node:path";

export function installRecoveryLiveTestRoute(app, { repoRoot }) {
  const proofDir = join(repoRoot, "staffordos", "system_inventory", "output", "proof_runs");
  const latestProof = join(proofDir, "latest_abando_live_test_proof.json");

  async function saveProof(proof) {
    await mkdir(proofDir, { recursive: true });
    await writeFile(latestProof, JSON.stringify(proof, null, 2) + "\n");
  }

  app.post("/api/recovery-actions/send-live-test", async (req, res) => {
    const shop = String(req.body?.shop || "demo-shop.myshopify.com").trim();
    const email = String(req.body?.email || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const channel = String(req.body?.channel || "email").trim().toLowerCase();
    const experienceId = String(req.body?.experienceId || `staffordos-proof-${Date.now()}`).trim();
    const timestamp = new Date().toISOString();

    const eventData = {
      customer_email: email,
      email,
      phone,
      eventType: "checkout_started",
      storefront_host: shop,
      metadata: {
        source: "/demo/playground",
        proof_type: "abando_real_sender_attempt"
      }
    };

    const recovery_message = generateRecoveryMessage({
      shop,
      eventData,
      timestamp,
      baseUrl: process.env.ABANDO_PUBLIC_APP_ORIGIN || process.env.PUBLIC_APP_URL || "https://app.abando.ai",
      experienceId
    });

    const readiness = {
      email: getEmailReadiness(),
      sms: {
        ready: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM),
        provider: "twilio",
        missing_hint: [
          !process.env.TWILIO_ACCOUNT_SID ? "TWILIO_ACCOUNT_SID" : "",
          !process.env.TWILIO_AUTH_TOKEN ? "TWILIO_AUTH_TOKEN" : "",
          !process.env.TWILIO_FROM ? "TWILIO_FROM" : ""
        ].filter(Boolean)
      }
    };

    const sends = [];
    const errors = [];

    if (channel === "email") {
      if (!email) {
        errors.push({ channel: "email", error: "missing_email" });
      } else {
        const result = await sendAbandoRecoveryEmail({
        to: email,
        shop: shop
      });

        sends.push({
          channel: "email",
          to: email,
          success: Boolean(result?.success),
          provider: "smtp",
          messageId: result?.messageId || null,
          accepted: result?.accepted || (result?.success ? [email] : []),
          rejected: result?.rejected || []
        });

        if (!result?.success) {
          errors.push({ channel: "email", error: result?.error || result?.reason || "email_send_failed" });
        }
      }
    }

    if (channel === "sms") {
      if (!phone) {
        errors.push({ channel: "sms", error: "missing_phone" });
      } else {
        const result = await sendRecoverySMS({
          to: phone,
          message: recovery_message.smsText
        });

        sends.push({
          channel: "sms",
          to: phone,
          success: Boolean(result?.success),
          provider: "twilio",
          sid: result?.sid || result?.messageId || null
        });

        if (!result?.success) {
          errors.push({ channel: "sms", error: result?.error || result?.reason || "sms_send_failed" });
        }
      }
    }

    const anySuccess = sends.some((s) => s.success);
    const anyAttempt = sends.length > 0;

    const proof = {
      ok: anySuccess,
      status: anySuccess ? "REAL_SEND_SUCCEEDED" : anyAttempt ? "REAL_SEND_FAILED" : "NO_SEND_ATTEMPTED",
      generated_at: timestamp,
      completed_at: new Date().toISOString(),
      proof_type: "abando_real_sender_attempt",
      route: "/api/recovery-actions/send-live-test",
      source: "/demo/playground",
      shop,
      email,
      phone,
      channel,
      experienceId,
      readiness,
      recovery_message,
      sends,
      errors
    };

    await saveProof(proof);
    res.status(anySuccess ? 200 : 409).json(proof);
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
