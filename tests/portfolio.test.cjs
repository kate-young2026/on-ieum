// node tests/portfolio.test.cjs
const assert = require('assert');
const fs = require('fs');
const P = require('../js/portfolio.js');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const d = JSON.parse(fs.readFileSync('data/portfolio.json', 'utf8'));
ok(Array.isArray(d.items) && d.items.length >= 1, '공개 목록 있음');
for (const x of d.items) ok(x.id && x.date >= P.SINCE && x.title && (x.html || (x.files && x.files.length)), x.id + ' 필수 필드');
for (const x of d.items) ok(!x.thumb || fs.existsSync(x.thumb), x.id + ' 썸네일 파일');
ok(d.items.find((x) => x.vsNo === '152').html.includes('main-box'), '152 코드');
ok(d.items.every((x, i, a) => !i || a[i - 1].date >= x.date), '최신순 정렬');
ok(d.items.some((x) => x.vsNo === '152'), 'vs_no 152');
const rows = P.parseCSV('날짜,제목,분류\n2025-09-01,"가, 나",전망\n');
ok(rows.length === 1 && rows[0].date === '2025-09-01' && rows[0].title === '가, 나', 'CSV');
console.log('portfolio tests passed:', n);
