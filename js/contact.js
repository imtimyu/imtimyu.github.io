// Contact Us (gates G4 and G6, 2026-10-13). The form posts to /contact-us/send.php, which sends the enquiry as live's
// site does and sends the visitor back here: ?sent=<token> once sent, ?sent=0 when the spam trap was filled (nothing
// sent), or ?error=fields|security|mail. This script shows live's message for each. A sent enquiry counts once: live's
// Google Ads label and GA4 event, with the token as transaction_id. The token is remembered and the address cleaned,
// so a reload, or a later visit to the same address, counts nothing (live counted every reload of ?sent=1).
(function () {
  const params = new URLSearchParams(location.search);
  const sent = params.get('sent');
  const error = params.get('error');
  if (!sent && !error) return;
  if (sent && sent !== '0') {
    let counted = false;
    try {
      counted = localStorage.getItem('mw-enquiry-' + sent) === '1';
      localStorage.setItem('mw-enquiry-' + sent, '1');
    } catch (e) { /* without storage the cleaned address still stops a reload counting it again */ }
    if (!counted && typeof gtag === 'function') {
      gtag('event', 'leads_form_submit');
      gtag('event', 'conversion', { send_to: 'AW-860738239/T62PCJ-rybkbEL-lt5oD', transaction_id: sent });
    }
  }
  params.delete('sent');
  params.delete('error');
  const rest = params.toString();
  history.replaceState(null, '', location.pathname + (rest ? '?' + rest : '') + location.hash);
  const show = () => {
    const box = document.querySelector('[data-contact-form] .cu-notice');
    if (!box) return;
    let notices = {};
    try { notices = JSON.parse(box.dataset.notices || '{}'); } catch (e) { notices = {}; }
    box.querySelector('.cu-notice__title').textContent = sent ? notices.sent : (notices[error] || notices.other);
    box.classList.add(sent ? 'cu-notice--ok' : 'cu-notice--err');
    box.hidden = false;
    box.focus({ preventScroll: true });
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => box.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' }), 80);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show);
  else show();
})();
