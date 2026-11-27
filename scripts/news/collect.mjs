// 뉴스 라운지 수집: 공개 RSS → 제외 키워드 → 분류·교육 관련성 점수 → 중복 제거
//   → 설명문이 없는 후보는 기사 페이지의 요약 문구(og:description)를 읽어 채움 → 상위 10 → 3줄 요약 → data/news/today.json
// 사용: node scripts/news/collect.mjs
// ANTHROPIC_API_KEY가 있으면 Claude가 3줄 요약을 쓰고, 없으면 기사 설명문 앞 세 문장으로 대신한다.
import fs from 'node:fs';
import path from 'node:path';
import { parseFeed, parseHtmlList, classify, dedupe, score, selectTop, extractLines, kstDate, headline, isExcluded, eduRelevance, metaDescription, googleNewsId } from './lib.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const DIR = path.join(ROOT, 'data/news');
const cfg = JSON.parse(fs.readFileSync(path.join(DIR, 'feeds.json'), 'utf8'));
const now = Date.now();
const today = kstDate();
const UA = 'Mozilla/5.0 (compatible; on-ieum-news/1.0; +https://github.com/kate-young2026/on-ieum)';

async function get(url, opt = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), opt.timeout || 20000);
  try {
    const r = await fetch(url, { method: opt.method || 'GET', body: opt.body, headers: Object.assign({ 'user-agent': UA, accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8', 'accept-language': 'ko-KR,ko;q=0.9,en;q=0.6' }, opt.headers || {}), signal: ctl.signal, redirect: 'follow' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const buf = await r.arrayBuffer();
    // 일부 언론사는 EUC-KR로 응답한다
    const ct = r.headers.get('content-type') || '';
    let text = new TextDecoder('utf-8').decode(buf);
    if (/euc-kr|ks_c_5601/i.test(ct) || /<meta[^>]+charset=["']?(euc-kr|ks_c_5601)/i.test(text.slice(0, 3000))) text = new TextDecoder('euc-kr').decode(buf);
    return text;
  } finally { clearTimeout(t); }
}

// 구글 뉴스 링크 → 실제 기사 주소(구글 뉴스 페이지가 쓰는 방식 그대로, 실패하면 빈 값)
async function decodeGoogle(link) {
  const id = googleNewsId(link);
  if (!id) return '';
  const html = await get('https://news.google.com/rss/articles/' + id, { timeout: 10000, headers: { accept: 'text/html' } });
  const sg = html.match(/data-n-a-sg="([^"]+)"/), ts = html.match(/data-n-a-ts="([^"]+)"/);
  if (!sg || !ts) return '';
  const inner = JSON.stringify(['garturlreq', [['X', 'X', ['X', 'X'], null, null, 1, 1, 'US:en', null, 1, null, null, null, null, null, 0, 1], 'X', 'X', 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0], id, +ts[1], sg[1]]);
  const body = 'f.req=' + encodeURIComponent(JSON.stringify([[['Fbv4je', inner]]]));
  const res = await get('https://news.google.com/_/DotsSplashUi/data/batchexecute', { method: 'POST', body, timeout: 10000, headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8' } });
  for (const line of res.split('\n')) {
    if (!line.includes('garturlres')) continue;
    try { const u = JSON.parse(JSON.parse(line)[0][2])[1]; if (/^https?:\/\//.test(u)) return u; } catch (e) { /* 형식이 바뀌면 포기 */ }
  }
  return '';
}

// 설명문이 없는 기사: 원문 페이지의 og:description을 읽어 요약 재료로 쓴다(원문 본문은 저장하지 않음)
async function enrich(it) {
  try {
    if (googleNewsId(it.link)) { const real = await decodeGoogle(it.link); if (!real) return false; it.gLink = it.link; it.link = real; }
    const html = await get(it.link, { timeout: 10000, headers: { accept: 'text/html,application/xhtml+xml' } });
    const d = metaDescription(html, it.title);
    if (d) { it.desc = d; it.descFrom = 'og'; return true; }
  } catch (e) { /* 실패하면 제목만 쓴다 */ }
  return false;
}
async function pool(list, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, list.length) }, async () => { while (i < list.length) { const k = i++; await fn(list[k]); } }));
}

const seenPath = path.join(DIR, 'seen.json');
const seen = fs.existsSync(seenPath) ? JSON.parse(fs.readFileSync(seenPath, 'utf8')) : {};

const sources = [];
const all = [];
await Promise.all(cfg.feeds.map(async (f) => {
  try {
    const body = await get(f.url);
    let items = f.type === 'html' ? parseHtmlList(body, f) : parseFeed(body, f);
    // 날짜 없는 HTML 목록을 처음 읽을 때는 맨 위 3건만 '새 글'로 본다(예전 글이 한꺼번에 들어오지 않게).
    if (f.type === 'html' && !Object.keys(seen).some((k) => k.startsWith(f.base))) items = items.slice(0, 3);
    sources.push({ name: f.name, cat: f.cat, ok: true, n: items.length });
    all.push(...items);
  } catch (e) {
    sources.push({ name: f.name, cat: f.cat, ok: false, error: String(e.message || e).slice(0, 80) });
  }
}));
sources.sort((a, b) => cfg.feeds.findIndex((f) => f.name === a.name) - cfg.feeds.findIndex((f) => f.name === b.name));

// 최근 36시간 글만. 날짜가 없는 글(HTML 목록)은 처음 본 날에만 새 글로 친다.
// 어제 이미 보낸 기사는 다시 보내지 않는다(같은 날 다시 돌리면 유지).
const fresh = all.filter((it) => {
  const first = seen[it.link];
  if (first && first !== today) return false;
  if (!it.published) return true;
  const age = now - Date.parse(it.published);
  return age < 36 * 36e5 && age > -6 * 36e5;
}).filter((it) => !isExcluded(it, cfg.exclude));
const rescore = (it) => { it.cat = classify(it); it.rel = eduRelevance(it, cfg.eduKeywords); it.score = score(it, now); };
fresh.forEach(rescore);
const cands = dedupe(fresh.sort((a, b) => b.score - a.score));
// 분야마다 앞쪽 후보 7건 중 설명문이 없는 기사만 원문 요약 문구를 읽어 온다(6개씩 동시에)
const need = Object.keys(cfg.quota).flatMap((c) => cands.filter((it) => it.cat === c && !it.desc).slice(0, 7));
let filled = 0;
await pool(need, 6, async (it) => { if (await enrich(it)) filled++; });
cands.forEach(rescore);
const top = selectTop(cands.filter((it) => !isExcluded(it, cfg.exclude)).sort((a, b) => b.score - a.score), cfg.quota, 10);

let mode = 'extract';
const lines = top.map(extractLines);
if (process.env.ANTHROPIC_API_KEY && top.length) {
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic();
    const list = top.map((it, i) => `#${i}\n제목: ${it.title}\n출처: ${it.source}\n설명: ${(it.desc || '(없음)').slice(0, 1200)}`).join('\n\n');
    const res = await client.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      output_config: { effort: 'low' },
      system: '너는 교사를 위한 아침 뉴스 브리핑 편집자다. 주어진 제목과 설명에 있는 사실만 쓰고, 없는 내용은 지어내지 않는다.',
      messages: [{ role: 'user', content: `아래 기사마다 한국어 3줄 요약을 써 줘. 각 줄은 45자 안팎의 완결된 문장, 영어 기사도 한국어로. 설명이 없으면 제목에서 알 수 있는 것만 1~2줄로 쓴다.\n다른 말 없이 JSON만 출력: {"items":[{"i":0,"lines":["…","…","…"]}]}\n\n${list}` }]
    });
    if (res.stop_reason === 'refusal') throw new Error('refusal');
    const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    let n = 0;
    for (const x of json.items || []) if (top[x.i] && Array.isArray(x.lines) && x.lines.length) { lines[x.i] = x.lines.slice(0, 3).map(String); n++; }
    if (n) mode = 'claude';
  } catch (e) {
    console.warn('Claude 요약 실패, 추출식 요약을 씁니다:', e.message || e);
  }
}

const items = top.map((it, i) => ({ cat: it.cat, title: it.title, link: it.link, source: it.source, published: it.published, lines: lines[i] }));
const out = { date: today, generatedAt: new Date(now).toISOString(), summary: mode, headline: headline(items), items, sources, described: top.filter((x) => x.desc).length };

fs.writeFileSync(path.join(DIR, 'today.json'), JSON.stringify(out, null, 1) + '\n');
fs.mkdirSync(path.join(DIR, 'archive'), { recursive: true });
fs.writeFileSync(path.join(DIR, 'archive', today + '.json'), JSON.stringify(out) + '\n');

// AI 업계 출시 기록: 오늘 후보 중 '출시'로 분류된 것을 모두 쌓아 최근 20건 유지
const relPath = path.join(DIR, 'releases.json');
const rel = fs.existsSync(relPath) ? JSON.parse(fs.readFileSync(relPath, 'utf8')) : { items: [] };
for (const it of fresh.filter((x) => x.cat === '출시')) {
  if (rel.items.some((r) => r.link === it.link || r.title === it.title)) continue;
  const i = top.indexOf(it);
  rel.items.push({ date: today, title: it.title, link: it.link, source: it.source, published: it.published, lines: i >= 0 ? lines[i] : extractLines(it) });
}
rel.items.sort((a, b) => (b.published || b.date + 'T12:00:00+09:00').localeCompare(a.published || a.date + 'T12:00:00+09:00'));
rel.items = rel.items.slice(0, 20);
rel.updated = today;
fs.writeFileSync(relPath, JSON.stringify(rel, null, 1) + '\n');
for (const it of fresh.filter((x) => x.cat === '출시' || !x.published)) { seen[it.link] ||= today; if (it.gLink) seen[it.gLink] ||= today; }

for (const it of top) { seen[it.link] ||= today; if (it.gLink) seen[it.gLink] ||= today; }
const cutoff = kstDate(new Date(now - 30 * 864e5));
for (const k of Object.keys(seen)) if (seen[k] < cutoff) delete seen[k];
fs.writeFileSync(seenPath, JSON.stringify(seen) + '\n');

console.log(out.headline);
console.log('요약 방식:', mode, '| 피드', sources.filter((s) => s.ok).length + '/' + sources.length, '성공 | 후보', fresh.length, '| 원문 요약 문구', filled + '/' + need.length, '| 설명 없는 기사', top.filter((x) => !x.desc).length + '/' + top.length);
for (const s of sources.filter((s) => !s.ok)) console.log('  실패:', s.name, s.error);
