// 온-이음 · 교실 — 성취기준 선택 → 설명·지표 → 학습목표 → 학습지/활동지/게임/프로젝트 설계
(function (root) {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // ---- 문장 틀 (키 없이 동작) ----
  var JONG_N = 4, JONG_L = 8;
  function swapJong(ch, to) { var c = ch.charCodeAt(0) - 0xAC00; if (c < 0 || c > 11171) return null; return String.fromCharCode(0xAC00 + c - (c % 28) + to); }
  function jong(ch) { var c = ch.charCodeAt(0) - 0xAC00; return c < 0 || c > 11171 ? -1 : c % 28; }
  // "~한다." → "~할 수 있다." 처럼 성취기준 문장을 학습목표 문장으로 바꾼다
  function toCan(sentence) {
    var s = String(sentence).trim().replace(/[.。]$/, '');
    var SPECIAL = { '듣는다': '들을', '갖는다': '가질', '묻는다': '물을', '걷는다': '걸을' };
    for (var k in SPECIAL) if (s.slice(-k.length) === k) return s.slice(0, -k.length) + SPECIAL[k] + ' 수 있다.';
    if (/는다$/.test(s)) return s.replace(/는다$/, '을 수 있다.');
    if (/다$/.test(s) && s.length >= 2) {
      var prev = s.charAt(s.length - 2);
      if (jong(prev) === JONG_N) return s.slice(0, -2) + swapJong(prev, JONG_L) + ' 수 있다.';
      if (/지닌다$|가진다$/.test(s)) return s;
    }
    return /수 있다$/.test(s) ? s + '.' : s + '.';
  }
  function focusOf(t) { var i = (t || '').lastIndexOf(' - '); return i > 0 ? t.slice(i + 3) : t; }
  function objectives(std) {
    var out = [toCan(std.text)];
    (std.topics || []).slice(0, 2).forEach(function (tp) {
      out.push('「' + focusOf(tp.t) + '」의 핵심 조건을 자기 말로 설명하고 실제 자료에 적용할 수 있다.');
    });
    return out;
  }
  function indicators(std) {
    var ev = [], ap = [];
    (std.topics || []).forEach(function (t) { (t.ev || []).forEach(function (x) { if (ev.indexOf(x) < 0) ev.push(x); }); (t.ap || []).forEach(function (x) { if (ap.indexOf(x) < 0) ap.push(x); }); });
    return { ev: ev, ap: ap };
  }

  var KIND = {
    sheet: '학습지', activity: '활동지', game: '게임(방탈출)', project: '토의·프로젝트'
  };
  function head(std, title, objs) {
    return '<header class="ws-h"><p class="ws-k">' + esc(KIND[title] || title) + '</p><h1>' + esc(std.domain || '') + ' · ' + esc(std.code) + '</h1>' +
      '<table class="ws-id"><tr><td>학년·반</td><td></td><td>번호</td><td></td><td>이름</td><td></td></tr></table></header>' +
      '<section><h2>성취기준</h2><p class="std">' + esc(std.code) + ' ' + esc(std.text) + '</p></section>' +
      '<section><h2>학습목표</h2><ol>' + objs.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') + '</ol></section>';
  }
  function draft(kind, std, objs) {
    var ind = indicators(std), ev = ind.ev.slice(0, 4), ap = ind.ap.slice(0, 3), b = head(std, kind, objs);
    var line = '<div class="ans"></div>';
    if (kind === 'sheet') {
      b += '<section><h2>1. 생각 열기</h2><p>' + esc(ap[0] || '오늘 배울 내용과 관련된 경험을 떠올려 써 봅시다.') + '</p>' + line + '</section>';
      b += '<section><h2>2. 개념 익히기</h2><ol>' + ev.map(function (e) { return '<li>' + esc(e) + line + '</li>'; }).join('') + '</ol></section>';
      b += '<section><h2>3. 적용하기</h2><p>' + esc(ap[1] || ap[0] || '배운 내용을 새로운 자료에 적용해 봅시다.') + '</p>' + line + line + '</section>';
      b += '<section><h2>4. 스스로 점검</h2><table class="chk"><tr><th>점검 내용</th><th>잘함</th><th>보통</th><th>노력</th></tr>' +
        objs.map(function (o) { return '<tr><td>' + esc(o) + '</td><td></td><td></td><td></td></tr>'; }).join('') + '</table></section>';
    } else if (kind === 'activity') {
      b += '<section><h2>모둠 역할</h2><table class="chk"><tr><th>이끔이</th><th>기록이</th><th>자료이</th><th>발표이</th></tr><tr><td></td><td></td><td></td><td></td></tr></table></section>';
      var steps = ['탐색: 자료를 읽고 핵심 단서를 찾기', '수행: 과제를 함께 해결하기', '공유: 모둠 결과를 발표하고 질문 주고받기', '성찰: 배운 점과 더 알고 싶은 점 쓰기'];
      b += '<section><h2>활동 순서</h2><ol>' + steps.map(function (s, i) { return '<li><b>' + esc(s) + '</b>' + (ev[i] ? '<p class="mut">' + esc(ev[i]) + '</p>' : '') + line + '</li>'; }).join('') + '</ol></section>';
      b += '<section><h2>평가 질문</h2><p>' + esc(ap[0] || '') + '</p></section>';
    } else if (kind === 'game') {
      var rooms = (ev.length ? ev : [std.text]).slice(0, 3);
      b += '<section><h2>방탈출 규칙</h2><p>방마다 미션을 해결하면 자물쇠 번호 한 자리를 얻어요. 세 자리를 모두 모으면 탈출!</p></section>';
      b += rooms.map(function (e, i) {
        return '<section class="room"><h2>자물쇠 ' + (i + 1) + '번 방</h2><p><b>미션</b> ' + esc(e) + '</p><p class="mut">정답 조건(선생님이 채우기): ________ → 자물쇠 번호 [ ]</p>' + line + '</section>';
      }).join('');
      b += '<section><h2>마지막 문</h2><p>세 자리 번호: [ ][ ][ ] — ' + esc(ap[0] || '최종 질문에 답해야 문이 열려요.') + '</p></section>';
    } else {
      b += '<section><h2>탐구 질문</h2><p>' + esc(ap[0] || std.text) + '</p></section>';
      b += '<section><h2>진행 단계</h2><ol><li>질문 다듬기 · 역할 나누기</li><li>자료 조사와 근거 모으기</li><li>토의 또는 산출물 만들기</li><li>발표와 상호 피드백</li></ol></section>';
      b += '<section><h2>평가 기준(루브릭)</h2><table class="chk"><tr><th>기준</th><th>상</th><th>중</th><th>하</th></tr>' +
        (ev.slice(0, 3).length ? ev.slice(0, 3) : [std.text]).map(function (e) { return '<tr><td>' + esc(e) + '</td><td>근거를 들어 정확하고 충분히 수행</td><td>대체로 수행</td><td>도움을 받아 일부 수행</td></tr>'; }).join('') + '</table></section>';
    }
    b += '<footer class="src">성취기준 출처: 교육부·국가교육위원회 고시 교육과정(NCIC). 지표는 학습맵 MCP 데이터(MIT)의 세부 주제에서 가져왔으며 공식 산출물이 아닙니다.</footer>';
    return b;
  }
  var DOC_CSS = 'body{font-family:"Noto Sans KR",sans-serif;color:#2e2a25;max-width:760px;margin:24px auto;padding:0 20px;line-height:1.65}' +
    '.ws-k{color:#b5531f;font-weight:700;margin:0}h1{font-family:"Gowun Batang",serif;margin:4px 0 10px;font-size:22px}h2{font-size:16px;margin:18px 0 6px;border-left:4px solid #b5531f;padding-left:8px}' +
    'table{border-collapse:collapse;width:100%}td,th{border:1px solid #c9bfae;padding:6px 8px;font-size:13px;text-align:left}.ws-id td:nth-child(odd){background:#f1e6d0;width:60px}' +
    '.std{background:#faf6ee;border:1px solid #e3dacb;border-radius:8px;padding:8px 10px}.ans{border-bottom:1px dashed #b3a999;height:30px}.mut{color:#6b6258;font-size:13px;margin:2px 0}' +
    '.room{border:1px dashed #2e4a6b;border-radius:10px;padding:4px 12px 10px;margin:10px 0}.src{margin-top:24px;font-size:11px;color:#6b6258}[contenteditable]:focus{outline:2px solid #22717a}@media print{[contenteditable]{outline:none}}';
  function aiPrompt(kind, std, objs) {
    var ind = indicators(std);
    return '다음 성취기준으로 ' + (KIND[kind] || kind) + '를 만들어 주세요. 대상 학년군: ' + std.gb + '.\n' +
      '성취기준: ' + std.code + ' ' + std.text + '\n영역: ' + std.domain + '\n학습목표:\n' + objs.map(function (o, i) { return (i + 1) + '. ' + o; }).join('\n') +
      '\n성취 지표(관찰 증거):\n' + ind.ev.slice(0, 4).map(function (e) { return '- ' + e; }).join('\n') +
      '\n평가 질문 예:\n' + ind.ap.slice(0, 2).map(function (e) { return '- ' + e; }).join('\n') +
      '\n조건: 학생 실명·개인정보를 넣지 말 것, 성취기준 코드는 위 코드만 쓸 것, 확인하지 못한 사실은 [확인 필요]로 표시할 것.';
  }

  var API = { toCan: toCan, objectives: objectives, indicators: indicators, draft: draft, aiPrompt: aiPrompt, DOC_CSS: DOC_CSS };
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; return; }
  root.OnClass = API;
  if (typeof document === 'undefined' || !document.getElementById('classApp')) return;

  // ---- 화면 ----
  var $ = function (id) { return document.getElementById(id); };
  var BASE = '../data/standards/';
  var idx = null, codes = null, course = null, std = null, level = 'elem', kind = 'sheet', gbFilter = '';
  var cache = {};
  function toast(m) { var t = $('toast'); t.textContent = m; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 1600); }
  function getJSON(u) { if (cache[u]) return Promise.resolve(cache[u]); return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) { cache[u] = d; return d; }); }
  function encFile(f) { return f.split('/').map(encodeURIComponent).join('/'); }

  function renderCourses() {
    var list = idx.courses.map(function (c, i) { return Object.assign({ i: i }, c); }).filter(function (c) { return c.level === level; });
    var groups = {};
    list.forEach(function (c) { (groups[c.group || c.subject] = groups[c.group || c.subject] || []).push(c); });
    $('courseSel').innerHTML = Object.keys(groups).sort(function (a, b) { return a.localeCompare(b, 'ko'); }).map(function (g) {
      return '<optgroup label="' + esc(g) + '">' + groups[g].map(function (c) { return '<option value="' + c.i + '">' + esc(c.subject) + ' (' + c.count + ')</option>'; }).join('') + '</optgroup>';
    }).join('');
    var pref = list.filter(function (c) { return /국어/.test(c.subject); })[0] || list[0];
    $('courseSel').value = pref.i; return openCourse(pref.i);
  }
  function openCourse(i, thenCode) {
    var c = idx.courses[i];
    return getJSON(BASE + encFile(c.file)).then(function (d) {
      course = d; course.meta = c; gbFilter = '';
      var gbs = Array.from(new Set(d.standards.map(function (s) { return s.gb; }).filter(Boolean)));
      $('gbChips').innerHTML = gbs.length > 1 ? ['전체'].concat(gbs).map(function (g) { return '<button class="chip-s ' + (g === '전체' ? '' : 'oak') + '" data-gb="' + (g === '전체' ? '' : esc(g)) + '">' + esc(g === '전체' ? g : g + (level === 'elem' ? '학년' : '')) + '</button>'; }).join('') : '';
      renderStds();
      var first = thenCode ? d.standards.filter(function (s) { return s.code === thenCode; })[0] : d.standards[0];
      if (first) pick(first.code);
    });
  }
  function renderStds() {
    var q = $('stdSearch').value.trim(), dom = {};
    course.standards.forEach(function (s) {
      if (gbFilter && s.gb !== gbFilter) return;
      if (q && (s.code + s.text + s.domain).indexOf(q) < 0) return;
      (dom[s.domain || '영역'] = dom[s.domain || '영역'] || []).push(s);
    });
    $('stdList').innerHTML = Object.keys(dom).map(function (d) {
      return '<li class="grp">' + esc(d) + '</li>' + dom[d].map(function (s) {
        return '<li><button data-code="' + esc(s.code) + '" class="' + (std && std.code === s.code ? 'on' : '') + '">' + esc(s.code) + '<small>' + esc(s.text) + '</small></button></li>';
      }).join('');
    }).join('') || '<li class="note-s" style="padding:10px">찾는 성취기준이 없어요.</li>';
  }
  function chipsFor(codesArr, cls) {
    return (codesArr || []).map(function (c) { return '<button class="chip-s ' + cls + '" data-jump="' + esc(c) + '">' + esc(c) + '</button>'; }).join('');
  }
  function pick(code) {
    std = course.standards.filter(function (s) { return s.code === code; })[0]; if (!std) return;
    renderStds();
    var ind = indicators(std);
    $('stdTitle').textContent = std.code;
    $('stdMeta').innerHTML = '<span class="chip-s lock">' + esc(course.subject) + '</span><span class="chip-s oak">' + esc(std.gb) + (level === 'elem' ? '학년군' : '') + '</span><span class="chip-s garden">' + esc(std.domain) + '</span>';
    $('stdBody').innerHTML =
      '<div class="card-s"><h3>성취기준 설명</h3><p style="font-size:16px;line-height:1.8;margin:0">' + esc(std.text) + '</p>' +
      (std.textCheck ? '<p class="note-s">원문 추출이 불완전할 수 있어요. NCIC 원문과 대조해 주세요(확인 필요).</p>' : '') + '</div>' +
      '<div class="card-s"><h3>성취 지표 <small class="muted">관찰할 수 있는 증거</small></h3><ol style="margin:0;padding-left:20px">' + (ind.ev.map(function (e) { return '<li style="margin:4px 0">' + esc(e) + '</li>'; }).join('') || '<li class="muted">지표 데이터가 없어요.</li>') + '</ol></div>' +
      '<div class="card-s"><h3>평가 질문 예</h3><ul style="margin:0;padding-left:20px">' + (ind.ap.slice(0, 4).map(function (e) { return '<li style="margin:4px 0">' + esc(e) + '</li>'; }).join('') || '<li class="muted">없음</li>') + '</ul></div>' +
      ((std.pre || std.next) ? '<div class="card-s"><h3>이어지는 성취기준</h3>' + (std.pre ? '<p class="note-s">먼저 배울 것</p>' + chipsFor(std.pre, 'oak') : '') + (std.next ? '<p class="note-s">이어서 배울 것(중→고)</p>' + chipsFor(std.next, 'garden') : '') + '</div>' : '') +
      '<div class="card-s"><h3>세부 주제</h3>' + (std.topics || []).map(function (t) { return '<span class="chip-s">' + esc(focusOf(t.t)) + '</span>'; }).join('') + '</div>';
    $('objText').value = objectives(std).join('\n');
    try { history.replaceState(null, '', '#' + encodeURIComponent(std.code)); } catch (e) {}
    buildDraft();
  }
  function buildDraft() {
    if (!std) return;
    var objs = $('objText').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var html = '<!doctype html><html lang="ko"><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@700&family=Noto+Sans+KR:wght@400;700&display=swap"><style>' + DOC_CSS + '</style></head><body><main contenteditable="true">' + draft(kind, std, objs) + '</main></body></html>';
    $('draft').srcdoc = html;
  }
  function jump(code) {
    var i = codes[code];
    if (i == null) { toast('이 코드를 데이터에서 찾지 못했어요'); return; }
    var c = idx.courses[i];
    if (c.level !== level) { level = c.level; document.querySelectorAll('[data-level]').forEach(function (b) { b.classList.toggle('on', b.dataset.level === level); }); renderCoursesOnly(); }
    $('courseSel').value = i; openCourse(i, code);
  }
  function renderCoursesOnly() {
    var list = idx.courses.map(function (c, i) { return Object.assign({ i: i }, c); }).filter(function (c) { return c.level === level; });
    var groups = {};
    list.forEach(function (c) { (groups[c.group || c.subject] = groups[c.group || c.subject] || []).push(c); });
    $('courseSel').innerHTML = Object.keys(groups).sort(function (a, b) { return a.localeCompare(b, 'ko'); }).map(function (g) {
      return '<optgroup label="' + esc(g) + '">' + groups[g].map(function (c) { return '<option value="' + c.i + '">' + esc(c.subject) + ' (' + c.count + ')</option>'; }).join('') + '</optgroup>';
    }).join('');
  }

  document.querySelectorAll('[data-level]').forEach(function (b) {
    b.addEventListener('click', function () { level = b.dataset.level; document.querySelectorAll('[data-level]').forEach(function (x) { x.classList.toggle('on', x === b); }); renderCourses(); });
  });
  $('courseSel').addEventListener('change', function () { openCourse(+this.value); });
  $('stdSearch').addEventListener('input', renderStds);
  $('gbChips').addEventListener('click', function (e) { var b = e.target.closest('[data-gb]'); if (!b) return; gbFilter = b.dataset.gb; renderStds(); });
  $('stdList').addEventListener('click', function (e) { var b = e.target.closest('[data-code]'); if (b) pick(b.dataset.code); });
  $('stdBody').addEventListener('click', function (e) { var b = e.target.closest('[data-jump]'); if (b) jump(b.dataset.jump); });
  $('objText').addEventListener('input', buildDraft);
  $('objReset').addEventListener('click', function () { if (std) { $('objText').value = objectives(std).join('\n'); buildDraft(); } });
  document.querySelectorAll('[data-kind]').forEach(function (b) {
    b.addEventListener('click', function () { kind = b.dataset.kind; document.querySelectorAll('[data-kind]').forEach(function (x) { x.classList.toggle('on', x === b); }); buildDraft(); });
  });
  $('printDraft').addEventListener('click', function () { $('draft').contentWindow.print(); });
  $('saveDraft').addEventListener('click', function () {
    var d = $('draft').contentDocument, html = '<!doctype html>' + d.documentElement.outerHTML.replace(' contenteditable="true"', '');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    a.download = std.code.replace(/[\[\]]/g, '') + '_' + KIND[kind] + '.html'; a.click();
  });
  $('aiCopy').addEventListener('click', function () {
    var objs = $('objText').value.split('\n').filter(Boolean);
    var t = aiPrompt(kind, std, objs);
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast('프롬프트를 복사했어요. Claude·Gemini에 붙여 넣으세요'); }, function () { prompt('복사해서 쓰세요', t); });
  });

  // ---- 단원 찾기 (성취기준 MCP 데이터로 만든 단원 색인, mcp/server.mjs와 같은 검색 규칙) ----
  function hl(text, words) {
    var h = esc(text);
    words.forEach(function (w) { if (w) h = h.split(esc(w)).join('<mark>' + esc(w) + '</mark>'); });
    return h;
  }
  function findUnit(q) {
    if (!q) return;
    $('stdTitle').textContent = '단원 찾기';
    $('stdMeta').innerHTML = '<span class="chip-s">' + esc(q) + '</span>';
    $('stdBody').innerHTML = '<div class="card-s">단원 색인을 불러오는 중…</div>';
    getJSON(BASE + 'units.json').then(function (d) {
      var r = root.OnUnits.findUnits(d.units, q, { limit: 12 });
      var lvName = { elem: '초등', middle: '중학교', high: '고등학교' };
      var head = '<p class="note-s" style="margin:0 0 8px">' + (r.level ? lvName[r.level] + (r.gradeBand ? ' ' + r.gradeBand + (r.level === 'elem' ? '학년군' : '') : '') + ' · ' : '') +
        '낱말 ' + r.words.map(function (w) { return '「' + esc(w) + '」'; }).join(' ') + ' → 단원 ' + r.total + '개' + (r.total > r.results.length ? ' 중 ' + r.results.length + '개' : '') + (r.partial ? ' (모든 낱말이 맞는 단원이 없어 일부만 맞는 단원)' : '') + '</p>';
      if (!r.results.length) { $('stdBody').innerHTML = head + '<div class="card-s">맞는 단원이 없어요. 낱말을 줄이거나 학년 표현(예: 3학년, 중2, 고1)을 바꿔 보세요.</div>'; return; }
      return Promise.all(r.results.map(function (u) { return getJSON(BASE + encFile(idx.courses[u.c].file)); })).then(function (files) {
        $('stdBody').innerHTML = head + r.results.map(function (u, i) {
          var byCode = {}; files[i].standards.forEach(function (s) { byCode[s.code] = s; });
          return '<div class="card-s unit-card"><h3>' + esc(u.u || u.d) + ' <small class="muted">' + esc(root.OnUnits.label(u)) + '</small></h3><ol>' +
            u.codes.map(function (c) {
              var s = byCode[c] || { code: c, text: '' }, hit = r.words.some(function (w) { return (c + s.text).indexOf(w) >= 0; });
              return '<li class="' + (hit ? 'hit' : '') + '"><button type="button" data-jump="' + esc(c) + '"><b>' + esc(c) + '</b>' + hl(s.text, r.words) + '</button></li>';
            }).join('') + '</ol></div>';
        }).join('');
      });
    }).catch(function () { $('stdBody').innerHTML = '<div class="card-s">단원 색인을 불러오지 못했어요.</div>'; });
  }
  $('unitForm').addEventListener('submit', function (e) { e.preventDefault(); findUnit($('unitQ').value.trim()); });

  Promise.all([getJSON(BASE + 'index.json'), getJSON(BASE + 'codes.json')]).then(function (r) {
    idx = r[0]; codes = r[1];
    $('totalInfo').textContent = '초등 ' + idx.total.elem + ' · 중등 ' + idx.total.sec + '개 성취기준';
    var h = decodeURIComponent(location.hash.slice(1) || '');
    if (h && codes[h] != null) { var c = idx.courses[codes[h]]; level = c.level; document.querySelectorAll('[data-level]').forEach(function (b) { b.classList.toggle('on', b.dataset.level === level); }); renderCoursesOnly(); $('courseSel').value = codes[h]; openCourse(codes[h], h); }
    else renderCourses();
  }).catch(function () { $('stdBody').innerHTML = '<div class="card-s">성취기준 데이터를 불러오지 못했어요. 웹 서버(또는 GitHub Pages)에서 열어 주세요.</div>'; });
})(typeof window !== 'undefined' ? window : this);
