"""Revision (4), scoped template adaptation of the reproducible revision (2).

Reuses its complete Vietnamese content and drawing primitives, not its outputs.
All substitutions are guarded; original scripts and reports are never written.
--check is an isolated document validator, not an application test runner.
"""
from pathlib import Path
from zipfile import ZipFile
import hashlib
import inspect
import json
import re
import sys
import time
import subprocess
sys.dont_write_bytecode = True
import generate_report_2 as base
from docx import Document
from docx.shared import Cm
from lxml import etree
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docx/Nhom05_BaoCaoCuoiKy (4).docx'
ASSETS = ROOT / 'docx/report_4_assets'
TEMPLATES = ['Mau_Danh sach yeu cau.docx', 'Mau_Mo Hinh Hoa yeu cau.docx',
             'Mau_Dac Ta Usecase.docx', 'BaoCaoMau_ThietKeCSDL va ThietKeGiaoDien.docx',
             'Mau_Khao sat hien trang.docx', 'Mẫu RBTV trên CSDL.docx',
             'V03 - Thiet ke phan mem.PPT']
PROTECTED = [ROOT / 'docx' / ('Nhom05_BaoCaoCuoiKy' + suffix + '.docx')
             for suffix in ['', ' (1)', ' (2)', ' (3)']]
PROTECTED += [ROOT / 'docx/Template' / n for n in TEMPLATES]
PROTECTED += [ROOT / 'docs/product' / ('image.png' if i == 0 else f'image-{i}.png') for i in range(7)]
REQ = ['STT', 'Công Việc', 'Loại Công Việc', 'Quy Định/ Công Thức Liên Quan', 'Biểu Mẫu Liên Quan', 'Ghi Chú']
DICT = ['Stt', 'Thuộc tính', 'Kiểu', 'Miền giá trị', 'Ý nghĩa', 'Ghi chú']
UC_FIELDS = ['Use Case ID', 'Tên chức năng', 'Mô tả', 'Tác nhân', 'Điều kiện trước',
             'Điều kiện sau', 'Luồng chính', 'Luồng thay thế', 'Luồng ngoại lệ']
SCENARIOS = ['Đăng nhập hệ thống', 'Tìm kiếm và lọc chỗ ở', 'Chi tiết và kiểm tra tình trạng trống',
             'Tạo đơn và khởi tạo thanh toán', 'Thanh toán VNPay', 'Hủy đơn đặt phòng',
             'Viết đánh giá', 'Đăng tin chỗ ở', 'Host chấp nhận hoặc từ chối', 'Khóa tài khoản']


def hashes():
    return {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in PROTECTED}


def model_fields():
    schema = (ROOT / 'prisma/schema.prisma').read_text()
    models = re.findall(r'model (\w+) \{(.*?)\n\}', schema, re.S)
    names = {n for n, _ in models}
    return [(n, [(a[0], a[1], ' '.join(a[2:])) for line in body.splitlines()
                  if len(a := line.strip().split()) >= 2 and not a[0].startswith('@@')
                  and a[1].rstrip('?[]') not in names]) for n, body in models]


def logical_notation(para):
    para('Quy ước: [PK] là khóa chính; [FK→QuanHệ.thuộcTính] là khóa ngoại; [UK] là khóa duy nhất; dấu ? chỉ thuộc tính có thể NULL. Tên thuộc tính thống nhất với từ điển dữ liệu. PropertyAmenity có khóa chính ghép (propertyId, amenityId).')
    targets = {'hostId': 'User.id', 'guestId': 'User.id', 'userId': 'User.id',
               'propertyId': 'Property.id', 'bookingId': 'Booking.id',
               'amenityId': 'Amenity.id', 'discountCodeId': 'DiscountCode.id'}
    for name, fields in model_fields():
        attrs = []
        for field, typ, flags in fields:
            tags = []
            if '@id' in flags or name == 'PropertyAmenity': tags.append('PK')
            if field in targets: tags.append('FK→' + targets[field])
            if '@unique' in flags: tags.append('UK')
            attrs.append(field + ('?' if typ.endswith('?') else '') + (('[' + '; '.join(tags) + ']') if tags else ''))
        para(name + '(' + ', '.join(attrs) + ').')


def relational_graph(part='core'):
    # Record-shaped relation nodes and key references, not process nodes/arrows.
    nodes = {
        'User': ['id [PK]', 'email [UK]', 'role, status'],
        'Property': ['id [PK]', 'hostId [FK]', 'pricePerNight, status'],
        'Booking': ['id [PK]', 'propertyId, guestId [FK]', 'discountCodeId? [FK]', 'checkInDate, checkOutDate', 'totalPrice, status'],
        'Payment': ['id [PK]', 'bookingId [FK, UK]', 'providerTxnRef? [UK]', 'amount, status'],
        'Review': ['id [PK]', 'bookingId [FK, UK]', 'propertyId, guestId [FK]', 'rating'],
        'DiscountCode': ['id [PK]', 'code [UK]', 'type, value'],
        'PropertyImage': ['id [PK]', 'propertyId [FK]', '(propertyId, displayOrder) [UK]'],
        'Amenity': ['id [PK]', 'name [UK]'],
        'PropertyAmenity': ['propertyId [PK, FK]', 'amenityId [PK, FK]'],
        'VerificationToken': ['id [PK]', 'userId [FK]', 'otpHash, expiresAt, usedAt?']}
    edges = [('User','Property','1','0..n','hostId'), ('User','Booking','1','0..n','guestId'),
             ('Property','Booking','1','0..n','propertyId'), ('DiscountCode','Booking','0..1','0..n','discountCodeId'),
             ('Booking','Payment','1','0..1','bookingId'), ('Booking','Review','1','0..1','bookingId'),
             ('User','Review','1','0..n','guestId'), ('Property','Review','1','0..n','propertyId'),
             ('Property','PropertyImage','1','0..n','propertyId'), ('Property','PropertyAmenity','1','0..n','propertyId'),
             ('Amenity','PropertyAmenity','1','0..n','amenityId'), ('User','VerificationToken','1','0..n','userId')]
    selected = (['User','Property','Booking','Payment','Review','DiscountCode'] if part=='core'
                else ['User','Property','PropertyImage','PropertyAmenity','Amenity','VerificationToken'])
    nodes = {n: attrs for n,attrs in nodes.items() if n in selected}
    edges = [e for e in edges if e[0] in nodes and e[1] in nodes]
    if part=='support': edges=[e for e in edges if e[4]!='hostId']
    lines = ['digraph G { rankdir=TB; bgcolor=white; nodesep=0.5; ranksep=0.8;',
             'node [shape=record,fontname="DejaVu Sans",fontsize=12,color=black,fontcolor=black];',
             'edge [dir=none,fontname="DejaVu Sans",fontsize=10,color=black,fontcolor=black];']
    for n, attrs in nodes.items(): lines.append(f'{n} [label="{{{n}|' + '\\l'.join(attrs) + '\\l}"];')
    for a,b,ca,cb,f in edges: lines.append(f'{a} -> {b} [taillabel="{ca}",headlabel="{cb}",label="{f}"];')
    lines.append('}')
    p = ASSETS / f'diagram-relational-{part}.dot'
    p.write_text('\n'.join(lines))
    subprocess.run(['dot','-Tpng','-Gdpi=180',str(p),'-o',str(p.with_suffix('.png'))], check=True)
    return p.with_suffix('.png')


