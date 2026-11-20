// 성취기준 MCP 두 저장소의 데이터를 교실 화면용 JSON으로 줄여 data/standards 에 쓴다.
// 사용: node scripts/build-standards.mjs <초등 레포 경로> <중등 레포 경로>
// 출처: taehyeonglim/korean-elementary-learning-map-mcp (MIT), raphysicst-create/korean-secondary-learning-map-mcp (MIT)
import fs from 'node:fs';
import path from 'node:path';

const [elemRoot, secRoot] = process.argv.slice(2);
if (!elemRoot || !secRoot) { console.error('usage: node scripts/build-standards.mjs <elem-repo> <sec-repo>'); process.exit(1); }
const OUT = path.resolve('data/standards');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const clip = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s || '');
const safe = (s) => s.replace(/[^0-9A-Za-z가-힣]+/g, '_').replace(/^_|_$/g, '');
const codeOf = (key) => key.slice(key.indexOf(':') + 1);

const index = [];
let total = { elem: 0, sec: 0 };

// ---------- 초등 ----------
{
  const d = path.join(elemRoot, 'data/kr');
  const texts = read(path.join(d, 'standard-texts.json')).texts;
  const topics = read(path.join(d, 'topics.json')).topics;
  const deps = read(path.join(d, 'dependencies.json')).dependencies;
  const topicStd = {};
  const byCode = {};
  for (const t of topics) {
    const code = t.sourceStandardCode || (t.standards && codeOf(t.standards[0]));
    if (!code) continue;
    topicStd[t.id] = code;
    const s = (byCode[code] ||= { subject: t.subjectKorean, gb: t.gradeBand, domain: t.domainKorean, area: t.curriculumAreaKorean, topics: [] });
    s.topics.push({ t: clip(t.titleKorean || t.title, 90), ty: t.type, ev: (t.evidence || []).slice(0, 3).map((x) => clip(x, 220)), ap: [].concat(t.assessmentPrompt || []).slice(0, 2).map((x) => clip(x, 260)) });
  }
  const pre = {};
  for (const e of deps) {
    const a = topicStd[e.topicId], b = topicStd[e.prerequisiteId];
    if (a && b && a !== b) (pre[a] ||= new Set()).add(b);
  }
  const subjects = {};
  for (const x of texts) {
    const s = byCode[x.code] || {};
    const subj = s.subject || '기타';
    (subjects[subj] ||= []).push({
      code: x.code, gb: s.gb || '', domain: s.domain || '', area: s.area || '', text: x.text,
      textCheck: x.locator !== 'pattern-match' || /[가-힣]다\.$/.test(x.text.trim()) ? undefined : true,
      pre: pre[x.code] ? [...pre[x.code]] : undefined, topics: s.topics || []
    });
  }
  for (const [subj, list] of Object.entries(subjects)) {
    list.sort((a, b) => a.code.localeCompare(b.code, 'ko'));
    const file = `elem/${safe(subj)}.json`;
    fs.mkdirSync(path.join(OUT, 'elem'), { recursive: true });
    fs.writeFileSync(path.join(OUT, file), JSON.stringify({ level: 'elem', subject: subj, standards: list }));
    index.push({ level: 'elem', group: subj, subject: subj, file, count: list.length, gbs: [...new Set(list.map((s) => s.gb).filter(Boolean))].sort() });
    total.elem += list.length;
  }
}

// ---------- 중등 ----------
{
  const d = path.join(secRoot, 'data/kr');
  const curricula = read(path.join(d, 'curriculum-standards.json')).curricula;
  const texts = Object.fromEntries(read(path.join(d, 'standard-texts.json')).texts.map((t) => [t.key, t.text]));
  const topics = read(path.join(d, 'topics.json')).topics;
  const deps = read(path.join(d, 'dependencies.json')).dependencies;
  const trans = read(path.join(d, 'transitions.json')).transitions;
  const byKey = {}, topicKey = {};
  for (const t of topics) for (const k of t.standards || []) {
    topicKey[t.id] ||= k;
    (byKey[k] ||= []).push({ t: clip(t.titleKorean, 90), ty: (t.types || []).join(','), ev: (t.evidence || []).slice(0, 3).map((x) => clip(x, 220)), ap: (t.assessmentPrompts || []).slice(0, 2).map((x) => clip(x, 260)) });
  }
  const pre = {};
  for (const e of deps) { const a = topicKey[e.topicId], b = topicKey[e.prerequisiteId]; if (a && b && a !== b) (pre[a] ||= new Set()).add(codeOf(b)); }
  const next = {};
  for (const t of trans) {
    const froms = (t.fromTopicIds || []).map((id) => topicKey[id]).filter(Boolean);
    const tos = (t.toTopicIds || []).map((id) => topicKey[id]).filter(Boolean);
    for (const f of froms) for (const to of tos) (next[f] ||= new Set()).add(codeOf(to));
  }
  fs.mkdirSync(path.join(OUT, 'sec'), { recursive: true });
  for (const c of curricula) {
    const list = c.standards.map((s) => ({
      code: s.code, gb: s.gradeBand, domain: s.domainKorean || '', text: texts[s.key] || s.summary || '',
      pre: pre[s.key] ? [...pre[s.key]] : undefined, next: next[s.key] ? [...next[s.key]] : undefined,
      topics: (byKey[s.key] || []).slice(0, 6)
    }));
    const file = `sec/${safe(c.id.replace(/^kr-2022-/, ''))}.json`;
    fs.writeFileSync(path.join(OUT, file), JSON.stringify({ level: c.schoolLevel, subject: c.subjectKorean, group: c.subjectGroupKorean, category: c.courseCategory, standards: list }));
    index.push({ level: c.schoolLevel, group: c.subjectGroupKorean, subject: c.subjectKorean, category: c.courseCategory, file, count: list.length, gbs: [c.gradeBand] });
    total.sec += list.length;
  }
}

const codes = {};
index.forEach((c, i) => { const d = JSON.parse(fs.readFileSync(path.join(OUT, c.file), 'utf8')); d.standards.forEach((s) => { if (!(s.code in codes)) codes[s.code] = i; }); });
fs.writeFileSync(path.join(OUT, 'codes.json'), JSON.stringify(codes));
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), total, courses: index }, null, 0));
console.log('standards:', total, 'files:', index.length);
