document.addEventListener('DOMContentLoaded', () => {
  const toneEl = document.getElementById('tone');
  const channelEl = document.getElementById('channel');
  const offerEl = document.getElementById('offer');
  const ctaEl = document.getElementById('cta');
  const previewEl = document.getElementById('preview-message');
  const generateBtn = document.getElementById('generate');
  const copyBtn = document.getElementById('copy');

  const updatePreview = () => {
    if (!previewEl) return;
    let message = '';
    switch (toneEl?.value) {
      case 'friendly': message += 'Hey there!\n'; break;
      case 'professional': message += 'Hello,\n'; break;
      default: message += 'Hi,\n'; break;
    }
    message += 'We noticed you left some items in your cart. ';
    if (offerEl?.value.trim()) message += 'Here’s a quick incentive: ' + offerEl.value.trim() + '. ';
    message += 'Got questions? I can help you checkout. ';
    const ctaText = ctaEl?.value.trim() || 'Finish your order';
    message += '\n\n' + ctaText + ' →';
    previewEl.textContent = message;
  };

  if (generateBtn) {
    generateBtn.addEventListener('click', updatePreview);
    [toneEl, channelEl, offerEl, ctaEl].forEach(el => el && el.addEventListener('input', updatePreview));
    copyBtn?.addEventListener('click', () => {
      navigator.clipboard.writeText(previewEl?.textContent || '')
        .then(()=>alert('Message copied'))
        .catch(()=>alert('Copy failed'));
    });
  }
});