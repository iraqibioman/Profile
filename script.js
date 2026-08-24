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
     5. Counters — replay on a loop while the tiles are on screen
     ====================================================================== */
  (function counters() {
    var nums = document.querySelectorAll('[data-count]');
    var DURATION = 1500;   // how long one count takes
    var HOLD     = 4500;   // how long the final number rests before replaying

    if (reduced) {
      nums.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
      return;
    }

    function makeRunner(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var visible = false;
      var timer = null;
      var frameId = null;

      function count() {
        var t0 = null;
        cancelAnimationFrame(frameId);
        function frame(now) {
          if (t0 === null) t0 = now;
          var p = Math.min((now - t0) / DURATION, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) {
            frameId = raf(frame);
          } else if (visible) {
            timer = setTimeout(count, HOLD);   // rest, then run again
          }
        }
        frameId = raf(frame);
      }

      return {
        start: function () {
          if (visible) return;
          visible = true;
          count();
        },
        stop: function () {
          visible = false;
          clearTimeout(timer);
          cancelAnimationFrame(frameId);
        }
      };
    }

    if (!('IntersectionObserver' in window)) {
      nums.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
      return;
    }

    var runners = new WeakMap();
    nums.forEach(function (el) { runners.set(el, makeRunner(el)); });

    // only animate what is actually being looked at
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var r = runners.get(e.target);
        if (!r) return;
        if (e.isIntersecting) r.start(); else r.stop();
      });
    }, { threshold: 0.5 });

    nums.forEach(function (el) { io.observe(el); });

    // a background tab should not be burning frames
    document.addEventListener('visibilitychange', function () {
      nums.forEach(function (el) {
        var r = runners.get(el);
        if (!r) return;
        if (document.hidden) r.stop();
      });
    });
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
     8b. Hold the certificate rows still while a finger is on them
     ====================================================================== */
  (function holdMarquee() {
    document.querySelectorAll('.certs-flow .marquee').forEach(function (row) {
      var release;
      function hold() {
        clearTimeout(release);
        row.classList.add('is-held');
      }
      function letGo() {
        release = setTimeout(function () { row.classList.remove('is-held'); }, 2500);
      }
      row.addEventListener('touchstart', hold, { passive: true });
      row.addEventListener('touchend', letGo, { passive: true });
      row.addEventListener('focusin', hold);
      row.addEventListener('focusout', letGo);
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
      btn.textContent = open ? window.T('cert.hide') : window.T('cert.toggle');
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
      send.textContent = window.T('form.sending');
      note.textContent = '';
      note.classList.remove('is-ok', 'is-err');

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (r) {
          if (!r.ok) throw new Error();
          form.reset();
          note.className = 'form__note is-ok';
          note.textContent = window.T('form.ok');
        })
        .catch(function () {
          note.className = 'form__note is-err';
          note.textContent = window.T('form.err');
        })
        .finally(function () {
          send.disabled = false;
          send.textContent = window.T('form.send');
        });
    });
  })();
})();

/* ==========================================================================
   9. Language switch — English / Arabic
   ========================================================================== */
