#!/usr/bin/env node
// 온-이음 교실 성취기준 MCP 서버 (stdio, 의존성 없음)
// 초등·중등 성취기준 MCP 데이터로 만든 단원 색인(data/standards/units.json)에서 "단원 찾기"를 한다.
// Claude Desktop 등록 예: { "mcpServers": { "on-ieum-classroom": { "command": "node", "args": ["<저장소 경로>/mcp/server.mjs"] } } }
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const require = createRequire(import.meta.url);
const U = require(path.join(ROOT, 'js/units.js'));
const STD = path.join(ROOT, 'data/standards');
const read = (f) => JSON.parse(fs.readFileSync(path.join(STD, f), 'utf8'));
const units = read('units.json').units;
const idx = read('index.json');
const codes = read('codes.json');
const SITE = 'https://kate-young2026.github.io/on-ieum/rooms/classroom.html';

const fileCache = {};
function standard(code) {
  let c = String(code || '').trim();
  if (!c.startsWith('[')) c = '[' + c + ']';
  const i = codes[c];
  if (i == null) return null;
  const course = idx.courses[i];
  const d = (fileCache[course.file] ||= read(course.file));
  const s = d.standards.find((x) => x.code === c);
  return s && { code: s.code, level: course.level, subject: course.subject, gradeBand: s.gb, domain: s.domain, text: s.text, topics: (s.topics || []).map((t) => t.t), pre: s.pre, next: s.next, link: SITE + '#' + encodeURIComponent(s.code) };
}
const unitOut = (u, withStd) => ({
  id: u.id, label: U.label(u), level: U.LV[u.lv], subject: u.s, gradeBand: u.gb, domain: u.d, unit: u.u || null,
  standards: withStd ? u.codes.map((c) => { const s = standard(c); return s ? { code: s.code, text: s.text, link: s.link } : { code: c }; }) : u.codes,
  link: SITE + '#' + encodeURIComponent(u.codes[0])
});

const TOOLS = [
  {
    name: 'find_unit',
    description: '낱말·학년으로 교육과정 단원(교과·학년군·영역·단원)을 찾는다. 예: "초등 3학년 분수", "중2 일차함수", "고1 논증". 결과마다 성취기준 코드와 교실 화면 링크를 준다.',
    inputSchema: { type: 'object', properties: {
      query: { type: 'string', description: '찾을 낱말. "3학년", "중2", "고1" 같은 학년 표현을 넣으면 학교급·학년군으로 좁힌다.' },
      level: { type: 'string', enum: ['elem', 'middle', 'high'], description: '학교급(선택)' },
      gradeBand: { type: 'string', description: '학년군(선택): 1-2, 3-4, 5-6, 7-9, 10, 10-12' },
      limit: { type: 'number', description: '최대 결과 수(기본 10, 최대 50)' }
    }, required: ['query'] }
  },
  {
    name: 'get_unit',
    description: 'find_unit이 준 단원 id로 그 단원의 성취기준 원문 목록을 가져온다.',
    inputSchema: { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] }
  },
  {
    name: 'get_standard',
    description: '성취기준 코드(예: [4수01-10], 10공국1-05-02)의 원문·영역·세부 주제·선수/후속 성취기준을 가져온다.',
    inputSchema: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] }
  }
];

function call(name, a = {}) {
  if (name === 'find_unit') {
    const r = U.findUnits(units, a.query, { level: a.level, gradeBand: a.gradeBand, limit: a.limit || 10 });
    return { query: a.query, understood: { level: r.level || null, gradeBand: r.gradeBand || null, words: r.words }, partialMatch: r.partial, total: r.total, units: r.results.map((u) => unitOut(u, false)) };
  }
  if (name === 'get_unit') {
    const u = units[a.id];
    if (!u) throw new Error('없는 단원 id: ' + a.id);
    return unitOut(u, true);
  }
  if (name === 'get_standard') {
    const s = standard(a.code);
    if (!s) throw new Error('성취기준 코드를 찾지 못했어요: ' + a.code);
    return s;
  }
  throw new Error('모르는 도구: ' + name);
}

const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  if (!line.trim()) return;
  let m;
  try { m = JSON.parse(line); } catch { return send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); }
  const reply = (result) => m.id != null && send({ jsonrpc: '2.0', id: m.id, result });
  const fail = (code, message) => m.id != null && send({ jsonrpc: '2.0', id: m.id, error: { code, message } });
  switch (m.method) {
    case 'initialize':
      return reply({ protocolVersion: (m.params && m.params.protocolVersion) || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'on-ieum-classroom', version: '0.1.0' },
        instructions: '교실 성취기준 단원 찾기. find_unit으로 단원을 찾고, get_unit/get_standard로 원문을 확인한 뒤 수업을 설계하세요. 성취기준 코드는 이 서버가 돌려준 것만 쓰세요.' });
    case 'ping': return reply({});
    case 'tools/list': return reply({ tools: TOOLS });
    case 'tools/call':
      try {
        const out = call(m.params.name, m.params.arguments);
        return reply({ content: [{ type: 'text', text: JSON.stringify(out, null, 1) }] });
      } catch (e) {
        return reply({ content: [{ type: 'text', text: String(e.message || e) }], isError: true });
      }
    default:
      if (m.method && m.method.startsWith('notifications/')) return;
      return fail(-32601, 'Method not found: ' + m.method);
  }
});
