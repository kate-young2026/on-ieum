#!/usr/bin/env node
// 온-이음 성취기준 MCP 서버 (stdio, 의존성 없음)
// 초등 620 · 중등 3,838개 성취기준(data/standards)에서 단원과 성취기준을 찾는다.
// 실행: node mcp/server.mjs   ·   점검: node mcp/server.mjs --selftest
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const S = require('../js/standards-search.js');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'data/standards');
const SITE = 'https://kate-young2026.github.io/on-ieum/rooms/classroom.html';
const VERSION = '1.0.0';
const PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];

// ---------- 데이터 ----------
const idx = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'));
const full = {}; // code → 원본 성취기준(지표 포함)
const recs = [];
for (const meta of idx.courses) {
  const course = JSON.parse(fs.readFileSync(path.join(DIR, meta.file), 'utf8'));
  for (const s of course.standards) if (!full[s.code]) full[s.code] = { std: s, meta };
  recs.push(...S.toRecords(course, meta));
}

// ---------- 도구 ----------
const FILTERS = {
  level: { type: 'string', description: '학교급: elem(초등) | middle(중학교) | high(고등학교). 한글(초등·중학교·고등학교)도 됩니다.' },
  subject: { type: 'string', description: '과목 또는 교과군 이름 일부 (예: 국어, 과학, 공통수학1, 기하)' },
  grade: { type: ['integer', 'string'], description: '학년. 1~12 숫자 또는 "초5", "중2", "고1"' },
  gb: { type: 'string', description: '학년군 그대로 (예: "3-4", "7-9", "10-12")' }
};
const TOOLS = [
  {
    name: 'find_unit',
    title: '단원 찾기',
    description: '단원 이름·주제어(예: "힘과 우리 생활", "분수의 덧셈", "광합성", "이차곡선")로 단원을 찾고, 그 단원에 속한 성취기준 전체를 돌려줍니다. query 없이 과목·학년만 주면 그 과목의 단원 목록을 돌려줍니다. 단원은 성취기준 코드의 앞부분(예: [4과01-..])으로 묶은 것입니다.',
    inputSchema: { type: 'object', properties: { query: { type: 'string', description: '단원 이름이나 주제어' }, ...FILTERS, limit: { type: 'integer', minimum: 1, maximum: 50, default: 8 } } }
  },
  {
    name: 'search_standards',
    title: '성취기준 찾기',
    description: '낱말·코드로 성취기준을 찾습니다. 코드(예: "[4국03-01]", "4과01")는 앞부분만 넣어도 됩니다. 과목·학교급·학년으로 좁힐 수 있습니다.',
    inputSchema: { type: 'object', properties: { query: { type: 'string', description: '낱말 또는 성취기준 코드' }, ...FILTERS, limit: { type: 'integer', minimum: 1, maximum: 200, default: 20 } } }
  },
  {
    name: 'get_standard',
    title: '성취기준 자세히',
    description: '성취기준 코드 하나의 문장, 영역·단원, 세부 주제, 관찰 증거(지표), 평가 질문 예, 먼저 배울·이어 배울 성취기준을 돌려줍니다.',
    inputSchema: { type: 'object', properties: { code: { type: 'string', description: '예: [4국03-01] (대괄호는 없어도 됨)' } }, required: ['code'] }
  },
  {
    name: 'list_subjects',
    title: '과목 목록',
    description: '학교급별 과목과 학년군, 성취기준 수를 돌려줍니다.',
    inputSchema: { type: 'object', properties: { level: FILTERS.level } }
  }
];

const link = (code) => SITE + '#' + encodeURIComponent(code);
function normCode(c) { c = String(c || '').trim().replace(/\s/g, ''); return c.startsWith('[') ? c : '[' + c.replace(/\]$/, '') + ']'; }

