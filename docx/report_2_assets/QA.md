# Báo cáo (2): tạo tài liệu và kiểm tra chất lượng

## Sản phẩm

- `docx/Nhom05_BaoCaoCuoiKy (2).docx`
- `docx/Nhom05_BaoCaoCuoiKy (2).pdf` — bản xem trước được xuất từ chính DOCX sau khi cập nhật mục lục.
- `docx/generate_report_2.py` — sinh báo cáo, sơ đồ PNG, nguồn DOT/Mermaid và manifest; `--check` chỉ kiểm tra tài liệu này.
- `docx/render_report_2.py` — cập nhật mục lục bằng LibreOffice UNO, lưu lại DOCX (2) và xuất PDF.
- `docx/report_2_assets/diagram-*` — 12 sơ đồ PNG, 12 nguồn Mermaid; 6 sơ đồ bố cục Graphviz có thêm nguồn DOT.
- `docx/report_2_assets/manifest.json` — danh mục 19 hình, 63 bảng và SHA-256 của hai đầu vào.

## Quyết định biên tập

Không có mẫu học thuật riêng trong phạm vi bàn giao. Báo cáo dùng bố cục học thuật nhất quán, giữ danh tính, mã học phần và nội dung học thuật hữu ích của hai báo cáo; tái sử dụng ý nghĩa các trường trong từ điển dữ liệu, nhưng sinh lại thuộc tính, kiểu và ràng buộc từ schema. Không tuyên bố đã làm đúng một mẫu mới chưa được cung cấp.

Tên trường trên hai báo cáo không thống nhất. Bìa (2) giữ **Trường Đại học Công nghệ Kỹ thuật TP. Hồ Chí Minh** theo báo cáo gốc; bản (1) dùng tên Sư phạm Kỹ thuật. Không tự đổi tên giảng viên, MSSV, học phần hoặc ngày tháng. Tài liệu giáo trình trong thư mục tham khảo giữ tên tổ chức như tài liệu gốc.

Nội dung đã sửa gồm:

- Một bìa viết hoa; trang nhận xét để trống phần đánh giá; lời cảm ơn, header, footer và mục lục có số trang/liên kết đã cập nhật.
- Yêu cầu nghiệp vụ có dữ liệu vào, quy tắc, đầu ra và truy vết; 24 đặc tả UC thống nhất, không lẫn tiền điều kiện/hậu điều kiện. Host duyệt thủ công và đổi vai trò được phân biệt với chức năng đã xác nhận.
- Mô hình dữ liệu logic có định danh, thực thể và bội số; bảng quan hệ đủ 12 liên kết; từ điển đủ 10 model. Payment/Review là 0..1 theo Booking; mã giảm giá tùy chọn; PropertyAmenity dùng khóa ghép.
- Phân tích đủ bảy ảnh thực tế với bảng đối tượng và bảng biến cố/kiểm tra; phân biệt URL, tab và hộp thoại. Giữ nguyên ảnh đầu vào, kể cả ảnh tải lỗi ở trang chủ và lớp thông báo công cụ chụp ở ảnh tìm kiếm.
- Chương xử lý sau giao diện; mô tả ranh giới transaction, lỗi URL sau commit, IPN và verify cùng cập nhật dữ liệu, hủy không hoàn tiền, và điều kiện COMPLETED của Review.
- Sửa nhận định lỗi thời rằng checkout/My Trips/dashboard chỉ là mô phỏng: mã hiện tại đã có API/service/query. Không từ đó suy ra đã nghiệm thu tích hợp.
- Không chuyển các kết quả build/HTTP/mock/audit cũ thành kết quả thử nghiệm mới. Phân công dùng bullets; giữ tài liệu tham khảo hợp lệ.

## Lệnh và kết quả

Môi trường ban đầu có Python 3.14.7, LibreOffice 25.8.7.3, Graphviz và Poppler. `python-docx` chưa có trong interpreter mặc định: `import docx` chỉ thấy thư mục báo cáo của dự án. Đã tạo venv cô lập ngoài workspace:

```sh
uv venv /tmp/opencode/report-venv
uv pip install --python /tmp/opencode/report-venv/bin/python python-docx Pillow
```

