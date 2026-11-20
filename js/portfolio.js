// 온-이음 · 서재 포트폴리오 — 메인비주얼 작업 목록 (이 브라우저에만 저장)
(function (root) {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var SINCE = '2025-08-01';

  // 메인비주얼 HTML에서 분류·제목·설명·링크·이미지를 뽑는다 (DOMParser가 있는 브라우저용)
  function parseMainVisual(html, DP) {
    var doc = new DP().parseFromString(html, 'text/html');
    var box = doc.querySelector('.slide_pc .main-box') || doc.querySelector('.main-box');
    if (!box) return null;
    var text = function (sel, el) { var n = (el || box).querySelector(sel); return n ? n.textContent.replace(/\s+/g, ' ').trim() : ''; };
    var strong = box.querySelector('strong');
    var mo = doc.querySelector('.slide_mo img.mo') || doc.querySelector('img');
    var vs = /main_visual(?:sub)?_(?:mob|mo|pc)-(\d+)/.exec(html);
    return {
      category: text('em'), title: strong ? strong.innerHTML.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '',
      desc: text('p'), link: (box.querySelector('a') || {}).getAttribute ? box.querySelector('a').getAttribute('href') : '',
      image: mo ? mo.getAttribute('src') : '', vsNo: vs ? vs[1] : '', html: html,
      subs: Array.prototype.map.call(doc.querySelectorAll('.slide_pc .sub-box'), function (s) { return { category: text('em', s), title: text('strong', s), link: (s.querySelector('a') || { getAttribute: function () { return ''; } }).getAttribute('href') }; })
    };
  }
  function parseCSV(s) {
    var rows = [], row = [], cur = '', q = false;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (q) { if (c === '"' && s[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
      else if (c === '"') q = true; else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += c;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    var head = rows.shift().map(function (h) { return h.trim(); });
    var alias = { '날짜': 'date', '게시일': 'date', '제목': 'title', '분류': 'category', '링크': 'link', '이미지': 'image', '설명': 'desc' };
    return rows.filter(function (r) { return r.join('').trim(); }).map(function (r) {
      var o = {}; head.forEach(function (h, i) { o[alias[h] || h] = (r[i] || '').trim(); }); return o;
    });
  }
  var PREVIEW = 'https://www.kdi.re.kr/sysMngr/main/visualPreview?vs_no=';
  var API = { parseCSV: parseCSV, parseMainVisual: parseMainVisual, SINCE: SINCE, PREVIEW: PREVIEW };
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; return; }
  if (typeof document === 'undefined' || !document.getElementById('pfApp')) return;

  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'onieum-portfolio', items = [], month = '';
  try { items = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} }
  function toast(m) { var t = $('toast'); t.textContent = m; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 1600); }
  function abs(u) { return !u ? '' : /^https?:/.test(u) ? u : 'https://www.kdi.re.kr' + (u.charAt(0) === '/' ? '' : '/') + u; }

  function render() {
    var q = $('q').value.trim();
    var list = items.filter(function (x) { return (x.date || '') >= SINCE; }).sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    var months = {};
    list.forEach(function (x) { var m = (x.date || '').slice(0, 7); months[m] = (months[m] || 0) + 1; });
    $('months').innerHTML = '<li><button data-m="" class="' + (month ? '' : 'on') + '">전체<small>' + list.length + '건</small></button></li>' +
      Object.keys(months).sort().reverse().map(function (m) { return '<li><button data-m="' + m + '" class="' + (m === month ? 'on' : '') + '">' + m.replace('-', '년 ') + '월<small>' + months[m] + '건</small></button></li>'; }).join('');
    var shown = list.filter(function (x) { return (!month || (x.date || '').slice(0, 7) === month) && (!q || ((x.title || '') + (x.category || '')).indexOf(q) >= 0); });
    $('mTitle').textContent = month ? month.replace('-', '년 ') + '월' : '전체';
    $('count').textContent = shown.length + '건';
    $('grid').innerHTML = shown.map(function (x, i) {
      return '<button class="pf-card" data-i="' + items.indexOf(x) + '"><div class="pf-img">' + (x.image ? '<img src="' + esc(abs(x.image)) + '" alt="" loading="lazy" onerror="this.remove()">' : '') + esc(x.category || '메인비주얼') + '</div>' +
        '<div class="t"><span class="note-s">' + esc(x.date) + ' · ' + esc(x.category || '') + '</span><b>' + esc(x.title || '(제목 없음)') + '</b></div></button>';
    }).join('') || '<div class="empty"><h3 style="font-family:var(--font-display);margin:0 0 6px">아직 작업이 없어요</h3><p class="note-s">오른쪽에서 메인비주얼 코드를 붙여 넣거나, CMS 목록 파일(JSON·CSV: 날짜, 제목, 분류, 링크, 이미지)을 가져오세요.</p></div>';
  }
  $('months').addEventListener('click', function (e) { var b = e.target.closest('[data-m]'); if (b) { month = b.dataset.m; render(); } });
  $('q').addEventListener('input', render);
  var detailW = 'pc';
  function cssLinks() { try { return (JSON.parse(localStorage.getItem('onieum-coding')) || {}).css || []; } catch (e) { return []; } }
  function showDetail(i) {
    var x = items[i]; if (!x) return;
    var links = cssLinks().map(function (u) { return '<link rel="stylesheet" href="' + esc(u) + '">'; }).join('');
    $('detail').hidden = false;
    $('dTitle').textContent = x.title || '(제목 없음)';
    $('dMeta').innerHTML = '<span class="chip-s oak">' + esc(x.date) + '</span>' + (x.category ? '<span class="chip-s">' + esc(x.category) + '</span>' : '') + (x.vsNo ? '<span class="chip-s lock">vs_no ' + esc(x.vsNo) + '</span>' : '');
    $('dLinks').innerHTML = (x.vsNo ? '<a class="btn-s" target="_blank" rel="noopener" href="' + PREVIEW + encodeURIComponent(x.vsNo) + '">CMS 미리보기 (로그인 필요)</a> ' : '') + (x.link ? '<a class="btn-s" target="_blank" rel="noopener" href="' + esc(abs(x.link)) + '">홈페이지 링크</a>' : '');
    if (x.html) {
      var cls = detailW === 'pc' ? '' : '';
      $('dFrame').hidden = false;
      $('dFrame').style.width = detailW === 'mo' ? '390px' : '100%';
      var extra = cssLinks();
      var doc = window.OnCoding ? window.OnCoding.previewDoc('mainvisual', x.html, { css: extra }) : x.html;
      if (detailW === 'mo') doc = doc.replace('</head>', '<style>.slide_pc,img.pc{display:none!important}.slide_mo{display:block!important}</style></head>');
      $('dFrame').srcdoc = doc;
      if (window.OnCoding) window.OnCoding.fitFrame($('dFrame'), detailW === 'pc');
      if (detailW === 'mo') $('dFrame').style.cssText = 'border:0;width:390px;height:560px;background:#fff';
    } else { $('dFrame').hidden = true; }
    $('dDel').dataset.i = i;
  }
  $('grid').addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (b) showDetail(+b.dataset.i); });
  document.querySelectorAll('[data-dw]').forEach(function (b) { b.addEventListener('click', function () { detailW = b.dataset.dw; document.querySelectorAll('[data-dw]').forEach(function (x) { x.classList.toggle('on', x === b); }); showDetail(+$('dDel').dataset.i); }); });
  $('dDel').addEventListener('click', function () { var i = +this.dataset.i; if (confirm('이 작업을 목록에서 지울까요?')) { items.splice(i, 1); save(); $('detail').hidden = true; render(); } });
  $('addByNo').addEventListener('click', function () {
    var no = $('vsNo').value.trim(), d = $('vsDate').value, t = $('vsTitle').value.trim();
    if (!/^\d+$/.test(no) || !d) { toast('번호와 게시일을 넣어 주세요'); return; }
    items.push({ date: d, vsNo: no, title: t || ('메인비주얼 ' + no + '번'), category: '메인비주얼' }); save(); render(); toast('추가했어요');
  });
  $('addFromHtml').addEventListener('click', function () {
    var d = $('pDate').value, h = $('pasteBox').value.trim();
    if (!d || !h) { toast('게시일과 HTML을 넣어 주세요'); return; }
    var p = parseMainVisual(h, DOMParser);
    if (!p) { toast('main-box를 찾지 못했어요. 메인비주얼 코드인지 확인해 주세요'); return; }
    items.push(Object.assign({ date: d }, p)); save(); $('pasteBox').value = ''; render(); toast('추가했어요');
  });
  $('imp').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return;
    f.text().then(function (s) {
      var add = /\.csv$/i.test(f.name) ? parseCSV(s) : JSON.parse(s);
      if (!Array.isArray(add)) add = add.items || [];
      items = items.concat(add.filter(function (x) { return x && x.date; })); save(); render(); toast(add.length + '건 가져왔어요');
    }).catch(function () { toast('파일을 읽지 못했어요'); });
  });
  $('exp').addEventListener('click', function () {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' }));
    a.download = 'onieum-portfolio.json'; a.click();
  });
  render();
})(typeof window !== 'undefined' ? window : this);
