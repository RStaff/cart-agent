/* wire_ai_on_run.mjs — Idempotent patcher:
   - Adds /api/ai/rewrite if missing
   - Adds "Use AI on run" toggle to Playground
   - Wires Run button to call AI rewrite and update preview
*/
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC  = path.join(ROOT, 'web','src');
const PUB  = path.join(SRC, 'public');
const MAIN = path.join(PUB, 'assets','main.js');
const PLAY = path.join(PUB, 'demo','playground','index.html');
const INDEX_JS = path.join(SRC, 'index.js');

const read = p => fs.existsSync(p) ? fs.readFileSync(p,'utf8') : '';
const write= (p,s)=>{ fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,s); console.log('✏️  wrote', p.replace(ROOT+'/','')); };

/* 1) Server route: /api/ai/rewrite */
{
  let s = read(INDEX_JS);
  if (!/app\.post\("\/api\/ai\/rewrite"/.test(s)) {
    const block = `
/* === AI rewrite proxy (OpenAI) === */
app.post("/api/ai/rewrite", express.json(), async (req,res) => {
  try {
    const { prompt, base, persona } = req.body || {};
    const personaStyle = persona === 'kevin'   ? "concise, high-energy, humorous (Kevin Hart vibe)."
                      : persona === 'beyonce' ? "empowering, elegant, confident (Beyoncé vibe)."
                      : persona === 'taylor'  ? "friendly, witty, warm (Taylor Swift vibe)."
                      : "on-brand, helpful, conversion-focused.";
    const sys = "You are a cart recovery copywriter. Keep messages brief, plain, and conversion-focused. Avoid over-promising. One clear CTA. Keep it brand-safe and non-infringing.";
    const user = \`Rewrite this cart-recovery message in a \${personaStyle} tone. Do not claim to be the celebrity or imply endorsement.\\n\\n\${base}\\n\\nExtra guidance: \${prompt || "make it punchy, friendly, and high-converting"}\`;
    const key = process.env.OPENAI_API_KEY;
    if (!key) return res.status(200).json({ text: base, note: "OPENAI_API_KEY missing: returning base" }); // non-breaking fallback
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method:"POST",
      headers:{ "Authorization":"Bearer "+key, "Content-Type":"application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.65,
        messages: [{role:"system", content:sys},{role:"user", content:user}]
      })
    });
    const j = await r.json();
    const text = j?.choices?.[0]?.message?.content?.trim();
    res.status(200).json({ text: text || base });
  } catch (e) {
    res.status(200).json({ text: (req.body?.base || ''), note: "rewrite error: "+String(e) });
  }
});
`;
    s += '\n' + block + '\n';
    write(INDEX_JS, s);
  } else {
    console.log('• /api/ai/rewrite already present');
  }
}

/* 2) Playground HTML: add Use-AI toggle (once) */
{
  let h = read(PLAY);
  if (!h) throw new Error('Playground HTML not found');

  // Ensure Abando™ superscript (idempotent)
  h = h.replace(/class="logo">Abando™<\/a>/g,'class="logo">Abando<sup>™</sup></a>')
       .replace(/class="logo">Abando<\/a>/g,'class="logo">Abando<sup>™</sup></a>');

  // Insert the toggle near the Run button if missing
  if (!/id="use-ai-on-run"/.test(h)) {
    // Try to find the action row that contains id="generate" button
    h = h.replace(
      /(<button[^>]*id="generate"[^>]*>[^<]*<\/button>)/,
      `$1
       <label style="display:inline-flex;align-items:center;gap:.4rem;margin-left:.5rem">
         <input id="use-ai-on-run" type="checkbox" checked>
         <span class="small">Use AI on run</span>
       </label>`
    );
    write(PLAY, h);
  } else {
    console.log('• Use-AI toggle already present');
  }
}

/* 3) Client JS: wire Run to AI rewrite (append small IIFE, safe if re-run) */
{
  let js = read(MAIN);
  const marker = '/* === AI on Run (rewrite) === */';
  if (!js.includes(marker)) {
    const add = `
${marker}
(function(){
  const q = (id)=>document.getElementById(id);
  const preview = q('preview-message');
  const runBtn  = q('generate');
  const useAI   = q('use-ai-on-run') || { checked: true };

  // Inputs used to craft the base text (fallback if AI off or fails)
  const tone    = q('tone'), channel=q('channel'), offer=q('offer'), cta=q('cta');
  const nameOut = q('product-name-out');
  const personaBtnEls = document.querySelectorAll('.persona');

  function currentPersona(){
    let p = 'brand';
    personaBtnEls.forEach(b=>{ if (b.classList.contains('active')) p = b.dataset.persona || p; });
    return p;
  }
  function baseTemplate(){
    const t = (tone?.value || 'friendly');
    const c = (channel?.value || 'email');
    const item = (nameOut?.textContent || 'your item');
    const offerLine = (offer?.value?.trim())
      ? (t==='professional' ? \` We can extend an offer: \${offer.value.trim()}.\` : \` Here’s a perk: \${offer.value.trim()}.\`)
      : '';
    const ctaText = (cta?.value?.trim())
      || (t==='professional' ? 'Proceed to checkout'
         : t==='casual' ? 'Wrap this up' : 'Finish your order');
    const channelNoun =
      c === 'sms'     ? (t==='professional' ? 'SMS' : 'text')
    : c === 'on-site' ? (t==='professional' ? 'on-site chat' : 'chat')
    :                    (t==='professional' ? 'email' : 'email');

    const heads = t==='professional' ? 'Hello.' : (t==='casual' ? 'Yo!' : 'Hey there!');
    return \`\${heads} I’m your AI Shopping Copilot. We noticed **\${item}** in your cart.\${offerLine} I can answer questions via \${channelNoun} and help you checkout.\\n\\n\${ctaText} →\`;
  }

  async function aiRewrite(base, persona){
    try{
      const r = await fetch('/api/ai/rewrite', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          prompt:'Personalize lightly, tighten phrasing, keep one clear CTA. Avoid implying celebrity endorsement.',
          base, persona
        })
      });
      const j = await r.json();
      return (j && j.text) ? j.text : base;
    }catch{
      return base;
    }
  }

  function setBusy(b){
    if (!runBtn) return;
    runBtn.disabled = b;
    runBtn.dataset._orig = runBtn.dataset._orig || runBtn.textContent;
    runBtn.textContent = b ? 'Generating…' : runBtn.dataset._orig;
  }

  if (runBtn && preview){
    runBtn.addEventListener('click', async ()=>{
      const persona = currentPersona();
      const base = baseTemplate();
      if (!useAI.checked){
        preview.textContent = base;
        return;
      }
      setBusy(true);
      const text = await aiRewrite(base, persona);
      preview.textContent = text;
      setBusy(false);
    }, { passive:true });
  }
})();
`;
    js += '\n' + add + '\n';
    write(MAIN, js);
  } else {
    console.log('• AI-on-run script already present');
  }
}

console.log('✅ AI wired to Run button (with toggle + graceful fallback).');