def events_graph(i):
    # Focused per-screen event/action/feedback diagrams, independent of sequences.
    flows = [
        [('Nhấn Search', 'Đọc địa điểm, ngày, khách', 'Mở /search với tiêu chí'), ('Chọn thẻ điểm đến', 'Lấy địa điểm đã chọn', 'Mở kết quả theo địa điểm'), ('Ngày không hợp lệ', 'Yêu cầu sửa ngày', 'Giữ màn hình, báo lỗi')],
        [('Áp dụng bộ lọc', 'Giữ tiêu chí; về trang 1', 'Tải danh sách / trạng thái rỗng'), ('Đổi sắp xếp', 'Đổi sort trong URL', 'Cần bổ sung orderBy ở service'), ('Chọn thẻ chỗ ở', 'Lấy mã chỗ ở', 'Mở /properties/{id}')],
        [('Đổi ngày / số khách', 'Kiểm tra và tính giá hiển thị', 'Cập nhật thẻ đặt phòng'), ('Kiểm tra trống', 'Truy vấn đơn giao lịch', 'Báo trống / xung đột / lỗi'), ('Nhấn Reserve', 'Chuyển lịch và số khách', 'Mở checkout; API kiểm tra lại')],
        [('Nhấn Apply', 'Kiểm tra mã tại server', 'Cập nhật giảm giá / báo lỗi'), ('Confirm & Pay', 'POST tạo đơn; khóa nút khi gửi', 'Có URL: chuyển VNPay'), ('Thiếu URL / tạo đơn lỗi', 'Không báo đã thanh toán', 'Hiện lỗi; cho tra cứu lại đơn')],
        [('Đổi tab', 'GET theo trạng thái và phiên', 'Hiện danh sách / rỗng / lỗi'), ('Details / tên chỗ ở', 'Lấy mã đơn / chỗ ở', 'Mở trang chi tiết tương ứng'), ('Cancel → xác nhận', 'PATCH hủy; kiểm tra quyền', 'Thành công: tải lại; lỗi: giữ hộp thoại')],
        [('Chọn menu', 'Đổi vùng nội dung nội bộ', 'Hiện tổng quan / tin / đơn'), ('Đăng chỗ ở mới', 'Mở form → POST dữ liệu', 'Làm mới hoặc báo lỗi; mặc định DRAFT'), ('Lưu trữ', 'DELETE theo quyền sở hữu', 'Chuyển INACTIVE; không xóa vật lý')],
        [('Chọn menu', 'Đổi nội dung trong /admin', 'Tổng quan / đơn toàn sàn'), ('Tìm kiếm / lọc', 'Về trang 1; GET theo query', 'Hiện bảng / rỗng / lỗi'), ('Nhấn Xem', 'Lấy bookingId', 'Mở /bookings/{id}; server kiểm tra quyền')]
    ]
    nodes = {}; edges = []
    for j,(trigger,action,result) in enumerate(flows[i]):
        nodes[f'e{j}'] = trigger; nodes[f'a{j}'] = action; nodes[f'r{j}'] = result
        edges += [(f'e{j}', f'a{j}', ''), (f'a{j}', f'r{j}', '')]
    return base.graph(f'events-{i+1}', nodes, edges, 'LR')


def focused_usecases(picture, heading, page):
    groups=[('Xác thực','Người dùng',[1,2,3]),('Tìm kiếm chỗ ở','Khách vãng lai / người dùng',[4,5,6,7]),
            ('Đặt phòng và thanh toán','Người dùng',[8,9]),('Chuyến đi và đánh giá','Người dùng',[10,11,12,13]),
            ('Đăng tin và quản lý chỗ ở','Host / Admin',[14,15]),('Theo dõi đơn và doanh thu Host','Host',[16,17,18,19]),
            ('Quản trị hệ thống','Admin',[20,21,22,23,24])]
    import textwrap
    for i,(title,actor,ids) in enumerate(groups,1):
        if i%2==1:page()
        heading('Use case '+title.lower(),3)
        lines=['graph G { rankdir=LR; bgcolor=white;',
               'node [fontname="DejaVu Sans",fontsize=12,fontcolor=black,color=black];',
               'edge [color=black];', 'a [shape=plaintext,label='+json.dumps(actor,ensure_ascii=False)+'];',
               'subgraph cluster_system { label="StayHub"; color=black;']
        for k in ids:
            label=f'UC{k:02d} — '+base.UC[k-1][0]
            if k in [17,18,24]:label+=' (mở rộng)'
            label='\n'.join(textwrap.wrap(label,32))
            lines.append(f'u{k} [shape=ellipse,label='+json.dumps(label,ensure_ascii=False)+'];')
        lines.append('}')
        lines.extend(f'a -- u{k};' for k in ids)
        if 9 in ids:lines+=['v [shape=plaintext,label="VNPay"];','v -- u9;']
        lines.append('}')
        p=ASSETS/f'diagram-uc-group-{i}.dot';p.write_text('\n'.join(lines))
        subprocess.run(['dot','-Tpng','-Gdpi=180',str(p),'-o',str(p.with_suffix('.png'))],check=True)
        picture(p.with_suffix('.png'),title,2,9)


