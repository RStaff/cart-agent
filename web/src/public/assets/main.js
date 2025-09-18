document.addEventListener('DOMContentLoaded', () => {
  // Checkout buttons
  document.querySelectorAll('[data-plan]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const plan = btn.getAttribute('data-plan');
      try{
        const res = await fetch('/api/billing/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan})});
        const data = await res.json();
        if (data.url) window.location.href = data.url; else alert('Unable to begin checkout');
      }catch{ alert('An error occurred, please try again later.'); }
    });
  });

  // Playground
  const $ = (id)=>document.getElementById(id);
  const tone=$('tone'), channel=$('channel'), offer=$('offer'), cta=$('cta');
  const preview=$('preview-message')||$('preview');
  const generate=$('generate'), copy=$('copy');
  const aov=$('aov'), ltv=$('ltv'), ctr=$('ctr'), recovery=$('recovery'), plan=$('plan');
  const slider=$('sessionSlider'), sessions=$('sessions'), sessionDisplay=$('sessionDisplay');
  const kOrders=$('kpi-orders'), kRevenue=$('kpi-revenue'), kROI=$('kpi-roi'), nudgeMsg=$('nudge-message');
  const template=$('template');

  const templates={custom:{},discount:{tone:'friendly',channel:'email',offer:'10% off your next order',cta:'Complete your purchase and save!'},urgency:{tone:'professional',channel:'sms',offer:'',cta:'Hurry! Items are almost gone.'},faq:{tone:'friendly',channel:'on-site',offer:'',cta:'Got questions? I can help you checkout.'}};

  function buildMessage(){
    const t=(tone?.value)||'friendly';
    let m=(t==='professional'?'Hello,':t==='friendly'?'Hey there!':'Hi,')+'\n';
    m += "I’m your AI Shopping Copilot. We noticed you left some items in your cart. ";
    if (offer?.value?.trim()) m += 'Here’s a special offer: '+offer.value.trim()+'. ';
    m += 'I can answer questions and help you complete your purchase.\n\n';
    m += (cta?.value?.trim()||'Finish your order')+' →';
    if (preview) preview.textContent=m;
  }
  function calc(){
    const s=slider?Number(slider.value):(sessions?.value?Number(sessions.value):1000);
    const ctrRate=ctr?.value?parseFloat(ctr.value)/100:0;
    const recRate=recovery?.value?parseFloat(recovery.value)/100:0;
    const avg=(ltv&&parseFloat(ltv.value)>0)?parseFloat(ltv.value):(aov?.value?parseFloat(aov.value):0);
    const pc=plan?.value?parseFloat(plan.value):0;
    const orders=s*ctrRate*recRate;
    const revenue=Number.isFinite(avg)?orders*avg:NaN;
    const roi=(revenue>0&&pc>0)?(revenue/pc):NaN;
    if(kOrders)kOrders.textContent=Number.isFinite(orders)?Math.round(orders).toLocaleString():'—';
    if(kRevenue)kRevenue.textContent=Number.isFinite(revenue)?('$'+Math.round(revenue).toLocaleString()):'—';
    if(kROI)kROI.textContent=Number.isFinite(roi)?roi.toFixed(1)+'×':'—';
  }

  template?.addEventListener('change', ()=>{
    const t=templates[template.value]||{};
    if(tone&&t.tone)tone.value=t.tone; if(channel&&t.channel)channel.value=t.channel;
    if(offer)offer.value=t.offer||''; if(cta)cta.value=t.cta||'';
    buildMessage(); calc();
  });

  generate?.addEventListener('click', ()=>{ buildMessage(); });
  [tone,channel,offer,cta,aov,ltv,ctr,recovery,plan,sessions].forEach(el=>el&&el.addEventListener('input', ()=>{ buildMessage(); calc(); }));
  slider?.addEventListener('input', ()=>{ if(sessions)sessions.value=slider.value; if(sessionDisplay)sessionDisplay.textContent=slider.value; calc(); });
  sessions?.addEventListener('input', ()=>{ if(slider)slider.value=sessions.value; if(sessionDisplay)sessionDisplay.textContent=sessions.value; calc(); });

  copy?.addEventListener('click', async ()=>{
    try{ await navigator.clipboard.writeText(preview?.textContent||''); copy.textContent='Copied!'; setTimeout(()=>copy.textContent='Copy message',1200); }catch{ alert('Copy failed'); }
  });

  const nudges=['👍 Abando users recovered $3,800 on average in month 1.','🔥 92% open rate for Shopping Copilot messages!','🚀 “Most helpful checkout guide I’ve seen.” — beta user'];
  let i=0; function rotate(){ if(nudgeMsg){nudgeMsg.textContent=nudges[i]; i=(i+1)%nudges.length;} }
  rotate(); setInterval(rotate,5000);

  buildMessage(); calc();
});

