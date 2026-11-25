# 온-이음 On-ieum

> 온기를 잇고, 온 사람을 잇는 집

🔗 **공개 주소:** https://kate-young2026.github.io/on-ieum/

뉴스·수업·일·서재·가족이 함께 사는 **3층짜리 AI 워크스페이스**의 디자인 초안입니다.

## 이름의 뜻

| 조각 | 뜻 |
|---|---|
| **온** | 소리로는 온기(溫), 순우리말로는 '온 가족·온 세상'의 **모두** — 따뜻하고, 누구나 함께하는 집 |
| **-** | 붙임표. 예전 국어 문장부호 규정에서 '이음표'에 속했던 부호 — 이름 가운데의 **잇는 실** |
| **이음** | 잇다 → 이음. 뉴스와 수업, 일과 가족, AI와 사람, PC와 휴대폰을 끊김 없이 잇는 자리 |

영문 표기 *On*은 '켜다'이기도 합니다 — 매일 08:20, 뉴스 라운지에 불이 켜지는 집.
3층 서재와 루프탑은 **다락**, 집의 다짐은 **느루**(한꺼번에 몰아치지 않고 오래도록)입니다.

## 집의 구조

- **3층 · 다락** 서재(작품·독서·여행 지도) · 루프탑 수영장 · 캠핑 데크
- **2층** 교실(성취기준 MCP 연계) · 방탈출 · 작업실
- **1층** 거실·응접실(수납장 런처) · 뉴스 라운지 · with JF · 앞마당

## 디자인 원칙

- 로고의 붙임표(-)를 따뜻한 실로 그리고, 사이트의 모든 연결선은 그 실에서 나옵니다.
- 방을 열면 **이어지는 방**이 함께 표시되고, 실로 감싼 듯 강조됩니다.
- 색: 종이 같은 아이보리 바탕, 온기를 뜻하는 장작불색(ember)을 브랜드 색으로, 층마다 하나의 색.
- 글꼴: Gowun Batang(제목) · Noto Sans KR(본문) · JetBrains Mono(코드). 낮/밤 테마 지원.

## 페이지 (v0.4)

