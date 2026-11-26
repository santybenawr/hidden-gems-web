/* =========================================================
   HIDDEN GEMS — main.js  (classic script, IIFE, no modules)
   ========================================================= */
(function () {
  'use strict';

  var WA = '573108705851';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var money = function (n) { return (n < 0 ? '−$' : '$') + Math.round(Math.abs(n)).toLocaleString('es-CO'); };
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lite = !finePointer || window.innerWidth < 760; // phones/tablets: lighter effects
  var mouse = { x: window.innerWidth / 2, y: window.innerHeight / 3, moved: false };

  function safe(fn, name) { try { fn(); } catch (e) { if (window.console) console.warn('[HG] ' + name + ' falló:', e); } }

  /* ---------- one rAF loop for the whole page ---------- */
  var ticks = [];
  function onTick(fn) { ticks.push(fn); }
  function loop(t) { for (var i = 0; i < ticks.length; i++) ticks[i](t); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);

  /* ---------- scroll-scrub registry ---------- */
  var scrubs = [];
  var vh = window.innerHeight;
  function scrub(el, start, end, fn) { if (el) scrubs.push({ el: el, s: start, e: end, fn: fn }); }
  function runScrubs() {
    for (var i = 0; i < scrubs.length; i++) {
      var o = scrubs[i], r = o.el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      var startLine = vh * o.s, endLine = vh * o.e;
      var p = (startLine - r.top) / (startLine - endLine + r.height);
      o.fn(clamp(p, 0, 1), r);
    }
  }
  var scrollDirty = true;
  window.addEventListener('scroll', function () { scrollDirty = true; }, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; scrollDirty = true; });
  onTick(function () { if (scrollDirty) { scrollDirty = false; runScrubs(); } });

  /* ---------- toast ---------- */
  function toast(msg, color) {
    var box = $('#toasts'); if (!box) return;
    var t = document.createElement('div');
    t.className = 'toast';
    t.style.setProperty('--c', color || 'var(--fuchsia)');
    t.innerHTML = '<i></i>';
    t.appendChild(document.createTextNode(msg));
    box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 400); }, 2600);
  }

  /* ---------- particles overlay (bursts + confetti) ---------- */
  var fx = { cv: null, ctx: null, parts: [], running: false };
  function fxEnsure() {
    if (fx.cv) return;
    fx.cv = document.createElement('canvas');
    fx.cv.className = 'fx-canvas';
    fx.cv.style.display = 'none';
    document.body.appendChild(fx.cv);
    fx.ctx = fx.cv.getContext('2d');
    var size = function () { var d = Math.min(lite ? 1.5 : 2, window.devicePixelRatio || 1); fx.cv.width = innerWidth * d; fx.cv.height = innerHeight * d; fx.ctx.setTransform(d, 0, 0, d, 0, 0); };
    size(); window.addEventListener('resize', size);
    onTick(function () {
      if (!fx.parts.length) { if (fx.running) { fx.ctx.clearRect(0, 0, innerWidth, innerHeight); fx.cv.style.display = 'none'; fx.running = false; } return; }
      if (!fx.running) { fx.cv.style.display = 'block'; fx.running = true; }
      var c = fx.ctx; c.clearRect(0, 0, innerWidth, innerHeight);
      for (var i = fx.parts.length - 1; i >= 0; i--) {
        var p = fx.parts[i];
        p.vx *= p.drag; p.vy = p.vy * p.drag + p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 1;
        if (p.life <= 0) { fx.parts.splice(i, 1); continue; }
        c.save(); c.globalAlpha = Math.min(1, p.life / 30); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.color;
        if (p.shape === 0) { c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); }
        else { c.beginPath(); c.moveTo(0, -p.s / 2); c.lineTo(p.s / 2, 0); c.lineTo(0, p.s / 2); c.lineTo(-p.s / 2, 0); c.closePath(); c.fill(); }
        c.restore();
      }
    });
  }
  var PALETTE = ['#6b46ff', '#ff2d8e', '#ffb41f', '#00b4f0', '#00c98e', '#ff6b3d'];
  function burst(x, y, n, colors, power) {
    fxEnsure(); colors = colors || PALETTE; power = power || 6;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = power * (0.4 + Math.random());
      fx.parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, g: 0.18, drag: 0.94, rot: Math.random() * 6, vr: (Math.random() - .5) * .3, s: 6 + Math.random() * 7, life: 50 + Math.random() * 30, color: colors[i % colors.length], shape: 1 });
    }
  }
  function confetti() {
    fxEnsure();
    for (var i = 0; i < (lite ? 80 : 160); i++) {
      var left = i % 2 === 0;
      fx.parts.push({ x: left ? -10 : innerWidth + 10, y: innerHeight * (0.55 + Math.random() * 0.3), vx: (left ? 1 : -1) * (6 + Math.random() * 12), vy: -(10 + Math.random() * 12), g: 0.32, drag: 0.985, rot: Math.random() * 6, vr: (Math.random() - .5) * .4, s: 8 + Math.random() * 8, life: 110 + Math.random() * 60, color: PALETTE[i % PALETTE.length], shape: i % 3 === 0 ? 1 : 0 });
    }
  }

  /* ======================= INITS ======================= */

  function initSplash() {
    var splash = $('[data-splash]');
    var done = false;
    var hide = function () {
      if (done) return; done = true;
      if (splash) splash.classList.add('is-out');
      document.dispatchEvent(new CustomEvent('hg:ready'));
    };
    if (document.readyState === 'complete') setTimeout(hide, 700);
    else window.addEventListener('load', function () { setTimeout(hide, 500); });
    setTimeout(hide, 3200);
  }

  function initPointer() {
    var root = document.documentElement;
    window.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.moved = true;
      root.style.setProperty('--mx-px', e.clientX + 'px');
      root.style.setProperty('--my-px', e.clientY + 'px');
    }, { passive: true });
    if (!finePointer) return;
    var ring = $('.cursor'), dot = $('.cursor-dot'), label = $('.cursor__label');
    if (!ring) return;
    var rx = mouse.x, ry = mouse.y;
    window.addEventListener('mousemove', function () { document.body.classList.add('has-cursor'); }, { once: true });
    document.addEventListener('mouseleave', function () { document.body.classList.remove('has-cursor'); });
    document.addEventListener('mouseenter', function () { if (mouse.moved) document.body.classList.add('has-cursor'); });
    onTick(function () {
      rx = lerp(rx, mouse.x, 0.18); ry = lerp(ry, mouse.y, 0.18);
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      dot.style.transform = 'translate(' + mouse.x + 'px,' + mouse.y + 'px)';
    });
    document.addEventListener('mouseover', function (e) {
      var lab = e.target.closest('[data-cursor]');
      var hit = e.target.closest('a, button, input, select, textarea, label, summary, .gem-canvas');
      ring.classList.toggle('is-label', !!lab && !e.target.closest('button'));
      ring.classList.toggle('is-hover', !!hit && !(lab && !e.target.closest('button')));
      if (lab) label.textContent = lab.getAttribute('data-cursor');
    });
  }

  function initHeader() {
    var header = $('#top'), bar = $('.progress'), totop = $('#totop'), ringC = $('#totopRing');
    var lastY = window.scrollY;
    var update = function () {
      var y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
      var p = max > 0 ? y / max : 0;
      bar.style.setProperty('--p', p.toFixed(4));
      header.classList.toggle('is-scrolled', y > 30);
      // hide only on a clear scroll down, show again on a clear scroll up (small momentum deltas keep the current state)
      if (y > 700 && y > lastY + 4 && !document.body.classList.contains('menu-open')) header.classList.add('is-hidden');
      else if (y <= 700 || y < lastY - 4) header.classList.remove('is-hidden');
      lastY = y;
      if (totop) { totop.classList.toggle('is-on', y > 900); ringC.setAttribute('stroke-dashoffset', (157 * (1 - p)).toFixed(1)); }
    };
    window.addEventListener('scroll', update, { passive: true }); update();

    // nav pill (hover + scroll spy)
    var links = $$('.nav__links a'), pill = $('.nav__pill'), active = null;
    var place = function (a) {
      if (!a) { pill.style.opacity = 0; return; }
      pill.style.opacity = 1; pill.style.width = a.offsetWidth + 'px'; pill.style.transform = 'translateX(' + a.offsetLeft + 'px)';
    };
    links.forEach(function (a) { a.addEventListener('mouseenter', function () { place(a); }); });
    $('.nav__links').addEventListener('mouseleave', function () { place(active); });
    var ids = links.map(function (a) { return a.getAttribute('href').slice(1); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var i = ids.indexOf(en.target.id); if (i < 0) return;
        links.forEach(function (l) { l.classList.remove('is-active'); });
        active = links[i]; active.classList.add('is-active'); place(active);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ids.forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });

    // burger
    var burger = $('#burger'), menu = $('#mmenu');
    var setMenu = function (open) {
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      menu.setAttribute('aria-hidden', !open);
      if (open) header.classList.remove('is-hidden');
    };
    burger.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  function initMagnetic() {
    if (!finePointer) return;
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transition = 'transform .2s ease-out';
        el.style.transform = 'translate(' + dx * 0.22 + 'px,' + dy * 0.32 + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform .7s cubic-bezier(.34,1.56,.64,1)';
        el.style.transform = '';
      });
    });
  }

  function initSplit() {
    $$('[data-split]').forEach(function (el) {
      if (el.querySelector('.ch')) return;
      var i = 0;
      var build = function (src, dst) {
        Array.prototype.slice.call(src.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            n.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { dst.appendChild(document.createTextNode(' ')); return; }
              var w = document.createElement('span'); w.className = 'w';
              part.split('').forEach(function (c) {
                var s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', i++); s.textContent = c; w.appendChild(s);
              });
              dst.appendChild(w);
            });
          } else if (n.nodeName === 'BR') {
            dst.appendChild(document.createElement('br'));
          } else if (n.nodeType === 1 && n.classList.contains('gt')) {
            var whole = n.cloneNode(true); whole.classList.add('ch'); whole.style.setProperty('--i', i); i += 3; dst.appendChild(whole);
          } else if (n.nodeType === 1) {
            var shell = n.cloneNode(false); build(n, shell); dst.appendChild(shell);
          }
        });
      };
      var frag = document.createElement('div');
      build(el, frag);
      el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
      el.innerHTML = '';
      while (frag.firstChild) el.appendChild(frag.firstChild);
      Array.prototype.slice.call(el.children).forEach(function (c) { c.setAttribute('aria-hidden', 'true'); });
      var go = function () { el.classList.add('is-in'); };
      document.addEventListener('hg:ready', function () { setTimeout(go, 150); });
      setTimeout(go, 3600);
    });
  }

  function initRotator() {
    var words = $$('#rotator .rotator__word'); if (words.length < 2) return;
    var i = 0;
    setInterval(function () {
      var cur = words[i]; i = (i + 1) % words.length; var nxt = words[i];
      cur.classList.remove('is-on'); cur.classList.add('is-off');
      nxt.classList.remove('is-off'); nxt.classList.add('is-on');
      setTimeout(function () { cur.classList.remove('is-off'); }, 800);
    }, 2400);
  }

  function initHeroSearch() {
    var input = $('#heroQ'), form = $('#heroSearch');
    if (!input || !form) return;
    var examples = ['hoodie bordado', 'café de autor', 'ilustraciones', 'diseño de logo', 'accesorios'];
    var ex = 0, ch = 0, del = false, wait = 0;
    var base = 'Busca ';
    setInterval(function () {
      if (document.activeElement === input || input.value) { input.placeholder = 'Busca un producto o marca'; return; }
      if (wait > 0) { wait--; return; }
      var w = examples[ex];
      if (!del) { ch++; if (ch >= w.length) { del = true; wait = 14; } }
      else { ch--; if (ch <= 0) { del = false; ex = (ex + 1) % examples.length; wait = 3; } }
      input.placeholder = base + '“' + w.slice(0, ch) + '”';
    }, 80);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      window.HG_setFilter && window.HG_setFilter({ q: input.value.trim() });
      document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
      e.preventDefault(); input.focus();
    });
  }

  function initGem() {
    var cv = $('#gem'); if (!cv) return;
    var ctx = cv.getContext('2d');
    var stage = $('#gemStage'), hint = $('#gemHint'), nameEl = $('#gemName');
    var PI = Math.PI;

    // ---- geometry: brilliant-style cut (convex) ----
    var V = [], T = [], G = [], P = [], F = [];
    var add = function (x, y, z) { V.push([x, y, z]); return V.length - 1; };
    var i, a;
    for (i = 0; i < 8; i++) { a = i * PI / 4; T.push(add(.56 * Math.cos(a), .44, .56 * Math.sin(a))); }
    for (i = 0; i < 16; i++) { a = i * PI / 8; G.push(add(Math.cos(a), .06, Math.sin(a))); }
    for (i = 0; i < 8; i++) { a = (2 * i + 1) * PI / 8; P.push(add(.5 * Math.cos(a), -.52, .5 * Math.sin(a))); }
    var C = add(0, -1.22, 0);
    F.push(T.slice());
    for (i = 0; i < 8; i++) {
      var i1 = (i + 1) % 8, im = (i + 7) % 8;
      F.push([T[i], T[i1], G[2 * i + 1]]);
      F.push([T[i], G[2 * i], G[2 * i + 1]]);
      F.push([T[i1], G[2 * i + 1], G[(2 * i + 2) % 16]]);
      F.push([G[2 * i], G[2 * i + 1], P[i]]);
      F.push([G[2 * i + 1], G[(2 * i + 2) % 16], P[i]]);
      F.push([G[2 * i], P[i], P[im]]);
      F.push([P[im], P[i], C]);
    }
    var sub = function (p, q) { return [p[0] - q[0], p[1] - q[1], p[2] - q[2]]; };
    var cross = function (p, q) { return [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]]; };
    var dot = function (p, q) { return p[0] * q[0] + p[1] * q[1] + p[2] * q[2]; };
    var norm = function (p) { var l = Math.hypot(p[0], p[1], p[2]) || 1; return [p[0] / l, p[1] / l, p[2] / l]; };
    var centroid = function (pts) { var c = [0, 0, 0]; pts.forEach(function (p) { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; }); return [c[0] / pts.length, c[1] / pts.length, c[2] / pts.length]; };
    F.forEach(function (f) {
      var pts = f.map(function (k) { return V[k]; });
      var n = cross(sub(pts[1], pts[0]), sub(pts[2], pts[0]));
      if (dot(n, sub(centroid(pts), [0, -.25, 0])) < 0) f.reverse();
    });
    var OFF = F.map(function (_, k) { return ((k * 47) % 80) - 40; });
    var L = norm([-.5, .75, .6]), H = norm([L[0], L[1], L[2] + 1]);

    var MODES = [
      { n: 'Amatista', h: 262 }, { n: 'Rubí', h: 335 }, { n: 'Topacio', h: 38 },
      { n: 'Zafiro', h: 205 }, { n: 'Esmeralda', h: 158 }
    ];
    var mode = 0, hue = MODES[0].h, ry = 0.4, rx = 0.42, vel = 0, dragging = false, lastX = 0, moved = 0;
    var W = 0, Hh = 0, dpr = 1, visible = true;
    var setHint = function () {
      nameEl.textContent = MODES[mode].n;
      hint.style.setProperty('--gem-c', 'hsl(' + MODES[mode].h + ' 88% 58%)');
    };
    setHint();

    var size = function () {
      var r = cv.getBoundingClientRect(); dpr = Math.min(lite ? 1.5 : 2, window.devicePixelRatio || 1);
      W = r.width; Hh = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    var lastW = 0;
    var resizeIfWider = function () { var w = cv.getBoundingClientRect().width; if (Math.abs(w - lastW) > 1) { lastW = w; size(); } };
    if (window.ResizeObserver) new ResizeObserver(resizeIfWider).observe(cv); else window.addEventListener('resize', resizeIfWider);
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(cv);

    // orbit sparkles
    var orb = [];
    for (i = 0; i < (lite ? 22 : 46); i++) orb.push({ a: Math.random() * PI * 2, r: 1.45 + Math.random() * .5, sp: (.002 + Math.random() * .004) * (Math.random() < .5 ? 1 : 1.4), s: 2 + Math.random() * 4, y: (Math.random() - .5) * .5, h: Math.random() * 360 });
    var glints = [], local = [], lastGlint = 0;

    // interaction
    cv.addEventListener('pointerdown', function (e) { dragging = true; lastX = e.clientX; moved = 0; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
      ry += dx * 0.012; vel = dx * 0.012;
    });
    var up = function (e) {
      if (!dragging) return; dragging = false;
      if (moved < 6) {
        mode = (mode + 1) % MODES.length; setHint();
        var r = cv.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, 34, ['hsl(' + MODES[mode].h + ' 90% 60%)', '#ffffff', 'hsl(' + (MODES[mode].h + 40) + ' 90% 65%)'], 9);
        vel = 0.18;
        toast('Gema ' + MODES[mode].n.toLowerCase(), 'hsl(' + MODES[mode].h + ' 88% 58%)');
      }
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); moved = 0; dragging = true; up(); } });
    cv.tabIndex = 0;

    // hero parallax
    scrub($('#inicio'), 0, 0, function (p) { stage.style.transform = 'translateY(' + (p * 140).toFixed(1) + 'px) rotate(' + (p * 8).toFixed(2) + 'deg)'; });

    var star = function (x, y, s, al) {
      ctx.save(); ctx.globalAlpha = al; ctx.translate(x, y);
      ctx.fillStyle = '#fff'; if (!lite) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 12; }
      ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(0, 0, s, 0); ctx.quadraticCurveTo(0, 0, 0, s); ctx.quadraticCurveTo(0, 0, -s, 0); ctx.quadraticCurveTo(0, 0, 0, -s); ctx.fill();
      ctx.restore();
    };

    onTick(function (t) {
      if (!visible || !W) return;
      // physics
      if (!dragging) { ry += (reduced ? 0.002 : 0.006) + vel; vel *= 0.95; }
      var targetRx = 0.42 + ((mouse.y / innerHeight) - 0.5) * 0.35;
      rx = lerp(rx, targetRx, 0.05);
      var targetH = MODES[mode].h, dh = ((targetH - hue + 540) % 360) - 180; hue += dh * 0.06;

      var cx = W / 2 + ((mouse.x / innerWidth) - 0.5) * 14, cy = Hh * 0.47 + Math.sin(t / 900) * W * 0.015;
      var sc = Math.min(W, Hh) * 0.27;
      var cy1 = Math.cos(ry), sy1 = Math.sin(ry), cx1 = Math.cos(rx), sx1 = Math.sin(rx);
      var rot = function (v) {
        var x = v[0] * cy1 + v[2] * sy1, z = -v[0] * sy1 + v[2] * cy1;
        var y = v[1] * cx1 - z * sx1, z2 = v[1] * sx1 + z * cx1;
        return [x, y, z2];
      };
      var proj = function (v) { var k = sc * 4 / (4 - v[2]); return [cx + v[0] * k, cy - v[1] * k]; };
      var R = V.map(rot), S = R.map(proj);

      ctx.clearRect(0, 0, W, Hh);
      // floor shadow
      var sh = ctx.createRadialGradient(cx, cy + sc * 1.6, 0, cx, cy + sc * 1.6, sc * 1.1);
      sh.addColorStop(0, 'hsla(' + hue + ',80%,45%,.28)'); sh.addColorStop(1, 'hsla(' + hue + ',80%,45%,0)');
      ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(cx, cy + sc * 1.6, sc * 1.1, sc * .22, 0, 0, PI * 2); ctx.fill();

      // orbit particles
      var drawOrb = function (front) {
        orb.forEach(function (o) {
          if (front === undefined) o.a += o.sp;
          var x = Math.cos(o.a) * o.r, z = Math.sin(o.a) * o.r, y = o.y + Math.sin(o.a) * .22;
          var p = rot([x, y, z]); if ((p[2] > 0) !== front) return;
          var q = proj(p), s = o.s * (4 / (4 - p[2]));
          ctx.save(); ctx.globalAlpha = front ? .95 : .45; ctx.translate(q[0], q[1]); ctx.rotate(PI / 4);
          ctx.fillStyle = 'hsl(' + ((hue + o.h * .35) % 360) + ',90%,' + (front ? 62 : 72) + '%)';
          ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore();
        });
      };
      orb.forEach(function (o) { o.a += o.sp; });
      drawOrb(false);

      // faces
      var back = [], front = [];
      F.forEach(function (f, k) {
        var a0 = R[f[0]], a1 = R[f[1]], a2 = R[f[2]];
        var n = norm(cross(sub(a1, a0), sub(a2, a0)));
        var c = centroid(f.map(function (j) { return R[j]; }));
        var vis = dot(n, [-c[0], -c[1], 4 - c[2]]) > 0;
        (vis ? front : back).push({ f: f, n: n, z: c[2], k: k });
      });
      var path = function (f) { ctx.beginPath(); f.forEach(function (j, m) { var p = S[j]; if (m) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath(); };
      back.sort(function (p, q) { return p.z - q.z; }).forEach(function (o) {
        path(o.f); ctx.fillStyle = 'hsla(' + (hue + OFF[o.k] + 150) + ',85%,72%,.25)'; ctx.fill();
      });
      front.sort(function (p, q) { return p.z - q.z; }).forEach(function (o) {
        var lam = Math.max(0, dot(o.n, L)), spec = Math.pow(Math.max(0, dot(o.n, H)), 22);
        var light = clamp(44 + lam * 30 + spec * 34 + (o.k === 0 ? 10 : 0), 30, 96);
        var hh = hue + OFF[o.k] * (o.k === 0 ? 0.2 : 1);
        path(o.f);
        var p0 = S[o.f[0]], p1 = S[o.f[1]];
        var gr = ctx.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
        gr.addColorStop(0, 'hsla(' + hh + ',90%,' + light + '%,.9)');
        gr.addColorStop(1, 'hsla(' + (hh + 30) + ',92%,' + clamp(light + 10, 0, 97) + '%,.86)');
        ctx.fillStyle = gr; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.35 + spec * 0.6).toFixed(2) + ')'; ctx.lineWidth = 1; ctx.stroke();
      });

      // glints on front vertices
      if (t - lastGlint > 520 && front.length) {
        lastGlint = t;
        var fv = front[Math.floor(Math.random() * front.length)].f[0];
        glints.push({ v: fv, life: 1 });
      }
      for (var g = glints.length - 1; g >= 0; g--) {
        var gl = glints[g]; gl.life -= 0.03; if (gl.life <= 0) { glints.splice(g, 1); continue; }
        var sp = S[gl.v]; star(sp[0], sp[1], 4 + Math.sin(gl.life * PI) * 11, Math.sin(gl.life * PI));
      }
      drawOrb(true);
    });
  }

  function initRibbons() {
    var tracks = $$('[data-marquee]'); if (!tracks.length) return;
    var data = tracks.map(function (tr) {
      var g = tr.firstElementChild;
      var w = g.offsetWidth || 800, n = Math.ceil((innerWidth * 1.3) / w) + 1;
      for (var i = 0; i < n; i++) { var c = g.cloneNode(true); c.setAttribute('aria-hidden', 'true'); tr.appendChild(c); }
      var dir = +tr.getAttribute('data-marquee');
      return { tr: tr, g: g, dir: dir, x: dir > 0 ? 0 : -w, w: w };
    });
    var measure = function () { data.forEach(function (d) { d.w = d.g.offsetWidth || d.w; }); };
    var lastVW = innerWidth;
    window.addEventListener('resize', function () { if (innerWidth !== lastVW) { lastVW = innerWidth; measure(); } });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    var vis = true;
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe($('.ribbons'));
    var lastY = window.scrollY, boost = 0;
    onTick(function () {
      var y = window.scrollY, dy = y - lastY; lastY = y;
      if (!vis) return;
      boost = lerp(boost, clamp(dy * 0.35, -14, 14), 0.1);
      var v = (reduced ? 0.25 : 0.9) + Math.abs(boost), sign = boost < -0.4 ? -1 : 1;
      data.forEach(function (d) {
        d.x -= v * d.dir * sign;
        if (d.x <= -d.w) d.x += d.w;
        if (d.x > 0) d.x -= d.w;
        d.tr.style.transform = 'translate3d(' + d.x.toFixed(1) + 'px,0,0)';
      });
    });
  }

  function initReveal() {
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.05, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
    setTimeout(function () { $$('.reveal:not(.is-in)').forEach(function (e) { var r = e.getBoundingClientRect(); if (r.top < innerHeight) e.classList.add('is-in'); }); }, 6000);
  }

  function countUp(el, to, dur) {
    var start = null, from = 0;
    var step = function (t) {
      if (!start) start = t;
      var p = clamp((t - start) / dur, 0, 1), e = 1 - Math.pow(2, -10 * p);
      el.textContent = Math.round(from + (to - from) * e).toLocaleString('es-CO');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function initCounters() {
    var nums = $$('[data-count]'); if (!nums.length) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return; io.unobserve(en.target);
        countUp(en.target, +en.target.getAttribute('data-count'), 1600);
      });
    }, { threshold: 0.3 });
    nums.forEach(function (n) { io.observe(n); });
  }

  function initAudience() {
    var seg = $('#seg'); if (!seg) return;
    var tabs = $$('[role="tab"]', seg), thumb = $('.seg__thumb', seg);
    var place = function () { var on = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0]; thumb.style.width = on.offsetWidth + 'px'; thumb.style.transform = 'translateX(' + on.offsetLeft + 'px)'; };
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        if (t.getAttribute('aria-selected') === 'true') return;
        tabs.forEach(function (o) {
          var on = o === t; o.setAttribute('aria-selected', on);
          var panel = document.getElementById(o.getAttribute('aria-controls'));
          panel.hidden = !on;
          if (on) { panel.classList.remove('is-swapping'); void panel.offsetWidth; panel.classList.add('is-swapping'); $$('.reveal', panel).forEach(function (r) { r.classList.add('is-in'); }); }
        });
        place();
      });
    });
    seg.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var i = tabs.indexOf(document.activeElement); if (i < 0) return;
      var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); n.click();
    });
    place(); window.addEventListener('resize', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    $$('.benefit').forEach(function (b) {
      b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); b.style.setProperty('--x', (e.clientX - r.left) + 'px'); b.style.setProperty('--y', (e.clientY - r.top) + 'px'); });
    });
  }

  function initConverge() {
    var box = $('#converge'); if (!box) return;
    var hub = $('.converge__hub', box);
    var bubbles = $$('.bubble', box).map(function (b) {
      return { el: b, x: parseFloat(b.style.getPropertyValue('--bx')), y: parseFloat(b.style.getPropertyValue('--by')) };
    });
    var fit = function () { var s = Math.min(1, (box.offsetWidth - 60) / 560); bubbles.forEach(function (b) { b.fx = b.x * s; b.fy = b.y * s; }); };
    fit(); window.addEventListener('resize', fit);
    scrub(box, 0.95, 0.4, function (p) {
      var e = p * p * (3 - 2 * p);
      bubbles.forEach(function (b, i) {
        var q = clamp(e * 1.15 - i * 0.03, 0, 1);
        b.el.style.setProperty('--bx', (b.fx * (1 - q)).toFixed(1) + 'px');
        b.el.style.setProperty('--by', (b.fy * (1 - q)).toFixed(1) + 'px');
        b.el.style.setProperty('--bs', (1 - q * 0.6).toFixed(3));
        b.el.style.setProperty('--bo', (q > 0.82 ? 1 - (q - 0.82) / 0.18 : 1).toFixed(3));
      });
      hub.style.setProperty('--hub', (0.8 + e * 0.25).toFixed(3));
    });
  }

  function initCategories() {
    var sec = $('#categorias'), pin = $('#catsPin'), track = $('#catsTrack'), bar = $('#catsBar');
    if (!sec) return;
    var dist = 0, lastVW = 0;
    var layout = function () {
      if (innerWidth === lastVW && sec.dataset.laid) return;
      lastVW = innerWidth; sec.dataset.laid = '1';
      var can = finePointer && innerWidth >= 900 && !reduced;
      sec.classList.toggle('no-pin', true);
      track.style.transform = '';
      dist = Math.max(0, track.scrollWidth - innerWidth);
      can = can && dist > 40;
      sec.classList.toggle('no-pin', !can);
      if (can) {
        dist = Math.max(0, track.scrollWidth - innerWidth);
        pin.style.position = 'sticky'; pin.style.top = '0'; pin.style.height = '100vh'; pin.style.overflow = 'hidden';
        sec.style.height = (innerHeight + dist) + 'px';
      } else {
        pin.style.position = ''; pin.style.top = ''; pin.style.height = ''; pin.style.overflow = ''; sec.style.height = '';
      }
      scrollDirty = true;
    };
    layout();
    window.addEventListener('resize', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { sec.dataset.laid = ''; layout(); });
    scrub(sec, 0, 1, function (p, r) {
      if (sec.classList.contains('no-pin')) return;
      var q = clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
      track.style.transform = 'translate3d(' + (-q * dist).toFixed(1) + 'px,0,0)';
      bar.style.setProperty('--hp', q.toFixed(4));
    });
    $$('[data-goto]', track).forEach(function (b) {
      b.addEventListener('click', function () {
        window.HG_setFilter({ cat: b.getAttribute('data-goto') });
        document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  function initCatalog() {
    var grid = $('#catalog'); if (!grid) return;
    var cards = $$('.card', grid);
    cards.forEach(function (c, i) { c._i = i; });
    var state = { cat: '', q: '', zone: '', avail: false, fav: false, sort: '' };
    var favs = [];
    try { favs = JSON.parse(localStorage.getItem('hg-favs') || '[]') || []; } catch (e) { favs = []; }
    var save = function () { try { localStorage.setItem('hg-favs', JSON.stringify(favs)); } catch (e) { /* storage off */ } };
    var chips = $$('#chips .chip[data-cat]'), favChip = $('#favChip');
    var q = $('#q'), zone = $('#zone'), sort = $('#sort'), avail = $('#avail'), count = $('#count'), empty = $('#empty');
    var norm = function (s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };

    var msgFor = function (name) { return 'Hola, vi ' + name + ' en Hidden Gems y quiero personalizarlo o pedirlo.'; };
    cards.forEach(function (c) {
      $('.btn-line--wa', c).href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msgFor(c.dataset.name));
    });

    var syncFavUI = function () {
      cards.forEach(function (c) { $('.fav', c).setAttribute('aria-pressed', favs.indexOf(c.dataset.id) > -1); });
      $('#favCount').textContent = favs.length;
    };

    var apply = function () {
      var first = new Map();
      cards.forEach(function (c) { if (!c.hidden) first.set(c, c.getBoundingClientRect()); });
      var nq = norm(state.q), shown = 0;
      cards.forEach(function (c) {
        var d = c.dataset;
        var ok = (!state.cat || d.cat === state.cat) && (!state.zone || d.zone === state.zone) && (!state.avail || d.ok === '1') &&
          (!state.fav || favs.indexOf(d.id) > -1) && (!nq || norm(d.name + ' ' + d.seller + ' ' + d.cat).indexOf(nq) > -1);
        c.hidden = !ok; if (ok) shown++;
      });
      var order = cards.slice().sort(function (a, b) {
        if (state.sort === 'asc') return a.dataset.price - b.dataset.price;
        if (state.sort === 'desc') return b.dataset.price - a.dataset.price;
        return a._i - b._i;
      });
      order.forEach(function (c) { grid.appendChild(c); });
      cards.forEach(function (c) {
        if (c.hidden || !c.animate) return;
        c.classList.add('is-in');
        var last = c.getBoundingClientRect(), f = first.get(c);
        if (f) {
          var dx = f.left - last.left, dy = f.top - last.top;
          if (dx || dy) c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)' });
        } else {
          c.animate([{ opacity: 0, transform: 'scale(.85) translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.34,1.56,.64,1)' });
        }
      });
      empty.hidden = shown > 0;
      count.innerHTML = 'Mostrando <b>' + shown + '</b> de ' + cards.length + ' gemas';
      chips.forEach(function (ch) { ch.setAttribute('aria-pressed', ch.dataset.cat === state.cat); });
      favChip.setAttribute('aria-pressed', state.fav);
      q.value = state.q; zone.value = state.zone; sort.value = state.sort; avail.checked = state.avail;
    };
    window.HG_setFilter = function (patch) { Object.keys(patch).forEach(function (k) { state[k] = patch[k]; }); apply(); };

    chips.forEach(function (ch) { ch.addEventListener('click', function () { state.cat = ch.dataset.cat; apply(); }); });
    favChip.addEventListener('click', function () { state.fav = !state.fav; apply(); });
    q.addEventListener('input', function () { state.q = q.value; apply(); });
    zone.addEventListener('change', function () { state.zone = zone.value; apply(); });
    sort.addEventListener('change', function () { state.sort = sort.value; apply(); });
    avail.addEventListener('change', function () { state.avail = avail.checked; apply(); });
    $('#resetFilters').addEventListener('click', function () { state = { cat: '', q: '', zone: '', avail: false, fav: false, sort: '' }; apply(); });
    $('#favPill').addEventListener('click', function () {
      if (!favs.length) { toast('Aún no tienes favoritos. Toca el corazón de una gema.', 'var(--fuchsia)'); }
      state.fav = favs.length > 0; apply();
      document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
    });

    var toggleFav = function (id, name, x, y) {
      var i = favs.indexOf(id);
      if (i > -1) { favs.splice(i, 1); toast(name + ' salió de tus favoritos', 'var(--mute)'); }
      else { favs.push(id); toast(name + ' guardado en favoritos', 'var(--fuchsia)'); if (x != null) burst(x, y, 18, ['#ff2d8e', '#ff7ab8', '#ffb41f'], 5); }
      save(); syncFavUI();
      var pill = $('#favPill'); pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
      if (state.fav) apply();
      return favs.indexOf(id) > -1;
    };

    cards.forEach(function (c) {
      var media = $('.card__media', c);
      $('.fav', c).addEventListener('click', function (e) {
        e.stopPropagation();
        var r = e.currentTarget.getBoundingClientRect();
        toggleFav(c.dataset.id, c.dataset.name, r.left + r.width / 2, r.top + r.height / 2);
      });
      $('[data-quick]', c).addEventListener('click', function () { openModal(c); });
      media.addEventListener('click', function (e) { if (!e.target.closest('.fav')) openModal(c); });
      if (finePointer) {
        media.addEventListener('pointermove', function (e) {
          var r = media.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          media.style.setProperty('--x', (px * 100) + '%'); media.style.setProperty('--y', (py * 100) + '%');
          media.style.transition = 'transform .15s ease-out';
          media.style.transform = 'perspective(700px) rotateX(' + ((0.5 - py) * 10).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 12).toFixed(2) + 'deg)';
        });
        media.addEventListener('pointerleave', function () { media.style.transition = 'transform .8s cubic-bezier(.34,1.56,.64,1)'; media.style.transform = ''; });
      }
    });

    // modal
    var modal = $('#modal'), cur = null;
    var mMsg = $('#mMsg'), mWa = $('#mWa'), mFav = $('#mFav');
    var setWa = function () { mWa.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(mMsg.value); };
    function openModal(c) {
      cur = c; var d = c.dataset;
      $('#mTitle').textContent = d.name; $('#mSeller').textContent = d.seller; $('#mZone').textContent = d.zone; $('#mCat').textContent = d.cat;
      $('#mStock').textContent = d.ok === '1' ? 'Disponible' : 'Agotado por ahora';
      $('#mPrice').innerHTML = money(+d.price) + ' <small>COP</small>';
      $('#mArt').setAttribute('href', '#' + d.art);
      var mImg = $('#mImg');
      if (mImg) { mImg.hidden = !d.img; if (d.img) { mImg.src = d.img; mImg.alt = d.name; } }
      $('#mMedia').classList.toggle('has-photo', !!d.img);
      var badge = $('.badge', c), mBadge = $('#mBadge');
      if (mBadge && badge) mBadge.innerHTML = badge.innerHTML;
      var media = $('#mMedia'); media.style.setProperty('--c', c.style.getPropertyValue('--c')); media.style.setProperty('--c2', c.style.getPropertyValue('--c2'));
      mMsg.value = msgFor(d.name); setWa();
      mFav.setAttribute('aria-pressed', favs.indexOf(d.id) > -1);
      if (modal.showModal) modal.showModal(); else modal.setAttribute('open', '');
    }
    mMsg.addEventListener('input', setWa);
    mFav.addEventListener('click', function () { var r = mFav.getBoundingClientRect(); mFav.setAttribute('aria-pressed', toggleFav(cur.dataset.id, cur.dataset.name, r.left + r.width / 2, r.top + r.height / 2)); });
    var close = function () { if (modal.close) modal.close(); else modal.removeAttribute('open'); };
    $('#mClose').addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });

    syncFavUI(); apply();
  }

  /* ---------- Aura Beauty Pink: featured fan on the home page ---------- */
  function initAuraSpot() {
    var fan = $('#abFan'); if (!fan) return;
    scrub(fan, 1, 0.45, function (p) { fan.style.setProperty('--fan', p.toFixed(3)); });
  }

  /* ---------- Aura Beauty Pink page: catalog filters, hero orb and kit builder ---------- */
  function initAura() {
    var shop = $('#auraShop'), grid = $('#abGrid'); if (!shop || !grid) return;
    var cards = $$('.ab-card', grid), chips = $$('[data-abcat]', shop);
    var q = $('#abQ'), sort = $('#abSort'), count = $('#abCount'), empty = $('#abEmpty');
    var state = { cat: '', q: '', sort: '' };
    var norm = function (s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
    cards.forEach(function (c, i) { c._i = i; });

    var apply = function () {
      var first = new Map(), shown = 0, nq = norm(state.q);
      cards.forEach(function (c) { if (!c.hidden) first.set(c, c.getBoundingClientRect()); });
      cards.forEach(function (c) {
        var ok = (!state.cat || c.dataset.cat === state.cat) && (!nq || norm(c.dataset.name).indexOf(nq) > -1);
        c.hidden = !ok; if (ok) shown++;
      });
      cards.slice().sort(function (a, b) {
        if (state.sort === 'asc') return a.dataset.price - b.dataset.price;
        if (state.sort === 'desc') return b.dataset.price - a.dataset.price;
        return a._i - b._i;
      }).forEach(function (c) { grid.appendChild(c); });
      if (!reduced) cards.forEach(function (c) {
        if (c.hidden || !c.animate) return;
        c.classList.add('is-in');
        var last = c.getBoundingClientRect(), f = first.get(c);
        if (f) { var dx = f.left - last.left, dy = f.top - last.top; if (dx || dy) c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)' }); }
        else c.animate([{ opacity: 0, transform: 'scale(.88) translateY(18px)' }, { opacity: 1, transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.34,1.56,.64,1)' });
      });
      empty.hidden = shown > 0;
      count.innerHTML = 'Mostrando <b>' + shown + '</b> de ' + cards.length + ' productos';
      chips.forEach(function (ch) { ch.setAttribute('aria-pressed', ch.dataset.abcat === state.cat); });
    };
    chips.forEach(function (ch) { ch.addEventListener('click', function () { state.cat = ch.dataset.abcat; apply(); }); });
    q.addEventListener('input', function () { state.q = q.value; apply(); });
    sort.addEventListener('change', function () { state.sort = sort.value; apply(); });

    // hero orb: photos drift with the pointer (desktop only)
    var orb = $('#abOrb');
    if (orb && finePointer && !reduced) {
      var phs = $$('[data-depth]', orb);
      window.addEventListener('pointermove', function (e) {
        var x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
        phs.forEach(function (ph) { var k = +ph.dataset.depth * 26; ph.style.translate = (x * k).toFixed(1) + 'px ' + (y * k).toFixed(1) + 'px'; });
      }, { passive: true });
    }

    // kit builder — kept in this browser so the kit survives a reload
    var KEY = 'hg-aura-kit', kit = {};
    try { kit = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { kit = {}; }
    var byId = {}; cards.forEach(function (c) { byId[c.dataset.id] = c; });
    Object.keys(kit).forEach(function (id) { if (!byId[id] || !(kit[id] > 0)) delete kit[id]; });
    var save = function () { try { localStorage.setItem(KEY, JSON.stringify(kit)); } catch (e) { /* storage off */ } };

    var pill = $('#abPill'), bag = $('#abBag'), list = $('#abBagList'), send = $('#abBagSend');
    var totals = function () {
      var n = 0, t = 0;
      Object.keys(kit).forEach(function (id) { n += kit[id]; t += kit[id] * +byId[id].dataset.price; });
      return { n: n, t: t };
    };
    var message = function () {
      var lines = Object.keys(kit).map(function (id) {
        var c = byId[id]; return '• ' + kit[id] + ' x ' + c.dataset.name + ' — ' + money(kit[id] * +c.dataset.price);
      });
      return 'Hola Aura Beauty Pink, quiero armar este kit (lo vi en Hidden Gems):\n' + lines.join('\n') + '\nTotal: ' + money(totals().t) + '\n¿Me confirman disponibilidad?';
    };
    var render = function () {
      var tt = totals();
      pill.hidden = tt.n === 0;
      $('#abPillN').textContent = tt.n; $('#abPillT').textContent = money(tt.t);
      $('#abBagTotal').textContent = money(tt.t);
      $('#abBagEmpty').hidden = tt.n > 0; $('#abBagFoot').hidden = tt.n === 0;
      send.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(message());
      list.innerHTML = '';
      Object.keys(kit).forEach(function (id) {
        var c = byId[id], li = document.createElement('li');
        li.className = 'ab-line';
        li.innerHTML = '<img src="' + $('img', c).getAttribute('src') + '" alt="">' +
          '<div class="ab-line__info"><b></b><span>' + money(+c.dataset.price) + ' c/u</span></div>' +
          '<div class="ab-qty"><button type="button" data-q="-1" aria-label="Quitar uno">−</button><output>' + kit[id] + '</output><button type="button" data-q="1" aria-label="Agregar uno">+</button></div>';
        $('b', li).textContent = c.dataset.name;
        $$('[data-q]', li).forEach(function (b) {
          b.addEventListener('click', function () {
            kit[id] = (kit[id] || 0) + +b.dataset.q; if (kit[id] <= 0) delete kit[id];
            save(); render();
          });
        });
        list.appendChild(li);
      });
      cards.forEach(function (c) { c.classList.toggle('in-kit', !!kit[c.dataset.id]); });
    };

    var flyTo = function (from) {
      if (reduced || lite || !from) return;
      var a = from.getBoundingClientRect(), b = pill.getBoundingClientRect();
      if (!b.width) return;
      var ghost = from.cloneNode(); ghost.className = 'ab-ghost';
      ghost.style.cssText = 'left:' + a.left + 'px;top:' + a.top + 'px;width:' + a.width + 'px;height:' + a.height + 'px';
      document.body.appendChild(ghost);
      var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
      var anim = ghost.animate([
        { transform: 'none', opacity: 1, borderRadius: '18px' },
        { transform: 'translate(' + dx * 0.5 + 'px,' + (dy * 0.5 - 120) + 'px) scale(.45) rotate(-8deg)', opacity: 1, offset: 0.55 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.08)', opacity: 0.2, borderRadius: '50%' }
      ], { duration: 760, easing: 'cubic-bezier(.5,0,.2,1)' });
      anim.onfinish = function () { ghost.remove(); };
    };

    cards.forEach(function (c) {
      $('[data-add]', c).addEventListener('click', function (e) {
        var id = c.dataset.id, wasEmpty = totals().n === 0;
        kit[id] = (kit[id] || 0) + 1; save(); render();
        if (wasEmpty) { pill.classList.remove('is-pop'); void pill.offsetWidth; pill.classList.add('is-pop'); }
        flyTo($('img', c));
        setTimeout(function () { pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump'); }, lite || reduced ? 0 : 700);
        var r = e.currentTarget.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, lite ? 10 : 16, ['#ff4fa3', '#ff9ac9', '#ffd1e6', '#d14fff'], 5);
        toast(c.dataset.name + ' se agregó a tu kit', '#ff4fa3');
      });
    });

    var open = function () { render(); if (bag.showModal) bag.showModal(); else bag.setAttribute('open', ''); };
    var close = function () { if (bag.close) bag.close(); else bag.removeAttribute('open'); };
    pill.addEventListener('click', open);
    $$('[data-open-bag]').forEach(function (b) { b.addEventListener('click', open); });
    $('#abBagClose').addEventListener('click', close);
    bag.addEventListener('click', function (e) { if (e.target === bag) close(); });
    $('#abBagClear').addEventListener('click', function () { kit = {}; save(); render(); toast('Vaciaste tu kit', 'var(--mute)'); });

    render();
  }

  function initSteps() {
    var box = $('#steps'); if (!box) return;
    var steps = $$('.step', box);
    scrub(box, 0.85, 0.55, function (p) {
      box.style.setProperty('--sp', p.toFixed(4));
      steps.forEach(function (s, i) { s.classList.toggle('is-lit', p >= (i / (steps.length - 1)) * 0.98); });
    });
  }

  function tweenNumber(el, to, dur, fmt) {
    var from = el._v != null ? el._v : to, start = null;
    el._v = to;
    var step = function (t) {
      if (!start) start = t;
      var p = clamp((t - start) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function initPlans() {
    $$('[data-pick]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-pick');
        var radio = $('#planRadios input[value="' + v + '"]'); if (radio) radio.checked = true;
        window.HG_goStep && window.HG_goStep(0);
        toast('Plan ' + { semilla: 'Semilla', pro: 'Gema Pro', elite: 'Gema Élite' }[v] + ' seleccionado', 'var(--violet)');
      });
    });
  }

  function initCalc() {
    var range = $('#calcRange'); if (!range) return;
    var out = $('#calcOut'), bars = $$('#bars .bar');
    var FEES = { semilla: { m: 0, c: 0.03, note: 'Hasta 3 productos, 3% de comisión' }, pro: { m: 19900, c: 0, note: 'Hasta 10 productos, sin comisión' }, elite: { m: 39900, c: 0, note: 'Catálogo ilimitado, sin comisión' } };
    var render = function () {
      var v = +range.value;
      range.style.setProperty('--fill', (v / +range.max * 100) + '%');
      tweenNumber(out, v, 400, money);
      var best = null, bestFee = Infinity;
      bars.forEach(function (b) {
        var f = FEES[b.dataset.plan], fee = f.m + v * f.c, net = v - fee, scale = Math.max(v, fee, 1);
        if (fee < bestFee) { bestFee = fee; best = b; }
        $('.bar__net', b).style.width = (Math.max(0, net) / scale * 100) + '%';
        $('.bar__fee', b).style.width = (Math.min(fee, scale) / scale * 100) + '%';
        tweenNumber($('[data-net]', b), net, 400, money);
        $('[data-sub]', b).textContent = f.note + ' · pagas ' + money(fee) + ' al mes';
      });
      bars.forEach(function (b) { b.classList.toggle('is-best', b === best); });
    };
    range.addEventListener('input', render); render();
  }

  function initLOI() {
    var form = $('#loiForm'); if (!form) return;
    var steps = $$('.fstep', form), tabs = $$('#stepper button'), cur = 0, maxDone = -1;
    var prev = $('#prev'), next = $('#next'), submit = $('#submit'), err = $('#err');
    var DB = window.HG_DB || {}, dbReady = !!(DB.url && DB.key);
    var PLANS = { semilla: 'Plan Semilla', pro: 'Plan Gema Pro', elite: 'Plan Gema Élite' };
    var PRICES = { semilla: '$0 al mes + 3% por venta', pro: '$19.900 al mes', elite: '$39.900 al mes' };
    var otp = { to: null, wait: 0, timer: null };
    var val = function (id) { return $(id).value.trim(); };
    var plan = function () { var r = $('#planRadios input:checked'); return r ? r.value : ''; };
    var setLabel = function (t) { $('.btn__label', submit).textContent = t; };

    // preselect plan from ?plan= (plan detail pages link here)
    try {
      var qp = new URLSearchParams(location.search).get('plan');
      if (qp && PLANS[qp]) { var rq = $('#planRadios input[value="' + qp + '"]'); if (rq) rq.checked = true; }
    } catch (e) { /* old browser */ }

    $$('.fl select', form).forEach(function (s) { var f = function () { s.classList.toggle('has-value', !!s.value); }; s.addEventListener('change', f); f(); });
    $$('.fl input, .fl select', form).forEach(function (i) { i.addEventListener('input', function () { i.parentNode.classList.remove('is-bad'); err.textContent = ''; }); });
    // numbers only, never more than 10 digits
    ['#f-d', '#f-t'].forEach(function (id) {
      var el = $(id);
      el.addEventListener('input', function () { var d = el.value.replace(/\D/g, '').slice(0, 10); if (d !== el.value) el.value = d; });
    });
    $('#f-otp').addEventListener('input', function () { var el = $('#f-otp'); el.value = el.value.replace(/\D/g, '').slice(0, 8); });
    // a new e-mail needs a new code
    $('#f-e').addEventListener('input', function () { if (otp.to) resetOtp(); });

    var bad = function (el, msg) {
      var w = el.closest('.fl') || el.closest('.check') || el;
      w.classList.remove('is-bad'); void w.offsetWidth; w.classList.add('is-bad');
      err.textContent = msg; if (el.focus) el.focus({ preventScroll: true });
      return false;
    };
    var EMAIL = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
    var TYPOS = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gamil.com': 'gmail.com', 'hotmial.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'outlok.com': 'outlook.com', 'yaho.com': 'yahoo.com' };
    var validate = function (i) {
      err.textContent = '';
      if (i === 0) {
        if (val('#f-n').length < 2) return bad($('#f-n'), 'Escribe el nombre de tu emprendimiento.');
        if (!$('#f-u').value) return bad($('#f-u'), 'Elige tu universidad o zona de operación.');
        if (!plan()) { $('#planRadios').animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 300 }); err.textContent = 'Elige el plan que te interesa.'; return false; }
      }
      if (i === 1) {
        var name = val('#f-r');
        if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ.' -]+$/.test(name) || name.split(/\s+/).filter(Boolean).length < 2) return bad($('#f-r'), 'Escribe nombre y apellido del representante, solo con letras.');
        if (!/^\d{6,10}$/.test(val('#f-d'))) return bad($('#f-d'), 'La cédula debe tener solo números, entre 6 y 10 dígitos.');
        if (/^(\d)\1+$/.test(val('#f-d'))) return bad($('#f-d'), 'Revisa la cédula: no puede ser un solo número repetido.');
        if (!/^3\d{9}$/.test(val('#f-t'))) return bad($('#f-t'), 'Escribe un celular colombiano de 10 dígitos que empiece por 3.');
        var mail = val('#f-e').toLowerCase();
        if (!EMAIL.test(mail)) return bad($('#f-e'), 'Escribe un correo válido, por ejemplo nombre@gmail.com.');
        var dom = mail.split('@')[1];
        if (TYPOS[dom]) return bad($('#f-e'), '¿Quisiste decir ' + mail.split('@')[0] + '@' + TYPOS[dom] + '? Revisa el correo.');
      }
      if (i === 2) {
        if (!$('#terms').checked) return bad($('#terms'), 'Acepta el contrato y los términos para continuar.');
      }
      return true;
    };

    var summary = function () {
      var rows = [['Emprendimiento', val('#f-n')], ['Zona', $('#f-u').value], ['Plan', (PLANS[plan()] || '') + ' · ' + (PRICES[plan()] || '')], ['Representante', val('#f-r')], ['Cédula', val('#f-d')], ['Celular', val('#f-t')], ['Correo', val('#f-e').toLowerCase()]];
      var dl = $('#summary'); dl.innerHTML = '';
      rows.forEach(function (r) { var dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = r[0]; dd.textContent = r[1]; dl.appendChild(dt); dl.appendChild(dd); });
      var slug = plan() || 'pro';
      $('#termsLink').href = 'plan-' + slug + '.html#contrato';
      $('#termsHelp').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Hola Hidden Gems, tengo dudas sobre los términos del ' + (PLANS[slug] || 'servicio') + ' antes de adquirirlo.');
    };

    var go = function (i) {
      if (i === cur) return;
      var back = i < cur;
      steps[cur].hidden = true; cur = i;
      var s = steps[cur]; s.hidden = false; s.classList.remove('is-entering', 'back'); void s.offsetWidth; s.classList.add('is-entering'); if (back) s.classList.add('back');
      tabs.forEach(function (t, k) { if (k === cur) t.setAttribute('aria-current', 'step'); else t.removeAttribute('aria-current'); t.classList.toggle('is-done', k <= maxDone && k !== cur); });
      prev.hidden = cur === 0; next.hidden = cur === steps.length - 1; submit.hidden = cur !== steps.length - 1;
      err.textContent = '';
      if (cur === 2) summary();
    };
    window.HG_goStep = function (i) { if (!$('#success').hidden) return; go(i); };
    next.addEventListener('click', function () { if (validate(cur)) { maxDone = Math.max(maxDone, cur); go(cur + 1); } });
    prev.addEventListener('click', function () { go(cur - 1); });
    tabs.forEach(function (t, k) { t.addEventListener('click', function () { if (k <= maxDone + 1 && (k <= cur || validate(cur))) { if (k > cur) maxDone = Math.max(maxDone, cur); go(k); } }); });

    // ---- e-mail code (Supabase Auth, plain fetch) ----
    function resetOtp() {
      otp.to = null; clearInterval(otp.timer); $('#otpBox').hidden = true; $('#f-otp').value = '';
      setLabel('Enviar código a mi correo');
    }
    var apiErr = function (res, body) {
      if (res.status === 429) return 'Se pidieron demasiados códigos. Espera unos minutos e inténtalo de nuevo.';
      return (body && (body.msg || body.error_description || body.message)) || 'No pudimos conectar con el servidor. Revisa tu internet e inténtalo de nuevo.';
    };
    var post = function (path, body, token) {
      var h = { 'apikey': DB.key, 'Content-Type': 'application/json' };
      if (token) { h.Authorization = 'Bearer ' + token; h.Prefer = 'return=minimal'; }
      return fetch(DB.url.replace(/\/$/, '') + path, { method: 'POST', headers: h, body: JSON.stringify(body) })
        .then(function (res) { return res.text().then(function (t) { var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = null; } return { res: res, body: j }; }); });
    };
    var startCooldown = function () {
      var btn = $('#otpResend'); otp.wait = 60; btn.disabled = true;
      clearInterval(otp.timer);
      otp.timer = setInterval(function () {
        otp.wait--; btn.textContent = otp.wait > 0 ? 'Reenviar código (' + otp.wait + ' s)' : 'Reenviar código';
        if (otp.wait <= 0) { clearInterval(otp.timer); btn.disabled = false; }
      }, 1000);
    };
    var sending = function (on) { submit.classList.toggle('is-sending', on); };
    var sendCode = function () {
      var mail = val('#f-e').toLowerCase();
      sending(true);
      return post('/auth/v1/otp', { email: mail, create_user: true }).then(function (r) {
        sending(false);
        if (!r.res.ok) { err.textContent = apiErr(r.res, r.body); return; }
        otp.to = mail; $('#otpEmail').textContent = mail; $('#otpBox').hidden = false;
        setLabel('Verificar y registrar'); startCooldown(); $('#f-otp').focus();
        toast('Te enviamos un código a ' + mail, 'var(--violet)');
      }).catch(function () { sending(false); err.textContent = 'No pudimos enviar el código. Revisa tu internet e inténtalo de nuevo.'; });
    };
    $('#otpResend').addEventListener('click', function () { if (otp.wait <= 0) sendCode(); });
    $('#otpChange').addEventListener('click', function () { resetOtp(); go(1); $('#f-e').focus(); });

    var finish = function () {
      var p = plan(), rep = val('#f-r'), nom = val('#f-n');
      $('#successMsg').textContent = 'Gracias, ' + rep.split(' ')[0] + ': ' + nom + ' quedó registrado con el ' + PLANS[p] + ' y verificamos tu correo. Te contactaremos al ' + val('#f-t') + ' para activar tu vitrina.';
      $('#successWa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Hola Hidden Gems, acabo de registrar ' + nom + ' (' + PLANS[p] + '). Les envío el logo y las fotos de mis productos.');
      form.hidden = true; $('#success').hidden = false;
      confetti();
    };
    var verifyAndSave = function () {
      var code = $('#f-otp').value;
      if (code.length < 6) return bad($('#f-otp'), 'Escribe el código completo que llegó a tu correo.');
      sending(true);
      post('/auth/v1/verify', { type: 'email', email: otp.to, token: code }).then(function (r) {
        if (!r.res.ok || !r.body || !r.body.access_token) { sending(false); bad($('#f-otp'), 'El código no es válido o ya venció. Revisa tu correo o pide uno nuevo.'); return; }
        return post('/rest/v1/emprendimientos', {
          nombre: val('#f-n'), zona: $('#f-u').value, plan: plan(), representante: val('#f-r'),
          documento: val('#f-d'), telefono: val('#f-t'), correo: otp.to, acepta_terminos: true
        }, r.body.access_token).then(function (w) {
          sending(false);
          if (w.res.ok) { finish(); return; }
          if (w.body && w.body.code === '23505') { err.textContent = 'Ya existe un registro de este emprendimiento con esa cédula.'; return; }
          err.textContent = 'Verificamos tu correo, pero no pudimos guardar el registro. Inténtalo de nuevo o escríbenos por WhatsApp.';
        });
      }).catch(function () { sending(false); err.textContent = 'No pudimos conectar con el servidor. Revisa tu internet e inténtalo de nuevo.'; });
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      for (var i = 0; i < steps.length; i++) { if (!validate(i)) { if (i !== cur) { go(i); validate(i); } return; } }
      if (!dbReady) { err.innerHTML = ''; err.appendChild(document.createTextNode('El registro todavía no está conectado a la base de datos. Por ahora, escríbenos al +57 310 870 5851 para registrarte.')); return; }
      if (otp.to && otp.to === val('#f-e').toLowerCase()) verifyAndSave(); else sendCode();
    });
    $('#again').addEventListener('click', function () {
      form.reset(); $$('.fl select', form).forEach(function (s) { s.classList.remove('has-value'); });
      resetOtp(); maxDone = -1;
      $('#success').hidden = true; form.hidden = false; go(0);
      tabs.forEach(function (t) { t.classList.remove('is-done'); });
    });
  }

  function initAbout() {
    var p = $('#aboutText'); if (!p) return;
    var words = [];
    var wrap = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span'); s.className = 'word'; s.textContent = part; frag.appendChild(s); words.push(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) wrap(n);
      });
    };
    wrap(p);
    var N = words.length;
    scrub(p, 0.88, 0.5, function (prog) {
      var k = prog * (N + 4);
      for (var i = 0; i < N; i++) words[i].style.setProperty('--o', clamp(k - i, 0.14, 1).toFixed(2));
    });
  }

  function initFAQ() {
    $$('.faq details').forEach(function (d) {
      var sum = $('summary', d), ans = $('.faq__a', d);
      sum.addEventListener('click', function (e) {
        e.preventDefault();
        if (d.open) {
          var a = ans.animate([{ opacity: 1, transform: 'none', maxHeight: ans.scrollHeight + 'px' }, { opacity: 0, transform: 'translateY(-8px)', maxHeight: '0px' }], { duration: 320, easing: 'ease-in' });
          a.onfinish = function () { d.open = false; };
        } else {
          $$('.faq details[open]').forEach(function (o) { if (o !== d) o.open = false; });
          d.open = true;
          ans.animate([{ opacity: 0, transform: 'translateY(-10px)', maxHeight: '0px' }, { opacity: 1, transform: 'none', maxHeight: ans.scrollHeight + 'px' }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' });
        }
      });
    });
  }

  function initFooter() {
    var wm = $('#wordmark'); if (!wm) return;
    var hover = false, x = 50, y = 50;
    wm.parentNode.addEventListener('pointermove', function (e) {
      var r = wm.getBoundingClientRect(); hover = true;
      x = (e.clientX - r.left) / r.width * 100; y = (e.clientY - r.top) / r.height * 100;
    });
    wm.parentNode.addEventListener('pointerleave', function () { hover = false; });
    if (lite) return;
    var cx = 50, cy = 50, vis = false;
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(wm);
    onTick(function (t) {
      if (!vis) return;
      var tx = hover ? x : 50 + Math.sin(t / 1400) * 40, ty = hover ? y : 50 + Math.cos(t / 1100) * 30;
      cx = lerp(cx, tx, 0.08); cy = lerp(cy, ty, 0.08);
      wm.style.setProperty('--wx', cx.toFixed(1) + '%'); wm.style.setProperty('--wy', cy.toFixed(1) + '%');
    });
  }

  function boot() {
    safe(initSplash, 'splash');
    safe(initPointer, 'pointer');
    safe(initHeader, 'header');
    safe(initMagnetic, 'magnetic');
    safe(initSplit, 'split');
    safe(initRotator, 'rotator');
    safe(initHeroSearch, 'heroSearch');
    safe(initGem, 'gem');
    safe(initRibbons, 'ribbons');
    safe(initReveal, 'reveal');
    safe(initCounters, 'counters');
    safe(initAudience, 'audience');
    safe(initConverge, 'converge');
    safe(initCatalog, 'catalog');
    safe(initCategories, 'categories');
    safe(initAuraSpot, 'auraSpot');
    safe(initAura, 'aura');
    safe(initSteps, 'steps');
    safe(initPlans, 'plans');
    safe(initCalc, 'calc');
    safe(initLOI, 'loi');
    safe(initAbout, 'about');
    safe(initFAQ, 'faq');
    safe(initFooter, 'footer');
    scrollDirty = true;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
