// 온-이음 · 단원 찾기 — 교실 화면과 MCP 서버(mcp/server.mjs)가 함께 쓰는 검색 규칙.
// 데이터: data/standards/units.json (scripts/build-units.mjs가 성취기준 MCP 데이터로 만든 단원 색인)
(function (root) {
  'use strict';
  var LV = { elem: '초등', middle: '중학교', high: '고등학교' };

  // "초등 3학년 분수", "중2 일차함수", "고1 공통국어 논증" 같은 말에서 학교급·학년군을 읽어 낸다.
  function parseQuery(q) {
    var s = String(q || '').normalize('NFC').trim(), lv = '', gb = '';
    var m;
    if ((m = s.match(/(?:초등|초)\s*([1-6])\s*학년?/)) || (m = s.match(/(?:^|\s)([1-6])\s*학년/))) {
      var g = +m[1]; lv = 'elem'; gb = g <= 2 ? '1-2' : g <= 4 ? '3-4' : '5-6'; s = s.replace(m[0], ' ');
    } else if ((m = s.match(/중(?:학교|학생)?\s*([1-3])\s*(?:학년)?/))) { lv = 'middle'; gb = '7-9'; s = s.replace(m[0], ' '); }
    else if ((m = s.match(/고(?:등학교|등)?\s*([1-3])\s*(?:학년)?/))) { lv = 'high'; s = s.replace(m[0], ' '); }
    if (/(^|\s)초등(학교)?(\s|$)/.test(s)) { lv = lv || 'elem'; s = s.replace(/(^|\s)초등(학교)?(?=\s|$)/, ' '); }
    if (/(^|\s)중학교?(\s|$)/.test(s)) { lv = lv || 'middle'; s = s.replace(/(^|\s)중학교?(?=\s|$)/, ' '); }
    if (/(^|\s)고등학교?(\s|$)/.test(s)) { lv = lv || 'high'; s = s.replace(/(^|\s)고등학교?(?=\s|$)/, ' '); }
    var words = s.split(/[\s,·]+/).map(function (w) { return w.replace(/(을|를|이|가|은|는|의|에서|단원|찾아줘|찾기|수업)$/, ''); }).filter(function (w) { return w.length >= 1; });
    return { level: lv, gradeBand: gb, words: words };
  }

  function unitTitle(u) { return u.u || u.d; }
  function label(u) { return LV[u.lv] + ' ' + u.s + ' · ' + u.gb + (u.lv === 'elem' ? '학년군' : '') + ' · ' + u.d + (u.u ? ' › ' + u.u : ''); }

  // 낱말마다 단원 이름(10) · 코드(8) · 영역(6) · 과목(5) · 성취기준 문장(2~5) 점수. 모든 낱말이 맞는 단원을 먼저,
  // 그런 단원이 없으면 가장 많은 낱말이 맞는 단원을 '부분 일치'로 돌려준다.
  function findUnits(units, query, opt) {
    opt = opt || {};
    var p = parseQuery(query), level = opt.level || p.level, gb = opt.gradeBand || p.gradeBand, limit = Math.min(opt.limit || 20, 50);
    var out = [];
    units.forEach(function (u) {
      if (level && u.lv !== level) return;
      if (gb && u.gb !== gb) return;
      var sc = 0, hits = 0;
      p.words.forEach(function (w) {
        var s = 0;
        if (u.u && u.u.indexOf(w) >= 0) s += 10;
        if (u.d.indexOf(w) >= 0) s += 6;
        if (u.s.indexOf(w) >= 0 || (u.g && u.g.indexOf(w) >= 0)) s += 5;
        if (u.t.indexOf(w) >= 0) s += 2 + Math.min(3, u.t.split(w).length - 2);
        if (u.codes.join(' ').indexOf(w) >= 0) s += 8;
        if (s) hits++;
        sc += s;
      });
      if (p.words.length && !hits) return;
      if (!p.words.length && !level && !gb) return;
      out.push({ unit: u, hits: hits, score: sc + (u.u ? 1 : 0) });
    });
    var full = out.filter(function (x) { return x.hits === p.words.length; });
    var partial = !full.length && p.words.length > 1;
    var pool = partial ? out : full;
    pool.sort(function (a, b) { return b.hits - a.hits || b.score - a.score || a.unit.id - b.unit.id; });
    return { level: level, gradeBand: gb, words: p.words, partial: partial, total: pool.length, results: pool.slice(0, limit).map(function (x) { return x.unit; }) };
  }

  var API = { parseQuery: parseQuery, findUnits: findUnits, unitTitle: unitTitle, label: label, LV: LV };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.OnUnits = API;
})(typeof window !== 'undefined' ? window : this);
