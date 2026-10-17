"""Update only report (4)'s TOC and export its PDF using the established UNO workflow."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from xml.dom import minidom

original = Path(__file__).with_name('render_report_2.py').read_text()
assert original.count('Nhom05_BaoCaoCuoiKy (2).docx') == 1
source = original.replace('Nhom05_BaoCaoCuoiKy (2).docx','Nhom05_BaoCaoCuoiKy (4).docx')
source = source.replace('lo-report2-uno','lo-report4-uno').replace('port=2012','port=2014')
exec(compile(source, str(Path(__file__)), 'exec'))

# Writer materializes the initial TOC placeholder as a redundant empty page
# break. Remove only breaks in textless paragraphs; preserve actual content,
# heading page-break-before settings, drawings, and the now-live TOC.
target=Path(__file__).resolve().parent/'Nhom05_BaoCaoCuoiKy (4).docx'
with ZipFile(target) as archive:
    files={n:archive.read(n) for n in archive.namelist()}
dom=minidom.parseString(files['word/document.xml'])
removed=0
for p in dom.getElementsByTagName('w:p'):
    if p.getElementsByTagName('w:t') or p.getElementsByTagName('w:drawing'):continue
    for br in list(p.getElementsByTagName('w:br')):
        if br.getAttribute('w:type')=='page':br.parentNode.removeChild(br);removed+=1
if removed:
    files['word/document.xml']=dom.toxml(encoding='UTF-8')
    with ZipFile(target,'w',ZIP_DEFLATED) as archive:
        for n,data in files.items():archive.writestr(n,data)
    print(f'Removed {removed} redundant blank page break; refreshing final TOC/PDF')
    # A separate UNO profile/port avoids reconnecting to the first Writer
    # process while its bridge is shutting down.
    final_source=source.replace('lo-report4-uno','lo-report4-uno-final').replace('port=2014','port=2015')
    exec(compile(final_source,str(Path(__file__)),'exec'))
