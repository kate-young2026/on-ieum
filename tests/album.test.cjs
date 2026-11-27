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

// 디자인 템플릿 5종: 어떤 장수든 모든 사진이 순서대로, 쪽당 장수는 템플릿 한도 안
const CSS = fs.readFileSync('css/album.css', 'utf8');
ok(A.TEMPLATES.length === 5, '템플릿 5종');
for (const t of A.TEMPLATES) {
  for (const len of [1, 2, 5, 9, 20, 30, 50, 100, 101]) {
    const ph = Array.from({ length: len }, (_, i) => ({ id: 'p' + i, w: i % 5 === 1 ? 1600 : 900, h: 1200, date: '2025-' + String(1 + Math.floor(i * 12 / len)).padStart(2, '0') + '-05' }));
    const pages = A.paginate(ph, t.id), flat = pages.flatMap((p) => p.photos.map((x) => x.id));
    ok(flat.join() === ph.map((x) => x.id).join(), t.id + ' ' + len + '장 모두 순서대로');
    ok(pages.every((p) => p.photos.length >= 1 && p.photos.length <= t.max), t.id + ' ' + len + '장 쪽당 1~' + t.max);
    ok(pages.every((p) => p.layout === 'one' || p.layout === 'one-wide' || CSS.includes('.lay-' + p.layout + ' ') || CSS.includes('.lay-' + p.layout + '{') || CSS.includes('.lay-' + p.layout + ',')), t.id + ' 틀마다 CSS 있음');
    if (len >= 50 && t.id !== 'timeline') ok(pages.length < len, t.id + ' ' + len + '장은 쪽 수가 사진보다 적음');
  }
}
// 타임라인은 달이 바뀌면 새 쪽에서 시작하고 첫 쪽에 달 이름
const tl = A.paginate([{ id: 1, date: '2025-01-03', w: 1, h: 1 }, { id: 2, date: '2025-01-09', w: 1, h: 1 }, { id: 3, date: '2025-02-01', w: 1, h: 1 }], 'timeline');
ok(tl.length === 2 && tl[0].chapter === '2025-01' && tl[1].chapter === '2025-02' && tl[0].photos.length === 2, '타임라인 달마다 장');
// 장수에 맞는 추천
ok(A.recommendTemplate(20, 'family') === 'classic' && A.recommendTemplate(30, 'trip') === 'magazine' && A.recommendTemplate(50, 'family') === 'collage' && A.recommendTemplate(100, 'family') === 'grid' && A.recommendTemplate(30, 'growth') === 'timeline', '장수별 추천');
// 샘플 5권은 20·30·50·100장을 모두 쓰고, 템플릿이 다 다름
ok(A.SAMPLES.length === 5 && new Set(A.SAMPLES.map((x) => x.template)).size === 5, '샘플 5권, 템플릿 모두 다름');
ok([20, 30, 50, 100].every((n) => A.SAMPLES.some((x) => x.n === n)), '샘플 장수 20·30·50·100');
ok(A.bookPages({ photoIds: ['a'], template: 'grid' }, { a: { id: 'a', w: 1, h: 1 } })[2].layout === 'grid-1', '앨범의 템플릿을 따름');
console.log('album tests passed:', n);
