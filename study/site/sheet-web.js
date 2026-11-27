/* 사이트용 학습지 스크립트 — 부모 페이지(index.html)와 postMessage로 대화한다.
 * 모드: notes(필기 보기) / quiz(필기 자리 빈칸 채우기) / clean(깨끗한 원본)
 * 쪽:   both(펼침) / 1 / 2
 */
(function () {
  var SHEET = document.body.getAttribute('data-sheet') || location.pathname;
  var spread = document.querySelector('.spread');
  var pages = Array.prototype.slice.call(document.querySelectorAll('.pg'));
  var state = { mode: 'notes', page: 'both', zoom: 1 };
  var built = false, items = [];
  var MMPX = 96 / 25.4;

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  var A4 = document.body.classList.contains('a4');
  function fit() {
    var w = (A4 || state.page !== 'both' ? 210 : 420) * MMPX;
    document.documentElement.style.zoom = (window.innerWidth / w).toFixed(4);
    // 부모가 iframe 높이를 맞추도록 실제 세로/가로 비율을 알린다 (A4 여러 쪽 대응)
    parent.postMessage({ type: 'sheet-size', sheet: SHEET, ratio: spread.offsetHeight / spread.offsetWidth }, '*');
  }
  function applyPage() {
    if (A4) { fit(); return; }
    if (state.page === 'both') {
      spread.style.width = '420mm'; spread.style.gridTemplateColumns = '210mm 210mm';
      pages.forEach(function (p) { p.style.display = ''; });
    } else {
      spread.style.width = '210mm'; spread.style.gridTemplateColumns = '210mm';
      pages.forEach(function (p, i) { p.style.display = String(i + 1) === state.page ? '' : 'none'; });
    }
    fit();
  }

  function norm(s) { return (s || '').replace(/[\s#()\[\]{}·,.\/→←↔=!?'"‘’“”~\-:;…<>*★✔]/g, '').toLowerCase(); }
  function textOf(el) { return el.classList.contains('ov') ? el.getAttribute('data-o') || '' : el.textContent; }

  function build() {
    if (built) return; built = true;
    var els = document.querySelectorAll('.n, .lm, .fill, .ov');
    var idx = 0;
    els.forEach(function (el) {
      if (el.closest('.legend')) return;
      if (el.parentElement && el.parentElement.closest('.n, .fill')) return;   // 바깥 필기 하나로 처리
      var ans = textOf(el).trim();
      if (!/[가-힣A-Za-z0-9ㄱ-ㅎ○×]/.test(ans)) return;
      var key = 'blank:' + SHEET + ':' + (idx++);
      var isOv = el.classList.contains('ov');
      var short = norm(ans).length <= 14 && !el.querySelector('s, .bx, .ci');
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      var item = { el: el, ans: ans, key: key, ok: false, input: null, cover: null, ov: isOv };
      if (short) {
        var inp = document.createElement('input');
        inp.className = 'qin' + (isOv ? ' qin-ov' : '');
        inp.setAttribute('aria-label', '필기 빈칸');
        inp.autocomplete = 'off';
        if (isOv) inp.style.width = Math.max(3, ans.length * 0.75 + 1.2) + 'em';
        var saved = store(key); if (saved) inp.value = saved;
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { check(item, true); inp.blur(); } });
        inp.addEventListener('change', function () { store(key, inp.value); check(item, true); });
        item.input = inp; el.appendChild(inp);
        if (saved) check(item, false);
      } else {
        var cv = document.createElement('button');
        cv.type = 'button'; cv.className = 'qcover' + (isOv ? ' qcover-ov' : '');
        cv.textContent = '눌러서 확인';
        if (isOv) cv.style.width = Math.max(3, ans.length * 0.7 + 1) + 'em';
        cv.addEventListener('click', function () { item.el.classList.add('qrev'); cv.remove(); report(); });
        item.cover = cv; el.appendChild(cv);
      }
      items.push(item);
    });
  }

  function check(item, rep) {
    var v = norm(item.input.value), a = norm(item.ans);
    item.ok = v.length > 0 && (v === a || (a.length > 3 && v.length >= a.length * 0.8 && a.indexOf(v) >= 0));
    item.input.classList.toggle('ok', item.ok);
    item.input.classList.toggle('bad', !!v && !item.ok);
    if (rep) report();
  }
  function report() {
    var total = 0, ok = 0, covers = 0, opened = 0;
    items.forEach(function (it) {
      if (it.input) { total++; if (it.ok) ok++; } else { covers++; if (it.el.classList.contains('qrev')) opened++; }
    });
    parent.postMessage({ type: 'sheet-score', sheet: SHEET, ok: ok, total: total, covers: covers, opened: opened }, '*');
  }
  function reveal() {
    items.forEach(function (it) {
      if (it.input && !it.ok) { it.input.classList.add('shown'); it.input.value = it.ans; it.input.classList.remove('bad'); }
      if (it.cover) { it.el.classList.add('qrev'); it.cover.remove(); }
    });
  }
  function reset() {
    items.forEach(function (it) {
      if (it.input) { it.input.value = ''; it.ok = false; it.input.className = 'qin' + (it.ov ? ' qin-ov' : ''); store(it.key, ''); }
      if (it.el.classList.contains('qrev')) { it.el.classList.remove('qrev'); if (it.cover) it.el.appendChild(it.cover); }
    });
    report();
  }

  function setMode(m) {
    state.mode = m;
    document.body.classList.toggle('mode-blank', m === 'clean');
    document.body.classList.toggle('mode-quiz', m === 'quiz');
    if (m === 'quiz') { build(); report(); }
  }

  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.cmd === 'mode') setMode(d.mode);
    if (d.cmd === 'page') { state.page = d.page; applyPage(); }
    if (d.cmd === 'reveal') { reveal(); report(); }
    if (d.cmd === 'reset') reset();
  });
  window.addEventListener('resize', fit);
  applyPage();
  parent.postMessage({ type: 'sheet-ready', sheet: SHEET }, '*');
})();
