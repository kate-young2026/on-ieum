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
| [`/`](https://kate-young2026.github.io/on-ieum/) | v0.4 아이소메트릭 집 단면도: 방을 누르면 설명·이어지는 방·방 열기(교실·사물함·코딩방·포트폴리오, 문학 작품 속 인물과 대화) · 이름의 뜻 · 뉴스 라운지 · 계획 |
| [`/v03.html`](https://kate-young2026.github.io/on-ieum/v03.html) | v0.3 기획 사이트: 우주선 집 · 타임캡슐 수납장 |
| [`/dashboard.html`](https://kate-young2026.github.io/on-ieum/dashboard.html) | 기획 대시보드 (숫자는 `data/plan.json`에서 계산) |
| [`/rooms/coding.html`](https://kate-young2026.github.io/on-ieum/rooms/coding.html) | 작업실 코딩방: 입찰공고·연구원동정·보도자료·언론기고·FOCUS·전망·현안·세미나 프로그램·메인비주얼 텍스트 → HTML, 미리보기, 유형 추가 |
| [`/rooms/classroom.html`](https://kate-young2026.github.io/on-ieum/rooms/classroom.html) | 교실: 초등 620·중등 3,838 성취기준 → 설명·지표 → 학습목표 → 학습지·활동지·게임·프로젝트 초안 |
| [`/rooms/locker.html`](https://kate-young2026.github.io/on-ieum/rooms/locker.html) | 교실 사물함: 2027 수능 국어 45문항 사물함 · OMR 풀이·채점 · 정답 사물함 · 성취기준 매칭 |
| [`/rooms/portfolio.html`](https://kate-young2026.github.io/on-ieum/rooms/portfolio.html) | 서재 포트폴리오: 2025년 8월 이후 메인비주얼 작업 카드 |

### 쓰는 법 요약
- **코딩방**: 공통 표기 `**굵게**` `__밑줄__` `[[주황:글]]` `[[파랑:글]]` `[글](주소)` `!이미지 경로`, 유형별 표기는 화면 위 안내. 미리보기는 KDI 홈페이지 CSS를 주소로 자동 연결(게시물: `/res/css/style.css` + `editor-template`, 메인비주얼: `/res/css/main.css`) — 파일은 복사하지 않음.
- **교실**: 학교급 → 과목 → 학년군 → 성취기준. 학습목표를 고치면 초안이 바로 바뀌고, 인쇄·HTML 저장, "AI에게 맡기기"로 프롬프트 복사.
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

성취기준 데이터 다시 만들기(두 MCP 저장소를 받아 둔 경로를 넘김):

```bash
node scripts/build-standards.mjs ../korean-elementary-learning-map-mcp ../korean-secondary-learning-map-mcp
```

데이터 출처와 원칙은 [NOTICE.md](NOTICE.md)를 보세요. 설계는 「개인 AI 워크스페이스 구축 가이드」(2026)의 10단계 구조를 따릅니다.
