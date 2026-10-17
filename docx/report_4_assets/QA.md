# Báo cáo (4) — bàn giao và kiểm tra chất lượng

## Sản phẩm

- `docx/Nhom05_BaoCaoCuoiKy (4).docx` — báo cáo đầy đủ, không phải bản tóm tắt.
- `docx/Nhom05_BaoCaoCuoiKy (4).pdf` — PDF A4, **84 trang**, xuất từ DOCX đã cập nhật mục lục.
- `docx/generate_report_4.py` — tái sử dụng nội dung/hàm vẽ của generator (2) bằng các phép thay thế có assertion; mọi đầu ra chuyển sang (4). Không chạy hoặc ghi lại báo cáo (2).
- `docx/render_report_4.py` — dùng LibreOffice UNO, cập nhật mục lục, lưu DOCX và xuất PDF. Kế thừa renderer (2) dưới dạng đầu vào chỉ đọc.
- `docx/verify_report_4_pdf.py` — chỉ raster hóa và kiểm tra PDF (4), không chạy ứng dụng.
- `docx/report_4_assets/manifest.json` — danh mục hình/bảng, 18 SHA-256 đầu vào được bảo vệ, revision, phạm vi và định danh.
- `docx/report_4_assets/pdf-qa.json`, `contact-001.jpg` đến `contact-081.jpg`, `page-01.png` đến `page-84.png` — bằng chứng render.
- 33 sơ đồ PNG đơn sắc; nguồn DOT/Mermaid tương ứng được giữ để chỉnh sửa. PNG dùng Graphviz/Pillow, không tuyên bố đã render Mermaid bằng mmdc.

Tổng: **24 đặc tả UC, 10 tình huống xử lý, 10 bảng từ điển dữ liệu, 7 ảnh giao diện nguyên byte, 7 sơ đồ biến cố, 40 hình và 71 bảng**. Phần xử lý có 11 hình tuần tự vì thanh toán VNPay tách IPN và verify trong cùng một tình huống nghiệp vụ. Có 8 hình UC: tổng quan và 7 nhóm chức năng thuộc phạm vi gốc.

## Áp dụng mẫu có chọn lọc

| Mẫu được cung cấp | Phần áp dụng trong báo cáo (4) |
|---|---|
| `Mau_Khao sat hien trang.docx` | Hiện trạng → phân tích yêu cầu → quy trình tác nghiệp của StayHub. Không bổ sung khảo sát đối thủ hoặc phỏng vấn không có bằng chứng. |
| `Mau_Danh sach yeu cau.docx` | 5 nhóm nghiệp vụ có dòng `Bộ phận: ... Mã số: ...`; bảng đúng 6 cột `STT / Công Việc / Loại Công Việc / Quy Định/ Công Thức Liên Quan / Biểu Mẫu Liên Quan / Ghi Chú`. Mã MH01–MH07, TK01 và DG01 trỏ đến màn hình/biểu mẫu điện tử có ý nghĩa. |
| `Mau_Mo Hinh Hoa yeu cau.docx` | Bảng `Tác nhân / Chức năng`, danh sách `STT / Chức năng / Mô tả`, sơ đồ tổng quan và các nhóm UC. Không dùng lại đặc tả UC kiểu cũ của mẫu này. |
| `Mau_Dac Ta Usecase.docx` | 24 bảng hai cột, không thêm hàng tiêu đề chung; đầy đủ ID, tên, mô tả, tác nhân, điều kiện trước/sau, luồng chính, thay thế và ngoại lệ. |
| `BaoCaoMau_ThietKeCSDL va ThietKeGiaoDien.docx` | Sơ đồ logic, ký pháp quan hệ đủ 10 model với PK/FK/UK/NULL, chi tiết dữ liệu đúng 6 cột, sơ đồ quan hệ đọc được chia lõi/bổ trợ. UI gồm danh sách và chuyển đổi, rồi mỗi màn hình có Ý nghĩa, Chi tiết màn hình + ảnh, bảng `STT / Loại / Ý nghĩa`, sơ đồ biến cố thực sự và phản hồi. Tên đối tượng nằm trong cột Ý nghĩa. |
| `Mẫu RBTV trên CSDL.docx` | Bảng 4 cột `Mã số / Mô tả miền giá trị / Thành phần liên quan / Ghi chú` trong mục ràng buộc hiện có. Phân biệt schema, nghiệp vụ/service và điều kiện cần kiểm thử CSDL. |
| `V03 - Thiet ke phan mem.PPT` | Giữ nguyên và băm kiểm tra. Không chuyển đổi PPT nhị phân: các DOCX đã cung cấp cấu trúc cụ thể; handoff cho phép không chặn vì PPT. Không coi PPT là yêu cầu thêm chương. |

