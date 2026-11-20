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
console.log('classroom tests passed:', n);
