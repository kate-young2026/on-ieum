# NOTICE — 데이터 출처와 원칙

## 성취기준 데이터 (`data/standards/`)
`scripts/build-standards.mjs`로 아래 두 저장소의 데이터를 줄여 만든 것입니다.

- 초등: [taehyeonglim/korean-elementary-learning-map-mcp](https://github.com/taehyeonglim/korean-elementary-learning-map-mcp) — MIT. 기반 데이터셋은 DECK6의 원저작물(MIT).
- 중등: [raphysicst-create/korean-secondary-learning-map-mcp](https://github.com/raphysicst-create/korean-secondary-learning-map-mcp) — MIT. 기반 데이터셋은 [DECK6/korean-secondary-learning-map](https://github.com/DECK6/korean-secondary-learning-map)(MIT).
- 성취기준 문장: 교육부·국가교육위원회 고시 교육과정(국가교육과정정보센터 NCIC 공개 PDF). 고시 원문은 저작권법상 보호받지 않는 저작물로, 출처를 밝혀 이용합니다.
- 세부 주제·관찰 증거·평가 질문(화면의 '지표')과 선수·전이 관계는 위 데이터의 추천 구조이며 교육부·NCIC의 공식 산출물이 아닙니다.
- 중등 데이터에는 국가교육위원회 고시 제2026-1호(2026.1.21.) 개정분이 반영되어 있지 않습니다.

## 2027 수능 국어 사물함 (`data/suneung-2027-korean.json`)
- 문제 본문(지문·발문·선택지)은 싣지 않습니다. 문제지는 한국교육과정평가원 공식 페이지에서 받으세요.
- 정답·배점은 한국교육과정평가원 2027학년도 수능 국어 영역 정답표(홀수형·짝수형)를 옮긴 것입니다.
- 문항↔성취기준 매칭은 2022 개정 교육과정 성취기준으로 제안한 것이며, 선생님이 화면에서 확정합니다.

## 작업실 코딩방
- KDI CSS 파일은 이 저장소에 넣지 않습니다. 미리보기는 www.kdi.re.kr의 CSS(`/res/css/style.css`, `/res/css/main.css`)를 브라우저에서 주소로 직접 불러옵니다.
- 유형별 예시 원고는 구조만 본뜬 가상 문장입니다. 언론기고는 보도자료 샘플과 같은 구조를 씁니다.

## 서재 포트폴리오
- `data/portfolio.json`은 KDI 홈페이지(/kdidata/mainContent/visual/)에 공개된 메인비주얼 이미지를 번호별로 확인해 만든 목록입니다(`scripts/build-portfolio.py`). 원본 이미지는 kdi.re.kr 주소로 연결하고, 저장소에는 640px 썸네일만 둡니다. 저작권은 KDI에 있습니다.
- 로그인이 필요한 CMS 자료는 저장소에 올리지 않습니다.

## 뉴스 라운지 (`data/news/`)
- 공개 RSS와 공식 발표 목록(Anthropic 뉴스 페이지는 RSS가 없어 목록의 제목·링크만 읽음)에서 제목·링크·출처·시각만 가져옵니다. 기사 원문은 저장하지 않습니다.
- 3줄 요약은 기사 설명문에서 뽑거나(기본) Claude가 제목·설명만 보고 씁니다. 사실 확인은 원문 링크로 하세요. 저작권은 각 언론사·기관에 있습니다.

## 단원 색인 (`data/standards/units.json`)
- 위 두 성취기준 MCP 데이터의 교과·학년군·영역·단원(초등 수학 module, 과학 unit) 정보로 만든 묶음입니다. 교과서 출판사의 단원명과는 다를 수 있습니다.