| 주소 | 하는 일 |
|---|---|
| [`/`](https://kate-young2026.github.io/on-ieum/) | v0.4: 아이소메트릭 집 디자인에 v0.3 내용(방 10곳 설명·이어지는 방·방 바로가기, 이름의 뜻, 뉴스 라운지 10, 계획·로드맵, 수납장)을 그대로 담음 |
| [`/v03.html`](https://kate-young2026.github.io/on-ieum/v03.html) | v0.3 기획 사이트: 우주선 집 · 타임캡슐 수납장 |
| [`/dashboard.html`](https://kate-young2026.github.io/on-ieum/dashboard.html) | 기획 대시보드 (숫자는 `data/plan.json`에서 계산) |
| [`/rooms/coding.html`](https://kate-young2026.github.io/on-ieum/rooms/coding.html) | 작업실 코딩방: 입찰공고·연구원동정·보도자료·언론기고·FOCUS·전망·현안·세미나 프로그램·메인비주얼 텍스트 → HTML, 미리보기, 유형 추가 |
| [`/rooms/classroom.html`](https://kate-young2026.github.io/on-ieum/rooms/classroom.html) | 교실: 초등 620·중등 3,838 성취기준 → 설명·지표 → 학습목표 → 학습지·활동지·게임·프로젝트 초안. **단원 찾기**: 낱말·과목·학년·코드로 단원과 그 단원의 성취기준 찾기 (`?find=광합성`으로 바로 열기) |
| [`/rooms/escape.html`](https://kate-young2026.github.io/on-ieum/rooms/escape.html) | 방탈출: 문제를 풀어야 열리는 문. 예시 방 3개(국어 「잠긴 이야기 도서관」, 수학 「곱셈 금고를 열어라」·「분수 실험실 탈출」 — 수학은 도전할 때마다 새 문제), 방 꾸미기(성취기준 검색·AI 문제 만들기), 학생용 링크·HTML 파일·교사용 정답지로 내보내기. 교실에서 성취기준을 고르고 '방탈출로'를 누르면 그 성취기준으로 새 방(`?std=6수01-08`) |
| [`/rooms/locker.html`](https://kate-young2026.github.io/on-ieum/rooms/locker.html) | 교실 사물함: 2027 수능 국어 45문항 사물함 · OMR 풀이·채점 · 정답 사물함 · 성취기준 매칭 |
| [`/rooms/portfolio.html`](https://kate-young2026.github.io/on-ieum/rooms/portfolio.html) | 서재 포트폴리오: 2025년 8월 이후 메인비주얼 작업 카드 |

### 뉴스 라운지 (실제 동작)
- `.github/workflows/news.yml`이 매일 06:07 KST에 `scripts/news/collect.mjs`를 돌려 공개 RSS 16곳(`data/news/feeds.json`: OpenAI·Anthropic·Google DeepMind·Google AI·Hugging Face·NVIDIA 공식 발표, AI타임스·ZDNet·전자신문·블로터, 에듀프레스·교육플러스, 구글 뉴스 검색)을 읽습니다.
- 분류(AI 출시 · AI · IT · EDU · 교육정책) → 중복 제거 → 분야별 몫으로 상위 10 → 3줄 요약 → `data/news/today.json`, `archive/날짜.json`, AI 모델 출시 기록 `releases.json`(최근 20건). 원문은 저장하지 않습니다.
- 3줄 요약: 저장소 비밀값 `ANTHROPIC_API_KEY`가 있으면 Claude가, 없으면 기사 설명문 앞 세 문장으로 씁니다.
- 알림: [ntfy](https://ntfy.sh) 예약 전달로 **08:20 KST**에 도착. 앱에서 주제 `on-ieum-news-915c3aa849`를 구독하세요. 주제를 비공개로 바꾸려면 비밀값 `NTFY_TOPIC`을 넣고 그 주제를 구독합니다.
- 바로 돌려 보기: Actions → 뉴스 라운지 → Run workflow (알림 now/0820/none).

### 쓰는 법 요약
- **코딩방**: 공통 표기 `**굵게**` `__밑줄__` `[[주황:글]]` `[[파랑:글]]` `[글](주소)` `!이미지 경로`, 유형별 표기는 화면 위 안내. 미리보기는 KDI 홈페이지 CSS를 주소로 자동 연결(게시물: `/res/css/style.css` + `editor-template`, 메인비주얼: `/res/css/main.css`) — 파일은 복사하지 않음.
- **교실**: '과목별'은 학교급 → 과목 → 학년군 → 성취기준. '단원 찾기'는 낱말(예: 힘과 우리 생활, 분수의 덧셈, 4과01)과 학교급·학년·과목으로 단원을 찾고, 단원을 누르면 성취기준 전체와 'AI에게 단원 설계 맡기기', 성취기준을 누르면 수업 설계로 이어집니다. 학습목표를 고치면 초안이 바로 바뀌고, 인쇄·HTML 저장, "AI에게 맡기기"로 프롬프트 복사.
- **방탈출**: 문(객관식 번호·숫자 다이얼·낱말 자물쇠·자동 수학 문제)을 열 때마다 열쇠 조각을 얻고, 마지막 문에서 섞인 조각을 순서대로 맞추면 탈출. 힌트는 +30초, 별 3개 기록. 학생용 링크(`#play=…`)와 HTML 파일에는 정답 대신 해시만 들어가요.
- **사물함**: 문제 본문은 싣지 않음(평가원 공식 문제지 링크 또는 내 PC의 PDF 열기). 정답·배점은 평가원 정답표(홀수형·짝수형) 반영, 문제지 형을 고르면 그에 맞게 채점.
- **포트폴리오**: 메인비주얼 HTML 붙여 넣기(이미지 이름에서 vs_no를 찾아 CMS 미리보기 링크 생성), vs_no 번호로 추가, JSON·CSV 가져오기. 카드를 누르면 PC/모바일 미리보기.
- 모든 입력은 각자의 브라우저에만 저장돼요(내보내기/가져오기 지원).

## 개발

빌드 없이 정적 파일로 동작합니다. 데이터 파일을 불러오므로 로컬에서는 간단한 서버로 여세요.

```bash
python3 -m http.server 8000
```

```bash
for t in tests/*.cjs; do node "$t"; done
```

성취기준 데이터 다시 만들기(두 MCP 저장소를 받아 둔 경로를 넘김). 데이터를 바꾸면 단원 찾기 색인도 다시 만드세요:

```bash
node scripts/build-standards.mjs ../korean-elementary-learning-map-mcp ../korean-secondary-learning-map-mcp
node scripts/build-search-index.mjs   # data/standards/search.json
```

## 성취기준 MCP 서버

교실의 단원 찾기와 같은 검색을 Claude 같은 AI 도우미가 도구로 쓰게 하는 서버입니다(`mcp/server.mjs`, Node 18 이상, 설치할 것 없음).
도구: `find_unit`(단원 찾기) · `search_standards`(성취기준 찾기) · `get_standard`(지표·평가 질문까지 자세히) · `list_subjects`(과목 목록).
연결 방법은 [mcp/README.md](mcp/README.md)를 보세요.

데이터 출처와 원칙은 [NOTICE.md](NOTICE.md)를 보세요. 설계는 「개인 AI 워크스페이스 구축 가이드」(2026)의 10단계 구조를 따릅니다.
