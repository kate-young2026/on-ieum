// node tests/plan.test.cjs — 메인·대시보드가 data/plan.json 하나를 따르는지, 공개 화면에 개인 정보가 없는지
const assert = require('assert');
const fs = require('fs');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const plan = JSON.parse(fs.readFileSync('data/plan.json', 'utf8'));
const index = fs.readFileSync('index.html', 'utf8');
const dash = fs.readFileSync('dashboard.html', 'utf8');
ok(/^v\d+\.\d+$/.test(plan.version) && /^\d{4}-\d{2}-\d{2}$/.test(plan.updated), '판본·날짜');
// index.html의 방 목록(id)과 plan.json의 house.rooms가 같다
const ids = [...index.matchAll(/^\{id:'([a-z]+)',n:/gm)].map((m) => m[1]);
ok(ids.length === plan.house.rooms.length, '방 개수 일치: ' + ids.length + ' vs ' + plan.house.rooms.length);
ok(ids.slice().sort().join() === plan.house.rooms.map((r) => r.id).sort().join(), '방 id 일치');
const inSpaces = plan.spaces.flatMap((s) => s.rooms || []);
ok(inSpaces.slice().sort().join() === ids.slice().sort().join(), '모든 방이 공간 하나에 속함');
ok(index.includes("fetch('data/plan.json'") && dash.includes("fetch('data/plan.json')"), '둘 다 plan.json을 읽음');
ok(!/방 9|우주선/.test(dash + JSON.stringify(plan)), '옛 숫자·은유가 남지 않음');
ok(plan.roadmap.every((r) => ['done', 'doing', 'plan'].includes(r.status)), '로드맵 상태');
// 공개 화면에 가족 개인 정보가 없다
for (const f of ['index.html', 'app.js', 'v03.html', 'README.md', 'data/plan.json']) {
  ok(!/마라탕|엄마 오늘|[123]번방|with JF/.test(fs.readFileSync(f, 'utf8')), f + ' 가족 정보 없음');
}
// 휴대폰 메뉴 버튼
ok(/id="menuBtn"[^>]*aria-controls="mainNav"/.test(index) && /id="mainNav"/.test(index), '모바일 메뉴 버튼');
console.log('plan tests passed:', n);
