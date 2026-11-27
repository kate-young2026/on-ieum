// node tests/standards-search.test.cjs — 단원 찾기 검색 엔진 + MCP 서버
const assert = require('assert');
const fs = require('fs');
const { spawnSync } = require('child_process');
const S = require('../js/standards-search.js');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

ok(S.unitKey('[4과01-02]').key === '4과01', 'unitKey 초등');
ok(S.unitKey('[12기하01-01]').key === '12기하01', 'unitKey 고등');
ok(S.unitKey('[10공수2-03-05]').key === '10공수2-03', 'unitKey 공통수학');
ok(S.gradeNum('중2') === 8 && S.gradeNum('고1') === 10 && S.gradeNum('초5') === 5 && S.gradeNum(3) === 3, 'gradeNum');
ok(S.gbHas('3-4', 4) && !S.gbHas('3-4', 5) && S.gbHas('10', 10), 'gbHas');

const idx = JSON.parse(fs.readFileSync('data/standards/index.json', 'utf8'));
const search = JSON.parse(fs.readFileSync('data/standards/search.json', 'utf8'));
const R = S.fromIndex(search, idx);
ok(R.length === idx.total.elem + idx.total.sec, 'search.json 레코드 수 = 성취기준 수 (색인이 낡았으면 node scripts/build-search-index.mjs)');

let u = S.findUnits(R, { query: '힘과 우리 생활' }).units[0];
ok(u.unitKey === '4과01' && u.unit === '힘과 우리 생활' && u.count === 4, '단원 이름으로 찾기');
u = S.findUnits(R, { query: '이차곡선' }).units[0];
ok(u.unitKey === '12기하01' && u.standards.every((s) => s.match), '영역 이름으로 찾기');
u = S.findUnits(R, { query: '광합성', level: 'middle' });
ok(u.units.length === 1 && u.units[0].unitKey === '9과12', '학교급 거르기');
u = S.findUnits(R, { subject: '과학', level: 'elem', grade: 3 });
ok(u.total === 16 && u.units[0].unitKey === '4과01', '낱말 없이 과목·학년 단원 목록');
ok(S.searchStandards(R, { query: '[4국03-01]' }).results[0].code === '[4국03-01]', '코드 정확히');
ok(S.searchStandards(R, { query: '4과01' }).total === 4, '코드 앞부분');
ok(S.searchStandards(R, { query: '문단', grade: '초3' }).results.every((r) => r.gb === '3-4'), '학년 거르기');
ok(S.searchStandards(R, { query: '없는낱말쀍' }).total === 0, '없는 낱말');

// MCP 서버: stdio JSON-RPC 왕복
const lines = [
  { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '0' } } },
  { jsonrpc: '2.0', method: 'notifications/initialized' },
  { jsonrpc: '2.0', id: 2, method: 'tools/list' },
  { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'find_unit', arguments: { query: '분수의 덧셈과 뺄셈', grade: 4, limit: 2 } } },
  { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'get_standard', arguments: { code: '4국03-01' } } },
  { jsonrpc: '2.0', id: 5, method: 'nope' }
].map((x) => JSON.stringify(x)).join('\n') + '\n';
const p = spawnSync(process.execPath, ['mcp/server.mjs'], { input: lines, encoding: 'utf8' });
const out = p.stdout.trim().split('\n').map((l) => JSON.parse(l));
ok(out.length === 5, 'MCP: 알림에는 답하지 않음');
ok(out[0].result.serverInfo.name === 'on-ieum-standards', 'MCP initialize');
ok(out[1].result.tools.map((t) => t.name).join() === 'find_unit,search_standards,get_standard,list_subjects', 'MCP tools/list');
ok(out[2].result.structuredContent.units[0].codePrefix === '4수01', 'MCP find_unit');
ok(out[3].result.structuredContent.evidence.length > 0 && out[3].result.content[0].text.includes('[4국03-01]'), 'MCP get_standard');
ok(out[4].error.code === -32601, 'MCP 없는 메서드');
// 기사 → 교실: 낱말 후보
const kw = S.newsKeywords(R, '교실 속 생성형 AI, 광합성 실험 수업', '');
ok(kw.some((k) => k.word === '인공지능') && kw.some((k) => k.word === '광합성') && kw.every((k) => k.count > 0 && k.count <= 200), '기사 제목에서 단원 낱말 후보');
console.log('standards-search tests passed:', n);
