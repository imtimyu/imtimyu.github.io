(function () {
const island = document.getElementById('pkg-data');
if (!island) return;
const D = JSON.parse(island.textContent);
const L = D.labels;
const MAX = D.maxCompare || 3;
const bySlug = Object.fromEntries(D.packages.map((p) => [p.slug, p]));
const order = D.packages.map((p) => p.slug);
let picked = [];
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const icon = (name) => {
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.setAttribute('class', 'ico'); svg.setAttribute('aria-hidden', 'true');
const use = document.createElementNS('http://www.w3.org/2000/svg', 'use'); use.setAttribute('href', '#i-' + name); svg.append(use);
return svg;
};
const meta = (p) => `${p.price} ${p.priceNote} • ${p.tests} tests • ${p.type}`;
function openDialog(d) { if (typeof d.showModal === 'function') { d.showModal(); document.body.classList.add('has-dialog'); document.documentElement.classList.add('has-dialog'); } }
function wire(d) {
d.querySelector('.pkg-dialog__close').addEventListener('click', () => d.close());
d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
d.addEventListener('close', () => {
if (!document.querySelector('dialog[open]')) { document.body.classList.remove('has-dialog'); document.documentElement.classList.remove('has-dialog'); }
});
}
const tray = document.querySelector('.pkg-tray');
const chips = tray.querySelector('.pkg-tray__chips');
const openBtn = tray.querySelector('[data-compare-open]');
const clearTray = () => { document.documentElement.style.scrollPaddingBottom = tray.hidden ? '' : Math.ceil(innerHeight - tray.getBoundingClientRect().top + 8) + 'px'; };
addEventListener('resize', clearTray);
function toggle(slug) {
if (picked.includes(slug)) picked = picked.filter((s) => s !== slug);
else if (picked.length < MAX) picked = [...picked, slug].sort((a, b) => order.indexOf(a) - order.indexOf(b));
render();
}
function render() {
document.querySelectorAll('[data-compare]').forEach((b) => {
const on = picked.includes(b.dataset.compare);
b.setAttribute('aria-pressed', String(on));
b.textContent = on ? L.selected : L.compare;
b.disabled = !on && picked.length >= MAX;
b.closest('.pkg').classList.toggle('is-selected', on);
});
chips.replaceChildren(...picked.map((s) => {
const c = el('button', 'pkg-tray__chip'); c.type = 'button';
c.append(bySlug[s].name, icon('close'));
c.setAttribute('aria-label', `${bySlug[s].name}: remove`);
c.addEventListener('click', () => toggle(s));
return c;
}));
tray.hidden = picked.length === 0;
openBtn.disabled = picked.length < 2;
document.body.classList.toggle('has-pkg-tray', picked.length > 0);
clearTray();
if (current) syncDialogCompare();
}
document.querySelectorAll('[data-compare]').forEach((b) => b.addEventListener('click', () => toggle(b.dataset.compare)));
tray.querySelector('[data-compare-clear]').addEventListener('click', () => { picked = []; render(); });
const details = document.getElementById('pkg-details');
wire(details);
let current = null;
const dBody = details.querySelector('.pkg-dialog__body');
const dCompare = details.querySelector('.pkg-dialog__compare');
function syncDialogCompare() {
const on = picked.includes(current);
dCompare.setAttribute('aria-pressed', String(on));
dCompare.textContent = on ? L.selected : L.addCompare;
dCompare.disabled = !on && picked.length >= MAX;
}
function showDetails(slug) {
const p = bySlug[slug]; current = slug;
details.querySelector('.pkg-dialog__title').textContent = p.name;
details.querySelector('.pkg-dialog__meta').textContent = meta(p);
details.querySelector('.pkg-dialog__wa').href = D.whatsapp + '?text=' + D.whatsappText.replace('%s', encodeURIComponent(p.name));
const book = details.querySelector('.pkg-dialog__book');
book.textContent = `${L.bookPrefix} ${p.name}`;
const ids = (D.bookIds || {})[slug];
book.dataset.book = (D.book || {})[slug] || '';
if (ids) { book.dataset.bookIds = ids; book.dataset.bookList = D.bookList || ''; } else { delete book.dataset.bookIds; delete book.dataset.bookList; }
book.href = window.mwBooking ? window.mwBooking.address(book) : (book.dataset.book || document.body.dataset.booking || book.href);
syncDialogCompare();
dBody.querySelectorAll('.pkg-full').forEach((f) => { f.hidden = f.dataset.pkg !== slug; });
dBody.scrollTop = 0;
openDialog(details);
}
document.querySelectorAll('[data-details]').forEach((b) => b.addEventListener('click', () => showDetails(b.dataset.details)));
dCompare.addEventListener('click', () => toggle(current));
document.querySelectorAll('.pkg-dialog [data-book]').forEach((a) => a.addEventListener('click', () => a.closest('dialog').close(), true));
const compare = document.getElementById('pkg-compare');
wire(compare);
const table = compare.querySelector('.pkg-compare');
let showAll = false;
function rows(slugs) {
const groups = [];
order.filter((s) => slugs.includes(s)).forEach((s) => bySlug[s].groups.forEach((g) => {
let G = groups.find((x) => x.name === g.name);
if (!G) { G = { name: g.name, tests: [] }; groups.push(G); }
g.tests.forEach((t) => { if (!G.tests.includes(t)) G.tests.push(t); });
}));
return groups;
}
function has(slug, group, test) { const g = bySlug[slug].groups.find((x) => x.name === group); return !!g && g.tests.includes(test); }
function drawTable() {
const cols = picked.map((s) => bySlug[s]);
const thead = el('thead'); const hr = el('tr');
const corner = el('th', 'pkg-compare__corner'); corner.scope = 'col';
corner.append(el('span', 'pkg-compare__label', L.compareTableTitle));
const lab = el('label', 'pkg-compare__all'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = showAll;
cb.addEventListener('change', () => { showAll = cb.checked; drawTable(); table.querySelector('input').focus(); });
lab.append(cb, ' ' + L.showAll); corner.append(lab); hr.append(corner);
cols.forEach((p) => { const th = el('th', 'pkg-compare__pkg'); th.scope = 'col'; th.append(el('span', 'pkg-compare__name', p.name), el('span', 'pkg-compare__price', p.price), el('span', 'pkg-compare__count', `${p.tests} tests`)); hr.append(th); });
thead.append(hr);
const tbody = el('tbody');
rows(showAll ? order : picked).forEach((g) => {
const gr = el('tr', 'pkg-compare__group'); const gh = el('th', null, g.name); gh.colSpan = cols.length + 1; gh.scope = 'colgroup'; gr.append(gh); tbody.append(gr);
g.tests.forEach((t) => {
const tr = el('tr'); const th = el('th', null, t); th.scope = 'row'; tr.append(th);
cols.forEach((p) => {
const td = el('td'); const yes = has(p.slug, g.name, t);
td.className = yes ? 'is-yes' : 'is-no';
if (yes) td.append(icon('check')); else td.append(el('span', 'pkg-compare__dash', '–'));
td.append(el('span', 'sr-only', yes ? 'Included' : 'Not included'));
tr.append(td);
});
tbody.append(tr);
});
});
table.style.setProperty('--cols', cols.length);
table.replaceChildren(thead, tbody);
}
openBtn.addEventListener('click', () => { if (picked.length < 2) return; drawTable(); compare.querySelector('.pkg-compare__scroll').scrollTop = 0; openDialog(compare); });
render();
})();
