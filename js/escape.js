// 온-이음 · 방탈출 — 문제를 풀어야 열리는 문. 국어·수학 예시 방, 방 만들기, 학생용 링크·HTML 파일 내보내기
(function (root) {
  'use strict';

  // ================= 순수 함수 (tests/escape.test.cjs) =================
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function norm(s) { return String(s == null ? '' : s).normalize('NFC').trim().toLowerCase().replace(/\s+/g, '').replace(/？/g, '?').replace(/！/g, '!').replace(/，/g, ','); }
  function fnv(s) { var h = 0x811c9dc5; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ('0000000' + h.toString(16)).slice(-8); }
  function rng(seed) { var a = (+seed >>> 0) || 1; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function int(r, lo, hi) { return lo + Math.floor(r() * (hi - lo + 1)); }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function lcm(a, b) { return a / gcd(a, b) * b; }
  function alts(a) { return String(a == null ? '' : a).split('|').map(function (x) { return x.trim(); }).filter(Boolean); }

  // 수학 자동 문제: 도전할 때마다 바뀜. std는 2022 개정 성취기준 코드(data/standards에 있음)
  var GEN = {
    times: { name: '곱셈구구', std: '[2수01-11]', make: function (r) { var a = int(r, 2, 9), b = int(r, 2, 9); return { title: '곱셈구구 자물쇠', q: a + ' × ' + b + ' = ?', answer: a * b, hint: a + '단을 차례로 외워 보세요: ' + a + ', ' + a * 2 + ', ' + a * 3 + ', …' }; } },
    mul31: { name: '(세 자리 수) × (한 자리 수)', std: '[4수01-04]', make: function (r) { var a = int(r, 112, 989), b = int(r, 3, 9); return { title: '세 자리 곱셈 자물쇠', q: a + ' × ' + b + ' = ?', answer: a * b, hint: '일의 자리부터 곱하고, 받아올림한 수를 잊지 마세요.' }; } },
    mul22: { name: '(두 자리 수) × (두 자리 수)', std: '[4수01-04]', make: function (r) { var a = int(r, 12, 98), b = int(r, 12, 49), t = b - b % 10; return { title: '두 자리 곱셈 자물쇠', q: a + ' × ' + b + ' = ?', answer: a * b, hint: a + ' × ' + (b % 10) + '와 ' + a + ' × ' + t + '를 따로 구해 더해 보세요.' }; } },
    fracSame: { name: '분모가 같은 분수의 덧셈', std: '[4수01-15]', make: function (r) { var d = int(r, 5, 12), a = int(r, 1, d - 2), b = int(r, 1, d - 1 - a); return { title: '분수 자물쇠', q: a + '/' + d + ' + ' + b + '/' + d + ' = □/' + d + '\n□에 들어갈 수는?', answer: a + b, hint: '분모가 같으면 분모는 그대로 두고 분자끼리 더해요.' }; } },
    gcd: { name: '최대공약수', std: '[6수01-04]', make: function (r) { var g = int(r, 2, 9), m = int(r, 2, 7), n = int(r, 2, 7); while (n === m || gcd(m, n) !== 1) n = int(r, 2, 7); return { title: '최대공약수 자물쇠', q: g * m + ', ' + g * n + '의 최대공약수는?', answer: g, hint: '두 수를 모두 나누어떨어지게 하는 수 가운데 가장 큰 수예요.' }; } },
    lcm: { name: '최소공배수', std: '[6수01-05]', make: function (r) { var a = int(r, 3, 12), b = int(r, 3, 12); while (b === a || a % b === 0 || b % a === 0) b = int(r, 3, 12); return { title: '최소공배수 자물쇠', q: a + ', ' + b + '의 최소공배수는?', answer: lcm(a, b), hint: '큰 수의 배수를 차례로 쓰면서 작은 수로 나누어떨어지는지 살펴보세요.' }; } },
    reduce: { name: '약분', std: '[6수01-06]', make: function (r) { var q = int(r, 3, 9), p = int(r, 1, q - 1), k = int(r, 2, 6); while (gcd(p, q) !== 1) p = int(r, 1, q - 1); return { title: '약분 자물쇠', q: p * k + '/' + q * k + ' = □/' + q + '\n□에 들어갈 수는?', answer: p, hint: '분모와 분자를 ' + k + '(으)로 나누어 보세요.' }; } },
    fracDiff: { name: '분모가 다른 분수의 덧셈', std: '[6수01-08]', make: function (r) { var m = int(r, 2, 6), n = int(r, 2, 6); while (n === m) n = int(r, 2, 6); var L = lcm(m, n), a = int(r, 1, m - 1), b = int(r, 1, n - 1); return { title: '통분 자물쇠', q: a + '/' + m + ' + ' + b + '/' + n + ' = □/' + L + '\n□에 들어갈 수는?', answer: a * L / m + b * L / n, hint: '두 분모를 ' + L + '(으)로 통분한 다음 분자끼리 더해 보세요.' }; } }
  };

  // 문 하나를 도전할 수 있는 모양으로: 자동 문제는 시드로 만들고, 열쇠 조각을 정함
  function realize(door, seed) {
    var d = Object.assign({}, door);
    if (d.gen && GEN[d.gen]) {
      var g = GEN[d.gen].make(rng(seed));
      d.type = 'number'; d.q = g.q; d.answer = String(g.answer); d.hint = d.hint || g.hint; d.title = d.title || g.title; d.std = d.std || GEN[d.gen].std;
    }
    if (d.key == null || d.key === '') d.key = keyOf(d);
    if (d.type === 'number' && !d.len) d.len = String(alts(d.answer)[0] || '0').length;
    return d;
  }
  function keyOf(d) {
    if (d.key != null && d.key !== '') return String(d.key);
    var a = alts(d.answer)[0] || '';
    if (d.type === 'number') return a.slice(-1);
    if (d.type === 'choice') return a;
    return Array.from(a)[0] || '';
  }
  function prepare(game, seed) {
    seed = seed == null ? 1 : seed;
    return Object.assign({}, game, { doors: (game.doors || []).map(function (d, i) { return realize(d, (seed + i * 7919) >>> 0); }) });
  }
  function check(door, input) {
    var v = norm(input); if (!v) return false;
    if (door.type === 'number') v = v.replace(/^0+(?=\d)/, '');
    if (door.ah) return door.ah.indexOf(fnv(door.salt + v)) >= 0;
    return alts(door.answer).some(function (a) { a = norm(a); if (door.type === 'number') a = a.replace(/^0+(?=\d)/, ''); return a === v; });
  }
  function finalCode(doors) { return doors.map(function (d) { return d.key; }).join(''); }
  function stars(st) { return st.hints === 0 && st.wrong <= 1 ? 3 : st.hints <= 2 && st.wrong <= 5 ? 2 : 1; }

  // 학생용: 정답을 지우고 해시만 남김(소스 보기로 바로 보이지 않게)
  function seal(game) {
    var g = JSON.parse(JSON.stringify(game));
    g.doors = g.doors.map(function (d, i) {
      if (d.gen) return d;
      var r = realize(d, 1), salt = (g.id || 'room') + ':' + i + ':';
      r.salt = salt;
      r.ah = alts(r.answer).map(function (a) { a = norm(a); if (r.type === 'number') a = a.replace(/^0+(?=\d)/, ''); return fnv(salt + a); });
      delete r.answer;
      return r;
    });
    g.sealed = true;
    return g;
  }
  function b64e(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64d(s) { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); }
  function encode(game) { return b64e(JSON.stringify(game)); }
  function decode(str) { var g = JSON.parse(b64d(str)); if (!g || !Array.isArray(g.doors)) throw new Error('방 데이터가 아니에요'); return g; }

  function validate(g) {
    var e = [];
    if (!String(g.title || '').trim()) e.push('방 이름을 적어 주세요.');
    if (!g.doors || !g.doors.length) e.push('문을 하나 이상 만들어 주세요.');
    (g.doors || []).forEach(function (d, i) {
      var n = '문 ' + (i + 1) + ': ';
      if (d.gen) { if (!GEN[d.gen]) e.push(n + '자동 문제 종류를 골라 주세요.'); return; }
      if (!String(d.q || '').trim()) e.push(n + '문제를 적어 주세요.');
      if (!alts(d.answer).length) e.push(n + '정답을 적어 주세요.');
      if (d.type === 'choice') {
        var c = (d.choices || []).filter(function (x) { return String(x).trim(); });
        if (c.length < 2) e.push(n + '보기를 두 개 이상 적어 주세요.');
        if (alts(d.answer).some(function (a) { return !/^\d+$/.test(a) || +a < 1 || +a > c.length; })) e.push(n + '객관식 정답은 보기 번호(1~' + Math.max(c.length, 1) + ')로 적어 주세요.');
      }
      if (d.type === 'number' && alts(d.answer).some(function (a) { return !/^\d{1,8}$/.test(a); })) e.push(n + '숫자 자물쇠 정답은 숫자만(8자리까지) 적어 주세요.');
    });
    return e;
  }

  // 문제 글 서식: 이스케이프한 뒤 "3/7", "□/12" 꼴만 분수 모양으로
  function fmt(s) { return esc(s).replace(/(\d+|□)\/(\d+|□)/g, '<span class="frac"><i>$1</i><i>$2</i></span>'); }

  // ================= 예시 방 =================
  var PRESETS = [
    {
      id: 'preset-library', preset: true, title: '잠긴 이야기 도서관', subject: '국어', target: '초등 5~6학년', minutes: 12,
      intro: '방과 후 학교 도서관에 들어가자 문이 철컥 잠겼어요!\n사서 선생님이 남긴 쪽지: "자물쇠 네 개를 풀고 열쇠 조각을 모으면 나갈 수 있단다."\n글을 꼼꼼히 읽고 탈출해 봅시다.',
      finalHint: '조각 네 개를 이으면 도서관이 가장 좋아하는 말이 돼요.',
      standards: ['[2국04-03]', '[4국02-02]', '[6국02-01]', '[6국05-02]'],
      doors: [
        { title: '문장 부호 자물쇠', type: 'word', std: '[2국04-03]', q: '빈칸에 들어갈 문장 부호를 자물쇠에 넣으세요.\n\n"우리 같이 도서관에 갈래□"', answer: '?', key: '책', hint: '친구에게 무엇을 묻는 문장이에요. 묻는 문장 끝에는 어떤 부호를 쓸까요?' },
        { title: '중심 문장 자물쇠', type: 'choice', std: '[4국02-02]', passage: '① 우리 동네 골목 끝에는 작은 책방이 있다. ② 책방 주인은 손님의 이야기를 듣고 어울리는 책을 한 권씩 골라 준다. ③ 책을 잘 읽지 않던 아이들도 이곳에서 고른 책은 끝까지 읽는다고 한다. ④ 이 작은 책방은 동네 사람들을 책과 가깝게 이어 주는 곳이다.', q: '이 문단의 중심 문장은 몇 번째 문장일까요?', choices: ['첫째 문장 ①', '둘째 문장 ②', '셋째 문장 ③', '넷째 문장 ④'], answer: '4', key: '을', hint: '나머지 문장들이 모두 뒷받침하는 문장을 찾아보세요. 중심 문장은 문단의 처음이나 끝에 자주 와요.' },
        { title: '주장 자물쇠', type: 'choice', std: '[6국02-01]', passage: '쉬는 시간이 끝나면 복도는 늘 붐빕니다. 지난달에는 계단에서 뛰다가 넘어져 다친 친구가 두 명이나 있었습니다. 복도에서 뛰면 나도 다치고 다른 사람도 다칠 수 있습니다. 그러므로 우리는 복도와 계단에서 오른쪽으로 천천히 걸어야 합니다.', q: '글쓴이의 주장으로 가장 알맞은 것은?', choices: ['쉬는 시간을 더 길게 늘려야 한다.', '복도와 계단에서는 오른쪽으로 천천히 걸어야 한다.', '지난달에 계단에서 두 명이 다쳤다.', '쉬는 시간이 끝나면 복도가 붐빈다.'], answer: '2', key: '펴', hint: '"그러므로", "~해야 한다"처럼 글쓴이의 생각을 드러내는 말을 찾아보세요. 나머지는 근거나 사실이에요.' },
        { title: '비유 자물쇠', type: 'choice', std: '[6국05-02]', q: '비유하는 표현이 쓰이지 않은 문장을 고르세요.', choices: ['내 동생의 볼은 잘 익은 사과 같다.', '선생님의 목소리는 봄바람이다.', '오늘 아침에는 비가 많이 내렸다.', '바람이 창문을 똑똑 두드렸다.'], answer: '3', key: '자', hint: '"~같다", "~이다"로 다른 것에 빗대었는지, 사람이 아닌 것을 사람처럼 나타냈는지 살펴보세요.' }
      ]
    },
    {
      id: 'preset-safe', preset: true, title: '곱셈 금고를 열어라', subject: '수학', target: '초등 3~4학년', minutes: 10,
      intro: '수학 탐정단이 오래된 금고 앞에 섰어요.\n문마다 계산 자물쇠가 달려 있고, 답의 일의 자리 숫자가 열쇠 조각이에요.\n조각 네 개로 금고 비밀번호를 맞혀 보세요. (문제는 도전할 때마다 바뀌어요.)',
      finalHint: '조각을 문 순서대로 이으면 금고 비밀번호예요.',
      standards: ['[2수01-11]', '[4수01-04]', '[4수01-15]'],
      doors: [{ gen: 'times' }, { gen: 'mul31' }, { gen: 'mul22' }, { gen: 'fracSame' }]
    },
    {
      id: 'preset-lab', preset: true, title: '분수 실험실 탈출', subject: '수학', target: '초등 5~6학년', minutes: 12,
      intro: '실험실 문이 잠겼어요! 벽에는 약수·배수·분수 자물쇠 네 개가 걸려 있어요.\n답의 일의 자리 숫자를 모아 실험실 비밀번호를 찾아보세요. (문제는 도전할 때마다 바뀌어요.)',
      finalHint: '문 1부터 문 4까지 순서대로 조각을 이어요.',
      standards: ['[6수01-04]', '[6수01-05]', '[6수01-06]', '[6수01-08]'],
      doors: [{ gen: 'gcd' }, { gen: 'lcm' }, { gen: 'reduce' }, { gen: 'fracDiff' }]
    }
  ];

  // 성취기준으로 방 시작: 수학 코드면 맞는 자동 문제를, 아니면 빈 객관식 문을 넣음
  function roomFromStandard(code, text, subject) {
    var gens = Object.keys(GEN).filter(function (k) { return GEN[k].std === code; });
    var doors = gens.length ? gens.map(function (k) { return { gen: k }; }) : [{ type: 'choice', std: code, title: '자물쇠 1', q: '', choices: ['', '', '', ''], answer: '', hint: '' }];
    return { id: 'room-' + Date.now().toString(36), title: (subject ? subject + ' ' : '') + code + ' 방탈출', subject: subject || '', target: '', minutes: 10, intro: text ? '오늘 배울 것: ' + text : '', finalHint: '', standards: [code], doors: doors };
  }

  // AI에게 문제를 맡기는 프롬프트(붙여 넣으면 그대로 가져오기)
  function aiPrompt(g, stds) {
    var lines = (g.standards || []).map(function (c) { var s = stds && stds[c]; return '- ' + c + (s ? ' ' + s : ''); });
    return [
      '초등·중등 수업용 방탈출 게임의 문제를 만들어 주세요.',
      '방 이름: ' + (g.title || '') + ' / 대상: ' + (g.target || '(적어 주세요)') + ' / 과목: ' + (g.subject || ''),
      '성취기준:', lines.join('\n') || '- (없음)',
      '',
      '조건',
      '- 문 4개. 쉬운 문제에서 어려운 문제 순서로. 성취기준마다 적어도 한 문제.',
      '- 지문은 직접 새로 써 주세요(교과서·기출 지문을 옮기지 않기). 5문장 이내.',
      '- type은 choice(보기 4개, answer는 정답 번호), number(answer는 숫자만), word(answer는 짧은 낱말, 여러 개 인정이면 "|"로 구분) 중 하나.',
      '- key는 열쇠 조각 한 글자. 네 조각을 이으면 짧은 응원 문구가 되게.',
      '- hint는 정답을 말하지 않고 생각할 방향만.',
      '',
      '아래 JSON 배열만 답해 주세요(설명 없이):',
      '[{"title":"","type":"choice","std":"성취기준 코드","passage":"","q":"","choices":["","","",""],"answer":"1","key":"","hint":""}]'
    ].join('\n');
  }
  function parseDoors(text) {
    var t = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    var s = t.indexOf('['), o = t.indexOf('{');
    var j = JSON.parse(s >= 0 && (o < 0 || s < o) ? t.slice(s, t.lastIndexOf(']') + 1) : t.slice(o, t.lastIndexOf('}') + 1));
    var arr = Array.isArray(j) ? j : j.doors;
    if (!Array.isArray(arr)) throw new Error('문 목록이 없어요');
    return arr.map(function (d) {
      var type = ['choice', 'number', 'word'].indexOf(d.type) >= 0 ? d.type : (Array.isArray(d.choices) && d.choices.length ? 'choice' : 'word');
      return { title: String(d.title || ''), type: type, std: String(d.std || ''), passage: String(d.passage || ''), q: String(d.q || d.question || ''), choices: type === 'choice' ? (d.choices || []).map(String) : undefined, answer: String(d.answer == null ? '' : d.answer), key: String(d.key || ''), hint: String(d.hint || '') };
    });
  }

  var API = { norm: norm, fnv: fnv, rng: rng, gcd: gcd, lcm: lcm, GEN: GEN, realize: realize, prepare: prepare, check: check, keyOf: keyOf, finalCode: finalCode, stars: stars, seal: seal, encode: encode, decode: decode, validate: validate, fmt: fmt, PRESETS: PRESETS, roomFromStandard: roomFromStandard, aiPrompt: aiPrompt, parseDoors: parseDoors };
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; return; }
  root.OnEscape = API;
  if (typeof document === 'undefined') return;

  // ================= 화면 =================
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'onieum-escape';
  var S = (function () { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
  S.mine = S.mine || []; S.best = S.best || {};
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function toast(m) { var t = $('toast'); if (!t) return; t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('show'); }, 2200); }
  function mmss(sec) { var s = Math.abs(Math.round(sec)); return (sec < 0 ? '+' : '') + Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function circled(n) { return '①②③④⑤⑥⑦⑧⑨⑩'.charAt(n - 1) || n; }
  function stageEl() { return $('stage'); }

  var solo = null;   // 학생 화면용 방(링크·HTML 파일)
  var game = null, mode = 'play', P = null, clockT = null;

  // ---------- 도전하기 ----------
  function startPlay(g) {
    clearInterval(clockT);
    P = { g: prepare(g, (Date.now() ^ (Math.random() * 1e9)) >>> 0), step: 'intro', i: 0, start: 0, penalty: 0, hints: 0, wrong: 0, shown: {}, sel: null, wheels: [], wcur: 0, order: [], peek: false };
    renderPlay();
  }
  function elapsed() { return P.start ? (Date.now() - P.start) / 1000 + P.penalty : 0; }
  function tick() {
    var c = $('escClock'); if (!c || !P) return;
    var left = (P.g.minutes || 10) * 60 - elapsed();
    c.textContent = mmss(left); c.classList.toggle('over', left < 0);
    c.title = left < 0 ? '제한 시간이 지났어요. 그래도 끝까지 도전!' : '남은 시간';
  }
  function mapHtml() {
    var n = P.g.doors.length;
    return '<ol class="esc-map" aria-label="문 지도">' + P.g.doors.map(function (d, i) {
      var st = (P.step === 'final' || P.step === 'done' || i < P.i) ? 'open' : (i === P.i && P.step === 'door' ? 'cur' : '');
      return '<li class="' + st + '"><div class="dr">' + (st === 'open' ? '✓' : i + 1) + '</div>문 ' + (i + 1) + '</li>';
    }).join('') + '<li class="vault ' + (P.step === 'done' ? 'open' : P.step === 'final' ? 'cur' : '') + '"><div class="dr">' + (P.step === 'done' ? '✓' : '★') + '</div>마지막 문</li></ol>' +
      '<span class="sr-only" style="position:absolute;left:-9999px">' + n + '개 문 중 ' + Math.min(P.i, n) + '개 열림</span>';
  }
  function pouchHtml(showAll) {
    return '<div class="pouch"><span>열쇠 꾸러미</span>' + P.g.doors.map(function (d, i) {
      var got = i < P.i || P.step === 'final' || P.step === 'done';
      return '<span class="piece' + (got ? ' got' : '') + '" title="문 ' + (i + 1) + '의 조각">' + (got && (showAll !== false) ? esc(d.key) : '') + '</span>';
    }).join('') + '</div>';
  }
  function topHtml() {
    return '<div class="esc-top"><h3>' + esc(P.g.title) + '</h3><span class="esc-stat">힌트 ' + P.hints + ' · 틀림 ' + P.wrong + '</span><span class="esc-clock" id="escClock">' + mmss((P.g.minutes || 10) * 60) + '</span><button class="btn-s" data-act="restart" title="처음부터 다시">처음부터</button></div>';
  }
  function renderPlay() {
    var el = stageEl(), g = P.g, h = '';
    if (P.step === 'intro') {
      var best = S.best[g.id];
      h = '<div class="esc-stage"><div class="esc-hero"><span class="chip-s garden">' + esc(g.subject || '방탈출') + '</span>' + (g.target ? '<span class="chip-s oak">' + esc(g.target) + '</span>' : '') +
        '<h3 style="margin-top:10px">' + esc(g.title) + '</h3><p>' + esc(g.intro || '자물쇠를 모두 풀고 밖으로 나가 보세요!') + '</p>' +
        '<div class="meta"><span class="chip-s lock">문 ' + g.doors.length + '개 + 마지막 문</span><span class="chip-s ember">제한 시간 ' + (g.minutes || 10) + '분</span>' + (best ? '<span class="chip-s">최고 기록 ' + mmss(best.sec) + ' · ' + '★'.repeat(best.stars) + '</span>' : '') + '</div>' +
        '<button class="btn-s pri big" data-act="begin">탈출 시작</button>' +
        '<p class="note-s" style="margin-top:14px">힌트를 보면 30초가 더해져요. 틀려도 괜찮아요, 다시 도전!</p></div></div>';
      el.innerHTML = h + soloFoot(); return;
    }
    if (P.step === 'done') {
      var sec = P.doneSec, st = stars(P);
      h = '<div class="esc-stage">' + mapHtml() + '<div class="esc-hero"><div class="stars" aria-label="별 ' + st + '개">' + '★'.repeat(st) + '<s>' + '★'.repeat(3 - st) + '</s></div><h3>탈출 성공!</h3>' +
        '<p>걸린 시간 <b>' + mmss(sec) + '</b> (제한 ' + (g.minutes || 10) + '분) · 힌트 ' + P.hints + '번 · 틀린 횟수 ' + P.wrong + '번' + (P.newBest ? '\n새 최고 기록이에요!' : '') + '</p>' +
        '<div class="esc-act"><button class="btn-s pri big" data-act="restart">' + (g.doors.some(function (d) { return d.gen; }) ? '새 문제로 다시' : '다시 도전') + '</button>' + (solo ? '' : '<button class="btn-s big" data-act="edit">이 방 꾸미기</button>') + '</div></div></div>';
      el.innerHTML = h + soloFoot(); return;
    }
    h = '<div class="esc-stage">' + topHtml() + mapHtml();
    if (P.step === 'door') {
      var d = g.doors[P.i];
      h += '<section class="esc-door" id="door" aria-live="polite"><div class="esc-leaf" aria-hidden="true"></div><span class="tag">문 ' + (P.i + 1) + ' / ' + g.doors.length + (d.std ? ' · ' + esc(d.std) : '') + '</span>' +
        '<h4>' + esc(d.title || '자물쇠 ' + (P.i + 1)) + '</h4>' + (d.passage ? '<div class="passage">' + fmt(d.passage) + '</div>' : '') + '<p class="q">' + fmt(d.q) + '</p>' + lockHtml(d) +
        '<div class="esc-act"><button class="btn-s" data-act="hint"' + (P.shown[P.i] || !d.hint ? ' disabled' : '') + '>힌트 보기 (+30초)</button><button class="btn-s pri" data-act="try">자물쇠 열기</button></div>' +
        '<p class="esc-msg" id="msg" role="status"></p>' + (P.shown[P.i] ? '<div class="esc-hint">' + fmt(d.hint) + '</div>' : '') + '</section>' + pouchHtml();
    } else if (P.step === 'final') {
      var keys = P.g.doors.map(function (d) { return d.key; });
      if (!P.tiles) P.tiles = shuffle(keys.map(function (k, i) { return { k: k, i: i }; }));
      h += '<section class="esc-door" id="door"><div class="esc-leaf" aria-hidden="true"></div><span class="tag">마지막 문</span><h4>열쇠 조각을 맞춰 마지막 문을 여세요</h4><p class="q">' + fmt(g.finalHint || '조각을 문 순서대로 이어요.') + '</p>' +
        '<div class="slots" aria-label="넣은 조각">' + keys.map(function (k, i) { var t = P.order[i]; return '<span class="piece' + (t != null ? ' got' : '') + '">' + (t != null ? esc(P.tiles[t].k) : '') + '</span>'; }).join('') + '</div>' +
        '<div class="slots" aria-label="가진 조각">' + P.tiles.map(function (t, j) { return '<button class="piece got" data-tile="' + j + '"' + (P.order.indexOf(j) >= 0 ? ' disabled' : '') + ' aria-label="조각 ' + esc(t.k) + '">' + esc(t.k) + '</button>'; }).join('') + '</div>' +
        '<div class="esc-act"><button class="btn-s" data-act="undo">하나 빼기</button><button class="btn-s" data-act="peek"' + (P.peek ? ' disabled' : '') + '>꾸러미 다시 보기 (+30초)</button><button class="btn-s pri" data-act="tryFinal">마지막 문 열기</button></div>' +
        '<p class="esc-msg" id="msg" role="status"></p>' + (P.peek ? '<div class="esc-hint">문 순서대로: ' + keys.map(function (k, i) { return '문 ' + (i + 1) + ' <b>' + esc(k) + '</b>'; }).join(' · ') + '</div>' : '') + '</section>';
    }
    el.innerHTML = h + '</div>' + soloFoot();
    tick();
    var w = el.querySelector('.word-in'); if (w) w.focus();
  }
  function soloFoot() { return solo ? '<p class="solo-foot">온-이음 방탈출 · 선생님이 만든 방</p>' : ''; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } if (a.length > 1 && a.every(function (x, k) { return x.i === k; })) a.push(a.shift()); return a; }

  function lockHtml(d) {
    if (d.type === 'choice') return '<div class="opts" role="radiogroup" aria-label="보기">' + (d.choices || []).filter(function (c) { return String(c).trim(); }).map(function (c, i) {
      return '<button class="opt' + (P.sel === i + 1 ? ' on' : '') + '" role="radio" aria-checked="' + (P.sel === i + 1) + '" data-opt="' + (i + 1) + '"><b>' + (i + 1) + '</b><span>' + fmt(c) + '</span></button>';
    }).join('') + '</div>';
    if (d.type === 'number') {
      var n = Math.max(1, Math.min(8, +d.len || 1));
      if (P.wheels.length !== n) { P.wheels = []; for (var i = 0; i < n; i++) P.wheels.push(0); P.wcur = 0; }
      return '<div class="wheels" aria-label="숫자 자물쇠 ' + n + '자리 (숫자 키로 입력)">' + P.wheels.map(function (v, i) {
        return '<div class="wheel' + (i === P.wcur ? ' cur' : '') + '"><button data-w="' + i + '" data-d="1" aria-label="' + (i + 1) + '번째 자리 올리기">▲</button><output data-wsel="' + i + '">' + v + '</output><button data-w="' + i + '" data-d="-1" aria-label="' + (i + 1) + '번째 자리 내리기">▼</button></div>';
      }).join('') + '</div><p class="note-s" style="text-align:center;margin:-8px 0 12px">▲▼를 누르거나 숫자 키를 눌러요</p>';
    }
    return '<input class="word-in" id="wordIn" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="정답 입력" placeholder="정답">';
  }

  function msg(t, cls) { var m = $('msg'); if (m) { m.textContent = t; m.className = 'esc-msg ' + (cls || ''); } }
  function shake() { var d = $('door'); if (!d) return; d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake'); }
  function openDoor(next) {
    var d = $('door'); if (d) d.classList.add('opening');
    setTimeout(function () { if (d) d.classList.add('opened'); }, 550);
    setTimeout(next, 1000);
  }
  function tryDoor() {
    var d = P.g.doors[P.i], v;
    if (d.type === 'choice') { if (!P.sel) { msg('보기를 하나 골라 주세요.', 'bad'); return; } v = String(P.sel); }
    else if (d.type === 'number') v = P.wheels.join('');
    else { v = ($('wordIn') || {}).value || ''; if (!v.trim()) { msg('정답을 적어 주세요.', 'bad'); return; } }
    if (check(d, v)) {
      msg('철컥! 열쇠 조각 「' + d.key + '」을(를) 얻었어요.', 'good');
      openDoor(function () { P.i++; P.sel = null; P.wheels = []; if (P.i >= P.g.doors.length) { P.step = 'final'; P.order = []; P.tiles = null; } renderPlay(); });
    } else {
      P.wrong++; shake();
      msg(P.wrong % 3 === 0 && d.hint && !P.shown[P.i] ? '아직 아니에요. 힌트를 열어 볼까요?' : '자물쇠가 꿈쩍도 안 해요. 다시 생각해 봐요.', 'bad');
      var s = document.querySelector('.esc-stat'); if (s) s.textContent = '힌트 ' + P.hints + ' · 틀림 ' + P.wrong;
    }
  }
  function tryFinal() {
    var keys = P.g.doors.map(function (d) { return d.key; });
    if (P.order.length < keys.length) { msg('조각을 모두 넣어 주세요.', 'bad'); return; }
    var got = P.order.map(function (j) { return P.tiles[j].k; }).join('');
    if (got === finalCode(P.g.doors)) {
      P.doneSec = elapsed(); clearInterval(clockT);
      var b = S.best[P.g.id], st = stars(P);
      P.newBest = !solo && (!b || P.doneSec < b.sec);
      if (!solo && P.g.id && (!b || P.doneSec < b.sec)) { S.best[P.g.id] = { sec: Math.round(P.doneSec), stars: st, at: new Date().toISOString().slice(0, 10) }; save(); }
      msg('마지막 문이 열렸어요!', 'good');
      openDoor(function () { P.step = 'done'; renderPlay(); if (!solo) renderSide(); });
    } else { P.wrong++; shake(); msg('순서가 맞지 않아요. 조각을 빼고 다시 넣어 보세요.', 'bad'); }
  }

  function onStageClick(e) {
    if (mode !== 'play' || !P) return;
    var b = e.target.closest('button'); if (!b) return;
    var act = b.dataset.act;
    if (act === 'begin') { P.step = 'door'; P.start = Date.now(); clearInterval(clockT); clockT = setInterval(tick, 1000); renderPlay(); return; }
    if (act === 'restart') { startPlay(game); return; }
    if (act === 'edit') { setMode('edit'); return; }
    if (act === 'hint') { if (!P.shown[P.i]) { P.shown[P.i] = true; P.hints++; P.penalty += 30; renderPlay(); } return; }
    if (act === 'try') { tryDoor(); return; }
    if (act === 'tryFinal') { tryFinal(); return; }
    if (act === 'undo') { P.order.pop(); renderPlay(); return; }
    if (act === 'peek') { P.peek = true; P.hints++; P.penalty += 30; renderPlay(); return; }
    if (b.dataset.opt) { P.sel = +b.dataset.opt; document.querySelectorAll('.opt').forEach(function (o) { var on = +o.dataset.opt === P.sel; o.classList.toggle('on', on); o.setAttribute('aria-checked', on); }); msg(''); return; }
    if (b.dataset.w != null) { var i = +b.dataset.w; P.wheels[i] = (P.wheels[i] + (+b.dataset.d) + 10) % 10; P.wcur = i; paintWheels(); return; }
    if (b.dataset.tile != null) { var j = +b.dataset.tile; if (P.order.indexOf(j) < 0 && P.order.length < P.tiles.length) { P.order.push(j); renderPlay(); } }
  }
  function paintWheels() {
    document.querySelectorAll('.wheel').forEach(function (w, i) { w.classList.toggle('cur', i === P.wcur); var o = w.querySelector('output'); if (o) o.textContent = P.wheels[i]; });
  }
  function onKey(e) {
    if (mode !== 'play' || !P) return;
    var t = e.target;
    if (P.step === 'final' && e.key === 'Enter' && !(t && t.closest && t.closest('button'))) { tryFinal(); return; }
    if (P.step !== 'door') return;
    var d = P.g.doors[P.i];
    if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName) && t.id !== 'wordIn') return;
    if (e.key === 'Enter' && !(t && t.tagName === 'BUTTON')) { e.preventDefault(); tryDoor(); return; }
    if (d.type === 'number') {
      if (/^\d$/.test(e.key)) { P.wheels[P.wcur] = +e.key; P.wcur = Math.min(P.wheels.length - 1, P.wcur + 1); paintWheels(); e.preventDefault(); }
      else if (e.key === 'Backspace') { P.wheels[P.wcur] = 0; P.wcur = Math.max(0, P.wcur - 1); paintWheels(); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { P.wcur = Math.max(0, P.wcur - 1); paintWheels(); }
      else if (e.key === 'ArrowRight') { P.wcur = Math.min(P.wheels.length - 1, P.wcur + 1); paintWheels(); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { P.wheels[P.wcur] = (P.wheels[P.wcur] + (e.key === 'ArrowUp' ? 1 : 9)) % 10; paintWheels(); e.preventDefault(); }
    } else if (d.type === 'choice' && /^[1-9]$/.test(e.key) && +e.key <= (d.choices || []).length) {
      P.sel = +e.key; document.querySelectorAll('.opt').forEach(function (o) { var on = +o.dataset.opt === P.sel; o.classList.toggle('on', on); o.setAttribute('aria-checked', on); });
    }
  }

  // ---------- 학생 화면(링크·HTML 파일) ----------
  function bootSolo(g) {
    solo = g; game = g; mode = 'play';
    document.body.classList.add('room-page', 'solo');
    document.title = g.title + ' · 방탈출';
    var st = stageEl(); st.addEventListener('click', onStageClick); document.addEventListener('keydown', onKey);
    startPlay(g);
  }

  if (root.ESCAPE_GAME) { bootSolo(root.ESCAPE_GAME); return; }
  if (!$('escapeApp')) return;
  var hp = /^#play=(.+)$/.exec(location.hash);
  if (hp) { try { bootSolo(decode(hp[1])); return; } catch (er) { toast('링크가 잘못됐어요. 선생님께 다시 받아 주세요.'); } }

  // ================= 선생님 화면 =================
  var SS = root.OnStdSearch, stdRecs = null, stdText = {};
  function loadStdRecs() {
    if (stdRecs) return Promise.resolve(stdRecs);
    return Promise.all(['search.json', 'index.json'].map(function (f) { return fetch('../data/standards/' + f).then(function (r) { return r.json(); }); }))
      .then(function (a) { stdRecs = SS.fromIndex(a[0], a[1]); stdRecs.forEach(function (r) { stdText[r.code] = r.text; }); return stdRecs; });
  }
  function allRooms() { return PRESETS.concat(S.mine); }
  function findRoom(id) { return allRooms().filter(function (r) { return r.id === id; })[0]; }
  function isMine(g) { return g && !g.preset; }
  function persist() { save(); renderList(); }

  function renderList() {
    var li = function (r) { var b = S.best[r.id]; return '<li><button data-room="' + esc(r.id) + '" class="' + (game && game.id === r.id ? 'on' : '') + '">' + esc(r.title || '(이름 없음)') + '<small>' + esc([r.subject, r.target, '문 ' + (r.doors || []).length + '개'].filter(Boolean).join(' · ')) + (b ? ' · ' + '★'.repeat(b.stars) + ' ' + mmss(b.sec) : '') + '</small></button></li>'; };
    $('roomList').innerHTML = '<li class="grp">예시 방</li>' + PRESETS.map(li).join('') + '<li class="grp">내가 만든 방 · ' + S.mine.length + '</li>' + (S.mine.map(li).join('') || '<li class="note-s" style="padding:4px 10px">아직 없어요. "새 방 만들기"나 예시 방의 "복제해서 고치기"로 시작해요.</li>');
  }
  function select(id, m) {
    var g = findRoom(id) || PRESETS[0];
    game = g; S.last = g.id; save();
    $('roomTitle').textContent = g.title || '방탈출';
    renderList(); renderSide(); setMode(m || 'play');
  }
  function setMode(m) {
    mode = m; clearInterval(clockT);
    document.querySelectorAll('[data-mode]').forEach(function (b) { var on = b.dataset.mode === m; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    if (m === 'play') { var err = validate(game); if (err.length) { stageEl().innerHTML = '<div class="esc-stage"><div class="esc-hero"><h3>아직 열 수 없는 방이에요</h3><ul class="errs" style="text-align:left;display:inline-block">' + err.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><div><button class="btn-s pri" data-act="edit">방 꾸미기로</button></div></div></div>'; P = { step: 'err' }; return; } startPlay(game); }
    else renderEdit();
  }

  // ---------- 방 꾸미기 ----------
  var TYPE = { choice: '객관식 (번호 자물쇠)', number: '숫자 자물쇠', word: '낱말 자물쇠', gen: '자동 수학 문제' };
  function renderEdit() {
    var g = game, ro = !isMine(g);
    var h = '<div class="esc-stage">';
    if (ro) h += '<div class="card-s"><h3>예시 방은 그대로 두고, 복제해서 고쳐요</h3><p class="note-s" style="margin:0 0 8px">복제한 방은 "내가 만든 방"에 저장돼요(이 브라우저에만).</p><button class="btn-s pri" data-ed="clone">복제해서 고치기</button></div>';
    h += '<ul class="errs" id="errs"></ul><fieldset' + (ro ? ' disabled' : '') + ' style="border:0;padding:0;margin:0">' +
      '<div class="ed-grid"><label class="field wide"><span>방 이름</span><input data-f="title" value="' + esc(g.title) + '"></label>' +
      '<label class="field"><span>과목</span><input data-f="subject" value="' + esc(g.subject || '') + '" placeholder="국어, 수학…"></label>' +
      '<label class="field"><span>대상</span><input data-f="target" value="' + esc(g.target || '') + '" placeholder="초등 5~6학년"></label>' +
      '<label class="field"><span>제한 시간(분)</span><input data-f="minutes" type="number" min="1" max="90" value="' + esc(g.minutes || 10) + '"></label>' +
      '<label class="field"><span>마지막 문 안내</span><input data-f="finalHint" value="' + esc(g.finalHint || '') + '" placeholder="조각을 문 순서대로 이어요."></label>' +
      '<label class="field wide"><span>이야기 (시작 화면)</span><textarea class="short" data-f="intro">' + esc(g.intro || '') + '</textarea></label></div>' +
      '<div class="card-s"><h3>성취기준</h3><div id="stdChips">' + stdChips(g, !ro) + '</div>' +
      (ro ? '' : '<label class="field" style="margin:8px 0 0"><span>성취기준 찾기 (교실 단원 찾기와 같은 검색)</span><input id="stdQ" placeholder="예: 분수의 덧셈, 주장, 4국02"></label><ul class="std-res" id="stdRes"></ul>') + '</div>' +
      g.doors.map(function (d, i) { return doorEd(d, i, g.doors.length); }).join('') +
      '</fieldset>' + (ro ? '' : '<div class="tabs" style="margin-bottom:24px"><button class="btn-s" data-ed="add" data-type="choice">+ 객관식 문</button><button class="btn-s" data-ed="add" data-type="number">+ 숫자 문</button><button class="btn-s" data-ed="add" data-type="word">+ 낱말 문</button><button class="btn-s" data-ed="add" data-type="gen">+ 자동 수학 문</button><span style="flex:1"></span><button class="btn-s pri" data-ed="test">도전해 보기</button><button class="btn-s" data-ed="del">이 방 지우기</button></div>') + '</div>';
    stageEl().innerHTML = h; showErrs();
  }
  function stdChips(g, editable) {
    return (g.standards || []).map(function (c) {
      return '<span class="chip-s lock" title="' + esc(stdText[c] || '') + '">' + esc(c) + ' <a href="classroom.html?find=' + encodeURIComponent(c.replace(/[\[\]]/g, '')) + '" title="교실에서 단원 보기" style="color:inherit">↗</a>' + (editable ? ' <button class="chip-s lock" style="padding:0 4px;margin:0" data-ed="unstd" data-code="' + esc(c) + '" aria-label="' + esc(c) + ' 빼기">×</button>' : '') + '</span>';
    }).join('') || '<span class="note-s">아직 없어요. 아래에서 찾아 넣으면 문마다 연결할 수 있어요.</span>';
  }
  function doorEd(d, i, n) {
    var t = d.gen != null ? 'gen' : (d.type || 'choice'), p = 'data-d="' + i + '"';
    var h = '<section class="ed-door"><header><b>문 ' + (i + 1) + ' · ' + TYPE[t] + '</b><button class="btn-s" data-ed="up" ' + p + (i ? '' : ' disabled') + ' aria-label="위로">↑</button><button class="btn-s" data-ed="down" ' + p + (i < n - 1 ? '' : ' disabled') + ' aria-label="아래로">↓</button><button class="btn-s" data-ed="rm" ' + p + '>빼기</button></header>';
    if (t === 'gen') {
      return h + '<label class="field"><span>자동 문제 (도전할 때마다 숫자가 바뀌어요 · 열쇠 조각은 답의 일의 자리)</span><select ' + p + ' data-f="gen">' + Object.keys(GEN).map(function (k) { return '<option value="' + k + '"' + (d.gen === k ? ' selected' : '') + '>' + esc(GEN[k].name + ' ' + GEN[k].std) + '</option>'; }).join('') + '</select></label>' +
        '<p class="note-s" style="margin:0">예: ' + fmt(GEN[d.gen] ? GEN[d.gen].make(rng(i + 3)).q : '').replace(/\n/g, ' ') + '</p></section>';
    }
    var stdOpts = '<option value="">(없음)</option>' + (game.standards || []).map(function (c) { return '<option' + (d.std === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + (d.std && (game.standards || []).indexOf(d.std) < 0 ? '<option selected>' + esc(d.std) + '</option>' : '');
    h += '<div class="ed-grid"><label class="field"><span>문 이름</span><input ' + p + ' data-f="title" value="' + esc(d.title || '') + '" placeholder="자물쇠 ' + (i + 1) + '"></label>' +
      '<label class="field"><span>성취기준</span><select ' + p + ' data-f="std">' + stdOpts + '</select></label>' +
      '<label class="field wide"><span>지문 (없어도 돼요)</span><textarea class="short" ' + p + ' data-f="passage">' + esc(d.passage || '') + '</textarea></label>' +
      '<label class="field wide"><span>문제 ("3/7"처럼 쓰면 분수로 보여요)</span><textarea class="short" ' + p + ' data-f="q">' + esc(d.q || '') + '</textarea></label>';
    if (t === 'choice') h += '<label class="field wide"><span>보기 (한 줄에 하나)</span><textarea class="short" ' + p + ' data-f="choices">' + esc((d.choices || []).join('\n')) + '</textarea></label>';
    h += '<label class="field"><span>' + (t === 'choice' ? '정답 번호' : t === 'number' ? '정답 (숫자)' : '정답 (여러 개면 | 로)') + '</span><input ' + p + ' data-f="answer" value="' + esc(d.answer == null ? '' : d.answer) + '"' + (t === 'word' ? '' : ' inputmode="numeric"') + '></label>' +
      '<label class="field"><span>열쇠 조각 (비우면 자동)</span><input ' + p + ' data-f="key" maxlength="4" value="' + esc(d.key || '') + '" placeholder="' + esc(keyOf(Object.assign({}, d, { key: '' })) || '') + '"></label>' +
      '<label class="field wide"><span>힌트 (정답 대신 생각할 방향)</span><input ' + p + ' data-f="hint" value="' + esc(d.hint || '') + '"></label></div></section>';
    return h;
  }
  function showErrs() { var e = $('errs'); if (e) e.innerHTML = isMine(game) ? validate(game).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') : ''; }
  var saveT = null;
  function onEdInput(e) {
    if (mode !== 'edit' || !isMine(game)) return;
    var t = e.target, f = t.dataset.f; if (!f) return;
    var v = t.value;
    if (t.dataset.d != null) {
      var d = game.doors[+t.dataset.d];
      if (f === 'choices') d.choices = v.split('\n'); else d[f] = v;
      if (f === 'gen' && e.type === 'change') { renderEdit(); }
    } else {
      game[f] = f === 'minutes' ? Math.max(1, Math.min(90, +v || 10)) : v;
      if (f === 'title') $('roomTitle').textContent = v || '방탈출';
    }
    clearTimeout(saveT); saveT = setTimeout(function () { persist(); renderSide(); }, 300);
    showErrs();
  }
  function onEdClick(e) {
    if (mode !== 'edit') return;
    var b = e.target.closest('[data-ed],[data-code-add],[data-act]'); if (!b) return;
    if (b.dataset.act === 'edit') return;
    var a = b.dataset.ed, i = +b.dataset.d, D = game.doors;
    if (b.dataset.codeAdd) { addStd(b.dataset.codeAdd); return; }
    if (a === 'clone') { var c = JSON.parse(JSON.stringify(game)); delete c.preset; c.id = 'room-' + Date.now().toString(36); c.title = game.title + ' (내 방)'; S.mine.push(c); persist(); select(c.id, 'edit'); toast('내 방으로 복제했어요. 마음껏 고쳐요'); return; }
    if (!isMine(game)) return;
    if (a === 'add') { var ty = b.dataset.type; D.push(ty === 'gen' ? { gen: 'times' } : { type: ty, title: '', q: '', choices: ty === 'choice' ? ['', '', '', ''] : undefined, answer: '', hint: '', std: (game.standards || [])[0] || '' }); }
    else if (a === 'rm') { if (!confirmSoft('문 ' + (i + 1) + '을(를) 뺄까요?')) return; D.splice(i, 1); }
    else if (a === 'up' && i > 0) { D.splice(i - 1, 0, D.splice(i, 1)[0]); }
    else if (a === 'down' && i < D.length - 1) { D.splice(i + 1, 0, D.splice(i, 1)[0]); }
    else if (a === 'unstd') { game.standards = (game.standards || []).filter(function (c) { return c !== b.dataset.code; }); }
    else if (a === 'test') { var err = validate(game); if (err.length) { showErrs(); toast('빨간 칸을 먼저 채워 주세요'); return; } setMode('play'); return; }
    else if (a === 'del') { if (!confirmSoft('"' + game.title + '" 방을 지울까요? 되돌릴 수 없어요.')) return; S.mine = S.mine.filter(function (r) { return r !== game; }); delete S.best[game.id]; persist(); select(PRESETS[0].id); return; }
    else return;
    persist(); renderEdit(); renderSide();
  }
  function confirmSoft(q) { try { return window.confirm(q); } catch (e) { return true; } }
  function addStd(code) {
    game.standards = game.standards || [];
    if (game.standards.indexOf(code) < 0) game.standards.push(code);
    game.doors.forEach(function (d) { if (!d.gen && !d.std) d.std = code; });
    persist(); renderEdit(); renderSide(); toast(code + '을(를) 넣었어요');
  }
  var stdTimer = null;
  function onStdQ(e) {
    if (!e.target || e.target.id !== 'stdQ') return;
    var q = e.target.value.trim(); clearTimeout(stdTimer);
    stdTimer = setTimeout(function () {
      if (!q) { $('stdRes').innerHTML = ''; return; }
      loadStdRecs().then(function (recs) {
        var r = SS.searchStandards(recs, { query: q, limit: 12 });
        var el = $('stdRes'); if (!el) return;
        el.innerHTML = r.results.map(function (x) { return '<li><button data-code-add="' + esc(x.code) + '"><code>' + esc(x.code) + '</code>' + esc(x.levelKo + ' ' + x.subject + ' · ') + esc(x.text.slice(0, 70)) + '</button></li>'; }).join('') || '<li class="note-s" style="padding:6px 10px">찾은 성취기준이 없어요.</li>';
      }).catch(function () { $('stdRes').innerHTML = '<li class="note-s" style="padding:6px 10px">성취기준 색인을 불러오지 못했어요.</li>'; });
    }, 200);
  }

  // ---------- 오른쪽: 내보내기 ----------
  function studentLink(g) { return location.href.split('#')[0].split('?')[0] + '#play=' + encode(seal(g)); }
  function renderSide() {
    var g = game, best = S.best[g.id], ok = !validate(g).length;
    var h = '<div class="side-sec"><h4>' + esc(g.title) + '</h4><p class="note-s" style="margin:0 0 6px">' + esc([g.subject, g.target, '문 ' + g.doors.length + '개', (g.minutes || 10) + '분'].filter(Boolean).join(' · ')) + (best ? '<br>최고 기록 ' + mmss(best.sec) + ' · ' + '★'.repeat(best.stars) + ' (' + esc(best.at) + ')' : '') + '</p>' +
      '<div>' + (g.standards || []).map(function (c) { return '<a class="chip-s lock" style="text-decoration:none;cursor:pointer" href="classroom.html?find=' + encodeURIComponent(c.replace(/[\[\]]/g, '')) + '" title="교실 단원 찾기에서 보기">' + esc(c) + ' ↗</a>'; }).join('') + '</div>' +
      ((g.standards || []).length ? '<p class="note-s" style="margin:4px 0 0">성취기준을 누르면 교실의 단원 찾기로 이어져요.</p>' : '') + '</div>';
    h += '<div class="side-sec"><h4>학생에게 나눠 주기</h4>' + (ok ? '' : '<p class="note-s" style="color:var(--ember)">방을 다 채우면 내보낼 수 있어요.</p>') +
      '<div class="tabs" style="margin-bottom:6px"><button class="btn-s pri" data-x="link"' + (ok ? '' : ' disabled') + '>학생용 링크 복사</button><button class="btn-s" data-x="open"' + (ok ? '' : ' disabled') + '>학생 화면 열기</button></div>' +
      '<div class="tabs" style="margin-bottom:6px"><button class="btn-s" data-x="html"' + (ok ? '' : ' disabled') + '>HTML 파일로 저장</button><button class="btn-s" data-x="print"' + (ok ? '' : ' disabled') + '>교사용 정답지</button></div>' +
      '<p class="note-s" style="margin:0">링크와 HTML 파일에는 정답이 암호처럼 바뀌어 들어가서 학생이 소스를 봐도 바로 보이지 않아요. HTML 파일은 인터넷이 없어도 열려요(학급 홈페이지·패들렛·클래스룸에 올리기 좋아요).</p></div>';
    h += '<div class="side-sec"><h4>AI로 문제 만들기</h4><p class="note-s" style="margin:0 0 6px">방의 성취기준으로 프롬프트를 복사해 Claude·Gemini에 붙여 넣고, 답으로 받은 JSON을 아래에 붙이면 문이 생겨요.</p>' +
      '<div class="tabs" style="margin-bottom:6px"><button class="btn-s" data-x="ai">프롬프트 복사</button></div>' +
      '<textarea id="aiIn" placeholder="[{&quot;title&quot;:…}] 붙여 넣기"></textarea><div class="tabs" style="margin-top:6px"><button class="btn-s" data-x="aiAdd">문으로 넣기</button></div></div>';
    h += '<div class="side-sec"><h4>파일로 옮기기</h4><div class="tabs"><button class="btn-s" data-x="json">JSON 내보내기</button><label class="btn-s" style="cursor:pointer">JSON 가져오기<input type="file" id="jsonIn" accept=".json,application/json" hidden></label></div></div>';
    $('side').innerHTML = h;
  }
  function download(name, text, type) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' }));
    a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function fileName(g, ext) { return String(g.title || '방탈출').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40) + ext; }
  function copy(t, okMsg) {
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast(okMsg); }, function () { window.prompt('복사해서 쓰세요', t); });
  }
  function standaloneHtml(g) {
    var files = ['../styles.css', '../css/room.css', '../css/escape.css', '../js/escape.js'];
    return Promise.all(files.map(function (f) { return fetch(f).then(function (r) { if (!r.ok) throw new Error(f); return r.text(); }); })).then(function (t) {
      var safe = function (s) { return s.replace(/<\/(script|style)/gi, '<\\/$1'); };
      return '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>' + esc(g.title) + ' · 방탈출</title>\n' +
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@400;500;700&family=JetBrains+Mono&display=swap">\n' +
        '<style>\n' + safe(t[0] + '\n' + t[1] + '\n' + t[2]) + '\n</style>\n</head>\n<body class="room-page solo">\n<div class="r-app"><main class="r-main"><div class="r-body" id="stage"></div></main></div>\n' +
        '<script>window.ESCAPE_GAME=' + safe(JSON.stringify(seal(g))) + ';<\/script>\n<script>\n' + safe(t[3]) + '\n<\/script>\n</body>\n</html>\n';
    });
  }
  function answerSheet(g) {
    var p = prepare(g, 1), gen = g.doors.some(function (d) { return d.gen; });
    var rows = p.doors.map(function (d, i) {
      var ans = d.type === 'choice' ? alts(d.answer).map(function (a) { return circled(+a) + ' ' + esc((d.choices || [])[+a - 1] || ''); }).join(', ') : esc(alts(d.answer).join(' 또는 '));
      return '<tr><td>문 ' + (i + 1) + '</td><td><b>' + esc(d.title || '') + '</b>' + (d.std ? ' <small>' + esc(d.std) + '</small>' : '') + '<div class="qq">' + fmt(d.q) + '</div></td><td>' + (d.gen ? '<i>자동 문제(도전마다 바뀜)</i><br>예: ' : '') + ans + '</td><td>' + esc(d.key) + '</td><td>' + fmt(d.hint || '') + '</td></tr>';
    }).join('');
    var css = 'body{font:14px/1.6 "Noto Sans KR",sans-serif;color:#2E2A25;margin:28px}h1{font:700 22px "Gowun Batang",serif;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:14px}td,th{border:1px solid #ccc;padding:6px 8px;vertical-align:top;text-align:left}th{background:#f1e6d0}.qq{white-space:pre-wrap;color:#555;font-size:13px}.frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1}.frac i{font-style:normal}.frac i+i{border-top:1.5px solid}small{color:#777}.fin{margin-top:14px;padding:10px;border:2px solid #2E4A6B;border-radius:8px}';
    return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>' + esc(g.title) + ' 정답지</title><style>' + css + '</style></head><body><h1>' + esc(g.title) + ' · 교사용 정답지</h1><div>' + esc([g.subject, g.target, '제한 ' + (g.minutes || 10) + '분'].filter(Boolean).join(' · ')) + ' · 성취기준 ' + esc((g.standards || []).join(' ')) + '</div>' +
      '<table><tr><th>문</th><th>문제</th><th>정답</th><th>조각</th><th>힌트</th></tr>' + rows + '</table><div class="fin"><b>마지막 문 비밀번호:</b> ' + esc(finalCode(p.doors)) + (gen ? ' (자동 문제가 있어 학생마다 달라요. 조각 = 각 답의 일의 자리)' : '') + '</div><script>window.onload=function(){window.print()}<\/script></body></html>';
  }
  function onSideClick(e) {
    var b = e.target.closest('[data-x]'); if (!b) return;
    var x = b.dataset.x, g = game;
    if (x === 'link') copy(studentLink(g), '학생용 링크를 복사했어요. 클래스룸·패들렛에 붙여 넣으세요');
    else if (x === 'open') window.open(studentLink(g), '_blank', 'noopener');
    else if (x === 'html') standaloneHtml(g).then(function (h) { download(fileName(g, '.html'), h, 'text/html'); toast('HTML 파일을 저장했어요. 더블클릭하면 바로 열려요'); }, function () { toast('파일을 만들지 못했어요. 인터넷 연결을 확인해 주세요'); });
    else if (x === 'print') { var w = window.open('', '_blank'); if (!w) { toast('팝업이 막혔어요. 팝업을 허용해 주세요'); return; } w.document.write(answerSheet(g)); w.document.close(); }
    else if (x === 'json') download(fileName(g, '.json'), JSON.stringify(Object.assign({}, g, { preset: undefined }), null, 2), 'application/json');
    else if (x === 'ai') loadStdRecs().catch(function () {}).then(function () { copy(aiPrompt(g, stdText), '프롬프트를 복사했어요. Claude·Gemini에 붙여 넣으세요'); });
    else if (x === 'aiAdd') {
      var doors; try { doors = parseDoors($('aiIn').value); } catch (er) { toast('JSON을 읽지 못했어요: ' + er.message); return; }
      if (!isMine(g)) { var c = JSON.parse(JSON.stringify(g)); delete c.preset; c.id = 'room-' + Date.now().toString(36); c.title = g.title + ' (내 방)'; c.doors = []; S.mine.push(c); game = g = c; }
      g.doors = g.doors.filter(function (d) { return d.gen || String(d.q || '').trim(); }).concat(doors);
      persist(); select(g.id, 'edit'); toast('문 ' + doors.length + '개를 넣었어요');
    }
  }
  function onJsonFile(e) {
    if (!e.target || e.target.id !== 'jsonIn' || !e.target.files[0]) return;
    e.target.files[0].text().then(function (t) {
      var g = JSON.parse(t); if (!g || !Array.isArray(g.doors)) throw new Error('방 파일이 아니에요');
      delete g.preset; delete g.sealed; g.id = 'room-' + Date.now().toString(36); S.mine.push(g); persist(); select(g.id, 'edit'); toast('"' + g.title + '" 방을 가져왔어요');
    }).catch(function (er) { toast('가져오지 못했어요: ' + er.message); });
  }

  // ---------- 시작 ----------
  stageEl().addEventListener('click', function (e) { if (mode === 'play') onStageClick(e); else onEdClick(e); });
  stageEl().addEventListener('input', function (e) { onEdInput(e); onStdQ(e); });
  stageEl().addEventListener('change', function (e) { if (e.target.tagName === 'SELECT') onEdInput(e); });
  document.addEventListener('keydown', onKey);
  $('side').addEventListener('click', onSideClick);
  $('side').addEventListener('change', onJsonFile);
  $('roomList').addEventListener('click', function (e) { var b = e.target.closest('[data-room]'); if (b) select(b.dataset.room); });
  document.querySelectorAll('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.mode); }); });
  $('newRoom').addEventListener('click', function () {
    var g = { id: 'room-' + Date.now().toString(36), title: '새 방탈출', subject: '', target: '', minutes: 10, intro: '', finalHint: '', standards: [], doors: [{ type: 'choice', title: '', q: '', choices: ['', '', '', ''], answer: '', hint: '' }] };
    S.mine.push(g); persist(); select(g.id, 'edit');
  });
  $('fullPlay').addEventListener('click', function () { if (validate(game).length) { toast('방을 다 채우면 열 수 있어요'); return; } window.open(studentLink(game), '_blank', 'noopener'); });
  window.addEventListener('hashchange', function () { if (/^#play=/.test(location.hash)) location.reload(); });

  var qs = new URLSearchParams(location.search), stdQ = qs.get('std');
  if (stdQ) {
    var code = /^\[.*\]$/.test(stdQ) ? stdQ : '[' + stdQ + ']';
    loadStdRecs().then(function (recs) {
      var r = recs.filter(function (x) { return x.code === code; })[0];
      var g = roomFromStandard(code, r && r.text, r && r.subject);
      S.mine.push(g); persist(); select(g.id, 'edit'); history.replaceState(null, '', location.pathname);
      toast(code + '(으)로 새 방을 만들었어요');
    }).catch(function () { select(S.last); });
  } else {
    select(qs.get('room') || S.last || PRESETS[0].id);
  }
})(typeof window !== 'undefined' ? window : this);
