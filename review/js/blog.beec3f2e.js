(function () {
const article = document.querySelector('[data-read]');
const bar = document.querySelector('.blog-progress span');
if (!article || !bar) return;
let ticking = false;
const update = () => {
ticking = false;
const r = article.getBoundingClientRect();
const total = r.height - window.innerHeight * 0.6;
const done = Math.min(1, Math.max(0, (-r.top + window.innerHeight * 0.2) / (total > 0 ? total : 1)));
bar.style.transform = `scaleX(${done})`;
bar.parentElement.classList.toggle('is-on', done > 0 && done < 1);
};
window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
window.addEventListener('resize', update);
update();
})();
(function () {
const links = [...document.querySelectorAll('.blog-toc--side a[href^="#"]')];
if (!links.length || !('IntersectionObserver' in window)) return;
const byId = new Map(links.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
const list = links[0].closest('ol');
const more = () => list.classList.toggle('is-more', list.scrollTop + list.clientHeight < list.scrollHeight - 2);
const keep = (a) => {
const l = list.getBoundingClientRect(), r = a.getBoundingClientRect();
if (r.top < l.top) list.scrollTop -= l.top - r.top + 8;
else if (r.bottom > l.bottom) list.scrollTop += r.bottom - l.bottom + 8;
};
list.addEventListener('scroll', more, { passive: true });
window.addEventListener('resize', more);
more();
const io = new IntersectionObserver((entries) => {
entries.forEach((e) => {
if (!e.isIntersecting) return;
links.forEach((a) => a.classList.remove('is-current'));
const a = byId.get(e.target.id);
if (a) { a.classList.add('is-current'); keep(a); }
});
}, { rootMargin: '-15% 0px -70% 0px' });
byId.forEach((_, id) => { const h = document.getElementById(id); if (h) io.observe(h); });
})();
