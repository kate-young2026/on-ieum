// data/standards 의 과목 파일을 모아 교실 '단원 찾기'용 가벼운 색인(search.json)을 만든다.
// 사용: node scripts/build-search-index.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const S = require('../js/standards-search.js');
const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data/standards');
const idx = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'));
const recs = [];
idx.courses.forEach((meta, ci) => {
  const course = JSON.parse(fs.readFileSync(path.join(DIR, meta.file), 'utf8'));
  for (const r of S.toRecords(course, meta)) {
    // 화면에서 다시 만들 수 있는 값은 빼고 줄인다 (c = index.json의 과목 번호)
    recs.push([ci, r.code, r.gb, r.domain, r.unit === r.domain ? '' : r.unit, r.text, r.topics.join('|')]);
  }
});
fs.writeFileSync(path.join(DIR, 'search.json'), JSON.stringify({ generatedAt: idx.generatedAt, fields: ['course', 'code', 'gb', 'domain', 'unit', 'text', 'topics'], records: recs }));
console.log('search.json:', recs.length, 'records');
