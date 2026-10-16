// DeFi Intelligence showcase — progressive enhancement only; the page works without JS.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  // ---------------------------------------------------------------- theme
  const themeBtn = document.getElementById('theme');
  const current = () => root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  themeBtn?.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    const apply = () => {
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('di-site-theme', next); } catch (e) { /* storage unavailable */ }
    };
    if (document.startViewTransition && !reduce) document.startViewTransition(apply);
    else apply();
  });

  // ---------------------------------------------------------------- on-chain network background
  const canvas = document.getElementById('net');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, nodes = [], visible = true, raf = 0;
    const color = () => getComputedStyle(root).getPropertyValue('--blue').trim() || '#5b8cff';
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, (w * h) / 16000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.6, pulse: Math.random() * Math.PI * 2,
      }));
    }
    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      const c = color();
      ctx.strokeStyle = c; ctx.fillStyle = c;
      for (const n of nodes) {
        if (!reduce) { n.x += n.vx; n.y += n.vy; }
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.globalAlpha = (1 - d / 130) * 0.35;
            ctx.lineWidth = 0.7;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t / 900 + n.pulse);
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    }
    resize();
    frame(0);
    addEventListener('resize', () => { cancelAnimationFrame(raf); resize(); frame(performance.now()); });
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    }).observe(canvas);
  }

  // ---------------------------------------------------------------- reveal-on-view helpers
  const once = (el, fn, threshold = 0.3) => {
    if (!el) return;
    if (!('IntersectionObserver' in window)) return fn();
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { fn(); io.disconnect(); }
    }, { threshold });
    io.observe(el);
  };

  // counters
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = Number(el.getAttribute('data-count'));
    if (reduce || !target) return;
    el.textContent = '0';
    once(el, () => {
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / 1200);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  });

  // bars
  document.querySelectorAll('.counts').forEach((group) => {
    const fills = [...group.querySelectorAll('.fill')];
    const max = Math.max(...fills.map((f) => Number(f.dataset.max || f.dataset.w)));
    once(group, () => fills.forEach((f) => { f.style.width = `${(Number(f.dataset.w) / max) * 100}%`; }));
  });

  // ---------------------------------------------------------------- pointer spotlight on cards
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  // ---------------------------------------------------------------- pipeline walk-through
  const steps = [...document.querySelectorAll('#pipeline .step')];
  if (steps.length) {
    let i = 0, timer = 0;
    const show = () => { steps.forEach((s, j) => s.classList.toggle('active', j === i)); i = (i + 1) % steps.length; };
    const start = () => { if (!timer) { show(); timer = setInterval(show, reduce ? 2600 : 1100); } };
    const stop = () => { clearInterval(timer); timer = 0; };
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.4 }).observe(steps[0].parentElement);
  }

  // ---------------------------------------------------------------- number ↔ fact linking
  const rows = new Map([...document.querySelectorAll('#facts tr[data-f]')].map((r) => [r.dataset.f, r]));
  document.querySelectorAll('.num[data-f]').forEach((n) => {
    n.tabIndex = 0;
    n.setAttribute('title', `fact: ${n.dataset.f}`);
    const on = () => { rows.get(n.dataset.f)?.classList.add('hl'); n.classList.add('hl'); };
    const off = () => { rows.get(n.dataset.f)?.classList.remove('hl'); n.classList.remove('hl'); };
    n.addEventListener('pointerenter', on); n.addEventListener('pointerleave', off);
    n.addEventListener('focus', on); n.addEventListener('blur', off);
  });
  rows.forEach((row, f) => {
    row.addEventListener('pointerenter', () => document.querySelectorAll(`.num[data-f="${f}"]`).forEach((n) => n.classList.add('hl')));
    row.addEventListener('pointerleave', () => document.querySelectorAll(`.num[data-f="${f}"]`).forEach((n) => n.classList.remove('hl')));
  });

  // ---------------------------------------------------------------- gallery controls
  const g = document.getElementById('g');
  document.querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => {
    const fig = g?.querySelector('figure');
    if (!g || !fig) return;
    g.scrollBy({ left: Number(b.dataset.g) * (fig.getBoundingClientRect().width + 16), behavior: reduce ? 'auto' : 'smooth' });
  }));

  const y = document.getElementById('y');
  if (y) y.textContent = String(new Date().getFullYear());
})();
