// 단원 찾기를 MCP 서버(mcp/server.mjs)로 실제 실행해 보는 작은 클라이언트.
// 사용: node scripts/find-unit.mjs "초등 3학년 분수"
import { spawn } from 'node:child_process';
import path from 'node:path';
import readline from 'node:readline';

const query = process.argv.slice(2).join(' ') || '초등 3학년 분수';
const server = spawn(process.execPath, [path.resolve(path.dirname(new URL(import.meta.url).pathname), '../mcp/server.mjs')], { stdio: ['pipe', 'pipe', 'inherit'] });
const pending = new Map();
let id = 0;
readline.createInterface({ input: server.stdout }).on('line', (l) => { const m = JSON.parse(l); pending.get(m.id)?.(m); pending.delete(m.id); });
const rpc = (method, params) => new Promise((res) => { const i = ++id; pending.set(i, res); server.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: i, method, params }) + '\n'); });

const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'find-unit-cli', version: '0' } });
server.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
const tools = await rpc('tools/list', {});
console.log('MCP 서버:', init.result.serverInfo.name, '| 도구:', tools.result.tools.map((t) => t.name).join(', '));
const found = JSON.parse((await rpc('tools/call', { name: 'find_unit', arguments: { query, limit: 5 } })).result.content[0].text);
console.log(`\n"${query}" → 단원 ${found.total}개${found.partialMatch ? ' (부분 일치)' : ''}`);
for (const u of found.units) console.log(` #${u.id} ${u.label}  (${u.standards.length}개 성취기준)`);
if (found.units[0]) {
  const u = JSON.parse((await rpc('tools/call', { name: 'get_unit', arguments: { id: found.units[0].id } })).result.content[0].text);
  console.log(`\n첫 단원 성취기준 — ${u.label}`);
  for (const s of u.standards) console.log(` ${s.code} ${s.text}`);
  console.log(' 교실에서 열기:', u.link);
}
server.kill();
