(function () {
const svg = document.querySelector('.ribbon');
if (!svg) return;
const path = svg.querySelector('path');
const grad = svg.querySelector('#ribbon-grad');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const WIDE = 1280;
const compactBelow = +svg.dataset.compactBelow || 0;
const compactMq = compactBelow ? window.matchMedia(`(max-width: ${compactBelow - 1}px)`) : null;
const compact = () => !!compactMq && compactMq.matches;
let lookup = [];
let len = 0;
let lenToHeart = 0;
let heartTop = 0;
const HEART = [
[[90, 92], [70, 93], [60, 90]],
[[54, 88], [58, 83], [62, 80]],
[[88, 60], [106, 44], [106, 26]],
[[106, 12], [94, 4], [82, 4]],
[[72, 4], [65, 10], [60, 18]],
[[55, 10], [48, 4], [38, 4]],
[[26, 4], [14, 12], [14, 26]],
[[14, 42], [30, 58], [56, 78]],
[[42, 88], [30, 92], [2, 92]],
];
const HEART_START = [118, 92];
const CROSS = [[[60, 32], [60, 54]], [[49, 43], [71, 43]]];
const HEART_SCROLL = 240;
function heartPath(box) {
const sx = box.width / 120, sy = box.height / 100;
const P = ([x, y]) => `${(box.left + x * sx).toFixed(1)} ${(box.top + y * sy).toFixed(1)}`;
let d = '';
HEART.forEach(([c1, c2, p]) => { d += ` C ${P(c1)}, ${P(c2)}, ${P(p)}`; });
return d;
}
const crossPaths = CROSS.map(() => {
const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
el.setAttribute('class', 'ribbon__cross');
svg.appendChild(el);
return el;
});
let crossLen = 0;
function placeCross(box) {
const sx = box.width / 120, sy = box.height / 100;
const P = ([x, y]) => `${(box.left + x * sx).toFixed(1)} ${(box.top + y * sy).toFixed(1)}`;
CROSS.forEach(([a, b], i) => crossPaths[i].setAttribute('d', `M ${P(a)} L ${P(b)}`));
crossLen = crossPaths[0].getTotalLength();
crossPaths.forEach((el) => { el.style.strokeDasharray = String(crossLen); });
}
function setCross(q) {
crossPaths.forEach((el) => { el.style.strokeDashoffset = String(crossLen * (1 - q)); });
}
function rect(sel) {
const el = document.querySelector(sel);
if (!el) return null;
const r = el.getBoundingClientRect();
return { top: r.top + scrollY, bottom: r.bottom + scrollY, left: r.left + scrollX, right: r.right + scrollX, width: r.width, height: r.height };
}
function smooth(pts) {
const t = 0.18;
const n = pts.length;
const tan = pts.map((p, i) => {
const a = pts[i - 1] || p;
const b = pts[i + 1] || p;
return [(b[0] - a[0]) * t, (b[1] - a[1]) * t];
});
tan[n - 1][1] = 0;
tan[n - 2][1] = 0;
let d = `M ${pts[0][0]} ${pts[0][1]}`;
for (let i = 0; i < n - 1; i++) {
const p1 = pts[i];
const p2 = pts[i + 1];
d += ` C ${p1[0] + tan[i][0]} ${p1[1] + tan[i][1]}, ${p2[0] - tan[i + 1][0]} ${p2[1] - tan[i + 1][1]}, ${p2[0]} ${p2[1]}`;
}
return d;
}
function widePoints(docW) {
const hero = rect('[data-ribbon="hero-photo"]');
const services = rect('[data-ribbon="services"] .bento');
const about = rect('[data-ribbon="about"]');
const why = rect('[data-ribbon="why"] .why');
const heart = rect('[data-ribbon="heart"]');
const margin = Math.max(24, services.left);
const rightX = docW - margin / 2;
const heartY = heart.top + (HEART_START[1] / 100) * heart.height;
const photoOnRight = hero.left > docW * 0.35;
const grid = rect('.hero__grid') || hero;
const under = Math.max(grid.bottom, (rect('.hero__hours') || grid).bottom) + 36;
const start = photoOnRight
? [[-20, under], [grid.left + grid.width * 0.45, under + 6], [grid.right + margin * 0.35, under - 24]]
: [[-20, hero.top + hero.height * 0.22], [hero.left + hero.width * 0.1, hero.top + hero.height * 0.3],
[hero.left + hero.width * 0.6, hero.top + hero.height * 0.5], [hero.right + margin * 0.35, hero.bottom - 30]];
return [
...start,
[rightX, services.top + services.height * 0.45],
[rightX - margin * 0.2, about.top + about.height * 0.5],
[rightX, why.top + why.height * 0.4],
[rightX, why.bottom + 24],
[heart.right + 140, heartY],
[heart.left + (HEART_START[0] / 120) * heart.width, heartY],
];
}
function narrowPath(docW) {
const heart = rect('[data-ribbon="heart"]');
const heroBottom = rect('.hero__media').bottom;
const blocks = [
rect('[data-ribbon="services"] > .container'),
rect('[data-ribbon="about"] > .container'),
rect('[data-ribbon="why"] > .container'),
];
const gutter = Math.max(8, blocks[0].left);
const lane = [gutter * 0.5, docW - gutter * 0.5];
const heartY = heart.top + (HEART_START[1] / 100) * heart.height;
const heartRight = heart.left + (HEART_START[0] / 120) * heart.width;
const pad = 12;
const cross = (x0, y0, x1, y1) => {
const k = (y1 - y0) * 0.55;
return ` C ${x0} ${y0 + k}, ${x1} ${y1 - k}, ${x1} ${y1}`;
};
let d = `M ${lane[0]} ${heroBottom + 6}` + cross(lane[0], heroBottom + 6, lane[1], blocks[0].top - pad);
let side = 1;
blocks.forEach((b, i) => {
d += ` L ${lane[side]} ${b.bottom + pad}`;
const next = blocks[i + 1];
if (next) {
const to = 1 - side;
d += cross(lane[side], b.bottom + pad, lane[to], next.top - pad);
side = to;
}
});
const last = blocks[blocks.length - 1];
let y = last.bottom + pad;
if (side === 0) {
const mid = (y + heartY) / 2;
d += cross(lane[0], y, lane[1], mid);
y = mid;
}
const k = (heartY - y) * 0.6;
d += ` C ${lane[1]} ${y + k}, ${heartRight + Math.min(90, (lane[1] - heartRight) * 0.5)} ${heartY}, ${heartRight} ${heartY}`;
return { d, y1: heroBottom, y2: heartY };
}
function buildLookup() {
lookup = [];
const steps = 240;
for (let i = 0; i <= steps; i++) {
const l = (lenToHeart * i) / steps;
lookup.push([path.getPointAtLength(l).y, l]);
}
for (let i = 1; i < lookup.length; i++) lookup[i][0] = Math.max(lookup[i][0], lookup[i - 1][0]);
}
function lengthAtY(y) {
if (y <= lookup[0][0]) return 0;
for (let i = 1; i < lookup.length; i++) {
if (lookup[i][0] >= y) {
const [y0, l0] = lookup[i - 1];
const [y1, l1] = lookup[i];
return y1 === y0 ? l1 : l0 + ((y - y0) / (y1 - y0)) * (l1 - l0);
}
}
return lenToHeart;
}
function onScroll() {
if (reduceMotion || !lookup.length || compact()) return;
const target = scrollY + innerHeight * 0.7;
const p = target < heartTop ? 0 : Math.min(1, (target - heartTop) / HEART_SCROLL);
const HEART_SHARE = 0.78;
const drawn = target < heartTop ? lengthAtY(target) : lenToHeart + (len - lenToHeart) * Math.min(1, p / HEART_SHARE);
path.style.strokeDashoffset = String(len - drawn);
setCross(Math.max(0, (p - HEART_SHARE) / (1 - HEART_SHARE)));
}
function draw() {
if (compact()) return;
svg.setAttribute('width', 0);
svg.setAttribute('height', 0);
const docW = document.documentElement.clientWidth;
const docH = document.documentElement.scrollHeight;
svg.setAttribute('width', docW);
svg.setAttribute('height', docH);
svg.setAttribute('viewBox', `0 0 ${docW} ${docH}`);
svg.classList.toggle('ribbon--narrow', docW < WIDE);
let approach, y1;
if (docW >= WIDE) {
const pts = widePoints(docW);
approach = smooth(pts);
y1 = pts[0][1];
} else {
const n = narrowPath(docW);
approach = n.d;
y1 = n.y1;
}
const box = rect('[data-ribbon="heart"]');
heartTop = box.top + (92 / 100) * box.height;
path.setAttribute('d', approach);
lenToHeart = path.getTotalLength();
path.setAttribute('d', approach + heartPath(box));
placeCross(box);
grad.setAttribute('y1', y1);
grad.setAttribute('y2', box.top);
document.querySelector('[data-ribbon="heart"]').classList.add('is-traced');
len = path.getTotalLength();
path.style.strokeDasharray = String(len);
if (reduceMotion) { path.style.strokeDashoffset = '0'; setCross(1); return; }
buildLookup();
onScroll();
}
let raf;
function schedule() { if (compact()) return; cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
window.addEventListener('load', schedule);
window.addEventListener('resize', schedule);
window.addEventListener('scroll', () => { if (!compact()) requestAnimationFrame(onScroll); }, { passive: true });
if (document.fonts) document.fonts.ready.then(schedule);
if (compactMq) compactMq.addEventListener('change', schedule);
const sign = document.querySelector('.ribbon-sign');
if (sign && compact() && !reduceMotion && 'IntersectionObserver' in window && sign.getBoundingClientRect().top > innerHeight) {
const finish = () => sign.classList.remove('is-waiting', 'is-drawing');
const io = new IntersectionObserver((entries) => {
if (!entries.some((e) => e.isIntersecting)) return;
io.disconnect();
sign.classList.replace('is-waiting', 'is-drawing');
sign.querySelector('.ribbon-sign__cross').addEventListener('animationend', finish, { once: true });
}, { rootMargin: '0px 0px -100px 0px', threshold: 1 });
sign.classList.add('is-waiting');
io.observe(sign);
document.addEventListener('visibilitychange', () => { if (document.hidden) { io.disconnect(); finish(); } });
}
})();