Các dependency cài đặt: python-docx 1.2.0, Pillow 13.0.0, lxml 6.1.3, typing-extensions 4.16.0. System Python có UNO, dùng riêng cho renderer.

```sh
/tmp/opencode/report-venv/bin/python docx/generate_report_2.py
python3 docx/render_report_2.py
/tmp/opencode/report-venv/bin/python docx/generate_report_2.py --check
pdftoppm -scale-to 850 -png "docx/Nhom05_BaoCaoCuoiKy (2).pdf" /tmp/opencode/release-report2-page
pdfinfo "docx/Nhom05_BaoCaoCuoiKy (2).pdf"
```

Lần chạy cuối:

| Bước | Kết quả | Thời gian |
|---|---|---:|
| Sinh DOCX + hình + QA trước render | PASS; 19 hình, 63 bảng | 3,20 giây |
| LibreOffice UNO | Cập nhật 1 mục lục; lưu DOCX và PDF | 4,00 giây |
| QA DOCX sau render | PASS | 1,646 giây |
| Raster hóa PDF | 68 trang A4 | 3,46 giây |
| Văn bản, mục lục mẫu và biên PDF | PASS | 0,211 giây |

Đã có kiểm tra RED có ý nghĩa trước khi sinh: `--check` báo thiếu báo cáo (2). Sau khi sinh và sau render, cùng kiểm tra đã GREEN. Trong quá trình triển khai đã sửa lỗi cú pháp của generator, đường dẫn font không có trong môi trường, trường TOC đơn giản chưa được LibreOffice nhận, trang trắng dư và tiêu đề bảng bị tách; không coi các lỗi này là kết quả ứng dụng.

QA cấu trúc kiểm tra ZIP/CRC, parse toàn bộ XML, phần bắt buộc, đủ 24 heading UC, thứ tự chương UI trước xử lý, TOC/PAGE/header, đủ bảy PNG giao diện giống byte đầu vào, giới hạn chiều rộng hình và tất cả pixel sơ đồ là thang xám. Có assertion riêng tránh nhầm ý nghĩa/giá trị mặc định giữa PropertyType, PropertyStatus và BookingStatus khi tái sử dụng mô tả trường. Hai hash báo cáo gốc khớp manifest, không ghi đè đầu vào.

QA PDF cuối: trích xuất 14.499 từ, không có từ vượt biên an toàn trang; kiểm tra mẫu số trang mục lục UC01 → 14, Chương 4 → 37 và Chương 5 → 53 khớp nội dung. Không có trang chỉ chứa header/footer. Đã xem contact sheet bao quát toàn bộ 68 trang, phóng lớn bìa/mục lục, UC, mô hình logic, bảng giao diện và sơ đồ tuần tự; sau các chỉnh sửa cuối đã xem lại các trang từ điển và trang có thay đổi. Không thấy hình bị cắt, chữ tràn biên hoặc trang trắng dư trong bản render kiểm tra. Một số trang chủ ý có khoảng trắng để giữ màn hình/sơ đồ và phần đặc tả riêng, không phải nội dung bị mất.

Nguồn Mermaid được giữ để chỉnh sửa/di chuyển, đã rà cú pháp; không có mmdc nên **không tuyên bố đã render Mermaid**. PNG trong báo cáo được render bằng Graphviz hoặc Pillow, đã kiểm tra trực quan và màu.

## Phạm vi chưa kiểm tra

Không chạy app build, npm suite, integration/e2e, VNPay sandbox, SMTP hay PostgreSQL: đây là tác vụ tài liệu và handoff không yêu cầu thay ứng dụng. Không đánh giá bố cục bằng Microsoft Word; PDF là kết quả LibreOffice trong môi trường hiện tại. Nếu chỉnh nội dung bằng Word, cần cập nhật lại toàn bộ mục lục và kiểm tra phân trang.

Không có mẫu riêng mới để xác nhận sự khớp tuyệt đối về trường biểu mẫu. Không có blocker cho sản phẩm đã giao; tên trường không thống nhất giữa hai đầu vào và lỗi sẵn có trong ảnh được nêu rõ ở trên.

Provider/model: `openai/gpt-6.1-sol`; vai trò `general`; không spawn tác vụ, không đổi model, không commit/push. Session ID của fresh implementer không được runtime cung cấp, không tự đặt ID thay thế.
