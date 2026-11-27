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
  // 하루 여러 번 예약 실행해도 08:20 알림은 하루 한 번
  const t0 = new Date('2026-11-27T15:20:00Z'); // 11/28 00:20 KST
  const p0 = L.notifyPlan('0820', { date: '2026-11-27' }, t0);
  ok(p0.send && p0.mark && p0.date === '2026-11-28' && new Date(p0.delay * 1000).toISOString() === '2026-11-27T23:20:00.000Z', '그날 첫 실행은 08:20 예약');
  ok(!L.notifyPlan('0820', { date: '2026-11-28' }, t0).send, '이미 예약한 날은 건너뜀');
  const late = L.notifyPlan('0820', null, new Date('2026-11-28T03:30:00Z'));
  ok(late.send && late.delay === null && late.mark, '08:20이 지나 돌면 바로 보내고 기록');
  ok(L.notifyPlan('now', { date: '2026-11-28' }, t0).send && !L.notifyPlan('now', null, t0).mark, '손으로 보내는 now는 기록하지 않음');
  ok(!L.notifyPlan('none', null, t0).send, 'none은 보내지 않음');
  // 교수님 피드백: 분류·제외 키워드·교육 관련성·원문 요약 문구
  ok(!L.isRelease('Introducing the llama.cpp benchmark dashboard for AMD Ryzen and Radeon'), 'llama.cpp 벤치마크는 출시가 아님');
  ok(!L.isRelease('Claude가 Troy Hunt의 이메일을 검토한 결과, 침해 사실 공개 과정에서 반복적인 지연과 법무팀 개입이 드러났다'), '보안 사고 기사는 출시가 아님');
  ok(L.classify({ feedCat: '출시', title: 'Introducing the llama.cpp benchmark dashboard' }) === 'AI', '출시 피드의 비출시 글은 AI');
  ok(L.isExcluded({ title: "[범한메카텍 IPO] '파두'의 NH, '정정요구 2번'의 유진이 몸값 매겼다" }), 'IPO 기사 제외');
  ok(L.isExcluded({ title: '[한국의 CISO-권력지도] 삼성물산 강현구 상무' }), 'CISO 권력지도 기사 제외');
  ok(L.isExcluded({ title: '새 학기 급식 메뉴' }, ['급식']), 'feeds.json exclude 추가어');
  ok(!L.isExcluded({ title: '교육부, AI 디지털교과서 현장 점검' }), '교육 기사는 남김');
  ok(L.eduRelevance({ title: '교실 속 생성형 AI 튜터, 교사 연수 확대' }) === 3 && L.eduRelevance({ title: '반도체 수출 증가' }) === 0, '교육 관련성 점수');
  const now2 = Date.now();
  const a = { cat: 'IT', feed: 'x', title: '학교 현장 AI 교사 연수', published: new Date(now2).toISOString() };
  const b = { cat: 'IT', feed: 'x', title: '반도체 장비 수주 확대', published: new Date(now2).toISOString() };
  ok(L.score(a, now2) > L.score(b, now2) + 10, 'IT 칸에서 교육 관련 기사가 앞섬');
  ok(L.metaDescription('<meta property="og:description" content="교육부가 25일 고교학점제 지원을 확대한다고 밝혔다.">', '다른 제목') === '교육부가 25일 고교학점제 지원을 확대한다고 밝혔다.', 'og:description 읽기');
  ok(L.metaDescription('<meta content="Comprehensive up-to-date news coverage, aggregated from sources all over the world by Google News." property="og:description">') === '', '구글 뉴스 기본 문구는 버림');
  ok(L.googleNewsId('https://news.google.com/rss/articles/CBMiAbc?oc=5') === 'CBMiAbc', '구글 뉴스 기사 id');
  // 알림 주제는 공개 저장소에 적지 않는다
  const fs = require('fs');
  const feeds = JSON.parse(fs.readFileSync('data/news/feeds.json', 'utf8'));
  ok(!feeds.ntfy.topic, 'feeds.json에 ntfy 주제 없음');
  for (const f of ['index.html', 'README.md', 'v03.html', 'dashboard.html']) ok(!/on-ieum-news-[0-9a-f]{6,}/.test(fs.readFileSync(f, 'utf8')), f + '에 주제 이름 없음');
  ok(feeds.feeds.filter((f) => !/news\.google\.com/.test(f.url)).length >= 15, '언론사·공식 RSS가 대부분');
  console.log('news tests passed:', n);
});
// 음성 듣기 대본
{
  const V = require('../js/news-voice.js');
  const news = { date: '2026-11-27', items: [
    { cat: '출시', title: '오픈AI, GPT-6.2 출시', source: '지디넷코리아', lines: ['[교육플러스=지성배 기자] 오픈AI가 새 모델을 냈다.', '사용량 계산 오류를 바로잡으면서 이용자가 쓸 수 있는…'] },
    { cat: 'EDU', title: '교실 AI 튜터 확산', source: '에듀프레스', lines: ['요약할 설명문이 없는 기사예요. 제목을 눌러 원문에서 확인하세요.'] }] };
  const s = V.script(news);
  assert.ok(s.length === 4 && s[0].text.startsWith('11월 27일') && s[3].i === -1, '대본: 인사·기사 2·마무리');
  assert.ok(s[1].text.startsWith('첫 번째, AI 출시 소식.') && !s[1].text.includes('기자') && !s[1].text.includes('…'), '대본: 기자명·말줄임 정리 ' + s[1].text);
  assert.ok(!s[2].text.includes('설명문이 없는'), '대본: 안내 문구는 읽지 않음');
  assert.ok(V.script(news, 'EDU').length === 3, '대본: 분야만 골라 듣기');
  assert.ok(V.chunks('가. '.repeat(100)).every((c) => c.length <= 170), '대본: 문장 단위로 나눔');
  const fs = require('fs');
  assert.ok(/listen\.html/.test(JSON.parse(fs.readFileSync('data/news/feeds.json', 'utf8')).ntfy.listen), '알림에 음성 듣기 주소');
  console.log('news voice tests passed: 6');
}
