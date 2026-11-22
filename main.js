(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* theme */
  $('#theme').onclick = () => {
    const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch (e) {}
    cssColors();
  };
  $('#yr').textContent = new Date().getFullYear();

  /* burger */
  const burger = $('#burger');
  const setMenu = o => { $('#nav').classList.toggle('open', o); burger.setAttribute('aria-expanded', o); };
  burger.onclick = () => setMenu(!$('#nav').classList.contains('open'));
  document.querySelectorAll('.nav nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));

  /* nav shadow + active link */
  const nav = $('#nav');
  addEventListener('scroll', () => nav.classList.toggle('stuck', scrollY > 20), { passive: true });
  const links = [...document.querySelectorAll('.nav nav a')];
  const secObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const s = $(a.getAttribute('href')); s && secObs.observe(s); });

  /* reveal + counters */
  const count = el => {
    const to = +el.dataset.count, suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = to + suf; return; }
    const t0 = performance.now();
    const step = t => { const p = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; p < 1 && requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const revObs = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    e.target.querySelectorAll('[data-count]').forEach(count);
    revObs.unobserve(e.target);
  }), { threshold: 0, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));

  /* typing */
  const words = ['Фізик', 'Викладач', 'Python-розробник', 'TeXnican', 'Обчислювальна фізика', 'Квантова хімія'];
  const typed = $('#typed');
  if (reduce) typed.textContent = words.slice(0, 3).join(' · ');
  else {
    let w = 0, i = 0, del = false;
    (function tick() {
      const word = words[w];
      typed.textContent = word.slice(0, i);
      if (!del && i === word.length) { del = true; return setTimeout(tick, 1400); }
      if (del && i === 0) { del = false; w = (w + 1) % words.length; }
      i += del ? -1 : 1;
      setTimeout(tick, del ? 38 : 85);
    })();
  }

  /* electric field background: fixed +q, cursor-driven −q */
  const cv = $('#field'), cx = cv.getContext('2d');
  let W, H, DPR, rgb = '56,189,248', rgb2 = '167,139,250';
  const mouse = { x: 0, y: 0, tx: 0, ty: 0, active: false };
  function cssColors() {
    const s = getComputedStyle(document.documentElement);
    rgb = s.getPropertyValue('--field').trim(); rgb2 = s.getPropertyValue('--field2').trim();
    if (reduce) draw(0);
  }
  function resize() {
    DPR = Math.min(2, devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * DPR; cv.height = H * DPR; cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (!mouse.active) { mouse.tx = W * .2; mouse.ty = H * .78; }
    if (reduce) draw(0);
  }
  const E = (x, y, q) => { // field of point charges
    let ex = 0, ey = 0;
    for (const c of q) {
      const dx = x - c.x, dy = y - c.y, r2 = dx * dx + dy * dy + 120, r = Math.sqrt(r2);
      ex += c.s * dx / (r2 * r); ey += c.s * dy / (r2 * r);
    }
    return [ex, ey];
  };
  let visible = true;
  function draw(t) {
    if (!visible && !reduce) return requestAnimationFrame(draw);
    mouse.x += (mouse.tx - mouse.x) * .08; mouse.y += (mouse.ty - mouse.y) * .08;
    const plus = { x: W * (W > 900 ? .72 : .5), y: H * .42, s: 1 };
    const minus = { x: mouse.x, y: mouse.y, s: -1 };
    const q = [plus, minus];
    cx.clearRect(0, 0, W, H);
    const N = 22, ph = t * .0004;
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2 + ph * .3;
      let x = plus.x + Math.cos(a) * 9, y = plus.y + Math.sin(a) * 9;
      cx.beginPath(); cx.moveTo(x, y);
      for (let n = 0; n < 340; n++) {
        const [ex, ey] = E(x, y, q), m = Math.hypot(ex, ey) || 1;
        x += ex / m * 7; y += ey / m * 7;
        cx.lineTo(x, y);
        if (Math.hypot(x - minus.x, y - minus.y) < 10 || x < -50 || y < -50 || x > W + 50 || y > H + 50) break;
      }
      const g = cx.createLinearGradient(plus.x, plus.y, x, y);
      g.addColorStop(0, `rgba(${rgb},.55)`); g.addColorStop(1, `rgba(${rgb2},.08)`);
      cx.strokeStyle = g; cx.lineWidth = 1.2; cx.stroke();
    }
    // moving dots along the "flow" for life
    for (const c of [plus, minus]) {
      const col = c.s > 0 ? rgb : rgb2;
      const gr = cx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 42);
      gr.addColorStop(0, `rgba(${col},.55)`); gr.addColorStop(1, `rgba(${col},0)`);
      cx.fillStyle = gr; cx.beginPath(); cx.arc(c.x, c.y, 42, 0, 7); cx.fill();
      cx.fillStyle = `rgb(${col})`; cx.beginPath(); cx.arc(c.x, c.y, 6, 0, 7); cx.fill();
      cx.fillStyle = document.documentElement.dataset.theme === 'light' ? '#fff' : '#06121c';
      cx.font = '700 11px Inter,sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillText(c.s > 0 ? '+' : '−', c.x, c.y + .5);
    }
    if (!reduce) requestAnimationFrame(draw);
  }
  const hero = $('.hero');
  hero.addEventListener('pointermove', e => {
    const r = cv.getBoundingClientRect(); mouse.tx = e.clientX - r.left; mouse.ty = e.clientY - r.top; mouse.active = true;
  });
  hero.addEventListener('pointerleave', () => { mouse.active = false; mouse.tx = W * .2; mouse.ty = H * .78; });
  addEventListener('resize', resize);
  resize(); cssColors();
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(hero);
  if (!reduce) requestAnimationFrame(draw);

  /* repos */
  const COLORS = { Python: '#3572A5', TeX: '#3D6117', Lua: '#51a0cf', JavaScript: '#f1e05a', HTML: '#e34c26', 'Jupyter Notebook': '#DA5B0B', PowerShell: '#012456', Batchfile: '#C1F12E', 'C++': '#f34b7d' };
  const state = { all: [], lang: 'all', q: '', forks: false, shown: 18 };
  const grid = $('#repo-grid'), more = $('#more');
  const esc = s => (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function render() {
    const q = state.q.toLowerCase();
    const list = state.all.filter(r => (state.forks || !r.f) && r.n !== 'sergiokapone' && r.n !== 'sergiokapone.github.io' &&
      (state.lang === 'all' || r.l === state.lang) && (!q || (r.n + ' ' + (r.d || '')).toLowerCase().includes(q)));
    grid.innerHTML = list.slice(0, state.shown).map(r => `
      <a class="repo" href="https://github.com/sergiokapone/${r.n}" target="_blank" rel="noopener">
        <b>${esc(r.n)}</b><p>${esc(r.d) || '—'}</p>
        <footer>${r.l ? `<span class="ld" style="--lc:${COLORS[r.l] || '#8fa0ba'}">${esc(r.l)}</span>` : ''}
        ${r.s ? `<span>★ ${r.s}</span>` : ''}${r.f ? '<span>fork</span>' : ''}${r.h && /github\.io/.test(r.h) ? '<span class="site">● live</span>' : ''}</footer>
      </a>`).join('') || '<p class="sec-lead">Нічого не знайдено.</p>';
    more.hidden = list.length <= state.shown;
    more.textContent = `Показати ще (${list.length - state.shown})`;
  }
  function setRepos(data) {
    state.all = data;
    const own = data.filter(r => !r.f);
    $('#repo-count').textContent = `${own.length} власних · ${data.length - own.length} форків`;
    const cnt = {}; own.forEach(r => r.l && (cnt[r.l] = (cnt[r.l] || 0) + 1));
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 7);
    $('#langs').innerHTML = [['all', 'усі']].concat(top.map(([l, n]) => [l, `${l} ${n}`]))
      .map(([l, t]) => `<button data-l="${l}" class="${l === 'all' ? 'on' : ''}">${t}</button>`).join('');
    render();
  }
  $('#langs').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    state.lang = b.dataset.l; state.shown = 18;
    document.querySelectorAll('#langs button').forEach(x => x.classList.toggle('on', x === b)); render();
  });
  $('#q').addEventListener('input', e => { state.q = e.target.value; state.shown = 18; render(); });
  $('#forks').addEventListener('change', e => { state.forks = e.target.checked; render(); });
  more.onclick = () => { state.shown += 18; render(); };

  setRepos(window.REPOS_SNAPSHOT || []);  // instant, then refresh live
  fetch('https://api.github.com/users/sergiokapone/repos?per_page=100&sort=pushed')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(d => setRepos(d.map(r => ({ n: r.name, d: r.description, l: r.language, s: r.stargazers_count, f: r.fork, h: r.homepage, p: r.pushed_at }))))
    .catch(() => {});

  /* bike gallery */
  const MONTHS = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
  const fmt = p => { const [y, m, d] = p.date.split('-'); return `${+d} ${MONTHS[m - 1]} ${y}`; };
  let photos = [], view = [], cur = 0;
  const lb = $('#lb'), lbi = $('#lb-img');
  function show(i) { cur = (i + view.length) % view.length; const p = view[cur]; lbi.src = `photos/${p.id}.jpg`; lbi.alt = fmt(p); $('#lb-cap').textContent = fmt(p); }
  function open(i) { lb.hidden = false; document.body.style.overflow = 'hidden'; show(i); }
  function close() { lb.hidden = true; document.body.style.overflow = ''; }
  const CATS = [['bike', 'Велосипед'], ['fire', 'Вогонь і дим']];
  function renderGallery(cat) {
    view = photos.filter(p => cat === 'all' || p.cat === cat);
    $('#gallery').innerHTML = view.map((p, i) => `<button class="ph" data-i="${i}" aria-label="${fmt(p)}">
      <img src="photos/${p.id}-s.jpg" width="${p.w}" height="${p.h}" loading="lazy" alt="${fmt(p)}"><span>${fmt(p)}</span></button>`).join('');
  }
  fetch('photos/photos.json').then(r => r.json()).then(d => {
    photos = d.slice().sort((a, b) => b.date.localeCompare(a.date));
    const have = CATS.filter(([c]) => photos.some(p => p.cat === c));
    $('#cats').innerHTML = [['all', 'усі'], ...have].map(([c, t]) => `<button data-c="${c}" class="${c === 'all' ? 'on' : ''}">${t}</button>`).join('');
    renderGallery('all');
  }).catch(() => { const s = $('#bike'); s && (s.hidden = true); });
  $('#cats').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
    document.querySelectorAll('#cats button').forEach(x => x.classList.toggle('on', x === b)); renderGallery(b.dataset.c); });
  $('#gallery').addEventListener('click', e => { const b = e.target.closest('.ph'); b && open(+b.dataset.i); });
  $('.lb-x').onclick = close; $('.lb-p').onclick = () => show(cur - 1); $('.lb-n').onclick = () => show(cur + 1);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
})();
