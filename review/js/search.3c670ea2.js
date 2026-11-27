(function () {
const root = document.querySelector('[data-search]');
if (!root) return;
const header = root.closest('.site-header');
const bar = header.querySelector('.site-header__bar');
const logo = header.querySelector('.site-header__logo');
const navList = header.querySelector('.nav__list');
const trigger = root.querySelector('.site-search__trigger');
const input = root.querySelector('input');
const closeBtn = root.querySelector('.site-search__close');
const panel = root.querySelector('.site-search__panel');
const status = root.querySelector('[data-search-status]');
const whatsapp = root.dataset.whatsapp;
const POPULAR = ['/medical-examination/#mom_medical_examination', '/medical-examination/#ica_medical_examination', '/health-screening/', '/corporate-healthcare/', '/general-consultation/'];
const MAX = 8;
let index = null;
let loading = null;
const norm = (s) => (s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const words = (s) => (s ? s.split(' ') : []);
const SUFFIXES = ['izations', 'ization', 'isations', 'isation', 'ations', 'ation', 'ments', 'ment', 'ings', 'ing', 'ies', 'ied', 'ed', 'es', 's', 'e', 'y'];
const STOP = ['a', 'about', 'above', 'after', 'again', 'against', 'all', 'also', 'am', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'etc', 'even', 'few', 'for', 'from', 'further', 'get', 'got', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'like', 'made', 'make', 'many', 'may', 'me', 'might', 'more', 'most', 'much', 'must', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'one', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'per', 'same', 'shall', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'three', 'through', 'to', 'too', 'two', 'under', 'until', 'up', 'use', 'used', 'using', 'very', 'via', 'was', 'we', 'well', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'within', 'without', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'];
const STEM_MIN = 4;
const STOPS = new Set(STOP);
const fold = (w) => {
let st = w;
if (w.length > STEM_MIN && !w.endsWith('ss')) {
for (const s of SUFFIXES) if (w.endsWith(s) && w.length - s.length >= STEM_MIN) { st = w.slice(0, -s.length); break; }
}
return STOPS.has(st) && !STOPS.has(w) ? w : st;
};
const stem = fold;
let names = new Set();
const NOT_PLURAL = new Set(['news']);
const plural = (t) => {
const a = t.length === 4 && /[^s]s$/.test(t) && !NOT_PLURAL.has(t) && names.has(t.slice(0, -1)) ? t.slice(0, -1)
: t.length > 4 && t.endsWith('ies') ? t.slice(0, -3) + 'y' : null;
return a && !STOPS.has(a) ? fold(a) : null;
};
function load() {
loading = loading || fetch('/search-index.json').then((r) => r.json()).then((d) => {
index = d.map((e) => {
const t = words(norm(e.title)), s = words(norm(e.section)), k = words(norm(e.keywords)), x = words(norm(e.text));
return { ...e, nt: norm(e.title), t, s, k, x, ts: t.map(stem), ss: s.map(stem), ks: k.map(stem), xs: x.map(stem), b: [] };
});
names = new Set(index.flatMap((e) => [...e.t, ...e.k]).filter((w) => w.length === 3));
}).catch(() => { index = []; });
return loading;
}
let more = null;
function loadWords() {
more = more || Promise.all([load(), fetch('/search-words.json').then((r) => r.json()).catch(() => ({}))]).then(([, w]) => {
index.forEach((e) => { if (w[e.url]) e.b = words(w[e.url]); });
}).catch(() => {});
return more;
}
function find(query, max = MAX) {
const q = norm(query);
if (!q || !index) return [];
const typed = words(q), kept = typed.filter((t) => !STOPS.has(t));
const toks = kept.length ? kept : typed;
const scored = [];
for (const e of index) {
let score = 0;
let ok = true;
for (const t of toks) {
const st = stem(t), pl = plural(t);
const has = (forms) => forms.includes(st) || (pl !== null && forms.includes(pl));
let best = 0;
if (e.t.includes(t)) best = 10;
else if (e.t.some((w) => w.startsWith(t))) best = 7;
if (best < 6 && e.k.includes(t)) best = 6;
if (best < 5 && has(e.ts)) best = 5;
if (best < 4 && e.k.some((w) => w.startsWith(t))) best = 4;
if (best < 3 && has(e.ks)) best = 3;
if (best < 2 && (has(e.ss) || e.s.some((w) => w.startsWith(t)))) best = 2;
if (best < 1 && t.length > 2 && (has(e.xs) || e.x.some((w) => w.startsWith(t)))) best = 1;
if (best < 0.5 && t.length > 2 && (has(e.b) || (t.length > 3 && e.b.some((w) => w.startsWith(t))))) best = 0.5;
if (!best) { ok = false; break; }
score += best;
}
if (!ok) continue;
if (e.nt === q) score += 30;
else if (e.nt.startsWith(q)) score += 15;
if (e.external) score -= 2;
if (e.section === 'Blog') score -= 1;
scored.push({ e, score });
}
scored.sort((a, b) => b.score - a.score || a.e.title.length - b.e.title.length);
return scored.slice(0, max).map((x) => x.e);
}
const icon = (name) => {
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.setAttribute('class', 'ico'); svg.setAttribute('aria-hidden', 'true');
const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
use.setAttribute('href', '#i-' + name); svg.appendChild(use);
return svg;
};
function highlight(el, title, toks) {
let last = 0;
const left = [...toks];
title.replace(/[A-Za-z0-9]+/g, (w, at) => {
const i = left.findIndex((t) => w.toLowerCase().startsWith(t));
const hit = i >= 0 ? left.splice(i, 1)[0] : null;
if (hit) {
el.append(title.slice(last, at));
const m = document.createElement('mark'); m.textContent = w.slice(0, hit.length); el.append(m);
last = at + hit.length;
}
return w;
});
el.append(title.slice(last));
}
function option(e, id, toks) {
const a = document.createElement('a');
a.className = 'search-option'; a.href = e.url; a.id = id;
a.setAttribute('role', 'option'); a.setAttribute('aria-selected', 'false'); a.tabIndex = -1;
if (e.external) { a.target = '_blank'; a.rel = 'noopener'; }
const t = document.createElement('span'); t.className = 'search-option__title';
highlight(t, e.title, toks);
a.append(t);
if (e.section) { const s = document.createElement('span'); s.className = 'search-option__section'; s.textContent = e.section; a.append(s); }
a.append(icon('arrow'));
return a;
}
function render(list, query, prefix, withPopular) {
list.replaceChildren();
const q = norm(query);
let items;
if (!q) {
if (!withPopular || !index) return [];
items = POPULAR.map((u) => index.find((e) => e.url === u)).filter(Boolean);
const h = document.createElement('p'); h.className = 'search-heading'; h.textContent = 'Popular';
list.append(h);
} else {
items = find(query);
}
if (q && !items.length) {
const p = document.createElement('p'); p.className = 'search-empty';
p.append('No matches for “' + query.trim() + '”. Try a service or pass name, or ');
const a = document.createElement('a'); a.href = whatsapp; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'ask us on WhatsApp';
p.append(a, '.');
list.append(p);
}
const opts = items.map((e, i) => option(e, prefix + i, words(q)));
list.append(...opts);
if (q) status.textContent = items.length ? items.length + (items.length === 1 ? ' suggestion' : ' suggestions') : 'No matches';
return opts;
}
function keyboard(field, getOpts, onEscape) {
let active = -1;
let held = null;
const set = (i) => {
const opts = getOpts();
opts.forEach((o, n) => o.setAttribute('aria-selected', String(n === i)));
active = i;
if (opts[i]) { field.setAttribute('aria-activedescendant', opts[i].id); opts[i].scrollIntoView({ block: 'nearest' }); }
else field.removeAttribute('aria-activedescendant');
};
field.addEventListener('input', () => { active = -1; held = null; field.removeAttribute('aria-activedescendant'); });
field.addEventListener('keydown', (e) => {
const opts = getOpts();
if (e.key === 'ArrowDown' && opts.length) { e.preventDefault(); held = null; set((active + 1) % opts.length); }
else if (e.key === 'ArrowUp' && opts.length) { e.preventDefault(); held = null; set(active <= 0 ? opts.length - 1 : active - 1); }
else if (e.key === 'Enter') {
const o = opts[active] || (!held && norm(field.value) && opts[0]);
if (o) { e.preventDefault(); o.click(); }
else if (held) { e.preventDefault(); if (held.target === '_blank') window.open(held.href, '_blank', 'noopener'); else location.assign(held.href); }
}
else if (e.key === 'Escape') { e.stopPropagation(); onEscape(); }
});
return (cur) => {
const opts = getOpts(), i = cur ? opts.findIndex((o) => o.href === cur.href) : -1;
held = cur && i < 0 ? { href: cur.href, target: cur.target } : null;
set(i);
};
}
let opts = [];
const GAP = 24;
const label = root.querySelector('.site-search__label');
const PLACEHOLDER = input.placeholder;
function measure() {
const r = root.getBoundingClientRect();
const navVisible = navList && navList.offsetParent !== null;
const room = navVisible ? r.left - navList.getBoundingClientRect().right - 4 : r.left - logo.getBoundingClientRect().right - GAP;
const need = Math.ceil(13 + 20 + 8 + label.scrollWidth + 16);
root.style.setProperty('--search-hover', (46 + room >= need ? need : 46) + 'px');
const openW = Math.round(r.right - logo.getBoundingClientRect().right - GAP);
root.style.setProperty('--search-open', openW + 'px');
input.placeholder = openW >= 400 ? PLACEHOLDER : 'Search services';
}
function update() { opts = render(panel, input.value, 'search-opt-', true); input.setAttribute('aria-expanded', String(opts.length > 0 || !!norm(input.value))); }
function open() {
if (root.classList.contains('is-open')) return;
measure();
header.querySelectorAll('.nav__item.is-open').forEach((li) => { li.classList.remove('is-open'); li.querySelector('.nav__link').setAttribute('aria-expanded', 'false'); });
root.classList.add('is-open'); header.classList.add('is-searching'); header.classList.remove('is-hidden');
trigger.setAttribute('aria-expanded', 'true');
input.focus({ preventScroll: true });
load().then(update);
loadWords().then(() => {
if (!root.classList.contains('is-open') || !norm(input.value)) return;
const cur = document.getElementById(input.getAttribute('aria-activedescendant') || '');
update(); keep(cur);
});
}
function close(returnFocus) {
if (!root.classList.contains('is-open')) return;
root.classList.remove('is-open'); header.classList.remove('is-searching');
trigger.setAttribute('aria-expanded', 'false'); input.setAttribute('aria-expanded', 'false');
input.value = ''; panel.replaceChildren(); opts = []; status.textContent = '';
if (returnFocus) trigger.focus({ preventScroll: true });
}
trigger.addEventListener('click', open);
trigger.addEventListener('mouseenter', () => { measure(); load(); });
trigger.addEventListener('focus', () => { measure(); load(); });
closeBtn.addEventListener('click', () => close(true));
input.addEventListener('input', update);
const keep = keyboard(input, () => opts, () => close(true));
panel.addEventListener('mousemove', (e) => {
const o = e.target.closest('.search-option');
if (o) opts.forEach((x) => x.setAttribute('aria-selected', String(x === o)));
});
document.addEventListener('click', (e) => { if (!root.contains(e.target)) close(false); });
root.addEventListener('focusout', (e) => { if (e.relatedTarget && !root.contains(e.relatedTarget)) close(false); });
addEventListener('resize', () => { if (root.classList.contains('is-open')) measure(); });
measure();
const asked = new URLSearchParams(location.search);
if (location.pathname === '/' && asked.has('s')) resultsPage(asked.get('s') || '');
function resultsPage(query) {
const main = document.getElementById('main-content');
if (!main) return;
const q = query.trim();
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
document.title = (q || 'Search') + ' | Mediway Medical Centre';
let robots = document.querySelector('meta[name="robots"]');
if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.append(robots); }
robots.content = 'follow, noindex';
document.querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang]').forEach((l) => l.remove());
const hero = el('section', 'page-hero search-page__hero');
const head = el('div', 'container search-page__head');
const h1 = el('h1', 'page-hero__title');
if (q) h1.append(el('span', '', 'Search results for:'), ' ', el('span', 'text-accent', q));
else h1.append(el('span', '', 'Search the site'));
const count = el('p', 'lead search-page__count');
const form = el('form', 'search-field search-page__form');
form.setAttribute('role', 'search'); form.method = 'get'; form.action = '/';
const label = el('label', 'sr-only', 'Search the site'); label.htmlFor = 'search-page-input';
const field = el('input'); field.id = 'search-page-input'; field.type = 'search'; field.name = 's'; field.value = q;
field.placeholder = 'Search the site…'; field.autocomplete = 'off'; field.setAttribute('enterkeyhint', 'search');
const go = el('button'); go.type = 'submit'; go.setAttribute('aria-label', 'Submit search'); go.append(icon('search'));
form.append(label, field, go);
head.append(h1, count, form);
hero.append(head);
const body = el('section', 'section search-page__results');
const wrap = el('div', 'container');
body.append(wrap);
const bar = main.querySelector('.mobile-bar');
const book = main.querySelector('section.book');
main.replaceChildren(hero, body, ...(book ? [book] : []), ...(bar ? [bar] : []));
document.documentElement.classList.remove('is-search-wait');
const result = (e, toks) => {
const a = el('a', 'search-result'); a.href = e.url;
if (e.external) { a.target = '_blank'; a.rel = 'noopener'; }
const t = el('span', 'search-result__title'); highlight(t, e.title, toks); a.append(t);
if (e.section) a.append(el('span', 'search-result__section', e.section));
a.append(icon('arrow'));
const li = el('li'); li.append(a);
return li;
};
const listOf = (items, toks) => { const ol = el('ol', 'search-results'); ol.append(...items.map((e) => result(e, toks))); return ol; };
let shown = null;
const draw = () => {
const items = q ? find(q, Infinity) : [];
const key = items.map((e) => e.url).join(' ');
if (key === shown) return;
shown = key;
const had = wrap.contains(document.activeElement) ? document.activeElement.getAttribute('href') : null;
wrap.replaceChildren();
if (q) count.textContent = items.length ? items.length + (items.length === 1 ? ' result found.' : ' results found.') : 'No results found.';
if (items.length) wrap.append(listOf(items, words(norm(q))));
else {
if (q) {
const p = el('p', 'search-empty');
p.append('No matches for “' + q + '”. Try a service or pass name, or ');
const a = el('a', '', 'ask us on WhatsApp'); a.href = whatsapp; a.target = '_blank'; a.rel = 'noopener';
p.append(a, '.');
wrap.append(p);
}
const popular = POPULAR.map((u) => index.find((e) => e.url === u)).filter(Boolean);
if (popular.length) wrap.append(el('h2', 'search-heading', 'Popular'), listOf(popular, []));
}
const same = had && [...wrap.querySelectorAll('a[href]')].find((a) => a.getAttribute('href') === had);
if (same) same.focus({ preventScroll: true });
};
load().then(draw);
loadWords().then(draw);
}
})();
