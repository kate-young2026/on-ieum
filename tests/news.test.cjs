// node tests/news.test.cjs — 뉴스 라운지 수집 규칙(네트워크 없이)
const assert = require('assert');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
import('../scripts/news/lib.mjs').then((L) => {
  const now = Date.now(), d = new Date(now - 3 * 36e5).toUTCString();
  const rss = `<rss><channel>
<item><title><![CDATA[오픈AI, GPT-6 공개 - 조선일보]]></title><link>https://news.google.com/a</link><pubDate>${d}</pubDate><source url="x">조선일보</source></item>
<item><title>교육부, 고교학점제 지원 확대</title><link>https://a.kr/1</link><description>&lt;p&gt;교육부가 25일 발표했다. 소규모 학교 공동교육과정을 늘린다. U.S. 사례도 참고했다. 넷째.&lt;/p&gt;</description><pubDate>${d}</pubDate></item>
<item><title>교육부 고교학점제 지원 확대한다</title><link>https://b.kr/2</link><pubDate>${d}</pubDate></item>
</channel></rss>`;
  const g = L.parseFeed(rss, { name: '구글', cat: 'AI', url: 'https://news.google.com/rss/x' });
  ok(g[0].title === '오픈AI, GPT-6 공개' && g[0].source === '조선일보', '구글 뉴스 출처 분리');
  ok(L.classify(g[0]) === '출시', 'AI 모델 출시 분류');
  ok(L.classify({ feedCat: '출시', title: 'Investing in the public benefit' }) === 'AI', '공식 블로그 비출시 글은 AI');
  ok(L.classify({ feedCat: '출시', title: 'Introducing Claude Opus 5.5' }) === '출시', 'Introducing = 출시');
  const p = L.parseFeed(rss, { name: '정책', cat: '정책', url: 'https://x' });
  ok(L.extractLines(p[1]).length === 3 && L.extractLines(p[1])[2] === 'U.S. 사례도 참고했다.', '추출식 3줄');
  ok(L.dedupe(p).length === 2, '비슷한 제목 중복 제거');
  const atom = '<feed><entry><title>Hello model</title><link rel="alternate" href="https://o.ai/x"/><updated>2026-11-25T00:00:00Z</updated><summary>s</summary></entry></feed>';
  ok(L.parseFeed(atom, { name: 'o', cat: '출시', url: 'u' })[0].link === 'https://o.ai/x', 'Atom 링크');
  const html = '<a href="/claude-opus-5-5"><h3>Introducing Claude Opus 5.5</h3><p>Best.</p></a><a href="/features/x"><h3>Feature</h3></a>';
  const h = L.parseHtmlList(html, { name: 'Anthropic', cat: '출시', base: 'https://www.anthropic.com', path: '^/(news/|claude-)' });
  ok(h.length === 1 && h[0].link === 'https://www.anthropic.com/claude-opus-5-5', 'HTML 목록');
  const items = [];
  for (const cat of ['출시', '정책', 'EDU', 'AI', 'IT']) for (let i = 0; i < 4; i++) items.push({ cat, source: cat + i, score: 10 - i, title: cat + i });
  const top = L.selectTop(items, { 출시: 3, 정책: 2, EDU: 2, AI: 2, IT: 1 }, 10);
  ok(top.length === 10 && top.filter((x) => x.cat === '출시').length === 3, '분야별 몫');
  ok(new Date(L.at0820(new Date('2026-11-25T21:10:00Z')) * 1000).toISOString() === '2026-11-25T23:20:00.000Z', '08:20 KST 예약 시각');
  ok(L.headline([{ cat: '출시' }, { cat: '정책' }]).includes('AI 출시 1 · 교육정책 1'), '알림 한 줄');
  console.log('news tests passed:', n);
});
