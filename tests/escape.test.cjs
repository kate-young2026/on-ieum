// node tests/escape.test.cjs
const assert = require('assert');
const fs = require('fs');
const E = require('../js/escape.js');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

// 자동 수학 문제: 정답이 식과 맞고, 같은 시드면 같은 문제
const codes = JSON.parse(fs.readFileSync('data/standards/codes.json', 'utf8'));
for (const k of Object.keys(E.GEN)) {
  ok(codes[E.GEN[k].std] != null, k + ' 성취기준 코드가 데이터에 있음');
  for (let s = 1; s < 300; s++) {
    const g = E.GEN[k].make(E.rng(s));
    ok(Number.isInteger(g.answer) && g.answer > 0, k + ' 정답은 양의 정수');
  }
  ok(JSON.stringify(E.GEN[k].make(E.rng(42))) === JSON.stringify(E.GEN[k].make(E.rng(42))), k + ' 시드 재현');
}
const t = E.realize({ gen: 'times' }, 5), m = /(\d+) × (\d+)/.exec(t.q);
ok(+t.answer === m[1] * m[2] && t.key === t.answer.slice(-1) && t.type === 'number', '곱셈구구 정답·조각');
const fd = E.realize({ gen: 'fracDiff' }, 9), f = /(\d+)\/(\d+) \+ (\d+)\/(\d+) = □\/(\d+)/.exec(fd.q);
ok(Math.abs(f[1] / f[2] + f[3] / f[4] - fd.answer / f[5]) < 1e-9, '분모 다른 분수 덧셈 정답');

// 채점: 공백·전각 물음표·앞자리 0·여러 정답
ok(E.check({ type: 'word', answer: '?' }, ' ？ '), '전각 물음표 인정');
ok(E.check({ type: 'word', answer: '깡충깡충|깡총깡총' }, '깡총 깡총'), '여러 정답·띄어쓰기');
ok(E.check({ type: 'number', answer: '72' }, '072') && !E.check({ type: 'number', answer: '72' }, '27'), '숫자 자물쇠');
ok(E.check({ type: 'choice', answer: '3' }, '3') && !E.check({ type: 'choice', answer: '3' }, ''), '객관식');

// 예시 방: 모두 유효, 성취기준 코드 실재, 도서관 비밀번호는 "책을펴자"
for (const g of E.PRESETS) {
  ok(E.validate(g).length === 0, g.title + ' 유효');
  ok(g.standards.every((c) => codes[c] != null), g.title + ' 성취기준 실재');
  ok(g.doors.every((d) => !d.std || g.standards.includes(d.std)), g.title + ' 문 성취기준이 방 목록에 있음');
}
const lib = E.prepare(E.PRESETS[0], 1);
ok(E.finalCode(lib.doors) === '책을펴자', '도서관 마지막 문');
lib.doors.forEach((d) => ok(E.check(d, d.answer), '도서관 정답 통과: ' + d.title));

// 학생용 봉인: 정답이 빠지고도 채점은 같음, 링크로 왕복
const sealed = E.seal(E.PRESETS[0]);
ok(!JSON.stringify(sealed).includes('"answer"'), '봉인하면 정답 필드 없음');
const back = E.prepare(E.decode(E.encode(sealed)), 1);
back.doors.forEach((d, i) => { ok(E.check(d, lib.doors[i].answer), '봉인 후 정답 통과 ' + i); ok(!E.check(d, 'x9'), '봉인 후 오답 거절 ' + i); });
ok(E.finalCode(back.doors) === '책을펴자' && back.title === '잠긴 이야기 도서관', '왕복 후 한글 제목·조각');
const ns = E.seal({ id: 'r', title: 'n', doors: [{ type: 'number', q: '1+1', answer: '0042' }] });
ok(ns.doors[0].len === 4 && E.check(E.realize(ns.doors[0], 1), '42'), '숫자 자리수 유지');

// 검증·AI 가져오기·성취기준으로 방 시작
ok(E.validate({ title: '', doors: [] }).length === 2, '빈 방 오류 2개');
ok(E.validate({ title: 'a', doors: [{ type: 'choice', q: 'q', choices: ['a', 'b'], answer: '3' }] }).some((x) => x.includes('보기 번호')), '보기 번호 범위');
const ai = E.parseDoors('```json\n[{"title":"t","type":"choice","q":"질문","choices":["가","나","다","라"],"answer":2,"key":"힘","hint":"h"}]\n```');
ok(ai.length === 1 && ai[0].answer === '2' && E.validate({ title: 'x', doors: ai }).length === 0, 'AI JSON 가져오기');
const r1 = E.roomFromStandard('[6수01-08]', '분모가 다른 분수…', '수학');
ok(r1.doors[0].gen === 'fracDiff' && E.validate(r1).length === 0, '수학 성취기준 → 자동 문제 방');
ok(E.roomFromStandard('[6국02-01]').doors[0].type === 'choice', '국어 성취기준 → 빈 객관식 문');
ok(E.aiPrompt(E.PRESETS[0], { '[4국02-02]': '중심 생각' }).includes('[4국02-02] 중심 생각'), 'AI 프롬프트에 성취기준');
ok(E.fmt('<b>3/7</b>').startsWith('&lt;b&gt;<span class="frac">'), '서식은 이스케이프 후 분수만');
console.log('escape tests passed:', n);
