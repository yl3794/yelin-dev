// Shared behavior for the detail pages
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.REDUCE = reduce;

  // Sections settle in as they scroll into view; they are visible before that
  const later = document.querySelectorAll('.later');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    later.forEach(el => io.observe(el));
  } else later.forEach(el => el.classList.add('in'));

  // Big numbers count up the first time they appear
  const nums = document.querySelectorAll('[data-count]');
  const fmt = (v, dec) => dec ? v.toFixed(dec) : Math.round(v).toLocaleString();
  function run(el) {
    const to = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || '0', 10);
    const pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    if (reduce) { el.textContent = pre + fmt(to, dec) + suf; return; }
    const t0 = performance.now(), dur = 1200;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + fmt(to * e, dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    const io2 = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { run(e.target); io2.unobserve(e.target); }
    }), { threshold: .4 });
    nums.forEach(n => io2.observe(n));
  } else nums.forEach(run);

  // Email button copies the address and shows it
  document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => {
    const out = document.getElementById('copied');
    const say = t => { if (out) { out.textContent = t; setTimeout(() => out.textContent = '', 2600); } };
    const addr = b.dataset.copy;
    try { navigator.clipboard.writeText(addr).then(() => say('Copied ' + addr), () => say(addr)); } catch (e) { say(addr); }
  }));
})();

// Cards lean toward the cursor
(() => {
  if (window.REDUCE) return;
  document.querySelectorAll('[data-tilt]').forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.setProperty('--ty', (x * 14).toFixed(1) + 'deg'); c.style.setProperty('--tx', (-y * 14).toFixed(1) + 'deg');
    });
    c.addEventListener('pointerleave', () => { c.style.setProperty('--tx', '0deg'); c.style.setProperty('--ty', '0deg'); });
  });
})();
