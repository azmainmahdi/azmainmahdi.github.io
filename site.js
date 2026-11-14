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

  // accessibility menu: choices live on <html data-*>, set before paint by the inline head script
  var sysStill = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var opts = [
    ['motion', 'reduce', 'ti-player-pause', 'Reduce motion', sysStill ? 'On in your device settings' : 'Stop animations'],
    ['contrast', 'more', 'ti-contrast', 'High contrast', 'Darker text, firmer edges'],
    ['links', 'underline', 'ti-underline', 'Underline links', 'See every link at a glance'],
    ['font', 'readable', 'ti-typography', 'Readable font', 'Atkinson Hyperlegible'],
    ['spacing', 'wide', 'ti-line-height', 'Text spacing', 'More room between lines'],
    ['focus', 'strong', 'ti-focus-2', 'Bold focus', 'Clearer outline for keyboards']
  ];
  var sizes = [['', 'Default'], ['1', 'Large'], ['2', 'Larger']];
  if (btn) {
    var ab = document.createElement('button');
    ab.className = 'theme a11y-btn';
    ab.setAttribute('aria-label', 'Accessibility options');
    ab.title = 'Accessibility options';
    ab.setAttribute('popovertarget', 'a11y');
    ab.innerHTML = '<i class="ti ti-accessible" aria-hidden="true"></i>';
    btn.before(ab);
    var pop = document.createElement('div');
    pop.id = 'a11y'; pop.className = 'a11y'; pop.setAttribute('popover', '');
    pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-labelledby', 'a11y-h');
    pop.innerHTML = '<div class="a11y-top"><span class="a11y-mark" aria-hidden="true"><i class="ti ti-accessible"></i></span><h2 id="a11y-h">Accessibility</h2>' +
      '<button class="a11y-reset" type="button" hidden><i class="ti ti-refresh" aria-hidden="true"></i>Reset</button>' +
      '<button class="a11y-x" popovertarget="a11y" popovertargetaction="hide" aria-label="Close"><i class="ti ti-x" aria-hidden="true"></i></button></div>' +
      '<fieldset class="a11y-size"><legend>Text size</legend>' + sizes.map(function (s, i) {
        return '<label><input type="radio" name="a11y-size" value="' + s[0] + '"><span><b class="a11y-aa s' + i + '" aria-hidden="true">Aa</b>' + s[1] + '</span></label>';
      }).join('') + '</fieldset><div class="a11y-grid">' + opts.map(function (o) {
        return '<label class="a11y-tile"><input type="checkbox" role="switch" data-k="' + o[0] + '" data-v="' + o[1] + '">' +
          '<i class="ti ' + o[2] + '" aria-hidden="true"></i><span class="a11y-tick" aria-hidden="true"><i class="ti ti-check"></i></span><b>' + o[3] + '</b><small>' + o[4] + '</small></label>';
      }).join('') + '</div><p class="a11y-note">Starts from your device settings and stays saved in this browser.</p>';
    document.body.append(pop);
    var reset = pop.querySelector('.a11y-reset');

    var saved = {};
    try { saved = JSON.parse(localStorage.getItem('a11y') || '{}'); } catch (e) {}
    function save() { try { localStorage.setItem('a11y', JSON.stringify(saved)); } catch (e) {} }
    function sync() {
      pop.querySelectorAll('[name="a11y-size"]').forEach(function (r) { r.checked = r.value === (root.dataset.size || ''); });
      pop.querySelectorAll('[data-k]').forEach(function (c) {
        c.checked = root.dataset[c.dataset.k] === c.dataset.v;
        if (c.dataset.k === 'motion' && sysStill) { c.checked = true; c.disabled = true; }
      });
      reset.hidden = !Object.keys(saved).length;
    }
    pop.addEventListener('change', function (e) {
      var t = e.target, k = t.name === 'a11y-size' ? 'size' : t.dataset.k;
      // an explicit "off" is kept so it can beat the device setting (contrast)
      var v = t.type === 'radio' ? t.value : t.checked ? t.dataset.v : 'off';
      if (v) root.dataset[k] = saved[k] = v; else { delete root.dataset[k]; delete saved[k]; }
      save(); reset.hidden = !Object.keys(saved).length;
    });
    reset.addEventListener('click', function () {
      Object.keys(saved).forEach(function (k) { delete root.dataset[k]; });
      saved = {}; save();
      if (matchMedia('(prefers-contrast: more)').matches) root.dataset.contrast = 'more';
      sync(); pop.querySelector('[name="a11y-size"]').focus();
    });
    sync();
  }

  // phones: a menu button opens a sheet with the same links (clones, so desktop markup stays as is)
  var navEl = document.querySelector('nav'), linksEl = navEl && navEl.querySelector('.links');
  if (linksEl) {
    var mb = document.createElement('button');
    mb.className = 'menu-btn'; mb.type = 'button';
    mb.setAttribute('aria-label', 'Menu'); mb.setAttribute('aria-expanded', 'false'); mb.setAttribute('aria-controls', 'msheet');
    mb.innerHTML = '<i class="ti ti-menu-2" aria-hidden="true"></i>';
    linksEl.append(mb);
    var sheet = document.createElement('div');
    sheet.className = 'msheet'; sheet.id = 'msheet';
    linksEl.querySelectorAll(':scope > a').forEach(function (a) {
      var c = a.cloneNode(true); c.removeAttribute('data-spy'); c.removeAttribute('data-home');
      if (!c.hasAttribute('aria-current') && !a.hasAttribute('data-home')) c.classList.remove('on');
      c.insertAdjacentHTML('beforeend', '<i class="ti ti-chevron-right ms-go" aria-hidden="true"></i>');
      sheet.append(c);
    });
    var tools = document.createElement('div');
    tools.className = 'ms-tools';
    tools.innerHTML = '<button type="button" popovertarget="a11y"><i class="ti ti-accessible" aria-hidden="true"></i>Accessibility</button><button type="button" class="ms-theme"><i class="ti ti-moon" aria-hidden="true"></i>Dark mode</button>';
    sheet.append(tools);
    var mt = tools.querySelector('.ms-theme');
    var paintMt = function () { var d = current() === 'dark'; mt.innerHTML = '<i class="ti ti-' + (d ? 'sun' : 'moon') + '" aria-hidden="true"></i>' + (d ? 'Light mode' : 'Dark mode'); };
    mt.addEventListener('click', function () { if (btn) btn.click(); paintMt(); });
    paintMt();
    navEl.append(sheet);
    var setOpen = function (o) {
      navEl.classList.toggle('open', o); mb.setAttribute('aria-expanded', o);
      mb.innerHTML = '<i class="ti ti-' + (o ? 'x' : 'menu-2') + '" aria-hidden="true"></i>';
    };
    mb.addEventListener('click', function () { setOpen(!navEl.classList.contains('open')); });
    sheet.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && navEl.classList.contains('open')) { setOpen(false); mb.focus(); } });
    matchMedia('(min-width:861px)').addEventListener('change', function () { setOpen(false); });
  }

  // sideways photo strips: drag with a mouse (touch already scrolls natively)
  [].slice.call(document.querySelectorAll('.hb-strip')).forEach(function (st) {
    var x0 = 0, s0 = 0, down = false, moved = false;
    st.addEventListener('dragstart', function (e) { e.preventDefault(); });
    st.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button) return;
      down = true; moved = false; x0 = e.clientX; s0 = st.scrollLeft;
    });
    addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - x0;
      if (!moved && Math.abs(dx) > 4) { moved = true; st.classList.add('dragging'); }
      if (moved) st.scrollLeft = s0 - dx;
    });
    addEventListener('pointerup', function () { down = false; st.classList.remove('dragging'); });
  });

  // gameplay videos: no autoplay when motion is reduced; play only while on screen
  [].slice.call(document.querySelectorAll('.hb-vid')).forEach(function (v) {
    var still = matchMedia('(prefers-reduced-motion: reduce)').matches || root.dataset.motion === 'reduce';
    if (still) { v.removeAttribute('autoplay'); v.pause(); v.controls = true; return; }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting) v.play().catch(function () {}); else v.pause(); }).observe(v);
  });

  // gameplay video opens larger in a dialog
  var vbox = document.querySelector('.vbox');
  if (vbox && vbox.showModal) {
    var big = vbox.querySelector('video'), small = document.querySelector('.hb-vid');
    var open = function () { if (small) small.pause(); big.currentTime = small ? small.currentTime : 0; vbox.showModal(); big.play().catch(function () {}); };
    document.querySelectorAll('.hb-play, .hb-vid').forEach(function (el) { el.addEventListener('click', open); });
    vbox.querySelector('.vbox-x').addEventListener('click', function () { vbox.close(); });
    vbox.addEventListener('click', function (e) { if (e.target === vbox) vbox.close(); });
    vbox.addEventListener('close', function () { big.pause(); if (small && !small.controls) small.play().catch(function () {}); });
  }

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

  // Contact gets its pill once the reader scrolls (on home, once past the hero band)
  if (bar) {
    var lift = function () { bar.classList.toggle('lift', band ? band.getBoundingClientRect().bottom <= bar.offsetHeight + 1 : scrollY > 40); };
    addEventListener('scroll', lift, { passive: true }); lift();
  }

  // Day / Night switch on app screenshots: one picture per button
  [].slice.call(document.querySelectorAll('[data-shots]')).forEach(function (s) {
    var bs = s.querySelectorAll('.cs-tog button'), ims = s.querySelectorAll('.cs-win img');
    [].forEach.call(bs, function (b, i) {
      b.addEventListener('click', function () {
        [].forEach.call(bs, function (x, j) { x.setAttribute('aria-pressed', i === j); ims[j].hidden = i !== j; });
      });
    });
    // start on the picture that matches the site's theme, and follow the theme button
    var match = function () { var b = bs[current() === 'dark' ? 1 : 0]; if (b) b.click(); };
    match(); if (btn) btn.addEventListener('click', match);
  });

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

  // copy email, with a toast only when it worked
  function toast(msg) { var t = document.querySelector('.toast'); if (!t) return; t.querySelector('span').textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('on'); }, 1800); }
  [].slice.call(document.querySelectorAll('.copy')).forEach(function (b) {
    b.addEventListener('click', function () {
      var label = b.querySelector('span');
      (navigator.clipboard ? navigator.clipboard.writeText(b.dataset.copy) : Promise.reject())
        .then(function () { label.textContent = 'Copied'; toast('Email copied'); }, function () { label.textContent = 'Select and copy'; });
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
    if (!held && seen && !still && document.documentElement.dataset.motion !== 'reduce' && now > idleUntil) set(50 + 38 * Math.sin((now - t0) / 2600));
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
