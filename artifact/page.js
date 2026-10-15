/* Tabs with a bare-token hash (#t-memory, or #s-recall for one skill), arrow-key navigation,
   and the call-map filter. Everything is in the HTML already; this only shows and hides. */
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function select(id, focus) {
    var found = false;
    tabs.forEach(function (t) {
      var on = t.dataset.tab === id;
      if (on) found = true;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var p = document.getElementById('p-' + t.dataset.tab);
      if (p) p.hidden = !on;
      if (on && focus) t.focus();
      if (on) t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
    return found;
  }
  function route() {
    var h = (location.hash || '').slice(1);
    if (!h) { select('overview'); return; }
    if (h.indexOf('t-') === 0 && select(h.slice(2))) { window.scrollTo(0, 0); return; }
    var el = document.getElementById(h);
    var panel = el && el.closest('.panel');
    if (panel) { select(panel.id.slice(2)); el.scrollIntoView({ block: 'start' }); }
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { history.replaceState(null, '', '#t-' + t.dataset.tab); select(t.dataset.tab); window.scrollTo(0, 0); });
    t.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
      if (n === null) return;
      e.preventDefault();
      var t2 = tabs[(n + tabs.length) % tabs.length];
      history.replaceState(null, '', '#t-' + t2.dataset.tab);
      select(t2.dataset.tab, true);
    });
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('role') === 'tab') return;
    e.preventDefault();
    history.replaceState(null, '', a.getAttribute('href'));
    route();
  });
  window.addEventListener('hashchange', route);
  route();

  var chips = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var rows = Array.prototype.slice.call(document.querySelectorAll('.callmap tbody tr'));
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      var k = c.dataset.filter;
      chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
      rows.forEach(function (r) { r.hidden = k !== 'all' && r.dataset.kinds.split(' ').indexOf(k) < 0; });
    });
  });
})();
