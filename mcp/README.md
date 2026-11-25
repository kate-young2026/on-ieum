# 온-이음 성취기준 MCP 서버

2022 개정 교육과정 성취기준(초등 620 · 중등 3,838)에서 **단원**과 **성취기준**을 찾는 MCP 서버입니다.
교실 화면의 '단원 찾기'와 같은 검색 엔진(`js/standards-search.js`)과 같은 데이터(`data/standards/`)를 씁니다.
Node.js 18 이상만 있으면 되고, 따로 설치할 패키지는 없습니다.

## 도구

| 도구 | 하는 일 | 예 |
|---|---|---|
| `find_unit` | 단원 이름·주제어로 단원을 찾고 그 단원의 성취기준 전체를 돌려줌. 낱말 없이 과목·학년만 주면 단원 목록 | `{"query":"힘과 우리 생활"}`, `{"subject":"과학","grade":"초3"}` |
| `search_standards` | 낱말·코드로 성취기준 찾기 (코드는 앞부분만 넣어도 됨) | `{"query":"광합성","level":"middle"}`, `{"query":"4과01"}` |
| `get_standard` | 코드 하나의 문장·영역·단원·관찰 증거·평가 질문·먼저/이어 배울 것 | `{"code":"[4국03-01]"}` |
| `list_subjects` | 학교급별 과목·학년군·성취기준 수 | `{"level":"high"}` |

공통 조건: `level`(elem·middle·high 또는 초등·중학교·고등학교), `subject`(과목 이름 일부), `grade`(1~12 또는 "초5"·"중2"·"고1"), `gb`(학년군 "3-4" 등), `limit`.
'단원'은 성취기준 코드의 앞부분(예: `[4과01-..]`)으로 묶은 것이고, 이름은 데이터의 단원 표기 → 영역 이름 순으로 붙입니다.

## 연결하기

먼저 저장소를 받습니다.

```bash
git clone https://github.com/kate-young2026/on-ieum.git
cd on-ieum
node mcp/server.mjs --selftest   # 동작 확인
```

**Claude Code**: 이 저장소 폴더에서 열면 `.mcp.json`이 서버를 자동으로 잡습니다(처음 한 번 승인). 다른 폴더에서 쓰려면:

```bash
claude mcp add on-ieum-standards -- node /절대/경로/on-ieum/mcp/server.mjs
```

**Claude 데스크톱 앱**: 설정 → 개발자 → 설정 편집으로 `claude_desktop_config.json`을 열고 아래를 넣은 뒤 앱을 다시 켭니다.

```json
{
  "mcpServers": {
    "on-ieum-standards": {
      "command": "node",
      "args": ["/절대/경로/on-ieum/mcp/server.mjs"]
    }
  }
}
```

Windows 경로는 `"C:\\Users\\이름\\on-ieum\\mcp\\server.mjs"`처럼 역슬래시를 두 번 씁니다.

연결한 뒤에는 "초등 4학년 분수 덧셈 단원 성취기준 찾아 줘", "[9과12-01] 지표랑 평가 질문 보여 줘"처럼 물으면 됩니다.

## 출처

성취기준 문장은 교육부·국가교육위원회 고시 교육과정(NCIC), 세부 주제·지표·평가 질문은 학습맵 MCP 데이터(MIT)입니다. 자세한 내용은 [NOTICE.md](../NOTICE.md).
