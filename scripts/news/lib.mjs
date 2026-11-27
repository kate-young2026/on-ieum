// 뉴스 라운지 순수 함수: RSS/Atom 읽기, 분류, 중복 제거, 상위 10 고르기, 3줄 요약(추출식).
// 원문은 저장하지 않는다. 제목·링크·출처·시각·요약 3줄만 남긴다.

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', hellip: '…', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—' };
export function decode(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => (n.toLowerCase() in ENT ? ENT[n.toLowerCase()] : m));
}
export function strip(html) {
  // 엔티티로 감싼 태그(&lt;p&gt;)까지 벗기려고 decode → 태그 제거를 두 번 한다
  let s = decode(html);
  s = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ');
  s = decode(s).replace(/<[^>]+>/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}
function tag(block, names) {
  for (const n of names) {
    const m = block.match(new RegExp('<' + n + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + n + '>', 'i'));
    if (m && m[1].trim()) return m[1];
  }
  return '';
}
function atomLink(block) {
  const links = [...block.matchAll(/<link\b([^>]*)\/?>/gi)].map((m) => m[1]);
  const pick = links.find((a) => /rel=["']alternate["']/i.test(a)) || links.find((a) => !/rel=/i.test(a)) || links[0];
  const h = pick && pick.match(/href=["']([^"']+)["']/i);
  return h ? decode(h[1]) : '';
}

export function parseFeed(xml, feed) {
  const blocks = [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].map((m) => m[0]);
  return blocks.map((b) => {
    let title = strip(tag(b, ['title']));
    let link = strip(tag(b, ['link'])) || atomLink(b) || strip(tag(b, ['guid', 'id']));
    const date = strip(tag(b, ['pubDate', 'published', 'updated', 'dc:date']));
    const desc = strip(tag(b, ['description', 'summary', 'content:encoded', 'content']));
    let source = feed.name;
    const gsrc = strip(tag(b, ['source']));
    if (/news\.google\.com/.test(feed.url) && gsrc) {
      source = gsrc;
      title = title.replace(new RegExp('\\s+-\\s+' + gsrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), '');
    }
    const t = Date.parse(date);
    return { title, link: link.trim(), source, feed: feed.name, feedCat: feed.cat, published: isNaN(t) ? null : new Date(t).toISOString(), desc: /news\.google\.com/.test(feed.url) ? '' : desc };
  }).filter((x) => x.title && /^https?:\/\//.test(x.link));
}

// RSS가 없는 공식 블로그(예: Anthropic 뉴스): 목록 페이지의 <a href="/news/..."> 안에 있는 제목만 읽는다.
export function parseHtmlList(html, feed, max = 8) {
  const out = [], seen = new Set(), allow = new RegExp(feed.path);
  for (const m of html.matchAll(/<a[^>]+href="(\/[^"#?]*)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const h = m[2].match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
    if (!h || !allow.test(m[1]) || seen.has(m[1])) continue;
    seen.add(m[1]);
    const p = m[2].match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    out.push({ title: strip(h[1]), link: feed.base + m[1], source: feed.name, feed: feed.name, feedCat: feed.cat, published: null, desc: p ? strip(p[1]) : '' });
    if (out.length >= max) break;
  }
  return out;
}

const RELEASE_VERB = /(출시|공개|선보|발표|업데이트|launch|introduc|releas|announc|now available|rolling out|available in|debut|unveil)/i;
// 모델 이름은 제품명으로만 본다(llama.cpp 같은 도구 이름, 일반 숫자·'버전'은 제외)
const MODEL_WORD = /(GPT|Claude|Gemini|Gemma|Llama(?!\.cpp)|Grok|Mistral|DeepSeek|Qwen|Sora|Veo|Imagen|Codex|Phi-?\d|Nemotron|\bo\d\b|모델|\bmodels?\b|하이퍼클로바|HyperCLOVA|엑사원|EXAONE)/i;
// '출시'로 보면 안 되는 글: 벤치마크·대시보드·튜토리얼, 보안 사고·소송, 투자·주가 등
export const NOT_RELEASE = /(benchmark|벤치마크|dashboard|대시보드|leaderboard|리더보드|tutorial|튜토리얼|how to|guide to|cookbook|webinar|웨비나|case stud|사례|dataset|데이터셋|침해|유출|해킹|이메일|소송|법무|규제|보안 취약|취약점|주가|상장|IPO|투자|실적|인수)/i;
export function isRelease(title) { return RELEASE_VERB.test(title) && MODEL_WORD.test(title) && !NOT_RELEASE.test(title); }

// 교사에게 필요 없는 기사(모든 분야 공통 제외). feeds.json의 exclude로 덧붙일 수 있다.
export const EXCLUDE = ['IPO', '상장', '공모주', '주가', '증권', '몸값', '주관사', '권력지도', 'CISO', '주주', '배당', '영업이익', '매출액', '실적 발표', '인수합병', 'M&A', '부고', '인사]', '코인', '비트코인', 'BTC', '바이낸스', '가상자산', '암호화폐', '연예', '골프'];
// 교육 관련성: 제목·설명에 이 낱말이 많을수록 점수가 오른다. feeds.json의 eduKeywords로 덧붙일 수 있다.
export const EDU_KW = ['교육', '학교', '교사', '교원', '학생', '수업', '교실', '학습', '교과', '교육과정', '에듀', '입시', '수능', '대입', '고교학점제', '늘봄', '디지털교과서', 'AI 교과서', 'AIDT', '리터러시', '청소년', '어린이', '아동', '학부모', '대학', '튜터', 'education', 'school', 'teacher', 'student', 'classroom', 'e-learning', 'tutor'];
function kwList(base, extra) { return base.concat(Array.isArray(extra) ? extra : []).filter(Boolean); }
export function isExcluded(item, extra) {
  const t = item.title + ' ' + (item.desc || '').slice(0, 200);
  return kwList(EXCLUDE, extra).some((k) => t.toLowerCase().includes(String(k).toLowerCase()));
}
// 0~3: 제목에 있으면 2점, 설명에만 있으면 1점(최대 3)
export function eduRelevance(item, extra) {
  const ti = item.title.toLowerCase(), de = (item.desc || '').toLowerCase();
  let r = 0;
  for (const k of kwList(EDU_KW, extra)) { const w = String(k).toLowerCase(); if (ti.includes(w)) r += 2; else if (de.includes(w)) r += 1; if (r >= 3) return 3; }
  return r;
}

export function classify(item) {
  if (item.feedCat === '출시') return isRelease(item.title) ? '출시' : 'AI';
  if ((item.feedCat === 'AI' || item.feedCat === 'IT') && isRelease(item.title) && /(GPT|Claude|Gemini|Llama(?!\.cpp)|Grok|DeepSeek|Qwen|하이퍼클로바|엑사원|EXAONE|Mistral)/i.test(item.title)) return '출시';
  return item.feedCat;
}

export function normTitle(t) { return String(t).toLowerCase().replace(/\[[^\]]*\]|\([^)]*\)/g, '').replace(/[^0-9a-z가-힣]+/g, ''); }
function bigrams(s) { const b = new Set(); for (let i = 0; i < s.length - 1; i++) b.add(s.slice(i, i + 2)); return b; }
export function similar(a, b) {
  const x = bigrams(normTitle(a)), y = bigrams(normTitle(b));
  if (!x.size || !y.size) return false;
  let n = 0; for (const g of x) if (y.has(g)) n++;
  return n / Math.min(x.size, y.size) >= 0.6;
}
export function dedupe(items) {
  const out = [];
  for (const it of items) {
    if (out.some((o) => o.link === it.link || similar(o.title, it.title))) continue;
    out.push(it);
  }
  return out;
}

const POLICY_KW = /(교육부|국가교육위|교육청|교육감|고교학점제|수능|대입|늘봄|디지털교과서|AI 교과서|AIDT|교원|교육과정|학교폭력|유보통합)/;
export function score(item, now) {
  const ageH = item.published ? (now - Date.parse(item.published)) / 36e5 : 12;
  let s = Math.max(0, 48 - ageH);
  if (item.cat === '출시') s += 20;
  if (/^(OpenAI|Anthropic|Google DeepMind|Google AI|Hugging Face|Microsoft AI|NVIDIA|정책브리핑)/.test(item.feed)) s += 6;
  if (POLICY_KW.test(item.title)) s += 4;
  if (/[가-힣]/.test(item.title)) s += 2;
  // 교육 관련성: AI·IT 칸은 교육과 닿은 기사를 크게 올린다(최대 +15), 나머지 칸도 조금(+6)
  const rel = item.rel != null ? item.rel : eduRelevance(item);
  s += rel * (item.cat === 'AI' || item.cat === 'IT' ? 5 : 2);
  if (item.desc) s += 3; // 요약할 설명문이 있는 기사를 조금 앞으로
  return s;
}

// 분야별 몫(quota)을 먼저 채우고 남은 자리는 점수 순. 한 출처는 최대 3건.
export function selectTop(items, quota, n = 10) {
  const sorted = [...items].sort((a, b) => b.score - a.score);
  const picked = [], perSrc = {};
  const take = (it) => { picked.push(it); perSrc[it.source] = (perSrc[it.source] || 0) + 1; };
  const ok = (it) => !picked.includes(it) && (perSrc[it.source] || 0) < 3;
  for (const [cat, q] of Object.entries(quota)) {
    let k = 0;
    for (const it of sorted) { if (k >= q || picked.length >= n) break; if (it.cat === cat && ok(it)) { take(it); k++; } }
  }
  for (const it of sorted) { if (picked.length >= n) break; if (ok(it)) take(it); }
  const order = Object.keys(quota);
  return picked.sort((a, b) => order.indexOf(a.cat) - order.indexOf(b.cat) || b.score - a.score);
}

// 키가 없을 때 쓰는 추출식 3줄 요약: 설명문의 앞 문장 세 개(각 90자 이내).
// 기사 페이지의 요약 문구(og:description → twitter:description → description)를 읽는다.
export function metaDescription(html, title = '') {
  const head = String(html || '').slice(0, 200000);
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const attr = (tag, a) => { const m = tag.match(new RegExp(a + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')', 'i')); return m ? (m[2] != null ? m[2] : m[3]) : ''; };
  for (const key of ['og:description', 'twitter:description', 'description']) {
    const tag = metas.find((t) => (attr(t, 'property') || attr(t, 'name')).toLowerCase() === key);
    const v = tag ? strip(attr(tag, 'content')) : '';
    if (v.length < 25) continue;
    if (/Google 뉴스|Google News|Comprehensive up-to-date news coverage/i.test(v)) continue;
    if (title && normTitle(v) === normTitle(title)) continue;
    return v;
  }
  return '';
}
// 구글 뉴스 RSS 링크(news.google.com/rss/articles/<id>)에서 기사 id를 꺼낸다
export function googleNewsId(link) {
  const m = String(link || '').match(/^https:\/\/news\.google\.com\/(?:rss\/)?articles\/([^?#/]+)/);
  return m ? m[1] : '';
}

export function extractLines(item) {
  const text = (item.desc || '').replace(/\s+/g, ' ').trim();
  const sents = text.split(/(?<=[^A-Z.][.!?。])\s+/).map((s) => s.trim()).filter((s) => s.length > 8 && !normTitle(item.title).startsWith(normTitle(s).slice(0, 20)));
  // 한 줄은 120자까지, 넘치면 낱말 경계에서 자른다(음성 듣기에서도 덜 어색하게)
  const lines = sents.slice(0, 3).map((s) => (s.length > 120 ? s.slice(0, 119).replace(/\s+\S*$/, '') + '…' : s));
  if (!lines.length) lines.push('요약할 설명문이 없는 기사예요. 제목을 눌러 원문에서 확인하세요.');
  return lines;
}

export function kstDate(d = new Date()) { return new Date(d.getTime() + 9 * 36e5).toISOString().slice(0, 10); }
// 오늘(KST) 08:20의 유닉스 시각(초)
export function at0820(d = new Date()) { return Math.floor(Date.parse(kstDate(d) + 'T08:20:00+09:00') / 1000); }

export const CAT_LABEL = { 출시: 'AI 출시', AI: 'AI', IT: 'IT', EDU: 'EDU', 정책: '교육정책' };
export function headline(items) {
  const c = {}; items.forEach((i) => { c[i.cat] = (c[i.cat] || 0) + 1; });
  return '오늘 뉴스 ' + items.length + '개가 도착했어요. ' + Object.keys(CAT_LABEL).filter((k) => c[k]).map((k) => CAT_LABEL[k] + ' ' + c[k]).join(' · ');
}