def extra_sequences(heading, page, picture, para, which):
    definitions = {
        'login': ('5.2. Đăng nhập hệ thống', ['Người dùng','Giao diện','Auth.js','User / DB'],
                  [(0,1,'Nhập email và mật khẩu',False),(1,2,'Gửi yêu cầu đăng nhập',False),(2,3,'Tìm tài khoản theo email',False),(3,2,'Danh tính, hash và trạng thái',True),(2,2,'Kiểm tra mật khẩu và điều kiện tài khoản',False),(2,1,'Sai thông tin: từ chối; đúng: tạo phiên',True),(1,0,'Hiện lỗi hoặc điều hướng theo quyền',True)],
                  'Google là phương án xác thực thay thế. Phiên phải mang đúng id, vai trò và trạng thái; cần kiểm thử việc tài khoản bị khóa khi JWT cũ còn hạn. Sơ đồ thể hiện trách nhiệm cần có, không chứng nhận mọi nhánh xác thực đã đạt.'),
        'detail': ('5.4. Chi tiết và kiểm tra tình trạng trống', ['Khách','Trang / API','Booking service','Prisma / DB'],
                   [(0,1,'Mở mã chỗ ở',False),(1,3,'Đọc chỗ ở, ảnh, tiện nghi, đánh giá',False),(3,1,'Dữ liệu hoặc không tìm thấy',True),(1,0,'Hiển thị chi tiết hoặc 404',True),(0,1,'Chọn ngày và kiểm tra trống',False),(1,2,'Truyền mã chỗ ở và khoảng ngày',False),(2,3,'Tìm đơn giữ lịch có giao nhau',False),(3,2,'Có đơn / không có đơn',True),(2,1,'Kết quả tại thời điểm truy vấn',True),(1,0,'Báo xung đột / còn trống',True)],
                   'Điều kiện giao nhau: a.checkIn < b.checkOut và a.checkOut > b.checkIn. PENDING_PAYMENT và CONFIRMED giữ lịch. Kiểm tra không tạo khóa hay giữ chỗ; khi tạo đơn phải kiểm tra lại. Ngày trả của kỳ trước có thể là ngày nhận của kỳ sau.'),
        'listing': ('5.9. Đăng tin chỗ ở', ['Host','Property API','Property service','Prisma / DB'],
                    [(0,1,'Gửi thông tin và tiện nghi',False),(1,1,'Kiểm tra phiên HOST / ADMIN và dữ liệu',False),(1,2,'Chuyển dữ liệu và chủ sở hữu',False),(2,3,'Kiểm tra tiện nghi tham chiếu',False),(3,2,'Danh mục hợp lệ / lỗi',True),(2,3,'Tạo Property và quan hệ tiện nghi',False),(3,2,'Bản ghi DRAFT hoặc lỗi ghi',True),(2,1,'Trả tin đã tạo / thông báo lỗi',True),(1,0,'Làm mới danh sách; chưa coi là ACTIVE',True)],
                    'Sơ đồ mô tả trách nhiệm thiết kế. Bản cài đặt cần tách amenityIds khỏi dữ liệu model trước khi tạo; không được coi nhánh lỗi này là đã tạo tin thành công. Ảnh là dữ liệu con của Property, cần kiểm tra quyền sở hữu khi tải lên và thay đổi.'),
        'approval': ('5.10. Host chấp nhận hoặc từ chối', ['Host','Giao diện','Xử lý duyệt','Kho dữ liệu'],
                     [(0,1,'Mở yêu cầu thuộc chỗ ở của mình',False),(1,2,'Lấy thông tin và quyền thao tác',False),(2,3,'Đọc yêu cầu và trạng thái',False),(3,2,'Dữ liệu yêu cầu',True),(0,1,'Chọn chấp nhận hoặc từ chối',False),(1,2,'Gửi quyết định và lý do',False),(2,2,'Kiểm tra quyền, lịch và trạng thái chờ duyệt',False),(2,3,'Lưu quyết định theo chính sách',False),(3,2,'Kết quả; lỗi thì không xác nhận',True),(2,1,'Thông báo khách; đối soát nếu đã trả tiền',True),(1,0,'Cập nhật danh sách yêu cầu',True)],
                     'Đây là thiết kế mở rộng, chưa có API và trạng thái chờ Host tương ứng. MVP xác nhận trực tiếp khi VNPay thành công hợp lệ; tuyệt đối không dùng PENDING_PAYMENT như chờ Host duyệt. Khi triển khai cần chốt chính sách giữ lịch, hoàn tiền và thông báo trước.'),
        'lock': ('5.11. Khóa tài khoản', ['Admin','User API','Xử lý quyền','User / DB'],
                 [(0,1,'Chọn tài khoản và xác nhận khóa',False),(1,2,'Kiểm tra phiên ADMIN',False),(2,3,'Tìm tài khoản mục tiêu',False),(3,2,'Tài khoản / không tồn tại',True),(2,2,'Kiểm tra chính sách tự khóa và phạm vi',False),(2,3,'Cập nhật status = LOCKED',False),(3,2,'Kết quả ghi',True),(2,1,'Trả thành công hoặc lỗi',True),(1,0,'Cập nhật trạng thái hiển thị',True)],
                 'Cập nhật LOCKED không tự chứng minh JWT đã bị thu hồi. Điều kiện tự khóa, nhật ký quản trị và hiệu lực phiên cần được nghiệm thu riêng; ảnh Admin hiện không có màn hình Users. Mở khóa khôi phục ACTIVE, không cấp thêm vai trò.')}
    title, actors, events, note = definitions[which]
    page(); heading(title,2)
    picture(base.sequence(which,actors,events), title.split('. ',1)[1],5,17)
    para(note)