### Sai lệch mẫu có chủ đích

Hàng `Điều kiện tiên quyết` trong mẫu UC chứa kết quả đã đạt, không phải điều kiện trước. Báo cáo đổi nhãn đó thành **`Điều kiện sau`**, giữ vị trí và ngữ nghĩa hậu điều kiện. Validator so sánh trực tiếp các trường của mẫu sau đúng một phép đổi nhãn này. Quyết định chỉ được giải thích ở QA, không đưa bình luận về mẫu vào nội dung học thuật.

### Những nội dung không nhập vào phạm vi

- Không đưa nghiệp vụ rạp phim, điện thoại, bán/thuê đĩa, F&B, kho nguyên liệu, chấm công hay tiền lương vào StayHub.
- Không thêm quên/đổi mật khẩu, lọc loại phòng khách sạn hay chương mới chỉ vì mẫu có các mục đó.
- Không tạo chương RBTV riêng hoặc ma trận tầm ảnh hưởng hàng loạt. Không tự đặt biểu mẫu giấy.
- Không biến Host accept/reject, đổi vai trò, hoàn tiền, lịch sử thông báo, báo cáo xuất file hoặc tất toán ngân hàng thành tính năng đã hoàn tất.
- Không lấy các khẳng định thiếu căn cứ của (3), như giữ chỗ cố định 15 phút, làm kết quả cài đặt. Giữ các cải tiến hợp lệ của (3): bìa viết hoa, lời cảm ơn/header, phân nhóm yêu cầu, ký pháp quan hệ và việc chuyển chương xử lý xuống sau UI; chuẩn hóa lại bằng mẫu thực tế.
- Trang nhận xét để trống phần đánh giá, không tự coi bảng phân điểm trong (3) là rubric chính thức của giảng viên.

## Đối chiếu nghiệp vụ và bảo toàn đầu vào

Đã đọc handoff trước, tài liệu hướng dẫn được chỉ định, generator/renderer cũ, các báo cáo và mẫu, mapping cùng 7 ảnh thực tế. Đối chiếu schema, booking service và hai handler VNPay xác nhận các điểm quan trọng:

- Kiểm tra lịch nằm trước transaction; transaction tạo Booking + Payment không tự chống đặt trùng đồng thời.
- URL VNPay được tạo sau commit; IPN **và** verify đều có nhánh cập nhật dữ liệu.
- Hủy Booking không tự cập nhật Payment hoặc hoàn tiền.
- Review cần COMPLETED; không khẳng định đã có cơ chế tự hoàn thành chuyến đi.
- Checkout/My Trips/dashboard có kết nối API; không lặp lại nhận định cũ rằng toàn bộ chỉ là mock.
- `PropertyImage.publicId` không phải FK; `PropertyAmenity` có PK ghép; một Booking có tối đa một Payment và một Review ở mức mô hình.
- Số KPI/tiền trên ảnh không phải kết quả nghiệm thu; Host là image-5, Admin là image-6.

Giữ nguyên các báo cáo gốc, (1), (2), (3), 7 mẫu và 7 ảnh: **18 hash không thay đổi**. Các kết quả kỹ thuật/HTTP/14 tình huống mock trong báo cáo gốc được giữ với mốc khảo sát **05/10/2026**, nêu rõ không chạy lại trên phiên bản hiện tại.

Tên trường có xung đột: bản gốc dùng **Trường Đại học Công nghệ Kỹ thuật TP. Hồ Chí Minh**, (1)/(3) dùng **Sư phạm Kỹ thuật**. Bìa (4) giữ tên của bản gốc theo handoff; không tự giải quyết bằng suy đoán. Giữ nguyên tên tổ chức trong tài liệu giáo trình ở danh mục tham khảo. Ảnh tải lỗi ở trang chủ và lớp thông báo công cụ chụp ở ảnh tìm kiếm cũng được giữ, không sửa ảnh đầu vào.

## Kiểm tra thực thi

```sh
# RED trước khi tạo: AssertionError: Missing report (4)
/tmp/opencode/report-venv/bin/python docx/generate_report_4.py --check

# Chuỗi GREEN cuối
time /tmp/opencode/report-venv/bin/python docx/generate_report_4.py
python3 docx/render_report_4.py
/tmp/opencode/report-venv/bin/python docx/generate_report_4.py --check
/tmp/opencode/report-venv/bin/python docx/verify_report_4_pdf.py
pdfinfo "docx/Nhom05_BaoCaoCuoiKy (4).pdf"
git status --short
```