/* __TRIAL_HELPERS__ (do not remove) */
(function(){
  const TRIAL_KEY = 'abando_trial_start';
  const TRIAL_LEN_DAYS = 14;
  const DAY_MS = 86400000;

  function getTrialStart(){
    try { const v = localStorage.getItem(TRIAL_KEY); return v ? Number(v) : null; } catch { return null; }
  }
  function setTrialStart(ts){
    try { localStorage.setItem(TRIAL_KEY, String(ts)); } catch {}
  }
  function clearTrial(){ try{ localStorage.removeItem(TRIAL_KEY); }catch{} }

  function daysLeftFrom(start){
    if (!start) return 0;
    const diff = Date.now() - start;
    const used = Math.floor(diff / DAY_MS);
    return Math.max(0, TRIAL_LEN_DAYS - used);
  }
  function isTrialActive(){
    const start = getTrialStart();
    return start && daysLeftFrom(start) > 0;
  }

  function maybeStartTrialFromURL(){
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('trial') === '1' || p.get('trial') === 'true') {
        if (!getTrialStart()) setTrialStart(Date.now());
        // If there is an inline trial banner container, show it
        const banner = document.getElementById('trial-banner');
        if (banner) banner.style.display = 'block';
      }
    } catch {}
  }

  function injectNavTrialBadge(){
    // Only inject if active
    if (!isTrialActive()) return;
    const nav = document.querySelector('nav .container, nav');
    if (!nav) return;

    // Try to locate the right side links container
    let links = nav.querySelector('.nav-links');
    if (!links) {
      // If markup differs, attach to nav container’s end
      links = nav;
    }
    let badge = document.getElementById('nav-trial-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'nav-trial-badge';
      badge.style.cssText = 'margin-left:8px;padding:4px 8px;border-radius:999px;border:1px solid var(--border,#2d3748);background:#0b142a;color:#cbd5e1;font-size:12px;font-weight:700;white-space:nowrap;';
      links.appendChild(badge);
    }
    const start = getTrialStart();
    const daysLeft = daysLeftFrom(start);
    badge.textContent = daysLeft > 0 ? ('Trial: ' + daysLeft + ' days left') : 'Trial ended';
  }

  function updateDashboardTrialUI(){
    // If the page provides these IDs, wire them up
    const daysEl = document.getElementById('trial-days-left');
    const bar    = document.getElementById('trial-progress');
    const label  = document.getElementById('trial-progress-label');
    if (!daysEl && !bar) return;

    const start = getTrialStart();
    const left  = daysLeftFrom(start);
    const used  = start ? (TRIAL_LEN_DAYS - left) : 0;
    if (daysEl) daysEl.textContent = String(left);

    const pct = Math.max(0, Math.min(100, Math.round((used / TRIAL_LEN_DAYS) * 100)));
    if (bar)  bar.style.width = pct + '%';
    if (label) label.textContent = pct + '% used';

    // Suggest upgrade button (if present)
    const upgrade = document.querySelector('[data-upgrade]');
    if (upgrade && left <= 3 && left > 0) {
      upgrade.textContent = 'Upgrade now (trial ends in ' + left + ' days)';
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    maybeStartTrialFromURL();
    if (isTrialActive()) injectNavTrialBadge();
    updateDashboardTrialUI();
  });
})();


/* Personas + product preview (addon) */
(function(){
  const personaStyles = {
    brand: (msg)=>msg, // pass-through
    kevin: (msg)=>"Yo! 😂 " + msg.replace(/\.$/,'!') + " Let’s get you hooked up—real quick.",
    beyonce: (msg)=>"✨ " + msg + " You deserve a flawless checkout—ready when you are.",
    taylor: (msg)=>"Hey! 🧣 " + msg + " We’ll make this easy—no bad blood with returns."
  };
  function personaWrap(kind, base){
    const fn = personaStyles[kind] || personaStyles.brand;
    return fn(base);
  }
  function q(id){ return document.getElementById(id); }

  function wirePersonaAndProduct(){
    // *Inputs*
    const productUrl = q('product-url');
    const productName= q('product-name');
    const productPrice=q('product-price');

    const tone=q('tone'), channel=q('channel'), offer=q('offer'), cta=q('cta');
    const run=q('generate'), copy=q('copy'), preview=q('preview-message');
    const personaButtons = document.querySelectorAll('.persona');
    const imgEl = q('product-img'), nameEl=q('product-name-out'), priceEl=q('product-price-out');
    const avatar=q('preview-avatar');

    if(!preview) return;

    let persona = 'brand'; // default

    personaButtons.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        personaButtons.forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        persona = btn.getAttribute('data-persona') || 'brand';
        build(); // re-render
      });
    });

    function build(){
      // Avatar hint (first letter for brand; emoji for personas)
      avatar.textContent = persona==='brand' ? 'A' : (persona==='kevin'?'😄':persona==='beyonce'?'✨':'🧣');

      // Product card reflect inputs
      const url = (productUrl?.value||'').trim();
      imgEl.src = url || imgEl.getAttribute('data-fallback') || "/assets/hoodie.svg";
      nameEl.textContent = (productName?.value||'Essentials Hoodie (Black, M)');
      priceEl.textContent = productPrice?.value ? ('$'+Number(productPrice.value).toFixed(2)) : '$68.00';

      // Base message
      let msg = (tone?.value==='professional'?'Hello,':'Hey there,') + " I’m your Shopping Copilot. ";
      msg += "We noticed you left " + (nameEl.textContent||'an item') + " in your cart. ";
      if (offer?.value?.trim()) msg += "Here’s an offer: " + offer.value.trim() + ". ";
      msg += "I can answer questions on " + (channel?.value||'email') + " and help you complete your purchase.";
      msg += "\n\n" + (cta?.value?.trim() || 'Finish your order') + " →";

      // Persona flavor
      preview.textContent = personaWrap(persona, msg);
    }

    function copyMsg(){
      navigator.clipboard.writeText(preview.textContent||'').then(()=> {
        let t=document.getElementById('toast'); if(!t){ t=document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
        t.textContent='Copied'; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 1200);
      });
    }

    // Bindings
    [productUrl, productName, productPrice, tone, channel, offer, cta].forEach(el=> el && el.addEventListener('input', build));
    run && run.addEventListener('click', build);
    copy && copy.addEventListener('click', copyMsg);

    // Initial paint
    build();
  }

  document.addEventListener('DOMContentLoaded', wirePersonaAndProduct);
})();