def build():
    ASSETS.mkdir(exist_ok=True)
    for suffix in ['.dot','.png']:(ASSETS/('diagram-relational'+suffix)).unlink(missing_ok=True)
    before = hashes()
    base.OUT, base.ASSETS = OUT, ASSETS
    src = inspect.getsource(base.build)

    def replace(old, new):
        nonlocal src
        assert src.count(old) == 1, ('Upstream generator changed', old[:100])
        src = src.replace(old,new)

    # Adapt table content and exact column patterns without rewriting valid prose.
    replace('    def table(caption,headers,rows,chapter):', '''    def table(caption,headers,rows,chapter):
        rows = list(rows)
        if headers == ['Thuộc tính','Kiểu Prisma','Ràng buộc','Ý nghĩa']:
            headers = DICT
            enum_map = dict((n, ', '.join(b.split())) for n,b in re.findall(r'enum (\\w+) \\{([^}]+)\\}', (ROOT/'prisma/schema.prisma').read_text()))
            converted=[]
            for j,(field,typ,flags,detail) in enumerate(rows,1):
                if field == 'publicId': flags=flags.replace('; FK','')
                if caption.endswith('PropertyAmenity'): flags='PK ghép; FK; NOT NULL'
                domain=('Miền '+typ.rstrip('?')+'; Bảng 3.2' if typ.rstrip('?') in enum_map else {'String':'Chuỗi Unicode','Int':'Số nguyên 32-bit','DateTime':'Ngày giờ','Boolean':'true / false','Json':'Giá trị JSON'}.get(typ.rstrip('?'),'Theo kiểu dữ liệu'))
                if field == 'rating': domain='Số nguyên 1–5 (nghiệp vụ)'
                if field in ['checkInDate','checkOutDate']: domain='Ngày lịch; checkOutDate > checkInDate'
                if 'Decimal' in typ: domain='Số thập phân; tiền không âm / điểm theo quy định'
                detail=re.sub(r'^[Tt]ự cập nhật thời điểm\\.\\s*','',detail)
                converted.append((j,field,typ,domain,detail,flags))
            rows=converted
        elif headers == ['Tên đối tượng','Loại','Dữ liệu / ý nghĩa']:
            headers=['STT','Loại','Ý nghĩa']
            rows=[(j,typ,field + ': ' + meaning) for j,(field,typ,meaning) in enumerate(rows,1)]
        elif caption == 'Ràng buộc và tầm ảnh hưởng':
            headers=['Mã số','Mô tả miền giá trị','Thành phần liên quan','Ghi chú']
            rows=[('RB%02d'%j,condition,group + ' — ' + operations,limits) for j,(group,condition,operations,limits) in enumerate(rows,1)]
''')
    replace("        widths=([4,12.5] if len(headers)==2 else [4,3,9.5] if len(headers)==3 else [16.5/len(headers)]*len(headers))", """        widths=([4,12.5] if len(headers)==2 else [1,4,11.5] if headers==['STT','Loại','Ý nghĩa'] else [1,5,10.5] if headers in [['STT','Chức năng','Mô tả'],['STT','Màn hình','Vai trò / đường dẫn']] else [4,3,9.5] if len(headers)==3 else [16.5/len(headers)]*len(headers))
        if headers == REQ: widths=[0.8,2.6,2,4.6,2.5,4]
        if headers == DICT: widths=[0.8,3.1,2.3,3.1,4.2,3]""")
    # Keep two compact specifications per page, with each table kept intact.
    replace('        if i % 2 == 1: page()', '        if i > 1 and i % 2 == 1: page()')
    replace("('Mục tiêu',name+'.'),('Tác nhân',actor),('Kích hoạt','Tác nhân chọn chức năng '+name.lower()+'.'),('Tiền điều kiện',pre)", "('Use Case ID',f'UC{i:02d}'),('Tên chức năng',name),('Mô tả',UC_DESCRIPTIONS[i-1]+' '+note),('Tác nhân',actor),('Điều kiện trước',pre),('Điều kiện sau',post)")
    replace("main.rstrip('.').split('. ')", "re.split(r'[.;] ',main.rstrip('.'))")
    replace("f'{j+1}. {s.strip()}.'", "f'{j+1}. {s.strip()[:1].upper()+s.strip()[1:]}.'")
    replace("('Thay thế / ngoại lệ',edge),('Hậu điều kiện',post),('Quy tắc / hiện trạng',note)", "('Luồng thay thế',ALTERNATIVES[i-1]),('Luồng ngoại lệ',edge)")
    replace("heading('2.3. Đặc tả use case',2)", "page();heading('2.4. Đặc tả use case',2)")
    replace("heading(f'2.3.{i}. UC{i:02d} – {name}',2)", "heading(f'2.4.{i}. UC{i:02d} – {name}',2)")
    replace("    heading('2.1. Tác nhân và mục tiêu',2)", """    heading('2.1. Nhận diện tác nhân và chức năng',2)
    table('Tác nhân và chức năng',['Tác nhân','Chức năng'],[
        ('Khách vãng lai','Đăng ký, đăng nhập; tìm kiếm, lọc, xem chi tiết và kiểm tra lịch.'),
        ('Người dùng đăng nhập','Đặt phòng và thanh toán; xem và hủy đơn của mình; đánh giá khi đủ điều kiện.'),
        ('Host','Quản lý chỗ ở thuộc sở hữu; xem đơn và số liệu Host. Duyệt thủ công là mở rộng.'),
        ('Admin','Tổng quan toàn sàn, tra cứu đơn, khóa/mở khóa; đổi vai trò cần hoàn thiện.'),
        ('VNPay','Tiếp nhận thanh toán và gửi kết quả để server xác minh.')],2)
    heading('2.2. Danh sách chức năng',2)
    table('Danh sách 24 chức năng',['STT','Chức năng','Mô tả'],[(i,u[0],u[5]) for i,u in enumerate(UC,1)],2)
    page();heading('2.3. Lược đồ use case',2)""")
    replace("heading('2.2. Danh mục use case và truy vết',2)", "focused_usecases(picture,heading,page)\n    heading('Truy vết yêu cầu và use case',3)")
    replace("    for i in range(0,len(reqs),4):\n        table('Danh mục yêu cầu nghiệp vụ',['Mã / Công việc','Loại / Dữ liệu vào','Quy tắc','Kết quả'],[(a+'\\n'+b,c+'\\n'+v,r,o) for a,b,c,v,r,o in reqs[i:i+4]],1)", """    form_ids=['TK01','MH01–MH02','MH03','MH03','MH04','MH04','MH04','MH05','DG01','MH06','MH06','MH07']
    for group,indices,code in [('Khách thuê',[0,1,2,3,4,5,7,8],'KH'),('Thanh toán',[6],'TT'),('Chủ nhà',[9,10],'CN'),('Quản trị',[11],'QT')]:
        p=para('Bộ phận: '+group+'    Mã số: '+code);p.paragraph_format.keep_with_next=True
        table('Yêu cầu nghiệp vụ — '+group,REQ,[(j+1,reqs[k][0]+' — '+reqs[k][1],reqs[k][2],reqs[k][4],form_ids[k],reqs[k][5]) for j,k in enumerate(indices)],1)
    p=para('Bộ phận: Kết xuất và thông báo    Mã số: KX');p.paragraph_format.keep_with_next=True
    table('Kết xuất kết quả nghiệp vụ',REQ,[
        (1,'Hiển thị xác nhận và chi phí','Kết xuất','Chỉ thông báo xác nhận khi trạng thái server hợp lệ','MH04–MH05','Không suy ra đã trả tiền từ chuyển trang.'),
        (2,'Hiển thị thống kê','Kết xuất','Tổng Payment SUCCESS theo phạm vi quyền','MH06–MH07','Không đồng nhất với doanh thu thuần hoặc tất toán.'),
        (3,'Gửi email giao dịch','Kết xuất','Gửi sau khi cập nhật thanh toán thành công','Email xác nhận','Chưa có bảng lịch sử thông báo; cần retry và theo dõi lỗi.')],1)
    para('Ký hiệu màn hình: MH01 trang chủ; MH02 tìm kiếm; MH03 chi tiết; MH04 checkout; MH05 chuyến đi; MH06 Host; MH07 Admin. TK01 là biểu mẫu đăng ký/OTP; DG01 là biểu mẫu đánh giá. Đây là biểu mẫu điện tử, không phải giấy tờ bổ sung.')""")
    replace("heading('CHƯƠNG 1. KHẢO SÁT VÀ PHÂN TÍCH YÊU CẦU')", "heading('CHƯƠNG 1. KHẢO SÁT HIỆN TRẠNG')")
    replace("heading('1.1. Bài toán và phạm vi',2)", """heading('1.1. Phân tích hiện trạng',2)
    para('Trong bài toán khảo sát, thông tin chỗ ở, lịch đặt và giao dịch có thể được quản lý rời rạc qua tin nhắn, điện thoại hoặc bảng tính. Khi nhiều người cùng cập nhật, việc đối chiếu lịch và thanh toán dễ thiếu nhất quán. StayHub tập trung các dữ liệu này để khách chủ động tìm kiếm, Host theo dõi chỗ ở và Admin giám sát giao dịch.')
    para('Phạm vi khảo sát là quy trình và yêu cầu của đồ án; chưa có số liệu phỏng vấn, mẫu khảo sát thị trường hay đo phí của đối thủ để đưa ra kết luận định lượng.')""")
    replace("heading('1.2. Yêu cầu chức năng nghiệp vụ',2)", "heading('1.2. Phân tích yêu cầu',2)\n    heading('1.2.1. Yêu cầu chức năng nghiệp vụ',3)")
    replace("heading('1.3. Biểu mẫu nghiệp vụ và phân quyền',2)", "heading('1.2.2. Biểu mẫu, hệ thống và phân quyền',3)")
    replace("heading('1.4. Yêu cầu phi chức năng',2)", "heading('1.2.3. Yêu cầu phi chức năng',3)")
    replace("heading('1.5. Quy trình tác nghiệp',2)", "heading('1.3. Quy trình tác nghiệp',2)")
    replace("heading('3.1. Mô hình dữ liệu logic',2)", "heading('3.1. Sơ đồ logic',2)")
    replace("'Mô hình logic lõi: thực thể, định danh và bội số',3,15)", "'Mô hình logic lõi: thực thể, định danh và bội số',3,12)")
    replace("'Mô hình logic dữ liệu bổ trợ',3,12)", "'Mô hình logic dữ liệu bổ trợ',3,9)")
    replace("    heading('3.2. Ánh xạ quan hệ và bội số',2)", """    page();heading('3.2. Lược đồ logic',2)
    logical_notation(para)
    heading('Ánh xạ quan hệ và bội số',3)""")
    replace("heading('3.4. Từ điển dữ liệu',2)", "heading('3.4. Chi tiết các bảng dữ liệu',2)")
    replace("page();heading('3.2. Lược đồ logic',2)", "heading('3.2. Lược đồ logic',2)")
    replace("    page();heading('3.5. Ràng buộc toàn vẹn và tầng thực thi',2)", """    page();heading('3.5. Sơ đồ quan hệ và ràng buộc toàn vẹn',2)
    picture(relational_graph('core'),'Sơ đồ quan hệ lõi: khóa và bội số',3,17)
    page();heading('Sơ đồ quan hệ bổ trợ',3)
    picture(relational_graph('support'),'Sơ đồ quan hệ bổ trợ: ảnh, tiện nghi và mã xác minh',3,14)
    para('Các khung là quan hệ dữ liệu, đường nối biểu diễn tham chiếu khóa ngoại và bội số, không phải thứ tự xử lý. Chi tiết thuộc tính xem mục 3.4. Dấu ? chỉ khả năng NULL.')
    page();heading('Ràng buộc toàn vẹn và tầng thực thi',3)""")
    replace("heading('4.2. Luân chuyển màn hình',2)", """heading('4.2. Danh sách các màn hình và sơ đồ chuyển đổi',2)
    table('Danh sách màn hình',['STT','Màn hình','Vai trò / đường dẫn'],[(1,'Trang chủ','Công khai /'),(2,'Tìm kiếm','Công khai /search'),(3,'Chi tiết','Công khai /properties/{id}'),(4,'Checkout','Đăng nhập /properties/{id}/book'),(5,'Chuyến đi','Đăng nhập /bookings'),(6,'Host','HOST hoặc ADMIN /host'),(7,'Admin','ADMIN /admin')],4)""")
    replace("heading('4.3. Đặc tả chi tiết màn hình',2)", "heading('4.3. Mô tả chi tiết các màn hình',2)")
    replace("para('Mục đích và bố cục. '+intro)", "para('Ý nghĩa. '+intro)\n        heading('Chi tiết màn hình',3)")
    replace("        page();heading(f'Đặc tả tương tác: {name}',3)", "        heading(f'Đặc tả tương tác: {name}',3)")
    replace("        table('Đối tượng trên màn hình '+name.lower()", "        heading('Các đối tượng trong màn hình',3)\n        table('Đối tượng trên màn hình '+name.lower()")
    replace("        table('Biến cố và phản hồi: '+name.lower(),['Biến cố','Xử lý và kiểm tra'],events,4)", """        page();heading('Sơ đồ biến cố: '+name,3)
        picture(events_graph(i),'Biến cố và phản hồi — '+name,4,11)
        table('Biến cố và phản hồi: '+name.lower(),['Biến cố','Xử lý và kiểm tra'],events,4)""")
    # Explicit payment result node; no false automatic-success transition.
    replace("page();heading('Sơ đồ biến cố: '+name,3)", "heading('Sơ đồ biến cố: '+name,3)")
    replace("'bd':'Chi tiết đơn /bookings/{id}'}", "'bd':'Chi tiết đơn /bookings/{id}','result':'Kết quả VNPay\\nXác minh trạng thái server'}")
    replace("('book','vnpay','URL từ server'),('trips'", "('book','vnpay','URL từ server'),('vnpay','result','Trả query kết quả'),('result','trips','Tra cứu đơn sau xác minh'),('trips'")
    # Ten original business scenarios. Verify is nested in payment, not a new scenario.
    replace("    heading('5.2. Tìm kiếm và kiểm tra lịch',2)", """    extra_sequences(heading,page,picture,para,'login')
    page();heading('5.3. Tìm kiếm và lọc chỗ ở',2)""")
    replace("    page();heading('5.3. Tạo đơn và khởi tạo thanh toán',2)", """    extra_sequences(heading,page,picture,para,'detail')
    page();heading('5.5. Tạo đơn và khởi tạo thanh toán',2)""")
    replace("heading('5.4. Xác nhận qua IPN VNPay',2)", "heading('5.6. Thanh toán VNPay',2)\n    heading('5.6.1. Xác nhận qua IPN',3)")
    replace("heading('5.5. Xác minh kết quả trả về trình duyệt',2)", "heading('5.6.2. Xác minh kết quả trả về trình duyệt',3)")
    replace("heading('5.6. Hủy đơn và tác động lên thanh toán',2)", "heading('5.7. Hủy đơn đặt phòng',2)")
    replace("heading('5.7. Đánh giá và cập nhật điểm',2)", "heading('5.8. Viết đánh giá',2)")
    replace("    page();heading('CHƯƠNG 6. CÀI ĐẶT VÀ KẾ HOẠCH THỬ NGHIỆM')", """    for scenario in ['listing','approval','lock']: extra_sequences(heading,page,picture,para,scenario)
    page();heading('CHƯƠNG 6. CÀI ĐẶT VÀ THỬ NGHIỆM')""")
    # Retain original historical evidence as explicitly dated, not rerun results.
    replace("    heading('6.4. Kịch bản kiểm thử và kết quả mong đợi',2)", """    heading('6.3.1. Kết quả kỹ thuật đã ghi nhận ngày 05/10/2026',3)
    para('Các bảng dưới ghi lại kết quả kiểm tra trong giai đoạn khảo sát ngày 05/10/2026. Chúng không phải kết quả chạy lại trên phiên bản hiện tại. Thử bằng mock không thay thế PostgreSQL, OAuth, SMTP, lưu trữ ảnh hoặc VNPay sandbox; các lỗi cũ cần kiểm tra lại trước khi kết luận còn tồn tại.')
    original=Document(ROOT/'docx/Nhom05_BaoCaoCuoiKy.docx')
    for ti,label in [(61,'Kiểm tra kỹ thuật ở mốc khảo sát'),(62,'Quan sát HTTP ở mốc khảo sát'),(63,'Hành vi nghiệp vụ tái hiện bằng mock ở mốc khảo sát')]:
        t=original.tables[ti]
        table(label,[c.text for c in t.rows[0].cells],[[c.text for c in r.cells] for r in t.rows[1:]],6)
    heading('6.4. Kịch bản kiểm thử và kết quả mong đợi',2)""")
    # Cover spacing: keep within one A4 page, all content uppercase.
    replace("p=para(text);p.alignment=1\n    para();p=para('TP.", "p=para(text.upper());p.alignment=1;p.paragraph_format.space_after=Pt(9)\n    para();p=para('TP.")
    replace("p.paragraph_format.space_after=Pt(18)", "p.paragraph_format.space_after=Pt(20)")
    # Improve database terminology and avoid claiming schema covers all SQL checks.
    replace("if field.endswith('Id'):constraints.append('FK')", "if field in ['hostId','guestId','propertyId','bookingId','discountCodeId','amenityId','userId']:constraints.append('FK')")
    replace("'Nếu trùng: dừng, API trả 409'", "'Đơn giao lịch hoặc không có đơn'")
    replace("'Tính phí 10%, kiểm tra mã giảm'", "'Chỉ lịch trống: tính phí 10%, kiểm tra mã'")
    replace('Cần thay tài nguyên và kiểm tra văn bản thay thế, không chỉnh ảnh để che lỗi trong báo cáo.', 'Cần thay tài nguyên và kiểm tra văn bản thay thế.')
    replace(' Báo cáo này không bổ sung hoặc thay đổi ràng buộc trong ứng dụng.', '')
    # Final typography/pagination pass: no altered content, preserve table headers.
    replace('    d.save(OUT)', '''    for t in d.tables:
        headers=[c.text for c in t.rows[0].cells]
        is_uc=len(t.columns)==2 and len(t.rows)>1 and t.rows[1].cells[0].text=='Use Case ID'
        if is_uc:t._tbl.remove(t.rows[0]._tr)
        if headers==REQ:
            widths=[1.1,2.6,2,4.4,2.4,4]
            for col,w in zip(t.columns,widths):col.width=Cm(w)
            for row in t.rows:
                for c,w in zip(row.cells,widths):c.width=Cm(w)
        if headers==['STT','Loại','Ý nghĩa']:
            widths=[1.2,4,11.3]
            for col,w in zip(t.columns,widths):col.width=Cm(w)
            for row in t.rows:
                for c,w in zip(row.cells,widths):c.width=Cm(w)
        for row in t.rows:
            for cell in row.cells:
                tcPr=cell._tc.get_or_add_tcPr()
                margins=OxmlElement('w:tcMar')
                for side in ['left','right']:
                    node=OxmlElement('w:'+side);node.set(qn('w:w'),'72');node.set(qn('w:type'),'dxa');margins.append(node)
                tcPr.append(margins)
                for p in cell.paragraphs:
                    for r in p.runs:
                        if is_uc:r.font.size=Pt(11.5)
                        elif headers==DICT:r.font.size=Pt(10)
    # Compact the long end lists instead of spilling one last caption alone.
    for p in d.paragraphs:
        if p.text in figures or p.text in tables:
            if p.style.name!='Caption':
                p.paragraph_format.space_after=Pt(2)
                p.paragraph_format.line_spacing=1.0
    d.save(OUT)''')
    namespace = dict(base.__dict__)
    original=Document(PROTECTED[0])
    uc_descriptions=[next(r.cells[1].text for r in t.rows if r.cells[0].text=='Mô tả') for t in original.tables[6:30]]
    namespace.update(OUT=OUT,ASSETS=ASSETS,REQ=REQ,DICT=DICT,ALTERNATIVES=ALTERNATIVES,UC_DESCRIPTIONS=uc_descriptions,
                     logical_notation=logical_notation,relational_graph=relational_graph,
                     events_graph=events_graph,extra_sequences=extra_sequences,focused_usecases=focused_usecases)
    exec(compile(src,str(Path(__file__)), 'exec'),namespace)
    namespace['build']()
    assert hashes() == before, 'Protected input changed'
    manifest=json.loads((ASSETS/'manifest.json').read_text())
    manifest.update(protected_inputs=before,processing_scenarios=SCENARIOS,
                    revision=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),
                    provider_model='openai/gpt-6.1-sol', scout_id='ses_eb6a72673ffe1DeXc0u7R0NM9r',
                    implementer_id='Not exposed by runtime; general role',
                    template_deviation='Điều kiện tiên quyết → Điều kiện sau: sample row contains a successful outcome.')
    (ASSETS/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))


