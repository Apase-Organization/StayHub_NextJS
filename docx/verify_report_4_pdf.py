"""Rasterize the one named PDF, build all-page contact sheets and check PDF bounds.

This is document QA only. The script never searches the workspace.
"""
from pathlib import Path
import json
import subprocess
import time
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
PDF=ROOT/'docx/Nhom05_BaoCaoCuoiKy (4).pdf'
ASSETS=ROOT/'docx/report_4_assets'
start=time.perf_counter()
info=subprocess.check_output(['pdfinfo',str(PDF)],text=True)
count=int(next(line.split(':')[1] for line in info.splitlines() if line.startswith('Pages:')))
# Remove only this renderer's deterministic earlier revision outputs.
for n in range(1,151):
    for digits in [2,3]: (ASSETS/f'page-{n:0{digits}d}.png').unlink(missing_ok=True)
for n in range(1,151,20):(ASSETS/f'contact-{n:03d}.jpg').unlink(missing_ok=True)
subprocess.run(['pdftoppm','-scale-to','1050','-png',str(PDF),str(ASSETS/'page')],check=True)
bbox=subprocess.check_output(['pdftotext','-bbox',str(PDF),'-'],text=True)
root=ET.fromstring(bbox)
pages=root.findall('.//{*}page')
boundary=[]; sparse=[]; samples={}
for i,page in enumerate(pages,1):
    words=page.findall('.//{*}word')
    if len(words)<15:sparse.append((i,len(words)))
    width,height=float(page.attrib['width']),float(page.attrib['height'])
    for word in words:
        x0,y0,x1,y1=[float(word.attrib[n]) for n in ['xMin','yMin','xMax','yMax']]
        if not (18 <= x0 < x1 <= width-18 and 12 <= y0 < y1 <= height-12):
            boundary.append((i,word.text,[x0,y0,x1,y1]))
    text=' '.join(w.text or '' for w in words)
    for label in ['UC01','UC08','Bộ phận:','3.2. Lược đồ','3.5. Sơ đồ','Các đối tượng','Sơ đồ biến cố:','5.5. Tạo đơn','5.10. Host','NHẬN XÉT','LỜI CẢM ƠN']:
        if label in text:samples.setdefault(label,[]).append(i)
digits=len(str(count))
for first in range(1,count+1,20):
    sheet=Image.new('RGB',(1200,5*450),'#dddddd');dr=ImageDraw.Draw(sheet)
    for k,n in enumerate(range(first,min(first+20,count+1))):
        im=Image.open(ASSETS/f'page-{n:0{digits}d}.png').convert('RGB')
        im.thumbnail((285,420));x=(k%4)*300+(300-im.width)//2;y=(k//4)*450+22
        sheet.paste(im,(x,y));dr.text(((k%4)*300+10,(k//4)*450+5),str(n),fill='black')
    sheet.save(ASSETS/f'contact-{first:03d}.jpg',quality=90)
result=dict(pages=count,boundary_violations=boundary,sparse_pages=sparse,detail_page_candidates=samples,
            seconds=round(time.perf_counter()-start,3))
(ASSETS/'pdf-qa.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps(result,ensure_ascii=False))
assert not boundary,boundary