/* === AI on Run (rewrite) === */
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
      ? (t==='professional' ? ` We can extend an offer: ${offer.value.trim()}.` : ` Here’s a perk: ${offer.value.trim()}.`)
      : '';
    const ctaText = (cta?.value?.trim())
      || (t==='professional' ? 'Proceed to checkout'
         : t==='casual' ? 'Wrap this up' : 'Finish your order');
    const channelNoun =
      c === 'sms'     ? (t==='professional' ? 'SMS' : 'text')
    : c === 'on-site' ? (t==='professional' ? 'on-site chat' : 'chat')
    :                    (t==='professional' ? 'email' : 'email');

    const heads = t==='professional' ? 'Hello.' : (t==='casual' ? 'Yo!' : 'Hey there!');
    return `${heads} I’m your AI Shopping Copilot. We noticed **${item}** in your cart.${offerLine} I can answer questions via ${channelNoun} and help you checkout.\n\n${ctaText} →`;
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


/* === dashboard demo charts === */
(function(){
  function byId(i){return document.getElementById(i)}
  function spark(elId, data){
    const el = byId(elId); if (!el) return;
    const w = el.clientWidth || 220, h = el.clientHeight || 44;
    const max = Math.max(...data, 1); const min = Math.min(...data, 0);
    const xs = data.map((_,i)=> i*(w/(data.length-1||1)));
    const ys = data.map(v => h - ((v-min)/(max-min||1))* (h-6) - 3);
    const path = xs.map((x,i)=> (i?'L':'M')+x.toFixed(1)+','+ys[i].toFixed(1)).join(' ');
    el.innerHTML = '<svg width="'+w+'" height="'+h+'"><path d="'+path+'" fill="none" stroke="currentColor" stroke-width="2" opacity="0.9"/></svg>';
  }
  function rnd(n=7,base=50,spread=30){ return Array.from({length:n},()=> Math.max(1, Math.round(base + (Math.random()*2-1)*spread)))}
  function dollars(n){ return '$'+(n||0).toLocaleString() }
  function pct(n){ return (n||0).toFixed(1)+'%' }

  document.addEventListener('DOMContentLoaded', ()=>{
    // demo numbers
    const rev = rnd(7, 1200, 400); const ord = rnd(7, 14, 6); const ctr = rnd(7, 4, 1.5);
    const sum = rev.reduce((a,b)=>a+b,0);

    const kRev = byId('kpi-rev'); if (kRev) kRev.textContent = dollars(sum);
    const kOrd = byId('kpi-ord'); if (kOrd) kOrd.textContent = ord.reduce((a,b)=>a+b,0);
    const kCtr = byId('kpi-ctr'); if (kCtr) kCtr.textContent = pct(ctr[ctr.length-1]);

    spark('spark-rev', rev);
    spark('spark-ord', ord);
    spark('spark-ctr', ctr);
  });
})();

/* === persona disclaimer banner === */
(function(){
  const bannerId='persona-disclaimer';
  function ensureBanner(){
    let el=document.getElementById(bannerId);
    if(!el){
      el=document.createElement('div');
      el.id=bannerId;
      el.className='note persona-banner';
      el.style.display='none';
      el.textContent='Style is inspired by a general tone. No affiliation or endorsement is implied.';
      const container=document.querySelector('.container, main, body')||document.body;
      container.prepend(el);
    }
    return el;
  }
  function currentPersona(){
    let p='brand';
    document.querySelectorAll('.persona').forEach(b=>{ if(b.classList.contains('active')) p=b.dataset.persona||p; });
    return p;
  }
  function update(){
    const el=ensureBanner();
    const p=currentPersona();
    const show = p==='kevin' || p==='beyonce' || p==='taylor';
    el.style.display = show ? 'block' : 'none';
  }
  document.addEventListener('click', (e)=>{
    if(e.target && e.target.classList && e.target.classList.contains('persona')) {
      setTimeout(update, 10);
    }
  });
  document.addEventListener('DOMContentLoaded', update);
})();

/* === dashboard stats via API === */
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
