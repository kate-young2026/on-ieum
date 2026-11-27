// node tests/classroom.test.cjs
const assert = require('assert');
const fs = require('fs');
const C = require('../js/classroom.js');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
ok(C.toCan('중심 문장과 뒷받침 문장을 갖추어 문단을 쓰고, 문장과 문단을 중심으로 고쳐 쓴다.').endsWith('고쳐 쓸 수 있다.'), '쓴다');
ok(C.toCan('내용을 요약한다.') === '내용을 요약할 수 있다.', '한다');
ok(C.toCan('글을 읽는다.') === '글을 읽을 수 있다.', '는다');
ok(C.toCan('듣는다.') === '들을 수 있다.', '듣는다');
ok(C.toCan('태도를 지닌다.') === '태도를 지닐 수 있다.', '지닌다');
const idx = JSON.parse(fs.readFileSync('data/standards/index.json', 'utf8'));
ok(idx.total.elem === 620 && idx.total.sec === 3838, '성취기준 개수');
const codes = JSON.parse(fs.readFileSync('data/standards/codes.json', 'utf8'));
ok(codes['[4국03-01]'] != null && codes['[12문학01-07]'] != null, '코드 색인');
const kor = JSON.parse(fs.readFileSync('data/standards/elem/국어.json', 'utf8'));
const s = kor.standards.find((x) => x.code === '[4국03-01]');
ok(s && s.text.includes('문단') && s.topics.length > 0, '[4국03-01] 데이터');
for (const k of ['sheet', 'activity', 'game', 'project']) {
  const h = C.draft(k, s, C.objectives(s));
  ok(h.includes('[4국03-01]') && h.includes('학습목표') && !/undefined/.test(h), k + ' 초안');
}
ok(C.aiPrompt('sheet', s, ['목표']).includes('[확인 필요]'), 'AI 프롬프트');
// 학년군별 어휘 규칙과 [초안] 표시
const k2 = kor.standards.find((x) => x.code === '[2국01-01]');
ok(C.bandOf(k2) === 'e12' && C.bandOf(s) === 'e34', '학년군 판별');
const o2 = C.objectives(k2).join(' ');
ok(!/핵심 조건|자기 말로|담화|파악|적용/.test(o2), '1~2학년 학습목표에 어려운 말 없음: ' + o2);
const q2 = C.questions(k2);
ok(q2.length >= 3 && new Set(q2).size === q2.length, '평가 질문이 서로 다름');
ok(!q2.some((q) => /담화|파악|핵심 조건|상호작용/.test(q)), '1~2학년 평가 질문에 어려운 말 없음');
ok(!C.tasks(k2).some((t) => /학년군에 맞는|핵심 단서/.test(t)), '1~2학년 활동 문장은 템플릿 원문이 아님');
const d2 = C.draft('sheet', k2, C.objectives(k2));
ok(d2.includes('[초안]') && d2.includes('초등 1~2학년'), '초안 표시');
ok(!C.draft('sheet', k2, C.objectives(k2), true).includes('[초안]'), '확정하면 [초안] 표시 없음');
ok(C.aiPrompt('sheet', k2, ['목표']).includes('[초안]') && C.aiPrompt('sheet', k2, ['목표']).includes('1~2학년'), 'AI 프롬프트에 어휘 규칙·[초안]');
// 뉴스 라운지 → 교실로 보내기
const art = C.decodeNews(JSON.stringify({ t: '교육부, <AI> 디지털교과서 점검', l: 'javascript:alert(1)', s: '예시', x: ['한 줄', '두 줄', '세 줄', '네 줄'] }));
ok(art && art.x.length === 3 && art.l === 'javascript:alert(1)', '기사 주소 값 읽기(요약 3줄까지)');
const ns = C.newsSection(art, 'e12');
ok(ns.includes('&lt;AI&gt;') && !ns.includes('javascript:') && ns.includes('새로 알게 된 것 하나'), '기사 읽기 자료: 이스케이프 · 안전하지 않은 링크 빼기 · 학년군 질문');
ok(C.decodeNews('{bad') === null && C.decodeNews('{"x":1}') === null, '잘못된 기사 값은 무시');
ok(C.draft('sheet', k2, C.objectives(k2), false, ns).includes('읽기 자료 · 오늘의 기사'), '학습지에 기사 넣기');
// 모든 초등 성취기준에서 오류 없이 만들어지는지
for (const f of fs.readdirSync('data/standards/elem')) {
  for (const st of JSON.parse(fs.readFileSync('data/standards/elem/' + f, 'utf8')).standards) {
    const q = C.questions(st);
    assert.ok(q.length && new Set(q).size === q.length && !q.some((x) => /undefined/.test(x)), st.code);
  }
}
n++;
console.log('classroom tests passed:', n);