(function () {
  var AR = {
    'brand': 'حسن الشبيب',
    'nav.about': 'نبذة',
    'nav.experience': 'الخبرة',
    'nav.projects': 'المشاريع',
    'nav.education': 'التعليم',
    'nav.recs': 'التوصيات',
    'nav.contact': 'تواصل',

    'hero.eyebrow': 'تحليل المعلومات &nbsp;·&nbsp; إدارة البرامج &nbsp;·&nbsp; بغداد، العراق',
    'hero.name': '<span>حسن</span> <span><em>الشبيب</em></span>',
    'hero.lede': 'ثمانية عشر عاماً في تحويل الضجيج إلى قرارات — للأمم المتحدة، والوكالة الأمريكية للتنمية الدولية، واليونيدو، وميرسي كور في العراق.',
    'hero.cta1': 'تواصل معي',
    'hero.cta2': 'تحميل السيرة الذاتية',
    'hero.scroll': 'مرِّر',

    'org.unami': 'بعثة الأمم المتحدة لمساعدة العراق',
    'org.mercy': 'ميرسي كور',
    'org.csc': 'برنامج الخدمة المدنية',
    'org.unido': 'منظمة الأمم المتحدة للتنمية الصناعية',
    'org.cscfull': 'برنامج فيلق الخدمة المدنية',
    'org.un': 'الأمم المتحدة',
    'city.baghdad': 'بغداد',
    'city.kirkuk': 'كركوك',
    'doc.support': 'وثيقة داعمة',
    'doc.perf': 'سجلات الأداء',

    'fig.years': 'سنة من<br>الخبرة المهنية',
    'fig.orgs': 'منظمة<br>دولية',
    'fig.certs': 'شهادة<br>ودورة تدريبية',

    'about.label': 'نبذة',
    'about.head': 'المعلومة لا قيمة لها ما لم يستطع أحدهم التصرّف بناءً عليها.',
    'about.p1': 'على مدى تسع سنوات قدتُ وحدة تحليلية من أربعة أشخاص في بعثة الأمم المتحدة لمساعدة العراق. أنتجنا التقارير الميدانية التي اعتمدت عليها قيادة البعثة — نجمع الأدلة من الميدان، ونكتشف النمط الكامن فيها، ونضعها أمام صنّاع القرار قبل أن تفوت اللحظة.',
    'about.p2': 'قبل البعثة أدرتُ الاتصالات في برنامج للعدالة تابع للوكالة الأمريكية للتنمية الدولية، وساندتُ مشروعاً وطنياً للمناطق الصناعية في اليونيدو، وقدتُ التوعية في برنامجين وطنيين للمناصرة وبناء السلام في ميرسي كور. علّمني هذا التنوّع كم تختلف قراءة الوزارة والمانح والمنظمة المحلية للحقائق نفسها.',
    'about.p3': 'أحمل شهادة PMP وماجستير في إدارة الأعمال الدولية، وأعمل يومياً على Power&nbsp;BI وQlik وArcGIS وExcel. كل تقييم أداء سنوي من 2014 إلى 2025 جاء بدرجة «يفوق التوقعات».',

    'exp.label': 'الخبرة',
    'exp.head': 'ثمانية عشر عاماً، خمس منظمات، ومهمة واحدة: أن تتضح الصورة.',

    'role1.date': 'تشرين الأول 2016 — كانون الأول 2025',
    'role1.title': 'محلل معلومات أول',
    'role1.text': 'قدتُ وحدة تحليلية من أربعة أعضاء تُنتج التقارير الميدانية لقيادة البعثة العليا، وقدّمتُ تحليل الاتجاهات الإقليمية الذي شكّل التخطيط الاستراتيجي.',
    'role1.b1': 'عزّزتُ تبادل المعلومات بين وكالات الأمم المتحدة والشركاء الدوليين والنظراء الحكوميين',
    'role1.b2': 'نفّذتُ بعثات تقصّي حقائق ميدانية في أنحاء العراق لدعم صياغة السياسات',
    'role1.b3': 'تمت ترقيتي من درجة NOB إلى درجة NOC',

    'role2.date': 'شباط 2015 — تشرين الأول 2016',
    'role2.title': 'موظف إداري',
    'role2.text': 'أدرتُ العمليات الإدارية والموارد البشرية لوحدة التحليل، وتوليتُ دورة التخطيط والموازنة السنوية.',
    'role2.b1': 'أدرتُ التوظيف والاستقبال والملاك الوظيفي وتقييمات الأداء',
    'role2.b2': 'أعددتُ تقارير الأداء والتقارير المالية لكبار المسؤولين',
    'role2.b3': 'تمت ترقيتي من فئة الخدمات العامة إلى فئة الموظفين الوطنيين',

    'role3.date': 'كانون الثاني 2014 — شباط 2015',
    'role3.title': 'مستشار اتصالات',
    'role3.prog': '— مشروع الوصول إلى العدالة',
    'role3.text': 'قدتُ فريق اتصالات وتوعية من أربعة أشخاص، بالعمل مع منظمات شريكة وجهات حكومية لتنفيذ مبادرات قطاع العدالة.',
    'role3.b1': 'ترأستُ لجنتين متعددتَي المنظمات تضمّان أكثر من 30 شريكاً',
    'role3.b2': 'كتبتُ موجزات تحليلية أسبوعية شكّلت استراتيجيات استجابة المجتمع المدني',
    'role3.b3': 'تمت ترقيتي إلى نائب رئيس الوحدة',

    'role4.date': 'آب 2011 — كانون الأول 2013',
    'role4.title': 'مساعد برامج',
    'role4.text': 'ساندتُ تصميم وتنفيذ برنامج وطني للمناطق الصناعية بالتعاون مع الوزارات وشركاء الصناعة والخبراء الفنيين.',
    'role4.b1': 'أجريتُ بحوثاً اقتصادية وصناعية وأعددتُ دراسات الجدوى',
    'role4.b2': 'أدرتُ قواعد بيانات المشروع والتقارير الميدانية اليومية',

    'role5.date': 'حزيران 2008 — آب 2011',
    'role5.title': 'موظف اتصالات وتوعية',
    'role5.text': 'قدتُ التوعية في برنامجين وطنيين للمناصرة وبناء السلام لتعزيز حقوق الفئات المهمّشة والنساء بانيات السلام.',
    'role5.b1': 'جهة الاتصال الرئيسية مع المانح، وزارة الخارجية الأمريكية / مكتب DRL',
    'role5.b2': 'أشرفتُ على بوابة إلكترونية متعددة اللغات وخدمة توعية عبر الرسائل النصية',
    'role5.b3': 'أعددتُ مقترحات المنح ونقلتُ ملاحظات أصحاب المصلحة إلى تصميم البرنامج',

    'role6.date': 'آب 2007 — أيار 2008',
    'role6.title': 'مدير تقنية المعلومات',
    'role6.text': 'أدرتُ فريق تقنية معلومات من خمسة أشخاص نفّذ أكثر من 160 مشروعاً رقمياً للخدمة المدنية، وحدّث الأنظمة الإدارية الحكومية ضمن برنامج إعمار مموّل أمريكياً.',
    'role6.b1': 'بنيتُ أدوات تتبّع المشاريع وإعداد التقارير المستخدمة في تحليل الأداء الفصلي',
    'role6.b2': 'صمّمتُ ونفّذتُ تدريباً تقنياً للموظفين والمتدربين',

    'proj.label': 'مشاريع مختارة',
    'proj.head': 'برامج ساهمتُ في تصميمها وإدارتها وإعداد تقاريرها.',
    'proj.lede': 'خمسة مشاريع شكّلت طريقتي في العمل — في الإعمار والصناعة والعدالة والمناصرة والتحليل.',

    'proj1.title': 'وحدة التحليل المشترك',
    'proj1.text': 'بنيتُ وقدتُ الوظيفة التحليلية وراء التقارير الميدانية للبعثة. وحدة من أربعة أشخاص تحوّل الأدلة الميدانية وتقارير الوكالات والمصادر المفتوحة إلى تحليل اتجاهات تستخدمه القيادة العليا في التخطيط الاستراتيجي.',
    'proj1.f1': '<b>4</b> محللين بقيادتي',
    'proj1.f2': '<b>9</b> سنوات في قيادة الوحدة',
    'proj1.f3': '<b>12</b> سنة بتقييم «يفوق التوقعات»',

    'proj2.title': 'الوصول إلى العدالة',
    'proj2.text': 'الاتصالات والتوعية لبرنامج في قطاع العدالة نُفّذ عبر شبكة من المنظمات الشريكة. ترأستُ اللجنتين اللتين نسّقتا بينها، وقدتُ خطط عملها السنوية، وأنتجتُ تقارير التقدّم التي اعتمد عليها المانح.',
    'proj2.f1': '<b>+30</b> منظمة شريكة',
    'proj2.f2': '<b>2</b> لجنة برئاستي',
    'proj2.f3': '<b>4</b> موظفين بإدارتي',

    'proj3.title': 'البرنامج الوطني للمناطق الصناعية',
    'proj3.text': 'ساندتُ تصميم وتنفيذ برنامج وطني لإنشاء مناطق صناعية في أنحاء العراق، بالعمل مع الوزارات وشركاء الصناعة والخبراء الفنيين. أنتجتُ البحوث الاقتصادية والصناعية التي قامت عليها دراسات الجدوى، وبنيتُ قواعد البيانات التي تتبّعت نشاط البرنامج.',
    'proj3.f1': 'دراسات جدوى مُعدّة',
    'proj3.f2': 'تنسيق على مستوى الوزارات',
    'proj3.f3': 'تقارير ميدانية يومية',

    'proj4.title': 'برامج المناصرة وبناء السلام',
    'proj4.text': 'برنامجان وطنيان — دعم المناصرة الفعّالة للفئات المهمّشة، وتمكين النساء بانيات السلام. أدرتُ التوعية في كليهما، وكنتُ جهة الاتصال الرئيسية مع المانح، وأشرفتُ على بوابة إلكترونية متعددة اللغات وخدمة رسائل نصية أوصلت المعلومات إلى المجتمعات في أنحاء العراق.',
    'proj4.f1': '<b>2</b> برنامج وطني',
    'proj4.f2': 'جهة الاتصال مع وزارة الخارجية الأمريكية / DRL',
    'proj4.f3': 'توعية متعددة اللغات عبر الويب والرسائل',

    'proj5.title': 'تحديث الخدمة المدنية، كركوك',
    'proj5.text': 'أدرتُ فريق تقنية المعلومات الذي نفّذ مشاريع الخدمة المدنية الرقمية لمحافظة كركوك ضمن برنامج إعمار مموّل أمريكياً. بنيتُ أدوات التتبّع والتقارير المستخدمة في تحليل الأداء الفصلي، وصمّمتُ التدريب الذي نقل موظفي الحكومة إلى الأنظمة الجديدة.',
    'proj5.f1': '<b>+160</b> مشروعاً أُنجز في موعده',
    'proj5.f2': '<b>5</b> موظفي تقنية معلومات بإدارتي',
    'proj5.f3': 'برامج تدريبية مُصمّمة',

    'exp2.label': 'المهارات',
    'exp2.head': 'ما أفعله فعلياً كل يوم.',
    'tile.analysis': 'التحليل',
    'tile.analysis.head': 'قراءة بيئة مزدحمة بالضجيج، وقول ما تعنيه.',
    'tile.a1': 'التقارير الميدانية للقيادة العليا',
    'tile.a2': 'تحليل الاتجاهات والأنماط الإقليمية',
    'tile.a3': 'تحليل SWOT وتحليل النزاعات',
    'tile.a4': 'الرصد والتقييم',
    'tile.a5': 'بعثات تقصّي الحقائق الميدانية',
    'tile.data': 'البيانات',
    'tile.d2': 'لوحات Qlik',
    'tile.d4': 'Excel المتقدّم',
    'tile.prog': 'البرامج',
    'tile.p1': 'إدارة المشاريع (PMP)',
    'tile.p2': 'التخطيط الاستراتيجي',
    'tile.p3': 'الموازنة والتنبّؤ',
    'tile.p4': 'إدارة المخاطر',
    'tile.lang': 'اللغات',
    'lang.ar': 'العربية',
    'lang.en': 'الإنجليزية',
    'lang.ku': 'الكردية',
    'tile.perf': 'الأداء',
    'tile.perf.k': 'سنوات متتالية بتقييم<br>«يفوق التوقعات»',

    'edu.label': 'التعليم',
    'edu.head': 'المؤهلات.',
    'edu1.title': 'شهادة الماجستير',
    'edu1.inst': 'جامعة غوليلمو ماركوني',
    'edu1.note': 'إدارة الأعمال الدولية. المعدل النهائي 110/110، 60 وحدة ECTS.',
    'edu2.title': 'بكالوريوس علوم',
    'edu2.inst': 'جامعة بغداد',
    'edu2.note': 'الأحياء المجهرية، كلية العلوم.',
    'edu3.inst': 'معهد إدارة المشاريع',
    'edu3.note': 'شهادة محترف إدارة المشاريع (PMP).',
    'edu4.title': 'المركز الثالث، الدوحة',
    'edu4.note': 'دورة التحليلات الإلكترونية والابتكار.',

    'cert.label': 'التطوير المهني',
    'cert.head': 'أربع وأربعون شهادة، والعدد في ازدياد.',
    'cert.toggle': 'عرض الشهادات الـ44 كاملة',
    'cert.hide': 'إخفاء القائمة الكاملة',

    'rec.label': 'التوصيات',
    'rec.head': 'ما كتبه عني من عملتُ معهم.',
    'rec.lede': 'سبع رسائل، من بينها رسالتان من الممثلَين الخاصَّين للأمين العام في بعثة الأمم المتحدة. كل واحدة تفتح الوثيقة الأصلية.',
    'rec1.date': 'كانون الأول 2025',
    'rec2.date': 'كانون الأول 2024',
    'rec3.date': 'كانون الأول 2018',
    'rec4.date': 'شباط 2015',
    'rec5.date': 'آذار 2014',
    'rec6.date': 'كانون الثاني 2014',
    'rec7.date': '2014 — 2025',
    'rec1.title': 'رسالة تقدير',
    'rec1.from': 'محمد الحسن — الممثل الخاص للأمين العام، بعثة الأمم المتحدة لمساعدة العراق',
    'rec2.title': 'رسالة توصية',
    'rec2.from': 'بعثة الأمم المتحدة لمساعدة العراق',
    'rec3.title': 'رسالة شكر',
    'rec3.from': 'يان كوبيش — الممثل الخاص للأمين العام، بعثة الأمم المتحدة لمساعدة العراق',
    'rec4.title': 'رسالة توصية',
    'rec4.from': 'الوكالة الأمريكية للتنمية الدولية — مشروع الوصول إلى العدالة',
    'rec5.title': 'رسالة توصية',
    'rec5.from': 'ميرسي كور',
    'rec6.title': 'رسالة تقدير',
    'rec6.from': 'منظمة الأمم المتحدة للتنمية الصناعية',
    'rec7.title': 'سجلات الأداء السنوية',
    'rec7.from': 'اثنتا عشرة سنة متتالية بتقييم «يفوق التوقعات»',
    'rec.note': 'تتوفّر عند الطلب رسالتا تقدير إضافيتان من وزارة العلوم والتكنولوجيا العراقية.',

    'con.label': 'تواصل',
    'con.head': 'لنتحدّث.',
    'con.lede': 'منفتح على أدوار في التحليل وإدارة البرامج والتنمية الدولية.',
    'con.email': 'البريد الإلكتروني',
    'con.phone': 'الهاتف',
    'con.based': 'المقر',
    'con.city': 'بغداد، العراق',
    'con.cv': 'السيرة الذاتية',
    'con.cvlink': 'تحميل PDF',

    'form.name': 'الاسم',
    'form.email': 'البريد الإلكتروني',
    'form.subject': 'الموضوع',
    'form.message': 'الرسالة',
    'form.send': 'إرسال الرسالة',
    'form.sending': 'جارٍ الإرسال',
    'form.ok': 'تم إرسال الرسالة. وصلت إلى h.alshibeeb@gmail.com وسأرد عليك قريباً.',
    'form.err': 'لم يتم الإرسال. يرجى مراسلتي مباشرة على h.alshibeeb@gmail.com.'
  };

  /* strings that live only in JS (not in the markup) */
  var EN_JS = {
    'cert.toggle': 'View all 44 certifications',
    'cert.hide': 'Hide the full list',
    'form.send': 'Send message',
    'form.sending': 'Sending',
    'form.ok': 'Message sent. It has gone to h.alshibeeb@gmail.com and I will reply shortly.',
    'form.err': 'That did not send. Please email h.alshibeeb@gmail.com directly.'
  };

  var html   = document.documentElement;
  var toggle = document.getElementById('langToggle');
  var nodes  = [].slice.call(document.querySelectorAll('[data-i18n]'));
  var phs    = [].slice.call(document.querySelectorAll('[data-i18n-ph]'));
  var lang   = 'en';

  /* remember the English exactly as authored */
  nodes.forEach(function (el) { el._en = el.innerHTML; });
  phs.forEach(function (el)   { el._enPh = el.getAttribute('placeholder'); });

  /* public lookup used by the cert toggle and the contact form */
  window.T = function (key) {
    if (lang === 'ar' && AR[key]) return AR[key];
    return EN_JS[key] || key;
  };

  function apply(next) {
    lang = next;

    nodes.forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      el.innerHTML = (lang === 'ar' && AR[k]) ? AR[k] : el._en;
    });

    phs.forEach(function (el) {
      var k = el.getAttribute('data-i18n-ph');
      var v = (lang === 'ar' && AR[k]) ? AR[k] : el._enPh;
      el.setAttribute('placeholder', v);
      el.setAttribute('aria-label', v);
    });

    /* the certification button label depends on whether the list is open */
    var cb = document.querySelector('[data-cert-toggle]');
    if (cb) {
      cb.textContent = cb.getAttribute('aria-expanded') === 'true'
        ? window.T('cert.hide')
        : window.T('cert.toggle');
    }

    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    if (toggle) {
      [].slice.call(toggle.querySelectorAll('.lang__opt')).forEach(function (o) {
        o.classList.toggle('is-on', o.getAttribute('data-lang') === lang);
      });
      toggle.setAttribute('aria-label',
        lang === 'ar' ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic');
    }

    try { localStorage.setItem('site-lang', lang); } catch (e) {}

    /* the certification list is measured in pixels — remeasure after reflow */
    window.dispatchEvent(new Event('resize'));
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      apply(lang === 'ar' ? 'en' : 'ar');
    });
  }

  var saved = null;
  try { saved = localStorage.getItem('site-lang'); } catch (e) {}
  if (saved === 'ar') apply('ar');
})();
