document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-plan]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const plan = btn.getAttribute('data-plan');
      try {
        const res = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ plan }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert('Checkout failed: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        console.error(err);
        alert('Unable to start checkout.');
      }
    });
  });

  const toneEl = document.getElementById('tone');
  const channelEl = document.getElementById('channel');
  const offerEl = document.getElementById('offer');
  const ctaEl = document.getElementById('cta');
  const previewEl = document.getElementById('preview-message');
  const genBtn = document.getElementById('generate');
  const copyBtn = document.getElementById('copy');

  if (genBtn && previewEl) {
    const update = () => {
      let msg = '';
      switch(toneEl.value) {
        case 'friendly': msg += 'Hey there!\n'; break;
        case 'professional': msg += 'Hello,\n'; break;
        default: msg += 'Hi,\n';
      }
      msg += 'We noticed you left some items in your cart. ';
      if (offerEl.value.trim()) msg += 'Here’s a special offer: ' + offerEl.value.trim() + '. ';
      msg += 'We’re here to answer any questions and help you complete your purchase.\n\n';
      msg += (ctaEl.value.trim() || 'Finish your order') + ' →';
      previewEl.textContent = msg;
    };
    genBtn.addEventListener('click', update);
    [toneEl, channelEl, offerEl, ctaEl].forEach(el => el && el.addEventListener('input', update));
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(previewEl.textContent).then(() => alert('Message copied'), () => alert('Copy failed'));
    });
  }
});