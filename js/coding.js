// 온-이음 · 작업실 코딩방 — 텍스트를 KDI 게시물 HTML로 변환
// 렌더러는 브라우저와 node(테스트) 양쪽에서 쓰도록 순수 함수로 둔다.
(function (root) {
  'use strict';

  // ---------- 공통 도구 ----------
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  // 인라인 표기: **굵게**, __밑줄__, [[주황:글]], [[파랑:글]], [글](주소)
  function inline(s) {
    var t = esc(s);
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, '<a href="$2">$1</a>');
    t = t.replace(/\[\[주황:([^\]]+)\]\]/g, '<span style="color:#e67e22;">$1</span>');
    t = t.replace(/\[\[파랑:([^\]]+)\]\]/g, '<span style="color:#2980b9;">$1</span>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    t = t.replace(/__([^_]+)__/g, '<u>$1</u>');
    return t;
  }
  function lines(text) { return String(text || '').replace(/\r\n?/g, '\n').split('\n'); }
  // @키: 값 메타 줄을 뽑아 내고 나머지 줄을 돌려준다
  function splitMeta(text) {
    var meta = {}, body = [];
    lines(text).forEach(function (l) {
      var m = /^@([^:：]+)[:：]\s*(.*)$/.exec(l.trim());
      if (m) meta[m[1].trim()] = m[2].trim(); else body.push(l);
    });
    return { meta: meta, body: body };
  }
  function paragraphs(arr) {
    var out = [], cur = [];
    arr.forEach(function (l) {
      if (l.trim() === '') { if (cur.length) { out.push(cur); cur = []; } }
      else cur.push(l.trim());
    });
    if (cur.length) out.push(cur);
    return out;
  }
  var ROMAN = /^([ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+)\.\s*(.+)$/;
  var HANGUL_ITEM = /^([가-하])\.\s*(.*)$/;
  function imgs(line) {
    var m = /^!(?:이미지|img)\s+(.+)$/.exec(line.trim());
    if (!m) return null;
    return m[1].split('|').map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function todayKo(d) {
    d = d || new Date();
    return d.getFullYear() + '년&nbsp; &nbsp;' + (d.getMonth() + 1) + '월&nbsp; &nbsp;' + d.getDate() + '일';
  }

  // ---------- 유형별 렌더러 ----------
  var R = {};

  // 입찰공고
  R.bid = function (text) {
    var p = splitMeta(text), m = p.meta, out = [];
    var warn = m['경고'] || '고의로 무효의 입찰을 하거나, 규격 착오 또는 규정의 미숙지 등으로 입찰자가 계약을 체결하지 않거나, 계약을 체결하고 불이행하는 경우 등의 경우 관계법령에 따라 부정당업자로 제재되어 일정기간 입찰참여가 제한되는 등 불이익을 받을 수 있습니다.';
    out.push('<div class="hwp_editor_board_content" style="text-align: center; width: 95%;">' + inline(warn) + '</div>');
    out.push('<br />');
    p.body.forEach(function (raw) {
      var l = raw.trim(), mm;
      if (!l) { out.push('<br />'); return; }
      if ((mm = /^(\d+)\.\s*(.+)$/.exec(l))) { out.push('<b>' + mm[1] + '. ' + inline(mm[2]) + '</b><br />'); return; }
      if ((mm = HANGUL_ITEM.exec(l))) {
        var rest = mm[2], k = /^(건\s*명)\s*[:：]\s*(.+)$/.exec(rest);
        if (k) rest = '건&nbsp; &nbsp; 명: <span style="color:#2980b9;"><b>' + inline(k[2]) + '</b></span>';
        else rest = inline(rest);
        out.push('&nbsp; ' + mm[1] + '. ' + rest + '<br />');
        return;
      }
      if (/^-\s*/.test(l)) { out.push('&nbsp; &nbsp; &nbsp; - ' + inline(l.replace(/^-\s*/, '')) + '<br />'); return; }
      if (/^※/.test(l)) { out.push('&nbsp; &nbsp; &nbsp;' + inline(l) + '<br />'); return; }
      out.push('&nbsp; ' + inline(l) + '<br />');
    });
    out.push('&nbsp;');
    out.push('<div style="text-align: center;"><br />');
    out.push((m['날짜'] ? esc(m['날짜']) : todayKo()) + '<br />');
    out.push('<br />');
    out.push('<b>' + esc(m['기관'] || '한 국 개 발 연 구 원 장') + '</b></div>');
    return out.join('\n');
  };

  // 연구원동정
  R.news = function (text) {
    var p = splitMeta(text), out = [], body = p.body.slice(), title = null, sub = null;
    // 첫 # 제목, 바로 다음 ## 부제
    for (var i = 0; i < body.length; i++) {
      var l = body[i].trim();
      if (!l) continue;
      if (/^#\s+/.test(l) && title === null) { title = l.replace(/^#\s+/, ''); body[i] = ''; continue; }
      if (/^##\s+/.test(l) && title !== null && sub === null && !/^##\s*\[/.test(l)) { sub = l.replace(/^##\s+/, ''); body[i] = ''; }
      break;
    }
    if (title !== null) {
      out.push('<h4 class="strong_type04"><span style="font-size:36px;"><span style="color:#e67e22;">' + inline(title) + '</span> </span>' + (sub ? '<br />\n' + inline(sub) : '') + '</h4>');
    }
    paragraphs(body).forEach(function (para) {
      var first = para[0], im = imgs(first), mm;
      if (im) {
        if (im.length === 1) out.push('<div class="img_type01" style="height:400px; overflow:hidden;"><img src="' + esc(im[0]) + '" style="width: 600px; height: 400px;" /></div>');
        else out.push('<div style="width:100%; max-width:810px; margin:30px auto; display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); column-gap:10px; row-gap:10px;">' +
          im.map(function (s) { return '<img alt="" src="' + esc(s) + '" style="display:block; width:100%; height:auto;" />'; }).join(' ') + '</div>');
        return;
      }
      if ((mm = /^(?:##\s*)?(\[.+\])$/.exec(first)) && para.length === 1) {
        out.push('<p class="p_type02" style="text-align: justify;"><span style="font-size:22px;"><span style="color:#3498db;"><b style="font-weight:bold;">' + inline(mm[1]) + '</b> </span> </span></p>');
        return;
      }
      if (/^글\s*[:：]/.test(first)) {
        out.push('<p class="p_type02"><span style="font-size:16px;">' + inline(para.join(' ')) + '</span></p>');
        return;
      }
      out.push('<p class="p_type02" style="text-align: justify;">' + inline(para.join(' ')) + '</p>');
    });
    return out.join('\n\n');
  };

  // 보도자료
  R.press = function (text) {
    var p = splitMeta(text), out = [], inTable = false;
    function openTable(title) {
      out.push('<br />\n<b>* 붙임. ' + inline(title || '연구보고서 요약문') + '</b>');
      out.push('<table border="0" cellpadding="0" cellspacing="0" style="width: 95%; background-color: #f9f9f9; border: 1px solid #777777;">\n\t<tbody>');
      inTable = true;
    }
    function closeTable() { if (inTable) { out.push('\t</tbody>\n</table>'); inTable = false; } }
    var rowsSinceHead = 0;
    p.body.forEach(function (raw) {
      var l = raw.trim(), mm;
      if (!l) return;
      if ((mm = /^\*?\s*붙임\.?\s*(.*)$/.exec(l))) { closeTable(); openTable(mm[1]); rowsSinceHead = 0; return; }
      if (inTable) {
        if ((mm = /^#\s+(.+)$/.exec(l))) {
          if (rowsSinceHead) out.push('\t\t<tr>\n\t\t\t<td colspan="2" style="padding: 0px; font-weight: bold;">&nbsp;</td>\n\t\t</tr>');
          out.push('\t\t<tr>\n\t\t\t<td colspan="2" style="padding: 30px 30px 15px 30px; font-weight: bold;">' + inline(mm[1]) + '</td>\n\t\t</tr>');
          rowsSinceHead = 0; return;
        }
        if ((mm = /^>\s*(.+)$/.exec(l))) {
          if (rowsSinceHead) out.push('\t\t<tr>\n\t\t\t<td colspan="2" style="padding: 0px; font-weight: bold;">&nbsp;</td>\n\t\t</tr>');
          out.push('\t\t<tr>\n\t\t\t<td style="width: 25px; padding-left: 30px; vertical-align: top;">\n\t\t\t<div style="width: 4px; height: 20px; background-color: #e67e22;">&nbsp;</div>\n\t\t\t</td>\n\t\t\t<td style="padding-right: 30px; padding-bottom: 20px; font-size: 16px; font-weight: bold; line-height: 1.5;">' + inline(mm[1]) + '</td>\n\t\t</tr>');
          rowsSinceHead++; return;
        }
        if (/^담당자/.test(l)) { closeTable(); }
        else {
          var t = l.replace(/^[•·\-]\s*/, '');
          out.push('\t\t<tr>\n\t\t\t<td colspan="2" style="padding: 5px 30px 5px 30px; font-size: 15px; line-height: 1.6;"><span style="filter: blur(0.6px); margin-right: 6px;">&nbsp;&bull;</span> ' + inline(t) + '</td>\n\t\t</tr>');
          rowsSinceHead++; return;
        }
      }
      if (/^□/.test(l)) { out.push('□ <b>' + inline(l.replace(/^□\s*/, '')) + '</b><br />\n<br />'); return; }
      if (/^○/.test(l)) { out.push('&nbsp; ○ ' + inline(l.replace(/^○\s*/, '')) + '<br />\n<br />'); return; }
      if ((mm = /^담당자\s*[:：]\s*(.+)$/.exec(l))) { out.push('<br />\n담당자:&nbsp;&nbsp;' + inline(mm[1])); return; }
      out.push(inline(l) + '<br />');
    });
    closeTable();
    return out.join('\n');
  };

  // KDI FOCUS
  R.focus = function (text) {
    var p = splitMeta(text), m = p.meta, out = [], toc = [];
    var paras = paragraphs(p.body);
    paras.forEach(function (para, idx) {
      var first = para[0], im = imgs(first), mm;
      if (idx === 0 && !ROMAN.test(first) && !im && !/^>/.test(first)) {
        out.push('<p class="p_type03" style="text-align: justify;">' + (m['아이콘'] ? '<img alt="" src="' + esc(m['아이콘']) + '" style="width: 70px; height: 70px;" /><br />\n' : '') + inline(para.join(' ')) + '</p>');
        return;
      }
      if ((mm = ROMAN.exec(first)) && para.length === 1) {
        toc.push(mm[1] + '.&nbsp; ' + inline(mm[2]));
        out.push('<p class="p_type03" style="text-align: justify;"><b><span style="color:#e67e22;"><span style="font-size:22px;">' + mm[1] + '.&nbsp; ' + inline(mm[2]) + '</span></span></b></p>');
        return;
      }
      if (/^>/.test(first)) {
        out.push('<div class="bg_type02">\n<p>' + para.map(function (l) { return inline(l.replace(/^>\s*/, '')); }).join('<br />\n') + '</p>\n</div>');
        return;
      }
      if (im) { im.forEach(function (s) { out.push('<div class="img_type04"><img src="' + esc(s) + '" /></div>'); }); return; }
      out.push('<p class="p_type02" style="text-align: justify;">' + inline(para.join(' ')) + '</p>');
    });
    if (toc.length && m['목차'] !== '없음') {
      out.push('<div class="desc sumy03">\n<dl>\n\t<dt style="text-align: center;">KDI FOCUS 목차</dt>\n\t<dd>\n\t<ul>\n' +
        toc.map(function (t, i) { return (i ? '\t\t<li>&nbsp;</li>\n' : '') + '\t\t<li>' + t + '</li>'; }).join('\n') +
        '\n\t</ul>\n\t</dd>\n</dl>\n</div>');
    }
    return out.join('\n\n');
  };

  // KDI 경제전망
  R.outlook = function (text) {
    var p = splitMeta(text), m = p.meta, out = [], list = null, ul = null;
    function flushUl() { if (ul) { out.push('<ul class="p_type02">\n' + ul.join('\n') + '\n</ul>'); ul = null; } }
    function flushList() { if (list) { out.push('<div class="economy_list-comm">\n<ul>\n' + list.map(function (x) { return '\t<li>' + x + '</li>'; }).join('\n') + '\n</ul>\n</div>'); list = null; } }
    var headline = m['헤드라인'];
    p.body.forEach(function (raw) {
      var l = raw.trim(), mm, im;
      if (!l) { flushUl(); return; }
      if (!headline && /^#\s+/.test(l)) { headline = l.replace(/^#\s+/, ''); return; }
      if (/^\*\s+/.test(l)) { list = list || []; list.push(inline(l.replace(/^\*\s+/, ''))); return; }
      flushList();
      if ((mm = ROMAN.exec(l))) { flushUl(); out.push('<p class="p_type03"><br />\n<span style="color:#e67e22;"><span style="font-size:22px;"><strong>' + mm[1] + '. ' + inline(mm[2]) + '</strong></span></span></p>'); return; }
      if ((mm = /^(\d+)\.\s+(.+)$/.exec(l))) { flushUl(); out.push('<p class="p_type03"><span style="color:#2980b9;"><span style="font-size:22px;"><strong>' + mm[1] + '. ' + inline(mm[2]) + '</strong></span></span></p>'); return; }
      if (/^□/.test(l)) { flushUl(); out.push('<ul class="p_type03">\n\t<li><span style="font-size:18px;"><b>□ ' + inline(l.replace(/^□\s*/, '')) + '</b></span></li>\n</ul>'); return; }
      if (/^[·•]/.test(l)) { ul = ul || []; ul.push('\t<li>&nbsp; &middot; ' + inline(l.replace(/^[·•]\s*/, '')) + '</li>'); return; }
      if (/^-\s+/.test(l)) { ul = ul || []; ul.push('\t<li style="padding-left:40px;">&nbsp; - ' + inline(l.replace(/^-\s+/, '')) + '</li>'); return; }
      if ((im = imgs(l))) { flushUl(); im.forEach(function (s) { out.push('<div style="text-align: center;"><img src="' + esc(s) + '" /></div>'); }); return; }
      flushUl(); out.push('<p class="p_type02">' + inline(l) + '</p>');
    });
    flushUl(); flushList();
    var head = headline ? '<p class="p_type03" style="text-align: center;"><br />\n<span style="font-size:32px;">' + inline(headline) + '<br />\n&nbsp;</span></p>\n\n' : '';
    var style = '<style type="text/css">.p_type02 li { text-indent: -20px; padding-left: 20px; list-style: none; }\n</style>\n';
    return head + style + '<div>\n' + out.join('\n\n') + '\n</div>';
  };

  // KDI 현안분석
  R.issue = function (text) {
    var p = splitMeta(text), out = [], dd = null, li = null;
    function flushLi() { if (li !== null) { dd.push('\t\t<li>' + li + '</li>'); li = null; } }
    function flushDd() { flushLi(); if (dd && dd.length) out.push('\t<dd>\n\t<ul>\n' + dd.filter(function (x) { return x.indexOf('<div') !== 0; }).join('\n') + '\n\t</ul>\n' + dd.filter(function (x) { return x.indexOf('<div') === 0; }).map(function (x) { return '\n\t' + x; }).join('') + '\n\t</dd>'); dd = null; }
    var pendingHead = null;
    p.body.forEach(function (raw) {
      var l = raw.trim(), mm, im;
      if (!l) return;
      if ((mm = /^#\s+(.+)$/.exec(l))) { flushDd(); pendingHead = mm[1]; return; }
      if ((mm = /^##\s+(.+)$/.exec(l))) {
        flushDd();
        var h = pendingHead ? '<span style="color:#3b6ea8;"><b>' + inline(pendingHead) + '</b></span><br />\n\t<br />\n\t' : '<br />\n\t';
        out.push('\t<dt>' + h + '<span style="font-size:22px;">' + inline(mm[1]) + '</span></dt>');
        pendingHead = null; dd = []; return;
      }
      if (pendingHead) { flushDd(); out.push('\t<dt><span style="color:#3b6ea8;"><b>' + inline(pendingHead) + '</b></span></dt>'); pendingHead = null; dd = []; }
      dd = dd || [];
      if ((im = imgs(l))) { flushLi(); im.forEach(function (s) { dd.push('<div class="img_type04"><img src="' + esc(s) + '" /></div>'); }); return; }
      if (/^-\s+/.test(l) && li !== null) { li += '<br />\n\t\t<br />\n\t\t- ' + inline(l.replace(/^-\s+/, '')); return; }
      flushLi(); li = inline(l.replace(/^[·•]\s*/, ''));
    });
    if (pendingHead) out.push('\t<dt><span style="color:#3b6ea8;"><b>' + inline(pendingHead) + '</b></span></dt>');
    flushDd();
    return '<dl class="dl_type01 frum_dl type2">\n' + out.join('\n') + '\n</dl>';
  };

  // 세미나 프로그램 (day_box)
  R.seminar = function (text) {
    var p = splitMeta(text), out = [], dl = false, sess = null, notes = [];
    function flushSess() {
      if (!sess) return;
      var inner = sess.items.length
        ? '<strong class="t">' + inline(sess.title) + '</strong>\n\t<ul>\n' + sess.items.join('\n') + '\n\t</ul>\n\t'
        : inline(sess.title);
      out.push('\t<dd><span class="time">' + esc(sess.time) + '</span>\n\t<div class="session">' + inner + '</div>\n\t</dd>');
      sess = null;
    }
    function person(s) {
      var parts = s.split('|').map(function (x) { return x.trim(); });
      return '<span><b>' + inline(parts[0]) + '</b>' + (parts[1] ? 'ㅣ' + inline(parts.slice(1).join(' | ')) : '') + '</span>';
    }
    p.body.forEach(function (raw) {
      var l = raw.trim(), mm;
      if (!l) return;
      if ((mm = /^#\s+(.+)$/.exec(l))) { flushSess(); if (dl) out.push('</dl>'); out.push('<dl>\n\t<dt>' + inline(mm[1]) + '</dt>'); dl = true; return; }
      if ((mm = /^(\d{1,2}:\d{2}\s*[~\-–]\s*\d{1,2}:\d{2})\s*\|?\s*(.*)$/.exec(l))) { flushSess(); if (!dl) { out.push('<dl>'); dl = true; } sess = { time: mm[1].replace(/\s+/g, '').replace(/[–\-]/, '~'), title: mm[2], items: [] }; return; }
      if ((mm = /^-\s*([^:：]*)[:：]\s*(.*)$/.exec(l)) && sess) {
        var role = mm[1].trim(), val = mm[2].trim();
        var em = '<em>' + (role ? esc(role) : '&nbsp;') + '</em>';
        if (/^".*"$|^“.*”$/.test(val)) sess.items.push('\t\t<li>' + em + '<strong>' + inline(val.slice(1, -1)) + '</strong></li>');
        else sess.items.push('\t\t<li>' + em + ' ' + val.split(';').map(function (x) { return person(x.trim()); }).join(' ') + '</li>');
        return;
      }
      if (/^\*/.test(l)) { notes.push(inline(l)); return; }
      if (sess) sess.title += ' ' + l;
    });
    flushSess(); if (dl) out.push('</dl>');
    return '<div class="day_box">\n' + out.join('\n') + '\n</div>' + (notes.length ? '\n' + notes.join('<br />\n') : '');
  };

  // 메인비주얼 (PC + 모바일)
  R.mainvisual = function (text) {
    var m = splitMeta(text).meta, subs = [];
    for (var i = 1; i <= 4; i++) if (m['서브' + i + '제목']) subs.push({ em: m['서브' + i + '분류'] || '', title: m['서브' + i + '제목'], link: m['서브' + i + '링크'] || '#', img: m['서브' + i + '이미지'] || '' });
    var title = inline(m['제목'] || '제목').replace(/\s*\/\s*/g, '<br>');
    var pc = '<div class="inner-wrap slide_pc">\n\t<div class="main-box">\n\t\t<em>' + esc(m['분류'] || '') + '</em>\n' +
      '\t\t<strong style="width:700px; color:#000;">' + title + '</strong>\n' +
      '\t\t<p style="width:500px; color:#000;">' + inline(m['설명'] || '') + '</p><br><br>\n' +
      '\t\t<a href="' + esc(m['링크'] || '#') + '" class="themore" style="color:#000; border-color:#000">자세히 보기</a>\n\t</div>\n' +
      (subs.length ? '\t<div class="sub-box_wrap">\n' + subs.map(function (s) {
        return '\t\t<div class="sub-box">\n\t\t\t<em>' + esc(s.em) + '</em>\n\t\t\t<strong style="color:#000; background:rgba(255,255,255,0.8); padding:2px 8px; font-size:24px; -webkit-box-decoration-break:clone; box-decoration-break:clone; line-height:1.2;">' + inline(s.title) + '</strong>\n\t\t\t<a href="' + esc(s.link) + '" class="themore" style="display:inline-block; width:auto; color:#000; border-color:#000; background:rgba(255,255,255,0.6); padding:2px 8px; line-height:1.2;">자세히 보기</a>\n\t\t</div>';
      }).join('\n') + '\n\t</div>\n' : '') + '</div>';
    var mo = '<div class="inner-wrap slide_mo">\n\t<div class="main-box">\n\t\t<div class="text-box">\n\t\t\t<em>' + esc(m['분류'] || '') + '</em>\n' +
      '\t\t\t<strong style="color:#000;">' + title + '</strong>\n' +
      '\t\t\t<p style="width:63%; color:#000;">' + inline(m['설명'] || '') + '<br><br></p>\n' +
      '\t\t\t<a href="' + esc(m['링크'] || '#') + '" class="themore" style="color:#000; border-color:#000">자세히 보기</a>\n\t\t</div>\n' +
      (m['모바일이미지'] ? '\t\t<img src="' + esc(m['모바일이미지']) + '" alt="' + esc((m['제목'] || '').replace(/\s*\/\s*/g, ' ')) + '" class="mo">\n' : '') + '\t</div>\n' +
      subs.filter(function (s) { return s.img; }).map(function (s) {
        return '\t<div class="sub-box">\n\t\t<a href="' + esc(s.link) + '"><img src="' + esc(s.img) + '" alt="' + esc(s.em || s.title) + '" class="mo"></a>\n\t</div>';
      }).join('\n') + '\n</div>';
    return pc + '\n' + mo;
  };

  // 언론기고 — 보내 주신 샘플(보도자료 형식)과 같은 구조
  R.column = R.press;

  // 사용자 유형: {{필드}} 템플릿 + {{본문}}
  function renderCustom(type, text) {
    var p = splitMeta(text), body = paragraphs(p.body).map(function (para) {
      var im = imgs(para[0]);
      return im ? im.map(function (s) { return '<div class="img_type04"><img src="' + esc(s) + '" /></div>'; }).join('\n')
        : '<p class="p_type02" style="text-align: justify;">' + inline(para.join(' ')) + '</p>';
    }).join('\n\n');
    return String(type.template || '{{본문}}').replace(/\{\{\s*([^}]+?)\s*\}\}/g, function (_, k) {
      if (k === '본문') return body;
      return p.meta[k] != null ? inline(p.meta[k]) : '';
    });
  }

  // ---------- 유형 목록 ----------
  var TYPES = [
    { id: 'bid', name: '입찰공고', group: '공지', sample: true,
      help: '숫자 제목 "1. ", 항목 "가. ", 세부 "- ", 참고 "※". @날짜 @기관 @경고 로 꼬리말과 안내문을 바꿀 수 있어요. "가. 건명: 값"은 파란 굵은 글씨가 돼요.',
      example: '@날짜: 2026년  11월  20일\n1. 견적 제출에 부치는 사항\n가. 건명: 2027년 온-이음 예시 용역\n나. 규격 및 수량: 1식\n다. 기초금액: **10,000,000원(부가세 포함)**\n라. 계약기간: 2027.1.1.~2027.12.31.\n\n2. 견적제출 참가자격\n가. __국가를 당사자로 하는 계약에 관한 법률__에 따른 자격을 갖춘 자\n※ 자격이 없는 업체가 참가하면 무효 처리됩니다.\n\n3. 문의사항\n- 계약 관련사항: 담당 부서(☎000-0000-0000)' },
    { id: 'news', name: '연구원동정', group: '소식', sample: true,
      help: '첫 줄 "# 제목", 다음 줄 "## 부제". 사진은 "!이미지 경로" (두 장은 "경로1 | 경로2"). 섹션 제목은 "[ ... ]" 한 줄. 끝에 "글: 부서 이름" 줄.',
      example: '# 「예시 행사」 개최\n## 함께 그리는 미래\n\n!이미지 /upload/notice/0000/editor/sample.jpg\n\n**예시 행사가 11월 20일 열렸다.** 행사 개요를 이 문단에 씁니다.\n\n[세션 1 | 주제 발표]\n\n!이미지 /upload/a.jpg | /upload/b.jpg\n\n세션 내용을 정리한 문단입니다.\n\n글: 예시 부서 예시 담당자' },
    { id: 'press', name: '보도자료', group: '소식', sample: true,
      help: '"□ " 핵심 문장(굵게), "○ " 보조 문장. "* 붙임. 제목" 줄부터 요약표: "# 1. 소제목", "> 주황 막대 문장", "• 항목". 마지막 "담당자: ..."',
      example: '□ 예시 분석 결과, **지역별 협력 구조가 서로 다름**\n○ 지역 특성에 맞는 보완이 필요한 상황\n□ 보고서는 KDI 홈페이지에서 확인 가능 [[주황:([보고서 링크](https://www.kdi.re.kr/))]]\n\n* 붙임. 연구보고서 요약문\n# 1. 첫 번째 요약\n> 핵심 결론 문장\n• 근거 1\n• 근거 2\n# 2. 두 번째 요약\n> 핵심 결론 문장\n• 근거 1\n담당자: 예시 연구위원 (000-000-0000)' },
    { id: 'focus', name: 'FOCUS', group: '연구', sample: true,
      help: '첫 문단은 요약(@아이콘 경로로 아이콘). 로마숫자 "Ⅰ. 제목"은 주황 소제목, "> " 문장은 강조 박스, "!이미지 경로"는 그림. 목차는 소제목으로 자동 생성(@목차: 없음 으로 끄기).',
      example: '요약 문단을 씁니다. 연구의 핵심 결론과 정책 제언을 2~3문장으로 정리합니다.\n\nⅠ. 들어가며\n\n본문 문단입니다.\n\n> 강조하고 싶은 핵심 문장\n\nⅡ. 분석 결과\n\n!이미지 /upload/publication/0000/editor/chart.png\n\n분석 결과를 설명합니다.\n\nⅢ. 결론 및 정책 대응\n\n> 첫째 제언\n> 둘째 제언' },
    { id: 'outlook', name: '전망', group: '연구', sample: true,
      help: '"# 헤드라인", "* " 요약 목록, "Ⅰ. " 큰 제목, "1. " 파란 제목, "□ " 굵은 문장, "· " 설명, "- " 하위 설명, "!이미지".',
      example: '# 우리 경제는 **2027년에 예시 성장률**을 기록할 전망\n* **수출**은 예시 증가율을 기록할 전망\n* **물가**는 예시 수준을 보일 전망\n\nⅠ. 현 경제상황에 대한 인식\n□ 최근 우리 경제는 예시 흐름을 이어감.\n· 세부 근거 1\n· 세부 근거 2\n- 하위 설명\n\nⅢ. 정책방향\n1. 재정정책\n□ 재정 운용 방향 문장\n· 세부 내용' },
    { id: 'issue', name: '현안', group: '연구', sample: true,
      help: '"# 1. 소제목" 다음 "## 리드 문장"이 한 묶음(dt). 이어지는 줄은 목록 항목, "- "는 앞 항목의 하위 설명, "!이미지".',
      example: '# 1. 문제제기\n## 최근 예시 지표가 반등하였으나 체감 개선은 미약한 모습\n· 예시 통계 설명 문장\n!이미지 /upload/article/0000/editor/fig1.png\n## 그 배경을 살펴볼 필요\n· 본고의 분석 목적\n\n# 2. 산업별 추이\n## 일부 산업이 상승을 주도\n· 산업별 설명\n- (가중평균) 보충 수치' },
    { id: 'seminar', name: '세미나 프로그램', group: '행사', sample: true,
      help: '"# 날짜", "09:30~09:50 | 세션명", 역할 줄 "- 역할: 이름 | 소속" (여러 명은 ";"), 발표 제목은 "- 발표 1: \\"제목\\"", 역할 없는 줄은 "- : 이름 | 소속". "*"로 시작하면 하단 안내.',
      example: '# 2026년 11월 20일 (금)\n09:30~09:50 | 개회식\n- 개회사: 예시 원장 | 한국개발연구원(KDI) ; 예시 차관 | 예시 부처\n10:00~10:20 | 커피 브레이크\n10:20~12:00 | [세션 1] 예시 주제\n- (좌 장): 예시 교수 | 예시 대학교\n- 발표 1: "예시 발표 제목"\n- : 예시 연구위원 | KDI\n- 토 론: 예시 교수 | 예시 대학교\n* 일정과 프로그램은 변경될 수 있습니다.' },
    { id: 'mainvisual', name: '메인비주얼', group: '홈페이지', sample: true,
      help: '@분류 @제목(줄바꿈은 " / ") @설명 @링크 @모바일이미지, 서브는 @서브1분류 @서브1제목 @서브1링크 @서브1이미지 (최대 4개). PC·모바일 코드가 함께 만들어져요.',
      example: '@분류: KDI 경제전망\n@제목: KDI 경제전망, / 2026 하반기\n@설명: 우리 경제는 예시 성장률을 기록할 전망\n@링크: https://www.kdi.re.kr/research/economy\n@모바일이미지: https://www.kdi.re.kr/kdidata/mainContent/visual/main_visual_mob-000.gif\n@서브1분류: 현안분석 1\n@서브1제목: 예시 현안분석 제목\n@서브1링크: /research/analysisView?art_no=0000\n@서브1이미지: https://www.kdi.re.kr/kdidata/mainContent/visual/main_visualsub_pc-000.jpg' },
    { id: 'column', name: '언론기고', group: '소식', sample: true,
      help: '샘플(보도자료 형식)과 같은 구조예요. "□ " 핵심 문장, "○ " 보조 문장, "* 붙임. 제목" 줄부터 요약표("# 소제목", "> 주황 막대", "• 항목"), 마지막 "담당자: ...".',
      example: '□ 예시 기고의 **핵심 주장 문장**\n○ 근거와 배경을 설명하는 문장\n□ 원문은 KDI 홈페이지에서 확인 가능 [[주황:([원문 링크](https://www.kdi.re.kr/))]]\n\n* 붙임. 기고 요약\n# 1. 주요 내용\n> 핵심 결론 문장\n• 근거 1\n• 근거 2\n담당자: 예시 연구위원 (000-000-0000)' }
  ];

  function render(typeOrId, text, customTypes) {
    var id = typeof typeOrId === 'string' ? typeOrId : typeOrId.id;
    if (R[id]) return R[id](text);
    var t = (customTypes || []).filter(function (x) { return x.id === id; })[0] || typeOrId;
    return renderCustom(t, text);
  }

  var API = { TYPES: TYPES, render: render, inline: inline, splitMeta: splitMeta, renderCustom: renderCustom };
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; return; }
  root.OnCoding = API;

  // ---------- 화면 ----------
  if (typeof document === 'undefined' || !document.getElementById('codingApp')) return;
  var KEY = 'onieum-coding';
  var state = load();
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  state.css = state.css || [];
  state.custom = state.custom || [];
  state.drafts = state.drafts || {};
  state.wrap = state.wrap == null ? '' : state.wrap;

  var $ = function (id) { return document.getElementById(id); };
  var cur = 'bid', width = 'pc';
  function allTypes() { return TYPES.concat(state.custom.map(function (c) { return Object.assign({ group: '내 유형', custom: true }, c); })); }
  function typeById(id) { return allTypes().filter(function (t) { return t.id === id; })[0]; }
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 1600); }

  function renderList(q) {
    q = (q || '').trim();
    var groups = {};
    allTypes().forEach(function (t) {
      if (q && t.name.indexOf(q) < 0) return;
      (groups[t.group] = groups[t.group] || []).push(t);
    });
    $('typeList').innerHTML = Object.keys(groups).map(function (g) {
      return '<li class="grp">' + esc(g) + '</li>' + groups[g].map(function (t) {
        return '<li><button data-id="' + esc(t.id) + '" class="' + (t.id === cur ? 'on' : '') + '">' + esc(t.name) +
          '<small>' + (t.custom ? '내가 만든 유형' : t.sample ? '샘플 구조 반영' : '기본 틀 · 샘플 대기') + '</small></button></li>';
      }).join('');
    }).join('');
  }
  function select(id) {
    cur = id; var t = typeById(id);
    $('typeName').textContent = t.name;
    $('typeHelp').textContent = t.help || '템플릿의 {{필드}} 자리에 "@필드: 값" 줄의 값이, {{본문}} 자리에 문단이 들어가요.';
    $('srcText').value = state.drafts[id] != null ? state.drafts[id] : (t.example || '');
    $('editType').hidden = !t.custom; $('delType').hidden = !t.custom;
    renderList($('typeSearch').value); build();
  }
  function build() {
    var t = typeById(cur), html;
    try { html = render(t, $('srcText').value, state.custom); } catch (e) { html = '<!-- 변환 오류: ' + esc(e.message) + ' -->'; }
    $('outCode').value = html;
    var links = state.css.map(function (u) { return '<link rel="stylesheet" href="' + esc(u) + '">'; }).join('');
    var wrapOpen = state.wrap ? '<div class="' + esc(state.wrap) + '">' : '', wrapClose = state.wrap ? '</div>' : '';
    var doc = '<!doctype html><html lang="ko"><head><meta charset="utf-8"><base href="https://www.kdi.re.kr/" target="_blank">' + links +
      (state.css.length ? '' : '<style>body{font-family:sans-serif;padding:16px;line-height:1.7}.p_type02,.p_type03{margin:0 0 14px}.bg_type02{background:#f3f3f3;padding:14px 18px;margin:14px 0;font-weight:bold}.img_type04 img{max-width:100%;height:auto}</style>') +
      '</head><body>' + wrapOpen + html + wrapClose + '</body></html>';
    $('preview').srcdoc = doc;
    $('cssState').textContent = state.css.length ? 'KDI CSS ' + state.css.length + '개 적용 중' : 'KDI CSS 미적용 · 기본 미리보기';
  }
  function renderCss() {
    $('cssList').innerHTML = state.css.map(function (u, i) {
      return '<li><code>' + esc(u) + '</code> <button class="btn-s" data-rm="' + i + '">빼기</button></li>';
    }).join('') || '<li class="note-s">아직 없어요. KDI 사이트에서 F12 → Elements의 &lt;link rel="stylesheet"&gt; 주소를 붙여 넣으세요.</li>';
    $('wrapClass').value = state.wrap;
  }

  $('typeList').addEventListener('click', function (e) { var b = e.target.closest('button[data-id]'); if (b) select(b.dataset.id); });
  $('typeSearch').addEventListener('input', function () { renderList(this.value); });
  $('srcText').addEventListener('input', function () { state.drafts[cur] = this.value; save(); build(); });
  $('resetEx').addEventListener('click', function () { delete state.drafts[cur]; save(); select(cur); toast('예시로 되돌렸어요'); });
  $('copyCode').addEventListener('click', function () {
    var v = $('outCode').value;
    (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () { toast('코드를 복사했어요'); }, function () { $('outCode').select(); document.execCommand('copy'); toast('코드를 복사했어요'); });
  });
  $('saveCode').addEventListener('click', function () {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([$('outCode').value], { type: 'text/html' }));
    a.download = typeById(cur).name + '_' + new Date().toISOString().slice(0, 10) + '.html'; a.click();
  });
  document.querySelectorAll('[data-w]').forEach(function (b) {
    b.addEventListener('click', function () {
      width = b.dataset.w; document.querySelectorAll('[data-w]').forEach(function (x) { x.classList.toggle('on', x === b); });
      $('preview').style.width = width === 'mo' ? '390px' : '100%';
    });
  });
  $('addCss').addEventListener('click', function () {
    var u = $('cssUrl').value.trim();
    if (!/^https?:\/\//.test(u)) { toast('http(s)로 시작하는 주소를 넣어 주세요'); return; }
    state.css.push(u); $('cssUrl').value = ''; save(); renderCss(); build();
  });
  $('cssList').addEventListener('click', function (e) { var b = e.target.closest('[data-rm]'); if (b) { state.css.splice(+b.dataset.rm, 1); save(); renderCss(); build(); } });
  $('wrapClass').addEventListener('change', function () { state.wrap = this.value.trim(); save(); build(); });

  // 유형 추가/수정
  var dlg = $('typeDlg');
  function openDlg(t) {
    $('tdName').value = t ? t.name : ''; $('tdTpl').value = t ? t.template : '<div class="p_type02">\n<h4 class="strong_type04">{{제목}}</h4>\n{{본문}}\n</div>';
    $('tdHelp').value = t ? (t.help || '') : ''; dlg.dataset.edit = t ? t.id : ''; dlg.showModal();
  }
  $('addType').addEventListener('click', function () { openDlg(null); });
  $('editType').addEventListener('click', function () { openDlg(typeById(cur)); });
  $('delType').addEventListener('click', function () {
    if (!confirm('이 유형을 지울까요? (내보내기로 먼저 백업할 수 있어요)')) return;
    state.custom = state.custom.filter(function (c) { return c.id !== cur; }); save(); select('bid');
  });
  $('tdSave').addEventListener('click', function (e) {
    e.preventDefault();
    var name = $('tdName').value.trim(); if (!name) { toast('유형 이름을 넣어 주세요'); return; }
    var id = dlg.dataset.edit || ('c' + Date.now().toString(36));
    var obj = { id: id, name: name, template: $('tdTpl').value, help: $('tdHelp').value.trim(), example: '@제목: ' + name + ' 예시 제목\n\n본문 문단입니다.' };
    state.custom = state.custom.filter(function (c) { return c.id !== id; }).concat([obj]); save(); dlg.close(); select(id); toast('유형을 저장했어요');
  });
  $('tdCancel').addEventListener('click', function (e) { e.preventDefault(); dlg.close(); });
  $('exportTypes').addEventListener('click', function () {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ custom: state.custom, css: state.css, wrap: state.wrap }, null, 2)], { type: 'application/json' }));
    a.download = 'onieum-coding-types.json'; a.click();
  });
  $('importTypes').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return;
    f.text().then(function (s) {
      var d = JSON.parse(s);
      if (Array.isArray(d.custom)) state.custom = d.custom;
      if (Array.isArray(d.css)) state.css = d.css;
      if (typeof d.wrap === 'string') state.wrap = d.wrap;
      save(); renderCss(); select(cur); toast('가져왔어요');
    }).catch(function () { toast('JSON 파일을 읽지 못했어요'); });
  });

  renderCss(); select('bid');
})(typeof window !== 'undefined' ? window : this);
