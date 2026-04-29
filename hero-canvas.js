/* ============================================================
   Hero canvas — a quiet particle field that follows the cursor.
   A subtle nod to Pixi/canvas work without being loud.
   Vanilla canvas, no dependencies.
   ============================================================ */
(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0;
  let particles = [];
  let mouse = { x: -9999, y: -9999, active: false };
  let motion = 1; // 1 = full, 0 = none

  function readMotion() {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--motion');
    motion = parseFloat(v) || 1;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
  }

  function initParticles() {
    const targetCount = Math.floor((w * h) / 14000);
    const count = Math.min(140, Math.max(40, targetCount));
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        r: Math.random() * 1.4 + 0.4,
        // 0 = warm/dim, 1 = accent
        warm: Math.random() < 0.18 ? 1 : 0,
      });
    }
  }

  function step() {
    ctx.clearRect(0, 0, w, h);

    // ambient warm wash
    const grad = ctx.createRadialGradient(w * 0.7, h * 0.2, 0, w * 0.7, h * 0.2, Math.max(w, h) * 0.7);
    grad.addColorStop(0, 'rgba(220, 150, 70, 0.08)');
    grad.addColorStop(1, 'rgba(220, 150, 70, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // particles
    const m = motion;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx * m;
      p.y += p.vy * m;

      // wrap edges
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;

      // mouse repel
      if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        const range = 140;
        if (d2 < range * range) {
          const d = Math.sqrt(d2) || 0.0001;
          const force = (1 - d / range) * 0.6 * m;
          p.x += (dx / d) * force;
          p.y += (dy / d) * force;
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.warm
        ? 'rgba(232, 180, 100, 0.9)'
        : 'rgba(240, 236, 226, 0.45)';
      ctx.fill();
    }

    // connect nearby particles with thin lines
    const linkDist = 110;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < linkDist * linkDist) {
          const alpha = (1 - Math.sqrt(d2) / linkDist) * 0.18;
          ctx.strokeStyle = (a.warm || b.warm)
            ? `rgba(232, 180, 100, ${alpha * 1.4})`
            : `rgba(240, 236, 226, ${alpha * 0.5})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    if (motion > 0) requestAnimationFrame(step);
  }

  function onMouse(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', onMouse);
  window.addEventListener('mouseleave', () => { mouse.active = false; });

  // re-read motion when changed
  const mo = new MutationObserver(readMotion);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

  readMotion();
  resize();
  if (!reduced) {
    requestAnimationFrame(step);
  } else {
    // single static frame
    step();
  }
})();
