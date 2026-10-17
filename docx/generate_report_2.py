"""Rebuild only report (2) and its portable diagram assets. Run from any cwd.

Dependencies: python-docx, Pillow; Graphviz dot. --check validates only this report.
Rendering: libreoffice --headless --convert-to pdf --outdir docx <report>.
"""
from pathlib import Path
from io import BytesIO
from zipfile import ZipFile
import hashlib
import json
import re
import subprocess
import sys
import time
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image, ImageDraw, ImageFont
from lxml import etree

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docx/Nhom05_BaoCaoCuoiKy (2).docx'
ASSETS = ROOT / 'docx/report_2_assets'
INPUTS = {
    'Nhom05_BaoCaoCuoiKy.docx': '1f09f0836b6386833605cf2d439b3654302f496e3b605c4b3f1fb276088c68fd',
    'Nhom05_BaoCaoCuoiKy (1).docx': '3d4ad73f7417ee7f1d9188efcc4b139845c928726e4610d1f497a2764777373b',
}
FONT = subprocess.check_output(['fc-match', '-f', '%{file}', 'sans-serif'], text=True).strip()


def check():
    start = time.perf_counter()
    assert OUT.exists(), 'Missing corrected report (2)'
    with ZipFile(OUT) as z:
        assert z.testzip() is None
        for name in z.namelist():
            if name.endswith('.xml'):
                etree.fromstring(z.read(name))
        body = etree.fromstring(z.read('word/document.xml'))
        text = '\n'.join(body.xpath('//*[local-name()="t"]/text()'))
        for title in ['LỜI CẢM ƠN', 'NHẬN XÉT', 'MỤC LỤC', 'THIẾT KẾ DỮ LIỆU', 'THIẾT KẾ GIAO DIỆN', 'THIẾT KẾ XỬ LÝ', 'TÀI LIỆU THAM KHẢO', 'PHÂN CÔNG']:
            assert title in text, title
        for bad in ['nguồn ở', 'nội dung dựa trên mẫu', 'prisma/schema', 'src/', 'AI tạo', '[VERIFY]']:
            assert bad not in text, bad
        assert len([p for p in Document(OUT).paragraphs if p.style.name == 'Heading 2' and re.search(r'UC\d\d –', p.text)]) == 24
        assert text.index('CHƯƠNG 4') < text.index('CHƯƠNG 5')
        assert b'TOC' in z.read('word/document.xml')
        assert any(b'PAGE' in z.read(n) for n in z.namelist() if re.match(r'word/footer\d.xml$', n))
        assert any('STAYHUB' in z.read(n).decode() for n in z.namelist() if re.match(r'word/header\d.xml$', n))
        media = [z.read(n) for n in z.namelist() if n.startswith('word/media/')]
        for i in range(7):
            p = ROOT / 'docs/product' / ('image.png' if i == 0 else f'image-{i}.png')
            assert p.read_bytes() in media, p.name
    for name, expected in INPUTS.items():
        assert hashlib.sha256((ROOT / 'docx' / name).read_bytes()).hexdigest() == expected, name
    for p in ASSETS.glob('diagram-*.png'):
        im = Image.open(p).convert('RGB')
        assert all(r == g == b for r, g, b in im.getdata()), p.name
    d = Document(OUT)
    assert all(shape.width <= Cm(16.5) for shape in d.inline_shapes)
    typed_rows = [tuple(c.text for c in row.cells) for t in d.tables for row in t.rows if len(row.cells) == 4]
    property_type = next(row for row in typed_rows if row[1] == 'PropertyType')
    property_status = next(row for row in typed_rows if row[1] == 'PropertyStatus')
    booking_status = next(row for row in typed_rows if row[1] == 'BookingStatus')
    assert 'Loại hình chỗ ở' in property_type[3]
    assert 'DRAFT' in property_status[2] and 'PENDING' not in property_status[3]
    assert 'PENDING_PAYMENT' in booking_status[2] and 'PENDING.' not in booking_status[3]
    print(json.dumps({'result': 'PASS', 'seconds': round(time.perf_counter()-start, 3), 'tables': len(d.tables), 'images': len(d.inline_shapes), 'input_hashes': 'unchanged', 'checks': 'ZIP/XML, required content, 24 UC, order, TOC/PAGE/header, 7 exact screenshots, monochrome diagrams, image widths'}, ensure_ascii=False))


def graph(name, nodes, edges, direction='TB'):
    dot = ['digraph G {', f'rankdir={direction}; bgcolor="white"; pad=0.2; nodesep=0.35; ranksep=0.55;', 'node [shape=box, style="rounded,filled", fillcolor=white, color=black, fontcolor=black, fontname="DejaVu Sans", fontsize=12, margin="0.15,0.10"];', 'edge [color=black, fontcolor=black, fontname="DejaVu Sans", fontsize=10];']
    for key, label in nodes.items():
        dot.append(f'{key} [label={json.dumps(label, ensure_ascii=False)}];')
    if name == 'usecases':
        dot.append('subgraph cluster_system { label="StayHub"; color=black; discover; auth; book; trip; listing; monitor; admin; }')
        dot.append('v [shape=box]; g [shape=box]; h [shape=box]; a [shape=box];')
        dot.append('discover [shape=ellipse]; auth [shape=ellipse]; book [shape=ellipse]; trip [shape=ellipse]; listing [shape=ellipse]; monitor [shape=ellipse]; admin [shape=ellipse];')
    for a, b, label in edges:
        dot.append(f'{a} -> {b} [label={json.dumps(label, ensure_ascii=False)}];')
    dot.append('}')
    source = ASSETS / f'diagram-{name}.dot'
    source.write_text('\n'.join(dot))
    path = source.with_suffix('.png')
    subprocess.run(['dot', '-Tpng', '-Gdpi=180', str(source), '-o', str(path)], check=True)
    mermaid = ['%%{init: {"theme":"base","themeVariables":{"primaryColor":"#ffffff","primaryTextColor":"#000000","primaryBorderColor":"#000000","lineColor":"#000000","textColor":"#000000","edgeLabelBackground":"#ffffff"}}}%%', f'flowchart {"TD" if direction == "TB" else "LR"}']
    if name == 'usecases':
        mermaid += [f'    {key}["{nodes[key]}"]' for key in ['v','g','h','a']]
        mermaid += ['    subgraph stayhub["StayHub"]']
        mermaid += [f'        {key}(["{nodes[key]}"])' for key in ['discover','auth','book','trip','listing','monitor','admin']]
        mermaid += ['    end']
    else:
        mermaid += [f'    {key}["{label.replace(chr(10), " / ")}"]' for key, label in nodes.items()]
    mermaid += [f'    {a} -->|"{label}"| {b}' if label else f'    {a} --> {b}' for a,b,label in edges]
    source.with_suffix('.mmd').write_text('\n'.join(mermaid)+'\n')
    return path


def sequence(name, actors, events):
    """Raster sequence: exact same actors/messages retained as portable Mermaid."""
    width = 1400
    step = 100
    height = 170 + len(events)*step
    im = Image.new('RGB', (width, height), 'white')
    dr = ImageDraw.Draw(im)
    font = ImageFont.truetype(FONT, 28)
    small = ImageFont.truetype(FONT, 28)
    xs = [150 + i*(width-300)/(len(actors)-1) for i in range(len(actors))]
    for i, actor in enumerate(actors):
        x = xs[i]
        dr.rectangle((x-135, 20, x+135, 88), outline='black', width=3)
        dr.multiline_text((x, 53), actor, font=font, fill='black', anchor='mm', align='center')
        for y in range(95, height-20, 16):
            dr.line((x,y,x,y+8), fill='black', width=2)
    m = ['%%{init: {"theme":"base","themeVariables":{"actorBkg":"#ffffff","actorTextColor":"#000000","actorBorder":"#000000","signalColor":"#000000","signalTextColor":"#000000","noteBkgColor":"#ffffff","noteTextColor":"#000000","noteBorderColor":"#000000"}}}%%', 'sequenceDiagram']
    m += [f'    participant p{i} as {a.replace(chr(10), " ")}' for i,a in enumerate(actors)]
    for j,(a,b,label,ret) in enumerate(events):
        y = 155+j*step
        x1,x2 = xs[a],xs[b]
        label = f'{j+1}. {label}'
        if a == b:
            dr.line((x1,y,x1+90,y,x1+90,y+30,x1,y+30),fill='black',width=3)
            tx=x1+140
        else:
            if ret:
                lo,hi=sorted((int(x1),int(x2)))
                for x in range(lo,hi,18):
                    dr.line((x,y,min(x+10,hi),y),fill='black',width=3)
            else:
                dr.line((x1,y,x2,y),fill='black',width=3)
            sign = 1 if x2>x1 else -1
            dr.polygon([(x2,y),(x2-sign*15,y-8),(x2-sign*15,y+8)],fill='black')
            tx=(x1+x2)/2
        # Keep labels on fixed white surfaces and wrap at a controlled width.
        import textwrap
        lines = '\n'.join(textwrap.wrap(label, width=40))
        box = dr.multiline_textbbox((tx,y-14), lines, font=small, anchor='ms', align='center')
        dr.rectangle((box[0]-6,box[1]-3,box[2]+6,box[3]+3),fill='white')
        dr.multiline_text((tx,y-14),lines,font=small,fill='black',anchor='ms',align='center')
        m.append(f'    p{a}{"-->>" if ret else "->>"}p{b}: {label}')
    path=ASSETS/f'diagram-{name}.png'
    im.save(path)
    path.with_suffix('.mmd').write_text('\n'.join(m)+'\n')
    return path


