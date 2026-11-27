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
  // ---- 학년군별 어휘 규칙 ----
  // 1~2학년은 한자어·전문어를 쉬운 말로 바꾸고 짧은 문장, 3~4학년은 일부만, 5~6학년부터는 원래 말을 쓴다.
  function bandOf(std) {
    var g = String((std && std.gb) || '');
    if (g === '1-2') return 'e12';
    if (g === '3-4') return 'e34';
    if (g === '5-6') return 'e56';
    return 'sec';
  }
  var BAND_LABEL = { e12: '초등 1~2학년', e34: '초등 3~4학년', e56: '초등 5~6학년', sec: '중·고등학교' };
  var EASY_12 = [
    ['담화 상황과 목적', '말하는 때와 까닭'], ['듣기 단서와 정보 조직', '잘 듣고 내용 정리하기'], ['말하기 수행과 상호작용', '말하고 주고받기'], ['정보 조직', '내용 정리'], ['상호작용', '주고받기'], ['참여 태도와 조정 성찰', '참여하는 태도 돌아보기'],
    ['개념 확인', '뜻 알기'], ['적용과 설명', '써 보고 말하기'], ['표현과 연결', '나타내고 이어 보기'], ['탐구 적용', '알아보고 써 보기'], ['자료 표현', '자료로 나타내기'],
    ['생활 맥락 이해', '생활 속에서 알아보기'], ['성찰과 습관화', '돌아보고 습관 만들기'], ['탐구 질문 만들기', '궁금한 것 묻기'], ['관찰과 자료 읽기', '살펴보고 읽기'],
    ['탐구 결과 설명', '알아낸 것 말하기'], ['감각과 상상 열기', '느끼고 상상하기'], ['글자·어휘·문장 단서', '글자·낱말·문장'], ['중심 내용과 구조', '중요한 내용과 짜임'],
    ['추론·평가 읽기 전략', '짐작하며 읽기'], ['읽기 과정 점검과 독서 태도', '읽은 것 살펴보기와 책 읽는 습관'], ['내용 생성과 목적·독자 설정', '쓸 내용 떠올리기'],
    ['문장·문단·장르 구성', '문장 만들기'], ['초고 작성과 표현 수행', '처음 써 보기'], ['고쳐쓰기·공유와 쓰기 태도', '고쳐 쓰고 함께 읽기'], ['작품 요소와 갈래 단서', '이야기와 시의 모습'],
    ['감상 근거와 반응 표현', '느낀 점 말하기'], ['상상·창작·낭송 수행', '상상해 꾸미고 읽어 주기'], ['문학 향유와 삶 연결 성찰', '이야기를 즐기고 내 생활과 이어 보기'],
    ['국어 자료 관찰과 개념화', '우리말 살펴보기'], ['음운·표기·어휘·문장 규칙 적용', '소리·글자·낱말 바르게 쓰기'], ['상황 맥락에 맞는 표현 조정', '때와 곳에 맞게 말하기'],
    ['언어생활 성찰과 국어 의식', '내 말 습관 돌아보기'], ['매체 종류·양식·목적', '여러 가지 매체'], ['정보 탐색·선별·신뢰성 판단', '필요한 정보 찾기'], ['복합양식 자료 제작과 공유', '자료 만들어 나누기'],
    ['매체 이용 윤리와 성찰', '매체 바르게 쓰기'], ['움직임 특성과 상황', '움직임'], ['놀이 속 움직임 탐색·수행', '놀이하며 움직이기'], ['움직임 연결과 참여 돌아보기', '움직임 잇고 돌아보기'],
    ['파악', '알기'], ['수행', '해 보기'], ['성찰', '돌아보기'], ['단서', '실마리'], ['조직', '정리'], ['구조', '짜임'], ['개념', '뜻'], ['적용', '써 보기'], ['탐구', '알아보기'], ['맥락', '상황']
  ];
  var EASY_34 = [['참여 태도와 조정 성찰', '참여 태도 돌아보기'], ['상호작용', '주고받기'], ['개념화', '뜻 정리'], ['신뢰성 판단', '믿을 만한지 따지기'], ['복합양식', '여러 형태의'], ['성찰', '돌아보기'], ['조정', '바꾸기'], ['향유', '즐기기'], ['갈래', '종류']];
  function simplify(text, band) {
    var t = String(text || ''), rules = band === 'e12' ? EASY_12 : band === 'e34' ? EASY_34.concat(EASY_12) : [];
    rules.forEach(function (r) { t = t.split(r[0]).join(r[1]); });
    return t;
  }
  var OBJ = {
    e12: { CONCEPTUAL: '‘{f}’ 활동에서 중요한 것을 찾아 말할 수 있다.', LANGUAGE: '‘{f}’ 활동에서 알맞은 낱말을 골라 말하거나 쓸 수 있다.', PROCEDURAL: '‘{f}’ 활동을 차례대로 해 볼 수 있다.', META: '‘{f}’ 활동을 하고 잘한 점을 말할 수 있다.', _: '‘{f}’ 활동을 친구와 함께 해 볼 수 있다.' },
    e34: { CONCEPTUAL: '‘{f}’에서 중요한 내용을 찾아 설명할 수 있다.', LANGUAGE: '‘{f}’에 맞는 낱말과 문장을 골라 쓸 수 있다.', PROCEDURAL: '‘{f}’ 활동을 순서에 맞게 하고 생활 속 예에 써 볼 수 있다.', META: '‘{f}’ 활동을 돌아보고 더 잘할 점을 말할 수 있다.', _: '‘{f}’ 활동을 하고 알게 된 것을 설명할 수 있다.' },
    e56: { CONCEPTUAL: '‘{f}’의 중요한 조건을 근거를 들어 설명할 수 있다.', LANGUAGE: '‘{f}’에 알맞은 표현을 골라 자료에 활용할 수 있다.', PROCEDURAL: '‘{f}’을(를) 새로운 자료에 적용하고 결과를 설명할 수 있다.', META: '‘{f}’ 과정을 점검하고 고칠 점을 제안할 수 있다.', _: '‘{f}’을(를) 실제 자료에 적용할 수 있다.' },
    sec: { CONCEPTUAL: '「{f}」의 핵심 개념을 근거와 함께 설명할 수 있다.', LANGUAGE: '「{f}」에 적절한 표현을 선택해 실제 자료에 활용할 수 있다.', PROCEDURAL: '「{f}」을(를) 절차에 따라 수행하고 그 과정을 점검할 수 있다.', META: '「{f}」 과정을 성찰하고 개선 방안을 제시할 수 있다.', _: '「{f}」의 핵심 조건을 설명하고 실제 자료에 적용할 수 있다.' }
  };
  var ASK = {
    e12: ['‘{f}’ 활동에서 가장 중요한 것은 무엇이었나요?', '‘{f}’ 활동을 할 때 무엇을 먼저 했나요?', '‘{f}’ 활동에서 친구가 잘한 점 한 가지는 무엇인가요?', '오늘 해 본 것을 집에서는 언제 써 볼 수 있을까요?'],
    e34: ['‘{f}’에서 중요한 내용은 무엇이고, 왜 그렇게 생각하나요?', '‘{f}’ 활동의 순서를 차례대로 말해 볼까요?', '‘{f}’ 활동을 생활 속 어떤 때에 쓸 수 있을까요?', '다시 한다면 ‘{f}’ 활동에서 무엇을 더 잘하고 싶나요?'],
    e56: ['‘{f}’의 조건을 근거를 들어 설명해 볼까요?', '새로운 자료에 ‘{f}’을(를) 적용하면 무엇이 달라지나요?', '‘{f}’ 결과물에서 고칠 점과 그 까닭은 무엇인가요?', '친구의 결과와 내 결과를 비교하면 어떤 차이가 있나요?'],
    sec: ['「{f}」의 핵심 개념을 정의하고 예를 들어 설명하시오.', '「{f}」을(를) 주어진 자료에 적용한 결과를 근거와 함께 제시하시오.', '「{f}」 수행 과정에서 부족했던 점과 개선 방안을 쓰시오.', '「{f}」이(가) 실제 삶이나 사회 문제와 어떻게 연결되는지 논하시오.']
  };
  var TASK = {
    e12: { CONCEPTUAL: '‘{f}’ — 그림이나 이야기를 보고 중요한 것에 ○ 해 봅시다.', LANGUAGE: '‘{f}’ — 알맞은 낱말을 골라 빈칸에 써 봅시다.', PROCEDURAL: '‘{f}’ — 짝과 함께 차례대로 해 봅시다.', META: '‘{f}’ — 해 보고 잘한 점에 ☆ 해 봅시다.', _: '‘{f}’ — 친구와 함께 해 봅시다.' },
    e34: { CONCEPTUAL: '‘{f}’ — 자료에서 중요한 내용에 밑줄을 긋고 한 문장으로 써 봅시다.', LANGUAGE: '‘{f}’ — 알맞은 낱말과 문장을 골라 써 봅시다.', PROCEDURAL: '‘{f}’ — 순서에 맞게 해 보고 순서를 정리해 봅시다.', META: '‘{f}’ — 해 본 뒤 더 잘할 점을 써 봅시다.', _: '‘{f}’ — 해 보고 알게 된 것을 써 봅시다.' }
  };
  var OPEN = { e12: '이런 일을 해 본 적이 있나요? 떠올려서 말해 봅시다.', e34: '오늘 배울 내용과 비슷한 경험을 떠올려 써 봅시다.', e56: '오늘 배울 내용과 관련해 이미 알고 있는 것을 써 봅시다.', sec: '오늘 학습 주제와 관련해 알고 있는 개념이나 경험을 정리해 봅시다.' };
  function fill(tpl, f) { return tpl.split('{f}').join(f); }
  function topicsOf(std) {
    var band = bandOf(std), seen = {};
    return (std.topics || []).map(function (tp) {
      var f = focusOf(tp.t);
      // 중등 데이터처럼 세부 주제가 성취기준 문장 전체인 경우에는 영역 이름으로 짧게 부른다
      if (f.length > 24 || f.indexOf('—') >= 0) f = std.domain || '이 성취기준';
      return { f: simplify(f, band), ty: tp.ty || '_' };
    })
      .filter(function (x) { if (!x.f || seen[x.f]) return false; seen[x.f] = 1; return true; });
  }
  // 학습목표 제안: 성취기준 문장 + 세부 주제마다 학년군에 맞는 문장 틀(유형별로 다른 틀)
  function objectives(std) {
    var band = bandOf(std), out = [toCan(std.text)];
    topicsOf(std).slice(0, 2).forEach(function (x) {
      var o = fill(OBJ[band][x.ty] || OBJ[band]._, x.f);
      if (out.indexOf(o) < 0) out.push(o);
    });
    return out;
  }
  // 평가 질문: 학년군별 질문 틀을 세부 주제마다 다른 틀로 돌려 써서 같은 문장이 반복되지 않게 한다
  function questions(std) {
    var band = bandOf(std), stems = ASK[band], out = [];
    var tps = topicsOf(std);
    if (!tps.length) tps = [{ f: band === 'sec' ? std.domain || '이 성취기준' : '오늘 배운 것' }];
    for (var i = 0; i < stems.length; i++) {
      var q = fill(stems[i], tps[i % tps.length].f);
      if (out.indexOf(q) < 0) out.push(q);
    }
    return out;
  }
  // 학습지 활동: 초등 1~4학년은 쉬운 활동 문장, 5학년 이상은 학습맵 성취 지표를 그대로
  function tasks(std) {
    var band = bandOf(std);
    if (TASK[band]) return topicsOf(std).slice(0, 4).map(function (x) { return fill(TASK[band][x.ty] || TASK[band]._, x.f); });
    return indicators(std).ev.slice(0, 4);
  }
  function indicators(std) {
    var ev = [], ap = [];
    (std.topics || []).forEach(function (t) { (t.ev || []).forEach(function (x) { if (ev.indexOf(x) < 0) ev.push(x); }); (t.ap || []).forEach(function (x) { if (ap.indexOf(x) < 0) ap.push(x); }); });
    return { ev: ev, ap: ap };
  }

  var KIND = {
    sheet: '학습지', activity: '활동지', game: '게임(방탈출)', project: '토의·프로젝트'
  };
  function head(std, title, objs, final) {
    return (final ? '' : '<p class="draft-mark">[초안] 자동 생성 문장이에요. 선생님이 확인하고 확정하기 전에는 학생에게 나눠 주지 마세요.</p>') +
      '<header class="ws-h"><p class="ws-k">' + (final ? '' : '[초안] ') + esc(KIND[title] || title) + ' · ' + esc(BAND_LABEL[bandOf(std)]) + '</p><h1>' + esc(std.domain || '') + ' · ' + esc(std.code) + '</h1>' +
      '<table class="ws-id"><tr><td>학년·반</td><td></td><td>번호</td><td></td><td>이름</td><td></td></tr></table></header>' +
      '<section><h2>성취기준</h2><p class="std">' + esc(std.code) + ' ' + esc(std.text) + '</p></section>' +
      '<section><h2>학습목표</h2><ol>' + objs.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') + '</ol></section>';
  }
  // 뉴스 라운지 '교실로 보내기'로 온 기사(a = {t 제목, l 링크, s 출처, d 날짜, x 요약 줄})를 읽기 자료 + 생각 질문으로
  var NEWS_Q = {
    e12: ['기사에서 새로 알게 된 것 하나를 써 보세요.', '이 일이 우리 반과 어떤 관계가 있을까요?', '내가 기자라면 무엇을 더 물어보고 싶나요?'],
    e34: ['기사에서 새로 알게 된 것 두 가지를 써 보세요.', '이 일이 우리 학교와 어떤 관계가 있을까요?', '내가 기자라면 무엇을 더 물어보고 싶나요?'],
    e56: ['기사의 중요한 사실을 한 문장으로 정리해 보세요.', '이 소식이 우리 생활에 어떤 변화를 가져올지 까닭을 들어 예상해 보세요.', '기사에 나오지 않은 사람들의 생각은 어떨지 써 보세요.'],
    sec: ['기사의 핵심 사실을 한 문장으로 요약해 보세요.', '이 소식이 학교와 교실에 가져올 변화를 근거를 들어 예측해 보세요.', '기사에 드러난 관점과 빠진 관점을 찾아 비판적으로 평가해 보세요.']
  };
  function newsSection(a, band) {
    if (!a || !a.t) return '';
    var link = /^https?:\/\//.test(a.l || '') ? a.l : '', line = '<div class="ans"></div>';
    return '<section class="news-src"><h2>읽기 자료 · 오늘의 기사</h2><p class="std"><b>' + esc(a.t) + '</b><br><span class="mut">' + esc([a.s, a.d].filter(Boolean).join(' · ')) + (link ? ' · ' + esc(link) : '') + '</span></p>' +
      ((a.x || []).length ? '<ul>' + a.x.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' : '') +
      '<p class="mut">요약은 기사 설명문 앞부분이에요. 수업 전에 원문과 맞는지 확인해 주세요.</p>' +
      '<h2>기사로 생각하기</h2><ol>' + (NEWS_Q[band] || NEWS_Q.sec).map(function (q) { return '<li>' + esc(q) + line + '</li>'; }).join('') + '</ol></section>';
  }
  function decodeNews(v) {
    try { var a = JSON.parse(v); if (!a || typeof a.t !== 'string') return null; return { t: a.t.slice(0, 200), l: String(a.l || '').slice(0, 500), s: String(a.s || '').slice(0, 60), d: String(a.d || '').slice(0, 20), x: (Array.isArray(a.x) ? a.x : []).slice(0, 3).map(function (l) { return String(l).slice(0, 300); }) }; } catch (e) { return null; }
  }
  function draft(kind, std, objs, final, extra) {
    var ev = tasks(std), ap = questions(std), b = head(std, kind, objs, final) + (extra || '');
    var line = '<div class="ans"></div>';
    if (kind === 'sheet') {
      b += '<section><h2>1. 생각 열기</h2><p>' + esc(OPEN[bandOf(std)]) + '</p>' + line + '</section>';
      b += '<section><h2>2. 개념 익히기</h2><ol>' + ev.map(function (e) { return '<li>' + esc(e) + line + '</li>'; }).join('') + '</ol></section>';
      b += '<section><h2>3. ' + (bandOf(std) === 'e12' ? '해 보기' : '적용하기') + '</h2><p>' + esc(ap[0] || '배운 내용을 새로운 자료에 적용해 봅시다.') + '</p>' + line + line + '</section>';
      b += '<section><h2>4. 스스로 점검</h2><table class="chk"><tr><th>점검 내용</th><th>잘함</th><th>보통</th><th>노력</th></tr>' +
        objs.map(function (o) { return '<tr><td>' + esc(o) + '</td><td></td><td></td><td></td></tr>'; }).join('') + '</table></section>';
    } else if (kind === 'activity') {
      b += '<section><h2>모둠 역할</h2><table class="chk"><tr><th>이끔이</th><th>기록이</th><th>자료이</th><th>발표이</th></tr><tr><td></td><td></td><td></td><td></td></tr></table></section>';
      var steps = ['탐색: 자료를 읽고 핵심 단서를 찾기', '수행: 과제를 함께 해결하기', '공유: 모둠 결과를 발표하고 질문 주고받기', '성찰: 배운 점과 더 알고 싶은 점 쓰기'];
      b += '<section><h2>활동 순서</h2><ol>' + steps.map(function (s, i) { return '<li><b>' + esc(s) + '</b>' + (ev[i] ? '<p class="mut">' + esc(ev[i]) + '</p>' : '') + line + '</li>'; }).join('') + '</ol></section>';
      b += '<section><h2>평가 질문</h2><ol>' + ap.slice(0, 2).map(function (q) { return '<li>' + esc(q) + line + '</li>'; }).join('') + '</ol></section>';
    } else if (kind === 'game') {
      var rooms = (ev.length ? ev : [std.text]).slice(0, 3);
      b += '<section><h2>방탈출 규칙</h2><p>방마다 미션을 해결하면 자물쇠 번호 한 자리를 얻어요. 세 자리를 모두 모으면 탈출!</p></section>';
      b += rooms.map(function (e, i) {
        return '<section class="room"><h2>자물쇠 ' + (i + 1) + '번 방</h2><p><b>미션</b> ' + esc(e) + '</p><p class="mut">정답 조건(선생님이 채우기): ________ → 자물쇠 번호 [ ]</p>' + line + '</section>';
      }).join('');
      b += '<section><h2>마지막 문</h2><p>세 자리 번호: [ ][ ][ ] — ' + esc(ap[ap.length - 1] || '최종 질문에 답해야 문이 열려요.') + '</p></section>';
    } else {
      b += '<section><h2>탐구 질문</h2><p>' + esc(ap[0] || std.text) + '</p></section>';
      b += '<section><h2>진행 단계</h2><ol><li>질문 다듬기 · 역할 나누기</li><li>자료 조사와 근거 모으기</li><li>토의 또는 산출물 만들기</li><li>발표와 상호 피드백</li></ol></section>';
      b += '<section><h2>평가 기준(루브릭)</h2><table class="chk"><tr><th>기준</th><th>상</th><th>중</th><th>하</th></tr>' +
        (ev.slice(0, 3).length ? ev.slice(0, 3) : [std.text]).map(function (e) { return '<tr><td>' + esc(e) + '</td><td>근거를 들어 정확하고 충분히 수행</td><td>대체로 수행</td><td>도움을 받아 일부 수행</td></tr>'; }).join('') + '</table></section>';
    }
    if (!final) b += '<p class="draft-mark">[초안] 학년군(' + esc(BAND_LABEL[bandOf(std)]) + ') 어휘 규칙으로 자동 생성했어요. 문장은 선생님이 다듬어 확정해 주세요.</p>';
    b += '<footer class="src">성취기준 출처: 교육부·국가교육위원회 고시 교육과정(NCIC). 지표는 학습맵 MCP 데이터(MIT)의 세부 주제에서 가져왔으며 공식 산출물이 아닙니다.</footer>';
    return b;
  }
  var DOC_CSS = 'body{font-family:"Noto Sans KR",sans-serif;color:#2e2a25;max-width:760px;margin:24px auto;padding:0 20px;line-height:1.65}' +
    '.ws-k{color:#b5531f;font-weight:700;margin:0}h1{font-family:"Gowun Batang",serif;margin:4px 0 10px;font-size:22px}h2{font-size:16px;margin:18px 0 6px;border-left:4px solid #b5531f;padding-left:8px}' +
    'table{border-collapse:collapse;width:100%}td,th{border:1px solid #c9bfae;padding:6px 8px;font-size:13px;text-align:left}.ws-id td:nth-child(odd){background:#f1e6d0;width:60px}' +
    '.std{background:#faf6ee;border:1px solid #e3dacb;border-radius:8px;padding:8px 10px}.ans{border-bottom:1px dashed #b3a999;height:30px}.mut{color:#6b6258;font-size:13px;margin:2px 0}' +
    '.draft-mark{background:#fff4d6;border:1px dashed #b5531f;color:#8a3d12;border-radius:8px;padding:6px 10px;font-size:13px;font-weight:700;margin:8px 0}' +
    '.room{border:1px dashed #2e4a6b;border-radius:10px;padding:4px 12px 10px;margin:10px 0}.src{margin-top:24px;font-size:11px;color:#6b6258}[contenteditable]:focus{outline:2px solid #22717a}@media print{[contenteditable]{outline:none}}';
  var VOCAB_RULE = {
    e12: '초등 1~2학년이 읽는 글이므로 한 문장은 20자 안팎, 한자어·전문어(파악, 적용, 담화, 성찰 등) 대신 쉬운 우리말을 쓸 것.',
    e34: '초등 3~4학년 수준의 낱말로, 한 문장에 한 가지 일만 묻고 어려운 한자어는 풀어 쓸 것.',
    e56: '초등 5~6학년 수준으로, 개념어는 처음 나올 때 쉬운 말로 풀이를 붙일 것.',
    sec: '중·고등학생 수준의 교과 용어를 쓰되, 질문마다 요구하는 수행(설명·적용·평가)을 분명히 할 것.'
  };
  function aiPrompt(kind, std, objs) {
    var ind = indicators(std), band = bandOf(std);
    return '다음 성취기준으로 ' + (KIND[kind] || kind) + '를 만들어 주세요. 대상 학년군: ' + std.gb + ' (' + BAND_LABEL[band] + ').\n' +
      '성취기준: ' + std.code + ' ' + std.text + '\n영역: ' + std.domain + '\n학습목표:\n' + objs.map(function (o, i) { return (i + 1) + '. ' + o; }).join('\n') +
      '\n성취 지표(관찰 증거):\n' + ind.ev.slice(0, 4).map(function (e) { return '- ' + e; }).join('\n') +
      '\n평가 질문 예:\n' + questions(std).slice(0, 2).map(function (e) { return '- ' + e; }).join('\n') +
      '\n어휘 규칙: ' + VOCAB_RULE[band] +
      '\n조건: 맨 위에 [초안]이라고 표시할 것(교사가 확정하기 전), 학생 실명·개인정보를 넣지 말 것, 성취기준 코드는 위 코드만 쓸 것, 확인하지 못한 사실은 [확인 필요]로 표시할 것.';
  }

  var API = { toCan: toCan, bandOf: bandOf, simplify: simplify, objectives: objectives, questions: questions, tasks: tasks, indicators: indicators, draft: draft, aiPrompt: aiPrompt, newsSection: newsSection, decodeNews: decodeNews, DOC_CSS: DOC_CSS };
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; return; }
  root.OnClass = API;
  if (typeof document === 'undefined' || !document.getElementById('classApp')) return;

  // ---- 화면 ----
  var $ = function (id) { return document.getElementById(id); };
  var BASE = '../data/standards/';
  var idx = null, codes = null, course = null, std = null, level = 'elem', kind = 'sheet', gbFilter = '';
  var article = decodeNews(new URLSearchParams(location.search).get('news') || '');
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
    if ($('toEscape')) $('toEscape').href = 'escape.html?std=' + encodeURIComponent(std.code.replace(/[\[\]]/g, ''));
    $('stdMeta').innerHTML = '<span class="chip-s lock">' + esc(course.subject) + '</span><span class="chip-s oak">' + esc(std.gb) + (level === 'elem' ? '학년군' : '') + '</span><span class="chip-s garden">' + esc(std.domain) + '</span>';
    $('stdBody').innerHTML =
      '<div class="card-s"><h3>성취기준 설명</h3><p style="font-size:16px;line-height:1.8;margin:0">' + esc(std.text) + '</p>' +
      (std.textCheck ? '<p class="note-s">원문 추출이 불완전할 수 있어요. NCIC 원문과 대조해 주세요(확인 필요).</p>' : '') + '</div>' +
      '<div class="card-s"><h3>성취 지표 <small class="muted">관찰할 수 있는 증거 · 학습맵 데이터 원문</small></h3><ol style="margin:0;padding-left:20px">' + (ind.ev.map(function (e) { return '<li style="margin:4px 0">' + esc(e) + '</li>'; }).join('') || '<li class="muted">지표 데이터가 없어요.</li>') + '</ol></div>' +
      '<div class="card-s"><h3>평가 질문 예 <small class="muted">[초안] ' + esc(BAND_LABEL[bandOf(std)]) + ' 어휘</small></h3><ul style="margin:0;padding-left:20px">' + (questions(std).map(function (e) { return '<li style="margin:4px 0">' + esc(e) + '</li>'; }).join('') || '<li class="muted">없음</li>') + '</ul></div>' +
      ((std.pre || std.next) ? '<div class="card-s"><h3>이어지는 성취기준</h3>' + (std.pre ? '<p class="note-s">먼저 배울 것</p>' + chipsFor(std.pre, 'oak') : '') + (std.next ? '<p class="note-s">이어서 배울 것(중→고)</p>' + chipsFor(std.next, 'garden') : '') + '</div>' : '') +
      '<div class="card-s"><h3>세부 주제</h3>' + (std.topics || []).map(function (t) { return '<span class="chip-s">' + esc(focusOf(t.t)) + '</span>'; }).join('') + '</div>';
    $('objText').value = objectives(std).join('\n');
    setFinal(false);
    try { history.replaceState(null, '', '#' + encodeURIComponent(std.code)); } catch (e) {}
    buildDraft();
  }
  var final = false;
  function setFinal(v) {
    final = !!v;
    if ($('objFinal')) $('objFinal').checked = final;
    if ($('objState')) { $('objState').textContent = final ? '확정됨' : '[초안]'; $('objState').className = 'chip-s ' + (final ? 'garden' : 'ember'); }
  }
  function buildDraft() {
    if (!std) return;
    var objs = $('objText').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var html = '<!doctype html><html lang="ko"><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@700&family=Noto+Sans+KR:wght@400;700&display=swap"><style>' + DOC_CSS + '</style></head><body><main contenteditable="true">' + draft(kind, std, objs, final, article && $('newsUse') && $('newsUse').checked ? newsSection(article, bandOf(std)) : '') + '</main></body></html>';
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
  $('objReset').addEventListener('click', function () { if (std) { $('objText').value = objectives(std).join('\n'); setFinal(false); buildDraft(); } });
  if ($('objFinal')) $('objFinal').addEventListener('change', function () { setFinal(this.checked); buildDraft(); });
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

  // ---- 단원 찾기 (js/standards-search.js · MCP 서버와 같은 검색) ----
  var SS = root.OnStdSearch, recs = null, unitRes = null, unitTimer = null;
  function loadRecs() {
    if (recs) return Promise.resolve(recs);
    return getJSON(BASE + 'search.json').then(function (d) { recs = SS.fromIndex(d, idx); return recs; });
  }
  function setMode(m) {
    document.querySelectorAll('[data-mode]').forEach(function (b) { var on = b.dataset.mode === m; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    $('browsePane').hidden = m !== 'browse'; $('unitPane').hidden = m !== 'unit';
    if (m === 'unit') { $('unitQ').focus(); runUnit(); }
  }
  function gradeOptions() {
    var lv = $('unitLevel').value, g = [];
    if (!lv || lv === 'elem') for (var i = 1; i <= 6; i++) g.push([i, '초' + i]);
    if (!lv || lv === 'middle') for (i = 1; i <= 3; i++) g.push([6 + i, '중' + i]);
    if (!lv || lv === 'high') for (i = 1; i <= 3; i++) g.push([9 + i, '고' + i]);
    var cur = $('unitGrade').value;
    $('unitGrade').innerHTML = '<option value="">전 학년</option>' + g.map(function (x) { return '<option value="' + x[0] + '">' + x[1] + '</option>'; }).join('');
    if (g.some(function (x) { return String(x[0]) === cur; })) $('unitGrade').value = cur;
  }
  function unitQuery() { return { query: $('unitQ').value.trim(), level: $('unitLevel').value, grade: $('unitGrade').value, subject: $('unitSubj').value.trim(), limit: 30 }; }
  function runUnit() {
    var o = unitQuery();
    if (!o.query && !o.subject && !o.level && !o.grade) {
      unitRes = null; $('unitList').innerHTML = '';
      $('unitInfo').textContent = '낱말을 넣으면 맞는 단원과 그 단원의 성취기준을 보여 줘요. 과목·학년만 고르면 단원 목록이 나와요.';
      return;
    }
    $('unitInfo').textContent = recs ? '찾는 중…' : '성취기준 색인을 불러오는 중…';
    loadRecs().then(function () {
      unitRes = SS.findUnits(recs, o); unitRes.q = o.query;
      renderUnits();
      try { var sp = new URLSearchParams(location.search); sp.set('find', o.query || o.subject); history.replaceState(null, '', '?' + sp.toString() + location.hash); } catch (e) {}
    }).catch(function () { $('unitInfo').textContent = '색인(search.json)을 불러오지 못했어요.'; });
  }
  function renderUnits() {
    var r = unitRes, q = r.q;
    $('unitInfo').textContent = r.total ? '단원 ' + r.total + '개' + (r.total > r.units.length ? ' · 잘 맞는 ' + r.units.length + '개만 보여요' : '') + (q ? ' · ★ 낱말이 들어간 성취기준' : '') : '맞는 단원이 없어요. 낱말을 줄이거나 조건을 빼 보세요.';
    $('unitList').innerHTML = r.units.map(function (u, i) {
      return (i ? '<li class="u-sep" aria-hidden="true"></li>' : '') +
        '<li><button class="unit-h" data-unit="' + i + '">' + esc(u.unit) + '<small>' + esc(u.levelKo + ' ' + u.subject + ' · ' + u.gb + ' · [' + u.unitKey + '-..] · ' + u.count + '개') + '</small></button></li>' +
        u.standards.map(function (s) {
          return '<li class="u-std' + (q && !s.match ? ' dim' : '') + '"><button data-ucode="' + esc(s.code) + '" class="' + (std && std.code === s.code ? 'on' : '') + '">' + (q && s.match ? '<span class="u-mark">★</span>' : '') + esc(s.code) + '<small>' + esc(s.text) + '</small></button></li>';
        }).join('');
    }).join('');
  }
  function unitPrompt(u) {
    return '다음 단원의 차시별 수업 흐름(차시 수, 차시별 학습목표·활동·평가)을 설계해 주세요.\n단원: ' + u.title + '\n성취기준:\n' +
      u.standards.map(function (s) { return '- ' + s.code + ' ' + s.text; }).join('\n') +
      '\n조건: 학생 실명·개인정보를 넣지 말 것, 성취기준 코드는 위 코드만 쓸 것, 확인하지 못한 사실은 [확인 필요]로 표시할 것.';
  }
  function showUnit(i) {
    var u = unitRes && unitRes.units[i]; if (!u) return;
    document.querySelectorAll('.unit-h').forEach(function (b) { b.classList.toggle('on', +b.dataset.unit === i); });
    $('stdTitle').textContent = u.unit;
    $('stdMeta').innerHTML = '<span class="chip-s lock">' + esc(u.levelKo + ' ' + u.subject) + '</span><span class="chip-s oak">' + esc(u.gb) + '</span><span class="chip-s garden">[' + esc(u.unitKey) + '-..]</span>';
    $('stdBody').innerHTML =
      '<div class="card-s"><h3>단원 한눈에</h3><p class="note-s" style="margin:0 0 8px">성취기준 ' + u.count + '개' + (unitRes.q ? ' · 「' + esc(unitRes.q) + '」가 들어간 것 ' + u.matched + '개(★)' : '') + '. 성취기준을 누르면 설명·지표와 학습지 초안이 열려요.</p>' +
      '<div class="tabs"><button class="btn-s pri" data-uprompt="' + i + '">AI에게 단원 설계 맡기기</button></div></div>' +
      u.standards.map(function (s) {
        return '<div class="card-s u-card"><h3>' + (unitRes.q && s.match ? '<span class="u-mark">★</span>' : '') + esc(s.code) + ' <small class="muted">' + esc(s.domain) + '</small></h3><p style="margin:0;line-height:1.75">' + esc(s.text) + '</p><button class="chip-s ember" data-jump="' + esc(s.code) + '">이 성취기준으로 수업 설계 →</button></div>';
      }).join('');
    $('stdBody').scrollTop = 0;
  }
  document.querySelectorAll('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.mode); }); });
  $('unitForm').addEventListener('submit', function (e) { e.preventDefault(); clearTimeout(unitTimer); runUnit(); });
  $('unitQ').addEventListener('input', function () { clearTimeout(unitTimer); unitTimer = setTimeout(runUnit, 250); });
  $('unitSubj').addEventListener('input', function () { clearTimeout(unitTimer); unitTimer = setTimeout(runUnit, 300); });
  $('unitLevel').addEventListener('change', function () { gradeOptions(); runUnit(); });
  $('unitGrade').addEventListener('change', runUnit);
  $('unitList').addEventListener('click', function (e) {
    var h = e.target.closest('[data-unit]'); if (h) { showUnit(+h.dataset.unit); return; }
    var b = e.target.closest('[data-ucode]'); if (!b) return;
    document.querySelectorAll('[data-ucode]').forEach(function (x) { x.classList.toggle('on', x === b); });
    jump(b.dataset.ucode);
  });
  $('stdBody').addEventListener('click', function (e) {
    var b = e.target.closest('[data-uprompt]'); if (!b) return;
    var t = unitPrompt(unitRes.units[+b.dataset.uprompt]);
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast('단원 설계 프롬프트를 복사했어요'); }, function () { prompt('복사해서 쓰세요', t); });
  });
  gradeOptions();

  // ---- 뉴스 라운지에서 온 기사 ----
  function showArticle(find) {
    var box = $('newsCard'), link = /^https?:\/\//.test(article.l) ? article.l : '';
    box.hidden = false;
    box.innerHTML = '<span class="chip-s ember">뉴스 라운지에서 온 기사</span><h3>' + (link ? '<a href="' + esc(link) + '" target="_blank" rel="noopener">' + esc(article.t) + '</a>' : esc(article.t)) + '</h3>' +
      '<p class="note-s" style="margin:0 0 6px">' + esc([article.s, article.d].filter(Boolean).join(' · ')) + '</p>' +
      '<p class="note-s" style="margin:0 0 4px">맞는 단원 낱말 <span id="newsKwInfo">찾는 중…</span></p><div id="newsKw"></div>' +
      '<label class="note-s" style="display:flex;gap:6px;align-items:center;margin:6px 0 0;cursor:pointer"><input type="checkbox" id="newsUse" checked> 학습지에 읽기 자료로 넣기</label>' +
      '<p class="note-s" style="margin:4px 0 0">단원에서 성취기준을 고르면 학습지에 이 기사와 생각 질문이 함께 들어가요.</p>';
    setMode('unit');
    loadRecs().then(function () {
      var kw = SS.newsKeywords(recs, article.t, article.x.join(' '));
      $('newsKwInfo').textContent = kw.length ? '(누르면 다시 찾아요)' : '— 못 찾았어요. 위 칸에 직접 넣어 보세요.';
      $('newsKw').innerHTML = kw.map(function (k) { return '<button class="chip-s oak" type="button" data-kw="' + esc(k.word) + '">' + esc(k.word) + ' <small>' + k.count + '</small></button>'; }).join('');
      var first = find || (kw[0] && kw[0].word);
      if (first) { $('unitQ').value = first; runUnit(); }
    });
  }
  $('newsCard').addEventListener('click', function (e) { var b = e.target.closest('[data-kw]'); if (b) { $('unitQ').value = b.dataset.kw; runUnit(); } });
  $('newsCard').addEventListener('change', function (e) { if (e.target.id === 'newsUse') buildDraft(); });

  Promise.all([getJSON(BASE + 'index.json'), getJSON(BASE + 'codes.json')]).then(function (r) {
    idx = r[0]; codes = r[1];
    $('totalInfo').textContent = '초등 ' + idx.total.elem + ' · 중등 ' + idx.total.sec + '개 성취기준';
    var h = decodeURIComponent(location.hash.slice(1) || '');
    if (h && codes[h] != null) { var c = idx.courses[codes[h]]; level = c.level; document.querySelectorAll('[data-level]').forEach(function (b) { b.classList.toggle('on', b.dataset.level === level); }); renderCoursesOnly(); $('courseSel').value = codes[h]; openCourse(codes[h], h); }
    else renderCourses();
    var find = new URLSearchParams(location.search).get('find');
    if (article) showArticle(find);
    else if (find) { $('unitQ').value = find; setMode('unit'); }
  }).catch(function () { $('stdBody').innerHTML = '<div class="card-s">성취기준 데이터를 불러오지 못했어요. 웹 서버(또는 GitHub Pages)에서 열어 주세요.</div>'; });
})(typeof window !== 'undefined' ? window : this);
