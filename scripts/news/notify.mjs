// 뉴스 라운지 알림: ntfy로 휴대폰·PC에 보낸다. 08:20(KST) 예약 전달은 ntfy의 delay 기능을 쓴다.
// 사용: NOTIFY=0820|now|none NTFY_TOPIC=… [NTFY_TOKEN=…] [NTFY_SERVER=…] node scripts/news/notify.mjs
// 주제 이름은 공개 저장소에 적지 않는다. ntfy 공개 주제는 이름만 알면 누구나 구독·발송할 수 있어서,
// 추측할 수 없는 긴 주제 이름을 GitHub 비밀값(NTFY_TOPIC)에만 두고, 계정·예약 주제를 쓰면 접근 토큰(NTFY_TOKEN)도 붙인다.
// NTFY_TOPIC이 없으면 알림을 보내지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { notifyPlan, CAT_LABEL } from './lib.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/news/feeds.json'), 'utf8'));
const news = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/news/today.json'), 'utf8'));
const mode = process.env.NOTIFY || '0820';
const STATE = path.join(ROOT, 'data/news/notified.json');
let state = null; try { state = JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch (e) {}
const plan = notifyPlan(mode, state);
if (!plan.send) { console.log(plan.why); process.exit(0); }
if (!news.items.length) { console.log('보낼 기사가 없어 알림을 건너뜀'); process.exit(0); }

const topic = (process.env.NTFY_TOPIC || '').trim();
if (!topic) { console.log('NTFY_TOPIC 비밀값이 없어 알림을 건너뜀 (README의 "알림 받기" 참고)'); process.exit(0); }
const server = (process.env.NTFY_SERVER || cfg.ntfy.server || 'https://ntfy.sh').trim();
const token = (process.env.NTFY_TOKEN || '').trim();
const top = news.items.slice(0, 4).map((it) => '· [' + (CAT_LABEL[it.cat] || it.cat) + '] ' + it.title).join('\n');
const body = {
  topic,
  title: '온-이음 · 뉴스 라운지 ' + news.date.slice(5).replace('-', '/'),
  message: news.headline + '\n' + top,
  tags: ['newspaper'],
  click: cfg.ntfy.click,
  // 알림 버튼: 음성으로 듣기(휴대폰에서 바로 읽어 줌) · 뉴스 라운지 열기
  actions: [cfg.ntfy.listen && { action: 'view', label: '🔊 음성으로 듣기', url: cfg.ntfy.listen }, { action: 'view', label: '뉴스 라운지 열기', url: cfg.ntfy.click }].filter(Boolean)
};
if (plan.delay) body.delay = String(plan.delay);

const headers = { 'content-type': 'application/json' };
if (token) headers.authorization = 'Bearer ' + token;
const r = await fetch(server, { method: 'POST', headers, body: JSON.stringify(body) });
const text = await r.text();
if (!r.ok) { console.error('ntfy 실패', r.status, text.slice(0, 200)); process.exit(1); }
console.log(body.delay ? '08:20 KST 예약 완료' : '바로 보냄', '→ 주제 (비밀값)', token ? '+ 접근 토큰' : '');
if (plan.mark) fs.writeFileSync(STATE, JSON.stringify({ date: plan.date, at: body.delay ? '08:20 예약' : '바로 보냄', sentAt: new Date().toISOString() }, null, 1) + '\n');