UC = [
('Đăng ký tài khoản','Khách vãng lai','Chưa có tài khoản với email đăng ký.','Người dùng mở đăng ký; nhập họ tên, email, mật khẩu; gửi yêu cầu. Hệ thống kiểm tra dữ liệu, băm mật khẩu và tạo tài khoản; gửi OTP qua email. Người dùng nhập OTP để xác minh.','Email trùng: yêu cầu đổi email hoặc đăng nhập. OTP sai/hết hạn: không xác minh, cho phép thực hiện lại theo chính sách.','Tạo tài khoản; email chỉ được ghi nhận đã xác minh sau OTP hợp lệ.','Yêu cầu xác thực; cần thử SMTP và OTP trên môi trường tích hợp.'),
('Đăng nhập','Người dùng','Có tài khoản hợp lệ hoặc sử dụng Google.','Người dùng chọn đăng nhập; gửi thông tin xác thực. Hệ thống kiểm tra danh tính, tạo phiên và trả về khu vực được phép.','Sai thông tin hoặc tài khoản bị khóa: từ chối. Với Google, xử lý lỗi hủy cấp quyền và liên kết tài khoản.','Có phiên hợp lệ; không làm thay đổi quyền sở hữu dữ liệu.','Phải kiểm thử đồng bộ ID, vai trò và trạng thái tài khoản trong phiên.'),
('Đăng xuất','Người dùng','Có phiên đang sử dụng.','Người dùng chọn đăng xuất. Hệ thống kết thúc phiên phía trình duyệt và chuyển về trang công khai.','Phiên đã hết hạn: vẫn về trang công khai, không báo thành công cho thao tác cần quyền.','Trình duyệt không còn sử dụng phiên cũ cho yêu cầu tiếp theo.','Yêu cầu chức năng; thu hồi phiên trên các thiết bị khác cần chính sách riêng.'),
('Tìm kiếm chỗ ở','Khách vãng lai / người dùng','Đang ở trang chủ hoặc tìm kiếm.','Nhập địa điểm, ngày ở và số khách; gửi tìm kiếm. Hệ thống lọc chỗ ở ACTIVE, sức chứa và lịch phù hợp; trả danh sách cùng số kết quả.','Không có kết quả: cho phép nới tiêu chí. Lỗi cơ sở dữ liệu phải phân biệt với danh sách rỗng.','Danh sách phù hợp với điều kiện đã chọn.','Trang tìm kiếm đã gọi service; vẫn có nhánh dữ liệu dự phòng khi không có kết quả và thiếu một số bộ lọc.'),
('Lọc và sắp xếp kết quả','Khách vãng lai / người dùng','Có trang tìm kiếm.','Chọn giá tối thiểu/tối đa, loại hình, số phòng ngủ và điểm đánh giá; áp dụng. Chọn thứ tự giá hoặc đánh giá; hệ thống tải lại kết quả, đặt lại trang đầu.','Khoảng giá đảo ngược hoặc tham số không hợp lệ: hiển thị lỗi; không dùng kết quả cũ như kết quả mới.','Tiêu chí được giữ khi chuyển trang.','Service chưa truyền sort xuống truy vấn; nhiều tiện nghi đang được lọc theo phép OR.'),
('Xem chi tiết chỗ ở','Khách vãng lai / người dùng','Có mã chỗ ở.','Chọn thẻ chỗ ở. Hệ thống tải thông tin, ảnh, chủ nhà, sức chứa, mô tả, tiện nghi và giá; khách xem các đánh giá.','Không tìm thấy mã: trả trang không tồn tại; ảnh thiếu: dùng ảnh thay thế.','Hiển thị thông tin chỗ ở được chọn.','Không suy luận chất lượng thực tế từ huy hiệu hay điểm minh họa trên ảnh.'),
('Kiểm tra tình trạng trống','Khách vãng lai / người dùng','Đã chọn chỗ ở và khoảng ngày.','Khách yêu cầu kiểm tra. Hệ thống tìm đơn PENDING_PAYMENT hoặc CONFIRMED giao nhau với khoảng ngày đã chọn và báo kết quả.','Trùng lịch: không cho tạo đơn với lịch đó. Ngày không hợp lệ: yêu cầu sửa trước khi truy vấn.','Kết quả chỉ có giá trị tham khảo tại thời điểm kiểm tra.','Khoảng ngày là [nhận phòng, trả phòng); hai kỳ ở nối tiếp nhau không xung đột.'),
('Đặt phòng','Người dùng đã đăng nhập','Chỗ ở ACTIVE; số khách trong sức chứa; ngày lưu trú hợp lệ.','Khách xác nhận ngày, số khách và mã giảm giá. Server tải giá và kiểm tra lịch; tính lại phí, giảm giá. Trong transaction, tạo Booking và Payment. Sau commit, tạo URL VNPay và trả mã đơn cho khách.','Trùng lịch: trả 409. Lỗi tạo URL sau commit: cần xử lý đơn còn chờ; không khẳng định rollback đã xảy ra.','Booking PENDING_PAYMENT và Payment PENDING được lưu cùng nhau.','Kiểm tra trùng lịch nằm trước transaction, chưa bảo đảm chống đặt trùng khi đồng thời.'),
('Thanh toán VNPay','Người dùng / VNPay','Có Booking và Payment chờ thanh toán.','Khách bấm Confirm & Pay; trình duyệt chuyển sang URL VNPay. VNPay gửi kết quả. Server xác minh và cập nhật giao dịch; khách tra cứu trạng thái đơn.','Sai chữ ký hoặc sai số tiền qua IPN: không cập nhật. Giao dịch thất bại: Payment FAILED, Booking CANCELLED. Callback trùng/muộn cần bảo vệ trạng thái.','Thanh toán thành công hợp lệ dẫn đến Payment SUCCESS và Booking CONFIRMED.','Cả IPN và verify đều có nhánh cập nhật; verify chưa đối chiếu số tiền như IPN.'),
('Xem chuyến đi của tôi','Người dùng đã đăng nhập','Có phiên hợp lệ.','Mở My Trips; chọn Upcoming, Pending, Completed hoặc Cancelled. Hệ thống chỉ truy vấn đơn của người đang đăng nhập và hiển thị thẻ thông tin.','Không có đơn: hiển thị trạng thái rỗng. Lỗi tải: hiện thông báo và nút thử lại.','Danh sách đơn cá nhân theo trạng thái.','Upcoming ánh xạ CONFIRMED, không phải trạng thái PENDING chờ Host duyệt.'),
('Xem chi tiết đơn','Người dùng / Admin','Có mã đơn và quyền xem.','Chọn Details hoặc Xem; hệ thống kiểm tra quyền, tải chỗ ở, lịch, số khách, giá và trạng thái giao dịch; hiển thị thao tác được phép.','Đơn không tồn tại hoặc ngoài quyền: từ chối, không lộ dữ liệu của khách khác.','Không thay đổi dữ liệu khi chỉ xem.','Đường điều hướng là /bookings/{id}; quyền phải được kiểm tra tại server.'),
('Hủy đơn đặt phòng','Khách sở hữu đơn / Admin','Đơn thuộc quyền thao tác, trạng thái PENDING_PAYMENT hoặc CONFIRMED.','Chọn Cancel; xác nhận hủy. Server tải đơn, kiểm tra quyền và trạng thái; cập nhật CANCELLED và thời điểm hủy. Giao diện tải lại danh sách.','Đơn hoàn thành/đã hủy: từ chối. Khách khác: từ chối. Thoát hộp thoại: giữ nguyên đơn.','Booking CANCELLED; lịch không còn bị giữ bởi đơn này.','Hàm hủy không cập nhật Payment và không thực hiện hoàn tiền; chính sách 48 giờ trên UI chưa được thực thi tại đây.'),
('Viết đánh giá','Khách sở hữu đơn','Booking COMPLETED, chưa có Review.','Khách nhập điểm 1–5 và nhận xét. Server kiểm tra đơn, người sở hữu và đánh giá tồn tại; tạo Review, tính trung bình và cập nhật điểm chỗ ở trong transaction.','Không đúng chủ đơn, chưa COMPLETED hoặc đã có Review: không tạo mới.','Tối đa một Review trên mỗi Booking.','Service đã có kiểm tra; chưa xác nhận được cơ chế tự chuyển COMPLETED qua luồng sử dụng bình thường.'),
('Đăng tin chỗ ở','Host / Admin','Có quyền tạo tin và thông tin hợp lệ.','Mở Đăng chỗ ở mới; nhập tên, mô tả, địa chỉ, loại hình, giá và sức chứa. Gửi yêu cầu; server tạo chỗ ở gắn với chủ sở hữu và các tiện nghi.','Thiếu thông tin hoặc giá sai: từ chối. Lỗi quan hệ tiện nghi: không hiển thị đã tạo thành công.','Theo schema, chỗ ở mới mặc định DRAFT.','Service create truyền cả amenityIds trong dữ liệu model, cần sửa và kiểm thử; không khẳng định đã công bố ACTIVE.'),
('Quản lý chỗ ở','Host sở hữu / Admin','Có chỗ ở được quyền quản lý.','Mở danh sách; chọn xem, cập nhật hoặc lưu trữ. Server kiểm tra quyền và dữ liệu, cập nhật nội dung hoặc chuyển INACTIVE; tải lại danh sách và thống kê.','Mã không tồn tại/ngoài quyền: từ chối. Lưu trữ nhầm: cần xác nhận trước thao tác.','Chỉ chỗ ở trong phạm vi quyền được thay đổi.','Lưu trữ là đổi trạng thái, không xóa vật lý; kiểm tra lịch tương lai là yêu cầu cần hoàn thiện.'),
('Theo dõi đơn của Host','Host / Admin trong phạm vi sở hữu','Đã đăng nhập khu vực Host.','Chọn Đơn đặt phòng; hệ thống lấy đơn của các chỗ ở thuộc chủ nhà, hiển thị khách, lịch, số tiền và trạng thái.','Không có đơn: hiển thị rỗng. Lỗi quyền hoặc tải dữ liệu: không hiển thị dữ liệu ngoài phạm vi.','Host theo dõi lịch và tình trạng đơn.','Không có bước Host duyệt bắt buộc trong luồng VNPay hiện tại.'),
('Chấp nhận yêu cầu đặt phòng','Host (mở rộng)','Chỉ áp dụng nếu bổ sung chính sách duyệt thủ công và trạng thái chờ duyệt riêng.','Host chọn yêu cầu; hệ thống kiểm tra quyền, lịch và trạng thái; Host xác nhận; hệ thống lưu quyết định và thông báo khách.','Yêu cầu hết hạn hoặc lịch thay đổi: không xác nhận, chuyển xử lý theo chính sách thanh toán/hoàn tiền đã thống nhất.','Chỉ có hiệu lực khi quy trình duyệt thủ công được bổ sung.','Ngoài MVP; không dùng PENDING_PAYMENT như trạng thái chờ Host, không mô tả API chưa có như đã cài đặt.'),
('Từ chối yêu cầu đặt phòng','Host (mở rộng)','Có quy trình duyệt thủ công và chính sách hoàn tiền tương ứng.','Host mở yêu cầu; chọn từ chối; nhập lý do theo chính sách; hệ thống kiểm tra quyền, lưu quyết định và thông báo khách.','Nếu đã thanh toán: phải xử lý đối soát/hoàn tiền; không chỉ đổi nhãn giao diện.','Quyết định từ chối được lưu khi triển khai phần mở rộng.','Ngoài MVP; schema hiện không có trạng thái REJECTED.'),
('Theo dõi doanh thu Host','Host / Admin trong phạm vi sở hữu','Có phiên hợp lệ ở khu vực Host.','Mở dashboard; server đếm chỗ ở ACTIVE, tổng đơn và cộng amount của Payment SUCCESS thuộc các chỗ ở của Host; hiển thị KPI.','Không có giao dịch: hiển thị 0. Lỗi tải: cần trạng thái lỗi thay vì coi như doanh thu 0.','Số liệu tổng hợp theo dữ liệu hiện có.','Tổng tiền thanh toán không phải tiền thực nhận của Host sau phí, cũng không chứng minh tất toán ngân hàng.'),
('Xem tổng quan hệ thống','Admin','Có quyền ADMIN.','Mở Admin Portal; server đếm tài khoản, Host ACTIVE, đơn tạo trong ngày và cộng Payment SUCCESS; hiển thị bốn KPI.','Không có dữ liệu: hiển thị 0. API từ chối người chưa đăng nhập/không có quyền.','Admin xem thống kê toàn hệ thống.','Nhãn doanh thu sàn đang dùng tổng tiền giao dịch thành công, chưa tách riêng phí dịch vụ.'),
('Tra cứu đơn toàn sàn','Admin','Có quyền ADMIN.','Mở Đơn đặt phòng toàn sàn; nhập mã/tên/email, chọn trạng thái; hệ thống tải trang dữ liệu. Chọn Xem để mở chi tiết đơn.','Không có kết quả: hiện thông báo. Đổi tiêu chí: về trang đầu.','Danh sách đơn theo bộ lọc; không thay đổi trạng thái khi tra cứu.','Giao diện hiện có ô tìm kiếm, bộ chọn trạng thái và phân trang có điều kiện.'),
('Khóa tài khoản','Admin','Tài khoản mục tiêu ACTIVE; không được tự khóa theo yêu cầu nghiệp vụ.','Admin xác định tài khoản và xác nhận khóa; hệ thống kiểm tra quyền, cập nhật LOCKED và ghi nhận thao tác theo chính sách.','Tài khoản không tồn tại hoặc thao tác không được phép: từ chối. Phiên cũ cần được thu hồi hoặc kiểm tra lại trạng thái.','Tài khoản bị khóa không được thực hiện tác vụ cần quyền.','Yêu cầu quản trị; chưa có màn hình quản lý Users trong ảnh Admin hiện tại, cần kiểm thử việc vô hiệu hóa phiên.'),
('Mở khóa tài khoản','Admin','Tài khoản mục tiêu LOCKED và được phép khôi phục.','Admin chọn tài khoản, xác nhận mở khóa; hệ thống kiểm tra quyền và cập nhật ACTIVE. Người dùng đăng nhập lại.','Không tìm thấy tài khoản hoặc không có quyền: từ chối.','Tài khoản ACTIVE, không tự cấp thêm vai trò.','Đặc tả yêu cầu; ảnh dashboard không thể hiện màn hình thao tác này.'),
('Thay đổi vai trò','Admin (mở rộng)','Có chính sách cấp quyền và tài khoản mục tiêu.','Admin chọn vai trò GUEST, HOST hoặc ADMIN; xác nhận. Hệ thống kiểm tra quyền, lưu thay đổi, làm mới/thu hồi phiên và ghi nhật ký.','Tự nâng quyền trái phép hoặc thay đổi ảnh hưởng quản trị cuối cùng: từ chối theo chính sách cần thống nhất.','Vai trò có hiệu lực nhất quán ở giao diện và API.','Chưa xác nhận có luồng triển khai đầy đủ; Super Admin trên UI không phải enum riêng.'),
]


