"""KDI 홈페이지에 공개된 메인비주얼 이미지 목록으로 data/portfolio.json을 채운다.

사용: python3 scripts/build-portfolio.py <scan.json>
scan.json: {vs_no: [{url, kind, type, size, modified}]} — /kdidata/mainContent/visual/ 공개 파일을 번호별로 확인한 결과
- 2025-08-01 이후(가장 이른 파일 날짜 기준) 항목만 넣는다
- 원본 이미지는 KDI 주소로 연결하고, 저장소에는 640px 썸네일(JPEG)만 둔다
- 기존 항목의 코드(html)·제목은 그대로 둔다
"""
import json, sys, io, subprocess
from email.utils import parsedate_to_datetime
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True

SINCE = '2025-08-01'  # 포트폴리오 시작 시점
scan = json.load(open(sys.argv[1]))
data = json.load(open('data/portfolio.json'))
by = {x.get('vsNo'): x for x in data['items']}

def ymd(h):
    return parsedate_to_datetime(h).date().isoformat() if h else ''

def thumb(url, out):
    # GIF·대용량 파일은 앞부분만 받아 첫 장면으로 썸네일을 만든다
    raw = subprocess.run(['curl', '-s', '-A', 'Mozilla/5.0', '--max-time', '60', '-r', '0-4000000', url], capture_output=True).stdout
    im = Image.open(io.BytesIO(raw)); im.seek(0); im = im.convert('RGB')
    im.thumbnail((640, 640)); im.save(out, 'JPEG', quality=78, optimize=True)

items = []
for n in sorted(scan, key=int):
    files = scan[n]
    dates = sorted(ymd(f['modified']) for f in files if f['modified'])
    if not dates or dates[0] < SINCE:
        continue
    mains = [f for f in files if f['kind'] == 'main_visual_pc'] or [f for f in files if f['kind'].startswith('main_visual_mo')]
    main = sorted(mains, key=lambda f: ymd(f['modified']), reverse=True)[0]
    out = f'assets/portfolio/vs{n}.jpg'
    try:
        thumb(main['url'], out)
    except Exception as e:  # 썸네일 실패 시 원본 주소로만 보여 준다
        print('thumb fail', n, e); out = ''
    old = by.get(str(n), {})
    item = {
        'id': old.get('id', f'vs{n}'), 'vsNo': str(n), 'date': old.get('date') or dates[0],
        'category': old.get('category', '메인비주얼'), 'title': old.get('title', f'메인비주얼 {n}번'),
        'thumb': out, 'image': main['url'],
        'files': [{'url': f['url'], 'kind': f['kind'], 'size': f['size'], 'modified': ymd(f['modified'])} for f in files],
    }
    for k in ('desc', 'link', 'subs', 'html'):
        if k in old: item[k] = old[k]
    items.append(item)
    print(n, item['date'], main['url'].rsplit('/', 1)[-1], 'thumb' if out else '-')

items.sort(key=lambda x: x['date'], reverse=True)
data['items'] = items
data['note'] = 'KDI 홈페이지에 공개된 메인비주얼 작업 목록(2025년 8월 이후). 원본 이미지는 kdi.re.kr 주소로 연결하고 저장소에는 썸네일만 둡니다. 코드가 없는 항목은 CMS에서 가져와야 합니다.'
json.dump(data, open('data/portfolio.json', 'w'), ensure_ascii=False, indent=1)
print('items', len(items))
