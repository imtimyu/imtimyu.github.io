(function () {
document.querySelectorAll('[data-al-root]').forEach((root) => {
const btns = root.querySelectorAll('[data-al-panel]');
const cats = root.querySelector('[data-al-cats]');
btns.forEach((btn) => btn.addEventListener('click', () => {
const k = btn.dataset.alPanel;
btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.alPanel === k)));
root.dataset.panel = k;
if (cats) cats.dataset.panel = k;
root.classList.add('is-switched');
}));
});
})();
(function () {
document.querySelectorAll('.al-split__sticky').forEach((el) => {
const set = () => el.style.setProperty('--al-side-h', el.offsetHeight + 'px');
set();
if ('ResizeObserver' in window) new ResizeObserver(set).observe(el);
});
})();
(function () {
const list = document.querySelector('[data-al-tp]');
if (!list || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
if (list.getBoundingClientRect().top < innerHeight) return;
list.classList.add('al-tp--anim');
const io = new IntersectionObserver((entries) => {
if (entries.some((e) => e.isIntersecting)) { list.classList.add('is-shown'); io.disconnect(); }
}, { rootMargin: '0px 0px -15% 0px' });
io.observe(list);
})();
