// A blog post (2026-10-08): a thin line along the top of the window fills as the article is read. Without the script,
// or with reduced motion, nothing changes (the line stays empty and hidden).
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

// "In this article" marks the section being read
(function () {
  const links = [...document.querySelectorAll('.blog-toc--side a[href^="#"]')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const byId = new Map(links.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.remove('is-current'));
      const a = byId.get(e.target.id);
      if (a) a.classList.add('is-current');
    });
  }, { rootMargin: '-15% 0px -70% 0px' });
  byId.forEach((_, id) => { const h = document.getElementById(id); if (h) io.observe(h); });
})();
