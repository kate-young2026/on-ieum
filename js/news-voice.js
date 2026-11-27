// 온-이음 · 뉴스 음성 듣기 — 브라우저 음성 합성(Web Speech API)으로 오늘의 뉴스 요약을 한국어로 읽어 준다.
// 키·서버 없이 기기 안에서만 동작한다. 순수 함수(script)는 node 테스트에서도 쓴다.
(function (root) {
  'use strict';
  var CAT = { '출시': 'AI 출시', AI: 'AI', IT: 'IT', EDU: '교육', '정책': '교육정책' };
  var ORD = ['첫', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열', '열한', '열두'];
  // 소리 내어 읽기 좋게 다듬기: 괄호 속 기자명·출처, 말줄임표, 특수 기호 정리
  function clean(t) {
    return String(t || '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\[[^\]]{0,30}(기자|=)[^\]]*\]/g, '')
      .replace(/[“”"‘’'「」『』]/g, '')
      .replace(/…|\.\.\./g, ', ')
      .replace(/[·ㆍ]/g, ', ')
      .replace(/\s*[|/]\s*/g, ', ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  // 90자에서 잘린 요약(…로 끝남)은 마지막 낱말 조각을 버리고 문장을 닫는다
  function end(s) {
    s = String(s || '').trim();
    if (/(…|\.\.\.)$/.test(s)) s = s.replace(/(…|\.\.\.)$/, '').replace(/\s+\S*$/, '');
    s = clean(s).replace(/[,\s]+$/, '');
    return s && !/[.!?。]$/.test(s) ? s + '.' : s;
  }
  // 읽을 대본: [{i: 기사 번호(-1은 인사말), text}]
  function script(news, cat) {
    var items = (news && news.items || []).map(function (n, i) { return { n: n, i: i }; })
      .filter(function (x) { return !cat || cat === 'all' || x.n.cat === cat; });
    var d = news && news.date ? new Date(news.date + 'T08:20:00+09:00') : null;
    var day = d && !isNaN(d) ? (d.getUTCMonth() + 1) + '월 ' + new Date(d.getTime() + 9 * 36e5).getUTCDate() + '일 ' : '오늘 ';
    var out = [{ i: -1, text: day + '온이음 뉴스 브리핑입니다. ' + (cat && cat !== 'all' ? (CAT[cat] || cat) + ' 뉴스 ' : '뉴스 ') + items.length + '개를 읽어 드릴게요.' }];
    items.forEach(function (x, k) {
      var lines = (x.n.lines || []).filter(function (l) { return !/요약할 설명문이 없는 기사/.test(l); }).map(end).join(' ');
      out.push({ i: x.i, text: (ORD[k] || (k + 1)) + ' 번째, ' + (CAT[x.n.cat] || x.n.cat || '') + ' 소식. ' + end(x.n.title) + (x.n.source ? ' 출처는 ' + clean(x.n.source) + '. ' : ' ') + lines });
    });
    out.push({ i: -1, text: '오늘 브리핑은 여기까지입니다. 좋은 하루 보내세요.' });
    return out;
  }
  // 긴 문장은 일부 브라우저(크롬)에서 중간에 끊겨서 문장 단위로 나눠 읽는다
  function chunks(text) {
    var parts = String(text).split(/(?<=[.!?。])\s+/), out = [], cur = '';
    parts.forEach(function (p) { if ((cur + ' ' + p).length > 160 && cur) { out.push(cur); cur = p; } else cur = cur ? cur + ' ' + p : p; });
    if (cur) out.push(cur);
    return out;
  }

  function Player(opt) {
    this.opt = opt || {};
    this.rate = 1; this.seq = []; this.pos = 0; this.state = 'idle';
    this.synth = root.speechSynthesis;
  }
  Player.supported = function () { return !!(root.speechSynthesis && root.SpeechSynthesisUtterance); };
  Player.prototype.voice = function () {
    var vs = this.synth ? this.synth.getVoices() : [];
    var ko = vs.filter(function (v) { return /^ko/i.test(v.lang); });
    return ko.filter(function (v) { return /Google|Yuna|SunHi|Heami|Sora|Natural/i.test(v.name); })[0] || ko[0] || null;
  };
  Player.prototype.load = function (seq) { this.stop(); this.seq = seq; this.pos = 0; };
  Player.prototype._emit = function () { if (this.opt.onChange) this.opt.onChange(this.state, this.seq[this.pos] || null, this.pos); };
  Player.prototype._speak = function () {
    var self = this, seg = this.seq[this.pos];
    if (!seg) { this.state = 'idle'; this.pos = 0; this._emit(); return; }
    var parts = chunks(seg.text), k = 0, token = this._token = {};
    var next = function () {
      if (token !== self._token) return;
      if (k >= parts.length) { self.pos++; self._speak(); return; }
      var u = new root.SpeechSynthesisUtterance(parts[k++]);
      u.lang = 'ko-KR'; u.rate = self.rate; var v = self.voice(); if (v) u.voice = v;
      u.onend = next; u.onerror = function (e) {
        if (e && (e.error === 'interrupted' || e.error === 'canceled')) return;
        // 사용자가 누르기 전 자동 재생이 막힌 경우: 멈추고 ▶를 누르게 한다
        if (e && e.error === 'not-allowed') { self.stop(); if (self.opt.onBlocked) self.opt.onBlocked(); return; }
        next();
      };
      self.synth.speak(u);
    };
    this.state = 'playing'; this._emit(); next();
  };
  Player.prototype.play = function (at) {
    if (!this.synth) return false;
    if (this.state === 'paused' && at == null) { this.synth.resume(); this.state = 'playing'; this._emit(); return true; }
    this._token = null; this.synth.cancel();
    if (at != null) this.pos = Math.max(0, Math.min(at, this.seq.length - 1));
    this._speak(); return true;
  };
  Player.prototype.pause = function () { if (this.state !== 'playing') return; this.synth.pause(); this.state = 'paused'; this._emit(); };
  Player.prototype.stop = function () { this._token = null; if (this.synth) this.synth.cancel(); this.state = 'idle'; this._emit(); };
  Player.prototype.next = function () { this.play(Math.min(this.pos + 1, this.seq.length - 1)); };
  Player.prototype.prev = function () { this.play(Math.max(this.pos - 1, 0)); };
  Player.prototype.setRate = function (r) { this.rate = r; if (this.state === 'playing') this.play(this.pos); };

  var API = { script: script, clean: clean, chunks: chunks, Player: Player, CAT: CAT };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.NewsVoice = API;
})(typeof window !== 'undefined' ? window : globalThis);