ALTERNATIVES = [
    'A1. Email đã tồn tại: chuyển đăng nhập thay vì tạo tài khoản mới.',
    'A1. Chọn Google; hoàn tất cấp quyền; hệ thống liên kết danh tính và tạo phiên nếu hợp lệ.',
    'A1. Phiên đã hết hạn: trở về trang công khai, không tạo lại phiên.',
    'A1. Chọn thẻ điểm đến ở trang chủ để mở danh sách theo địa điểm.',
    'A1. Bỏ bộ lọc hoặc đổi thứ tự; quay trang đầu và tải lại kết quả.',
    'A1. Ảnh thiếu: dùng ảnh thay thế, vẫn giữ thông tin chỗ ở.',
    'A1. Có lịch trùng: khách chọn khoảng ngày khác rồi kiểm tra lại.',
    'A1. Không dùng mã giảm giá: server tính tổng không giảm; các bước tạo đơn giữ nguyên.',
    'A1. Khách rời cổng thanh toán: tra cứu lại trạng thái server; không tự báo thành công.',
    'A1. Đổi tab trạng thái; tải lại các đơn của cùng người dùng.',
    'A1. Admin tra cứu đơn trong phạm vi quyền quản trị thay cho khách sở hữu.',
    'A1. Đóng hộp thoại xác nhận: giữ nguyên đơn và lịch.',
    'A1. Bỏ nhận xét tùy chọn, chỉ gửi điểm hợp lệ nếu đáp ứng điều kiện đánh giá.',
    'A1. Chưa công bố: lưu bản nháp DRAFT; không hiển thị như tin ACTIVE.',
    'A1. Lưu trữ tin: chuyển INACTIVE thay vì xóa dữ liệu.',
    'A1. Danh sách rỗng: giữ màn hình với thông báo không có đơn.',
    'A1. Đóng xác nhận: chưa ghi quyết định; chỉ áp dụng khi bổ sung duyệt thủ công.',
    'A1. Hủy thao tác từ chối: giữ yêu cầu; chỉ áp dụng khi bổ sung duyệt thủ công.',
    'A1. Không có thanh toán thành công: hiển thị tổng 0, phân biệt lỗi tải.',
    'A1. Hệ thống chưa có giao dịch: KPI 0 nếu truy vấn thành công.',
    'A1. Xóa từ khóa hoặc chọn tất cả trạng thái rồi tải lại trang đầu.',
    'A1. Admin hủy xác nhận khóa: tài khoản giữ trạng thái cũ.',
    'A1. Admin hủy xác nhận mở khóa: tài khoản vẫn LOCKED.',
    'A1. Hủy xác nhận đổi vai trò: giữ nguyên quyền hiện tại.'
]


