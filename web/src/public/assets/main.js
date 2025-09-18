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
