/* Verbatim copy of design-coach's zoom script (MohammedMoataz/ai-coach,
   plugins/design-coach/skills/artifact-style/references/skeleton.html, design-coach 1.0.3).
   The landing artifact inlines this same file (artifact/build.mjs). Diff it against the skeleton
   when design-coach releases; never edit it here. */
/* §zoom — one script, every .zoomable: the pan/zoom canvas a Markdown preview gives a diagram.
   The svg keeps its natural size on an absolutely positioned canvas; the canvas moves with a
   translate+scale transform inside a clipped viewport of fixed height, so nothing scrolls and
   the page never reflows. Wheel pans, ctrl/⌘+wheel zooms around the pointer, drag pans, two
   fingers pinch, double-click toggles fit and 100%, arrows/+/−/0/f from the keyboard. A
   host-rendered mermaid svg arrives later and is adopted when it appears; a re-rendered one
   (theme change, late font) is re-sized and, if untouched, re-fitted. */
(function () {
  var MIN = 0.15, MAX = 6, STEP = 1.25;
  function naturalSize(svg) {
    var vb = svg.viewBox && svg.viewBox.baseVal;
    var w = parseFloat(svg.style.maxWidth);
    if (!(w > 0)) w = parseFloat(svg.getAttribute('width'));
    if (!(w > 0)) w = (vb && vb.width > 0) ? vb.width : 900;
    var h = (vb && vb.width > 0 && vb.height > 0) ? w * vb.height / vb.width : (parseFloat(svg.getAttribute('height')) || w * 0.6);
    return { w: w, h: h };
  }
  function adopt(fig, svg) {
    var S = fig.__zoom, stage = fig.querySelector('.zoom-stage');
    S.base = naturalSize(svg);
    svg.removeAttribute('width'); svg.removeAttribute('height');
    svg.style.maxWidth = 'none'; svg.style.height = 'auto'; svg.style.display = 'block'; svg.style.margin = '0';
    svg.style.width = S.base.w + 'px';
    stage.style.width = S.base.w + 'px'; stage.style.height = S.base.h + 'px';
    svg.dataset.zoomReady = '1';
  }
  function setup(fig) {
    var vp = fig.querySelector('.zoom-viewport'), stage = fig.querySelector('.zoom-stage');
    var svg = stage && stage.querySelector('svg');
    if (!vp || !svg) return;
    if (fig.__zoom) { if (!svg.dataset.zoomReady) { adopt(fig, svg); if (fig.__zoom.touched || !fig.__zoom.fit()) fig.__zoom.apply(); } return; }
    var S = fig.__zoom = { z: 1, tx: 16, ty: 44, touched: false, base: { w: 900, h: 540 } };
    var label = fig.querySelector('[data-zoom="reset"]');
    var clampZ = function (v) { return Math.min(MAX, Math.max(MIN, v)); };
    S.apply = function () {
      stage.style.transform = 'translate(' + S.tx.toFixed(1) + 'px,' + S.ty.toFixed(1) + 'px) scale(' + S.z.toFixed(4) + ')';
      if (label) label.textContent = Math.round(S.z * 100) + '%';
    };
    function zoomAt(nz, px, py) { nz = clampZ(nz); S.tx = px - (px - S.tx) * (nz / S.z); S.ty = py - (py - S.ty) * (nz / S.z); S.z = nz; S.apply(); }
    function fit() {
      var W = vp.clientWidth, H = vp.clientHeight;
      if (W < 60 || H < 60) return false;
      S.z = clampZ(Math.min(1, (W - 32) / S.base.w, (H - 64) / S.base.h));
      S.tx = Math.max(16, (W - S.base.w * S.z) / 2);
      S.ty = Math.max(44, (H - S.base.h * S.z) / 2);
      S.apply(); return true;
    }
    function reset() { S.z = 1; S.tx = 16; S.ty = 44; S.apply(); }
    S.fit = fit;
    adopt(fig, svg);
    fig.addEventListener('click', function (e) {
      var b = e.target.closest('[data-zoom]'); if (!b) return;
      S.touched = true;
      var k = b.getAttribute('data-zoom'), cx = vp.clientWidth / 2, cy = vp.clientHeight / 2;
      if (k === 'in') zoomAt(S.z * STEP, cx, cy);
      else if (k === 'out') zoomAt(S.z / STEP, cx, cy);
      else if (k === 'reset') reset();
      else if (k === 'fit') fit();
      else if (k === 'full') document.fullscreenElement === fig ? document.exitFullscreen() : fig.requestFullscreen();
    });
    var full = fig.querySelector('[data-zoom="full"]');
    if (full && !document.fullscreenEnabled) full.hidden = true;
    fig.addEventListener('fullscreenchange', function () { requestAnimationFrame(fit); });
    vp.addEventListener('wheel', function (e) {
      e.preventDefault(); S.touched = true;
      var r = vp.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) zoomAt(S.z * (e.deltaY < 0 ? 1.1 : 1 / 1.1), e.clientX - r.left, e.clientY - r.top);
      else { S.tx -= e.deltaX; S.ty -= e.deltaY; S.apply(); }
    }, { passive: false });
    vp.addEventListener('dblclick', function (e) {
      if (e.target.closest('button')) return;
      S.touched = true;
      var r = vp.getBoundingClientRect();
      if (S.z < 0.99) zoomAt(1, e.clientX - r.left, e.clientY - r.top); else fit();
    });
    var pts = new Map(), drag = null, pinch = null;
    var dist = function (a, b) { return Math.hypot(a.x - b.x, a.y - b.y); };
    vp.addEventListener('pointerdown', function (e) {
      if ((e.button !== 0 && e.pointerType === 'mouse') || e.target.closest('button')) return;
      try { vp.setPointerCapture(e.pointerId); } catch (err) {}
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      var p = Array.from(pts.values());
      if (p.length === 1) { drag = { x: e.clientX, y: e.clientY, tx: S.tx, ty: S.ty }; vp.classList.add('dragging'); }
      else if (p.length === 2) { drag = null; pinch = { d: dist(p[0], p[1]), z: S.z }; }
    });
    vp.addEventListener('pointermove', function (e) {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      var p = Array.from(pts.values()); S.touched = true;
      if (pinch && p.length === 2) { var r = vp.getBoundingClientRect(); zoomAt(pinch.z * dist(p[0], p[1]) / pinch.d, (p[0].x + p[1].x) / 2 - r.left, (p[0].y + p[1].y) / 2 - r.top); }
      else if (drag) { S.tx = drag.tx + (e.clientX - drag.x); S.ty = drag.ty + (e.clientY - drag.y); S.apply(); }
    });
    function end(e) { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) { drag = null; vp.classList.remove('dragging'); } }
    vp.addEventListener('pointerup', end); vp.addEventListener('pointercancel', end);
    vp.addEventListener('keydown', function (e) {
      var step = 40, cx = vp.clientWidth / 2, cy = vp.clientHeight / 2, k = e.key;
      if (k === 'ArrowLeft') S.tx += step; else if (k === 'ArrowRight') S.tx -= step;
      else if (k === 'ArrowUp') S.ty += step; else if (k === 'ArrowDown') S.ty -= step;
      else if (k === '+' || k === '=') zoomAt(S.z * STEP, cx, cy);
      else if (k === '-' || k === '_') zoomAt(S.z / STEP, cx, cy);
      else if (k === '0') reset(); else if (k === 'f' || k === 'F') fit();
      else return;
      S.touched = true; S.apply(); e.preventDefault();
    });
    if (!fit()) S.apply();
    // A hidden tab or a not-yet-laid-out page gives the viewport no size; when it gets one, or the
    // reader drags the viewport's resize handle, an untouched diagram fits itself again.
    if (window.ResizeObserver) new ResizeObserver(function () { if (!S.touched) fit(); }).observe(vp);
  }
  // The host renders mermaid as soon as its script runs, usually before the page's web font has
  // arrived: every label is measured in the fallback face and then drawn in the real one, so words
  // spill past their boxes and onto each other. Once the fonts are ready, each host svg is rendered
  // once more with the host's own mermaid and settings and swapped in place (marked, so it is not
  // redone); one the host re-renders later, on a theme change, gets the same single pass.
  var fontsReady = false, seq = 0;
  function remeasure() {
    var m = window.mermaid;
    if (!fontsReady || !m || typeof m.render !== 'function') return;
    document.querySelectorAll('.zoomable pre.mermaid').forEach(function (pre) {
      var stage = pre.closest('.zoom-stage'), cur = stage && stage.querySelector('svg');
      if (!cur || cur.dataset.measured || pre.dataset.measuring) return;
      pre.dataset.measuring = '1';
      m.render('dc-mermaid-' + (seq++), pre.textContent).then(function (r) {
        var t = document.createElement('template'); t.innerHTML = r.svg;
        var fresh = t.content.querySelector('svg'), now = stage.querySelector('svg');
        delete pre.dataset.measuring;
        if (fresh && now) { fresh.dataset.measured = '1'; now.replaceWith(fresh); }
      }, function () { cur.dataset.measured = '1'; delete pre.dataset.measuring; });
    });
  }
  function scan() { document.querySelectorAll('.zoomable').forEach(setup); remeasure(); }
  scan();
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  if (document.fonts && document.fonts.ready) window.addEventListener('load', function () { document.fonts.ready.then(function () { fontsReady = true; remeasure(); }); });
})();