// node tests/units.test.cjs — 단원 찾기 규칙과 MCP 서버(stdio)를 실제로 띄워 확인
const assert = require('assert');
const { spawnSync } = require('child_process');
const U = require('../js/units.js');
const units = require('../data/standards/units.json').units;
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const p = U.parseQuery('초등 3학년 분수 단원');
ok(p.level === 'elem' && p.gradeBand === '3-4' && p.words.join() === '분수', '학년 해석');
ok(U.parseQuery('중2 일차함수').level === 'middle', '중2');
ok(U.parseQuery('고1 논증').level === 'high', '고1');
const r = U.findUnits(units, '초등 3학년 분수');
ok(r.results[0].u === '분수' && r.results[0].codes.includes('[4수01-10]'), '분수 단원 1위');
ok(U.findUnits(units, '광합성').results.some((u) => u.lv === 'middle'), '중학교 광합성');
ok(U.findUnits(units, '4수01-10').results[0].codes.includes('[4수01-10]'), '코드로 찾기');
ok(U.findUnits(units, '인물 대화 소설').partial === true, '부분 일치');
ok(units.every((u) => u.c != null && u.codes.length && u.d), '모든 단원에 과목 파일·영역');
const total = units.reduce((a, u) => a + u.codes.length, 0);
ok(total === 620 + 3838, '단원 성취기준 합계 ' + total);

const msgs = [
  { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '0' } } },
  { jsonrpc: '2.0', method: 'notifications/initialized' },
  { jsonrpc: '2.0', id: 2, method: 'tools/list' },
  { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'find_unit', arguments: { query: '중2 일차함수' } } },
  { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'get_standard', arguments: { code: '10공국1-05-02' } } },
  { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'get_standard', arguments: { code: 'x' } } }
];
const out = spawnSync(process.execPath, ['mcp/server.mjs'], { input: msgs.map((m) => JSON.stringify(m)).join('\n') + '\n', encoding: 'utf8' });
const res = Object.fromEntries(out.stdout.trim().split('\n').map((l) => JSON.parse(l)).map((m) => [m.id, m]));
ok(res[1].result.serverInfo.name === 'on-ieum-classroom', 'MCP initialize');
ok(res[2].result.tools.map((t) => t.name).join() === 'find_unit,get_unit,get_standard', 'MCP tools/list');
const f = JSON.parse(res[3].result.content[0].text);
ok(f.units[0].domain === '변화와 관계' && f.units[0].standards.includes('[9수02-15]'), 'MCP find_unit');
ok(JSON.parse(res[4].result.content[0].text).subject === '공통국어1', 'MCP get_standard');
ok(res[5].result.isError === true, 'MCP 오류 응답');
console.log('units tests passed:', n);