const HANDLERS = {
  find_unit(a) {
    const r = S.findUnits(recs, a);
    const units = r.units.map((u) => ({ unit: u.unit, title: u.title, level: u.level, subject: u.subject, gb: u.gb, codePrefix: u.unitKey, matched: u.matched, count: u.count, standards: u.standards.map((s) => ({ code: s.code, text: s.text, match: s.match, link: link(s.code) })) }));
    const text = units.length
      ? `단원 ${r.total}개 중 ${units.length}개\n\n` + units.map((u, i) => `${i + 1}. ${u.title}  (코드 [${u.codePrefix}-..], 성취기준 ${u.count}개${a.query ? `, 맞는 것 ${u.matched}개` : ''})\n` +
        u.standards.map((s) => `   ${s.match && a.query ? '★' : '-'} ${s.code} ${s.text}`).join('\n')).join('\n\n')
      : '맞는 단원이 없어요. 낱말을 줄이거나 과목·학년 조건을 빼 보세요.';
    return { text, data: { total: r.total, units } };
  },
  search_standards(a) {
    const r = S.searchStandards(recs, a);
    const results = r.results.map((x) => ({ code: x.code, level: x.level, subject: x.subject, gb: x.gb, domain: x.domain, unit: x.unit, text: x.text, link: link(x.code) }));
    const text = results.length
      ? `성취기준 ${r.total}개 중 ${results.length}개\n\n` + results.map((x) => `${x.code} [${S.LEVEL_KO[x.level]} ${x.subject} ${x.gb} · ${x.unit}] ${x.text}`).join('\n')
      : '맞는 성취기준이 없어요.';
    return { text, data: { total: r.total, results } };
  },
  get_standard(a) {
    const code = normCode(a.code), hit = full[code];
    if (!hit) {
      const near = S.searchStandards(recs, { query: code, limit: 5 }).results.map((x) => x.code);
      return { text: `${code}를 찾지 못했어요.${near.length ? ' 비슷한 코드: ' + near.join(', ') : ''}`, data: { found: false, suggestions: near }, isError: true };
    }
    const { std: s, meta } = hit, ev = [], ap = [];
    for (const t of s.topics || []) { for (const x of t.ev || []) if (!ev.includes(x)) ev.push(x); for (const x of t.ap || []) if (!ap.includes(x)) ap.push(x); }
    const unit = S.unitName(s);
    const data = { found: true, code: s.code, level: meta.level, subject: meta.subject, group: meta.group, gb: s.gb, domain: s.domain, unit, text: s.text, topics: (s.topics || []).map((t) => t.t), evidence: ev, assessmentPrompts: ap, prerequisites: s.pre || [], next: s.next || [], link: link(s.code), textCheck: !!s.textCheck };
    const text = [
      `${s.code} ${s.text}`,
      `${S.LEVEL_KO[meta.level]} ${meta.subject} · ${s.gb} · 영역 ${s.domain}${unit !== s.domain ? ' · 단원 ' + unit : ''}`,
      s.textCheck ? '※ 원문 추출이 불완전할 수 있어요. NCIC 원문과 대조가 필요합니다.' : '',
      ev.length ? '\n관찰 증거(지표):\n' + ev.map((x) => '- ' + x).join('\n') : '',
      ap.length ? '\n평가 질문 예:\n' + ap.slice(0, 4).map((x) => '- ' + x).join('\n') : '',
      data.prerequisites.length ? '\n먼저 배울 것: ' + data.prerequisites.join(', ') : '',
      data.next.length ? '이어서 배울 것: ' + data.next.join(', ') : '',
      '\n교실에서 열기: ' + data.link,
      '출처: 교육부·국가교육위원회 고시 교육과정(NCIC). 지표·평가 질문은 학습맵 MCP 데이터(MIT)이며 공식 산출물이 아닙니다.'
    ].filter(Boolean).join('\n');
    return { text, data };
  },
  list_subjects(a) {
    const lv = S.levelOf(a.level);
    const list = idx.courses.filter((c) => !lv || c.level === lv).map((c) => ({ level: c.level, group: c.group, subject: c.subject, gbs: c.gbs, count: c.count }));
    const text = list.map((c) => `${S.LEVEL_KO[c.level]} · ${c.group} · ${c.subject} (${c.gbs.join(', ')}) ${c.count}개`).join('\n');
    return { text: `과목 ${list.length}개\n` + text, data: { total: list.length, subjects: list } };
  }
};

export function callTool(name, args) {
  const h = HANDLERS[name];
  if (!h) throw Object.assign(new Error('알 수 없는 도구: ' + name), { code: -32602 });
  const r = h(args || {});
  return { content: [{ type: 'text', text: r.text }], structuredContent: r.data, isError: !!r.isError };
}

// ---------- JSON-RPC (stdio, 줄마다 메시지 하나) ----------
export function handle(msg) {
  const { id, method, params } = msg;
  const ok = (result) => ({ jsonrpc: '2.0', id, result });
  const fail = (code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });
  if (id === undefined) return null; // 알림(notifications/initialized 등)은 답하지 않는다
  try {
    switch (method) {
      case 'initialize': {
        const want = params && params.protocolVersion;
        return ok({
          protocolVersion: PROTOCOLS.includes(want) ? want : PROTOCOLS[0],
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'on-ieum-standards', title: '온-이음 성취기준', version: VERSION },
          instructions: '2022 개정 교육과정 성취기준(초등 620, 중등 3,838)에서 단원·성취기준을 찾는 서버입니다. 단원을 찾을 때는 find_unit, 코드·낱말로 찾을 때는 search_standards, 자세한 지표가 필요하면 get_standard를 쓰세요.'
        });
      }
      case 'ping': return ok({});
      case 'tools/list': return ok({ tools: TOOLS });
      case 'tools/call': return ok(callTool(params && params.name, params && params.arguments));
      case 'resources/list': return ok({ resources: [] });
      case 'prompts/list': return ok({ prompts: [] });
      default: return fail(-32601, 'Method not found: ' + method);
    }
  } catch (e) {
    return fail(e.code || -32603, e.message);
  }
}

function selftest() {
  const out = [];
  const r1 = handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'selftest', version: '0' } } });
  out.push('initialize → ' + r1.result.serverInfo.name + ' ' + r1.result.protocolVersion);
  out.push('tools → ' + handle({ jsonrpc: '2.0', id: 2, method: 'tools/list' }).result.tools.map((t) => t.name).join(', '));
  out.push(callTool('find_unit', { query: '힘과 우리 생활', limit: 1 }).content[0].text);
  out.push(callTool('search_standards', { query: '광합성', level: 'middle', limit: 3 }).content[0].text);
  out.push(callTool('get_standard', { code: '4국03-01' }).content[0].text.split('\n').slice(0, 2).join('\n'));
  console.log(out.join('\n\n'));
  console.log(`\n성취기준 ${recs.length}개 읽음 · selftest OK`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  if (process.argv.includes('--selftest')) selftest();
  else {
    const rl = readline.createInterface({ input: process.stdin });
    rl.on('line', (line) => {
      if (!line.trim()) return;
      let msg;
      try { msg = JSON.parse(line); } catch { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n'); return; }
      const batch = Array.isArray(msg) ? msg : [msg];
      const res = batch.map(handle).filter(Boolean);
      if (res.length) process.stdout.write(JSON.stringify(Array.isArray(msg) ? res : res[0]) + '\n');
    });
    console.error(`on-ieum-standards MCP 서버 준비 (성취기준 ${recs.length}개)`);
  }
}
