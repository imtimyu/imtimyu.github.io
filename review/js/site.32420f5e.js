(function () {
const editMode = document.documentElement.hasAttribute('data-edit-mode');
const reduceMotion = editMode || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = () => window.matchMedia('(hover: hover)').matches;
const header = document.querySelector('.site-header');
const mobileMenu = document.getElementById('mobile-menu');
const menuToggle = document.querySelector('.menu-toggle');
const navItems = [...document.querySelectorAll('.nav__item')].filter((li) => li.querySelector('.mega'));
const calm = [...document.querySelectorAll('[data-header-calm]')];
const inCalm = () => calm.some((el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight / 2 && r.bottom > innerHeight / 2; });
let pointerTop = false;
let lastY = window.scrollY;
window.addEventListener('scroll', () => {
const y = window.scrollY;
if (Math.abs(y - lastY) < 12) return;
const busy = !mobileMenu.hidden || navItems.some((li) => li.classList.contains('is-open')) || header.contains(document.activeElement);
header.classList.toggle('is-hidden', ((y > lastY && y > 20) || (calm.length && !pointerTop && inCalm())) && !busy);
lastY = y;
}, { passive: true });
header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
let focusVisible = true;
try { document.body.matches(':focus-visible'); } catch (e) { focusVisible = false; }
const rootPx = (name) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;
const inPinned = (el) => { for (let n = el; n && n !== document.body; n = n.parentElement) { const p = getComputedStyle(n).position; if (p === 'fixed' || p === 'sticky') return true; } return false; };
document.addEventListener('focusin', (e) => {
const el = e.target;
if (!focusVisible || !(el instanceof Element) || !el.matches(':focus-visible') || inPinned(el)) return;
requestAnimationFrame(() => {
if (document.activeElement !== el) return;
const under = rootPx('--header-offset') + rootPx('--header-height');
let clear = under + 8;
const pills = document.querySelector('.hub-pills');
if (pills && pills.getBoundingClientRect().top <= parseFloat(getComputedStyle(pills).top) + 1) clear = under + 8 + pills.offsetHeight + 8;
const bar = document.querySelector('.page-inner .page-subnav.is-shown');
if (bar && bar.offsetHeight) clear = Math.max(clear, under + 10 + bar.offsetHeight + 8);
const r = el.getClientRects()[0] || el.getBoundingClientRect();
if (r.top < clear && r.bottom > 0) window.scrollBy(0, r.top - clear);
});
});
if (calm.length) {
document.addEventListener('mousemove', (e) => {
const reach = header.classList.contains('is-hidden') ? 72 : header.getBoundingClientRect().bottom + 16;
const near = e.clientY < reach || navItems.some((li) => li.classList.contains('is-open'));
if (near === pointerTop) return;
pointerTop = near;
if (inCalm()) header.classList.toggle('is-hidden', !near && !header.contains(document.activeElement));
}, { passive: true });
}
let closeTimer;
function setOpen(li, open) {
li.classList.toggle('is-open', open);
li.querySelector('.nav__link').setAttribute('aria-expanded', String(open));
li.querySelector('.mega').inert = !open;
}
function closeAll(except) { navItems.forEach((li) => { if (li !== except) setOpen(li, false); }); }
navItems.forEach((li) => {
li.querySelector('.nav__link').addEventListener('click', () => {
const open = !li.classList.contains('is-open');
closeAll(li);
setOpen(li, open);
});
li.addEventListener('mouseenter', () => { if (!canHover()) return; clearTimeout(closeTimer); closeAll(li); setOpen(li, true); });
li.addEventListener('mouseleave', () => { if (!canHover()) return; closeTimer = setTimeout(() => setOpen(li, false), 160); });
li.addEventListener('focusout', (e) => { if (!li.contains(e.relatedTarget)) setOpen(li, false); });
});
document.addEventListener('click', (e) => { if (!e.target.closest('.nav__item')) closeAll(); });
function closeMenu() { mobileMenu.hidden = true; menuToggle.setAttribute('aria-expanded', 'false'); }
const inMenu = (el) => menuToggle.contains(el) || mobileMenu.contains(el);
menuToggle.addEventListener('click', () => {
const open = menuToggle.getAttribute('aria-expanded') !== 'true';
menuToggle.setAttribute('aria-expanded', String(open));
mobileMenu.hidden = !open;
});
[menuToggle, mobileMenu].forEach((el) => el.addEventListener('focusout', (e) => { if (!mobileMenu.hidden && e.relatedTarget && !inMenu(e.relatedTarget)) closeMenu(); }));
document.addEventListener('click', (e) => { if (!mobileMenu.hidden && !inMenu(e.target)) closeMenu(); });
mobileMenu.addEventListener('click', (e) => {
const a = e.target.closest('a[href]');
if (!a || a.target === '_blank' || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
closeMenu();
});
document.addEventListener('keydown', (e) => {
if (e.key !== 'Escape') return;
const open = navItems.find((li) => li.classList.contains('is-open'));
if (open) { setOpen(open, false); open.querySelector('.nav__link').focus(); }
if (!mobileMenu.hidden) { closeMenu(); menuToggle.focus(); }
});
const dialog = document.getElementById('booking');
const frame = dialog ? dialog.querySelector('iframe') : null;
const general = (frame && frame.dataset.src) || 'https://mediway.carevender.app/';
let lastUrl = null, loadedAt = 0;
const countBooking = (leaving) => {
if (!leaving && typeof gtagAfterTap === 'function') gtagAfterTap('event', 'leads_booking_click');
else if (typeof gtag === 'function') gtag('event', 'leads_booking_click');
};
const CATALOGUE = 'https://mediway-api.carevender.app/api/OnlineAppointment/OnlineBooking?clinicToken=8a9539f9fe684707a4aa49d2760fa58a&orgToken=68f95f3b77114cbabf102721f9cf6f09';
let catalogue = null, readAt = 0, reading = null, current = null;
const indexed = (d) => {
const list = d && Array.isArray(d.serviceData) ? d.serviceData.filter((c) => c && c.category && Array.isArray(c.services) && c.services.length) : [];
const byId = new Map();
list.forEach((c) => c.services.forEach((s) => { const id = s && s.id != null ? String(s.id).trim() : ''; if (id) byId.set(id, (byId.get(id) || []).concat([[c, s]])); }));
return list.length ? { list, byId } : null;
};
const KEPT = 'mw-carevender', fresh = (at) => Date.now() - at >= 0 && Date.now() - at < 18e5;
const read = (ms) => {
if (catalogue && fresh(readAt)) return Promise.resolve(catalogue);
try {
const e = JSON.parse(sessionStorage.getItem(KEPT)), got = fresh(e.at) && indexed(e);
if (got) { catalogue = got; readAt = e.at; return Promise.resolve(got); }
} catch (e) { }
if (!reading) {
const stop = new AbortController(), timer = setTimeout(() => stop.abort(), 15000);
reading = fetch(CATALOGUE, { signal: stop.signal, credentials: 'omit' }).then((r) => (r.ok ? r.json() : null))
.then((d) => {
const got = indexed(d);
if (got) {
catalogue = got; readAt = Date.now();
try { sessionStorage.setItem(KEPT, JSON.stringify({ at: readAt, serviceData: got.list })); } catch (e) { }
}
return got;
})
.catch(() => null).finally(() => { clearTimeout(timer); reading = null; });
}
return Promise.race([reading, new Promise((done) => setTimeout(() => done(null), ms))]);
};
const words = (s) => (s ? s.trim().split(/\s+/) : []);
const made = (url, ids, list, first) => ({ url, general: !/[?&](category|groupcategory)=/.test(url),
offline: ids === 'not_online', ids: ids === 'not_online' ? [] : words(ids), one: /[?&]service=/.test(url),
list: list || (/[?&]groupcategory=/.test(url) ? url : general), first: words(first) });
const targetOf = (a) => {
const url = bookingFor(a), page = document.body.dataset;
return Object.assign(made(url, a.dataset.bookIds || (url === (page.booking || general) ? page.bookingIds : ''),
a.dataset.bookList, url === general ? page.bookingFirst : ''), { choose: a.dataset.bookChoose || '' });
};
let line = null;
const note = (n) => { const p = document.createElement('p'); p.className = 'booking__note'; p.textContent = 'In the next step, choose ' + n + '.';
p.style.cssText = 'margin:0;padding:8px 22px;font-size:var(--type-caption);background:var(--color-tint-blue)'; return p; };
const say = (n) => { if (line) line.remove(); line = n && !matchMedia('(max-width: 640px)').matches ? note(n) : null; if (line) dialog.querySelector('.booking__bar').after(line); };
const beside = (a) => { const n = a.dataset.bookChoose, at = a.nextElementSibling; if (n && !(at && at.className === 'booking__note')) a.after(note(n)); };
const placed = (t, c) => {
const pairs = [];
t.ids.forEach((id) => (c.byId.get(id) || []).forEach((p) => { if (pairs.indexOf(p) < 0) pairs.push(p); }));
return { pairs, cats: c.list.filter((x) => pairs.some((p) => p[0] === x)) };
};
const reads = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
const first = (all, x, name) => all.find((y) => reads(name(y)) === reads(name(x))) === x;
const handOver = (cat, svc, list) => {
const url = new URL(general);
if (list && !first(list, cat, (c) => c.category)) url.searchParams.set('groupcategory', reads(cat.category));
else {
url.searchParams.set('category', cat.category);
if (svc && first(cat.services, svc, (s) => s.name)) url.searchParams.set('service', svc.name);
}
return url.href;
};
const link = (t, c) => {
if (!c || t.offline || !t.ids.length) return t.url;
const at = placed(t, c);
return at.cats.length !== 1 ? t.list : handOver(at.cats[0], t.one && at.pairs.length === 1 ? at.pairs[0][1] : null, c.list);
};
function openBookingUrl(url, explicit, target) {
current = target;
const leaving = !frame || typeof dialog.showModal !== 'function';
if (!leaving) say(target && target.choose);
countBooking(leaving);
if (leaving) { window.location.href = url; return; }
let completed = false;
try { completed = !!(frame.contentWindow && frame.contentWindow.location.href.indexOf('booking-success-popup') !== -1); } catch (e) { completed = false; }
if (!lastUrl || completed || Date.now() - loadedAt > 60 * 60 * 1000 || (explicit && lastUrl !== url)) {
frame.src = url + (url.indexOf('?') === -1 ? '?' : '&') + 'cb=' + Date.now();
lastUrl = url;
loadedAt = Date.now();
}
const bare = !dialog.open;
if (bare) dialog.setAttribute('open', '');
requestAnimationFrame(() => setTimeout(() => {
if (!dialog.open) return;
if (bare) { dialog.removeAttribute('open'); dialog.showModal(); }
document.body.classList.add('has-dialog');
document.documentElement.classList.add('has-dialog');
}, 0));
}
const opening = (url, explicit) => openBookingUrl(url, explicit, made(url, '', '', url === general ? document.body.dataset.bookingFirst : ''));
window.openHeaderBooking = (category) => opening(general + (category ? '?' + new URLSearchParams({ category }).toString() : ''), !!category);
window.openHeaderBookingGroup = (group) => opening(general + (group ? '?groupcategory=' + encodeURIComponent(group) + '/' : ''), true);
window.closeHeaderBooking = () => { if (dialog && dialog.open) dialog.close(); };
window.openBooking = () => {
const p = document.body.dataset, t = made(p.booking || general, p.bookingIds, '', p.bookingFirst), url = link(t, catalogue);
openBookingUrl(url, url !== general, t);
};
const bookingFor = (a) => (/^https?:/.test(a.dataset.book) ? a.dataset.book
: a.closest('.site-header, .phone-menu, .mobile-bar') ? general : (document.body.dataset.booking || general));
document.querySelectorAll('[data-book]').forEach((a) => { a.href = bookingFor(a); });
document.addEventListener('click', (e) => {
const a = e.target.closest('[data-book]');
if (!a || e.button > 0) return;
if (e.metaKey || e.ctrlKey || e.shiftKey) {
countBooking();
beside(a);
return;
}
e.preventDefault();
const t = targetOf(a), url = link(t, catalogue);
openBookingUrl(url, url !== general, t);
});
document.addEventListener('auxclick', (e) => {
if (e.button === 1 && e.target.closest('[data-book]')) { countBooking(); beside(e.target.closest('[data-book]')); }
});
if (!editMode && dialog && matchMedia('(min-width: 641px)').matches && document.querySelector('body[data-booking-ids]:not([data-booking-ids="not_online"]), [data-book-ids]:not([data-book-ids="not_online"]), #pkg-data')) {
const idle = () => read(15000).then((c) => { if (c) document.querySelectorAll('[data-book]').forEach((a) => { a.href = link(targetOf(a), c); }); });
const later = () => (window.requestIdleCallback ? requestIdleCallback(idle, { timeout: 5000 }) : setTimeout(idle, 1000));
if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
}
window.mwBooking = { read, placed, handOver, reads, general, current: () => current, address: (a) => link(targetOf(a), catalogue) };
if (dialog) {
dialog.querySelector('.booking__close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => { document.body.classList.remove('has-dialog'); document.documentElement.classList.remove('has-dialog'); });
}
if (!reduceMotion && 'IntersectionObserver' in window) {
const counter = new IntersectionObserver((entries) => entries.forEach((entry) => {
if (!entry.isIntersecting) return;
const el = entry.target, end = +el.dataset.count, t0 = performance.now(), ms = 900;
counter.unobserve(el);
el.textContent = '$0';
const step = (t) => {
if (el.dataset.counted) return;
const k = Math.min(1, (t - t0) / ms);
if (k < 1) { el.textContent = '$' + Math.round(end * (1 - Math.pow(1 - k, 3))); requestAnimationFrame(step); }
else { el.textContent = el.dataset.real; el.dataset.counted = '1'; }
};
requestAnimationFrame(step);
}));
document.querySelectorAll('[data-count]').forEach((el) => {
if (el.getBoundingClientRect().top < window.innerHeight) return;
el.dataset.real = el.textContent;
counter.observe(el);
});
addEventListener('beforeprint', () => document.querySelectorAll('[data-count]').forEach((el) => { counter.unobserve(el); if (el.dataset.real) { el.dataset.counted = '1'; el.textContent = el.dataset.real; } }));
}
document.querySelectorAll('[data-filter]').forEach((box) => {
const btns = [...box.querySelectorAll('[data-filter-btn]')];
const items = [...box.querySelectorAll('[data-group]')];
btns.forEach((b) => b.addEventListener('click', () => {
const on = b.getAttribute('aria-pressed') !== 'true';
btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b && on)));
items.forEach((it) => { it.hidden = on && it.dataset.group !== b.dataset.filterBtn; });
}));
});
document.querySelectorAll('[role="tablist"]').forEach((list) => {
const tabs = [...list.querySelectorAll('[role="tab"]')];
function select(tab) {
tabs.forEach((t) => {
const on = t === tab;
t.setAttribute('aria-selected', String(on));
t.tabIndex = on ? 0 : -1;
document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
});
tab.focus();
}
const isTabs = () => list.getAttribute('role') === 'tablist';
tabs.forEach((tab, i) => {
tab.addEventListener('click', () => { if (isTabs()) select(tab); });
tab.addEventListener('keydown', (e) => {
if (!isTabs()) return;
const down = list.getAttribute('aria-orientation') === 'vertical';
const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1, ...(down ? { ArrowDown: i + 1, ArrowUp: i - 1 } : {}) }[e.key];
if (next === undefined) return;
e.preventDefault();
select(tabs[(next + tabs.length) % tabs.length]);
});
});
});
const finderNarrow = window.matchMedia('(max-width: 900px)');
document.querySelectorAll('.dx-find__list').forEach((list) => {
const opts = [...list.querySelectorAll('.dx-find__opt')];
const answers = opts.map((b) => (b.nextElementSibling && b.nextElementSibling.classList.contains('dx-find__inline') ? b.nextElementSibling : null));
if (!opts.length || answers.includes(null)) return;
const panels = opts.map((b) => b.getAttribute('aria-controls'));
let cur = 0;
opts.forEach((b, i) => {
answers[i].id = panels[i] + '-inline';
b.addEventListener('click', () => {
if (list.getAttribute('role') === 'tablist') return;
const open = b.getAttribute('aria-expanded') !== 'true';
opts.forEach((x) => x.setAttribute('aria-expanded', String(open && x === b)));
if (open) cur = i;
});
});
function sync() {
const tabs = !finderNarrow.matches;
if (list.getAttribute('role') === 'tablist') cur = Math.max(0, opts.findIndex((b) => b.getAttribute('aria-selected') === 'true'));
list.setAttribute('role', tabs ? 'tablist' : 'group');
if (tabs) list.setAttribute('aria-orientation', 'vertical'); else list.removeAttribute('aria-orientation');
opts.forEach((b, i) => {
const on = i === cur;
if (tabs) { b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; b.removeAttribute('aria-expanded'); }
else { b.removeAttribute('role'); b.removeAttribute('aria-selected'); b.removeAttribute('tabindex'); b.setAttribute('aria-expanded', String(on)); }
b.setAttribute('aria-controls', tabs ? panels[i] : answers[i].id);
document.getElementById(panels[i]).hidden = !on;
});
}
sync();
if (finderNarrow.addEventListener) finderNarrow.addEventListener('change', sync); else finderNarrow.addListener(sync);
});
document.querySelectorAll('[data-open-now]').forEach((el) => {
let rows = [];
try { rows = JSON.parse(el.dataset.hours || '[]'); } catch (e) { return; }
const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));
const mins = now.getHours() * 60 + now.getMinutes();
const at = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
el.hidden = !rows.some((r) => r.days.includes(now.getDay()) && mins >= at(r.opens) && mins < at(r.closes));
});
const sgDay = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' })).getDay();
document.querySelectorAll('.hours-card [data-days]').forEach((row) => {
row.classList.toggle('is-today', row.dataset.days.split(',').map(Number).includes(sgDay));
});
document.querySelectorAll('.faq').forEach((faq) => {
const items = [...faq.querySelectorAll('.faq__item')];
items.forEach((item) => item.addEventListener('toggle', () => {
if (!item.open) return;
items.forEach((other) => { if (other !== item && other.open) other.open = false; });
}));
});
if (!reduceMotion && 'IntersectionObserver' in window) {
const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
if (!entry.isIntersecting) return;
const el = entry.target;
el.classList.add('is-in');
io.unobserve(el);
const done = (e) => { if (e.target !== el || e.propertyName !== 'opacity') return; el.removeEventListener('transitionend', done); el.classList.remove('reveal', 'is-in'); el.style.transitionDelay = ''; };
el.addEventListener('transitionend', done);
}), { rootMargin: '0px 0px -8% 0px' });
document.addEventListener('focusin', (e) => {
if (!focusVisible || !e.target.matches || !e.target.matches(':focus-visible')) return;
for (let el = e.target.closest && e.target.closest('.reveal'); el; el = el.parentElement && el.parentElement.closest('.reveal')) {
io.unobserve(el);
el.classList.remove('reveal', 'is-in'); el.style.transitionDelay = '';
if (el.getAnimations) el.getAnimations().forEach((a) => a.finish());
}
});
if (document.body.classList.contains('page-inner')) {
document.querySelectorAll('main :is(.card, .steps__item, .faq-topic, .faq__item, .img-reads__row, .why__item, .map-wrap):not(.page-hero *):not(.card *):not(.faq-topic *):not(.flow__card)')
.forEach((el) => { if (el.getClientRects().length) el.setAttribute('data-reveal', ''); });
}
document.querySelectorAll('[data-reveal]').forEach((el, i) => {
if (el.getBoundingClientRect().top < window.innerHeight) return;
el.classList.add('reveal');
el.style.transitionDelay = `${(i % 4) * 70}ms`;
io.observe(el);
});
}
})();
(function () {
const side = document.querySelector('.blog-post__grid--a > .blog-side');
const main = side && side.parentElement.querySelector(':scope > .blog-post__main');
if (!main) return;
const wide = window.matchMedia('(min-width: 1101px)');
const place = () => {
if (wide.matches === (side.nextElementSibling === main)) return;
const f = document.activeElement;
if (wide.matches) main.before(side); else main.after(side);
if (f && f !== document.activeElement && f.isConnected) f.focus({ preventScroll: true });
};
place();
if (wide.addEventListener) wide.addEventListener('change', place); else wide.addListener(place);
})();
(function () {
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
const io = new IntersectionObserver((entries) => entries.forEach((e) => {
if (e.isIntersecting) { e.target.classList.add('is-grown'); io.unobserve(e.target); }
}), { rootMargin: '0px 0px -15% 0px' });
document.querySelectorAll('[data-grow]').forEach((el) => {
if (el.getBoundingClientRect().top < innerHeight) return;
el.classList.add('grow-ready');
io.observe(el);
});
})();
(function () {
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
const DRAW = 1800;
document.querySelectorAll('.steps').forEach((list) => {
const items = [...list.querySelectorAll('.steps__item')];
const nums = items.map((i) => i.querySelector('.steps__num'));
if (!nums.length) return;
function measure() {
const last = items[items.length - 1];
list.style.setProperty('--steps-line-top', nums[0].offsetTop + nums[0].offsetHeight / 2 + 'px');
list.style.setProperty('--steps-line-bottom', (list.offsetHeight - (last.offsetTop + nums[nums.length - 1].offsetTop + nums[nums.length - 1].offsetHeight / 2)) + 'px');
}
measure(); addEventListener('resize', measure);
if (getComputedStyle(list, '::before').display === 'none') return;
list.style.setProperty('--steps-draw-time', DRAW + 'ms');
list.classList.add('steps--draw');
const io = new IntersectionObserver((entries) => {
if (!entries.some((e) => e.isIntersecting)) return;
io.disconnect();
measure();
const vertical = getComputedStyle(list, '::before').width === '2px';
const lr = list.getBoundingClientRect(), cs = getComputedStyle(list, '::before');
const start = vertical ? lr.top + parseFloat(cs.top) : lr.left + parseFloat(cs.left);
const length = vertical ? parseFloat(cs.height) : parseFloat(cs.width);
list.classList.add('is-drawing');
nums.forEach((n, i) => {
const r = n.getBoundingClientRect();
const centre = vertical ? r.top + r.height / 2 : r.left + r.width / 2;
const share = Math.min(1, Math.max(0, (centre - start) / length));
setTimeout(() => items[i].classList.add('is-lit'), share * DRAW);
});
}, { threshold: 0.45 });
io.observe(list);
});
})();
(function () {
const bar = document.querySelector('[data-subnav]');
const hero = document.querySelector('.page-hero');
if (!bar || !hero) return;
const links = [...bar.querySelectorAll('a[href^="#"]')];
const targets = links.map((a) => document.getElementById(a.getAttribute('href').slice(1)));
const footer = document.querySelector('.site-footer');
function update() {
const pastHero = hero.getBoundingClientRect().bottom < 80;
const atFooter = footer && footer.getBoundingClientRect().top < innerHeight * 0.6;
bar.classList.toggle('is-shown', pastHero && !atFooter);
let current = -1;
targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < innerHeight / 3) current = i; });
links.forEach((a, i) => {
if (i === current) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
});
const on = links[current];
if (on && bar.classList.contains('is-shown')) {
const list = on.parentElement.parentElement;
const l = on.offsetLeft - 24, r = on.offsetLeft + on.offsetWidth + 24;
if (l < list.scrollLeft || r > list.scrollLeft + list.clientWidth) list.scrollTo({ left: l, behavior: 'smooth' });
}
}
let ticking = false;
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { update(); ticking = false; }); } }, { passive: true });
addEventListener('resize', update);
update();
})();
(function () {
const flows = document.querySelectorAll('[data-flow]');
if (!flows.length) return;
const NS = 'http://www.w3.org/2000/svg';
const SPEED = 900;
const R = 18;
const STAGGER = 110;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
flows.forEach((flow, n) => {
const dots = [...flow.querySelectorAll('.flow-steps__dot')];
const node = flow.querySelector('.flow__node');
const ticks = [...flow.querySelectorAll('.flow-checks__tick')];
const card1 = flow.querySelector('.flow__card--steps');
const card2 = flow.querySelector('.flow__card--checks');
const alone = !node || !card2;
if (!dots.length || !card1 || (alone && dots.length < 2)) return;
const svg = document.createElementNS(NS, 'svg');
svg.setAttribute('class', 'flow__line');
svg.setAttribute('aria-hidden', 'true');
svg.setAttribute('focusable', 'false');
const id = 'flow-line-' + n;
svg.innerHTML = '<defs><linearGradient id="' + id + '" gradientUnits="userSpaceOnUse"><stop offset="0"/><stop offset="1"/></linearGradient></defs><path stroke="url(#' + id + ')"/>';
const grad = svg.querySelector('linearGradient');
const path = svg.querySelector('path');
flow.prepend(svg);
flow.classList.add('is-js');
function box(el) {
let x = 0, y = 0;
for (let e = el; e && e !== flow; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; }
return { x, y, w: el.offsetWidth, h: el.offsetHeight, cx: x + el.offsetWidth / 2, cy: y + el.offsetHeight / 2 };
}
let geo = null, drawn = 0, target = 0, raf = 0, last = 0, ticksLit = false;
function build() {
const b = dots.map(box), d0 = b[0], t = ticks.map(box), c1 = box(card1);
const row = b.length > 1 && Math.abs(b[1].cy - d0.cy) < 2;
const marks = [];
let d, total, end;
if (alone) {
const dn = b[b.length - 1];
d = 'M' + d0.cx + ',' + d0.cy + (row ? ' H' + dn.cx : ' V' + dn.cy);
total = row ? dn.cx - d0.cx : dn.cy - d0.cy;
b.forEach((p, i) => marks.push([row ? p.cx - d0.cx : p.cy - d0.cy, dots[i]]));
end = { x: dn.cx, y: dn.cy };
path.setAttribute('d', d);
grad.setAttribute('x1', d0.cx); grad.setAttribute('y1', d0.cy);
grad.setAttribute('x2', end.x); grad.setAttribute('y2', end.y);
path.style.strokeDasharray = total + ' ' + (total + 20);
geo = { row, total, marks, from: d0.cy, to: end.y };
return;
}
const nd = box(node), c2 = box(card2);
if (row) {
const y0 = d0.cy, xr = c1.x + c1.w - 22, yg = (c1.y + c1.h + c2.y) / 2, arc = Math.PI * R / 2;
const l1 = xr - R - d0.cx, l2 = yg - y0 - 2 * R, l3 = xr - nd.cx - 2 * R, l4 = nd.cy - yg - R;
d = 'M' + d0.cx + ',' + y0 + ' H' + (xr - R) + ' A' + R + ',' + R + ' 0 0 1 ' + xr + ',' + (y0 + R) +
' V' + (yg - R) + ' A' + R + ',' + R + ' 0 0 1 ' + (xr - R) + ',' + yg +
' H' + (nd.cx + R) + ' A' + R + ',' + R + ' 0 0 0 ' + nd.cx + ',' + (yg + R) + ' V' + nd.cy;
total = l1 + l2 + l3 + l4 + 3 * arc;
b.forEach((p, i) => marks.push([p.cx - d0.cx, dots[i]]));
marks.push([total, node]);
end = { x: xr, y: nd.cy };
} else {
const lastP = t.length ? t[t.length - 1] : nd;
d = "M" + d0.cx + "," + d0.cy + " V" + lastP.cy;
total = lastP.cy - d0.cy;
b.forEach((p, i) => marks.push([p.cy - d0.cy, dots[i]]));
marks.push([nd.cy - d0.cy, node]);
t.forEach((p, i) => marks.push([p.cy - d0.cy, ticks[i]]));
end = { x: d0.cx, y: lastP.cy };
}
path.setAttribute('d', d);
grad.setAttribute('x1', d0.cx); grad.setAttribute('y1', d0.cy);
grad.setAttribute('x2', end.x); grad.setAttribute('y2', end.y);
path.style.strokeDasharray = total + ' ' + (total + 20);
geo = { row, total, marks, from: d0.cy, to: row ? nd.cy : end.y };
}
function paint() {
path.style.strokeDashoffset = String(geo.total - drawn);
geo.marks.forEach(([at, el]) => { if (drawn >= at - 0.5) el.classList.add('is-lit'); });
if (geo.row && drawn >= geo.total - 0.5 && !ticksLit) {
ticksLit = true;
ticks.forEach((el, i) => setTimeout(() => el.classList.add('is-lit'), reduce ? 0 : 120 + i * STAGGER));
}
}
function frame(ts) {
const dt = last ? (ts - last) / 1000 : 0;
last = ts;
drawn = Math.min(target, drawn + SPEED * dt);
paint();
if (drawn < target) raf = requestAnimationFrame(frame);
else { raf = 0; last = 0; }
}
function update() {
if (!geo) return;
if (reduce) { target = drawn = geo.total; paint(); return; }
const seen = Math.min(innerHeight - 90, innerHeight * 0.85) - flow.getBoundingClientRect().top;
const share = Math.max(0, Math.min(1, (seen - geo.from) / Math.max(1, geo.to - geo.from)));
const want = share * geo.total;
if (want > target) {
target = want;
if (!raf) raf = requestAnimationFrame(frame);
}
}
function relayout() {
const share = geo ? drawn / geo.total : 0, shareTarget = geo ? target / geo.total : 0;
build();
drawn = share * geo.total;
target = shareTarget * geo.total;
paint();
update();
}
relayout();
addEventListener('scroll', () => { if (target < geo.total) update(); }, { passive: true });
if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(flow);
else addEventListener('resize', relayout);
});
})();
(function () {
const choose = document.querySelector('[data-ft-choose]');
if (!choose) return;
const sec = choose.closest('section');
const btns = [...choose.querySelectorAll('[data-ft-show]')];
const show = (who) => {
btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ftShow === who)));
sec.querySelectorAll('[data-ft-for]').forEach((el) => { el.hidden = !el.dataset.ftFor.split(' ').includes(who); });
};
choose.hidden = false;
btns.forEach((b) => b.addEventListener('click', () => show(b.dataset.ftShow)));
show('female');
})();
(function () {
const rail = document.querySelector('[data-ft-rail]');
if (!rail) return;
const links = [...rail.querySelectorAll('a[href^="#"]')];
const targets = links.map((a) => document.getElementById(a.getAttribute('href').slice(1)));
const update = () => {
let current = -1;
targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < innerHeight * 0.35) current = i; });
links.forEach((a, i) => { if (i === current) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
};
let ticking = false;
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { update(); ticking = false; }); } }, { passive: true });
update();
})();
