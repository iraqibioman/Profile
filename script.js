/* ==========================================================================
   Hasan Alshabeeb — Portfolio
   Ambient field, scroll progress, reveals, chronology rail, spotlight, form.
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf = window.requestAnimationFrame.bind(window);

  /* ======================================================================
     1. Ambient field — a slow drift of points behind the hero.
     Suggests information without pretending to be a chart.
     ====================================================================== */
  (function ambientField() {
    var canvas = document.getElementById('field');
    if (!canvas || reduced) return;

    var ctx = canvas.getContext('2d');
    var hero = canvas.parentElement;
    var pts = [];
    var w = 0, h = 0, dpr = 1;
    var running = true;

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.offsetWidth;
      h = hero.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      var density = Math.min(Math.round((w * h) / 15000), 110);
      pts = [];
      for (var i = 0; i < density; i++) {
        pts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          r: Math.random() * 1.3 + 0.4
        });
      }
    }

    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);

      var cx = w / 2, cy = h * 0.42;
      var maxD = Math.max(w, h) * 0.62;

      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w; else if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; else if (p.y > h) p.y = 0;

        // fade toward the edges so the field never fights the type
        var d = Math.hypot(p.x - cx, p.y - cy);
        var fade = Math.max(0, 1 - d / maxD);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 92, 190,' + (fade * 0.30).toFixed(3) + ')';
        ctx.fill();

        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var dist = dx * dx + dy * dy;
          if (dist > 15000) continue;
          var a = (1 - dist / 15000) * fade * 0.11;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = 'rgba(0, 113, 227,' + a.toFixed(3) + ')';
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
      raf(draw);
    }

    size();
    draw();

    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(size, 180);
    });

    // stop painting once the hero is off screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var vis = entries[0].isIntersecting;
        if (vis && !running) { running = true; draw(); }
        running = vis;
      }, { threshold: 0 }).observe(hero);
    }
  })();

  /* ======================================================================
     2. Scroll progress + sticky nav state
     ====================================================================== */
  (function scrollChrome() {
    var bar = document.querySelector('.progress');
    var nav = document.querySelector('.nav');
    var ticking = false;

    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? window.scrollY / max : 0;
      if (bar) bar.style.transform = 'scaleX(' + pct + ')';
      if (nav) nav.classList.toggle('is-stuck', window.scrollY > 20);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      raf(update);
    }, { passive: true });

    update();
  })();

  /* ======================================================================
     3. Mobile navigation
     ====================================================================== */
  (function mobileNav() {
    var nav = document.querySelector('.nav');
    var burger = document.querySelector('.nav__burger');
    if (!nav || !burger) return;

    function close() {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }

    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });

    nav.querySelectorAll('.nav__link').forEach(function (a) {
      a.addEventListener('click', close);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  })();

  /* ======================================================================
     4. Scroll reveal
     ====================================================================== */
  (function reveal() {
    var items = document.querySelectorAll('.rv');

    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('on'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('on');
        io.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ======================================================================
     5. Counters
     ====================================================================== */
  (function counters() {
    var nums = document.querySelectorAll('[data-count]');

    function run(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (reduced) { el.textContent = target; return; }

      var dur = 1500, t0 = null;
      function frame(now) {
        if (t0 === null) t0 = now;
        var p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf(frame);
      }
      raf(frame);
    }

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.5 });

    nums.forEach(function (el) { io.observe(el); });
  })();

  /* ======================================================================
     6. Chronology rail — highlights the year of the role in view
     ====================================================================== */
  (function chronology() {
    var years = document.querySelectorAll('.rail__yr');
    var roles = document.querySelectorAll('.role[data-year]');
    if (!years.length || !roles.length) return;

    function mark(year) {
      years.forEach(function (y) {
        y.classList.toggle('is-on', y.getAttribute('data-year') === year);
      });
    }

    years.forEach(function (y) {
      y.addEventListener('click', function () {
        var t = document.querySelector('.role[data-year="' + y.getAttribute('data-year') + '"]');
        if (t) t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      });
    });

    if (!('IntersectionObserver' in window)) { mark(roles[0].getAttribute('data-year')); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) mark(e.target.getAttribute('data-year'));
      });
    }, { threshold: 0.4, rootMargin: '-20% 0px -35% 0px' });

    roles.forEach(function (r) { io.observe(r); });
    mark(roles[0].getAttribute('data-year'));
  })();

  /* ======================================================================
     7. Nav section highlighting
     ====================================================================== */
  (function activeSection() {
    var links = document.querySelectorAll('.nav__link[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;

    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); });
        if (map[e.target.id]) map[e.target.id].classList.add('is-active');
      });
    }, { threshold: 0.2, rootMargin: '-15% 0px -55% 0px' });

    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) io.observe(s);
    });
  })();

  /* ======================================================================
     8. Cursor spotlight on glass panels
     ====================================================================== */
  (function spotlight() {
    if (!window.matchMedia('(hover: hover)').matches || reduced) return;

    document.querySelectorAll('.panel').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  })();

  /* ======================================================================
     9. Certifications toggle
     ====================================================================== */
  (function certs() {
    var btn = document.querySelector('[data-cert-toggle]');
    var list = document.getElementById('certAll');
    if (!btn || !list) return;

    var open = false;

    function apply() {
      // measure every time: the list is 2 columns on desktop, 1 on mobile
      list.style.maxHeight = open ? list.scrollHeight + 'px' : '0px';
    }

    btn.addEventListener('click', function () {
      open = !open;
      list.classList.toggle('is-open', open);
      apply();
      btn.textContent = open ? 'Hide the full list' : 'View all 44 certifications';
      btn.setAttribute('aria-expanded', String(open));
      if (!open) btn.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    });

    // a rotated phone changes the column count, so re-measure
    var rt;
    window.addEventListener('resize', function () {
      if (!open) return;
      clearTimeout(rt);
      rt = setTimeout(apply, 150);
    });
  })();

  /* ======================================================================
     10. Contact form
     ====================================================================== */
  (function contact() {
    var form = document.getElementById('contactForm');
    if (!form) return;

    var note = form.querySelector('.form__note');
    var send = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      send.disabled = true;
      send.textContent = 'Sending';
      note.textContent = '';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (r) {
          if (!r.ok) throw new Error();
          form.reset();
          note.textContent = 'Message sent. I will reply shortly.';
        })
        .catch(function () {
          note.textContent = 'That did not send. Email h.alshibeeb@gmail.com directly.';
        })
        .finally(function () {
          send.disabled = false;
          send.textContent = 'Send message';
        });
    });
  })();
})();
