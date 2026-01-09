(async function(){
  const b=document.getElementById('start'); if(!b) return;
  b.onclick=async()=>{
    b.disabled=true;
    const r=await fetch('/api/billing/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({plan:'starter'})});
    const j=await r.json().catch(()=>({}));
    if(r.ok && j.url) location.href=j.url; else { alert(JSON.stringify(j)); b.disabled=false; }
  };
})();
