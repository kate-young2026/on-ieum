// 온-이음 · 성취기준 검색 엔진 (교실 화면과 MCP 서버가 함께 씀)
// 낱말·과목·학년·코드로 성취기준을 찾고, 같은 단원(코드 앞부분)끼리 묶어 단원을 찾는다.
(function (root) {
  'use strict';

  var LEVEL_KO = { elem: '초등학교', middle: '중학교', high: '고등학교' };
  var PARTICLES = ['에서', '으로', '에게', '하기', '하는', '이란', '이다', '의', '을', '를', '이', '가', '은', '는', '와', '과', '로', '에', '도'];

  function norm(s) { return String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ''); }
  function stripParticle(tok) {
    for (var i = 0; i < PARTICLES.length; i++) {
      var p = PARTICLES[i];
      if (tok.length > p.length + 1 && tok.slice(-p.length) === p) return tok.slice(0, -p.length);
    }
    return tok;
  }

  // "[4과01-02]" → { key:"4과01", no:"01" } · "[10공수2-03-05]" → { key:"10공수2-03", no:"03" }
  function unitKey(code) {
    var c = String(code || '').replace(/[\[\]]/g, ''), parts = c.split('-');
    if (parts.length >= 3) return { key: parts.slice(0, -1).join('-'), no: parts[parts.length - 2] };
    var m = /^(.*?)(\d{2})$/.exec(parts[0] || '');
    return m ? { key: parts[0], no: m[2] } : { key: parts[0] || c, no: '' };
  }

  // 단원 이름: 평가 질문의 "○○ 단원" 표기가 있으면 그것, 없으면 영역(area) → 영역(domain)
  function unitName(std) {
    var count = {};
    (std.topics || []).forEach(function (t) {
      (t.ap || []).forEach(function (a) {
        var m = /^(.{2,24}?) 단원/.exec(a);
        if (m) count[m[1]] = (count[m[1]] || 0) + 1;
      });
    });
    var best = '', n = 0;
    for (var k in count) if (count[k] > n) { best = k; n = count[k]; }
    return best || std.area || std.domain || '';
  }
  function focusOf(t) { var i = (t || '').lastIndexOf(' - '); if (i > 0) return t.slice(0, i); var j = (t || '').indexOf(' — '); return j > 0 ? t.slice(j + 3) : t; }

  // 과목 파일(JSON) + index.json의 과목 정보 → 검색용 레코드
  function toRecords(course, meta) {
    meta = meta || {};
    var level = meta.level || course.level, subject = meta.subject || course.subject, group = meta.group || course.group || subject;
    return (course.standards || []).map(function (s) {
      var u = unitKey(s.code), topics = [];
      (s.topics || []).forEach(function (t) { var f = focusOf(t.t); if (f && topics.indexOf(f) < 0) topics.push(f); });
      return {
        code: s.code, level: level, levelKo: LEVEL_KO[level] || level, subject: subject, group: group,
        category: meta.category || course.category || '', file: meta.file || '', gb: s.gb || '',
        domain: s.domain || '', unit: unitName(s), unitKey: u.key, unitNo: u.no,
        text: s.text || '', topics: topics.slice(0, 4), pre: s.pre || [], next: s.next || []
      };
    });
  }

  // search.json(줄인 색인) + index.json → 레코드
  function fromIndex(search, idx) {
    return search.records.map(function (row) {
      var m = idx.courses[row[0]] || {}, u = unitKey(row[1]);
      return {
        code: row[1], level: m.level, levelKo: LEVEL_KO[m.level] || m.level, subject: m.subject, group: m.group || m.subject,
        category: m.category || '', file: m.file || '', course: row[0], gb: row[2], domain: row[3], unit: row[4] || row[3],
        unitKey: u.key, unitNo: u.no, text: row[5], topics: row[6] ? row[6].split('|') : [], pre: [], next: []
      };
    });
  }

  // 학년(1~12, "중2", "고1", "5학년")이 학년군 "3-4"·"7-9"·"10-12"에 드는지
  function gradeNum(g) {
    if (g == null || g === '') return null;
    if (typeof g === 'number') return g;
    var s = String(g).replace(/\s/g, ''), m;
    if ((m = /^중(\d)/.exec(s))) return 6 + +m[1];
    if ((m = /^고(\d)/.exec(s))) return 9 + +m[1];
    if ((m = /^초?(\d{1,2})/.exec(s))) return +m[1];
    return null;
  }
  function gbHas(gb, grade) {
    var m = /^(\d+)(?:-(\d+))?$/.exec(gb || '');
    if (!m) return false;
    var a = +m[1], b = m[2] ? +m[2] : a;
    return grade >= a && grade <= b;
  }
  function levelOf(v) {
    var s = String(v || '').trim();
    if (!s) return '';
    if (/^elem|초/.test(s)) return 'elem';
    if (/^mid|중/.test(s)) return 'middle';
    if (/^high|고/.test(s)) return 'high';
    return s;
  }

  var CODE_RE = /^\[?(\d{1,2}[가-힣A-Za-z]+\d?(?:-?\d{2})?(?:-\d{2})?)\]?$/;
  function filterRecs(recs, o) {
    var lv = levelOf(o.level), subj = norm(o.subject), grade = gradeNum(o.grade), gb = String(o.gb || '').trim();
    return recs.filter(function (r) {
      if (lv && r.level !== lv) return false;
      if (subj && norm(r.subject).indexOf(subj) < 0 && norm(r.group).indexOf(subj) < 0) return false;
      if (gb && r.gb !== gb) return false;
      if (grade != null && !gbHas(r.gb, grade)) return false;
      return true;
    });
  }

  // 점수: 코드 > 단원 이름 > 영역 > 성취기준 문장 > 세부 주제
  function scoreRec(r, q) {
    var raw = String(q || '').trim();
    if (!raw) return 1;
    var code = norm(r.code).replace(/[\[\]]/g, ''), qn = norm(raw).replace(/[\[\]]/g, '');
    if (CODE_RE.test(raw.replace(/\s/g, ''))) {
      if (code === qn) return 1000;
      if (code.indexOf(qn) === 0) return 600 - (code.length - qn.length);
    }
    var F = { unit: norm(r.unit), domain: norm(r.domain), text: norm(r.text), topics: norm(r.topics.join(' ')), subject: norm(r.subject + r.group) };
    var toks = raw.split(/\s+/).filter(Boolean), score = 0, hit = 0;
    toks.forEach(function (t0) {
      var cands = [norm(t0)], st = stripParticle(norm(t0));
      if (st !== cands[0]) cands.push(st);
      var best = 0;
      cands.forEach(function (t, ci) {
        var k = ci ? 0.8 : 1;
        if (F.unit.indexOf(t) >= 0) best = Math.max(best, (F.unit === t ? 14 : 9) * k);
        if (F.domain.indexOf(t) >= 0) best = Math.max(best, (F.domain === t ? 8 : 5) * k);
        if (F.text.indexOf(t) >= 0) best = Math.max(best, 4 * k);
        if (F.topics.indexOf(t) >= 0) best = Math.max(best, 2 * k);
        if (F.subject.indexOf(t) >= 0) best = Math.max(best, 1.5 * k);
      });
      if (best) { hit++; score += best; }
    });
    if (!hit) return 0;
    if (toks.length > 1) {
      if (F.text.indexOf(qn) >= 0 || F.unit.indexOf(qn) >= 0) score += 10; // 붙어 있는 구절 그대로
      score *= hit / toks.length;
      if (hit < Math.ceil(toks.length / 2)) return 0;
    }
    return score;
  }

  function cmpCode(a, b) { return a.code.localeCompare(b.code, 'ko', { numeric: true }); }

  // 성취기준 찾기
  function searchStandards(recs, o) {
    o = o || {};
    var q = String(o.query || o.q || o.code || '').trim(), limit = Math.max(1, Math.min(+o.limit || 20, 200));
    var pool = filterRecs(recs, o), out = [];
    pool.forEach(function (r) { var s = scoreRec(r, q); if (s > 0) out.push({ r: r, s: s }); });
    out.sort(function (a, b) { return b.s - a.s || cmpCode(a.r, b.r); });
    return { total: out.length, results: out.slice(0, limit).map(function (x) { return Object.assign({ score: Math.round(x.s * 10) / 10 }, x.r); }) };
  }

  // 단원 찾기: 맞는 성취기준을 단원(코드 앞부분)으로 묶고, 단원 안의 성취기준 전체를 함께 돌려준다
  function findUnits(recs, o) {
    o = o || {};
    var q = String(o.query || o.q || '').trim(), limit = Math.max(1, Math.min(+o.limit || 8, 50));
    var pool = filterRecs(recs, o), units = {}, order = [];
    pool.forEach(function (r) {
      var id = r.level + '|' + r.subject + '|' + r.unitKey, u = units[id];
      if (!u) { u = units[id] = { id: id, level: r.level, levelKo: r.levelKo, subject: r.subject, group: r.group, unitKey: r.unitKey, unitNo: r.unitNo, names: {}, gbs: [], standards: [], score: 0, matched: 0 }; order.push(u); }
      u.names[r.unit] = (u.names[r.unit] || 0) + 1;
      if (r.gb && u.gbs.indexOf(r.gb) < 0) u.gbs.push(r.gb);
      var s = scoreRec(r, q);
      u.standards.push({ code: r.code, gb: r.gb, domain: r.domain, text: r.text, match: s > 0 });
      if (s > 0) { u.matched++; u.score = Math.max(u.score, s) + 0.5; }
    });
    var list = order.filter(function (u) { return !q || u.matched > 0; }).map(function (u) {
      var name = '', n = 0;
      for (var k in u.names) if (u.names[k] > n) { name = k; n = u.names[k]; }
      u.standards.sort(cmpCode);
      return {
        unit: name, unitKey: u.unitKey, level: u.level, levelKo: u.levelKo, subject: u.subject, group: u.group, gb: u.gbs.join(', '),
        title: u.levelKo + ' ' + u.subject + ' · ' + (u.gbs.join(', ')) + ' · ' + name,
        score: Math.round(u.score * 10) / 10, matched: u.matched, count: u.standards.length, standards: u.standards
      };
    });
    list.sort(function (a, b) {
      return (q ? (b.score - a.score || b.matched - a.matched) : 0) ||
        (a.level + a.subject).localeCompare(b.level + b.subject, 'ko') || a.unitKey.localeCompare(b.unitKey, 'ko', { numeric: true });
    });
    return { total: list.length, units: list.slice(0, limit) };
  }

  var API = { unitKey: unitKey, unitName: unitName, toRecords: toRecords, fromIndex: fromIndex, gradeNum: gradeNum, gbHas: gbHas, levelOf: levelOf, scoreRec: scoreRec, searchStandards: searchStandards, findUnits: findUnits, LEVEL_KO: LEVEL_KO };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.OnStdSearch = API;
})(typeof window !== 'undefined' ? window : this);
