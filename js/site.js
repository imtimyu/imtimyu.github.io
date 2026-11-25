// Behaviour shared by every page: header, menus, booking pop-up, tabs, opening hours, scroll reveal.
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = () => window.matchMedia('(hover: hover)').matches;

  // ---- Header: hide while scrolling down, bring back on scroll up (as the live site does) --------
  const header = document.querySelector('.site-header');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuToggle = document.querySelector('.menu-toggle');
  const navItems = [...document.querySelectorAll('.nav__item')].filter((li) => li.querySelector('.mega'));

  // A section marked data-header-calm (a long list you compare, like the Allergy Test's 54 vs. 83) keeps the header
  // tucked away while it fills the middle of the screen, even when scrolling up (Cedric, 2026-10-06: it "can get in the
  // way"); it comes down when the mouse goes to the top of the window, or on keyboard focus, and as usual once the
  // section is left.
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
  if (calm.length) {
    document.addEventListener('mousemove', (e) => {
      // near the top of the window brings it down; it stays while the mouse is on it or a menu is open
      const reach = header.classList.contains('is-hidden') ? 72 : header.getBoundingClientRect().bottom + 16;
      const near = e.clientY < reach || navItems.some((li) => li.classList.contains('is-open'));
      if (near === pointerTop) return;
      pointerTop = near;
      if (inCalm()) header.classList.toggle('is-hidden', !near && !header.contains(document.activeElement));
    }, { passive: true });
  }

  // ---- Desktop dropdowns: hover or click; close on Escape, outside click, or focus leaving -------
  let closeTimer;
  function setOpen(li, open) {
    li.classList.toggle('is-open', open);
    li.querySelector('.nav__link').setAttribute('aria-expanded', String(open));
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

  // ---- Phone menu --------------------------------------------------------------------------------
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    mobileMenu.hidden = !open;
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = navItems.find((li) => li.classList.contains('is-open'));
    if (open) { setOpen(open, false); open.querySelector('.nav__link').focus(); }
    if (!mobileMenu.hidden) { mobileMenu.hidden = true; menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.focus(); }
  });

  // ---- Booking: the live booking system (CareVender) in a dialog, as on the live site ----------------------------
  // Live's own functions, by their names, because live's pages and the booking thank-you page call them (gate G5,
  // 2026-10-13): openHeaderBooking('<service>'), openHeaderBookingGroup('<group>'), closeHeaderBooking() and the page's
  // openBooking(). Every [data-book] control opens it through one listener on the page (v2's delegated handler), so a
  // control works the moment the page shows, however it was added. A page's own controls open its service (body
  // data-booking, src/_data/booking.json), a control with its own address (data-book="<link>") that one, and the
  // header's and the phone bar's the general booking, as live's do. Without the dialog a control is a plain link.
  const dialog = document.getElementById('booking');
  const frame = dialog ? dialog.querySelector('iframe') : null;
  const general = (frame && frame.dataset.src) || 'https://mediway-tim-booking-all-42643890.dev.odoo.com/book';
  let lastUrl = null, loadedAt = 0;
  function openBookingUrl(url, explicit) {
    if (typeof gtag === 'function') gtag('event', 'leads_booking_click');   // each time the booking opens, as live (G4)
    if (!frame || typeof dialog.showModal !== 'function') { window.location.href = url; return; }
    // After a booking the frame shows our own thank-you page (same origin, so it can be read): the next open starts
    // afresh, as live's does, and so does a form left for over an hour or a different service asked for by name. A
    // general open re-shows what is there, so a visitor resumes where they left off, as on live.
    let completed = false;
    try { completed = !!(frame.contentWindow && frame.contentWindow.location.href.indexOf('booking-success-popup') !== -1); } catch (e) { completed = false; }
    if (!lastUrl || completed || Date.now() - loadedAt > 60 * 60 * 1000 || (explicit && lastUrl !== url)) {
      frame.src = url + (url.indexOf('?') === -1 ? '?' : '&') + 'cb=' + Date.now();   // live's cache-buster: never a stale copy
      lastUrl = url;
      loadedAt = Date.now();
    }
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('has-dialog');
  }
  window.openHeaderBooking = (category) => openBookingUrl(general + (category ? '?' + new URLSearchParams({ category }).toString() : ''), !!category);
  window.openHeaderBookingGroup = (group) => openBookingUrl(general + (group ? '?groupcategory=' + encodeURIComponent(group) + '/' : ''), true);
  window.closeHeaderBooking = () => { if (dialog && dialog.open) dialog.close(); };
  window.openBooking = () => { const url = document.body.dataset.booking || general; openBookingUrl(url, url !== general); };
  const bookingFor = (a) => (/^https?:/.test(a.dataset.book) ? a.dataset.book
    : a.closest('.site-header, .mobile-bar') ? general : (document.body.dataset.booking || general));
  document.querySelectorAll('[data-book]').forEach((a) => { a.href = bookingFor(a); });   // a new tab opens the same booking
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-book]');
    if (!a || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // a new tab follows the link
    e.preventDefault();
    const url = bookingFor(a);
    openBookingUrl(url, url !== general);
  });
  if (dialog) {
    dialog.querySelector('.booking__close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => document.body.classList.remove('has-dialog'));
  }

  // ---- A price that counts up from $0 as it comes into view (data-count = the number); the real number is in the page
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const counter = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target, end = +el.dataset.count, t0 = performance.now(), ms = 900;
      counter.unobserve(el);
      const step = (t) => { const k = Math.min(1, (t - t0) / ms); el.textContent = '$' + Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }), { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('[data-count]').forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) return;   // already on screen: leave it
      el.textContent = '$0';
      counter.observe(el);
    });
  }

  // ---- Filters: a row of toggle buttons over a list (press a group to show only it, press it again for all) ------
  document.querySelectorAll('[data-filter]').forEach((box) => {
    const btns = [...box.querySelectorAll('[data-filter-btn]')];
    const items = [...box.querySelectorAll('[data-group]')];
    btns.forEach((b) => b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b && on)));
      items.forEach((it) => { it.hidden = on && it.dataset.group !== b.dataset.filterBtn; });
    }));
  });

  // ---- Tabs (click, arrow keys, Home / End, per the ARIA tabs pattern) --------------------------
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
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (e) => {
        const down = list.getAttribute('aria-orientation') === 'vertical';   // a list going down the page (the adult vaccine schedule) moves with the up and down arrows too
        const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1, ...(down ? { ArrowDown: i + 1, ArrowUp: i - 1 } : {}) }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        select(tabs[(next + tabs.length) % tabs.length]);
      });
    });
  });

  // ---- "Open Now" chips: shown only while the clinic is open, in Singapore time (hidden otherwise, and without
  //      this script). Public holidays aren't in the data, so the hours rows are the only rule.
  document.querySelectorAll('[data-open-now]').forEach((el) => {
    let rows = [];
    try { rows = JSON.parse(el.dataset.hours || '[]'); } catch (e) { return; }
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));
    const mins = now.getHours() * 60 + now.getMinutes();
    const at = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    el.hidden = !rows.some((r) => r.days.includes(now.getDay()) && mins >= at(r.opens) && mins < at(r.closes));
  });

  // ---- Opening hours: mark today's row, in Singapore time -------------------------------------
  const sgDay = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' })).getDay();
  document.querySelectorAll('.hours-card [data-days]').forEach((row) => {
    row.classList.toggle('is-today', row.dataset.days.split(',').map(Number).includes(sgDay));
  });

  // ---- FAQs: opening one answer closes the others, so one is open at a time ----------------------
  document.querySelectorAll('.faq').forEach((faq) => {
    const items = [...faq.querySelectorAll('.faq__item')];
    items.forEach((item) => item.addEventListener('toggle', () => {
      if (!item.open) return;
      items.forEach((other) => { if (other !== item && other.open) other.open = false; });
    }));
  });

  // ---- Gentle reveal for anything marked data-reveal, below the first screen -------------------
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-in');
      io.unobserve(el);
      const done = (e) => { if (e.target !== el || e.propertyName !== 'opacity') return; el.removeEventListener('transitionend', done); el.classList.remove('reveal', 'is-in'); el.style.transitionDelay = ''; };
      el.addEventListener('transitionend', done);
    }), { rootMargin: '0px 0px -8% 0px' });
    // The page kit (vault D42): on every inner page, every card, step, FAQ topic and list row in the content fades up
    // the same way, wherever it sits, instead of only the ones a template remembered to mark. Not the steps panels: a
    // moving card is lifted onto its own layer, which put the steps line over the circles (Cedric, 2026-10-04); the
    // line's own drawing brings those in
    if (document.body.classList.contains('page-inner')) {
      document.querySelectorAll('main :is(.card, .steps__item, .faq-topic, .faq__item, .img-reads__row, .why__item, .map-wrap):not(.page-hero *):not(.card *):not(.faq-topic *):not(.flow__card)')
        .forEach((el) => { if (el.getClientRects().length) el.setAttribute('data-reveal', ''); });   // not inside a closed tab or fold
    }
    document.querySelectorAll('[data-reveal]').forEach((el, i) => {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.classList.add('reveal');
      el.style.transitionDelay = `${(i % 4) * 70}ms`;
      io.observe(el);
    });
  }
})();