def build():
    ASSETS.mkdir(exist_ok=True)
    old = Document(ROOT / 'docx/Nhom05_BaoCaoCuoiKy (1).docx')
    d = Document()
    sec = d.sections[0]
    sec.page_width,sec.page_height=Cm(21),Cm(29.7)
    sec.top_margin,sec.bottom_margin,sec.left_margin,sec.right_margin=Cm(2),Cm(2),Cm(2.5),Cm(2)
    sec.header_distance=sec.footer_distance=Cm(0.9)
    sec.different_first_page_header_footer=True
    for st in ['Normal','Body Text','List Bullet','Caption','Heading 1','Heading 2','Heading 3']:
        style=d.styles[st]
        style.font.name='Times New Roman'
        style.font.color.rgb=RGBColor(0,0,0)
        style.font.size=Pt(12 if st not in ['Heading 1','Heading 2','Heading 3'] else {'Heading 1':16,'Heading 2':14,'Heading 3':12}[st])
        style.paragraph_format.space_after=Pt(6)
        style.paragraph_format.line_spacing=1.15
    d.styles['Normal'].paragraph_format.widow_control=True
    header=sec.header.paragraphs[0]
    header.text='NHÓM 05  |  CÔNG NGHỆ PHẦN MỀM                                      STAYHUB'
    header.runs[0].font.size=Pt(9)
    p=sec.footer.paragraphs[0];p.alignment=WD_ALIGN_PARAGRAPH.RIGHT
    p.add_run('Trang ')
    field=OxmlElement('w:fldSimple');field.set(qn('w:instr'),'PAGE');p._p.append(field)
    settings=OxmlElement('w:updateFields');settings.set(qn('w:val'),'true');d.settings.element.append(settings)
    counts={};figures=[];tables=[]
    def para(text='',style=None):
        return d.add_paragraph(text,style)
    pending_page = False
    def page():
        nonlocal pending_page
        pending_page = True
    def heading(text,level=1):
        nonlocal pending_page
        p = d.add_heading(text,level)
        if pending_page:
            p.paragraph_format.page_break_before = True
            pending_page = False
        return p
    def table(caption,headers,rows,chapter):
        counts[('t',chapter)]=counts.get(('t',chapter),0)+1
        cap=f'Bảng {chapter}.{counts[("t",chapter)]}. {caption}'
        tables.append(cap); p=para(cap,'Caption');p.paragraph_format.keep_with_next=True
        t=d.add_table(rows=1, cols=len(headers));t.style='Table Grid';t.autofit=False
        widths=([4,12.5] if len(headers)==2 else [4,3,9.5] if len(headers)==3 else [16.5/len(headers)]*len(headers))
        for col,w in zip(t.columns,widths): col.width=Cm(w)
        for c,w,h in zip(t.rows[0].cells,widths,headers):c.width=Cm(w);c.text=h
        for row in rows:
            for c,w,value in zip(t.add_row().cells,widths,row): c.width=Cm(w);c.text=str(value)
        for i,row in enumerate(t.rows):
            trpr=row._tr.get_or_add_trPr();nosplit=OxmlElement('w:cantSplit');trpr.append(nosplit)
            if i==0:
                repeat=OxmlElement('w:tblHeader');trpr.append(repeat)
            for c in row.cells:
                for p in c.paragraphs:
                    p.paragraph_format.space_after=Pt(3);p.paragraph_format.line_spacing=1.05
                    if len(rows) < 10 and i < len(t.rows)-1:
                        p.paragraph_format.keep_with_next=True
                    for r in p.runs:r.font.size=Pt(10.5);r.bold=(i==0)
        return t
    def picture(path,caption,chapter,maxheight=17):
        im=Image.open(path);w,h=im.size
        width=min(16.5,maxheight*w/h)
        p=para();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.keep_with_next=True
        p.add_run().add_picture(str(path),width=Cm(width))
        counts[('f',chapter)]=counts.get(('f',chapter),0)+1
        cap=f'Hình {chapter}.{counts[("f",chapter)]}. {caption}'
        figures.append(cap);p=para(cap,'Caption');p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    def bullets(items):
        for item in items:para(item,'List Bullet')

    # Cover: original school identity retained; no duplicate inner cover.
    for text,size in [('BỘ GIÁO DỤC VÀ ĐÀO TẠO',13),('TRƯỜNG ĐẠI HỌC CÔNG NGHỆ KỸ THUẬT',14),('TP. HỒ CHÍ MINH',14),('KHOA CÔNG NGHỆ THÔNG TIN',14)]:
        p=para();p.alignment=1;r=p.add_run(text);r.bold=True;r.font.size=Pt(size)
    para();para()
    for text,size in [('BÁO CÁO CUỐI KỲ',20),('HỌC PHẦN: CÔNG NGHỆ PHẦN MỀM',15),('ĐỀ TÀI',14),('XÂY DỰNG NỀN TẢNG ĐẶT PHÒNG NGHỈ\nVÀ HOMESTAY TRỰC TUYẾN STAYHUB',18)]:
        p=para();p.alignment=1;p.paragraph_format.space_after=Pt(18);r=p.add_run(text);r.bold=True;r.font.size=Pt(size)
    for text in ['GIẢNG VIÊN HƯỚNG DẪN: THS. NGUYỄN TRẦN THI VĂN','NHÓM THỰC HIỆN: NHÓM 05','HỒ ĐẶNG THÁI DUY – MSSV: 24110179','TRẦN ĐỨC ANH – MSSV: 24110155','MÃ LỚP HỌC PHẦN: 261SOEN330679_07']:
        p=para(text);p.alignment=1
    para();p=para('TP. HỒ CHÍ MINH, THÁNG 10 NĂM 2026');p.alignment=1
    page();heading('NHẬN XÉT CỦA GIẢNG VIÊN HƯỚNG DẪN')
    para('Giảng viên hướng dẫn: ThS. Nguyễn Trần Thi Văn')
    para('Nhóm 05 – Hồ Đặng Thái Duy (24110179), Trần Đức Anh (24110155).')
    para('Học phần: Công nghệ Phần mềm – Lớp 261SOEN330679_07.')
    para('Đề tài: Xây dựng nền tảng đặt phòng nghỉ và homestay trực tuyến StayHub.')
    for title in ['1. Nội dung và phương pháp thực hiện','2. Chất lượng sản phẩm và báo cáo','3. Hạn chế và yêu cầu bổ sung']:
        heading(title,2)
        for _ in range(3):para('................................................................................................................')
    para('Điểm đánh giá: ............................ / 10')
    p=para('TP. Hồ Chí Minh, ngày ...... tháng ...... năm 2026\nGIẢNG VIÊN HƯỚNG DẪN\n(Ký và ghi rõ họ tên)');p.alignment=2
    page();heading('LỜI CẢM ƠN')
    para('Nhóm chúng em xin cảm ơn quý thầy cô Khoa Công nghệ Thông tin đã trang bị kiến thức nền tảng để thực hiện đồ án môn học Công nghệ Phần mềm.')
    para('Nhóm xin gửi lời cảm ơn đến giảng viên hướng dẫn ThS. Nguyễn Trần Thi Văn đã hướng dẫn và góp ý trong quá trình phân tích yêu cầu, thiết kế và trình bày báo cáo StayHub. Những nhận xét của giảng viên giúp nhóm nhìn rõ sự khác biệt giữa yêu cầu nghiệp vụ, thiết kế hệ thống và mức độ hoàn thiện của sản phẩm.')
    para('Nhóm cũng cảm ơn các bạn trong lớp học phần 261SOEN330679_07 đã trao đổi kiến thức và đóng góp ý kiến cho đồ án. Do kinh nghiệm thực tế còn hạn chế, sản phẩm vẫn còn những vấn đề cần tiếp tục kiểm thử và hoàn thiện. Nhóm mong nhận được góp ý để cải thiện trong các giai đoạn tiếp theo.')
    p=para('TP. Hồ Chí Minh, tháng 10 năm 2026\nNhóm sinh viên thực hiện\nHồ Đặng Thái Duy – Trần Đức Anh');p.alignment=2
    page();heading('MỤC LỤC')
    field=OxmlElement('w:fldSimple');field.set(qn('w:instr'),'TOC \\o "1-2" \\h \\z \\u');para()._p.append(field)
    page();heading('DANH MỤC TỪ VIẾT TẮT')
    table('Thuật ngữ sử dụng',['Thuật ngữ','Ý nghĩa'],[
        ('API','Giao diện lập trình ứng dụng.'),('UI/UX','Giao diện và trải nghiệm người dùng.'),('CSDL','Cơ sở dữ liệu.'),('ORM','Ánh xạ đối tượng – quan hệ; dự án sử dụng Prisma.'),('OTP','Mã dùng một lần để xác minh.'),('JWT','JSON Web Token; biểu diễn thông tin phiên bằng token được ký, không mặc nhiên mã hóa nội dung.'),('IPN','Thông báo kết quả giao dịch từ cổng thanh toán đến máy chủ.'),('MVP','Phạm vi sản phẩm khả dụng tối thiểu.'),('PK / FK / UK','Khóa chính / khóa ngoại / khóa duy nhất.'),('HTTPS','HTTP được bảo vệ bằng TLS.')],0)
    page();heading('LỜI GIỚI THIỆU')
    para('StayHub là nền tảng trung gian kết nối người có chỗ ở cho thuê với khách cần lưu trú ngắn hạn. Nền tảng hỗ trợ tìm kiếm, xem thông tin, đặt phòng, thanh toán và theo dõi chuyến đi; chủ nhà quản lý chỗ ở, còn quản trị viên giám sát hoạt động toàn hệ thống.')
    para('Báo cáo trình bày khảo sát nghiệp vụ, mô hình hóa yêu cầu, thiết kế dữ liệu, giao diện và xử lý, sau đó đánh giá mức độ cài đặt. Yêu cầu chức năng mô tả hành vi cần đạt; nhận xét hiện trạng chỉ ghi nhận những gì thể hiện trong mã chương trình và hình giao diện. Các chức năng mở rộng không được xem là đã hoàn thành.')
    para('Ứng dụng sử dụng Next.js 15, React 19, TypeScript và PostgreSQL thông qua Prisma. Các thành phần hỗ trợ gồm Auth.js, Zod, TanStack Query và tích hợp VNPay. Báo cáo không xem ảnh chụp hoặc phân tích tĩnh là bằng chứng thay thế cho thử nghiệm thanh toán và cơ sở dữ liệu thực.')
    page();heading('CHƯƠNG 1. KHẢO SÁT VÀ PHÂN TÍCH YÊU CẦU')
    heading('1.1. Bài toán và phạm vi',2)
    para('Khách thuê cần so sánh vị trí, giá, sức chứa và lịch trống trước khi ra quyết định. Chủ nhà cần cập nhật thông tin và theo dõi các đơn thuộc chỗ ở của mình. Hệ thống phải giữ nhất quán giữa lịch lưu trú, giá đã chốt và kết quả thanh toán; một thông báo thành công trên trình duyệt không đủ để xác nhận giao dịch.')
    para('Phạm vi cốt lõi gồm quản lý tài khoản, tra cứu chỗ ở, đặt phòng – VNPay, chuyến đi, đánh giá và giám sát. Duyệt đơn thủ công, nhắn tin, wishlist, xuất báo cáo và hoàn tiền là phần mở rộng hoặc cần hoàn thiện chính sách. Trong MVP, thanh toán hợp lệ xác nhận đơn trực tiếp, không qua Host Accept/Reject.')
    heading('1.2. Yêu cầu chức năng nghiệp vụ',2)
    para('Mỗi yêu cầu được mô tả bằng công việc, loại xử lý, dữ liệu vào, quy tắc và kết quả. Mã yêu cầu giúp đối chiếu với đặc tả use case và kế hoạch kiểm thử.')
    reqs=[
        ('NV01','Tài khoản','Lưu trữ','Họ tên, email, mật khẩu, OTP','Email duy nhất; mật khẩu băm; xác minh có thời hạn','Tài khoản và trạng thái xác minh'),
        ('NV02','Tìm chỗ ở','Tra cứu','Địa điểm, ngày, số khách, bộ lọc','Chỉ ACTIVE; đủ sức chứa; không giao lịch giữ chỗ','Danh sách và số kết quả'),
        ('NV03','Xem chi tiết','Tra cứu','Mã chỗ ở','Hiển thị ảnh, mô tả, giá, tiện nghi, đánh giá','Thông tin để khách lựa chọn'),
        ('NV04','Kiểm tra lịch','Tính toán','Chỗ ở, nhận/trả phòng','a.nhận < b.trả và a.trả > b.nhận; bỏ đơn CANCELLED','Còn trống hoặc xung đột'),
        ('NV05','Tính giá','Tính toán','Giá đêm, số đêm, phí, mã giảm','Phí dịch vụ = làm tròn 10% tiền phòng; server tính lại','Bảng chi phí và giá chốt'),
        ('NV06','Tạo đơn','Lưu trữ','Khách, chỗ ở, lịch, số khách','Booking và Payment tạo cùng transaction','PENDING_PAYMENT / PENDING'),
        ('NV07','Thanh toán','Tính toán / lưu trữ','Tham chiếu, chữ ký, tiền, mã kết quả','Kiểm tra chữ ký và số tiền; chống lặp và callback muộn','SUCCESS/FAILED và trạng thái đơn'),
        ('NV08','Hủy đơn','Lưu trữ','Mã đơn, người yêu cầu','Đúng quyền; chỉ PENDING_PAYMENT hoặc CONFIRMED','CANCELLED; hoàn tiền tách riêng'),
        ('NV09','Đánh giá','Lưu trữ','Mã đơn, điểm 1–5, nhận xét','Đúng khách; COMPLETED; một đánh giá mỗi đơn','Review và điểm trung bình'),
        ('NV10','Quản lý chỗ ở','Lưu trữ','Mô tả, địa chỉ, giá, sức chứa, tiện nghi, ảnh','Host sở hữu hoặc Admin; phân biệt DRAFT/ACTIVE/INACTIVE','Tin và danh sách được cập nhật'),
        ('NV11','Theo dõi Host','Tra cứu / tổng hợp','Host đang đăng nhập','Giới hạn theo hostId của chỗ ở','Đơn, số chỗ ở, tổng tiền thành công'),
        ('NV12','Quản trị','Tra cứu / lưu trữ','Bộ lọc đơn, tài khoản mục tiêu','Chỉ Admin; tách quản trị tài khoản với thống kê','Đơn toàn sàn và trạng thái tài khoản'),
    ]
    for i in range(0,len(reqs),4):
        table('Danh mục yêu cầu nghiệp vụ',['Mã / Công việc','Loại / Dữ liệu vào','Quy tắc','Kết quả'],[(a+'\n'+b,c+'\n'+v,r,o) for a,b,c,v,r,o in reqs[i:i+4]],1)
    heading('1.3. Biểu mẫu nghiệp vụ và phân quyền',2)
    table('Thông tin cần ghi nhận theo công việc',['Biểu mẫu','Nội dung'],[('Đăng ký','Họ tên, email, mật khẩu và xác minh OTP; không lưu mật khẩu dạng rõ.'),('Tin chỗ ở','Tên, mô tả, loại hình, thành phố, địa chỉ, giá đêm, phí dọn dẹp, sức chứa, số phòng/giường/tắm, ảnh và tiện nghi.'),('Xác nhận đặt phòng','Chỗ ở, ngày nhận/trả, số khách, khách đăng nhập, mã giảm giá và bảng tiền.'),('Thanh toán','Mã đơn/tham chiếu, số tiền, phương thức, trạng thái, mã giao dịch và thời điểm thanh toán.'),('Đánh giá','Đơn đã hoàn thành, người viết, chỗ ở, điểm và nội dung nhận xét.')],1)
    table('Quyền theo tác nhân',['Tác nhân','Phạm vi'],[('Vãng lai','Trang chủ, tìm kiếm, chi tiết, đăng ký và đăng nhập.'),('Người dùng đăng nhập','Đặt phòng, xem và hủy đơn của mình; đánh giá đúng điều kiện.'),('Host','Quản lý chỗ ở thuộc sở hữu; theo dõi đơn và số liệu liên quan.'),('Admin','Tra cứu toàn sàn và thao tác quản trị được cho phép. Nhãn Super Admin không tạo một vai trò dữ liệu mới.')],1)
    heading('1.4. Yêu cầu phi chức năng',2)
    table('Mục tiêu chất lượng và cách nghiệm thu',['Yêu cầu','Tiêu chí đánh giá'],[('Toàn vẹn','Không chốt hai đơn giao lịch; callback lặp không tăng lượt mã giảm giá lần hai; hủy không bị callback muộn xác nhận lại.'),('Bảo mật','Kiểm tra phiên, vai trò và sở hữu tại server; không lộ dữ liệu mật; xác minh thanh toán và thu hồi quyền khi khóa tài khoản.'),('Tiện dụng','Giữ tiêu chí tìm kiếm, phản hồi rõ khi tải/lỗi/rỗng; xác nhận trước thao tác hủy; phân biệt chờ thanh toán với chờ duyệt.'),('Hiệu năng','Mục tiêu dưới 2 giây với 100 người dùng đồng thời cần đo tải trong môi trường xác định; chưa có kết quả nghiệm thu.'),('Tương thích và tiếp cận','Kiểm tra bố cục desktop/mobile, bàn phím, nhãn trường và tương phản; chưa kết luận đạt WCAG hay mọi trình duyệt.'),('Bảo trì','Tách Route Handler, service và truy cập dữ liệu; tái sử dụng schema kiểm tra đầu vào và quy tắc tính tiền.')],1)
    heading('1.5. Quy trình tác nghiệp',2)
    bullets(['Khách: tìm kiếm → xem chi tiết → kiểm tra ngày → xác nhận chi phí → tạo đơn → VNPay → tra cứu chuyến đi.','Host: đăng nhập → quản lý danh sách chỗ ở → xem đơn và số liệu thuộc sở hữu.','Admin: đăng nhập → xem KPI → tìm/lọc đơn → tra cứu chi tiết để giám sát và đối soát.'])

    page();heading('CHƯƠNG 2. MÔ HÌNH HÓA YÊU CẦU')
    heading('2.1. Tác nhân và mục tiêu',2)
    picture(graph('usecases',{'v':'Khách vãng lai','g':'Người dùng đăng nhập','h':'Host','a':'Admin','discover':'Tìm kiếm và xem chỗ ở','auth':'Đăng ký / đăng nhập','book':'Đặt phòng và VNPay','trip':'Quản lý chuyến đi / đánh giá','listing':'Quản lý chỗ ở thuộc sở hữu','monitor':'Theo dõi đơn và KPI Host','admin':'Giám sát đơn và tài khoản'},[('v','discover',''),('v','auth',''),('g','book',''),('g','trip',''),('h','listing',''),('h','monitor',''),('a','admin','')],'LR'),'Tác nhân và mục tiêu cốt lõi',2,13)
    para('Các đường nối biểu diễn mục tiêu sử dụng, không phải lời gọi API. Host và Admin vẫn có thể sử dụng các chức năng công khai. VNPay là tác nhân hệ thống bên ngoài trong nghiệp vụ thanh toán. Duyệt đơn thủ công không nằm trong sơ đồ MVP.')
    heading('2.2. Danh mục use case và truy vết',2)
    table('Use case theo nhóm nghiệp vụ',['Nhóm yêu cầu','Use case'],[('NV01','UC01–UC03: đăng ký, đăng nhập, đăng xuất.'),('NV02–NV04','UC04–UC07: tìm kiếm, lọc/sắp xếp, chi tiết, kiểm tra lịch.'),('NV05–NV08','UC08–UC12: đặt phòng, thanh toán, danh sách/chi tiết đơn và hủy.'),('NV09','UC13: đánh giá sau hoàn thành.'),('NV10–NV11','UC14–UC16, UC19: tạo/quản lý chỗ ở, theo dõi đơn và doanh thu Host.'),('NV12','UC20–UC23: tổng quan, đơn toàn sàn, khóa/mở khóa.'),('Mở rộng','UC17–UC18: duyệt thủ công; UC24: đổi vai trò và đồng bộ phiên.')],2)
    heading('2.3. Đặc tả use case',2)
    para('Đặc tả dùng thống nhất mục tiêu, tác nhân, kích hoạt, tiền điều kiện, luồng chính, thay thế/ngoại lệ, hậu điều kiện và ghi chú hiện trạng. Tiền điều kiện là điều kiện trước khi bắt đầu; hậu điều kiện là kết quả sau khi thực hiện, không dùng hai khái niệm thay thế cho nhau.')
    for i,(name,actor,pre,main,edge,post,note) in enumerate(UC,1):
        if i % 2 == 1: page()
        heading(f'2.3.{i}. UC{i:02d} – {name}',2)
        table(f'Đặc tả {name.lower()}',['Thành phần','Nội dung'],[('Mục tiêu',name+'.'),('Tác nhân',actor),('Kích hoạt','Tác nhân chọn chức năng '+name.lower()+'.'),('Tiền điều kiện',pre),('Luồng chính','\n'.join(f'{j+1}. {s.strip()}.' for j,s in enumerate(main.rstrip('.').split('. ')))),('Thay thế / ngoại lệ',edge),('Hậu điều kiện',post),('Quy tắc / hiện trạng',note)],2)

    page();heading('CHƯƠNG 3. THIẾT KẾ DỮ LIỆU')
    heading('3.1. Mô hình dữ liệu logic',2)
    para('Mô hình logic xác định các thực thể, định danh và quan hệ nghiệp vụ độc lập với bố trí giao diện hay thứ tự xử lý. Tài khoản đóng vai trò người sở hữu chỗ ở, khách đặt phòng và người viết đánh giá. Đơn đặt phòng lưu giá tại thời điểm giao dịch; thay đổi giá chỗ ở sau này không làm thay đổi giá đã chốt của đơn.')
    picture(graph('logical-core',{'u':'Người dùng\nĐịnh danh: id; email duy nhất','p':'Chỗ ở\nĐịnh danh: id; giá, sức chứa','b':'Đơn đặt phòng\nĐịnh danh: id; lịch, giá chốt','pay':'Thanh toán\nĐịnh danh: id; tham chiếu duy nhất','r':'Đánh giá\nĐịnh danh: id; điểm, nhận xét','disc':'Mã giảm giá\nĐịnh danh: id; code duy nhất'},[('u','p','1 chủ — 0..n chỗ ở'),('u','b','1 khách — 0..n đơn'),('p','b','1 chỗ ở — 0..n đơn'),('b','pay','1 đơn — 0..1 thanh toán'),('b','r','1 đơn — 0..1 đánh giá'),('disc','b','0..1 mã / đơn; 0..n đơn / mã')]),'Mô hình logic lõi: thực thể, định danh và bội số',3,15)
    para('Mỗi thanh toán và đánh giá bắt buộc thuộc đúng một đơn. Review còn tham chiếu trực tiếp đến chỗ ở và khách; các tham chiếu này phải khớp với đơn tương ứng. Một Booking có thể chưa có Payment ở mức mô hình, dù luồng tạo đơn hiện tạo cả hai cùng transaction.')
    picture(graph('logical-support',{'u':'Người dùng','tok':'Mã xác minh\nid, hạn dùng, thời điểm sử dụng','p':'Chỗ ở','img':'Ảnh chỗ ở\nid, thứ tự, ảnh bìa','pa':'Gán tiện nghi\nKhóa: (propertyId, amenityId)','a':'Tiện nghi\nid, tên duy nhất'},[('u','tok','1 — 0..n'),('p','img','1 — 0..n'),('p','pa','1 — 0..n'),('a','pa','1 — 0..n')]),'Mô hình logic dữ liệu bổ trợ',3,12)
    para('Chỗ ở và tiện nghi có quan hệ nhiều–nhiều, được giải bằng thực thể kết hợp Gán tiện nghi. Mỗi ảnh thuộc đúng một chỗ ở; thứ tự ảnh không trùng trong cùng chỗ ở. Mã xác minh thuộc một tài khoản và không lưu OTP dạng rõ.')
    heading('3.2. Ánh xạ quan hệ và bội số',2)
    relations=[('User','Property','hostId','1 → 0..n'),('User','Booking','guestId','1 → 0..n'),('User','Review','guestId','1 → 0..n'),('User','VerificationToken','userId','1 → 0..n'),('Property','Booking','propertyId','1 → 0..n'),('Property','Review','propertyId','1 → 0..n'),('Property','PropertyImage','propertyId','1 → 0..n'),('Property','PropertyAmenity','propertyId','1 → 0..n'),('Amenity','PropertyAmenity','amenityId','1 → 0..n'),('DiscountCode','Booking','discountCodeId (tùy chọn)','0..1 → 0..n'),('Booking','Payment','bookingId duy nhất','1 → 0..1'),('Booking','Review','bookingId duy nhất','1 → 0..1')]
    table('Quan hệ được ánh xạ bằng khóa ngoại',['Thực thể cha','Thực thể con','Khóa ngoại','Bội số'],relations,3)
    para('Với quan hệ mã giảm giá, mỗi đơn có 0 hoặc 1 mã, mỗi mã có thể được dùng bởi 0 đến nhiều đơn. Bội số tối thiểu 0 ở phía tập con có nghĩa bản ghi cha có thể tồn tại trước khi phát sinh bản ghi con.')
    heading('3.3. Trạng thái và kiểu liệt kê',2)
    schema=(ROOT/'prisma/schema.prisma').read_text()
    enums=re.findall(r'enum (\w+) \{([^}]+)\}',schema)
    table('Các miền trạng thái và phân loại',['Kiểu','Giá trị'],[(name,', '.join(body.split())) for name,body in enums],3)
    para('PENDING_PAYMENT là chờ thanh toán, không phải chờ Host phê duyệt. MOMO và MOCK chỉ xuất hiện trong miền phương thức, không đủ để kết luận có tích hợp vận hành. Trạng thái EXPIRED hoặc REFUNDED không chứng minh đã có tác vụ hết hạn hay hoàn tiền.')
    page();heading('3.4. Từ điển dữ liệu',2)
    descriptions={}
    dictionary_models = ['User','Property','Booking','DiscountCode','Payment','Review','PropertyImage','Amenity','PropertyAmenity','VerificationToken']
    for dictionary_model,t in zip(dictionary_models,old.tables[36:46]):
        for row in t.rows[1:]:
            values=[c.text for c in row.cells]
            if len(values)==4:descriptions[(dictionary_model,values[1])]=values[3]
    desc={'id':'Định danh bản ghi; giá trị CUID được Prisma tạo theo cấu hình.', 'propertyId':'Chỗ ở liên quan.', 'guestId':'Người dùng đặt đơn hoặc viết đánh giá.', 'hostId':'Người dùng sở hữu chỗ ở.', 'bookingId':'Đơn đặt phòng liên quan.', 'providerTxnRef':'Tham chiếu giao dịch nhà cung cấp, có thể rỗng và duy nhất khi có giá trị.', 'providerTransactionNo':'Mã giao dịch do nhà cung cấp trả về.', 'rawResponse':'Phản hồi giao dịch dạng JSON.', 'discountCodeId':'Mã giảm giá đã áp dụng; có thể rỗng.'}
    models=re.findall(r'model (\w+) \{(.*?)\n\}',schema,re.S)
    names={name for name,_ in models}
    for i,(name,body) in enumerate(models,1):
        if i in [2,3,4,5,6,9]: page()
        heading(f'3.4.{i}. Thực thể {name}',2)
        mapping=re.search(r'@@map\("([^"]+)"\)',body)
        p=para('Quan hệ lưu trữ: '+mapping.group(1)+'. Các thuộc tính liên kết đối tượng được trình bày trong bảng quan hệ, không được tính là cột dữ liệu.')
        p.paragraph_format.keep_with_next=True
        rows=[]
        for line in body.splitlines():
            tokens=line.strip().split()
            if len(tokens)<2 or tokens[0].startswith('@@') or tokens[1].rstrip('?[]') in names:continue
            field,typ=tokens[:2];rest=' '.join(tokens[2:])
            constraints=[]
            if '@id' in rest:constraints.append('PK')
            if '@unique' in rest:constraints.append('UK')
            constraints.append('NULL' if typ.endswith('?') else 'NOT NULL')
            default=re.search(r'@default\((cuid\(\)|now\(\)|"[^"]*"|[^()]*)\)',rest)
            if default:constraints.append('Mặc định '+default.group(1))
            if field.endswith('Id'):constraints.append('FK')
            detail=desc.get(field,descriptions.get((name,field),'Thuộc tính của '+name+'.'))
            detail=re.sub(r'^(Không rỗng[^.]*\.|Có thể rỗng\.)\s*','',detail)
            detail=re.sub(r'\b[Mm]ặc định\s+[^.]+\.\s*','',detail).strip()
            dbtype=re.search(r'@db\.(Decimal\([^)]*\)|Date)',rest)
            if dbtype:typ=dbtype.group(1)+('?' if typ.endswith('?') else '')
            rows.append((field,typ, '; '.join(constraints),detail))
        table('Thuộc tính '+name,['Thuộc tính','Kiểu Prisma','Ràng buộc','Ý nghĩa'],rows,3)
        if name=='PropertyAmenity':para('Khóa chính ghép (propertyId, amenityId), đồng thời mỗi thành phần là khóa ngoại. Không có cột id riêng.')
        if name=='PropertyImage':para('Cặp (propertyId, displayOrder) duy nhất. Quy tắc tối đa một ảnh bìa cho một chỗ ở phải được kiểm tra riêng; không suy ra từ kiểu Boolean.')
        if name=='Booking':para('Chỉ mục (propertyId, checkInDate, checkOutDate) giúp tra lịch, không phải ràng buộc loại trừ khoảng ngày giao nhau.')
        if name=='Payment':para('bookingId duy nhất tạo quan hệ tối đa một Payment mỗi Booking. Thiết kế này chưa mô hình hóa lịch sử nhiều lần thanh toán như các bản ghi độc lập.')
    page();heading('3.5. Ràng buộc toàn vẹn và tầng thực thi',2)
    table('Ràng buộc và tầm ảnh hưởng',['Nhóm','Điều kiện','Thao tác phải kiểm tra','Tầng / giới hạn'],[
        ('Khóa chính','id duy nhất; khóa ghép cho gán tiện nghi','Thêm; sửa khóa','Prisma / CSDL. CUID không phải hàm mặc định có sẵn của PostgreSQL.'),('Khóa ngoại','Bản ghi cha phải tồn tại','Thêm/sửa FK; xóa/sửa cha','Quan hệ schema. Cascade được khai báo cho Payment/Review theo Booking, ảnh/gán tiện nghi theo Property, token theo User.'),('Duy nhất','email, code, tên tiện nghi, bookingId của Payment/Review, tham chiếu; thứ tự ảnh trong chỗ ở','Thêm; sửa thuộc tính khóa','@unique, @@unique hoặc khóa ghép.'),('Miền giá trị','Enum hợp lệ; số khách dương; điểm 1–5; tiền không âm','Thêm; sửa dữ liệu','Enum/kiểu không thay thế mọi kiểm tra ngữ nghĩa; API/service cần kiểm tra.'),('Ngày lưu trú','checkOut > checkIn; khoảng [checkIn, checkOut)','Thêm/sửa ngày','Route hiện chỉ nhận chuỗi ngày; cần xác thực ngày hợp lệ và thứ tự ngày, không dựa vào Math.max(1, ...).'),('Giá','Tiền phòng = giá đêm × số đêm; tổng trước giảm = tiền phòng + dọn dẹp + dịch vụ','Thêm đơn; đổi thành phần tiền','Server tính snapshot; không tin tổng tiền client gửi lên.'),('Lịch','Không giao lịch với PENDING_PAYMENT/CONFIRMED','Thêm/sửa lịch/trạng thái','Kiểm tra hiện nằm ngoài transaction; cần khóa hoặc ràng buộc phù hợp cho đồng thời.'),('Thanh toán','amount khớp đơn; callback không được làm sai trạng thái','Cập nhật thanh toán/đơn','IPN kiểm tra chữ ký và tiền; verify chỉ kiểm tra chữ ký. Chống lặp chưa nguyên tử.'),('Đánh giá','Đúng khách, đúng chỗ ở, đơn COMPLETED và chưa có Review','Thêm Review; đổi trạng thái đơn','Service kiểm tra và transaction cập nhật điểm; unique bookingId chặn đánh giá trùng.')],3)
    para('Không coi toàn bộ quy tắc nghiệp vụ là CHECK constraint đã cài đặt chỉ vì được nêu trong thiết kế. Các ràng buộc ngoài schema phải được kiểm chứng bằng migration và thử nghiệm CSDL trước khi nghiệm thu. Báo cáo này không bổ sung hoặc thay đổi ràng buộc trong ứng dụng.')

    page();heading('CHƯƠNG 4. THIẾT KẾ GIAO DIỆN')
    heading('4.1. Nguyên tắc trình bày và phạm vi',2)
    para('Bảy màn hình được phân tích theo mục đích, bố cục, đối tượng dữ liệu/điều khiển, biến cố, kiểm tra hợp lệ và phản hồi. Ảnh là trạng thái tại thời điểm chụp, không phải biên bản nghiệm thu. Các con số trên dashboard không được dùng như số liệu đánh giá hiệu năng hoặc kết quả kinh doanh thực tế.')
    para('Các ảnh hiện dùng điểm nhấn hồng đỏ, nền sáng, thẻ bo góc và thanh điều hướng StayHub. Màu giao diện được giữ nguyên trong ảnh; mọi sơ đồ phân tích dùng chữ, khung và mũi tên đen trên nền trắng. Nội dung song ngữ cần thống nhất khi hoàn thiện sản phẩm.')
    heading('4.2. Luân chuyển màn hình',2)
    picture(graph('navigation',{'home':'Trang chủ /','search':'Tìm kiếm /search','detail':'Chi tiết /properties/{id}','login':'Đăng nhập','book':'Xác nhận /properties/{id}/book','vnpay':'VNPay (ngoài ứng dụng)','trips':'My Trips /bookings','bd':'Chi tiết đơn /bookings/{id}'},[('home','search','Search / điểm đến'),('search','detail','Chọn thẻ'),('detail','book','Reserve; yêu cầu phiên hợp lệ'),('book','login','API từ chối nếu thiếu phiên'),('book','vnpay','URL từ server'),('trips','bd','Details'),('trips','detail','Tên chỗ ở'),('trips','search','Explore stays')]),'Điều hướng khách; luồng trả kết quả thanh toán được xử lý riêng',4,16)
    para('Sau khi VNPay trả kết quả, màn hình kết quả phải xác minh và cho phép khách tra cứu trạng thái đơn; không nối trực tiếp một mũi tên “thanh toán xong = thành công”. Đăng nhập là điều kiện nghiệp vụ, cần kiểm tra tại API; sơ đồ không khẳng định middleware bảo vệ mọi biến thể đường dẫn.')
    picture(graph('navigation-management',{'host':'/host','hp':'Chỗ ở của tôi\n(trạng thái nội bộ trang)','hb':'Đơn đặt phòng Host\n(trạng thái nội bộ trang)','modal':'Hộp thoại đăng chỗ ở','pd':'/properties/{id}','admin':'/admin','ab':'Đơn toàn sàn\n(trạng thái nội bộ trang)','bd':'/bookings/{id}'},[('host','hp','Chọn menu'),('host','hb','Chọn menu'),('host','modal','Đăng mới / Thêm mới'),('hp','pd','Xem'),('admin','ab','Chọn menu'),('ab','bd','Xem')]),'Điều hướng quản lý: phân biệt URL, tab và hộp thoại',4,13)
    para('Host hiện có ba mục Tổng quan, Chỗ ở của tôi và Đơn đặt phòng. Admin có Tổng quan hệ thống và Đơn đặt phòng toàn sàn. Các mục này đổi trạng thái hiển thị trong cùng trang, không phải các URL con riêng. Messages, Revenue, Reports và Export không xuất hiện trong phạm vi giao diện được phân tích.')

    screens=[
        ('Trang chủ','Giúp khách chọn điểm đến và bắt đầu tìm chỗ ở. Header có logo và thanh tìm kiếm rút gọn; hero có thông điệp tiếng Việt cùng biểu mẫu tìm kiếm. Bên dưới là sáu thẻ điểm đến, trong đó có Phú Quốc.',[
            ('Destination','Ô nhập địa điểm','Địa điểm cần tìm; không mô tả như combobox nếu chưa có bằng chứng danh sách gợi ý.'),('Check-in / Check-out','Trường ngày','Ngày nhận và trả phòng; cần ngày trả lớn hơn ngày nhận.'),('Guests','Bộ chọn số','Số khách dương; ảnh hiển thị 2 adults.'),('Search','Nút gửi','Chuyển sang kết quả với tiêu chí đã chọn.'),('Điểm đến nổi bật','Thẻ liên kết','Chọn nhanh địa điểm; số chỗ ở trên thẻ không phải kết quả đo.'),('Logo / tài khoản','Điều hướng','Quay trang chủ hoặc mở các tác vụ tài khoản.')],
            [('Nhấn Search','Đọc địa điểm, ngày, khách; chuyển tìm kiếm; giữ tiêu chí để chỉnh sửa.'),('Chọn điểm đến','Mở kết quả theo địa điểm đã chọn.'),('Thiếu / sai ngày','Cần báo rõ lỗi trước khi đặt, không tự coi một đêm là lịch hợp lệ.')],
            'Ảnh có một ảnh điểm đến Hồ Chí Minh tải lỗi và một số hình không khớp tên địa điểm. Cần thay tài nguyên và kiểm tra văn bản thay thế, không chỉnh ảnh để che lỗi trong báo cáo.'),
        ('Kết quả tìm kiếm','Bố cục hai cột: bộ lọc ở trái và lưới thẻ ba cột ở phải. Tiêu đề báo 8 kết quả; ảnh chỉ chứa phần danh sách đang nhìn thấy, không có nghĩa toàn bộ kết quả đều nằm trong khung ảnh.',[
            ('Khoảng giá','Hai ô số VND','Tối thiểu/tối đa theo đêm; phải không âm và có thứ tự hợp lệ.'),('Loại hình chỗ ở','Nhóm chọn một','Sáu loại: căn hộ, villa, nhà, homestay, phòng khách sạn, resort.'),('Số phòng ngủ','Nhóm nút','Bất kỳ, 1, 2, 3+; biểu diễn ngưỡng tối thiểu.'),('Đánh giá trung bình','Nhóm nút','Tất cả, 4.0+, 4.5+.'),('Áp dụng bộ lọc','Nút','Gửi tiêu chí và tải danh sách phù hợp.'),('Sắp xếp','Liên kết lựa chọn','Phù hợp, giá tăng dần, đánh giá cao.'),('Thẻ chỗ ở','Ảnh / thông tin / link','Tên, loại, địa điểm, sức chứa, điểm, giá và nút tim.')],
            [('Áp dụng bộ lọc','Đặt lại trang đầu; giữ các tiêu chí còn lại trong URL.'),('Đổi sắp xếp','Giao diện đổi tham số sort; service hiện chưa dùng sort cho orderBy.'),('Không có kết quả / lỗi DB','Cần phân biệt rỗng thật với lỗi; trang còn nhánh fallback dữ liệu mẫu khi thiếu một số điều kiện.')],
            'Ảnh có lớp thông báo công cụ chụp ở mép trên. Nội dung “Hủy miễn phí trong 48h” trên thẻ không chứng minh service đã kiểm tra chính sách này.'),
        ('Chi tiết chỗ ở','Ảnh thể hiện Luxury Oceanfront Horizon Villa Mỹ Khê. Gallery đang hiển thị hai ảnh cạnh nhau, không phải cấu trúc cố định một ảnh lớn và bốn ảnh nhỏ. Phần dưới có chủ nhà, mô tả, tiện nghi và khu vực đánh giá; thẻ đặt phòng ở bên phải.',[
            ('Tiêu đề / metadata','Văn bản','Tên, điểm, số đánh giá, địa chỉ, loại VILLA.'),('Gallery','Ảnh','Ảnh chỗ ở đã cung cấp; số lượng phụ thuộc dữ liệu.'),('Thông tin chủ nhà','Văn bản','Chủ nhà, tối đa 6 khách, 3 phòng ngủ, 4 giường, 3 phòng tắm trong ảnh.'),('Ngày nhận / trả','Trường ngày','Ảnh: 18/10/2026 đến 21/10/2026.'),('Số khách','Nút tăng/giảm','Không thấp hơn 1 và không vượt maxGuests.'),('Kiểm tra tình trạng trống','Nút','Yêu cầu kiểm tra lịch hiện tại.'),('Reserve','Nút','Chuyển trang xác nhận với lịch và số khách.'),('Chi phí','Văn bản tính toán','2.850.000 × 3 + 250.000 + 855.000 = 9.655.000 đồng.')],
            [('Đổi lịch hoặc số khách','Tính lại giá hiển thị; kiểm tra lại sức chứa và thứ tự ngày.'),('Kiểm tra lịch','Thông báo còn trống hoặc xung đột, không giữ lịch vĩnh viễn chỉ bằng thao tác này.'),('Reserve','Tiếp tục đặt phòng; server vẫn phải kiểm tra lại giá và lịch trước khi ghi đơn.')],
            'Ảnh có điểm 5.0 nhưng 0 đánh giá. Cần quy tắc hiển thị nhất quán khi chưa có Review; không kết luận điểm này được tính từ khách đã lưu trú. StayCover là nội dung UI, chưa phải dịch vụ bảo hiểm đã được kiểm chứng.'),
        ('Xác nhận và thanh toán','Bố cục hai cột: thông tin tài khoản, phương thức và chính sách ở trái; tóm tắt chỗ ở, lịch, voucher và tiền ở phải. Nút Confirm & Pay hiển thị tổng tiền; không có ô số điện thoại trong ảnh.',[
            ('Full name / Receipt email','Trường chỉ đọc','Đồng bộ từ session; không phải biểu mẫu sửa hồ sơ.'),('VNPay QR / Banking app','Radio','Lựa chọn mặc định trong giao diện.'),('Domestic ATM / International card','Radio','Lựa chọn trạng thái client; hiện chưa gửi lựa chọn này trong payload tạo đơn.'),('Promo code / Apply','Ô nhập / nút','Nhập mã, kiểm tra server; hiển thị lỗi hoặc số tiền giảm.'),('Booking summary','Văn bản','Ảnh, tên, địa chỉ, ngày, số đêm và khách.'),('Price breakdown','Văn bản tính toán','Tiền phòng, phí dọn dẹp, phí 10%, giảm giá và tổng.'),('Confirm & Pay','Nút bất đồng bộ','POST tạo booking; chuyển trình duyệt sang vnpayUrl do server trả.')],
            [('Apply mã rỗng','Hiển thị yêu cầu nhập mã; không gửi như mã hợp lệ.'),('Confirm & Pay','Khóa nút khi gửi; lỗi tạo đơn hoặc thiếu URL thì hiện thông báo, không báo đã thanh toán.'),('Thanh toán thành công','Phải dựa trạng thái server đã xác minh; không suy ra từ URL trả về hoặc ảnh.')],
            'Checkout gọi API đặt phòng và chuyển trình duyệt sang VNPay. Chính sách hủy 48 giờ trên UI chưa có kiểm tra tương ứng trong cancelBooking.'),
        ('Chuyến đi của tôi','Trang My Trips có bốn tab và thẻ đơn. Ảnh đang chọn Upcoming, có một đơn CONFIRMED với lịch 18–21/10/2026, 2 khách và tổng 9.655.000 đồng. Các thao tác Details và Cancel nằm dưới thẻ.',[
            ('Upcoming / Pending','Tab','CONFIRMED / PENDING_PAYMENT; Pending là chờ thanh toán.'),('Completed / Cancelled','Tab','COMPLETED / CANCELLED.'),('Thẻ chuyến đi','Văn bản / ảnh','Ảnh bìa, loại, tên, thành phố, ngày ở, số khách, tổng tiền và trạng thái.'),('Tên chỗ ở','Link','Đi đến chi tiết chỗ ở.'),('Details','Link','Đi đến /bookings/{id}.'),('Cancel','Nút / hộp thoại','Mở xác nhận; chỉ hiện khi trạng thái cho phép.'),('Explore stays','Link','Đi đến /search.')],
            [('Đổi tab','GET danh sách theo trạng thái; dữ liệu chỉ thuộc khách đang đăng nhập.'),('Xác nhận Cancel','PATCH hủy; thành công thì làm mới danh sách; lỗi giữ thông báo trong hộp thoại.'),('Tải lỗi / danh sách rỗng','Có phản hồi lỗi và thử lại; khi rỗng cho phép tìm chỗ ở khác.')],
            'Có gọi API qua TanStack Query. Hủy đơn không đồng nghĩa hoàn tiền. Tab Completed có thể rỗng vì vòng đời hoàn thành chưa được xác nhận, không nên tự tạo đánh giá khi chỉ qua ngày trả phòng.'),
        ('Bảng điều khiển Host','Sidebar gồm Đăng chỗ ở mới, Tổng quan, Chỗ ở của tôi và Đơn đặt phòng. Vùng chính có ba KPI và danh sách chỗ ở. Messages, Revenue và Accept/Decline không thuộc bố cục màn hình này.',[
            ('Doanh thu thu về','KPI','API cộng Payment SUCCESS thuộc chỗ ở của Host; nhãn “đã tất toán” chưa được chứng minh.'),('Lượt đặt phòng','KPI','Tổng booking thuộc chỗ ở của Host, không chỉ các đơn thành công.'),('Chỗ ở đang hoạt động','KPI','Đếm tin ACTIVE thuộc Host.'),('Đăng chỗ ở mới / Thêm mới','Nút','Mở hộp thoại nhập thông tin trong cùng trang.'),('Chỗ ở của tôi / Đơn đặt phòng','Nút menu','Đổi vùng nội dung nội bộ, không phải URL riêng.'),('Xem','Link','Mở chi tiết chỗ ở.'),('Lưu trữ','Nút','Gửi DELETE chỗ ở; service đổi INACTIVE.')],
            [('Tạo chỗ ở','Gửi API, báo lỗi/thành công và làm mới danh sách; mặc định schema vẫn DRAFT.'),('Lưu trữ','Cần xác nhận và phản hồi lỗi rõ; không mô tả như xóa vật lý.'),('Hủy đơn phía Host','UI có lời gọi hủy nhưng service hiện chỉ cho guest sở hữu hoặc Admin; cần thống nhất quyền.')],
            'Các KPI và danh sách đã lấy từ API trong mã hiện tại. Tổng tiền thành công không đồng nghĩa doanh thu thuần hoặc tiền đã chuyển ngân hàng. Không có bước duyệt thủ công trong MVP.'),
        ('Bảng điều khiển Admin','Sidebar ảnh chỉ có Tổng quan hệ thống và Đơn đặt phòng toàn sàn. Vùng chính gồm bốn KPI, ô tìm theo mã/tên/email, bộ lọc trạng thái và bảng đơn có nút Xem.',[
            ('Tổng người dùng','KPI','Đếm toàn bộ User.'),('Host đang hoạt động','KPI','Đếm role HOST và status ACTIVE.'),('Đơn đặt hôm nay','KPI','Đếm Booking tạo từ đầu ngày theo thời gian server.'),('Tổng doanh thu sàn','KPI','Hiện là tổng amount của Payment SUCCESS, không phải riêng phí dịch vụ.'),('Tìm theo mã, tên, email','Ô nhập','Đổi từ khóa và đặt page=1; tải API danh sách.'),('Trạng thái','Select','Tất cả / CONFIRMED / PENDING_PAYMENT / COMPLETED / CANCELLED.'),('Bảng / Xem','Bảng / link','Mã, chỗ ở, khách, lịch, tiền, trạng thái; Xem mở chi tiết đơn.'),('Phân trang','Nút có điều kiện','Chỉ hiển thị khi tổng số trang lớn hơn 1, không có trong khung ảnh hiện tại.')],
            [('Tìm hoặc lọc','Thay query key, truy vấn lại; không thay dữ liệu đơn.'),('Xem chi tiết','Đi đến chi tiết đơn; server phải cho quyền Admin phù hợp.'),('Không có kết quả / lỗi tải','Rỗng có thông báo; cần thể hiện lỗi riêng, không dùng số 0 để che lỗi.')],
            'Ảnh không có Users, Hosts, Reports, Settings, Export Data hay Generate Report. Nhãn Super Admin chỉ là chữ trên UI; schema có một vai trò ADMIN. Số 19.310.000 đồng là tổng thanh toán thành công đang hiển thị, không phải kết quả kiểm thử hoặc hoa hồng đã thu.'),
    ]
    for i,(name,intro,controls,events,note) in enumerate(screens):
        page()
        if i == 0: heading('4.3. Đặc tả chi tiết màn hình',2)
        heading(f'4.3.{i+1}. Màn hình {name.lower()}',2)
        para('Mục đích và bố cục. '+intro)
        picture(ROOT/'docs/product'/('image.png' if i==0 else f'image-{i}.png'),name,4,13)
        page();heading(f'Đặc tả tương tác: {name}',3)
        table('Đối tượng trên màn hình '+name.lower(),['Tên đối tượng','Loại','Dữ liệu / ý nghĩa'],controls,4)
        table('Biến cố và phản hồi: '+name.lower(),['Biến cố','Xử lý và kiểm tra'],events,4)
        para('Đánh giá và điểm cần hoàn thiện. '+note)

    page();heading('CHƯƠNG 5. THIẾT KẾ XỬ LÝ')
    heading('5.1. Phân chia trách nhiệm',2)
    para('Giao diện nhận thao tác và trình bày phản hồi; Route Handler kiểm tra phiên và dữ liệu; service xử lý quy tắc; Prisma truy cập PostgreSQL. VNPay và email là tích hợp ngoài ứng dụng. Các lược đồ dưới đây tập trung vào nghiệp vụ có rủi ro nhất quán dữ liệu, không trộn mô hình quan hệ với luồng xử lý.')
    picture(graph('architecture',{'ui':'Trình duyệt\nReact / TanStack Query','route':'Next.js\nTrang server / Route Handler','svc':'Service nghiệp vụ','db':'Prisma / PostgreSQL','vn':'VNPay','mail':'Email'},[('ui','route','Điều hướng / HTTP'),('route','svc','Kiểm tra và xử lý'),('svc','db','Đọc / ghi'),('svc','vn','Tạo URL đã ký'),('vn','route','IPN / kết quả verify'),('route','mail','Xác nhận giao dịch')]),'Thành phần và trách nhiệm xử lý',5,12)
    heading('5.2. Tìm kiếm và kiểm tra lịch',2)
    para('Truy vấn chỉ chọn chỗ ở ACTIVE. Bộ lọc vị trí, giá, loại hình, sức chứa và điểm được ghép vào điều kiện. Nếu có đủ hai ngày, loại các chỗ ở có booking giữ lịch giao nhau. Hàm liệt kê hiện sắp theo ngày tạo giảm dần; sort mà giao diện gửi chưa được truyền thành orderBy.')
    picture(sequence('search',['Khách','Trang tìm kiếm','Search service','Prisma / DB'],[(0,1,'Gửi tiêu chí tìm kiếm',False),(1,2,'Truyền bộ lọc, ngày và phân trang',False),(2,3,'Lọc ACTIVE và loại đơn giao lịch',False),(3,2,'Danh sách và tổng số kết quả',True),(2,1,'Kết quả đã ánh xạ dữ liệu',True),(1,0,'Hiển thị danh sách hoặc trạng thái rỗng',True)]),'Trình tự truy vấn tìm kiếm',5,15)
    page();heading('5.3. Tạo đơn và khởi tạo thanh toán',2)
    picture(sequence('booking',['Khách / UI','Booking API','Booking service','Prisma / DB'],[(0,1,'POST lịch, số khách và mã giảm',False),(1,1,'Kiểm tra session và payload',False),(1,2,'createBooking với khách hiện tại',False),(2,3,'Đọc chỗ ở ACTIVE, sức chứa',False),(3,2,'Giá và thông tin chỗ ở',True),(2,3,'Kiểm tra PENDING_PAYMENT / CONFIRMED giao lịch',False),(3,2,'Nếu trùng: dừng, API trả 409',True),(2,2,'Tính phí 10%, kiểm tra mã giảm',False),(2,3,'Transaction: tạo Booking + Payment',False),(3,2,'Commit; trả mã Booking',True),(2,2,'Tạo URL VNPay sau commit',False),(2,1,'Mã đơn và URL; hoặc lỗi tạo URL',True),(1,0,'201 và chuyển VNPay; lỗi thì hiển thị',True)]),'Tạo đơn: điểm kiểm tra lịch và ranh giới transaction',5,18)
    para('Kiểm tra giao lịch diễn ra trước transaction nên hai yêu cầu đồng thời có thể cùng vượt qua kiểm tra. Transaction chỉ bảo đảm tạo Booking và Payment cùng thành công hoặc cùng thất bại; không tự tạo bảo đảm chống đặt trùng. URL VNPay được tạo sau commit nên lỗi cấu hình có thể để lại đơn chờ giữ lịch.')
    para('Với ngày hợp lệ, tiền dịch vụ = round(giá đêm × số đêm × 10%); tổng trước giảm = tiền phòng + phí dọn dẹp + phí dịch vụ. Server xác thực mã lại khi tạo đơn. Hàm hiện ép số đêm tối thiểu 1, vì vậy cần bổ sung kiểm tra ngày thay vì xem mọi chuỗi ngày là hợp lệ.')
    page();heading('5.4. Xác nhận qua IPN VNPay',2)
    picture(sequence('ipn',['VNPay','IPN handler','Prisma / DB','Email'],[(0,1,'Gửi tham chiếu, tiền, chữ ký và mã kết quả',False),(1,2,'Tìm Payment theo providerTxnRef',False),(2,1,'Payment và Booking liên quan',True),(1,1,'Không thấy: 01; sai chữ ký/tiền: 97',False),(1,1,'Nếu đã SUCCESS: trả OK, không ghi lại',False),(1,2,'Transaction: SUCCESS/FAILED và CONFIRMED/CANCELLED',False),(1,2,'Nếu thành công: tăng usedCount khi có mã',False),(2,1,'Commit thay đổi',True),(1,3,'Nếu thành công: gửi email xác nhận',False),(1,0,'Trả RspCode 00 khi xử lý xong',True)]),'IPN: xác minh, cập nhật giao dịch và gửi email',5,18)
    para('Điều kiện thành công của IPN là ResponseCode = 00 và TransactionStatus = 00 sau khi chữ ký và amount được kiểm tra. Kiểm tra Payment SUCCESS ở ngoài transaction chưa đủ chống hai callback đến đồng thời. Nhánh cập nhật không bảo vệ Booking đã CANCELLED, nên callback thành công muộn có thể xác nhận lại đơn. Email được gửi sau commit; lỗi gửi không đồng nghĩa giao dịch đã rollback.')
    page();heading('5.5. Xác minh kết quả trả về trình duyệt',2)
    picture(sequence('verify',['Trình duyệt','Verify handler','Prisma / DB','Email'],[(0,1,'POST query từ kết quả VNPay',False),(1,1,'Thiếu query / TxnRef: trả 400',False),(1,2,'Tìm Payment và Booking',False),(2,1,'Không thấy: 404; thấy: trả bản ghi',True),(1,1,'verifyReturn kiểm tra chữ ký; sai: 400',False),(1,1,'success dựa ResponseCode = 00',False),(1,2,'Nếu Payment chưa SUCCESS: cập nhật Payment / Booking',False),(1,2,'Thành công và có mã: tăng usedCount',False),(2,1,'Commit',True),(1,3,'Gửi email; bỏ qua lỗi gửi ở nhánh này',False),(1,0,'Trả kết quả success, bookingId và status',True)]),'Verify cũng có nhánh thay đổi dữ liệu',5,18)
    para('Hiện trạng khác thiết kế chỉ cho IPN xác nhận: verify cũng cập nhật Payment và Booking, tăng lượt dùng mã giảm và gửi email. verifyReturn chỉ kiểm tra chữ ký, không đối chiếu số tiền với Payment; success chỉ dựa ResponseCode. Hai đường cập nhật phải được hợp nhất hoặc dùng chung quy tắc nguyên tử để tránh xử lý lặp và tranh chấp trạng thái.')
    page();heading('5.6. Hủy đơn và tác động lên thanh toán',2)
    picture(sequence('cancel',['Khách / UI','Booking API','Booking service','Prisma / DB'],[(0,1,'Xác nhận yêu cầu hủy',False),(1,2,'Mã đơn, userId, quyền Admin',False),(2,3,'Đọc Booking',False),(3,2,'Đơn và trạng thái hiện tại',True),(2,2,'Kiểm tra sở hữu và trạng thái cho phép',False),(2,3,'Cập nhật CANCELLED và cancelledAt',False),(3,2,'Booking đã cập nhật',True),(2,1,'Kết quả; không cập nhật Payment',True),(1,0,'Tải lại danh sách chuyến đi',True)]),'Hủy Booking không đồng nghĩa hoàn Payment',5,17)
    para('Đơn chỉ được hủy khi PENDING_PAYMENT hoặc CONFIRMED. Hàm cho phép đúng guest hoặc Admin; Host không tự có quyền chỉ vì sở hữu chỗ ở. Cần thống nhất nút hủy phía Host với quy tắc server, đồng thời thiết kế hoàn tiền, kiểm tra thời hạn và ngăn callback muộn khôi phục đơn.')
    page();heading('5.7. Đánh giá và cập nhật điểm',2)
    picture(sequence('review',['Khách','Review service','Prisma / DB'],[(0,1,'Gửi bookingId, điểm và nhận xét',False),(1,2,'Đọc Booking cùng Review hiện có',False),(2,1,'Chủ đơn, trạng thái và Review',True),(1,1,'Chỉ tiếp tục nếu đúng khách, COMPLETED, chưa review',False),(1,2,'Transaction: tạo Review',False),(1,2,'Tính AVG(rating) theo propertyId',False),(1,2,'Cập nhật Property.ratingAvg',False),(2,1,'Commit và trả Review',True),(1,0,'Hiển thị đánh giá đã lưu',True)]),'Tạo đánh giá sau khi đơn hoàn thành',5,17)
    para('Tầng dữ liệu bảo đảm tối đa một Review mỗi Booking bằng bookingId duy nhất. Điều kiện COMPLETED là cần thiết, nhưng chưa có bằng chứng về tác vụ tự chuyển trạng thái này trong luồng cài đặt đã khảo sát; không được xem việc qua ngày trả phòng là một chuyển trạng thái đã xảy ra.')

    page();heading('CHƯƠNG 6. CÀI ĐẶT VÀ KẾ HOẠCH THỬ NGHIỆM')
    heading('6.1. Công nghệ và tổ chức',2)
    table('Thành phần cài đặt',['Công nghệ','Vai trò'],[('Next.js 15.5.4 / React 19.1','App Router, trang server/client, Route Handler.'),('TypeScript / Zod','Kiểm tra kiểu và dữ liệu đầu vào; mức độ áp dụng cần đồng nhất.'),('Prisma 6.19.3 / PostgreSQL','10 model quan hệ, enum, khóa và truy cập dữ liệu.'),('Auth.js / bcryptjs','Phiên đăng nhập và băm mật khẩu.'),('TanStack Query','Truy vấn, mutation và làm mới dữ liệu của My Trips, Host, Admin, checkout.'),('Tailwind / thành phần UI','Bố cục và đối tượng giao diện.'),('VNPay / Nodemailer','Tạo URL, xác minh kết quả và gửi email theo cấu hình.')],6)
    para('Frontend gọi API ở checkout, My Trips và dashboard quản lý; trang tìm kiếm gọi service trực tiếp trên server. Riêng trang tìm kiếm còn fallback sang dữ liệu mẫu trong một số điều kiện khi kết quả rỗng hoặc truy vấn lỗi. Các đường kết nối này cần được thử nghiệm với môi trường tích hợp trước khi nghiệm thu.')
    heading('6.2. Đối chiếu yêu cầu và cài đặt',2)
    table('Các điểm cần chú ý khi nghiệm thu',['Chức năng','Hiện trạng đọc được','Điều kiện còn thiếu'],[('Tìm kiếm','Có truy vấn và lọc lịch','Áp dụng sort; tách lỗi/rỗng/fallback; kiểm tra ngày và tham số.'),('Đặt phòng','Booking + Payment cùng transaction','Chống đặt trùng đồng thời; xử lý lỗi URL sau commit; hết hạn đơn chờ.'),('VNPay','IPN và verify đều cập nhật','Chung quy tắc số tiền/trạng thái; chống lặp nguyên tử; callback muộn.'),('Hủy đơn','Đổi Booking sang CANCELLED','Đồng bộ Payment; chính sách hoàn tiền/48 giờ; quyền Host.'),('Đánh giá','Service kiểm tra COMPLETED và unique','Quy trình hoàn thành chuyến đi; thử cạnh tranh cập nhật điểm.'),('Tạo chỗ ở','Mặc định DRAFT; payload có tiện nghi','Tách amenityIds khỏi dữ liệu model; luồng công bố tin; form tương thích schema.'),('Dashboard','Có API và query trên UI','Xử lý lỗi tải; định nghĩa đúng doanh thu và tiền tất toán.'),('Mở rộng','Đặc tả duyệt thủ công và đổi vai trò','Không nghiệm thu như chức năng đã triển khai đầy đủ.')],6)
    heading('6.3. Phạm vi đánh giá',2)
    para('Phương pháp đánh giá gồm đối chiếu tĩnh mã nghiệp vụ, schema và ảnh màn hình. Chưa có kết quả thực thi production build, kiểm thử HTTP, kiểm thử nghiệp vụ, rà soát phụ thuộc hay đo tải trong phạm vi đánh giá này. Kết luận nghiệm thu cần có bằng chứng thực nghiệm tương ứng.')
    para('Việc gọi API thể hiện trong mã chứng minh có đường kết nối, nhưng không chứng minh giao dịch đã chạy thành công với PostgreSQL và VNPay sandbox. Không dùng số đơn hoặc số tiền trên ảnh để khẳng định tích hợp đã được nghiệm thu.')
    heading('6.4. Kịch bản kiểm thử và kết quả mong đợi',2)
    tests=[('KT01','Đặt hợp lệ','Chỗ ở ACTIVE, lịch trống, khách hợp lệ','201; một Booking PENDING_PAYMENT và Payment PENDING; có URL VNPay.'),('KT02','Hai kỳ nối tiếp','Đơn A trả đúng ngày B nhận','Không xung đột chỉ vì chung ngày biên.'),('KT03','Đặt trùng đồng thời','Hai khách cùng chỗ ở và lịch','Chỉ một đơn được giữ lịch; cần kiểm thử CSDL thật.'),('KT04','Ngày lỗi','Ngày không tồn tại, đảo ngày, chuỗi rỗng','Từ chối trước khi tính tiền/tạo đơn.'),('KT05','Tính tiền','Giá 2.850.000, 3 đêm, dọn 250.000','Phí 855.000; trước giảm 9.655.000 đồng.'),('KT06','IPN chữ ký/tiền sai','Sai chữ ký hoặc amount không khớp','Không cập nhật Payment/Booking.'),('KT07','Callback lặp','Hai IPN hoặc IPN và verify đồng thời','Một lần chuyển trạng thái; usedCount chỉ tăng một.'),('KT08','Callback đến muộn','Booking đã hủy rồi nhận thành công','Không tự khôi phục đơn; chuyển quy trình đối soát.'),('KT09','Hủy trái quyền','Khách B hủy đơn của khách A','Bị từ chối, dữ liệu giữ nguyên.'),('KT10','Hủy đã trả tiền','Booking CONFIRMED và Payment SUCCESS','Thực hiện chính sách riêng; không báo đã hoàn tiền chỉ từ CANCELLED.'),('KT11','Review','Đơn chưa COMPLETED hoặc đã review','Từ chối; đơn hợp lệ chỉ có một Review.'),('KT12','Tìm kiếm lỗi DB','Không kết nối được DB','Phản hồi lỗi rõ, không trả dữ liệu mẫu như dữ liệu thật.'),('KT13','Dashboard','Có Payment SUCCESS và FAILED','Chỉ SUCCESS vào tổng; phân biệt tổng thanh toán và phí dịch vụ.'),('KT14','Phiên và quyền','Khóa tài khoản/đổi vai trò khi đang đăng nhập','Quyền có hiệu lực nhất quán; không giữ quyền cũ ngoài chính sách.'),('KT15','Giao diện','Desktop/mobile, bàn phím, lỗi mạng','Không tràn ngang không cần thiết; có trạng thái tải/lỗi/rỗng, nhãn trường và focus rõ.')]
    table('Kế hoạch kiểm thử, chưa phải kết quả thực thi',['Mã','Tình huống','Dữ liệu / điều kiện','Kết quả mong đợi'],tests,6)
    heading('6.5. Điều kiện nghiệm thu tiếp theo',2)
    bullets(['Chuẩn bị PostgreSQL, dữ liệu thử và cấu hình sandbox; không dùng tài khoản hoặc thanh toán thật cho thử lỗi.','Chạy luồng từ tìm kiếm đến xác minh và My Trips; đối chiếu các bản ghi với trạng thái hiển thị.','Thực hiện kiểm thử đồng thời, lặp/muộn callback, số tiền sai, lỗi email và lỗi tạo URL.','Ghi thời gian, môi trường, phiên bản, dữ liệu, kết quả và bằng chứng cho từng kịch bản; chỉ kết luận đạt sau khi thực thi.'])

    page();heading('CHƯƠNG 7. TỔNG KẾT')
    heading('7.1. Kết quả của đồ án',2)
    para('StayHub đã có cấu trúc ứng dụng web, mô hình dữ liệu, service tìm kiếm/đặt phòng/giảm giá/đánh giá và các giao diện chính. Các màn hình checkout, My Trips và quản lý đã có lời gọi API. Thiết kế bao quát hành trình khách thuê, vận hành chỗ ở của Host và giám sát đơn của Admin.')
    heading('7.2. Hạn chế',2)
    bullets(['Tính nhất quán lịch chưa được bảo đảm khi tạo đơn đồng thời; đơn chờ có thể còn giữ lịch sau lỗi tạo URL.','IPN và verify chưa thống nhất mức kiểm tra; chống callback lặp chưa nguyên tử và chưa bảo vệ đơn đã hủy.','Hủy không cập nhật thanh toán hoặc hoàn tiền; chính sách 48 giờ và quyền hủy của Host chưa khớp hành vi server.','Service yêu cầu COMPLETED để review nhưng chưa xác nhận quy trình chuyển trạng thái hoàn thành.','Sort chưa được áp dụng xuống truy vấn; fallback tìm kiếm có thể che lỗi hoặc kết quả rỗng.','Tạo tin cần sửa payload tiện nghi và hoàn thiện công bố DRAFT → ACTIVE.','Nhãn doanh thu/đã tất toán chưa đúng nghĩa số tổng Payment SUCCESS; cần tách phí nền tảng, tiền Host và hoàn tiền.','Chưa có kết quả thử nghiệm tích hợp, tải và tiếp cận trong lần đối chiếu này.'])
    heading('7.3. Hướng phát triển',2)
    table('Thứ tự ưu tiên hoàn thiện',['Ưu tiên','Công việc và điều kiện hoàn tất'],[('1','Thống nhất xác thực, quyền và kiểm tra dữ liệu; thử quyền trên từng thao tác.'),('2','Bảo vệ lịch khi đồng thời; thống nhất một cơ chế cập nhật Payment/Booking có tính lặp an toàn.'),('3','Bổ sung hết hạn, hoàn thành, hủy và hoàn tiền; mô hình hóa chuyển trạng thái hợp lệ.'),('4','Sửa tạo/công bố tin, sort và trạng thái lỗi giao diện; bỏ fallback gây hiểu nhầm.'),('5','Chạy và lưu bằng chứng kiểm thử tích hợp, sandbox, hiệu năng và tiếp cận.'),('6','Mở rộng wishlist, nhắn tin, báo cáo hoặc Host duyệt nếu thực sự nằm trong phạm vi mới.')],7)
    heading('7.4. Kết luận',2)
    para('Sản phẩm có cơ sở để tiếp tục phát triển và kiểm thử, nhưng chưa đủ bằng chứng để kết luận sẵn sàng vận hành thương mại. Trọng tâm giai đoạn tiếp theo là bảo vệ tính nhất quán của giao dịch, làm rõ vòng đời đơn và thực thi các kịch bản tích hợp với dữ liệu thật trong môi trường thử nghiệm.')
    page();heading('TÀI LIỆU THAM KHẢO')
    refs=['[1] Giáo trình Công nghệ phần mềm, Trường Đại học Sư phạm Kỹ thuật TP. Hồ Chí Minh.','[2] Next.js Documentation. https://nextjs.org/docs','[3] Prisma ORM Documentation. https://www.prisma.io/docs','[4] Auth.js Documentation. https://authjs.dev','[5] VNPay – Tài liệu tích hợp thanh toán. https://sandbox.vnpayment.vn/apis/','[6] PostgreSQL Documentation. https://www.postgresql.org/docs/','[7] TanStack Query Documentation. https://tanstack.com/query/latest/docs/framework/react/overview']
    for r in refs:para(r)
    para('Tài liệu kỹ thuật [2]–[7] dùng để tra cứu nền tảng và phương thức tích hợp, không thay thế kết quả kiểm thử ứng dụng. Tài liệu học phần [1] được giữ trong danh mục học thuật của đồ án.')
    page();heading('PHÂN CÔNG CÔNG VIỆC')
    para('Phân công của Nhóm 05 được trình bày theo các mảng phụ trách. Nội dung phân công không được xem là kết quả nghiệm thu từng chức năng.')
    heading('Hồ Đặng Thái Duy – MSSV 24110179',2)
    para('Vai trò: Nhóm trưởng; phụ trách nền tảng và backend.')
    bullets(['Tổ chức kiến trúc Next.js, TypeScript và môi trường PostgreSQL.','Thiết kế mô hình Prisma, quan hệ dữ liệu và quản lý migration.','Phụ trách xác thực, kiểm tra quyền và API nghiệp vụ.','Xây dựng xử lý đặt phòng, tính giá, giảm giá, thanh toán VNPay và email.','Đối chiếu mã nghiệp vụ, tổng hợp hạn chế và kế hoạch thử nghiệm.'])
    heading('Trần Đức Anh – MSSV 24110155',2)
    para('Vai trò: Thành viên; phụ trách frontend và UI/UX.')
    bullets(['Tổ chức bố cục, điều hướng và thành phần giao diện tái sử dụng.','Xây dựng các màn hình trang chủ, tìm kiếm, chi tiết, checkout và My Trips.','Xây dựng giao diện Host và Admin; xử lý biểu mẫu và phản hồi thao tác.','Kết nối truy vấn và mutation từ giao diện đến API.','Chuẩn bị hình giao diện và rà soát nội dung mô tả từng màn hình.'])
    # Append usable figure/table lists without hard-coded page numbers.
    page();heading('DANH MỤC HÌNH')
    for cap in figures:para(cap)
    page();heading('DANH MỤC BẢNG')
    for cap in tables:para(cap)
    d.core_properties.title='STAYHUB – Báo cáo cuối kỳ – Nhóm 05'
    d.core_properties.author='Nhóm 05 – Hồ Đặng Thái Duy; Trần Đức Anh'
    d.core_properties.subject='Nền tảng đặt phòng nghỉ và homestay trực tuyến'
    d.save(OUT)
    manifest={'inputs':INPUTS,'report':OUT.name,'screenshots':7,'use_cases':24,'figures':figures,'tables':tables,'scope':'Source/document inspection; no application integration or performance test executed.'}
    (ASSETS/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
    print(f'Created {OUT}; {len(figures)} figures, {len(tables)} tables')


if __name__=='__main__':
    if '--check' in sys.argv:check()
    else:build();check()
