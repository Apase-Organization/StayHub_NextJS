# StayHub Next.js

Ứng dụng demo đặt chỗ lưu trú, xây dựng bằng Next.js, TypeScript, Prisma và PostgreSQL.

## Yêu cầu

- Node.js 20 trở lên và pnpm.
- PostgreSQL; có thể dùng Docker Compose để chạy PostgreSQL 16 cục bộ.

## Cài đặt và chạy cục bộ

Thực hiện tại thư mục gốc dự án:

1. Cài thư viện và tạo tệp cấu hình:

   ```bash
   pnpm install
   cp .env.example .env
   ```

2. Sửa `.env`: đặt `DATABASE_URL`, tạo `AUTH_SECRET` riêng và giữ
   `APP_LOCAL_URL`, `AUTH_URL`, `NEXTAUTH_URL` là `http://localhost:8080` khi chạy cục bộ.
   Dùng `.env` để cả Prisma CLI và Next.js đọc được cấu hình.

   Với PostgreSQL trong Compose, dùng chuỗi kết nối demo sau (không dùng cho production):

   ```dotenv
   DATABASE_URL="postgresql://stayhub:password@localhost:5432/stayhub_db"
   ```

   Tạo giá trị ngẫu nhiên rồi gán kết quả cho `AUTH_SECRET`:

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

3. Khởi động cơ sở dữ liệu (bỏ qua nếu đã có PostgreSQL và đã sửa `DATABASE_URL`):

   ```bash
   docker compose up -d db
   ```

4. Khi PostgreSQL sẵn sàng, tạo Prisma Client, áp dụng migration đã có và chạy ứng dụng:

   ```bash
   pnpm exec prisma generate
   pnpm exec prisma migrate deploy
   pnpm dev
   ```

   Truy cập <http://localhost:8080>.

## Cấu hình dịch vụ và bảo mật

Ngoài `DATABASE_URL` và `AUTH_SECRET`, cấu hình các dịch vụ theo nhu cầu:

- **Google OAuth:** `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` để đăng nhập bằng Google.
- **SMTP:** `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`.
  Cần SMTP hoạt động để nhận OTP trong luồng xác minh email.
- **Ảnh:** mặc định lưu tại `public/uploads`. Để dùng Cloudinary, đặt
  `UPLOAD_USE_CLOUDINARY=true` và điền `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- **VNPay:** điền `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` và cấu hình
  `VNPAY_PAY_URL`, `VNPAY_RETURN_URL`, `VNPAY_IPN_URL` phù hợp môi trường thanh toán.

Xem các biến cấu hình trong [.env.example](.env.example) và
[hướng dẫn đóng góp/cài đặt](docs/contributing/getting-started.md).
Ưu tiên các lệnh và tên biến trong README này nếu tài liệu cũ khác biệt.

**Không commit `.env` hoặc chia sẻ khóa bí mật.** `.env` đã được loại trừ trong `.gitignore`;
thay mọi giá trị mẫu bằng thông tin riêng trước khi dùng dịch vụ thật.

Quy ước đóng góp: [conventions.md](docs/contributing/conventions.md).
