// node tests/album.test.cjs — 가족 앨범북: 비밀번호·날짜 읽기·쪽 배치, 그리고 저장소에 가족 사진이 없는지
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const A = require('../js/album.js');
const crypto = require('crypto');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

// SHA-256이 표준과 같고, 비밀번호 1111이 맞음
for (const s of ['', 'abc', 'onieum-album:1111', '가족'.repeat(40), 'x'.repeat(55), 'x'.repeat(64)]) ok(A.sha256(s) === crypto.createHash('sha256').update(s).digest('hex'), 'sha256 ' + s.length);
ok(A.pinHash('1111') === A.DEFAULT_PIN_HASH, '비밀번호 1111');
ok(A.pinHash('1112') !== A.DEFAULT_PIN_HASH, '다른 비밀번호는 안 열림');
const js = fs.readFileSync('js/album.js', 'utf8');
ok(!/['"]1111['"]/.test(js), '비밀번호를 글자 그대로 적지 않음');

// 파일 이름에서 날짜
ok(A.dateFromName('20220608_173912.jpg').date === '2022-06-08' && A.dateFromName('20220608_173912.jpg').time === '17:39', '갤럭시 이름');
ok(A.dateFromName('IMG_20210925_134457.jpg').date === '2021-09-25', 'IMG_ 이름');
ok(A.dateFromName('KakaoTalk_20230101_120000123.jpg').date === '2023-01-01', '카카오톡 이름');
ok(A.dateFromName('사진 2020-10-16 16.12.42.png').date === '2020-10-16', '날짜 구분자');
ok(A.dateFromName('IMG_1234.JPG') === null && A.dateFromName('20221340_000000.jpg') === null, '날짜 아님');

// 성장앨범 나이
ok(A.ageLabel('2015-03-10', '2022-06-08') === '만 7살 2개월', '만 나이');
ok(A.ageLabel('2022-01-10', '2022-03-09') === '생후 1개월', '개월');
ok(A.ageLabel('2022-01-10', '2022-01-20') === '생후 10일', '일');
ok(A.ageLabel('2022-01-10', '2021-01-20') === '' && A.ageLabel('', '2022-01-01') === '', '기준일 없거나 앞이면 빈칸');

// 쪽 배치: 모든 사진이 순서대로 한 번씩, 한 쪽에 1~4장, 마지막 쪽에 4장 뒤 1장만 남지 않음
const LAY = ['one', 'one-wide', 'two-side', 'two-stack', 'three-left', 'three-top', 'four'];
for (let len = 0; len <= 60; len++) {
  const ph = Array.from({ length: len }, (_, i) => ({ id: 'p' + i, w: i % 3 ? 900 : 1600, h: i % 3 ? 1200 : 900 }));
  const pages = A.paginate(ph), flat = pages.flatMap((p) => p.photos.map((x) => x.id));
  ok(flat.join() === ph.map((x) => x.id).join(), len + '장 모두 순서대로');
  ok(pages.every((p) => p.photos.length >= 1 && p.photos.length <= 4 && LAY.includes(p.layout)), len + '장 틀');
  ok(pages.every((p) => +({ one: 1, 'one-wide': 1, 'two-side': 2, 'two-stack': 2, 'three-left': 3, 'three-top': 3, four: 4 })[p.layout] === p.photos.length), len + '장 틀과 장수 일치');
}
const byId = { a: { id: 'a', w: 1, h: 2, date: '2022-01-01' }, b: { id: 'b', w: 2, h: 1, date: '2022-02-01' } };
const bp = A.bookPages({ photoIds: ['a', 'b', 'gone'], cover: 'b' }, byId);
ok(bp[0].kind === 'cover' && bp[0].photo.id === 'b' && bp[1].kind === 'intro' && bp[bp.length - 1].kind === 'end' && bp[bp.length - 1].count === 2, '표지·머리말·끝, 지운 사진은 빠짐');
ok(A.dateRange([byId.b, byId.a]) === '2022.01.01 – 2022.02.01', '날짜 범위');
ok(A.TYPES.some((t) => t.name === '성장앨범') && A.TYPES.some((t) => t.name === '가족앨범'), '앨범 종류');

// 공개 저장소에 가족 사진을 올리지 않음: 그림 파일은 서재 포트폴리오(assets/portfolio)에만
const imgs = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name === '.git' || e.name === 'node_modules') continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(jpe?g|png|heic|webp|gif)$/i.test(e.name)) imgs.push(p.split(path.sep).join('/')); } })('.');
ok(imgs.every((p) => p.startsWith('assets/portfolio/')), '사진 파일은 assets/portfolio 밖에 없음: ' + imgs.filter((p) => !p.startsWith('assets/portfolio/')).join(', '));
ok(!/^\d{8}_\d{6}/m.test(fs.readdirSync('.', { recursive: true }).map(String).filter((p) => !p.startsWith('.git')).map((p) => path.basename(p)).join('\n')), '폰 사진 이름의 파일이 없음');
const html = fs.readFileSync('rooms/album.html', 'utf8');
ok(/id="gate"/.test(html) && /<div class="r-app" id="albumApp" hidden>/.test(html), '잠금 화면이 먼저, 앨범은 숨김');
ok(/indexedDB\.open\('onieum-album'/.test(js) && !/fetch\(/.test(js), '사진은 브라우저 IndexedDB에만, 서버로 보내지 않음');
console.log('album tests passed:', n);
