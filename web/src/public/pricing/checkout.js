(function(){
  function $(id){ return document.getElementById(id); }
  const btn = $("startTrialBtn"), msg = $("msg");
  if(!btn) return;
  btn.addEventListener("click", async () => {
    btn.disabled = true; msg.textContent = "Starting trial...";
    try {
      const plan = btn.dataset.plan || "starter";
      const r = await fetch("/api/billing/checkout", {
        method:"POST",
        headers:{ "content-type":"application/json" },
        body: JSON.stringify({ plan })
      });
      if(!r.ok){ throw new Error("Checkout failed: "+r.status); }
      const { url } = await r.json();
      if(!url){ throw new Error("No checkout URL returned"); }
      window.location.href = url;
    } catch(e){
      msg.textContent = (e && e.message) ? e.message : String(e);
      btn.disabled = false;
    }
  });
})();
