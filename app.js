// 온-이음 On-ieum — 디자인 초안 인터랙션 (모든 데이터는 예시)
(function () {
  'use strict';

  var ROOMS = {
    living: {
      floor: '1층', tone: 'garden', title: '거실 · 응접실',
      desc: '집의 중심. 수납장 서랍을 누르면 필요한 공간만 불러옵니다. 오늘 할 일과 승인함이 여기 모입니다.',
      items: [
        ['오늘 카드', '처리할 일 · 승인 대기 · 마감 임박을 숫자로', '3 · 2 · 1'],
        ['승인함', '보내기·삭제·게시는 여기서 승인해야 실행', 'B 2건'],
        ['가족 메모판', '아이들이 남긴 오늘의 한 줄', '새 글 1'],
        ['수납장', '뉴스 · 교육 · 업무 · 서재 · JF 바로 호출', '']
      ],
      peek: ['오늘의 한 줄', '"엄마 오늘 마라탕 2단계 먹어도 돼요?" — 1번방'],
      ai: ['집', '집사', '오늘 꼭 할 일 3개를 골라 두었어요.']
    },
    news: {
      floor: '1층', tone: 'pool', title: '뉴스 라운지',
      desc: 'AI · IT · EDU · 교육정책 뉴스 10개를 아침마다 모아 3줄로 요약합니다. 08:20에 휴대폰으로 알려 줘요.',
      items: [
        ['오늘의 뉴스 10', '분야별 규칙 분류 → 상위 10 → 3줄 요약', '08:20'],
        ['교실로 보내기', '기사 하나를 읽기 자료·토론 발문 초안으로', '승인함'],
        ['주간 흐름', '분야별 건수와 지난주 대비 변화', '']
      ],
      peek: ['요약 예시', '① 핵심 사실 한 줄 ② 교육 현장에 미칠 영향 ③ 수업에서 쓸 질문 하나'],
      ai: ['뉴', '편집장', '오늘은 교육정책 기사가 많아요. 3번 기사를 먼저 보세요.']
    },
    jf: {
      floor: '1층', tone: 'garden', title: 'with JF',
      desc: '가족이 함께 쓰는 방. 시간표와 앨범, 그리고 아이들의 관심사 방 세 개가 있습니다.',
      items: [
        ['시간표 생성', '학교·학원·가족 일정 → 주간 시간표, 빈 시간 찾기', ''],
        ['가족앨범', '월별 사진 → 레이아웃 자동 → 앨범북 PDF', '11월'],
        ['1번방 · 마라탕 연구소', '재료 분류(과학) · 1인분 가격(수학) · 나만의 레시피 책', ''],
        ['2번방 · 수과학 아틀리에', '실험 기록장 + 대칭·테셀레이션 그림', ''],
        ['3번방 · 카드 배틀', '카드 능력치로 덧셈·곱셈 배틀, 받아쓰기, 카드북 만들기', '미션 1']
      ],
      peek: ['오늘의 미션', '곱셈 카드 5장을 모으면 카드북 한 쪽이 열려요.'],
      ai: ['J', '놀이 친구', '아이 이름과 사진은 AI에 보내지 않아요.']
    },
    class: {
      floor: '2층', tone: 'lock', title: '교실',
      desc: '교육과정 서가(초등·중등 성취기준 MCP)에서 성취기준을 찾아 학습지·활동지·평가를 만듭니다.',
      items: [
        ['성취기준 검색', '코드·키워드·원문 검색, 선수관계, 중→고 전이', 'MCP'],
        ['학습지 · 활동지', '성취기준 → 관찰 증거·평가 발문 → 초안', '초안 2'],
        ['서논술형 평가', '문항 + 채점기준표 + 예시답안', ''],
        ['AI·디지털 교육 콘텐츠 기획', '차시 → 활동 → 평가 흐름 템플릿', ''],
        ['수능국어 · 2028 작전 보드', '중학 국어 → 공통국어 → 선택과목 흐름', 'D-day']
      ],
      peek: ['예: "[4국03-01] 학습지"', '성취기준 원문 확인 → 평가 발문 2개 → 활동지 3단계 → 승인함으로'],
      ai: ['국', '국어 선생님', '성취기준 코드는 서가에서 확인된 것만 써요.']
    },
    escape: {
      floor: '2층', tone: 'lock', title: '방탈출',
      desc: '문제를 풀어야 자물쇠가 열리는 게임형 학습. 선수관계 순서대로 단계를 짭니다.',
      items: [
        ['국어랑 게임', '지문 읽고 열쇠 단어 찾기', '3단계'],
        ['초등수학게임', '분수 · 곱셈 자물쇠', '5단계'],
        ['수업용 방 만들기', '성취기준 하나 = 방 하나, 링크로 배포', '']
      ],
      peek: ['자물쇠 1', '"다음 중 글쓴이의 주장을 가장 잘 드러낸 문장은?" → 정답 번호가 비밀번호'],
      ai: ['열', '열쇠지기', '선수 학습부터 차례로 문을 열어요.']
    },
    studio: {
      floor: '2층', tone: 'oak', title: '작업실',
      desc: '일하는 방. 한 줄 지시가 문서가 되어 결과물 폴더로 돌아옵니다.',
      items: [
        ['코딩 (페이지별)', '페이지 단위 작업 티켓 → 코딩 도우미 지시문', ''],
        ['디자인 (메인 비주얼)', '이 디자인 시스템으로 히어로 시안 3안', ''],
        ['요약 (메인 설명글)', '1문장 · 3문장 · 100자 버전', ''],
        ['보고서 영문 변환', '용어집을 고정한 영문 보고서', 'docx']
      ],
      peek: ['지시 예', '"이 보고서를 영문으로. 용어집 유지, 표는 그대로." → 결과물/날짜/시각_제목/'],
      ai: ['작', '비서', '발송은 하지 않고 "결정 필요"로 적어 둘게요.']
    },
    library: {
      floor: '3층', tone: 'oak', title: '서재',
      desc: '쌓아 두는 방. 작품과 독서, 포트폴리오, 그리고 세계지도 창으로 떠나는 여행 계획.',
      items: [
        ['작품모음 · 포트폴리오', '작품 카드 → 공개용 페이지(공개는 승인 후)', ''],
        ['독서감상 · 국어 · 한국어', '책 사진 → 목록·요약, 감상문 노트', '3권'],
        ['여행 · 세계지도', '나라 클릭 → 지역/주제별 코스, 회화, 예산 제안', ''],
        ['지식 노트', '비슷한 노트끼리 묶어 그래프로', '']
      ],
      peek: ['여행 예', '포르투갈 · 4박 · 책방과 타일 → 리스본 2 + 포르투 2, 회화 10문장, 예산 범위'],
      ai: ['서', '사서', '가격은 "제안"까지만, 예약은 직접 하세요.']
    },
    pool: {
      floor: '3층', tone: 'pool', title: '루프탑 수영장',
      desc: '집중이 필요할 때 올라오는 곳. 물소리와 함께 25분 집중 타이머.',
      items: [
        ['집중 타이머', '25분 집중 · 5분 쉼', '25:00'],
        ['오늘 한 가지', '지금 이 일 하나만 보이게', '']
      ],
      peek: ['지금 할 일', '학습지 초안 2건 검토'],
      ai: ['물', '수영 코치', '알림은 끝날 때까지 잠시 모아 둘게요.']
    },
    camp: {
      floor: '3층', tone: 'ember', title: '캠핑 데크',
      desc: '하루를 닫는 곳. 장작불 앞에서 오늘의 성과와 못 한 일을 정리합니다.',
      items: [
        ['오늘의 성과', '완료 · 승인 · 학습지 건수 (숫자는 코드가 계산)', '7'],
        ['내일로 미루기', '못 한 일을 내일로 연장', ''],
        ['한 줄 일기', '날짜별 기록으로 남김', '']
      ],
      peek: ['오늘', '완료 5 · 승인 2 · 뉴스 10 읽음. 내일 할 일 3개 후보를 골라 두었어요.'],
      ai: ['불', '불지기', '수고했어요. 내일 08:20에 만나요.']
    }
  };

  var NEWS = [
    ['AI', '교실용 AI 튜터 활용 가이드라인 공개', '학교 현장의 AI 튜터 사용 원칙과 점검 항목 정리'],
    ['정책', '2028 대입 개편 세부 안내 발표', '내신·수능 변화 요점과 고교 현장 준비 사항'],
    ['EDU', '디지털 교과서 현장 적용 사례 확산', '수업 사례와 교사 연수 수요 증가'],
    ['AI', '생성형 AI 저작권 표시 기준 논의', '학생 과제·교사 자료에서의 표시 방법'],
    ['정책', '고교학점제 선택과목 운영 지원 확대', '소규모 학교 공동교육과정 지원 내용'],
    ['IT', '교육용 클라우드 보안 인증 기준 개정', '학교에서 쓰는 SaaS 점검 체크리스트'],
    ['AI', '서·논술형 평가 AI 채점 보조 시범 운영', '채점 기준 일관성과 교사 검토 절차'],
    ['EDU', '문해력 향상 프로그램 공모', '읽기·쓰기 통합 수업 지원 예산'],
    ['AI', '오픈 모델 기반 한국어 교육 데이터셋 공개', '교육과정 연계 문항 생성 활용 가능성'],
    ['정책', '늘봄학교 프로그램 다양화 방안', '방과 후 AI·코딩 프로그램 확대']
  ];

  // 이음: 방과 방이 어떻게 이어지는가
  var LINKS = {
    living: [['news', '아침 브리핑'], ['jf', '가족 메모'], ['camp', '하루 마무리']],
    news: [['class', '기사 → 읽기 자료'], ['studio', '보고서 인용'], ['library', '스크랩 보관']],
    jf: [['escape', '수학 게임'], ['library', '앨범 · 카드북'], ['living', '메모판']],
    class: [['escape', '문제 → 자물쇠'], ['news', '시사 지문'], ['studio', '학습지 문서화']],
    escape: [['class', '성취기준 순서'], ['jf', '아이들과 놀이']],
    studio: [['class', '수업 자료 제작'], ['library', '포트폴리오'], ['news', '참고 기사']],
    library: [['studio', '작품 정리'], ['jf', '가족 여행'], ['camp', '독서 회고']],
    pool: [['class', '집중할 일 하나'], ['studio', '마감 작업']],
    camp: [['living', '내일 할 일 3개'], ['library', '한 줄 일기 보관']]
  };

  // 실제 방 페이지가 있는 곳
  var PAGES = {
    class: [['rooms/classroom.html', '교실 들어가기'], ['rooms/locker.html', '수능 사물함']],
    escape: [['rooms/escape.html', '방탈출 들어가기'], ['rooms/locker.html', '수능 사물함 열기']],
    studio: [['rooms/coding.html', '코딩방 들어가기']],
    library: [['rooms/portfolio.html', '포트폴리오 보기']],
    living: [['dashboard.html', '기획 대시보드']]
  };

  var TONE_TEXT = { garden: 'var(--garden)', pool: 'var(--pool)', lock: 'var(--lock)', oak: 'var(--oak)', ember: 'var(--ember)' };
  var panel = document.getElementById('panel');
  var map = document.getElementById('houseMap');

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function openRoom(id, scroll) {
    var r = ROOMS[id]; if (!r) return;
    var linked = (LINKS[id] || []).map(function (l) { return l[0]; });
    map.querySelectorAll('.room').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.room === id ? 'true' : 'false');
      b.classList.toggle('linked', linked.indexOf(b.dataset.room) > -1);
    });
    document.querySelectorAll('.cabinet button').forEach(function (b) { b.classList.toggle('on', b.dataset.room === id); });
    var html = '<span class="tag" style="background:var(--' + r.tone + '-soft);color:' + TONE_TEXT[r.tone] + '">' + esc(r.floor) + '</span>' +
      '<h3>' + esc(r.title) + '</h3><p class="desc">' + esc(r.desc) + '</p><ul>' +
      r.items.map(function (it) { return '<li><b>' + esc(it[0]) + '</b><small>' + esc(it[1]) + '</small>' + (it[2] ? '<em>' + esc(it[2]) + '</em>' : '') + '</li>'; }).join('') +
      '</ul><div class="links"><b>이어지는 방</b>' +
      (LINKS[id] || []).map(function (l) { return '<button class="lk" type="button" data-go="' + l[0] + '">' + esc(ROOMS[l[0]].title) + ' <small>' + esc(l[1]) + '</small></button>'; }).join('') +
      '</div>' + (PAGES[id] ? '<div class="go-row">' + PAGES[id].map(function (g) { return '<a class="btn-go" href="' + g[0] + '">' + esc(g[1]) + ' →</a>'; }).join('') + '</div>' : '') + '<div class="peek"><b>' + esc(r.peek[0]) + '</b>' + esc(r.peek[1]) + '</div>' +
      '<div class="ai"><i style="background:' + TONE_TEXT[r.tone] + '">' + esc(r.ai[0]) + '</i><span><b style="color:var(--ink)">' + esc(r.ai[1]) + '</b> · ' + esc(r.ai[2]) + '</span></div>';
    panel.innerHTML = html;
    panel.classList.remove('fade'); void panel.offsetWidth; panel.classList.add('fade');
    if (scroll) document.getElementById('house').scrollIntoView({ behavior: 'smooth' });
  }

  map.addEventListener('click', function (e) { var b = e.target.closest('.room'); if (b) openRoom(b.dataset.room); });
  panel.addEventListener('click', function (e) { var b = e.target.closest('.lk'); if (b) openRoom(b.dataset.go); });
  // 타임캡슐: 뚜껑이 열린 뒤 방을 부른다
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelector('.cabinet').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (reduce) { openRoom(b.dataset.room, true); return; }
    b.classList.add('opening');
    setTimeout(function () { b.classList.remove('opening'); openRoom(b.dataset.room, true); }, 420);
  });

  // news
  var list = document.getElementById('newsList');
  function renderNews(f) {
    list.innerHTML = NEWS.map(function (n, i) { return { n: n, i: i }; })
      .filter(function (x) { return f === 'all' || x.n[0] === f; })
      .map(function (x) {
        return '<li><span class="no">' + (x.i + 1) + '</span><h4><span class="ftag' + (x.n[0] === '정책' ? ' p' : '') + '">' + (x.n[0] === '정책' ? '교육정책' : x.n[0]) + '</span>예시 — ' + esc(x.n[1]) + '</h4><p>' + esc(x.n[2]) + '</p><button class="send" type="button">교실로 보내기</button></li>';
      }).join('');
  }
  document.querySelector('.filters').addEventListener('click', function (e) {
    var c = e.target.closest('.chip'); if (!c) return;
    document.querySelectorAll('.chip').forEach(function (x) { x.classList.toggle('on', x === c); });
    renderNews(c.dataset.f);
  });
  list.addEventListener('click', function (e) {
    var s = e.target.closest('.send'); if (!s || s.classList.contains('done')) return;
    s.classList.add('done'); s.textContent = '승인함에 담김';
  });

  // theme
  var root = document.documentElement;
  function curDark() { return root.dataset.theme ? root.dataset.theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches; }
  try { var saved = localStorage.getItem('onieum-theme'); if (saved) root.dataset.theme = saved; } catch (e) {}
  if (!root.dataset.theme) root.dataset.theme = curDark() ? 'dark' : 'light';
  document.getElementById('theme').addEventListener('click', function () {
    root.dataset.theme = curDark() ? 'light' : 'dark';
    try { localStorage.setItem('onieum-theme', root.dataset.theme); } catch (e) {}
  });

  renderNews('all');
  openRoom('living');
})();
