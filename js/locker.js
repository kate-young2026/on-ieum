// 온-이음 · 교실 사물함 — 2027 수능 국어를 게임처럼: 사물함 · 풀이 · 정답 사물함 · 성취기준 매칭
(function (root) {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // 채점: items = [{no, answer, points}], marks = {no: 1..5}
  function score(items, marks) {
    var r = { correct: 0, wrong: [], unknown: [], blank: [], points: 0, maxPoints: 0, total: items.length };
    items.forEach(function (it) {
      var m = marks[it.no];
      if (it.answer == null) { r.unknown.push(it.no); return; }
      r.maxPoints += it.points || 0;
      if (m == null) { r.blank.push(it.no); return; }
      if (+m === +it.answer) { r.correct++; r.points += it.points || 0; } else r.wrong.push(it.no);
    });
    return r;
  }
  var API = { score: score };
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; return; }
  root.OnLocker = API;
  if (typeof document === 'undefined' || !document.getElementById('lockerApp')) return;

  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'onieum-locker';
  var S = (function () { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
  S.elective = S.elective || '언어와 매체'; S.form = S.form || 'odd'; S.opened = S.opened || {}; S.marks = S.marks || {}; S.key = S.key || {}; S.points = S.points || {}; S.map = S.map || {}; S.ok = S.ok || {};
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function toast(m) { var t = $('toast'); t.textContent = m; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 1800); }

  var DATA = null, IDX = null, CODES = null, mode = 'lockers', cur = null, answersOpen = false, timer = null, pdfUrl = null;
  var stdCache = {};

  function items() {
    var list = DATA.common.concat(DATA.elective[S.elective]);
    return list.map(function (it) {
      var k = S.elective + ':' + it.no, kc = it.no <= 34 ? 'c:' + it.no : k;
      return Object.assign({}, it, {
        key: kc,
        answer: S.key[kc] != null ? S.key[kc] : (it.answers ? it.answers[S.form] : it.answer),
        points: S.points[kc] != null ? S.points[kc] : it.points,
        standards: S.map[kc] || it.standards,
        confirmed: !!S.ok[kc]
      });
    });
  }
  function itemByNo(no) { return items().filter(function (x) { return x.no === no; })[0]; }

  function progress() {
    var list = items(), opened = list.filter(function (x) { return S.opened[x.key]; }).length;
    var marked = list.filter(function (x) { return S.marks[x.no] != null; }).length;
    var xp = opened * 10 + marked * 5;
    $('xpBar').style.width = Math.min(100, Math.round(opened / list.length * 100)) + '%';
    $('xpText').textContent = '연 사물함 ' + opened + '/' + list.length + ' · 마킹 ' + marked + ' · ' + xp + ' XP';
    var badges = [];
    ['독서', '문학'].forEach(function (sec) {
      var g = list.filter(function (x) { return x.section === sec; });
      if (g.length && g.every(function (x) { return S.opened[x.key]; })) badges.push(sec + ' 정복');
    });
    if (list.slice(34).every(function (x) { return S.opened[x.key]; })) badges.push(S.elective + ' 정복');
    $('badges').innerHTML = badges.map(function (b) { return '<span class="chip-s ember">' + esc(b) + '</span>'; }).join('') || '<span class="note-s">사물함을 모두 열면 배지를 받아요</span>';
  }

  function renderList() {
    var list = items(), groups = {};
    list.forEach(function (x) { (groups[x.section] = groups[x.section] || []).push(x); });
    $('itemList').innerHTML = Object.keys(groups).map(function (g) {
      return '<li class="grp">' + esc(g) + ' · ' + groups[g][0].no + '~' + groups[g][groups[g].length - 1].no + '번</li>' + groups[g].map(function (x) {
        return '<li><button data-no="' + x.no + '" class="' + (cur === x.no ? 'on' : '') + '">' + x.no + '번 <small>' + esc(x.standards.join(' ')) + (x.confirmed ? ' · 확정' : ' · 추정') + '</small></button></li>';
      }).join('');
    }).join('');
  }

  function renderMain() {
    document.querySelectorAll('[data-mode]').forEach(function (b) { b.classList.toggle('on', b.dataset.mode === mode); });
    var list = items(), html = '';
    if (mode === 'lockers') {
      html = '<div class="lockers">' + list.map(function (x) {
        var st = S.opened[x.key] ? 'open' : '', mk = S.marks[x.no] != null ? 'marked' : '';
        return '<button class="lk ' + st + ' ' + mk + ' sec-' + esc(x.section).replace(/\s/g, '') + (cur === x.no ? ' cur' : '') + '" data-no="' + x.no + '" aria-label="' + x.no + '번 사물함">' +
          '<span class="lk-no">' + x.no + '</span><span class="lk-sec">' + esc(x.section) + '</span><span class="lk-knob"></span></button>';
      }).join('') + '</div>';
    } else if (mode === 'solve') {
      html = '<div class="solve-top"><b id="clock">80:00</b><button class="btn-s pri" id="tStart">' + (timer ? '멈추기' : '시작') + '</button><button class="btn-s" id="tReset">다시</button><button class="btn-s" id="grade">채점하기</button><button class="btn-s" id="clearMarks">마킹 지우기</button></div>' +
        '<div class="omr">' + list.map(function (x) {
          return '<div class="omr-row' + (cur === x.no ? ' cur' : '') + '"><button class="omr-no" data-no="' + x.no + '">' + x.no + '</button>' + [1, 2, 3, 4, 5].map(function (n) {
            return '<button class="bub' + (+S.marks[x.no] === n ? ' on' : '') + '" data-mark="' + x.no + ':' + n + '" aria-label="' + x.no + '번 ' + n + '번">' + n + '</button>';
          }).join('') + '</div>';
        }).join('') + '</div><div id="result"></div>';
    } else if (mode === 'answers') {
      html = answersOpen
        ? '<div class="card-s"><h3>정답 사물함 · ' + (S.form === 'odd' ? '홀수형' : '짝수형') + '</h3><p class="note-s">' + esc(DATA.answerSource || '') + '. 고치면 이 브라우저에만 저장돼요.</p>' +
          '<table class="akey"><tr><th>번호</th><th>영역</th><th>정답</th><th>배점</th></tr>' + list.map(function (x) {
            return '<tr><td>' + x.no + '</td><td>' + esc(x.section) + '</td><td><select data-key="' + esc(x.key) + '"><option value="">확인 필요</option>' + [1, 2, 3, 4, 5].map(function (n) { return '<option' + (+x.answer === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></td>' +
              '<td><select data-pts="' + esc(x.key) + '"><option value="">-</option><option' + (x.points === 2 ? ' selected' : '') + '>2</option><option' + (x.points === 3 ? ' selected' : '') + '>3</option></select></td></tr>';
          }).join('') + '</table><div class="tabs" style="margin-top:10px"><button class="btn-s" id="lockAns">다시 잠그기</button><button class="btn-s" id="expKey">정답·매칭 내보내기</button><label class="btn-s">가져오기<input type="file" id="impKey" accept="application/json" hidden></label></div></div>'
        : '<div class="vault"><div class="vault-door"><span class="dial"></span></div><p>정답은 여기 따로 잠겨 있어요.<br>풀이를 마친 뒤에 열어 보세요.</p><button class="btn-s pri" id="openAns">정답 사물함 열기</button></div>';
    } else if (mode === 'pdf') {
      html = pdfUrl ? '<iframe class="pdf" src="' + pdfUrl + '" title="문제지 PDF"></iframe>' : '<div class="card-s"><h3>내 PC의 문제지 열기</h3><p class="note-s">평가원에서 받은 국어 문제지 PDF를 고르면 이 화면에서만 열려요. 서버로 올라가지 않아요.</p><label class="btn-s pri">PDF 고르기<input type="file" id="pdfPick" accept="application/pdf" hidden></label></div>';
    }
    $('mainBody').innerHTML = html;
    if (mode === 'solve') tick();
  }

  function loadStd(code) {
    var i = CODES[code]; if (i == null) return Promise.resolve(null);
    var f = IDX.courses[i].file;
    if (stdCache[f]) return Promise.resolve(stdCache[f].standards.filter(function (s) { return s.code === code; })[0]);
    return fetch('../data/standards/' + f.split('/').map(encodeURIComponent).join('/')).then(function (r) { return r.json(); }).then(function (d) { stdCache[f] = d; return d.standards.filter(function (s) { return s.code === code; })[0]; });
  }
  var CANDIDATE_FILES = ['sec/high_독서와_작문.json', 'sec/high_문학.json', 'sec/high_화법과_언어.json', 'sec/high_매체_의사소통.json', 'sec/high_공통국어1.json', 'sec/high_공통국어2.json'];
  function candidates() {
    return Promise.all(CANDIDATE_FILES.map(function (f) {
      if (stdCache[f]) return stdCache[f];
      return fetch('../data/standards/' + f.split('/').map(encodeURIComponent).join('/')).then(function (r) { return r.json(); }).then(function (d) { stdCache[f] = d; return d; });
    }));
  }

  function renderSide() {
    if (cur == null) { $('sideBody').innerHTML = '<p class="note-s">사물함을 누르면 문항 정보가 여기 열려요.</p>'; return; }
    var x = itemByNo(cur);
    var ans = answersOpen ? (x.answer != null ? '<b class="big">' + x.answer + '번</b>' : '<span class="chip-s ember">확인 필요</span>') : '<span class="muted">정답 사물함에서 확인</span>';
    $('sideTitle').textContent = x.no + '번 사물함';
    $('sideBody').innerHTML =
      '<div class="card-s"><p style="margin:0 0 6px"><span class="chip-s lock">' + esc(x.part || '선택 · ' + S.elective) + '</span><span class="chip-s oak">' + esc(x.section) + '</span>' + (x.points ? '<span class="chip-s">' + x.points + '점</span>' : '') + '</p>' +
      '<p class="note-s">정답: ' + ans + '</p>' +
      '<p class="note-s">내 마킹: ' + (S.marks[x.no] != null ? S.marks[x.no] + '번' : '없음') + '</p>' +
      '<p style="margin:8px 0 0"><a class="btn-s" href="' + esc(DATA.official) + '" target="_blank" rel="noopener">공식 문제지(평가원)</a> <button class="btn-s" data-mode-go="pdf">내 PDF로 보기</button></p></div>' +
      '<div class="card-s"><h3>성취기준 매칭 <small class="muted">' + (x.confirmed ? '선생님 확정' : '추정') + '</small></h3><div id="stdCards"><p class="note-s">불러오는 중…</p></div>' +
      '<label class="field" style="margin-top:8px"><span>성취기준 추가/바꾸기</span><select id="stdPick"><option value="">후보에서 고르기…</option></select></label>' +
      '<div class="tabs"><button class="btn-s ' + (x.confirmed ? 'on' : '') + '" id="confirmMap">' + (x.confirmed ? '확정됨' : '이 매칭 확정') + '</button><button class="btn-s" id="resetMap">추정으로 되돌리기</button></div>' +
      '<p class="note-s">2022 개정 교육과정 성취기준으로 매칭해요. 확정하면 교실 학습지 설계로 바로 이어져요.</p></div>';
    Promise.all(x.standards.map(loadStd)).then(function (stds) {
      $('stdCards').innerHTML = stds.map(function (s, i) {
        var code = x.standards[i];
        return '<div class="std-mini"><a href="classroom.html#' + encodeURIComponent(code) + '" title="교실에서 학습지 설계">' + esc(code) + '</a> <button class="btn-s" data-unmap="' + esc(code) + '">빼기</button><p>' + esc(s ? s.text : '데이터에서 찾지 못했어요') + '</p></div>';
      }).join('') || '<p class="note-s">매칭된 성취기준이 없어요.</p>';
    });
    candidates().then(function (cs) {
      var sel = $('stdPick'); if (!sel) return;
      sel.innerHTML = '<option value="">후보에서 고르기…</option>' + cs.map(function (c) {
        return '<optgroup label="' + esc(c.subject) + '">' + c.standards.map(function (s) {
          var tail = s.text.length > 46 ? '…' + s.text.slice(-44) : s.text;
          return '<option value="' + esc(s.code) + '">' + esc(s.code + ' ' + tail) + '</option>';
        }).join('') + '</optgroup>';
      }).join('');
    });
  }

  function select(no) {
    cur = no; var x = itemByNo(no);
    if (!S.opened[x.key]) { S.opened[x.key] = 1; save(); }
    renderList(); renderMain(); renderSide(); progress();
  }

  // 타이머
  function remaining() { var used = S.tUsed || 0; if (S.tStart) used += Date.now() - S.tStart; return Math.max(0, 80 * 60000 - used); }
  function tick() {
    var c = $('clock'); if (!c) return;
    var r = remaining(), m = Math.floor(r / 60000), s = Math.floor(r % 60000 / 1000);
    c.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    if (r === 0 && timer) { clearInterval(timer); timer = null; S.tUsed = 80 * 60000; S.tStart = null; save(); toast('시간이 끝났어요'); }
  }

  // 이벤트
  $('itemList').addEventListener('click', function (e) { var b = e.target.closest('[data-no]'); if (b) select(+b.dataset.no); });
  $('form').addEventListener('change', function () { S.form = this.value; save(); renderMain(); renderSide(); });
  $('elective').addEventListener('change', function () { S.elective = this.value; save(); cur = null; renderList(); renderMain(); renderSide(); progress(); });
  document.querySelectorAll('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { mode = b.dataset.mode; renderMain(); }); });
  $('mainBody').addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('.lk[data-no], .omr-no[data-no]'))) { select(+t.dataset.no); return; }
    if ((t = e.target.closest('[data-mark]'))) {
      var p = t.dataset.mark.split(':'), no = +p[0], n = +p[1];
      if (+S.marks[no] === n) delete S.marks[no]; else S.marks[no] = n;
      save(); cur = no; renderMain(); renderSide(); progress(); return;
    }
    if (e.target.id === 'tStart') {
      if (timer) { clearInterval(timer); timer = null; S.tUsed = (S.tUsed || 0) + (Date.now() - S.tStart); S.tStart = null; }
      else { S.tStart = Date.now(); timer = setInterval(tick, 1000); }
      save(); e.target.textContent = timer ? '멈추기' : '시작'; return;
    }
    if (e.target.id === 'tReset') { if (timer) clearInterval(timer); timer = null; S.tStart = null; S.tUsed = 0; save(); renderMain(); return; }
    if (e.target.id === 'clearMarks') { if (confirm('마킹을 모두 지울까요?')) { S.marks = {}; save(); renderMain(); progress(); } return; }
    if (e.target.id === 'grade') {
      var r = score(items(), S.marks);
      $('result').innerHTML = '<div class="card-s"><h3>채점 결과</h3>' +
        (r.unknown.length === r.total ? '<p>아직 정답이 하나도 확인되지 않았어요. 정답 사물함에서 공식 정답을 채운 뒤 채점하세요.</p>' :
          '<p><b class="big">' + r.correct + '</b> / ' + (r.total - r.unknown.length) + '문항' + (r.maxPoints ? ' · ' + r.points + '/' + r.maxPoints + '점' : '') + '</p>') +
        (r.wrong.length ? '<p class="note-s">틀린 문항(누르면 성취기준으로)</p>' + r.wrong.map(function (n) { return '<button class="chip-s ember" data-no-go="' + n + '">' + n + '번</button>'; }).join('') : '') +
        (r.unknown.length && r.unknown.length < r.total ? '<p class="note-s">정답 확인 필요: ' + r.unknown.join(', ') + '번</p>' : '') + '</div>';
      return;
    }
    if ((t = e.target.closest('[data-no-go]'))) { select(+t.dataset.noGo); return; }
    if (e.target.id === 'openAns') { answersOpen = true; renderMain(); renderSide(); return; }
    if (e.target.id === 'lockAns') { answersOpen = false; renderMain(); renderSide(); return; }
    if (e.target.id === 'expKey') {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify({ key: S.key, points: S.points, map: S.map, ok: S.ok }, null, 2)], { type: 'application/json' }));
      a.download = 'suneung-2027-korean-key.json'; a.click();
    }
  });
  $('mainBody').addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset.key) { if (t.value) S.key[t.dataset.key] = +t.value; else delete S.key[t.dataset.key]; save(); renderSide(); }
    if (t.dataset.pts) { if (t.value) S.points[t.dataset.pts] = +t.value; else delete S.points[t.dataset.pts]; save(); }
    if (t.id === 'impKey' && t.files[0]) t.files[0].text().then(function (s) { var d = JSON.parse(s); ['key', 'points', 'map', 'ok'].forEach(function (k) { if (d[k]) S[k] = d[k]; }); save(); renderMain(); renderList(); renderSide(); toast('가져왔어요'); }).catch(function () { toast('파일을 읽지 못했어요'); });
    if (t.id === 'pdfPick' && t.files[0]) { if (pdfUrl) URL.revokeObjectURL(pdfUrl); pdfUrl = URL.createObjectURL(t.files[0]); renderMain(); }
  });
  $('sideBody').addEventListener('click', function (e) {
    var t, x = itemByNo(cur);
    if ((t = e.target.closest('[data-mode-go]'))) { mode = t.dataset.modeGo; renderMain(); return; }
    if ((t = e.target.closest('[data-unmap]'))) { S.map[x.key] = x.standards.filter(function (c) { return c !== t.dataset.unmap; }); save(); renderSide(); renderList(); return; }
    if (e.target.id === 'confirmMap') { S.ok[x.key] = !S.ok[x.key]; if (!S.map[x.key]) S.map[x.key] = x.standards; save(); renderSide(); renderList(); return; }
    if (e.target.id === 'resetMap') { delete S.map[x.key]; delete S.ok[x.key]; save(); renderSide(); renderList(); }
  });
  $('sideBody').addEventListener('change', function (e) {
    if (e.target.id !== 'stdPick' || !e.target.value) return;
    var x = itemByNo(cur), list = (S.map[x.key] || x.standards).slice();
    if (list.indexOf(e.target.value) < 0) list.push(e.target.value);
    S.map[x.key] = list; save(); renderSide(); renderList();
  });

  Promise.all([
    fetch('../data/suneung-2027-korean.json').then(function (r) { return r.json(); }),
    fetch('../data/standards/index.json').then(function (r) { return r.json(); }),
    fetch('../data/standards/codes.json').then(function (r) { return r.json(); })
  ]).then(function (r) {
    DATA = r[0]; IDX = r[1]; CODES = r[2];
    $('elective').value = S.elective; $('form').value = S.form;
    $('dataNotes').innerHTML = DATA.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('');
    if (S.tStart) timer = setInterval(tick, 1000);
    renderList(); renderMain(); renderSide(); progress();
  }).catch(function () { $('mainBody').innerHTML = '<div class="card-s">데이터를 불러오지 못했어요. 웹 서버(또는 GitHub Pages)에서 열어 주세요.</div>'; });
})(typeof window !== 'undefined' ? window : this);
