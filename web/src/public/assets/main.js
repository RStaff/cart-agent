
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-plan]').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      const plan = btn.getAttribute('data-plan');
      try{
        const r = await fetch('/api/billing/checkout',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({plan})
        });
        const d = await r.json();
        if(d.url) window.location.href=d.url;
        else alert('Unable to start checkout');
      }catch(e){ alert('Error. Please try again.'); }
    });
  });
  const tone=document.getElementById('tone');
  const channel=document.getElementById('channel');
  const offer=document.getElementById('offer');
  const cta=document.getElementById('cta');
  const out=document.getElementById('preview');
  const gen=document.getElementById('generate');
  const copy=document.getElementById('copy');
  if(gen && out){
    const build=()=>{
      let m=(tone?.value==='professional'?'Hello,':'Hey there,')+' ';
      m+='we noticed you left items in your cart. ';
      if(offer?.value.trim()) m+='Here is an offer: '+offer.value.trim()+'. ';
      m+='We can answer questions on '+(channel?.value||'email')+'. ';
      m+='

'+(cta?.value.trim()||'Finish your order')+' ->';
      out.textContent=m;
    };
    gen.addEventListener('click',build);
    [tone,channel,offer,cta].forEach(el=>el&&el.addEventListener('input',build));
    copy?.addEventListener('click',()=>navigator.clipboard.writeText(out.textContent||''));
  }
});