def check():
    start=time.perf_counter()
    assert OUT.exists(), 'Missing report (4)'
    manifest=json.loads((ASSETS/'manifest.json').read_text())
    assert hashes() == manifest['protected_inputs'], 'Protected inputs changed'
    with ZipFile(OUT) as z:
        assert z.testzip() is None
        for n in z.namelist():
            if n.endswith('.xml'): etree.fromstring(z.read(n))
        xml=z.read('word/document.xml')
        text='\n'.join(etree.fromstring(xml).xpath('//*[local-name()="t"]/text()'))
        for bad in ['nguồn ở','nội dung dựa trên mẫu','AI tạo','prisma/schema','src/','[VERIFY]']:
            assert bad not in text, bad
        assert 'TOC' in xml.decode()
        assert any(b'PAGE' in z.read(n) for n in z.namelist() if re.match(r'word/footer\d.xml$',n))
        assert any(b'STAYHUB' in z.read(n) for n in z.namelist() if re.match(r'word/header\d.xml$',n))
        media=[z.read(n) for n in z.namelist() if n.startswith('word/media/')]
        for p in PROTECTED[-7:]: assert p.read_bytes() in media, p.name
    d=Document(OUT)
    headers=[[c.text for c in t.rows[0].cells] for t in d.tables]
    assert [c.text for c in Document(ROOT/'docx/Template'/TEMPLATES[0]).tables[0].rows[0].cells]==REQ
    supplied_uc=[r.cells[0].text for r in Document(ROOT/'docx/Template'/TEMPLATES[2]).tables[0].rows]
    assert [s.replace('Điều kiện tiên quyết','Điều kiện sau') for s in supplied_uc]==UC_FIELDS
    assert [c.text for c in Document(ROOT/'docx/Template'/TEMPLATES[3]).tables[0].rows[0].cells]==DICT
    assert headers.count(REQ) == 5
    assert headers.count(DICT) == 10
    assert headers.count(['STT','Loại','Ý nghĩa']) == 7
    assert ['Tác nhân','Chức năng'] in headers and ['STT','Chức năng','Mô tả'] in headers
    assert ['Mã số','Mô tả miền giá trị','Thành phần liên quan','Ghi chú'] in headers
    ucs=[t for t in d.tables if len(t.columns)==2 and t.rows[0].cells[0].text=='Use Case ID']
    assert len(ucs)==24, len(ucs)
    for i,t in enumerate(ucs,1):
        assert [r.cells[0].text for r in t.rows] == UC_FIELDS
        assert t.rows[0].cells[1].text==f'UC{i:02d}'
        assert all(r.cells[1].text.strip() for r in t.rows)
    headings=[p.text for p in d.paragraphs if p.style.name.startswith('Heading')]
    assert len([h for h in headings if re.match(r'5\.\d+\. ',h)])==11
    for s in SCENARIOS: assert any(s in h for h in headings), s
    assert text.index('CHƯƠNG 4. THIẾT KẾ GIAO DIỆN') < text.index('CHƯƠNG 5. THIẾT KẾ XỬ LÝ')
    for name,fields in model_fields(): assert name+'(' in text
    image_table=next(t for t in d.tables if any(r.cells[1].text=='publicId' for r in t.rows if len(r.cells)==6))
    assert 'FK' not in next(r.cells[5].text for r in image_table.rows if r.cells[1].text=='publicId')
    for i in range(1,8): assert (ASSETS/f'diagram-events-{i}.png').exists()
    for i in range(1,8): assert (ASSETS/f'diagram-uc-group-{i}.png').exists()
    diagram_paths=[ASSETS/(Path(p).name) for p in manifest['diagram_files']]
    for p in diagram_paths:
        im=Image.open(p).convert('RGB');r,g,b=im.split()
        assert ImageChops.difference(r,g).getbbox() is None and ImageChops.difference(g,b).getbbox() is None,p.name
    assert all(s.width<=Cm(16.5) for s in d.inline_shapes)
    print(json.dumps(dict(result='PASS',seconds=round(time.perf_counter()-start,3),tables=len(d.tables),
                          images=len(d.inline_shapes),use_cases=24,processing_scenarios=10,screenshots=7,
                          diagrams=len(diagram_paths),protected_inputs='unchanged'),ensure_ascii=False))


if __name__=='__main__':
    # The first draft imported the reusable module with bytecode caching on.
    # Clean only that exact generated cache, never discover/delete user files.
    import importlib.util
    cache=Path(importlib.util.cache_from_source(str(Path(__file__).with_name('generate_report_2.py'))))
    cache.unlink(missing_ok=True)
    try:cache.parent.rmdir()
    except (FileNotFoundError,OSError):pass
    if '--check' in sys.argv: check()
    else:
        build()
        # Explicit inventory, only artifacts created by the named drawing helpers.
        m=json.loads((ASSETS/'manifest.json').read_text())
        m['diagram_files']=['diagram-'+n+'.png' for n in ['usecases','logical-core','logical-support','relational-core','relational-support',
            'navigation','navigation-management',*[f'events-{i}' for i in range(1,8)],*[f'uc-group-{i}' for i in range(1,8)],
            'architecture','login','search','detail','booking','ipn','verify','cancel','review','listing','approval','lock']]
        (ASSETS/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2))
        check()
