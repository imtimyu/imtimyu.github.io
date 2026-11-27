(function () {
const phone = window.matchMedia('(max-width: 640px)');
const root = document.body;
document.addEventListener('touchstart', () => {}, { passive: true });
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const EASE = 'cubic-bezier(.2, 0, 0, 1)';
const moving = () => phone.matches && !reduce.matches;
const sliding = new Set();
const intended = (box, drawnOpen) => (box._slide ? box._slide.opening : drawnOpen);
function drop(box) {
const a = box._slide;
if (!a) return;
a.onfinish = null; a.oncancel = null; a.cancel();
box.style.overflow = a.overflowBefore; box._slide = null; sliding.delete(box);
}
function slide(box, apply, undo, opening) {
const from = box.getBoundingClientRect().height;
drop(box);
if (!moving() || !box.animate) { apply(); return; }
apply();
const to = box.getBoundingClientRect().height;
if (!opening) undo();
if (Math.abs(to - from) < 2) { if (!opening) apply(); return; }
const overflowBefore = box.style.overflow;
box.style.overflow = 'hidden';
const a = box.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: 200, easing: EASE });
a.opening = opening; a.overflowBefore = overflowBefore;
box._slide = a; sliding.add(box);
a.onfinish = a.oncancel = () => { box.style.overflow = overflowBefore; box._slide = null; sliding.delete(box); if (!opening) apply(); };
}
const settle = () => sliding.forEach((box) => {
const a = box._slide, end = a && a.onfinish;
if (!a) return;
a.onfinish = null; a.oncancel = null; a.cancel();
if (end) end();
});
const menu = document.getElementById('phone-menu');
const toggle = document.querySelector('.menu-toggle');
if (menu && toggle) {
const focusable = () => [...menu.querySelectorAll('a[href], button, summary')].filter((el) => el.offsetParent !== null);
const nav = menu.querySelector('.phone-menu__nav'), live = document.getElementById('mobile-menu');
const arrow = () => {
const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
s.setAttribute('class', 'ico ico--sm'); s.setAttribute('aria-hidden', 'true');
const u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#i-arrow'); s.append(u);
return s;
};
const fillNav = () => {
if (!nav || !live || nav.childElementCount) return;
for (const el of live.children) {
if (el.matches('a[href]')) {
const a = el.cloneNode(true); a.classList.add('phone-menu__item'); a.append(' ', arrow()); nav.append(a);
} else if (el.matches('details')) {
const d = document.createElement('details'), sub = document.createElement('div');
d.className = 'phone-menu__group'; sub.className = 'phone-menu__sub';
for (const c of el.childNodes) {
if (c.nodeName === 'SUMMARY') { const s = c.cloneNode(true); s.classList.add('phone-menu__item'); d.append(s); }
else sub.append(c.cloneNode(true));
}
d.append(sub); nav.append(d);
}
}
};
let isOpen = false, leaving = 0;
const liveControls = toggle.getAttribute('aria-controls');
const controls = () => toggle.setAttribute('aria-controls', phone.matches ? 'phone-menu' : liveControls || 'mobile-menu');
controls();
const behind = () => [document.querySelector('main'), document.querySelector('footer'), document.querySelector('.mobile-bar')].filter(Boolean);
const afterPaint = (fn) => requestAnimationFrame(() => setTimeout(fn, 0));
let settling = 0;
const setOpen = (open, back = true) => {
clearTimeout(leaving); menu.classList.remove('is-leaving');
isOpen = open;
if (open) {
fillNav();
menu.style.transform = '';
if (menu.hidden) { menu.classList.toggle('is-entering', moving()); menu.hidden = false; }
} else {
menu.classList.remove('is-entering');
if (!menu.hidden) {
if (moving()) { menu.classList.add('is-leaving'); leaving = setTimeout(() => { menu.hidden = true; menu.classList.remove('is-leaving'); }, 150); }
else menu.hidden = true;
}
}
toggle.setAttribute('aria-expanded', String(open));
const mine = ++settling;
afterPaint(() => {
if (mine !== settling) return;
menu.classList.remove('is-entering');
root.classList.toggle('has-menu', open);
document.documentElement.classList.toggle('has-menu', open);
behind().forEach((el) => { el.inert = open; });
if (open) { menu.querySelector('.phone-menu__scroll').scrollTop = 0; menu.querySelector('.phone-menu__close').focus(); }
else if (back) toggle.focus();
});
};
document.addEventListener('click', (e) => {
if (!phone.matches || !e.target.closest('.menu-toggle')) return;
e.preventDefault(); e.stopImmediatePropagation();
setOpen(!isOpen);
}, true);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) setOpen(false); });
menu.querySelector('.phone-menu__close').addEventListener('click', () => setOpen(false));
menu.addEventListener('keydown', (e) => {
if (e.key !== 'Tab') return;
const f = focusable(), first = f[0], last = f[f.length - 1];
if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
menu.addEventListener('click', (e) => {
const a = e.target.closest('a[href]');
if (!a || a.target === '_blank' || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
setOpen(false, false);
});
menu.querySelector('.phone-menu__search').addEventListener('click', (e) => {
e.stopPropagation();
setOpen(false, false);
const trigger = document.querySelector('.site-search__trigger');
if (trigger) trigger.click();
setTimeout(() => { const input = document.getElementById('site-search-input'); if (input) input.focus(); }, 60);
});
const menuScroll = menu.querySelector('.phone-menu__scroll');
let dragY = null, dragBy = 0;
menu.addEventListener('touchstart', (e) => {
dragY = isOpen && menuScroll.scrollTop <= 0 && !e.target.closest('input, textarea') ? e.touches[0].clientY : null; dragBy = 0;
}, { passive: true });
menu.addEventListener('touchmove', (e) => {
if (dragY === null) return;
dragBy = e.touches[0].clientY - dragY;
if (dragBy <= 0 || menuScroll.scrollTop > 0) { dragY = null; dragBy = 0; menu.style.transform = ''; return; }
e.preventDefault();
menu.style.transition = 'none'; menu.style.transform = 'translateY(' + Math.round(dragBy * 0.6) + 'px)';
}, { passive: false });
const dragEnd = () => {
if (dragY === null) return;
dragY = null; menu.style.transition = '';
if (dragBy > 90) setOpen(false); else menu.style.transform = '';
};
menu.addEventListener('touchend', dragEnd);
menu.addEventListener('touchcancel', dragEnd);
phone.addEventListener('change', (e) => { controls(); if (!e.matches && isOpen) setOpen(false, false); });
}
const pressed = () => document.querySelectorAll('a.is-tapped').forEach((a) => a.classList.remove('is-tapped'));
document.addEventListener('click', (e) => {
if (!phone.matches || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
const a = e.target.closest('a[href]');
if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
const url = new URL(a.href, location.href);
if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
if (url.pathname === location.pathname && url.search === location.search) return;
let line = document.querySelector('.nav-progress');
if (!line) { line = document.createElement('div'); line.className = 'nav-progress'; line.setAttribute('aria-hidden', 'true'); root.append(line); void line.offsetWidth; }
pressed(); a.classList.add('is-tapped'); root.classList.add('is-navigating');
});
window.addEventListener('pageshow', () => { pressed(); root.classList.remove('is-navigating'); });
document.addEventListener('click', (e) => {
const sum = e.target.closest('summary'), d = sum && sum.parentElement;
if (!d || d.tagName !== 'DETAILS' || e.defaultPrevented || !moving()) return;
const inner = e.target.closest('a, button, input, select, textarea, label');
if (inner && inner !== sum && sum.contains(inner)) return;
e.preventDefault();
const open = !intended(d, d.open);
slide(d, () => { d.open = open; }, () => { d.open = !open; }, open);
});
const pick = (sel) => {
if (!sel || !sel.startsWith('h2=')) return sel ? document.querySelector(sel) : null;
const want = sel.slice(3).trim().toLowerCase();
const h = [...document.querySelectorAll('main section h2')].find((x) => x.textContent.replace(/\s+/g, ' ').trim().toLowerCase().startsWith(want));
return h ? h.closest('main > section, main > div > section') : null;
};
let plan = {};
try { plan = JSON.parse(document.body.dataset.phonePlan || '{}'); } catch (e) { plan = {}; }
const moves = [];
const hero = document.querySelector('main > .page-hero') || document.querySelector('main > .hub-hero');
if (hero) {
(plan.first || []).forEach((sel) => { const el = pick(sel); if (el) moves.push({ el, home: document.createComment(' phone order ') }); });
}
const card = plan.photoAfter && document.querySelector('.page-hero .ft-rc-wrap');
const cardHome = document.createComment(' phone photo ');
const cardBox = document.createElement('div');
cardBox.className = 'container photo-moved';
function applyOrder(on) {
if (!hero) return;
if (on) {
let after = hero.nextElementSibling && hero.nextElementSibling.classList.contains('page-toc') ? hero.nextElementSibling : hero;
moves.forEach((m) => {
if (!m.home.parentNode) m.el.before(m.home);
after.after(m.el); after = m.el;
});
const target = card && pick(plan.photoAfter);
if (target) {
if (!cardHome.parentNode) card.before(cardHome);
cardBox.append(card); target.after(cardBox);
} else if (card) card.classList.add('is-staying');
} else {
moves.forEach((m) => { if (m.home.parentNode) { m.home.replaceWith(m.el); } });
if (card && cardHome.parentNode) { cardHome.replaceWith(card); cardBox.remove(); }
}
}
applyOrder(phone.matches);
const folds = [];
(plan.fold || []).forEach((cfg) => {
const sec = pick(cfg.section);
const h2 = sec && sec.querySelector('h2');
if (!h2) return;
const keep = [h2, ...(cfg.keep ? sec.querySelectorAll(cfg.keep) : [])];
const parts = [];
const walk = (el) => {
for (const c of el.children) {
if (keep.includes(c)) continue;
if (keep.some((k) => c.contains(k))) walk(c); else parts.push(c);
}
};
walk(sec);
if (!parts.length) return;
const clinicOpen = root.classList.contains('phone-v2--clinic-open') && sec.dataset.ribbon === 'why';
const btn = cfg.alwaysOpen || clinicOpen ? null : document.createElement('button');
const track = cfg.swipe ? sec.querySelector(cfg.swipe) : null;
if ((btn || track) && !h2.id) h2.id = 'pf-head-' + folds.length;
const set = (open) => {
sec.classList.toggle('is-open', open);
parts.forEach((p) => p.classList.toggle('pf-hide', !open));
if (btn) {
btn.setAttribute('aria-expanded', String(open));
btn.firstChild.textContent = open ? 'Show less' : 'Read more';
}
};
if (btn) {
btn.type = 'button'; btn.className = 'pf-toggle';
btn.setAttribute('aria-describedby', h2.id);
btn.innerHTML = '<span>Read more</span><svg class="ico" aria-hidden="true"><use href="#i-chevron"/></svg>';
btn.addEventListener('click', () => {
const open = !intended(sec, sec.classList.contains('is-open'));
if (!open && h2.getBoundingClientRect().top < 0) { set(false); h2.scrollIntoView({ block: 'start' }); return; }
slide(sec, () => set(open), () => set(!open), open);
});
}
const before = (a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
const outer = keep.filter((k) => !keep.some((o) => o !== k && o.contains(k)));
const lead = outer.filter((k) => k !== h2).sort(before)[0] || h2;
const anchor = parts.find((x) => lead.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_FOLLOWING) || parts[0];
const ahead = parts.filter((x) => x !== anchor && (x.compareDocumentPosition(h2) & Node.DOCUMENT_POSITION_FOLLOWING))
.map((el) => ({ el, home: document.createComment(' phone fold ') }));
folds.push({ sec, btn, set, anchor, ahead, track, headingId: h2.id, mounted: false });
});
function applyFolds(on) {
folds.forEach((f) => {
if (on === f.mounted) return;
f.mounted = on;
f.sec.classList.toggle('pf', on);
if (f.track) {
f.track.toggleAttribute('data-phone-swipe', on);
if (on) {
f.track.tabIndex = 0;
f.track.setAttribute('role', 'region');
f.track.setAttribute('aria-labelledby', f.headingId);
} else {
f.track.removeAttribute('tabindex');
f.track.removeAttribute('role');
f.track.removeAttribute('aria-labelledby');
}
}
if (on) {
if (f.btn) f.anchor.before(f.btn);
f.ahead.forEach((a) => { a.el.before(a.home); f.anchor.before(a.el); });
f.set(!f.btn);
} else {
if (f.btn) f.btn.remove();
f.ahead.forEach((a) => { if (a.home.parentNode) a.home.replaceWith(a.el); });
f.set(true); f.sec.classList.remove('is-open');
}
});
}
function openTarget() {
let id = '';
try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { return; }
const el = id && document.getElementById(id);
const f = el && folds.find((x) => x.sec.contains(el) && x.sec.classList.contains('pf'));
if (f) { f.set(true); el.scrollIntoView(); }
}
const barBook = document.querySelector('.mobile-bar__book[data-book-own]');
const barLive = barBook ? barBook.dataset.book : '';
let barHref = null;
function applyBar(on) {
if (!barBook) return;
if (barHref === null) barHref = barBook.getAttribute('href');
barBook.dataset.book = on ? barBook.dataset.bookOwn : barLive;
barBook.setAttribute('href', on ? barBook.dataset.bookOwn : barHref);
}
const floatBar = document.querySelector('.mobile-bar--v2');
const toTop = floatBar && document.createElement('button');
let floatY = window.scrollY;
const floatBusy = () => root.classList.contains('has-menu') || root.classList.contains('page-nav-open') || root.classList.contains('has-dialog');
function placeFloat(away) {
floatBar.classList.toggle('is-away', away);
toTop.classList.toggle('is-shown', away && window.scrollY > window.innerHeight && !floatBusy());
}
const cmpTray = floatBar && document.querySelector('.pkg-panel .pkg-tray');
let trayHeld = false;
function trayFoot() {
const r = cmpTray && !cmpTray.hidden ? cmpTray.getBoundingClientRect() : null;
const held = !!r && r.top < window.innerHeight && r.bottom > window.innerHeight - floatBar.offsetHeight - 8 && !floatBar.contains(document.activeElement);
if (held) { floatBar.classList.add('is-away'); toTop.classList.remove('is-shown'); }
else if (trayHeld) { floatY = window.scrollY; placeFloat(false); }
trayHeld = held;
return held;
}
if (floatBar) {
toTop.type = 'button'; toTop.className = 'to-top'; toTop.setAttribute('aria-label', 'Back to top');
toTop.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-chevron"/></svg>';
floatBar.after(toTop);
toTop.addEventListener('click', () => {
window.scrollTo({ top: 0, behavior: moving() ? 'smooth' : 'auto' });
const to = document.querySelector('main h1') || document.getElementById('main-content');
if (to) { if (!to.hasAttribute('tabindex')) to.setAttribute('tabindex', '-1'); to.focus({ preventScroll: true }); }
});
window.addEventListener('scroll', () => {
if (!phone.matches || floatBusy()) return;
if (cmpTray && trayFoot()) return;
const y = window.scrollY;
if (y <= 8) { floatY = y; placeFloat(false); return; }
if (Math.abs(y - floatY) < 8) return;
const up = y < floatY;
floatY = y;
if (up && floatBar.contains(document.activeElement)) return;
placeFloat(up);
}, { passive: true });
new MutationObserver(() => { if (floatBusy()) toTop.classList.remove('is-shown'); else if (cmpTray && phone.matches) trayFoot(); }).observe(root, { attributes: true, attributeFilter: ['class'] });
if (cmpTray) {
const recheck = () => { if (phone.matches && !floatBusy()) trayFoot(); };
new MutationObserver(recheck).observe(cmpTray, { attributes: true, attributeFilter: ['hidden'] });
window.addEventListener('resize', recheck);
}
}
function applyFloat(on) {
if (floatBar && !on) { floatBar.classList.remove('is-away'); toTop.classList.remove('is-shown'); trayHeld = false; }
else if (cmpTray && !floatBusy()) trayFoot();
}
function realPrices() {
document.querySelectorAll('[data-count]').forEach((el) => {
const plain = el.cloneNode(false);
plain.removeAttribute('data-count');
plain.textContent = '$' + el.dataset.count;
el.replaceWith(plain);
});
}
const header = document.querySelector('.site-header');
const navBox = header && header.querySelector('.page-nav');
if (document.body.classList.contains('phone-v2--nav') && navBox) {
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const text = (h) => h.textContent.replace(/\s+/g, ' ').trim();
const isEnd = (h) => !!h.closest('section.book, section.section--related, section#directions, #directions');
navBox.id = 'page-nav';
navBox.innerHTML = '<nav aria-label="On this page"><ol></ol></nav>';
const ol = navBox.querySelector('ol');
let heads = [], own = [];
const build = () => {
heads = [...document.querySelectorAll('main section h2')].filter((h) => !h.closest('.page-hero'));
heads.forEach((h) => {
if (h.id) return;
let id = slug(h.textContent) || 'section', n = 2;
while (document.getElementById(id)) id = slug(h.textContent) + '-' + n++;
h.id = id;
});
own = heads.filter((h) => !isEnd(h));
ol.replaceChildren();
heads.forEach((h, i) => {
const end = isEnd(h), n = own.indexOf(h) + 1;
const a = document.createElement('a'); a.href = '#' + h.id;
a.innerHTML = '<span class="page-nav__num" aria-hidden="true"></span><span class="page-nav__txt"></span>';
a.firstChild.textContent = end ? '' : String(n).padStart(2, '0');
a.lastChild.textContent = text(h);
const li = document.createElement('li'); li.append(a);
if (end) li.className = 'is-end' + (i > 0 && !isEnd(heads[i - 1]) ? ' is-first-end' : '');
ol.append(li);
});
};
build();
const btn = document.createElement('button');
btn.type = 'button'; btn.className = 'page-nav__btn'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'page-nav');
btn.innerHTML = '<span class="page-nav__top"><span class="page-nav__label">On this page</span><span class="page-nav__count"></span></span><span class="page-nav__now"></span><svg class="ico" aria-hidden="true"><use href="#i-chevron"/></svg>';
header.querySelector('.site-header__logo').after(btn);
const now = btn.querySelector('.page-nav__now');
const count = btn.querySelector('.page-nav__count');
const veil = document.createElement('div'); veil.className = 'page-nav__veil'; veil.hidden = true;
document.body.append(veil);
const bar = document.querySelector('.mobile-bar');
const fit = () => {
const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
const top = header.getBoundingClientRect().bottom + 8;
const foot = bar && bar.getClientRects().length && !bar.classList.contains('is-away') ? vh - bar.getBoundingClientRect().top : 0;
navBox.style.maxHeight = Math.max(200, Math.round(vh - top - foot - 12)) + 'px';
};
const more = () => navBox.classList.toggle('has-more', navBox.scrollTop + navBox.clientHeight < navBox.scrollHeight - 4);
navBox.addEventListener('scroll', more, { passive: true });
let openedAt = 0;
const setOpen = (open) => {
navBox.hidden = !open; veil.hidden = !open;
btn.setAttribute('aria-expanded', String(open));
header.classList.toggle('is-nav-open', open);
document.body.classList.toggle('page-nav-open', open);
if (open) {
openedAt = window.scrollY;
fit();
const cur = ol.querySelector('a[aria-current]');
navBox.scrollTop = cur && cur.offsetTop + cur.offsetHeight > navBox.clientHeight ? cur.offsetTop - 8 : 0;
more();
}
};
setOpen(false);
btn.addEventListener('click', () => setOpen(navBox.hidden));
veil.addEventListener('click', () => setOpen(false));
ol.addEventListener('click', (e) => {
const a = e.target.closest('a');
if (!a) return;
setOpen(false);
const h = document.getElementById(a.hash.slice(1));
if (h) setTimeout(() => { if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }, 400);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !navBox.hidden) { setOpen(false); btn.focus(); } });
document.addEventListener('click', (e) => { if (!navBox.hidden && !header.contains(e.target)) setOpen(false); });
window.addEventListener('resize', () => { if (!navBox.hidden) fit(); });
const hero = document.querySelector('.page-hero');
let ticking = false, shownFor;
const update = () => {
ticking = false;
const on = phone.matches && hero && hero.getBoundingClientRect().bottom < 80;
const line = header.getBoundingClientRect().bottom + 24;
let current = null;
heads.forEach((h) => { if (h.getBoundingClientRect().top <= line) current = h; });
header.classList.toggle('has-page-nav', on);
if (!navBox.hidden && (!on || Math.abs(window.scrollY - openedAt) > 24)) setOpen(false);
if (current === shownFor) return;
shownFor = current;
now.textContent = current ? text(current) : '';
const n = current ? own.indexOf(current) + 1 : 0;
count.textContent = n > 0 ? n + ' / ' + own.length : '';
ol.querySelectorAll('a').forEach((a) => {
if (current && a.hash === '#' + current.id) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
});
};
window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
phone.addEventListener('change', () => setTimeout(() => { build(); shownFor = undefined; update(); }, 0));
requestAnimationFrame(update);
}
const boxes = [...document.querySelectorAll('.blog-side__box')].map((box, i) => {
const head = box.querySelector(':scope > .ft-rc__head'), body = head && head.nextElementSibling;
if (!head || !body) return null;
if (!body.id) body.id = 'side-box-' + i;
return { box, head, body, title: null, btn: null };
}).filter(Boolean);
function applyBoxes(on) {
boxes.forEach((b) => {
if (on && !b.btn) {
const btn = document.createElement('button');
btn.type = 'button'; btn.className = 'side-box__toggle';
btn.setAttribute('aria-controls', b.body.id); btn.setAttribute('aria-expanded', 'false');
b.title = [...b.head.childNodes];
btn.append(...b.title);
btn.insertAdjacentHTML('beforeend', '<svg class="ico" aria-hidden="true"><use href="#i-chevron"/></svg>');
btn.addEventListener('click', () => {
const open = !intended(b.box, btn.getAttribute('aria-expanded') === 'true');
const set = (o) => { btn.setAttribute('aria-expanded', String(o)); b.box.classList.toggle('is-collapsed', !o); };
slide(b.box, () => set(open), () => set(!open), open);
});
b.head.append(btn); b.btn = btn; b.box.classList.add('is-collapsed');
} else if (!on && b.btn) {
b.head.replaceChildren(...b.title); b.btn = null; b.box.classList.remove('is-collapsed');
}
});
}
const pkgRows = [...document.querySelectorAll('.section--packages .pkg, .section--ch-packages .pkg')].map((card, i) => {
const name = card.querySelector('.pkg__name'), list = card.querySelector('.pkg__list');
if (!name || !list) return null;
if (!name.id) name.id = 'pkg-name-' + i;
if (!list.id) list.id = (card.id || 'pkg-' + i) + '-list';
return { card, name, list, btn: null, plain: !card.querySelector('[data-compare]'), extras: [], badge: null };
}).filter(Boolean);
const plainRows = pkgRows.filter((r) => r.plain);
function dress(r, on) {
if (on && !r.extras.length) {
const i = plainRows.indexOf(r);
const dot = document.createElement('span');
dot.className = 'icon-dot icon-dot--sm icon-dot--toned ' + (r.card.classList.contains('pkg--featured') ? 'tone-pink' : 'tone-blue') + ' pkg__dot';
dot.setAttribute('aria-hidden', 'true');
dot.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-users"/></svg>';
const meter = document.createElement('span'); meter.className = 'pkg__meter'; meter.setAttribute('aria-hidden', 'true');
for (let k = 0; k < plainRows.length; k++) { const b = document.createElement('i'); if (k <= i) b.className = 'on'; meter.append(b); }
r.card.prepend(dot); r.card.append(meter); r.extras = [dot, meter];
const badge = r.card.querySelector(':scope > .pkg__badge');
if (badge) { r.badge = { el: badge, home: badge.nextSibling }; r.name.after(badge); }
} else if (!on && r.extras.length) {
r.extras.forEach((e) => e.remove()); r.extras = [];
if (r.badge) { r.card.insertBefore(r.badge.el, r.badge.home); r.badge = null; }
}
}
const pkgGrid = document.querySelector('.section--packages .pkg-grid, .section--ch-packages .pkg-grid');
const firstCompare = document.querySelector('.section--packages [data-compare]');
const sharedQuote = document.querySelector('.section--ch-packages .pkg__quote');
const pkgHint = document.createElement('p'); pkgHint.className = 'pkg-grid__hint';
pkgHint.textContent = firstCompare ? firstCompare.textContent.trim() : (sharedQuote ? sharedQuote.textContent.trim() : '');
function applyPkgRows(on) {
pkgRows.forEach((r) => {
if (on && !r.btn) {
const btn = document.createElement('button');
btn.type = 'button'; btn.className = 'pkg__toggle';
btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', r.list.id); btn.setAttribute('aria-labelledby', r.name.id);
btn.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-chevron"/></svg>';
btn.addEventListener('click', () => {
const open = !intended(r.card, btn.getAttribute('aria-expanded') === 'true');
const set = (o) => { btn.setAttribute('aria-expanded', String(o)); r.card.classList.toggle('is-open', o); };
slide(r.card, () => set(open), () => set(!open), open);
});
r.card.append(btn); r.btn = btn; r.card.classList.add('pkg--row'); if (r.plain) { r.card.classList.add('pkg--plain'); dress(r, true); }
} else if (!on && r.btn) {
r.btn.remove(); r.btn = null; r.card.classList.remove('pkg--row', 'pkg--plain', 'is-open'); if (r.plain) dress(r, false);
}
});
if (pkgGrid && pkgRows.length && pkgHint.textContent) {
if (on && !pkgHint.isConnected) pkgGrid.before(pkgHint);
if (!on && pkgHint.isConnected) pkgHint.remove();
}
}
const openRows = [
...[...document.querySelectorAll('[data-al-tp] > .al-tp__card')].map((box, i) => ({ box, head: box.querySelector('.al-tp__head'), body: box.querySelector('.al-tp__list'), id: 'al-tp-' + i })),
].filter((r) => r.head && r.body).map((r) => ({ ...r, btn: null, name: r.head.querySelector('h3') }));
const tpList = document.querySelector('[data-al-tp]');
function applyOpenRows(on) {
openRows.forEach((r) => {
if (on && !r.btn) {
if (!r.body.id) r.body.id = r.id;
if (r.name && !r.name.id) r.name.id = r.id + '-name';
const btn = document.createElement('button');
btn.type = 'button'; btn.className = 'row-open';
btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', r.body.id);
if (r.name) btn.setAttribute('aria-labelledby', r.name.id);
btn.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-chevron"/></svg>';
btn.addEventListener('click', () => {
const open = !intended(r.box, btn.getAttribute('aria-expanded') === 'true');
const set = (o) => { btn.setAttribute('aria-expanded', String(o)); r.box.classList.toggle('is-open', o); };
slide(r.box, () => set(open), () => set(!open), open);
});
r.box.append(btn); r.btn = btn; r.box.classList.add('is-row');
} else if (!on && r.btn) {
r.btn.remove(); r.btn = null; r.box.classList.remove('is-row', 'is-open');
}
});
if (tpList && on) tpList.classList.remove('al-tp--anim');
}
const chTable = document.querySelector('.section--ch-compare .ch-compare');
let chGroups = null;
function buildChGroups() {
const names = [...chTable.querySelectorAll('thead th')].slice(1).map((th) => th.textContent.trim());
const rows = [...chTable.querySelectorAll('tbody tr')].map((tr) => ({
test: tr.querySelector('th').textContent.trim(),
has: [...tr.querySelectorAll('td')].map((td) => !!td.querySelector('.ch-mark:not(.ch-mark--no)')),
}));
const cards = [...document.querySelectorAll('.section--ch-packages .pkg')];
const cardNames = cards.map((c) => (c.querySelector('.pkg__name') || {}).textContent || '').map((t) => t.trim());
if (cardNames.join('|') !== names.join('|')) return null;
if (rows.some((r) => r.has.length !== names.length)) return null;
const first = rows.map((r) => r.has.indexOf(true));
if (rows.some((r, i) => first[i] < 0 || r.has.some((h, k) => h !== (k >= first[i])))) return null;
const inherit = cards.map((card) => {
const li = card.querySelector('.pkg__list li'); const t = li ? li.textContent.trim() : '';
return /^All of /.test(t) ? t : '';
});
if (inherit.some((t, k) => k > 0 && t !== 'All of ' + names[k - 1])) return null;
const tick = document.querySelector('.section--ch-packages .pkg__list li svg');
const box = document.createElement('div'); box.className = 'ch-groups';
names.forEach((name, k) => {
const tests = rows.filter((r, i) => first[i] === k);
if (!tests.length) return;
const g = document.createElement('section'); g.className = 'ch-group';
const head = document.createElement('div'); head.className = 'ch-group__head';
const h = document.createElement('h3'); h.className = 'ch-group__name'; h.textContent = name;
const meter = document.createElement('span'); meter.className = 'pkg__meter'; meter.setAttribute('aria-hidden', 'true');
names.forEach((x, j) => { const b = document.createElement('i'); if (j <= k) b.className = 'on'; meter.append(b); });
head.append(h, meter); g.append(head);
if (k > 0 && inherit[k]) { const p = document.createElement('p'); p.className = 'ch-group__inherit'; p.textContent = inherit[k]; g.append(p); }
const ul = document.createElement('ul'); ul.className = 'ticks ch-group__tests';
tests.forEach((r) => {
const li = document.createElement('li');
if (tick) li.append(tick.cloneNode(true), ' ');
const sp = document.createElement('span'); sp.textContent = r.test; li.append(sp); ul.append(li);
});
g.append(ul); box.append(g);
});
return box;
}
function applyChGroups(on) {
if (!chTable) return;
const sec = chTable.closest('.section--ch-compare'), wrap = chTable.closest('.ch-compare-wrap') || chTable;
if (on && !chGroups) { chGroups = buildChGroups(); if (chGroups) { wrap.after(chGroups); sec.classList.add('has-groups'); } }
if (!on && chGroups) { chGroups.remove(); chGroups = null; sec.classList.remove('has-groups'); }
}
const upright = [...document.querySelectorAll('.ft-matrix')].filter((m) => m.querySelector('td[data-ft-for]:not([data-ft-for=""])'));
const matrices = upright.map((m) => m.querySelector('table')).filter(Boolean);
const SCROLL_HINT = 'Scroll horizontally on mobile to see all columns.';
const hints = [...document.querySelectorAll('.ft-matrix__note em')].filter((em) => upright.includes(em.closest('.ft-matrix')) && em.firstChild && em.firstChild.nodeType === 3 && em.firstChild.textContent.startsWith(SCROLL_HINT));
function tableRoles(table, on) {
const set = (sel, role) => table.querySelectorAll(sel).forEach((e) => (on ? e.setAttribute('role', role) : e.removeAttribute('role')));
if (on) table.setAttribute('role', 'table'); else table.removeAttribute('role');
set('thead, tbody', 'rowgroup'); set('tr', 'row'); set('th[scope="col"]', 'columnheader');
set('th[scope="row"], th[scope="colgroup"], th[scope="rowgroup"]', 'rowheader'); set('td', 'cell');
}
function applyMatrices(on) {
upright.forEach((m) => m.classList.toggle('is-upright', on));
matrices.forEach((t) => tableRoles(t, on));
hints.forEach((em) => {
const span = em.querySelector(':scope > .tm-scroll-hint');
if (on && !span) {
const hint = document.createElement('span'); hint.className = 'tm-scroll-hint'; hint.textContent = SCROLL_HINT;
em.firstChild.textContent = em.firstChild.textContent.slice(SCROLL_HINT.length); em.prepend(hint);
} else if (!on && span) {
span.remove(); em.firstChild.textContent = SCROLL_HINT + em.firstChild.textContent;
}
});
}
const sheet = document.getElementById('booking');
if (sheet) {
const sheetFrame = sheet.querySelector('iframe');
let loadTimer = 0, closing = 0;
const loaded = () => { clearTimeout(loadTimer); sheet.classList.remove('is-loading'); };
if (sheetFrame) {
new MutationObserver(() => {
if (!phone.matches) return;
sheet.classList.add('is-loading'); clearTimeout(loadTimer); loadTimer = setTimeout(loaded, 15000);
}).observe(sheetFrame, { attributes: true, attributeFilter: ['src'] });
sheetFrame.addEventListener('load', loaded);
}
const closed = () => { closing = 0; sheet.classList.remove('is-closing'); sheet.style.transform = ''; sheet.close(); };
const closeSheet = () => {
if (!sheet.open || closing) return;
if (!moving()) { closed(); return; }
sheet.classList.add('is-closing');
closing = setTimeout(closed, 200);
};
document.addEventListener('click', (e) => {
if (!phone.matches || !sheet.open) return;
if (e.target === sheet || e.target.closest('.booking__close')) { e.preventDefault(); e.stopImmediatePropagation(); closeSheet(); }
}, true);
sheet.addEventListener('cancel', (e) => { if (phone.matches && moving()) { e.preventDefault(); closeSheet(); } });
const sheetBar = sheet.querySelector('.booking__bar');
let sheetY = null, sheetBy = 0;
if (sheetBar) {
sheetBar.addEventListener('touchstart', (e) => {
sheetY = phone.matches && !e.target.closest('a, button') ? e.touches[0].clientY : null; sheetBy = 0;
}, { passive: true });
sheetBar.addEventListener('touchmove', (e) => {
if (sheetY === null) return;
e.preventDefault();
sheetBy = Math.max(0, e.touches[0].clientY - sheetY);
sheet.style.transition = 'none'; sheet.style.transform = 'translateY(' + Math.round(sheetBy) + 'px)';
}, { passive: false });
const sheetEnd = () => {
if (sheetY === null) return;
sheetY = null; sheet.style.transition = '';
if (sheetBy > 100) closeSheet(); else sheet.style.transform = '';
};
sheetBar.addEventListener('touchend', sheetEnd);
sheetBar.addEventListener('touchcancel', sheetEnd);
}
}
document.querySelectorAll('.blog-prose img[style*="--w"]').forEach((img) => {
const arrived = () => img.classList.add('is-in');
if (img.complete) arrived(); else { img.addEventListener('load', arrived, { once: true }); img.addEventListener('error', arrived, { once: true }); }
});
if (phone.matches) {
document.querySelectorAll('main img').forEach((img) => {
if (img.complete) return;
img.classList.add('is-arriving');
const arrived = () => img.classList.remove('is-arriving');
img.addEventListener('load', arrived, { once: true });
img.addEventListener('error', arrived, { once: true });
});
}
const WRAPS = ['is-long', 'is-one-line'];
let oneLine = new WeakMap();
const needOf = (b) => {
let need = 0, parts = 0, inWords = false;
const add = (n) => {
if (n.nodeType === 3) {
if (!n.textContent.trim()) return;
const r = document.createRange(); r.selectNodeContents(n); need += r.getBoundingClientRect().width;
if (!inWords) parts += 1;
inWords = true;
} else if (n.nodeType === 1) {
const ns = getComputedStyle(n);
if (ns.display === 'contents') { n.childNodes.forEach(add); return; }
if (ns.position === 'absolute' || !n.getClientRects().length) return;
need += n.getBoundingClientRect().width; parts += 1; inWords = false;
}
};
b.childNodes.forEach(add);
return need + Math.max(0, parts - 1) * (parseFloat(getComputedStyle(b).columnGap) || 0);
};
const fits = (list) => {
if (!phone.matches) { list.forEach((b) => b.classList.remove(...WRAPS)); return; }
const shown = list.filter((b) => b.getClientRects().length);
const fresh = shown.filter((b) => !oneLine.has(b) && !WRAPS.some((c) => b.classList.contains(c)));
const wraps = new Set(fresh.filter((b) => getComputedStyle(b).whiteSpace !== 'nowrap'));
const was = new Map();
wraps.forEach((b) => { was.set(b, b.style.whiteSpace); b.style.whiteSpace = 'nowrap'; });
fresh.forEach((b) => oneLine.set(b, { need: needOf(b), wraps: wraps.has(b) }));
wraps.forEach((b) => { b.style.whiteSpace = was.get(b); });
const side = (cs, k) => parseFloat(cs['padding' + k]) + parseFloat(cs['border' + k + 'Width']);
const measured = shown.filter((b) => oneLine.has(b));
measured.forEach((b) => b.classList.remove(...WRAPS));
const overs = measured.map((b) => {
const cs = getComputedStyle(b);
return [b, oneLine.get(b).need - (b.getBoundingClientRect().width - side(cs, 'Left') - side(cs, 'Right'))];
});
overs.forEach(([b, over]) => {
b.classList.toggle('is-long', over > 2);
b.classList.toggle('is-one-line', over > 0 && over <= 2 && oneLine.get(b).wraps);
});
};
if ('ResizeObserver' in window) {
const watch = new ResizeObserver((entries) => fits(entries.map((e) => e.target)));
document.querySelectorAll('.btn').forEach((b) => watch.observe(b));
if (document.fonts) document.fonts.ready.then(() => {
oneLine = new WeakMap();
const all = [...document.querySelectorAll('.btn')];
all.forEach((b) => b.classList.remove(...WRAPS));
fits(all);
});
}
const herTest = /\((?:female|women only\b[^)]*)\)/i;
document.querySelectorAll('#pkg-details .pkg-dialog__body, #pkg-compare .pkg-compare').forEach((list) => {
const mark = () => list.querySelectorAll('li, th[scope="row"]').forEach((e) => e.classList.toggle('is-female', phone.matches && herTest.test(e.textContent)));
new MutationObserver(mark).observe(list, { childList: true, subtree: true });
});
const sheetIframe = sheet && sheet.querySelector('iframe');
const MW = window.mwBooking;
if (sheet && sheetIframe && MW) {
const GROUPS = [['Medical Check Up', (k) => /medical$/.test(k)], ['Health Screening', (k) => k.startsWith('healthscreening')],
['Sexual Health', (k) => /hiv|std|hpv|pap/.test(k)], ['Healthcare', () => true]];
const groupOf = (c) => GROUPS.find(([, test]) => test(MW.reads(c.category)))[0];
const tidy = (s) => String(s || '').replace(/\uFFFD/g, '–').replace(/\s+/g, ' ').trim();
const money = (p) => {
const n = typeof p === 'number' || (typeof p === 'string' && p.trim()) ? Number(p) : NaN;
return Number.isFinite(n) && n > 0 ? '$' + (n % 1 ? n.toFixed(2) : n) : '';
};
const svg = (name) => `<svg class="ico" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const chooser = make('div', 'bk-choose');
chooser.hidden = true;
chooser.setAttribute('role', 'region');
chooser.setAttribute('aria-labelledby', 'bk-choose-title');
const back = make('button', 'bk-back');
back.type = 'button'; back.hidden = true;
back.innerHTML = svg('chevron') + 'Back';
const note = make('p', 'bk-note');
note.hidden = true;
const bar = sheet.querySelector('.booking__bar');
bar.prepend(back);
bar.after(note);
sheet.append(chooser);
let stack = [], current = null, handedOff = false, startedWith = null, run = 0, cat = null, handedSrc = '';
const showBack = () => { back.hidden = !(handedOff || stack.length); sheet.classList.toggle('has-back', !back.hidden); };
const showChooser = (on) => { chooser.hidden = !on; sheet.classList.toggle('has-chooser', on); };
const view = (title, fill) => {
chooser.replaceChildren();
chooser.removeAttribute('aria-busy');
const h = make('h2', 'bk-choose__title', title);
h.id = 'bk-choose-title'; h.tabIndex = -1;
chooser.append(h);
fill(chooser);
chooser.scrollTop = 0;
h.focus({ preventScroll: true });
};
const go = (render) => { if (current) stack.push(current); current = render; render(); showBack(); };
const rowsOf = (items) => {
const ul = make('ul', 'bk-list');
items.forEach(([label, price, act]) => {
const b = make('button', 'bk-row');
b.type = 'button';
b.append(make('span', 'bk-row__name', label));
if (price) b.append(make('span', 'bk-row__price', price));
b.insertAdjacentHTML('beforeend', svg('chevron'));
b.addEventListener('click', act);
const li = make('li'); li.append(b); ul.append(li);
});
return ul;
};
const hand = (address) => {
const url = new URL(address);
url.searchParams.set('cb', Date.now());
sheetIframe.src = url.href;
return url.href;
};
const choose = (c, s) => {
const url = MW.handOver(c, s, cat.list);
handedSrc = hand(url);
note.textContent = /[?&]service=/.test(url) ? '' : 'In the next step, choose ' + tidy(s.name) + '.';
note.hidden = !note.textContent;
handedOff = true;
showChooser(false);
showBack();
sheetIframe.focus({ preventScroll: true });
};
const packages = (title, pairs) => () => view(title, (box) => box.append(rowsOf(pairs.map(([c, s]) => [tidy(s.name), money(s.price), () => choose(c, s)]))));
const groupRows = (cs) => {
const rows = [], isHs = (x) => MW.reads(x.category).startsWith('healthscreening');
let hsDone = false;
cs.forEach((c) => {
if (isHs(c)) {
if (hsDone) return;
hsDone = true;
const hs = cs.filter(isHs);
rows.push(['Health Screening', '', () => go(packages('Health Screening', hs.flatMap((x) => x.services.map((s) => [x, s]))))]);
} else rows.push([tidy(c.category), '', () => go(packages(tidy(c.category), c.services.map((s) => [c, s])))]);
});
return rows;
};
const everything = () => view('Book Your Visit', (box) => {
GROUPS.forEach(([name]) => {
const cs = cat.list.filter((c) => groupOf(c) === name);
if (!cs.length) return;
box.append(make('p', 'bk-group', name));
box.append(rowsOf(groupRows(cs)));
});
});
const notOnline = (name) => () => view(name, (box) => {
box.append(make('p', 'bk-text', 'Not listed for online booking. Call or WhatsApp us to book.'));
const acts = make('div', 'bk-actions');
const call = document.querySelector('.mobile-bar__call'), wa = document.querySelector('.mobile-bar__whatsapp');
if (call) { const a = make('a', 'btn btn--soft btn--sm'); a.href = call.getAttribute('href'); a.innerHTML = svg('phone') + 'Call Us'; acts.append(a); }
if (wa) { const a = make('a', 'btn btn--soft btn--sm'); a.href = wa.getAttribute('href'); a.target = '_blank'; a.rel = 'noopener'; a.innerHTML = svg('whatsapp') + 'WhatsApp'; acts.append(a); }
box.append(acts);
box.append(rowsOf([['See services you can book online', '', () => go(everything)]]));
});
const firstFor = (t) => {
if (!t || (!t.general && !t.offline && !t.ids.length)) return [null];
if (t.offline) return [notOnline(tidy(new URL(t.url, location.href).searchParams.get('category'))), null];
const ids = t.ids.length ? t.ids : t.first;
if (!ids.length) return [everything];
const at = MW.placed({ ids }, cat);
if (!at.pairs.length) return [t.list !== MW.general ? t.list : everything];
const title = at.cats.length === 1 || groupOf(at.cats[0]) !== 'Health Screening' ? tidy(at.cats[0].category) : 'Health Screening';
return [packages(title, t.one ? at.pairs : at.cats.flatMap((c) => c.services.map((s) => [c, s]))), t.ids.length ? null : everything];
};
const reset = () => { stack = []; current = null; handedOff = false; note.hidden = true; showChooser(false); showBack(); };
const begin = (t) => {
const mine = ++run;
reset();
startedWith = t;
showChooser(true);
chooser.replaceChildren();
chooser.setAttribute('aria-busy', 'true');
MW.read(2500).then((got) => {
if (mine !== run || !sheet.open || !phone.matches) return;
cat = got;
const [first, under] = got ? firstFor(t) : [null];
if (typeof first === 'string') { hand(first); showChooser(false); return; }
if (!first) { showChooser(false); return; }
if (under) stack = [under];
go(first);
});
};
new MutationObserver((records) => {
if (sheet.open && records.length > 1) return;
if (!sheet.open) { run++; reset(); return; }
if (!phone.matches) { reset(); return; }
const src = sheetIframe.getAttribute('src') || '';
if (handedSrc && src === handedSrc) { handedOff = true; showChooser(false); showBack(); return; }
begin(MW.current());
}).observe(sheet, { attributes: true, attributeFilter: ['open'] });
back.addEventListener('click', () => {
if (handedOff) {
handedOff = false; note.hidden = true;
if (current) { showChooser(true); current(); showBack(); } else begin(startedWith);
return;
}
if (stack.length) { current = stack.pop(); current(); showBack(); }
});
phone.addEventListener('change', (e) => { if (!e.matches) reset(); });
}
function apply() {
if (!phone.matches) settle();
applyMatrices(phone.matches);
applyChGroups(phone.matches);
applyOrder(phone.matches);
applyBar(phone.matches);
applyFloat(phone.matches);
applyFolds(phone.matches);
applyBoxes(phone.matches);
applyPkgRows(phone.matches);
applyOpenRows(phone.matches);
if (phone.matches) realPrices();
}
apply();
openTarget();
phone.addEventListener('change', apply);
window.addEventListener('hashchange', openTarget);
document.querySelectorAll('.img-table th[scope="row"]').forEach((th) => {
if (th.textContent.trim() === '·') th.classList.add('is-dot-only');
});
})();
