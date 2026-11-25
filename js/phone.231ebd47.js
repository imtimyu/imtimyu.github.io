(function () {
const phone = window.matchMedia('(max-width: 640px)');
const icon = (name) => {
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.setAttribute('class', 'ico'); svg.setAttribute('aria-hidden', 'true');
const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
use.setAttribute('href', '#i-' + name); svg.appendChild(use);
return svg;
};
const cards = [...document.querySelectorAll('.footer-card')].filter((c) => c.querySelector('.footer-links'));
cards.forEach((card, i) => { const list = card.querySelector('.footer-links'); if (!list.id) list.id = 'footer-links-' + i; });
function fold(on) {
cards.forEach((card) => {
const title = card.querySelector('.footer-card__title');
const list = card.querySelector('.footer-links');
const btn = title.querySelector('.footer-card__toggle');
if (on && !btn) {
const b = document.createElement('button');
b.type = 'button'; b.className = 'footer-card__toggle';
b.setAttribute('aria-controls', list.id); b.setAttribute('aria-expanded', 'false');
b.append(title.textContent, icon('chevron'));
b.addEventListener('click', () => {
const open = b.getAttribute('aria-expanded') !== 'true';
b.setAttribute('aria-expanded', String(open));
card.classList.toggle('is-collapsed', !open);
});
title.replaceChildren(b);
card.classList.add('is-collapsed');
} else if (!on && btn) {
title.replaceChildren(btn.textContent);
card.classList.remove('is-collapsed');
}
});
}
const hero = document.querySelector('.page-hero');
const headings = [...document.querySelectorAll('main > section:not(.page-hero) h2')];
let toc = null;
if (hero && headings.length >= 4 && !document.querySelector('[data-no-page-toc]')) {
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
toc = document.createElement('nav');
toc.className = 'page-toc container'; toc.setAttribute('aria-label', 'On this page');
const details = document.createElement('details');
const summary = document.createElement('summary');
summary.append('On this page', icon('chevron'));
const ol = document.createElement('ol');
headings.forEach((h, i) => {
const text = h.textContent.replace(/\s+/g, ' ').trim();
let target = h.id;
if (!target) {
const id = slug(text), taken = document.getElementById(id);
if (taken && taken.contains(h)) target = id;
else { target = taken ? `${id}-${i + 1}` : id; h.id = target; }
}
const a = document.createElement('a'); a.href = '#' + target; a.textContent = text;
a.addEventListener('click', () => { details.open = false; });
const li = document.createElement('li'); li.append(a); ol.append(li);
});
details.append(summary, ol); toc.append(details);
hero.after(toc);
}
function apply() { fold(phone.matches); }
apply();
phone.addEventListener('change', apply);
})();
