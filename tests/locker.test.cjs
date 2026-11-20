// node tests/locker.test.cjs
const assert = require('assert');
const fs = require('fs');
const L = require('../js/locker.js');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const items = [{ no: 1, answer: 3, points: 2 }, { no: 2, answer: 5, points: 3 }, { no: 3, answer: null, points: null }, { no: 4, answer: 1, points: 2 }];
const r = L.score(items, { 1: 3, 2: 4, 3: 2 });
ok(r.correct === 1 && r.points === 2 && r.maxPoints === 7, '맞힌 수·점수');
ok(r.wrong.join() === '2' && r.unknown.join() === '3' && r.blank.join() === '4', '오답·미확인·빈칸');
const d = JSON.parse(fs.readFileSync('data/suneung-2027-korean.json', 'utf8'));
ok(d.common.length === 34 && d.elective['언어와 매체'].length === 11 && d.elective['화법과 작문'].length === 11, '문항 수');
ok(d.common.every((x) => x.answer === null), '정답은 확인 전까지 비어 있음');
const codes = JSON.parse(fs.readFileSync('data/standards/codes.json', 'utf8'));
const all = d.common.concat(d.elective['언어와 매체'], d.elective['화법과 작문']);
ok(all.every((x) => x.standards.every((c) => codes[c] != null)), '매칭 코드가 데이터에 있음');
console.log('locker tests passed:', n);
