"""System Python + LibreOffice UNO: update TOC, save DOCX (2), export PDF.

Touches only the generated (2) report. No input document is opened by this script.
"""
from pathlib import Path
import subprocess
import time
import uno
from com.sun.star.beans import PropertyValue

root = Path(__file__).resolve().parents[1]
path = root / 'docx/Nhom05_BaoCaoCuoiKy (2).docx'


def prop(name, value):
    p = PropertyValue()
    p.Name, p.Value = name, value
    return p


start = time.perf_counter()
proc = subprocess.Popen(['libreoffice', '-env:UserInstallation=file:///tmp/opencode/lo-report2-uno', '--headless', '--accept=socket,host=localhost,port=2012;urp;StarOffice.ComponentContext', '--norestore', '--nodefault', '--nofirststartwizard'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    local = uno.getComponentContext()
    resolver = local.ServiceManager.createInstanceWithContext('com.sun.star.bridge.UnoUrlResolver', local)
    for _ in range(100):
        try:
            ctx = resolver.resolve('uno:socket,host=localhost,port=2012;urp;StarOffice.ComponentContext')
            break
        except Exception:
            time.sleep(0.1)
    else:
        raise RuntimeError('LibreOffice UNO connection timeout')
    desktop = ctx.ServiceManager.createInstanceWithContext('com.sun.star.frame.Desktop', ctx)
    doc = desktop.loadComponentFromURL(path.as_uri(), '_blank', 0, (prop('Hidden', True),))
    doc.refresh()
    indexes = doc.getDocumentIndexes()
    if indexes.getCount() == 0:
        paragraphs = doc.Text.createEnumeration()
        while paragraphs.hasMoreElements():
            paragraph = paragraphs.nextElement()
            if paragraph.supportsService('com.sun.star.text.Paragraph') and paragraph.String == 'MỤC LỤC':
                cursor = doc.Text.createTextCursorByRange(paragraph.End)
                cursor.gotoNextParagraph(False)
                index = doc.createInstance('com.sun.star.text.ContentIndex')
                index.CreateFromOutline = True
                index.Level = 2
                index.Title = ''
                doc.Text.insertTextContent(cursor, index, False)
                break
        indexes = doc.getDocumentIndexes()
    assert indexes.getCount() == 1, 'Expected one usable table of contents'
    for _ in range(2):
        for i in range(indexes.getCount()):
            indexes.getByIndex(i).update()
        doc.refresh()
    doc.store()
    doc.storeToURL(path.with_suffix('.pdf').as_uri(), (prop('FilterName', 'writer_pdf_Export'), prop('Overwrite', True)))
    print(f'Updated {indexes.getCount()} TOC/index; saved DOCX and PDF; {time.perf_counter()-start:.2f}s')
    doc.close(True)
    desktop.terminate()
finally:
    if proc.poll() is None:
        proc.terminate()
