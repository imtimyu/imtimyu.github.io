// Allergy Test page (merged 2026-10-06): tap 54 or 83 (a panel card, or the switch over the list) to switch the
// allergen list. The 54 view hides the 83 panel's extra allergens (the pink "+" chips) and their counts; every
// control showing a panel stays in step. After the first tap the extras pop back in when 83 is chosen.
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

// Option B's left column stays in the middle of the screen while the list scrolls (css: .al-split__sticky); it needs
// its own height, which changes when the guide under the cards switches.
(function () {
  document.querySelectorAll('.al-split__sticky').forEach((el) => {
    const set = () => el.style.setProperty('--al-side-h', el.offsetHeight + 'px');
    set();
    if ('ResizeObserver' in window) new ResizeObserver(set).observe(el);
  });
})();

// The targeted panels: once they are in view, each card's allergen lines come in one by one (css: .al-tp--anim).
(function () {
  const list = document.querySelector('[data-al-tp]');
  if (!list || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  if (list.getBoundingClientRect().top < innerHeight) return;   // already on screen when the page opens: leave it be
  list.classList.add('al-tp--anim');
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { list.classList.add('is-shown'); io.disconnect(); }
  }, { rootMargin: '0px 0px -15% 0px' });
  io.observe(list);
})();
