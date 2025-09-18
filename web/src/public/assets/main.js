document.addEventListener('DOMContentLoaded', () => {
  // Pricing checkout
  document.querySelectorAll('[data-plan]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const plan = btn.getAttribute('data-plan');
      try{
        const res = await fetch('/api/billing/checkout', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ plan })
        });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
        else alert('Unable to begin checkout: ' + (data.error || 'Unknown error'));
      }catch{ alert('An error occurred, please try again later.'); }
    });
  });

  // Playground
  const el = id => document.getElementById(id);
  const tone = el('tone'), offer = el('offer'), cta = el('cta'), channel = el('channel');
  const preview = el('preview-message'), template = el('template');
  const aov = el('aov'), ltv = el('ltv'), ctr = el('ctr'), recovery = el('recovery'), plan = el('plan');
  const slider = el('sessionSlider'), sessions = el('sessions'), sessionDisplay = el('sessionDisplay');
  const kOrders = el('kpi-orders'), kRevenue = el('kpi-revenue'), kROI = el('kpi-roi'), nudgeMsg = el('nudge-message');

  const templates = {
    custom: {},
    discount: { tone:'friendly', offer:'10% off your next order', cta:'Complete your purchase and save!', channel:'email' },
    urgency:  { tone:'professional', offer:'', cta:'Hurry! Items are almost gone.', channel:'sms' },
    faq:      { tone:'friendly', offer:'', cta:'Got questions? I can help you checkout.', channel:'on-site' }
  };

  function updateMessage(){
    if (!preview) return;
    const t = (tone?.value)||'friendly';
    let msg = (t==='friendly'?'Hey there!\n':t==='professional'?'Hello,\n':'Hi,\n');
    msg += 'I\'m your Shopping Copilot. We noticed you left some items in your cart. ';
    if (offer?.value?.trim()) msg += 'Here\'s a special offer: ' + offer.value.trim() + '. ';
    msg += 'I can answer questions and help you complete your purchase.\n\n';
    msg += (cta?.value?.trim() || 'Finish your order') + ' →';
    preview.textContent = msg;
  }

  function calcImpact(){
    const s = slider ? Number(slider.value) : (sessions?.value? Number(sessions.value): 1000);
    const ctrRate = ctr?.value ? parseFloat(ctr.value)/100 : 0;
    const recRate = recovery?.value ? parseFloat(recovery.value)/100 : 0;
    const avg = (ltv && parseFloat(ltv.value)>0) ? parseFloat(ltv.value) : (aov?.value? parseFloat(aov.value): 0);
    const pc = plan?.value ? parseFloat(plan.value): 0;
    const orders = s * ctrRate * recRate;
    const revenue = avg>0 ? orders * avg : NaN;
    const roi = revenue && pc>0 ? (revenue/pc) : NaN;
    if (kOrders)  kOrders.textContent  = Number.isFinite(orders)  ? Math.round(orders).toLocaleString() : '—';
    if (kRevenue) kRevenue.textContent = Number.isFinite(revenue) ? ('$'+Math.round(revenue).toLocaleString()) : '—';
    if (kROI)     kROI.textContent     = Number.isFinite(roi)     ? roi.toFixed(1)+'×' : '—';
  }

  // Bind events
  el('generate')?.addEventListener('click', updateMessage);
  [tone, offer, cta].forEach(x=>x&&x.addEventListener('input', updateMessage));
  template?.addEventListener('change', ()=>{
    const tpl = templates[template.value]||{};
    if (tone && tpl.tone) tone.value = tpl.tone;
    if (channel && tpl.channel) channel.value = tpl.channel;
    if (offer) offer.value = tpl.offer || '';
    if (cta)   cta.value   = tpl.cta   || '';
    updateMessage();
  });

  if (slider) {
    slider.addEventListener('input', ()=>{
      if (sessions) sessions.value = slider.value;
      if (sessionDisplay) sessionDisplay.textContent = slider.value;
      calcImpact();
    });
  }
  sessions?.addEventListener('input', ()=>{
    if (slider) slider.value = sessions.value;
    if (sessionDisplay) sessionDisplay.textContent = sessions.value;
    calcImpact();
  });

  [aov, ltv, ctr, recovery, plan].forEach(x=>x&&x.addEventListener('input', calcImpact));

  const nudges=[
    '👍 Acme recovered $4,200 last month with Abando.',
    '🔥 92% open rate for Shopping Copilot messages!',
    '🚀 Avg $3,800 recovered in first month.',
    '💬 “Most helpful checkout guide I’ve seen.” — beta user'
  ];
  let n=0; function rotate(){ if(nudgeMsg){nudgeMsg.textContent=nudges[n]; n=(n+1)%nudges.length;} }
  setInterval(rotate, 5000); rotate();

  updateMessage(); calcImpact();
});