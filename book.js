// A 3D magazine of all my work. Each page is a chain of thin strips so it can curve like paper.
// Clicking a page turns it; only clicking a name (or a link) opens another page.
(() => {
  const book = document.querySelector('.book');
  if (!book) return;
  const cur = book.dataset.current;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // name, link, role, page color, text color, highlight color, art
  const items = [
    ['TikTok', 'https://www.tiktok.com/about?lang=en', 'Incoming software engineer intern', '#16181D', '#FFF1C4', '#6B5A1E', 'notes'],
    ['idlexperts', 'https://idlexperts.ai/', 'Problem Design Engineer', '#FFFFFF', '#16181D', '#FFF1C4', 'loop'],
    ['ProNexus', 'pronexus.html', 'Software Engineer Intern', '#F2C94C', '#16181D', '#FFF1C4', 'dots'],
    ['Enhansys', 'enhansys.html', 'Backend Developer Intern', '#FFF1C4', '#16181D', '#F2C94C', 'bars'],
    ['Real-time pipeline', 'rec-pipeline.html', 'Personal project', '#16181D', '#FFF1C4', '#6B5A1E', 'waves'],
    ['Skill2', 'skill2.html', 'Hackathon project', '#FFFFFF', '#16181D', '#FFF1C4', 'squat'],
  ];
  const art = {
    notes: `<svg class="art" viewBox="0 0 230 180"><circle cx="150" cy="74" r="44" fill="none" stroke="#F2C94C" stroke-width="3"/><circle cx="176" cy="74" r="44" fill="#F2C94C" opacity=".85"/></svg>`,
    loop: `<svg class="art" viewBox="0 0 230 180"><circle cx="120" cy="86" r="52" fill="none" stroke="#16181D" stroke-width="3" stroke-dasharray="6 9"/><circle cx="172" cy="86" r="10" fill="#16181D"/><circle cx="94" cy="42" r="7" fill="#F2C94C"/><circle cx="84" cy="128" r="7" fill="#F2C94C"/></svg>`,
    dots: `<svg class="art" viewBox="0 0 230 180">${Array.from({ length: 42 }, (_, k) => `<circle cx="${30 + (k % 7) * 28}" cy="${24 + Math.floor(k / 7) * 24}" r="${[2, 9, 14].includes(k) ? 8 : 4}" fill="${[2, 9, 14].includes(k) ? '#16181D' : 'rgba(22,24,29,.25)'}"/>`).join('')}</svg>`,
    bars: `<svg class="art" viewBox="0 0 230 180">${[60, 90, 74, 120, 104, 140].map((h, k) => `<rect x="${30 + k * 30}" y="${160 - h}" width="20" height="${h}" rx="3" fill="${k === 5 ? '#16181D' : '#F2C94C'}"/>`).join('')}</svg>`,
    waves: `<svg class="art" viewBox="0 0 230 180">${[0, 1, 2, 3].map(k => `<path d="M-10 ${50 + k * 26} q 30 -22 60 0 t 60 0 t 60 0 t 60 0" fill="none" stroke="${k === 1 ? '#F2C94C' : 'rgba(255,241,196,.3)'}" stroke-width="4"/>`).join('')}</svg>`,
    squat: `<svg class="art" viewBox="-30 -18 230 180" fill="none" stroke="#16181D" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><circle cx="118" cy="34" r="17" fill="#F2C94C" stroke-width="4"/><path d="M112 52 L100 104 M106 70 L150 80 M100 104 L136 116 L120 160 M100 104 L80 132 L92 160"/><circle cx="136" cy="116" r="7" fill="#1E4FD8" stroke="none"/><circle cx="80" cy="132" r="7" fill="#1E4FD8" stroke="none"/><path d="M60 166 H170" stroke="#F2C94C" stroke-width="5"/></svg>`,
  };
  const pageHTML = (i, side) => {
    const [name, href, desc, bg, fg, hl, a] = items[i], ext = href.startsWith('http');
    const nm = href === cur
      ? `<span class="here">You are here</span><span class="big">${name}</span>`
      : `<a class="big" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${name}</a>`;
    return `<div class="mpage ${side}" style="--bg:${bg};--fg:${fg};--hl:${hl}">${art[a]}${nm}<span class="ds">${desc}</span><span class="pn">${i + 2}</span></div>`;
  };
  const intro = `<div class="mpage bk" style="--bg:#FFF1C4;--fg:#16181D;--hl:#F2C94C"><span class="big">My work, in order</span><span class="small">Tap a page to turn it.<br>Tap a name to open it.</span><span class="pn">1</span></div>`;
  const end = `<div class="mpage fr" style="--bg:#16181D;--fg:#FFF1C4;--hl:#6B5A1E"><span class="big">Thanks for reading</span><span class="small"><a href="index.html#contact">Say hi</a> or go <a href="index.html">back home</a>.</span><span class="pn">8</span></div>`;
  const blank = `<div class="mpage" style="--bg:#FFFDF6"></div>`;
  // 5 sheets: [blank | intro], [0 | 1], [2 | 3], [4 | 5], [end | blank]
  const sheets = [[blank, intro], [pageHTML(0, 'fr'), pageHTML(1, 'bk')], [pageHTML(2, 'fr'), pageHTML(3, 'bk')], [pageHTML(4, 'fr'), pageHTML(5, 'bk')], [end, blank]];
  const S = 6;                                   // strips per page
  const strip = (front, back, k) => {
    // copies of the page in later strips are hidden from screen readers and the tab order, but still clickable
    const hide = k ? ' aria-hidden="true" data-copy' : '';
    return `<div class="${k ? 'strip' : 'mleaf'}" data-k="${k}">
      <div class="face f"${hide}><div class="c" style="left:calc(var(--W) * ${-k} / ${S})">${front}</div></div>
      <div class="face b"${k === S - 1 ? '' : ' aria-hidden="true" data-copy'}><div class="c" style="left:calc(var(--W) * ${-(S - 1 - k)} / ${S})">${back}</div></div>
      ${k < S - 1 ? strip(front, back, k + 1) : ''}</div>`;
  };
  book.innerHTML = `
    <div class="mag-scene">
      <svg class="swoosh" viewBox="0 0 600 420" preserveAspectRatio="none" aria-hidden="true">
        <path pathLength="1" d="M40 250 C 150 360, 420 380, 560 230"/><path pathLength="1" d="M70 150 C 200 60, 440 70, 540 170"/></svg>
      <div class="mag">${sheets.map(([f, b]) => strip(f, b, 0)).join('')}</div>
    </div>
    <div class="book-nav"><button type="button" class="prev" aria-label="Previous page">‹</button><span class="where"></span><button type="button" class="next" aria-label="Next page">›</button></div>`;
  book.querySelectorAll('[data-copy] a').forEach(a => a.tabIndex = -1);
  const scene = book.querySelector('.mag-scene'), mag = book.querySelector('.mag'), sw = book.querySelector('.swoosh');
  const leaves = [...book.querySelectorAll('.mleaf')].map(l => ({ root: l, strips: [l, ...l.querySelectorAll('.strip')] }));
  // strips width follows the page width
  const size = () => { const W = parseFloat(getComputedStyle(book).getPropertyValue('--W')); leaves.forEach(L => L.strips.forEach(s => s.style.width = (W / S) + 'px')); };
  size(); addEventListener('resize', size);
  let f = 0;                                      // leaves 1..3 flipped; leaf 0 is always on the left, leaf 4 always on the right
  const N = leaves.length;
  function place(turning, dir) {
    leaves.forEach((L, k) => {
      const left = k <= f, d = left ? f - k : k - f - 1;      // d = how deep in the stack
      // pages rise from the spine and curl back down toward the side they rest on
      const s0 = 44 - 14 * d, s1 = 8 - 3 * d;
      const angle = left ? -180 + s0 : -s0, endA = left ? -180 + s1 : -s1;
      const W8 = [0, .38, .26, .16, .12, .08];
      const bends = W8.map(w => (L === turning ? (dir > 0 ? 8 : -8) : (endA - angle) * w));
      L.root.style.transform = `rotateY(${angle}deg)`;
      L.root.style.zIndex = left ? k : N - k;
      let A = angle;
      L.strips.forEach((s, i) => {
        if (i) { s.style.transform = `rotateY(${bends[i]}deg)`; A += bends[i]; }
        // light: strips that face the viewer are bright, steep ones darker
        const sh = (0.32 * (1 - Math.abs(Math.cos(A * Math.PI / 180)))).toFixed(3);
        s.querySelectorAll(':scope > .face').forEach(fc => fc.style.setProperty('--sh', sh));
      });
    });
    book.querySelector('.prev').disabled = f === 0;
    book.querySelector('.next').disabled = f === N - 2;
    book.querySelector('.where').textContent = (f * 2 + 1) + '–' + (f * 2 + 2) + ' of 8';
  }
  function turn(dir) {
    const nf = f + dir; if (nf < 0 || nf > N - 2) return;
    const leaf = leaves[dir > 0 ? nf : f];
    f = nf; place(reduce ? null : leaf, dir);
    if (!reduce) {
      setTimeout(() => place(), 380);
      sw.classList.remove('go'); void sw.offsetWidth; sw.classList.add('go');
    }
  }
  mag.addEventListener('click', e => {
    if (e.target.closest('a')) return;            // names and links navigate normally
    const L = e.target.closest('.mleaf'); if (!L) return;
    const k = leaves.findIndex(x => x.root === L);
    k <= f ? turn(-1) : turn(1);
  });
  book.querySelector('.prev').addEventListener('click', () => turn(-1));
  book.querySelector('.next').addEventListener('click', () => turn(1));
  // the magazine leans toward the pointer
  if (!reduce) {
    scene.addEventListener('pointermove', e => {
      const r = scene.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      mag.style.setProperty('--ry', (-10 + x * 18).toFixed(1) + 'deg'); mag.style.setProperty('--rx', (14 - y * 10).toFixed(1) + 'deg');
    });
    scene.addEventListener('pointerleave', () => { mag.style.removeProperty('--ry'); mag.style.removeProperty('--rx'); });
  }
  // open at the spread with the current page
  const ci = items.findIndex(x => x[1] === cur);
  f = ci < 0 ? 0 : Math.floor((ci + 1) / 2);
  book.querySelectorAll('.mleaf, .strip').forEach(s => s.style.transition = 'none'); place();
  requestAnimationFrame(() => requestAnimationFrame(() => book.querySelectorAll('.mleaf, .strip').forEach(s => s.style.transition = '')));
})();