| Bước cuối | Kết quả | Thời gian |
|---|---|---:|
| Sinh báo cáo, sơ đồ và QA ban đầu | PASS: 40 hình, 71 bảng | 4,704 giây tổng |
| UNO lần đầu | Cập nhật 1 mục lục; lưu DOCX/PDF | 6,07 giây |
| Loại ngắt trang rỗng và xuất lại | Cập nhật lại mục lục/PDF cuối | 6,58 giây |
| Validator sau render | PASS | 0,650 giây |
| Raster hóa 84 trang, contact sheets và biên PDF | PASS; không từ vượt biên, không trang trắng/chỉ header-footer | 8,965 giây |
| pdfinfo | A4; 84 trang; PDF 1.7; không mã hóa | Đã chạy, không đo riêng |

Validator chỉ kiểm tra report (4); `--check` không gọi build hoặc runner ứng dụng. Có kiểm tra ZIP/XML, mẫu cột/trường, UC01–UC24, 10 tình huống, thứ tự chương, TOC/PAGE/header, đủ 10 ký pháp quan hệ, trường publicId không bị gán FK, 7 ảnh nguyên byte, giới hạn chiều rộng và từng kênh RGB của 33 sơ đồ. Các hàng UC không có nội dung rỗng.

Trong quá trình làm đã sửa trang trắng dư sau TOC, khoảng trống do ngắt trang trước ký pháp dữ liệu, dòng tiêu đề STT bị xuống dòng, sơ đồ quan hệ quá nhỏ và tên thuộc tính bị gán FK nhầm từ quy tắc hậu tố Id. Một lần UNO gặp `DisposedException` lúc khởi động lại; đã tách profile/port của lượt xuất cuối, sau đó chạy thành công lại chuỗi đầy đủ. Không coi các lỗi tạo tài liệu này là kết quả kiểm thử ứng dụng.

Đã **xem thực tế 5 contact sheet bao quát toàn bộ 84 trang của bản render cuối**, và xem phóng lớn bìa/nhận xét, UC, bảng yêu cầu 6 cột, ký pháp logic, sơ đồ quan hệ, bảng UI 3 cột + biến cố và trang tuần tự. Không thấy cắt hình, chữ tràn biên hoặc tiêu đề đơn độc ở cuối trang trong phạm vi kiểm tra. Các ngắt trang còn lại phục vụ front matter, nhóm đặc tả UC, ảnh giao diện và từng tình huống xử lý. Bảng quan hệ/kiểm thử dài được phép tiếp tục sang trang sau với hàng tiêu đề lặp.

## Phạm vi chưa xác nhận / giới hạn

- Không chạy npm build/typecheck/lint, suite-wide test, integration/e2e, PostgreSQL, SMTP, OAuth hay VNPay sandbox: tác vụ chỉ sửa báo cáo; handoff không yêu cầu chạy ứng dụng.
- Không tuyên bố kết quả kỹ thuật cũ vẫn đúng ở revision hiện tại. Không phát sinh kết quả nghiệp vụ, hiệu năng hoặc bảo mật mới.
- Bố cục được kiểm tra bằng LibreOffice/PDF, chưa kiểm tra trực tiếp bằng Microsoft Word. Nếu sửa nội dung trong Word cần cập nhật lại trường mục lục và xem phân trang.
- README trỏ tới `docs/README.md` nhưng đường dẫn đó không tồn tại trong workspace; các hướng dẫn dự án được handoff chỉ định trực tiếp đã đọc, không tìm tài liệu thay thế.
- Không có blocker còn lại cho các tệp báo cáo. Xung đột tên trường vẫn cần chủ tài liệu xác nhận nếu muốn đổi so với bản gốc.

## Định danh và task lock

- Revision: `50b4b9fae41aa49211b6235c86096dda79e7e9fa`.
- Provider/model: **openai/gpt-6.1-sol**; vai trò implementer **general**.
- Scout đã cung cấp: **explore / ses_eb6a72673ffe1DeXc0u7R0NM9r**.
- ID phiên implementer không được runtime cung cấp; không tự tạo ID.
- Giữ khóa tác vụ revision báo cáo; không load skill, không spawn task, không đổi model, không commit/push và không sửa mã ứng dụng.
- `git status` cuối vẫn có các thay đổi người dùng đã tồn tại từ đầu ở handoff và screen-reference. Ngoài ra xuất hiện các tệp `(05)`/` (05)` trong lúc tác vụ đang chạy; chúng không phải đầu ra của ba script (4), không được mở, sửa hoặc xóa trong tác vụ này.
