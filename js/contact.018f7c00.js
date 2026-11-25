(function () {
const params = new URLSearchParams(location.search);
const sent = params.get('sent');
const error = params.get('error');
if (!sent && !error) return;
const token = window.__mwSent;
if (token && typeof gtag === 'function') {
let counted = false;
try {
counted = localStorage.getItem('mw-enquiry-' + token) === '1';
localStorage.setItem('mw-enquiry-' + token, '1');
} catch (e) { }
if (!counted) {
gtag('event', 'leads_form_submit');
gtag('event', 'conversion', { send_to: 'AW-860738239/T62PCJ-rybkbEL-lt5oD', transaction_id: token });
}
}
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
