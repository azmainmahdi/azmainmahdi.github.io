(function () {
  var root = document.documentElement;

  // theme: saved choice, else system
  var btn = document.querySelector('.theme');
  function current() {
    return root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  function paintIcon() { if (btn) btn.innerHTML = current() === 'dark' ? '<i class="ti ti-sun"></i>' : '<i class="ti ti-moon"></i>'; }
  if (btn) btn.addEventListener('click', function () {
    var next = current() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    paintIcon();
  });
  paintIcon();

  // nav: mark the section in view
  var spyLinks = [].slice.call(document.querySelectorAll('nav [data-spy]'));
  if (spyLinks.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var link = document.querySelector('nav [data-spy="' + e.target.id + '"]');
        if (link) link.classList.toggle('on', e.isIntersecting);
      });
      // Home stays lit until a section further down takes over
      var home = document.querySelector('nav [data-home]');
      if (home) home.classList.toggle('on', !spyLinks.some(function (a) { return a.classList.contains('on'); }));
    }, { rootMargin: '-45% 0px -50% 0px' });
    spyLinks.forEach(function (a) { var t = document.getElementById(a.dataset.spy); if (t) spy.observe(t); });
  }

  // nav blends into the hero band, then returns to the page colour
  var band = document.querySelector('.hero-band'), bar = document.querySelector('nav');
  if (band && bar) {
    bar.classList.add('over');
    if ('IntersectionObserver' in window) {
      var steps = []; for (var k = 0; k <= 20; k++) steps.push(k / 20);
      new IntersectionObserver(function (es) {
        bar.classList.toggle('over', es[0].boundingClientRect.bottom > bar.offsetHeight);
      }, { threshold: steps }).observe(band);
    }
  }

  // teaching tabs: one panel at a time (all panels show if JS is off)
  var tabs = [].slice.call(document.querySelectorAll('[role="tab"]'));
  function pick(t) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { pick(t); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { var n = tabs[(i + d + tabs.length) % tabs.length]; pick(n); n.focus(); }
    });
  });
  if (tabs.length) pick(tabs[0]);

  // copy email
  [].slice.call(document.querySelectorAll('.copy')).forEach(function (b) {
    b.addEventListener('click', function () {
      var label = b.querySelector('span');
      (navigator.clipboard ? navigator.clipboard.writeText(b.dataset.copy) : Promise.reject())
        .then(function () { label.textContent = 'Copied'; }, function () { label.textContent = 'Select and copy'; });
      setTimeout(function () { label.textContent = 'Copy email'; }, 2000);
    });
  });

  // videos load only when clicked
  [].slice.call(document.querySelectorAll('.video[data-id]')).forEach(function (v) {
    v.addEventListener('click', function () {
      v.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + v.dataset.id +
        '?autoplay=1" title="' + v.getAttribute('aria-label') + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    }, { once: true });
  });
})();

// x-ray showcase: a scan line sweeps on its own; drag or arrow keys take over
(function () {
  var box = document.querySelector('[data-xray]');
  if (!box) return;
  var plain = box.querySelector('.xr-plain');
  var ray = plain.cloneNode(true);
  ray.className = 'xr-layer xr-ray';
  ray.setAttribute('aria-hidden', 'true');
  plain.after(ray);
  var range = box.querySelector('.xr-range');
  var capL = box.querySelector('.xr-cap.l'), capR = box.querySelector('.xr-cap.r');
  function set(p) {
    p = Math.max(0, Math.min(100, p)); box.style.setProperty('--x', p + '%'); range.value = p;
    // hide a line label when there is no room for it on its side
    var w = box.clientWidth, x = p / 100 * w;
    box.classList.toggle('cap-l', x < capL.offsetWidth + 20); box.classList.toggle('cap-r', w - x < capR.offsetWidth + 20);
  }

  // the countdown restarts when it runs out, like the real thing
  var left = 299, timers = box.querySelectorAll('.dp-timer');
  setInterval(function () {
    left = left > 0 ? left - 1 : 299;
    var t = String(Math.floor(left / 60)).padStart(2, '0') + ':' + String(left % 60).padStart(2, '0');
    timers.forEach(function (el) { el.textContent = t; });
  }, 1000);

  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var held = false, idleUntil = 0, seen = true, t0 = performance.now();
  function frame(now) {
    if (!held && seen && !still && now > idleUntil) set(50 + 38 * Math.sin((now - t0) / 2600));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }).observe(box);

  function at(e) { var r = box.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); }
  function pause() { idleUntil = performance.now() + 4000; }
  box.addEventListener('dragstart', function (e) { e.preventDefault(); });
  box.addEventListener('pointerdown', function (e) { held = true; box.setPointerCapture(e.pointerId); at(e); });
  box.addEventListener('pointermove', function (e) { if (held) at(e); });
  box.addEventListener('pointerup', function () { held = false; pause(); t0 = performance.now() - 2600 * Math.asin(Math.max(-1, Math.min(1, (range.value - 50) / 38))); });
  box.addEventListener('pointercancel', function () { held = false; pause(); });
  box.tabIndex = 0;
  box.addEventListener('keydown', function (e) {
    var d = e.key === 'ArrowRight' ? 5 : e.key === 'ArrowLeft' ? -5 : 0;
    if (d) { e.preventDefault(); pause(); set(+range.value + d); }
  });
})();
