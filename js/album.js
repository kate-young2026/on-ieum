// 온-이음 · 가족 앨범북 — 사진 DB에 등록 → 고른 사진만 앨범으로 → 앨범북 보기·인쇄(PDF)
// 사진은 서버나 저장소에 올라가지 않고, 이 기기 브라우저(IndexedDB)에만 저장됩니다.
(function (root) {
  'use strict';

  // ================= 순수 함수 (tests/album.test.cjs) =================
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  // SHA-256 (브라우저 주소가 http여도 동작하도록 직접 계산)
  function sha256(str) {
    var K = [], H = [], i, j, isP = function (n) { for (var f = 2; f * f <= n; f++) if (n % f === 0) return false; return true; };
    var frac = function (x) { return ((x - Math.floor(x)) * 4294967296) | 0; };
    for (i = 2, j = 0; j < 64; i++) if (isP(i)) { if (j < 8) H[j] = frac(Math.pow(i, 1 / 2)); K[j++] = frac(Math.pow(i, 1 / 3)); }
    var bytes = unescape(encodeURIComponent(str)), l = bytes.length, words = [];
    for (i = 0; i < l; i++) words[i >> 2] |= bytes.charCodeAt(i) << (24 - (i % 4) * 8);
    words[l >> 2] |= 0x80 << (24 - (l % 4) * 8);
    words[((l + 8) >> 6) * 16 + 15] = l * 8;
    var rot = function (x, n) { return (x >>> n) | (x << (32 - n)); };
    for (i = 0; i < words.length; i += 16) {
      var w = [], a = H.slice(0);
      for (j = 0; j < 16; j++) w[j] = words[i + j] | 0;
      for (j = 0; j < 64; j++) {
        if (j >= 16) { var w15 = w[j - 15], w2 = w[j - 2]; w[j] = (w[j - 16] + (rot(w15, 7) ^ rot(w15, 18) ^ (w15 >>> 3)) + w[j - 7] + (rot(w2, 17) ^ rot(w2, 19) ^ (w2 >>> 10))) | 0; }
        var e = a[4], t1 = (a[7] + (rot(e, 6) ^ rot(e, 11) ^ rot(e, 25)) + ((e & a[5]) ^ (~e & a[6])) + K[j] + (w[j] | 0)) | 0;
        var b0 = a[0], t2 = ((rot(b0, 2) ^ rot(b0, 13) ^ rot(b0, 22)) + ((b0 & a[1]) ^ (b0 & a[2]) ^ (a[1] & a[2]))) | 0;
        a = [(t1 + t2) | 0].concat(a.slice(0, 7)); a[4] = (a[4] + t1) | 0;
      }
      for (j = 0; j < 8; j++) H[j] = (H[j] + a[j]) | 0;
    }
    return H.map(function (h) { return ('0000000' + (h >>> 0).toString(16)).slice(-8); }).join('');
  }
  var SALT = 'onieum-album:';
  // 지금 비밀번호(1111)의 해시. 화면에서 숨길 뿐, 저장소의 사진을 지키는 장치는 아님(사진은 저장소에 없음)
  var DEFAULT_PIN_HASH = 'd75e50350619b0e978de0179d05e6a4e64c09bbaecdc43f3345c8bfd84bf5a9d';
  function pinHash(pin) { return sha256(SALT + String(pin)); }

  // 파일 이름에서 찍은 날짜 읽기: 20220608_173912.jpg, IMG_20220608_..., KakaoTalk_20220608..., 2022-06-08 ...
  function dateFromName(name) {
    var m = /(?:^|[^0-9])((?:19|20)\d{2})[-_.]?(0[1-9]|1[0-2])[-_.]?(0[1-9]|[12]\d|3[01])(?:[ _T-]?([01]\d|2[0-3])[-_.:]?([0-5]\d)(?:[-_.:]?([0-5]\d))?)?(?!\d)/.exec(String(name || ''));
    if (!m) return null;
    return { date: m[1] + '-' + m[2] + '-' + m[3], time: m[4] ? m[4] + ':' + m[5] : '' };
  }

  // JPEG EXIF의 '찍은 날짜'(DateTimeOriginal) 읽기. 없으면 null
  function exifDate(buf) {
    try {
      var v = new DataView(buf), off = 2;
      if (v.getUint16(0) !== 0xFFD8) return null;
      while (off + 4 < v.byteLength) {
        var mk = v.getUint16(off), len = v.getUint16(off + 2);
        if (mk === 0xFFE1 && v.getUint32(off + 4) === 0x45786966) {
          var t = off + 10, le = v.getUint16(t) === 0x4949;
          var u16 = function (p) { return v.getUint16(t + p, le); }, u32 = function (p) { return v.getUint32(t + p, le); };
          var str = function (p, n) { var s = ''; for (var k = 0; k < n - 1; k++) s += String.fromCharCode(v.getUint8(t + p + k)); return s; };
          var scan = function (ifd, tag) { var n = u16(ifd); for (var k = 0; k < n; k++) { var e = ifd + 2 + k * 12; if (u16(e) === tag) return e; } return -1; };
          var ifd0 = u32(4), ex = scan(ifd0, 0x8769), e2 = -1;
          if (ex >= 0) e2 = scan(u32(ex + 8), 0x9003);
          if (e2 < 0) e2 = scan(ifd0, 0x0132);
          if (e2 < 0) return null;
          var s = str(u32(e2 + 8), 20), m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2})/.exec(s);
          return m && m[1] !== '0000' ? { date: m[1] + '-' + m[2] + '-' + m[3], time: m[4] + ':' + m[5] } : null;
        }
        if ((mk & 0xFF00) !== 0xFF00) return null;
        off += 2 + len;
      }
    } catch (e) {}
    return null;
  }

  // 성장앨범: 기준일(생일)부터 그날까지 '만 N살 N개월'
  function ageLabel(birth, date) {
    if (!birth || !date) return '';
    var b = new Date(birth + 'T00:00:00'), d = new Date(date + 'T00:00:00');
    if (isNaN(b) || isNaN(d) || d < b) return '';
    var months = (d.getFullYear() - b.getFullYear()) * 12 + (d.getMonth() - b.getMonth()) - (d.getDate() < b.getDate() ? 1 : 0);
    if (months < 1) { var days = Math.round((d - b) / 86400000); return days === 0 ? '태어난 날' : '생후 ' + days + '일'; }
    if (months < 24) return '생후 ' + months + '개월';
    var y = Math.floor(months / 12), mo = months % 12;
    return '만 ' + y + '살' + (mo ? ' ' + mo + '개월' : '');
  }

  // 디자인 템플릿 5종. best는 잘 어울리는 사진 장수
  var TEMPLATES = [
    { id: 'classic', name: '클래식', best: '20장 안팎', max: 4, desc: '흰 테두리 사진 1~4장과 넉넉한 여백. 사진 한 장 한 장을 오래 보는 앨범.' },
    { id: 'magazine', name: '매거진', best: '20~30장', max: 3, desc: '한 장을 쪽 가득 크게, 글과 어울려 잡지처럼. 여행·기념일에 잘 맞아요.' },
    { id: 'collage', name: '폴라로이드 콜라주', best: '30~50장', max: 5, desc: '폴라로이드 사진을 살짝 기울여 겹쳐 붙인 스크랩북.' },
    { id: 'grid', name: '촘촘한 그리드', best: '50~100장', max: 9, desc: '한 쪽에 6~9장을 얇은 줄눈으로. 1년치 사진을 한 권에.' },
    { id: 'timeline', name: '성장 타임라인', best: '성장앨범 · 30장 이상', max: 4, desc: '달마다 장을 나누고 날짜 띠를 따라 흘러가요. 생일을 넣으면 나이도 붙어요.' }
  ];
  function tplOf(id) { return TEMPLATES.filter(function (t) { return t.id === id; })[0] || TEMPLATES[0]; }
  function recommendTemplate(n, type) {
    if (type === 'growth' && n >= 12) return 'timeline';
    if (n <= 24) return 'classic';
    if (n <= 36) return 'magazine';
    if (n <= 60) return 'collage';
    return 'grid';
  }

  // 사진 배치: 템플릿마다 한 쪽에 들어가는 장수와 틀이 다름. 순서는 그대로, 빠지는 사진 없음
  var PATTERNS = { classic: [1, 3, 2, 4, 2, 3], magazine: [1, 2, 1, 3, 2], collage: [4, 5, 3, 5, 4], grid: [9, 6, 9, 9, 6], timeline: [3, 4, 2, 4] };
  function isWide(p) { return p && p.w > p.h * 1.15; }
  function counts(n, pat, k0, avoidSingle) {
    var out = [], i = 0, k = k0 || 0;
    while (i < n) {
      var c = Math.min(pat[k++ % pat.length], n - i);
      out.push(c); i += c;
    }
    var L = out.length; // 마지막 쪽에 한 장만 남지 않게 앞쪽에서 한 장 넘겨받기
    if (avoidSingle && L > 1 && out[L - 1] === 1 && out[L - 2] >= 3) { out[L - 2]--; out[L - 1]++; }
    return out;
  }
  function layoutFor(tpl, set) {
    var c = set.length;
    if (tpl === 'classic') {
      if (c === 1) return isWide(set[0]) ? 'one-wide' : 'one';
      if (c === 2) return (isWide(set[0]) && isWide(set[1])) ? 'two-stack' : 'two-side';
      if (c === 3) return isWide(set[0]) ? 'three-top' : 'three-left';
      return 'four';
    }
    if (tpl === 'magazine') return 'mag-' + c + (c === 2 && isWide(set[0]) ? 'w' : '');
    if (tpl === 'collage') return 'col-' + c;
    if (tpl === 'grid') return 'grid-' + c;
    return 'tl-' + c;
  }
  function paginate(photos, tpl) {
    tpl = PATTERNS[tpl] ? tpl : 'classic';
    var pages = [], groups = [];
    if (tpl === 'timeline') { // 달마다 새 장(章)
      photos.forEach(function (p) { var m = (p.date || '').slice(0, 7), g = groups[groups.length - 1]; if (!g || g.month !== m) groups.push(g = { month: m, list: [] }); g.list.push(p); });
    } else groups = [{ month: '', list: photos }];
    groups.forEach(function (g) {
      var i = 0;
      counts(g.list.length, PATTERNS[tpl], 0, tpl !== 'classic' && tpl !== 'magazine').forEach(function (c, j) {
        var set = g.list.slice(i, i + c); i += c;
        var pg = { layout: layoutFor(tpl, set), photos: set };
        if (tpl === 'timeline' && j === 0) pg.chapter = g.month;
        pages.push(pg);
      });
    });
    if (tpl === 'classic') { // 예전 규칙: 4장 쪽 뒤에 1장만 남지 않게
      for (var q = pages.length - 1; q > 0; q--) if (pages[q].photos.length === 1 && pages[q - 1].photos.length === 4 && q === pages.length - 1) {
        var mv = pages[q - 1].photos.pop(); pages[q].photos.unshift(mv);
        pages[q - 1].layout = layoutFor('classic', pages[q - 1].photos); pages[q].layout = layoutFor('classic', pages[q].photos);
      }
    }
    return pages;
  }
  function byDate(a, b) { return (a.date || '').localeCompare(b.date || '') || (a.time || '').localeCompare(b.time || '') || (a.name || '').localeCompare(b.name || ''); }
  function dateRange(photos) {
    var ds = photos.map(function (p) { return p.date; }).filter(Boolean).sort();
    if (!ds.length) return '';
    var a = ds[0].replace(/-/g, '.'), b = ds[ds.length - 1].replace(/-/g, '.');
    return a === b ? a : a + ' – ' + b;
  }

  var TYPES = [
    { id: 'growth', name: '성장앨범', tone: 'garden', hint: '아이가 자라는 모습을 날짜 순서로. 기준일(생일)을 넣으면 쪽마다 나이가 붙어요.' },
    { id: 'family', name: '가족앨범', tone: 'ember', hint: '가족이 함께한 하루하루.' },
    { id: 'trip', name: '여행앨범', tone: 'pool', hint: '어디로, 누구와, 무엇을 봤는지.' },
    { id: 'event', name: '기념일앨범', tone: 'lock', hint: '생일, 명절, 입학·졸업 같은 특별한 날.' },
    { id: 'school', name: '학교생활앨범', tone: 'oak', hint: '학교·학원·체험학습의 기록.' },
    { id: 'etc', name: '기타', tone: 'oak', hint: '종류 이름을 직접 적어도 돼요.' }
  ];
  function typeOf(id) { return TYPES.filter(function (t) { return t.id === id; })[0] || TYPES[TYPES.length - 1]; }

  // 디자인 샘플 5권: 실제 사진 없이 그림으로 만든 예시 사진만 씀 (장수 20·30·50·100)
  var SAMPLES = [
    { id: 'sample-classic', template: 'classic', n: 20, type: 'family', title: '우리 가족의 봄', start: '2025-03-02', span: 80, desc: '벚꽃이 피고 지는 동안 주말마다 걸었던 길.\n사진 20장, 한 쪽에 1~4장씩 천천히 넘겨 보는 클래식 앨범이에요.' },
    { id: 'sample-magazine', template: 'magazine', n: 30, type: 'trip', title: '바다 마을 4박 5일', start: '2025-07-28', span: 5, desc: '파도 소리로 아침을 열고, 노을로 하루를 닫았던 닷새.\n사진 30장을 잡지처럼 크게 펼친 매거진 앨범이에요.' },
    { id: 'sample-collage', template: 'collage', n: 50, type: 'family', title: '여름방학 스크랩북', start: '2025-07-20', span: 40, desc: '수영장, 캠핑, 할머니 댁, 그리고 비 오는 날의 보드게임.\n사진 50장을 폴라로이드처럼 붙인 콜라주 앨범이에요.' },
    { id: 'sample-grid', template: 'grid', n: 100, type: 'family', title: '우리 집 1년, 100장', start: '2025-01-01', span: 364, desc: '1월부터 12월까지, 평범해서 더 소중한 하루들.\n사진 100장을 한 쪽에 6~9장씩 담은 그리드 앨범이에요.' },
    { id: 'sample-timeline', template: 'timeline', n: 30, type: 'growth', title: '첫 돌까지 열두 달', start: '2025-01-12', span: 360, birth: '2025-01-10', desc: '처음 눈을 맞춘 날부터 첫걸음을 뗀 날까지.\n사진 30장을 달마다 나눈 성장 타임라인 앨범이에요.' }
  ];
  var SAMPLE_COUNTS = [20, 30, 50, 100];

  // 앨범 한 권의 쪽 구성: 표지 → 머리말 → 사진 쪽들 → 마지막 쪽
  function bookPages(album, photosById) {
    var ph = (album.photoIds || []).map(function (id) { return photosById[id]; }).filter(Boolean);
    var cover = photosById[album.cover] || ph[0];
    var pages = [{ kind: 'cover', photo: cover, mosaic: ph.slice(0, 9) }, { kind: 'intro' }];
    paginate(ph, album.template || 'classic').forEach(function (p) { pages.push({ kind: 'photos', layout: p.layout, photos: p.photos, chapter: p.chapter }); });
    pages.push({ kind: 'end', count: ph.length });
    return pages;
  }

  var API = { esc: esc, sha256: sha256, pinHash: pinHash, DEFAULT_PIN_HASH: DEFAULT_PIN_HASH, dateFromName: dateFromName, exifDate: exifDate, ageLabel: ageLabel, paginate: paginate, bookPages: bookPages, byDate: byDate, dateRange: dateRange, TYPES: TYPES, typeOf: typeOf, TEMPLATES: TEMPLATES, tplOf: tplOf, recommendTemplate: recommendTemplate, PATTERNS: PATTERNS, SAMPLES: SAMPLES, SAMPLE_COUNTS: SAMPLE_COUNTS };
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; return; }
  if (!root.document) return;

  // ================= 브라우저 =================
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var stage = $('#stage'), side = $('#side');
  var PIN_KEY = 'onieum-album-pin', OPEN_KEY = 'onieum-album-open';

  function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('show'); }, 2200); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function sstore(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function currentHash() { return store(PIN_KEY) || DEFAULT_PIN_HASH; }

  // ---------- 잠금 ----------
  function gate() {
    var form = $('#gateForm'), pin = $('#pin'), dots = $$('#pinDots i');
    pin.addEventListener('input', function () { dots.forEach(function (d, i) { d.classList.toggle('on', i < pin.value.length); }); $('#gateErr').textContent = ''; if (pin.value.length === 4 && pinHash(pin.value) === currentHash()) form.requestSubmit ? form.requestSubmit() : open(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (pinHash(pin.value) === currentHash()) { sstore(OPEN_KEY, currentHash()); open(); }
      else { $('#gateErr').textContent = '비밀번호가 맞지 않아요.'; form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); pin.select(); }
    });
    if (sstore(OPEN_KEY) === currentHash()) open(); else setTimeout(function () { pin.focus(); }, 50);
  }
  function open() {
    $('#gate').hidden = true; $('#albumApp').hidden = false; $('#pin').value = '';
    sstore(OPEN_KEY, currentHash());
    boot();
  }
  $('#lockBtn').addEventListener('click', function () { sstore(OPEN_KEY, null); location.reload(); });

  // ---------- IndexedDB ----------
  var dbp;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      var r = indexedDB.open('onieum-album', 1);
      r.onupgradeneeded = function () { var d = r.result; d.createObjectStore('photos', { keyPath: 'id' }); d.createObjectStore('albums', { keyPath: 'id' }); };
      r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
    });
    return dbp;
  }
  function tx(storeName, mode, fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction(storeName, mode), s = t.objectStore(storeName), out = fn(s);
        t.oncomplete = function () { res(out && out.result !== undefined ? out.result : out); }; t.onerror = function () { rej(t.error); }; t.onabort = function () { rej(t.error); };
      });
    });
  }
  var put = function (st, v) { return tx(st, 'readwrite', function (s) { s.put(v); }); };
  var del = function (st, id) { return tx(st, 'readwrite', function (s) { s.delete(id); }); };
  var all = function (st) { return tx(st, 'readonly', function (s) { return s.getAll(); }); };

  // ---------- 상태 ----------
  var S = { photos: [], albums: [], byId: {}, tab: 'db', sel: [], year: 'all', focus: null, album: null, spread: 0, draft: null, editing: null, sample: null, wantTpl: null };
  var urls = {};
  function thumbUrl(p) { return urls['t' + p.id] || (urls['t' + p.id] = URL.createObjectURL(p.thumb || p.blob)); }
  function fullUrl(p) { return urls['f' + p.id] || (urls['f' + p.id] = URL.createObjectURL(p.blob)); }
  function dropUrls(id) { ['t', 'f'].forEach(function (k) { if (urls[k + id]) { URL.revokeObjectURL(urls[k + id]); delete urls[k + id]; } }); }
  function reindex() { S.photos.sort(byDate); S.byId = {}; S.photos.forEach(function (p) { S.byId[p.id] = p; }); S.sel = S.sel.filter(function (id) { return S.byId[id]; }); }
  function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function boot() {
    Promise.all([all('photos'), all('albums')]).then(function (r) {
      S.photos = r[0] || []; S.albums = (r[1] || []).sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
      reindex(); renderList();
      var q = new URLSearchParams(location.search);
      if (q.get('album') && S.albums.some(function (a) { return a.id === q.get('album'); })) showAlbum(q.get('album'));
      else tab(S.albums.length && S.photos.length ? 'book' : 'db');
    }).catch(function (e) { stage.innerHTML = '<div class="card-s"><h3>이 브라우저에서는 사진 저장소를 열 수 없어요</h3><p class="muted">시크릿(사생활 보호) 창이거나 저장 공간이 막혀 있을 수 있어요. 일반 창에서 다시 열어 주세요.</p><p class="note-s">' + esc(e && e.message) + '</p></div>'; });
  }

  // ---------- 사진 등록 ----------
  function loadImage(blob) {
    return new Promise(function (res, rej) { var u = URL.createObjectURL(blob), im = new Image(); im.onload = function () { res({ img: im, url: u }); }; im.onerror = function () { URL.revokeObjectURL(u); rej(new Error('그림 파일을 읽지 못했어요')); }; im.src = u; });
  }
  function shrink(img, max, q) {
    var w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, max / Math.max(w, h)), c = document.createElement('canvas');
    c.width = Math.round(w * k); c.height = Math.round(h * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return new Promise(function (res) { c.toBlob(function (b) { res({ blob: b, w: c.width, h: c.height }); }, 'image/jpeg', q); });
  }
  function addFiles(files) {
    files = Array.prototype.filter.call(files, function (f) { return /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|heic)$/i.test(f.name); });
    if (!files.length) return;
    var known = {}; S.photos.forEach(function (p) { known[p.name + '|' + p.size] = 1; });
    var done = 0, skipped = 0, failed = 0, bar = $('#upBar');
    var chain = Promise.resolve();
    files.forEach(function (f) {
      chain = chain.then(function () {
        if (known[f.name + '|' + f.size]) { skipped++; return; }
        return f.slice(0, 256 * 1024).arrayBuffer().then(function (buf) {
          var when = exifDate(buf) || dateFromName(f.name) || { date: ymd(new Date(f.lastModified || Date.now())), time: '' , guess: true };
          return loadImage(f).then(function (L) {
            return Promise.all([shrink(L.img, 1800, 0.86), shrink(L.img, 420, 0.8)]).then(function (r) {
              URL.revokeObjectURL(L.url);
              var p = { id: uid('p'), name: f.name, size: f.size, date: when.date, time: when.time || '', guessed: !!when.guess, memo: '', w: r[0].w, h: r[0].h, blob: r[0].blob, thumb: r[1].blob, added: Date.now() };
              return put('photos', p).then(function () { S.photos.push(p); known[f.name + '|' + f.size] = 1; });
            });
          });
        }).catch(function () { failed++; }).then(function () { done++; if (bar) bar.style.width = Math.round(done / files.length * 100) + '%'; });
      });
    });
    if (bar) bar.parentNode.hidden = false;
    chain.then(function () {
      reindex(); renderList(); if (S.tab === 'db') renderDb();
      toast((files.length - skipped - failed) + '장 등록' + (skipped ? ' · 이미 있는 ' + skipped + '장은 건너뜀' : '') + (failed ? ' · ' + failed + '장 실패(HEIC는 JPG로 바꿔 주세요)' : ''));
    });
  }

  // 예시 사진: 실제 가족 사진 없이 기능을 둘러볼 수 있게 그림을 그려서 넣음
  function samplePhotos() {
    var scenes = [['봄 소풍', '#f6c9b8', '#9cc8a0', 'sun'], ['바닷가', '#bfe3ef', '#e8d9b0', 'wave'], ['생일 케이크', '#f3dfe8', '#f2b0a6', 'cake'], ['가을 산책', '#f3d7a8', '#c98a4b', 'tree'], ['첫눈', '#dfe8f2', '#ffffff', 'snow'], ['자전거', '#d9efe0', '#8fb7c9', 'bike'], ['도서관', '#efe6d4', '#b88b5a', 'book'], ['별 보기', '#1f2b45', '#3a4a6b', 'star']];
    var base = new Date(); base.setMonth(base.getMonth() - 10);
    return Promise.all(scenes.map(function (s, i) {
      var wide = i % 3 === 1, c = document.createElement('canvas'); c.width = wide ? 1200 : 900; c.height = wide ? 800 : 1200;
      var g = c.getContext('2d'), W = c.width, H = c.height, gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, s[1]); gr.addColorStop(1, s[2]); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,.55)';
      if (s[3] === 'sun' || s[3] === 'tree') { g.beginPath(); g.arc(W * .75, H * .22, W * .1, 0, 7); g.fillStyle = '#ffd36e'; g.fill(); }
      if (s[3] === 'star') for (var k = 0; k < 60; k++) { g.fillStyle = 'rgba(255,255,255,' + (0.4 + (k % 5) / 8) + ')'; g.fillRect((k * 137) % W, (k * 89) % (H * .7), 3, 3); }
      if (s[3] === 'snow') for (k = 0; k < 90; k++) { g.beginPath(); g.arc((k * 97) % W, (k * 61) % H, 4 + k % 5, 0, 7); g.fillStyle = 'rgba(255,255,255,.9)'; g.fill(); }
      g.fillStyle = 'rgba(46,42,37,.18)'; g.beginPath(); g.moveTo(0, H * .72); g.quadraticCurveTo(W * .3, H * .55, W * .6, H * .7); g.quadraticCurveTo(W * .8, H * .8, W, H * .66); g.lineTo(W, H); g.lineTo(0, H); g.fill();
      g.fillStyle = 'rgba(46,42,37,.7)'; g.font = '700 ' + Math.round(W / 11) + 'px "Gowun Batang", serif'; g.textAlign = 'center'; g.fillText(s[0], W / 2, H * .5);
      g.font = '500 ' + Math.round(W / 26) + 'px "Noto Sans KR", sans-serif'; g.fillText('예시 사진', W / 2, H * .5 + W / 12);
      var d = new Date(base); d.setDate(d.getDate() + i * 38);
      return new Promise(function (res) { c.toBlob(function (b) { res({ id: uid('x'), name: '예시_' + s[0] + '.jpg', size: b.size, date: ymd(d), time: '', memo: s[0] + ' (예시)', w: W, h: H, blob: b, thumb: b, sample: true, added: Date.now() }); }, 'image/jpeg', 0.85); });
    }));
  }

  // ---------- 왼쪽: 앨범 목록 ----------
  function renderList() {
    var ul = $('#albumList'), html = '';
    if (!S.albums.length) html = '<li class="note-s" style="padding:8px 10px">아직 앨범이 없어요. 사진 DB에서 사진을 고른 뒤 <b>앨범 만들기</b>를 누르세요.</li>';
    TYPES.forEach(function (t) {
      var list = S.albums.filter(function (a) { return typeOf(a.type).id === t.id; });
      if (!list.length) return;
      html += '<li class="grp">' + esc(t.name) + '</li>' + list.map(function (a) {
        return '<li><button data-album="' + esc(a.id) + '"' + (S.tab === 'book' && !S.sample && S.album === a.id ? ' class="on"' : '') + '>' + esc(a.title || '(제목 없음)') + '<small>' + esc((a.date || '').replace(/-/g, '.')) + ' · 사진 ' + (a.photoIds || []).length + '장' + (a.typeName ? ' · ' + esc(a.typeName) : '') + '</small></button></li>';
      }).join('');
    });
    html += '<li class="grp">디자인 샘플 (예시 그림)</li>' + SAMPLES.map(function (x) {
      return '<li><button data-sample="' + x.id + '"' + (S.tab === 'book' && S.sample && S.sample.id === x.id ? ' class="on"' : '') + '>' + esc(tplOf(x.template).name) + ' · ' + x.n + '장<small>' + esc(x.title) + ' · ' + esc(typeOf(x.type).name) + '</small></button></li>';
    }).join('');
    ul.innerHTML = html;
    var n = S.photos.filter(function (p) { return !p.sample; }).length, x = S.photos.length - n;
    $('#dbCount').textContent = '이 기기에 사진 ' + n + '장' + (x ? ' (+예시 ' + x + ')' : '') + ' · 앨범 ' + S.albums.length + '권';
  }
  $('#albumList').addEventListener('click', function (e) { var b = e.target.closest('[data-album]'); if (b) showAlbum(b.dataset.album); var sb = e.target.closest('[data-sample]'); if (sb) showSample(sb.dataset.sample); });
  $('#newAlbum').addEventListener('click', function () { S.editing = null; S.draft = null; tab(S.sel.length ? 'make' : 'db'); if (!S.sel.length) toast('먼저 앨범에 넣을 사진을 골라 주세요'); });

  // ---------- 탭 ----------
  function tab(t) {
    S.tab = t;
    $$('[data-tab]').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === t); b.setAttribute('aria-selected', b.dataset.tab === t); });
    document.body.dataset.tab = t;
    if (t === 'db') renderDb(); else if (t === 'make') renderMake(); else renderBook();
    renderList(); updateSel();
  }
  $$('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { if (b.dataset.tab === 'book' && !S.album && !S.sample && S.albums.length) S.album = S.albums[0].id; tab(b.dataset.tab); }); });
  function updateSel() { $('#selInfo').textContent = S.sel.length ? '고른 사진 ' + S.sel.length + '장' : ''; }

  // ---------- ① 사진 DB ----------
  function renderDb() {
    var years = {}; S.photos.forEach(function (p) { var y = (p.date || '????').slice(0, 4); years[y] = (years[y] || 0) + 1; });
    var ys = Object.keys(years).sort().reverse();
    if (S.year !== 'all' && !years[S.year]) S.year = 'all';
    var list = S.photos.filter(function (p) { return S.year === 'all' || (p.date || '????').slice(0, 4) === S.year; });
    var groups = {}; list.forEach(function (p) { var k = (p.date || '날짜 없음').slice(0, 7); (groups[k] = groups[k] || []).push(p); });
    var keys = Object.keys(groups).sort().reverse();
    stage.innerHTML =
      '<div class="al-drop" id="drop"><input type="file" id="fileIn" accept="image/*" multiple hidden>' +
      '<b>사진을 여기로 끌어다 놓거나</b> <button class="btn-s pri" id="pick">사진 등록하기</button>' +
      '<p class="note-s">사진은 이 기기 브라우저 안에만 저장돼요. 인터넷(GitHub)에는 올라가지 않아요. 찍은 날짜는 사진 정보나 파일 이름(예: 20220608_173912.jpg)에서 자동으로 읽어요.</p>' +
      '<div class="al-prog" hidden><i id="upBar"></i></div></div>' +
      (S.photos.length ? '<div class="al-bar"><div class="tabs"><button class="btn-s' + (S.year === 'all' ? ' on' : '') + '" data-year="all">전체 ' + S.photos.length + '</button>' + ys.map(function (y) { return '<button class="btn-s' + (S.year === y ? ' on' : '') + '" data-year="' + esc(y) + '">' + esc(y) + ' · ' + years[y] + '</button>'; }).join('') + '</div><span class="sp"></span>' +
        '<button class="btn-s" id="selAll">보이는 사진 모두 고르기</button><button class="btn-s" id="selNone"' + (S.sel.length ? '' : ' disabled') + '>고르기 취소</button><button class="btn-s pri" id="toMake"' + (S.sel.length ? '' : ' disabled') + '>고른 ' + S.sel.length + '장으로 앨범 만들기 →</button></div>' +
        keys.map(function (k) {
          return '<section class="al-month"><h3>' + esc(k === '날짜 없음' ? k : k.replace('-', '년 ') + '월') + ' <small>' + groups[k].length + '장</small></h3><ul class="al-grid">' + groups[k].map(function (p) {
            var i = S.sel.indexOf(p.id);
            return '<li><button class="al-th' + (i >= 0 ? ' sel' : '') + (S.focus === p.id ? ' focus' : '') + '" data-pid="' + esc(p.id) + '" aria-pressed="' + (i >= 0) + '" title="' + esc(p.name) + '"><img src="' + thumbUrl(p) + '" alt="' + esc(p.memo || p.name) + '" loading="lazy"><span class="al-chk">' + (i >= 0 ? i + 1 : '') + '</span>' + (p.sample ? '<em>예시</em>' : '') + '<span class="al-d">' + esc((p.date || '').slice(5).replace('-', '.')) + '</span></button></li>';
          }).join('') + '</ul></section>';
        }).join('')
      : '<div class="card-s al-empty"><h3>사진 DB가 비어 있어요</h3><p class="muted">위의 <b>사진 등록하기</b>로 가족 사진을 넣어 주세요. 먼저 둘러보고 싶다면 그림으로 만든 예시 사진을 넣어 볼 수 있어요.</p><button class="btn-s" id="addSample">예시 사진 8장 넣기</button></div>');
    var fi = $('#fileIn');
    $('#pick').addEventListener('click', function () { fi.click(); });
    fi.addEventListener('change', function () { addFiles(fi.files); fi.value = ''; });
    var drop = $('#drop');
    ['dragenter', 'dragover'].forEach(function (ev) { stage.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { stage.addEventListener(ev, function (e) { e.preventDefault(); if (ev === 'drop' || e.target === stage) drop.classList.remove('over'); }); });
    stage.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }, { once: true });
    var sb = $('#addSample'); if (sb) sb.addEventListener('click', function () { sb.disabled = true; samplePhotos().then(function (ps) { return Promise.all(ps.map(function (p) { return put('photos', p); })).then(function () { S.photos = S.photos.concat(ps); reindex(); renderList(); renderDb(); toast('예시 사진 8장을 넣었어요'); }); }); });
    $$('[data-year]').forEach(function (b) { b.addEventListener('click', function () { S.year = b.dataset.year; renderDb(); }); });
    var sa = $('#selAll'); if (sa) sa.addEventListener('click', function () { list.forEach(function (p) { if (S.sel.indexOf(p.id) < 0) S.sel.push(p.id); }); renderDb(); updateSel(); });
    var sn = $('#selNone'); if (sn) sn.addEventListener('click', function () { S.sel = []; renderDb(); updateSel(); });
    var tm = $('#toMake'); if (tm) tm.addEventListener('click', function () { tab('make'); });
    $$('.al-th', stage).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.dataset.pid, i = S.sel.indexOf(id);
        if (i >= 0) S.sel.splice(i, 1); else S.sel.push(id);
        S.focus = id; renderDb(); updateSel();
      });
    });
    sideDb();
  }
  function sideDb() {
    var p = S.byId[S.focus];
    $('#sideTitle').textContent = p ? '사진 정보' : '사진 DB 사용법';
    if (!p) {
      side.innerHTML = '<ol class="al-steps"><li><b>사진 등록</b> — 가족 사진을 사진 DB에 넣어요. 날짜별로 정리돼요.</li><li><b>사진 고르기</b> — 앨범에 넣을 사진만 눌러서 골라요. 누른 순서대로 번호가 붙어요.</li><li><b>앨범 만들기</b> — 종류(성장·가족 등), 제목, 날짜, 내용을 적어요.</li><li><b>앨범북</b> — 책처럼 넘겨 보고, 인쇄하거나 PDF로 저장해요.</li></ol>' + privacyNote();
      return;
    }
    side.innerHTML = '<img class="al-preview" src="' + fullUrl(p) + '" alt="">' +
      '<label class="field"><span>찍은 날짜' + (p.guessed ? ' (파일 날짜로 추정 — 확인해 주세요)' : '') + '</span><input type="date" id="pDate" value="' + esc(p.date) + '"></label>' +
      '<label class="field"><span>한 줄 메모 (앨범북 사진 아래에 나와요)</span><input id="pMemo" value="' + esc(p.memo) + '" maxlength="60" placeholder="예: 처음 자전거 탄 날"></label>' +
      '<p class="note-s">' + esc(p.name) + ' · ' + p.w + '×' + p.h + '</p>' +
      '<div class="tabs"><button class="btn-s pri" id="pSave">저장</button><button class="btn-s" id="pDel">사진 지우기</button></div>' + privacyNote();
    $('#pSave').addEventListener('click', function () { p.date = $('#pDate').value || p.date; p.memo = $('#pMemo').value.trim(); p.guessed = false; put('photos', p).then(function () { reindex(); renderDb(); toast('저장했어요'); }); });
    var dl = $('#pDel');
    dl.addEventListener('click', function () {
      var used = S.albums.filter(function (a) { return (a.photoIds || []).indexOf(p.id) >= 0; }).length;
      if (!dl.dataset.sure) { dl.dataset.sure = 1; dl.textContent = used ? '앨범 ' + used + '권에서도 빠져요. 정말 지울까요?' : '정말 지울까요?'; dl.classList.add('pri'); return; }
      removePhoto(p.id).then(function () { S.focus = null; renderDb(); toast('사진을 지웠어요'); });
    });
  }
  function removePhoto(id) {
    var jobs = [del('photos', id)];
    S.albums.forEach(function (a) { var i = (a.photoIds || []).indexOf(id); if (i >= 0) { a.photoIds.splice(i, 1); if (a.cover === id) a.cover = a.photoIds[0] || null; jobs.push(put('albums', a)); } });
    S.photos = S.photos.filter(function (p) { return p.id !== id; }); dropUrls(id); reindex();
    return Promise.all(jobs).then(renderList);
  }
  function privacyNote() {
    return '<div class="al-note"><b>사진은 어디에 저장되나요?</b><p>이 기기의 이 브라우저 안에만 저장돼요. 온-이음 저장소(GitHub)나 다른 서버로는 보내지 않아요. 그래서 다른 기기에서 보려면 왼쪽 아래 <b>백업 저장</b>으로 파일을 만든 뒤 그 기기에서 <b>불러오기</b> 하세요. 브라우저의 \'사이트 데이터 삭제\'를 하면 사진도 지워지니 가끔 백업해 두세요.</p></div>';
  }

  // ---------- ② 앨범 만들기 ----------
  function blankDraft() {
    var ps = S.sel.map(function (id) { return S.byId[id]; }).filter(Boolean);
    var ds = ps.map(function (p) { return p.date; }).filter(Boolean).sort();
    return { type: 'family', typeName: '', title: '', date: ds[ds.length - 1] || ymd(new Date()), desc: '', birth: '', cover: S.sel[0] || null, template: S.wantTpl || null };
  }
  function keepForm(d) {
    if (!d || !$('#mkForm')) return;
    d.title = $('#mTitle').value; d.date = $('#mDate').value; d.desc = $('#mDesc').value;
    var b = $('#mBirth'); if (b) d.birth = b.value; var tn = $('#mTypeName'); if (tn) d.typeName = tn.value;
  }
  function renderMake() {
    if (!S.draft) S.draft = blankDraft(); else keepForm(S.draft);
    var d = S.draft, ps = S.sel.map(function (id) { return S.byId[id]; }).filter(Boolean);
    if (ps.length && S.sel.indexOf(d.cover) < 0) d.cover = S.sel[0];
    stage.innerHTML = !ps.length ? '<div class="card-s al-empty"><h3>고른 사진이 없어요</h3><p class="muted">사진 DB에서 앨범에 넣을 사진을 눌러 고른 뒤 다시 오세요.</p><button class="btn-s pri" id="goDb">① 사진 DB로</button></div>' :
      '<div class="al-bar"><b>앨범에 들어갈 사진 ' + ps.length + '장</b><span class="note-s">이 순서대로 앨범북에 실려요. ★은 표지 사진.</span><span class="sp"></span><button class="btn-s" id="sortDate">찍은 날짜순으로</button><button class="btn-s" id="addMore">사진 더 고르기</button></div>' +
      '<ol class="al-order">' + ps.map(function (p, i) {
        return '<li><img src="' + thumbUrl(p) + '" alt=""><span class="n">' + (i + 1) + '</span><span class="al-d">' + esc((p.date || '').replace(/-/g, '.')) + '</span><div class="ops"><button title="앞으로" data-mv="-1" data-i="' + i + '"' + (i ? '' : ' disabled') + '>‹</button><button title="표지로" data-cover="' + esc(p.id) + '" class="' + (d.cover === p.id ? 'on' : '') + '">★</button><button title="빼기" data-rm="' + i + '">✕</button><button title="뒤로" data-mv="1" data-i="' + i + '"' + (i < ps.length - 1 ? '' : ' disabled') + '>›</button></div></li>';
      }).join('') + '</ol>';
    var g = $('#goDb'); if (g) g.addEventListener('click', function () { tab('db'); });
    var sd = $('#sortDate'); if (sd) sd.addEventListener('click', function () { S.sel.sort(function (a, b) { return byDate(S.byId[a], S.byId[b]); }); renderMake(); });
    var am = $('#addMore'); if (am) am.addEventListener('click', function () { tab('db'); });
    $$('[data-mv]', stage).forEach(function (b) { b.addEventListener('click', function () { var i = +b.dataset.i, j = i + +b.dataset.mv, t = S.sel[i]; S.sel[i] = S.sel[j]; S.sel[j] = t; renderMake(); }); });
    $$('[data-cover]', stage).forEach(function (b) { b.addEventListener('click', function () { d.cover = b.dataset.cover; renderMake(); }); });
    $$('[data-rm]', stage).forEach(function (b) { b.addEventListener('click', function () { S.sel.splice(+b.dataset.rm, 1); renderMake(); updateSel(); }); });

    $('#sideTitle').textContent = S.editing ? '앨범 고치기' : '앨범 정보';
    var t = typeOf(d.type);
    side.innerHTML = '<form id="mkForm">' +
      '<div class="field"><span>앨범 종류</span><div class="al-types">' + TYPES.map(function (x) { return '<button type="button" class="chip-s ' + x.tone + (x.id === d.type ? ' on' : '') + '" data-type="' + x.id + '">' + esc(x.name) + '</button>'; }).join('') + '</div><p class="note-s" style="margin:6px 0 0">' + esc(t.hint) + '</p></div>' +
      (d.type === 'etc' ? '<label class="field"><span>종류 이름</span><input id="mTypeName" value="' + esc(d.typeName) + '" maxlength="20" placeholder="예: 반려동물앨범"></label>' : '') +
      '<label class="field"><span>앨범 제목</span><input id="mTitle" value="' + esc(d.title) + '" maxlength="40" required placeholder="예: 우리 가족의 2022년 여름"></label>' +
      '<label class="field"><span>날짜</span><input type="date" id="mDate" value="' + esc(d.date) + '" required></label>' +
      (d.type === 'growth' ? '<label class="field"><span>기준일 (생일, 선택) — 쪽마다 \'생후 N개월\'이 붙어요</span><input type="date" id="mBirth" value="' + esc(d.birth) + '"></label>' : '') +
      '<label class="field"><span>내용 (머리말)</span><textarea id="mDesc" class="al-ta" maxlength="1200" placeholder="이 앨범에 담고 싶은 이야기를 적어 주세요.">' + esc(d.desc) + '</textarea></label>' +
      '<div class="field"><span>디자인' + (d.template ? '' : ' (사진 ' + ps.length + '장에 맞춰 자동 추천)') + '</span>' + tplChips(d.template || recommendTemplate(ps.length, d.type), recommendTemplate(ps.length, d.type), 'data-mtpl') + '<p class="note-s" style="margin:6px 0 0">' + esc(tplOf(d.template || recommendTemplate(ps.length, d.type)).desc) + '</p></div>' +
      (ps.length ? '<p class="note-s">사진 날짜: ' + esc(dateRange(ps)) + '</p>' : '') +
      '<div class="tabs"><button class="btn-s pri" type="submit"' + (ps.length ? '' : ' disabled') + '>' + (S.editing ? '고친 내용 저장' : '앨범북 만들기') + '</button>' + (S.editing ? '<button class="btn-s" type="button" id="mCancel">취소</button>' : '') + '</div></form>';
    var keep = function () { keepForm(d); };
    $$('[data-type]', side).forEach(function (b) { b.addEventListener('click', function () { keep(); d.type = b.dataset.type; renderMake(); }); });
    $$('[data-mtpl]', side).forEach(function (b) { b.addEventListener('click', function () { keep(); d.template = b.dataset.mtpl; renderMake(); }); });
    var mc = $('#mCancel'); if (mc) mc.addEventListener('click', function () { var id = S.editing; S.editing = null; S.draft = null; S.sel = []; showAlbum(id); });
    $('#mkForm').addEventListener('submit', function (e) {
      e.preventDefault(); keep();
      if (!d.title.trim()) { $('#mTitle').focus(); return; }
      var old = S.editing && S.albums.filter(function (a) { return a.id === S.editing; })[0];
      var a = old || { id: uid('a'), created: Date.now() };
      a.type = d.type; a.typeName = d.type === 'etc' ? d.typeName.trim() : ''; a.title = d.title.trim(); a.date = d.date; a.desc = d.desc.trim(); a.birth = d.type === 'growth' ? d.birth : ''; a.photoIds = S.sel.slice(); a.cover = d.cover; a.template = d.template || recommendTemplate(a.photoIds.length, a.type); a.updated = Date.now();
      put('albums', a).then(function () {
        if (!old) S.albums.unshift(a);
        S.albums.sort(function (x, y) { return (y.date || '').localeCompare(x.date || ''); });
        var was = !!old; S.editing = null; S.draft = null; S.sel = []; S.wantTpl = null; showAlbum(a.id); toast(was ? '앨범을 고쳤어요' : '앨범북을 만들었어요');
      });
    });
  }

  // ---------- ③ 앨범북 ----------
  function showAlbum(id) { S.album = id; S.sample = null; S.spread = 0; tab('book'); }
  function showSample(id, n, tpl) {
    var base = SAMPLES.filter(function (x) { return x.id === id; })[0] || SAMPLES[0];
    S.sample = { id: base.id, n: n || base.n, template: tpl || base.template }; S.album = null; S.spread = 0;
    var my = S.sample; if (!sampleCache[S.sample.n + '|' + base.start + '|' + base.span]) stage.innerHTML = '<p class="muted" style="text-align:center;padding:40px">예시 사진 ' + S.sample.n + '장을 그리는 중…</p>';
    sampleBook().then(function () { if (S.sample === my) tab('book'); });
  }

  // 예시 사진: 그림을 그려 만듦(가족 사진 아님). 장수·시작일이 같으면 같은 그림
  var sampleCache = {};
  var SCENES = [['봄 소풍', 18, 'sun'], ['바닷가', 195, 'wave'], ['생일 케이크', 340, 'cake'], ['가을 산책', 32, 'tree'], ['첫눈', 210, 'snow'], ['자전거', 140, 'hill'], ['도서관', 28, 'book'], ['별 보기', 230, 'star'], ['캠핑', 110, 'tent'], ['놀이터', 60, 'hill'], ['수영장', 185, 'wave'], ['할머니 댁', 12, 'house']];
  function drawSample(i, label) {
    var sc = SCENES[i % SCENES.length], shape = i % 5 === 1 ? 'wide' : i % 7 === 3 ? 'sq' : 'tall';
    var W = shape === 'wide' ? 720 : shape === 'sq' ? 600 : 540, H = shape === 'wide' ? 480 : shape === 'sq' ? 600 : 720;
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d'), hue = (sc[1] + i * 7) % 360, night = sc[2] === 'star';
    var gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, night ? 'hsl(' + hue + ',45%,18%)' : 'hsl(' + hue + ',60%,86%)'); gr.addColorStop(1, night ? 'hsl(' + hue + ',40%,32%)' : 'hsl(' + ((hue + 40) % 360) + ',45%,72%)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (night) for (var k = 0; k < 70; k++) { g.fillStyle = 'rgba(255,255,255,' + (0.35 + (k % 5) / 8) + ')'; g.fillRect((k * 137 + i * 31) % W, (k * 89) % (H * 0.7), 3, 3); }
    else { g.beginPath(); g.arc(W * (0.2 + (i % 4) * 0.2), H * 0.2, Math.min(W, H) * 0.08, 0, 7); g.fillStyle = 'rgba(255,214,120,.9)'; g.fill(); }
    if (sc[2] === 'snow') for (k = 0; k < 80; k++) { g.beginPath(); g.arc((k * 97) % W, (k * 61) % H, 3 + k % 4, 0, 7); g.fillStyle = 'rgba(255,255,255,.9)'; g.fill(); }
    g.fillStyle = 'hsla(' + ((hue + 120) % 360) + ',30%,35%,.35)'; g.beginPath(); g.moveTo(0, H * 0.7); g.quadraticCurveTo(W * 0.3, H * (0.52 + (i % 3) * 0.04), W * 0.6, H * 0.68); g.quadraticCurveTo(W * 0.85, H * 0.8, W, H * 0.62); g.lineTo(W, H); g.lineTo(0, H); g.fill();
    // 사람 모양 둘(단순한 도형)
    for (k = 0; k < 2 + (i % 2); k++) { var x = W * (0.32 + k * 0.16), y = H * 0.74, r = Math.min(W, H) * (k === 2 ? 0.035 : 0.05); g.fillStyle = 'hsla(' + ((hue + 200 + k * 50) % 360) + ',45%,45%,.85)'; g.beginPath(); g.arc(x, y - r * 3.2, r, 0, 7); g.fill(); g.fillRect(x - r * 0.9, y - r * 2.1, r * 1.8, r * 3); }
    g.fillStyle = night ? 'rgba(255,255,255,.85)' : 'rgba(46,42,37,.62)'; g.textAlign = 'center';
    g.font = '700 ' + Math.round(W / 12) + 'px "Gowun Batang", serif'; g.fillText(label || sc[0], W / 2, H * 0.44);
    g.font = '500 ' + Math.round(W / 30) + 'px "Noto Sans KR", sans-serif'; g.fillText('예시 사진 ' + (i + 1), W / 2, H * 0.44 + W / 14);
    return new Promise(function (res) { c.toBlob(function (b) { res({ blob: b, w: W, h: H, scene: sc[0] }); }, 'image/jpeg', 0.82); });
  }
  function samplePhotosFor(n, start, span) {
    var key = n + '|' + start + '|' + span;
    if (sampleCache[key]) return Promise.resolve(sampleCache[key]);
    var t0 = new Date(start + 'T00:00:00'), jobs = [];
    for (var i = 0; i < n; i++) jobs.push(drawSample(i));
    return Promise.all(jobs).then(function (rs) {
      var list = rs.map(function (r, i) {
        var d = new Date(t0); d.setDate(d.getDate() + Math.round(i * span / Math.max(1, n - 1)));
        return { id: 'smp' + n + '_' + i, name: '예시_' + (i + 1) + '.jpg', date: ymd(d), time: '', memo: i % 3 === 0 ? r.scene : '', w: r.w, h: r.h, blob: r.blob, thumb: r.blob, sample: true };
      });
      return (sampleCache[key] = list);
    });
  }
  function sampleBook() {
    var sm = S.sample, base = SAMPLES.filter(function (x) { return x.id === sm.id; })[0];
    return samplePhotosFor(sm.n, base.start, base.span).then(function (list) {
      var byId = {}; list.forEach(function (p) { byId[p.id] = p; });
      sm.album = { id: base.id, sample: true, template: sm.template, type: base.type, title: base.title, date: list[list.length - 1].date, desc: base.desc.replace(/사진 \d+장/, '사진 ' + sm.n + '장'), birth: base.birth || '', photoIds: list.map(function (p) { return p.id; }), cover: list[Math.min(2, list.length - 1)].id };
      sm.byId = byId;
      return sm;
    });
  }
  function current() {
    if (S.sample && S.sample.album) return { a: S.sample.album, byId: S.sample.byId, sample: true };
    var a = S.albums.filter(function (x) { return x.id === S.album; })[0];
    return a ? { a: a, byId: S.byId, sample: false } : null;
  }

  function pageHtml(pg, a, n, byId) {
    var t = typeOf(a.type), tn = a.typeName || t.name, tp = 'tpl-' + tplOf(a.template).id + ' tone-' + t.tone;
    var fig = function (p, k) {
      var age = a.type === 'growth' ? ageLabel(a.birth, p.date) : '';
      return '<figure class="f' + k + (isWide(p) ? ' wide' : '') + '"><div class="ph"><img src="' + fullUrl(p) + '" alt="' + esc(p.memo || '') + '" style="object-position:center ' + (p.h > p.w ? '30%' : '50%') + '"></div><figcaption>' + (p.memo ? '<b>' + esc(p.memo) + '</b>' : '') + '<span>' + esc((p.date || '').replace(/-/g, '.')) + (age ? ' · ' + esc(age) : '') + '</span></figcaption></figure>';
    };
    var foot = n ? '<span class="al-folio">' + n + '</span>' : '';
    if (pg.kind === 'cover') {
      var mosaic = a.template === 'grid' && pg.mosaic && pg.mosaic.length >= 4 ? '<div class="cv-mosaic">' + pg.mosaic.slice(0, pg.mosaic.length >= 9 ? 9 : 4).map(function (p) { return '<img src="' + fullUrl(p) + '" alt="">'; }).join('') + '</div>' : '';
      return '<div class="al-page cover ' + tp + '">' + (mosaic || (pg.photo ? '<div class="cv-ph"><img src="' + fullUrl(pg.photo) + '" alt=""></div>' : '<div class="cv-ph empty"></div>')) + '<div class="cv-tx"><span class="chip-s ' + t.tone + '">' + esc(tn) + '</span><h2>' + esc(a.title) + '</h2><p>' + esc((a.date || '').replace(/-/g, '. ')) + '</p></div></div>';
    }
    if (pg.kind === 'intro') {
      var ph = (a.photoIds || []).map(function (id) { return byId[id]; }).filter(Boolean);
      return '<div class="al-page intro ' + tp + '"><div class="in-tx"><span class="chip-s ' + t.tone + '">' + esc(tn) + '</span><h3>' + esc(a.title) + '</h3><p class="in-meta">' + esc(dateRange(ph) || (a.date || '').replace(/-/g, '.')) + ' · 사진 ' + ph.length + '장' + (a.type === 'growth' && a.birth ? ' · 기준일 ' + esc(a.birth.replace(/-/g, '.')) : '') + '</p><div class="in-body">' + (a.desc ? esc(a.desc).replace(/\n/g, '<br>') : '<span class="muted">(머리말이 비어 있어요)</span>') + '</div></div>' + foot + '</div>';
    }
    if (pg.kind === 'end') return '<div class="al-page end ' + tp + '"><div class="en-tx"><p class="en-mark">끝</p><p>' + esc(a.title) + '</p><p class="note-s">사진 ' + pg.count + '장 · 온-이음 가족 앨범북</p></div>' + foot + '</div>';
    var ch = '';
    if (pg.chapter) {
      var mm = pg.chapter.split('-'), age1 = a.type === 'growth' ? ageLabel(a.birth, pg.photos[0].date) : '';
      ch = '<div class="tl-ch"><b>' + esc(mm[0] + '년 ' + (+mm[1]) + '월') + '</b>' + (age1 ? '<span>' + esc(age1) + '</span>' : '') + '</div>';
    }
    return '<div class="al-page photos ' + tp + ' lay-' + pg.layout + (ch ? ' has-ch' : '') + '">' + ch + '<div class="pp">' + pg.photos.map(fig).join('') + '</div>' + foot + '</div>';
  }
  function narrow() { return window.matchMedia('(max-width: 900px)').matches; }
  function spreadsOf(pages) {
    if (narrow()) return pages.map(function (p, i) { return [i]; });
    var s = [[0]]; for (var i = 1; i < pages.length; i += 2) s.push(i + 1 < pages.length ? [i, i + 1] : [i]);
    return s;
  }
  function tplChips(curId, rec, attr) {
    return '<div class="al-tpls">' + TEMPLATES.map(function (x) {
      return '<button type="button" class="al-tpl' + (x.id === curId ? ' on' : '') + '" ' + attr + '="' + x.id + '"><i class="ico ico-' + x.id + '" aria-hidden="true"></i><b>' + esc(x.name) + (x.id === rec ? ' <em>추천</em>' : '') + '</b><small>' + esc(x.best) + '</small></button>';
    }).join('') + '</div>';
  }
  function renderBook() {
    var cur0 = current();
    if (!cur0) {
      stage.innerHTML = '<div class="card-s al-empty"><h3>' + (S.albums.length ? '왼쪽에서 앨범을 골라 주세요' : '아직 만든 앨범이 없어요') + '</h3><p class="muted">사진 DB에서 사진을 고르고 ② 앨범 만들기에서 종류·제목·날짜·내용을 적으면 앨범북이 생겨요. 어떤 모양이 될지 궁금하면 <b>디자인 샘플</b>을 먼저 넘겨 보세요.</p><div class="tabs" style="justify-content:center"><button class="btn-s pri" id="goDb">① 사진 DB로</button><button class="btn-s" id="goSample">디자인 샘플 보기</button></div></div>';
      $('#goDb').addEventListener('click', function () { tab('db'); });
      $('#goSample').addEventListener('click', function () { showSample(SAMPLES[0].id); });
      $('#sideTitle').textContent = '앨범북'; side.innerHTML = privacyNote(); return;
    }
    var a = cur0.a, byId = cur0.byId;
    var pages = bookPages(a, byId), spreads = spreadsOf(pages);
    if (S.spread >= spreads.length) S.spread = spreads.length - 1;
    var cur = spreads[S.spread];
    stage.innerHTML = (cur0.sample ? '<div class="al-sample-bar"><b>디자인 샘플</b> · 그림으로 만든 예시 사진 ' + a.photoIds.length + '장 · ' + esc(tplOf(a.template).name) + '</div>' : '') +
      '<div class="al-book-wrap"><div class="al-book' + (cur.length === 1 ? ' single' : '') + '" id="book">' + cur.map(function (i) { return pageHtml(pages[i], a, i > 0 && pages[i].kind !== 'cover' ? i : 0, byId); }).join('') + '</div>' +
      '<div class="al-nav"><button class="btn-s" id="prev"' + (S.spread ? '' : ' disabled') + ' aria-label="앞 쪽">‹ 앞</button><span class="note-s">' + (S.spread + 1) + ' / ' + spreads.length + '</span><button class="btn-s" id="next"' + (S.spread < spreads.length - 1 ? '' : ' disabled') + ' aria-label="다음 쪽">뒤 ›</button></div></div>';
    $('#prev').addEventListener('click', function () { flip(-1); });
    $('#next').addEventListener('click', function () { flip(1); });
    var book = $('#book'), x0 = null;
    book.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    book.addEventListener('touchend', function (e) { if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) flip(dx < 0 ? 1 : -1); x0 = null; });

    var t = typeOf(a.type), tp = tplOf(a.template), rec = recommendTemplate(a.photoIds.length, a.type);
    var mini = '<ol class="al-mini">' + pages.map(function (p, i) { var si = spreads.findIndex(function (s) { return s.indexOf(i) >= 0; }); return '<li><button data-go="' + si + '" class="' + (si === S.spread ? 'on' : '') + '">' + (p.kind === 'cover' ? '표지' : p.kind === 'intro' ? '머리말' : p.kind === 'end' ? '끝' : i + '쪽 · ' + p.photos.length + '장') + '</button></li>'; }).join('') + '</ol>';
    $('#sideTitle').textContent = cur0.sample ? '디자인 샘플' : '앨범 정보';
    side.innerHTML = '<div class="card-s"><span class="chip-s ' + t.tone + '">' + esc(a.typeName || t.name) + '</span><h3 style="margin-top:6px">' + esc(a.title) + '</h3><p class="note-s">' + esc((a.date || '').replace(/-/g, '.')) + ' · 사진 ' + (a.photoIds || []).length + '장 · ' + pages.length + '쪽</p></div>' +
      '<div class="field"><span>디자인 ' + (cur0.sample ? '(눌러서 같은 사진으로 비교)' : '(누르면 바로 바뀌어요)') + '</span>' + tplChips(tp.id, rec, 'data-tpl') + '<p class="note-s" style="margin:6px 0 0">' + esc(tp.desc) + '</p></div>' +
      (cur0.sample ? '<div class="field"><span>사진 장수</span><div class="tabs">' + SAMPLE_COUNTS.map(function (k) { return '<button class="btn-s' + (k === S.sample.n ? ' on' : '') + '" data-cnt="' + k + '">' + k + '장</button>'; }).join('') + '</div></div>' +
        '<div class="tabs al-acts"><button class="btn-s pri" id="useTpl">이 디자인으로 내 앨범 만들기</button><button class="btn-s" id="bPrint">샘플 PDF 보기</button></div>'
      : '<div class="tabs al-acts"><button class="btn-s pri" id="bPrint">인쇄 · PDF 저장</button><button class="btn-s" id="bEdit">앨범 고치기</button><button class="btn-s" id="bDel">앨범 지우기</button></div>' +
        '<p class="note-s">인쇄 창에서 \'대상\'을 <b>PDF로 저장</b>으로 고르면 앨범북 PDF가 돼요. 정사각형 21cm 쪽으로 나와요.</p>') +
      mini + (cur0.sample ? '<div class="al-note"><b>샘플 사진은 그림이에요</b><p>공개 사이트라서 실제 가족 사진 대신 그림으로 그린 예시 사진을 써요. 내 사진으로 만들면 이 자리에 내 사진이 들어가요.</p></div>' : privacyNote());
    $$('[data-go]', side).forEach(function (b) { b.addEventListener('click', function () { S.spread = +b.dataset.go; renderBook(); }); });
    $$('[data-tpl]', side).forEach(function (b) {
      b.addEventListener('click', function () {
        a.template = b.dataset.tpl; S.spread = 0;
        if (cur0.sample) { S.sample.template = a.template; renderBook(); }
        else put('albums', a).then(function () { renderBook(); toast(tplOf(a.template).name + ' 디자인으로 바꿨어요'); });
      });
    });
    $('#bPrint').addEventListener('click', function () { printBook(a, pages, byId); });
    if (cur0.sample) {
      $$('[data-cnt]', side).forEach(function (b) { b.addEventListener('click', function () { showSample(S.sample.id, +b.dataset.cnt, S.sample.template); }); });
      $('#useTpl').addEventListener('click', function () { S.wantTpl = a.template; S.sample = null; toast(tplOf(S.wantTpl).name + ' 디자인으로 만들게요. 사진을 골라 주세요'); tab(S.sel.length ? 'make' : 'db'); });
      return;
    }
    $('#bEdit').addEventListener('click', function () { S.editing = a.id; S.sel = (a.photoIds || []).slice(); S.draft = { type: a.type, typeName: a.typeName || '', title: a.title, date: a.date, desc: a.desc || '', birth: a.birth || '', cover: a.cover, template: a.template || 'classic' }; tab('make'); });
    var bd = $('#bDel');
    bd.addEventListener('click', function () {
      if (!bd.dataset.sure) { bd.dataset.sure = 1; bd.textContent = '정말 지울까요? (사진은 DB에 남아요)'; bd.classList.add('pri'); return; }
      del('albums', a.id).then(function () { S.albums = S.albums.filter(function (x) { return x.id !== a.id; }); S.album = S.albums[0] ? S.albums[0].id : null; tab('book'); toast('앨범을 지웠어요'); });
    });
  }
  function flip(dir) {
    var c = current(); if (!c) return;
    var n = spreadsOf(bookPages(c.a, c.byId)).length, to = S.spread + dir;
    if (to < 0 || to >= n) return;
    var book = $('#book'); book.classList.add(dir > 0 ? 'flip-next' : 'flip-prev');
    setTimeout(function () { S.spread = to; renderBook(); var b = $('#book'); b.classList.add(dir > 0 ? 'in-next' : 'in-prev'); }, 180);
  }
  document.addEventListener('keydown', function (e) { if (S.tab !== 'book' || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName)) return; if (e.key === 'ArrowRight') flip(1); if (e.key === 'ArrowLeft') flip(-1); });
  var lastNarrow = null;
  window.addEventListener('resize', function () { var n = narrow(); if (n !== lastNarrow && S.tab === 'book') { lastNarrow = n; S.spread = 0; renderBook(); } lastNarrow = n; });

  function printBook(a, pages, byId) {
    var pb = $('#printBook');
    pb.innerHTML = pages.map(function (p, i) { return pageHtml(p, a, i > 0 && p.kind !== 'cover' ? i : 0, byId); }).join('');
    var imgs = $$('img', pb), left = imgs.length;
    var go = function () { document.title = a.title + ' · 앨범북'; window.print(); setTimeout(function () { document.title = '가족 앨범북 · 온-이음'; }, 500); };
    if (!left) return go();
    imgs.forEach(function (im) { if (im.complete) { if (!--left) go(); } else im.onload = im.onerror = function () { if (!--left) go(); }; });
  }

  // ---------- 백업 · 불러오기 · 비밀번호 바꾸기 ----------
  function blobToData(b) { return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.readAsDataURL(b); }); }
  function dataToBlob(u) { var p = u.split(','), bin = atob(p[1]), arr = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); return new Blob([arr], { type: (/data:([^;]+)/.exec(p[0]) || [])[1] || 'image/jpeg' }); }
  $('#backupBtn').addEventListener('click', function () {
    if (!S.photos.length && !S.albums.length) return toast('백업할 사진이 없어요');
    toast('백업 파일을 만드는 중…');
    Promise.all(S.photos.map(function (p) { return Promise.all([blobToData(p.blob), p.thumb && p.thumb !== p.blob ? blobToData(p.thumb) : null]).then(function (r) { var o = Object.assign({}, p); o.blob = r[0]; o.thumb = r[1]; return o; }); })).then(function (ps) {
      var file = new Blob([JSON.stringify({ app: 'onieum-album', v: 1, at: new Date().toISOString(), photos: ps, albums: S.albums })], { type: 'application/json' });
      var u = URL.createObjectURL(file), l = document.createElement('a'); l.href = u; l.download = '온이음_가족앨범_백업_' + ymd(new Date()) + '.json'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 2000);
      toast('백업 파일을 저장했어요. 이 파일에는 사진이 들어 있으니 잘 보관해 주세요.');
    });
  });
  $('#restoreFile').addEventListener('change', function (e) {
    var f = e.target.files[0]; e.target.value = ''; if (!f) return;
    f.text().then(function (txt) {
      var d = JSON.parse(txt); if (d.app !== 'onieum-album') throw new Error('온-이음 앨범 백업 파일이 아니에요');
      var have = {}; S.photos.forEach(function (p) { have[p.id] = 1; });
      var ps = (d.photos || []).filter(function (p) { return !have[p.id]; }).map(function (p) { p.blob = dataToBlob(p.blob); p.thumb = p.thumb ? dataToBlob(p.thumb) : p.blob; return p; });
      var ah = {}; S.albums.forEach(function (a) { ah[a.id] = 1; });
      var as = (d.albums || []).filter(function (a) { return !ah[a.id]; });
      return Promise.all(ps.map(function (p) { return put('photos', p); }).concat(as.map(function (a) { return put('albums', a); }))).then(function () {
        S.photos = S.photos.concat(ps); S.albums = S.albums.concat(as); reindex(); tab(S.tab); toast('사진 ' + ps.length + '장, 앨범 ' + as.length + '권을 불러왔어요');
      });
    }).catch(function (er) { toast('불러오지 못했어요: ' + (er.message || er)); });
  });

  gate();
})(typeof window !== 'undefined' ? window : this);