// Bars that grow in once their box is in view (data-grow; the radiation table on Diagnostic Imaging, 2026-10-06).
// Boxes already on screen, reduced motion, or no script: the bars are simply there.
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

// Steps line: draws as the section comes into view and lights each number as the line reaches it. Runs once. Skipped with reduced motion or where the line is hidden.
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const DRAW = 1800; // ms, the whole line
  document.querySelectorAll('.steps').forEach((list) => {
    const items = [...list.querySelectorAll('.steps__item')];
    const nums = items.map((i) => i.querySelector('.steps__num'));
    if (!nums.length) return;
    // Phones: the vertical line starts at the first number's centre and ends at the last one's
    function measure() {
      const last = items[items.length - 1];
      list.style.setProperty('--steps-line-top', nums[0].offsetTop + nums[0].offsetHeight / 2 + 'px');
      list.style.setProperty('--steps-line-bottom', (list.offsetHeight - (last.offsetTop + nums[nums.length - 1].offsetTop + nums[nums.length - 1].offsetHeight / 2)) + 'px');
    }
    measure(); addEventListener('resize', measure);
    if (getComputedStyle(list, '::before').display === 'none') return; // tablet 2x2 grid: no line to draw
    list.style.setProperty('--steps-draw-time', DRAW + 'ms');
    list.classList.add('steps--draw');
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      measure();
      // When does the line reach each number? Its position along the line, as a share of the line's length
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

// Jump-link bar (pages with [data-subnav]): shows once the page header has scrolled out of view,
// and marks the link for the section currently in view.
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
    // The current section: the last one whose top has passed a line a third of the way down the screen
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

// Steps joined to the checklist under them by one line (components/flow.njk; Cedric's notes #20 and #28-29, vault D36).
// It draws on as the section comes into view, never faster than SPEED, and lights
// each circle as it reaches it. Narrow screens: it runs straight down one rail through every circle, the checklist's
// title and every tick. Wide screens: it runs along the row of steps, turns down past the last one and ends at the
// checklist's title, then the ticks light in turn. Runs once; with reduced motion the line is simply there.
(function () {
  const flows = document.querySelectorAll('[data-flow]');
  if (!flows.length) return;
  const NS = 'http://www.w3.org/2000/svg';
  const SPEED = 900;        // px of line per second
  const R = 18;             // corner radius where the line turns (wide screens)
  const STAGGER = 110;      // ms between ticks lighting once the line reaches the checklist (wide screens)
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  flows.forEach((flow, n) => {
    const dots = [...flow.querySelectorAll('.flow-steps__dot')];
    const node = flow.querySelector('.flow__node');
    const ticks = [...flow.querySelectorAll('.flow-checks__tick')];
    const card1 = flow.querySelector('.flow__card--steps');
    const card2 = flow.querySelector('.flow__card--checks');
    const alone = !node || !card2;   // steps with no checklist after them: the line runs through their circles only
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

    // Layout position inside the panel (offsets ignore the pop animation's transform)
    function box(el) {
      let x = 0, y = 0;
      for (let e = el; e && e !== flow; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; }
      return { x, y, w: el.offsetWidth, h: el.offsetHeight, cx: x + el.offsetWidth / 2, cy: y + el.offsetHeight / 2 };
    }

    let geo = null, drawn = 0, target = 0, raf = 0, last = 0, ticksLit = false;

    function build() {
      const b = dots.map(box), d0 = b[0], t = ticks.map(box), c1 = box(card1);
      const row = b.length > 1 && Math.abs(b[1].cy - d0.cy) < 2;
      const marks = [];     // [length along the line, element]
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
      // The line keeps pace with what has come into view: from the first circle to the checklist's title (wide)
      // or to the last tick (narrow)
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

// Fertility Test page (vault D38).
// Female / Male: shows that person's packages and their columns of the test breakdown. Without the script every
// package and column shows.
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

// The side list follows you down the page and marks the section you're reading.
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
