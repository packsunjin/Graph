"""study/digital/*.html → study/site/sheets/<id>.html (사이트용)

- sheet.css와 sheet-web.js를 파일 안에 넣는다 (아티팩트는 외부 스타일·스크립트를 막음)
- 옛한글(아래아 등)은 9KB짜리 부분 글꼴을 data URI로 넣어 어느 기기에서나 보이게 한다
사용법: python3 study/site/build.py
"""
import base64, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parents[2]
SITE = ROOT / 'study' / 'site'
SHEETS = {
    'tangungga': '2026-11-27_국어_탄궁가.html',
    'gangho': '2026-11-27_국어_강호사시가.html',
    'manheung': '2026-11-27_국어_만흥.html',
    'sijo': '2026-11-27_국어_시조모음.html',
    'climate-1': '2026-11-27_국어_기후위기보도_정리.html',
    'climate-2': '2026-11-27_국어_기후위기보도_문제.html',
    'spacing': '2026-11-27_국어_띄어쓰기.html',
    'sanup': '2026-11-27_국어_산업화시대의시.html',
    'haru': '2026-11-27_국어_하루의축.html',
    'matchum': '2026-11-27_국어_맞춤법부록.html',
}

css = (ROOT / 'study/tools/sheet.css').read_text()
js = (SITE / 'sheet-web.js').read_text()
font = base64.b64encode((SITE / 'oldhangul.woff2').read_bytes()).decode()
web_css = """
@font-face { font-family:"OldHangul"; src:url(data:font/woff2;base64,%s) format("woff2"); }
.oh { font-family:"OldHangul","Noto Serif CJK KR",serif; }
body.oldhangul { font-family:"Nanum Myeongjo","Noto Serif CJK KR",serif; }
body.sans { font-family:"Noto Sans KR","Noto Sans CJK KR","Nanum Gothic",sans-serif; }
html, body { background:#fff; overflow-x:hidden; }
.spread { margin:0; }
/* 빈칸 채우기 모드 */
body.mode-quiz .n, body.mode-quiz .lm, body.mode-quiz .fill { color:transparent !important; }
body.mode-quiz .n *:not(.qin):not(.qcover), body.mode-quiz .fill *:not(.qin):not(.qcover) { color:transparent !important; border-color:transparent !important; }
body.mode-quiz .n.oval { border-color:#c9cfdb !important; }
body.mode-quiz .ov::before { visibility:hidden; }
body.mode-quiz .qrev, body.mode-quiz .qrev * { color:revert !important; }
body.mode-quiz .n.qrev.c-b, body.mode-quiz .lm.qrev.c-b { color:var(--b) !important; }
body.mode-quiz .qrev.c-g { color:var(--g) !important; } body.mode-quiz .qrev.c-p { color:var(--p) !important; }
body.mode-quiz .qrev.c-r { color:var(--r) !important; } body.mode-quiz .fill.qrev { color:#222 !important; }
body.mode-quiz .ov.qrev::before { visibility:visible; }
body.mode-quiz .ans { border-color:transparent; }
.qin, .qcover { display:none; }
body.mode-quiz .qin, body.mode-quiz .qcover { display:block; }
body.mode-quiz .qin { color:#1f2a44 !important; }
body.mode-quiz .qin.ok { color:#0d5f33 !important; } body.mode-quiz .qin.shown { color:#2953c6 !important; }
body.mode-quiz .qcover { color:#5d6472 !important; }
.qin { position:absolute; left:0; top:0; width:100%%; height:100%%; min-width:3em; box-sizing:border-box;
  font:inherit; font-family:"Noto Sans KR","Noto Sans CJK KR",sans-serif; font-size:8.6pt; font-weight:500; color:#1f2a44; padding:0 3px;
  background:#fff8d6; border:1.3px dashed #c9a227; border-radius:3px; outline:none; }
.qin:focus { border-style:solid; border-color:#2953c6; background:#fff; }
.qin.ok { background:#e5f6ec; border:1.3px solid #138a4a; color:#0d5f33; }
.qin.bad { background:#fdeaea; border:1.3px solid #cf2f37; }
.qin.shown { background:#eef2ff; border:1.3px solid #2953c6; color:#2953c6; }
.qin-ov { top:auto; bottom:92%%; height:1.6em; font-size:7.8pt; }
.qcover { position:absolute; inset:0; min-width:4em; cursor:pointer; border:1.3px dashed #9aa3b5; border-radius:3px;
  background:repeating-linear-gradient(135deg,#eef1f6 0 6px,#e3e7ef 6px 12px); color:#5d6472;
  font:11px "Noto Sans KR",sans-serif; padding:0; }
.qcover:hover { border-color:#2953c6; color:#2953c6; }
.qcover-ov { top:auto; bottom:92%%; height:1.4em; right:auto; }
""" % font

OH = re.compile(r'([ᄀ-ᇿ〮〯]+)')

def wrap_oldhangul(html):
    # 태그 밖 글자만 감싼다
    return re.sub(r'>([^<]+)<', lambda m: '>' + OH.sub(r'<span class="oh">\1</span>', m.group(1)) + '<', html)

for sid, name in SHEETS.items():
    src = (ROOT / 'study/digital' / name).read_text()
    src = src.replace('<link rel="stylesheet" href="../tools/sheet.css">', '<style>' + css + web_css + '</style>')
    src = re.sub(r'<body([^>]*)class="', r'<body\1data-sheet="%s" class="' % sid, src, count=1)
    if 'data-sheet=' not in src:
        src = src.replace('<body>', '<body data-sheet="%s">' % sid, 1)
    src = src.replace('<head>', '<head><meta name="viewport" content="width=device-width, initial-scale=1">', 1)
    src = wrap_oldhangul(src)
    src = src.replace('</body>', '<script>' + js + '</script></body>')
    (SITE / 'sheets' / (sid + '.html')).write_text(src)
    print('built', sid)

# 사이트 본문: app.html(화면) + data.js(학습지·문제) → index.html
app = (SITE / 'app.html').read_text()
data = (SITE / 'data.js').read_text()
(SITE / 'index.html').write_text(app.replace('/*DATA*/', data))
print('built index.html')
