// 성취기준 MCP 두 저장소의 데이터로 '단원' 색인(data/standards/units.json)을 만든다.
// 단원 = 교과 · 학년군 · 영역 · (MCP 데이터에 단원/모듈 이름이 있으면 그 이름) 으로 묶은 성취기준 묶음.
// 사용: node scripts/build-units.mjs <초등 레포 경로> <중등 레포 경로>   (build-standards.mjs 다음에 실행)
import fs from 'node:fs';
import path from 'node:path';

const [elemRoot, secRoot] = process.argv.slice(2);
if (!elemRoot || !secRoot) { console.error('usage: node scripts/build-units.mjs <elem-repo> <sec-repo>'); process.exit(1); }
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const OUT = path.resolve('data/standards');
const idx = read(path.join(OUT, 'index.json'));
const codes = read(path.join(OUT, 'codes.json'));
const clip = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s || '');
const textOf = {};
for (const c of idx.courses) for (const s of read(path.join(OUT, c.file)).standards) textOf[s.code] ||= s.text;

const units = [];
const add = (key, rec) => {
  let u = units.find((x) => x.key === key);
  if (!u) { u = { key, ...rec, codes: [] }; units.push(u); }
  return u;
};

// 초등: 수학은 module, 과학은 unit 이 단원 이름. 나머지 교과는 영역(MCP 클러스터와 같은 단위)으로 묶는다.
{
  const d = path.join(elemRoot, 'data/kr');
  for (const cur of read(path.join(d, 'curriculum-standards.json')).curricula) {
    for (const s of cur.standards) {
      const name = s.unit || s.module || '';
      const key = ['elem', s.subjectKorean, s.gradeBand, s.domainKorean || s.strandKorean, name].join('|');
      const u = add(key, { lv: 'elem', s: s.subjectKorean, gb: s.gradeBand, d: s.domainKorean || s.strandKorean || '영역', u: name });
      u.codes.push(s.code);
    }
  }
}
// 중등: 과목 · 영역 단위(MCP 클러스터와 같은 단위)
{
  const d = path.join(secRoot, 'data/kr');
  for (const cur of read(path.join(d, 'curriculum-standards.json')).curricula) {
    for (const s of cur.standards) {
      const key = [cur.schoolLevel, cur.subjectKorean, s.gradeBand, s.domainKorean || '영역'].join('|');
      const u = add(key, { lv: cur.schoolLevel, s: cur.subjectKorean, g: cur.subjectGroupKorean, gb: s.gradeBand, d: s.domainKorean || '영역', u: '' });
      u.codes.push(s.code);
    }
  }
}

const out = units.map((u, i) => {
  const rec = { id: i, lv: u.lv, s: u.s, gb: u.gb, d: u.d, codes: u.codes, c: codes[u.codes[0]] };
  if (u.g && u.g !== u.s) rec.g = u.g;
  if (u.u) rec.u = u.u;
  rec.t = u.codes.map((c) => clip(textOf[c] || '', 70)).join(' / ');
  return rec;
});
fs.writeFileSync(path.join(OUT, 'units.json'), JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), count: out.length, units: out }));
console.log('units:', out.length, 'named:', out.filter((u) => u.u).length, 'bytes:', fs.statSync(path.join(OUT, 'units.json')).size);
