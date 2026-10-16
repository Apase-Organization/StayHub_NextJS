# StayHub Task List

## Phân công 3 người

| Người | Ký hiệu | Phụ trách |
|---|---|---|
| **Infra** | `[INFRA]` | Setup project, Docker, CI/CD, Prisma schema & migration, NextAuth config, VNPay lib, Cloudinary lib, Email lib, middleware, hỗ trợ debug |
| **Backend** | `[BE]` | Toàn bộ API Route Handlers, Service layer, business logic, Zod schema, type definitions |
| **Frontend** | `[FE]` | Toàn bộ UI — page, component, layout, React Query hooks, form, responsive |

> **Quy tắc blocking:** INFRA hoàn thành schema/migration → BE viết API → FE dùng API. INFRA hoàn thành lib (vnpay, cloudinary, email) → BE tích hợp vào service.

---

## Target Project Structure

```
StayHub/
├── .github/
│   └── workflows/          ci.yml                          ← INFRA
├── prisma/
│   ├── schema.prisma                                       ← INFRA
│   └── migrations/                                        ← INFRA
├── src/
│   ├── app/
│   │   ├── (public)/       Homepage, Search, Property Detail  ← FE
│   │   ├── (auth)/         Login, Register                    ← FE
│   │   ├── (guest)/        My Bookings, Booking flow          ← FE
│   │   ├── (host)/         Host Dashboard                     ← FE
│   │   ├── (admin)/        Admin Portal                       ← FE
│   │   ├── api/            Route Handlers                     ← BE
│   │   ├── layout.tsx                                         ← FE
│   │   └── globals.css                                        ← FE
│   ├── components/
│   │   ├── ui/             shadcn/ui (auto-generated)         ← INFRA setup, FE dùng
│   │   ├── common/         Navbar, Footer, SearchBox...       ← FE
│   │   ├── property/                                          ← FE
│   │   ├── booking/                                           ← FE
│   │   ├── host/                                              ← FE
│   │   └── admin/                                             ← FE
│   ├── lib/
│   │   ├── prisma.ts                                          ← INFRA
│   │   ├── auth.ts         NextAuth config                    ← INFRA
│   │   ├── api-response.ts                                    ← BE
│   │   ├── vnpay.ts        VNPay URL builder + verifier       ← INFRA
│   │   ├── cloudinary.ts   Upload helper                      ← INFRA
│   │   ├── email.ts        Nodemailer helpers                 ← INFRA
│   │   └── utils.ts        cn(), formatPrice()...            ← BE/INFRA
│   ├── services/                                              ← BE
│   │   ├── booking.service.ts
│   │   ├── discount.service.ts
│   │   ├── payment.service.ts
│   │   └── review.service.ts
│   ├── types/
│   │   ├── index.ts                                           ← BE
│   │   └── next-auth.d.ts                                     ← INFRA
│   └── schemas/                                               ← BE
│       ├── auth.schema.ts
│       ├── booking.schema.ts
│       ├── property.schema.ts
│       └── discount.schema.ts
├── public/
├── .env.example                                               ← INFRA
├── .env.local
├── middleware.ts                                              ← INFRA
├── next.config.ts                                             ← INFRA
├── tailwind.config.ts                                         ← INFRA
├── tsconfig.json                                              ← INFRA
├── docker-compose.yml                                         ← INFRA
└── package.json                                               ← INFRA
```

---

# SPRINT 0 — NỀN TẢNG CHUNG
> Toàn bộ Sprint 0 do **INFRA** thực hiện. BE và FE chỉ bắt đầu task của mình sau khi Sprint 0 hoàn thành.

- [x] **TSK-001** `[INFRA]` Khởi tạo Git repo, tạo branch `main`/`dev`, add Collaborator cho cả 3 người, cấu hình branch protection rule (require PR review trước khi merge vào `dev`). *(Estimate: 0.5h · Priority: Urgent · Blocking ALL)*

- [x] **TSK-002** `[INFRA]` Khởi tạo Next.js 15 App Router với TypeScript strict: `tsconfig.json` (`"strict": true`, path alias `@/*`), cài pnpm, khởi tạo `package.json`. *(Estimate: 1h · Priority: Urgent · Blocking ALL)*

- [x] **TSK-003** `[INFRA]` Cài và cấu hình Tailwind CSS v4, thêm CSS variables màu theo [design system](../product/design-system.md) vào `globals.css`. Setup font Inter. *(Estimate: 1h · Priority: Urgent · Blocking FE)*

- [x] **TSK-004** `[INFRA]` Cài shadcn/ui, tạo `components.json`, cài các component nền: `Button`, `Input`, `Card`, `Badge`, `Dialog`, `Select`, `Tabs`, `Skeleton`. *(Estimate: 1h · Priority: Urgent · Blocking FE)*

- [x] **TSK-005** `[INFRA]` `docker-compose.yml` (service `db`: PostgreSQL 16 + volume), tạo `.env.example` với toàn bộ biến môi trường cần thiết cho cả project. *(Estimate: 1h · Priority: Urgent · Blocking ALL)*

- [x] **TSK-006** `[INFRA]` Cấu hình Prisma: `prisma/schema.prisma` (datasource PostgreSQL, generator TypeScript), Prisma client singleton tại `src/lib/prisma.ts`. *(Estimate: 0.5h · Priority: Urgent · Blocking INFRA schema tasks)*

- [x] **TSK-007** `[INFRA]` `src/app/providers.tsx`: `SessionProvider` (NextAuth) + `QueryClientProvider` (React Query v5). Cài React Query, NextAuth, bcryptjs. Root layout `src/app/layout.tsx` bọc Providers. *(Estimate: 1h · Priority: Urgent · Blocking FE)*

- [x] **TSK-008** `[INFRA]` ESLint (`eslint-config-next`, `@typescript-eslint/no-explicit-any`, `no-console: warn`), Prettier, `.gitignore` (`.env.local`, `.next/`, `node_modules/`, `public/uploads/`). *(Estimate: 0.5h · Priority: High)*

- [x] **TSK-009** `[INFRA]` `src/lib/utils.ts`: `cn()` (clsx + tailwind-merge), `formatPrice()` (VND Intl formatter), `formatDate()`, `calculateNights()`. *(Estimate: 0.5h · Priority: High · Blocking FE và BE)*

- [x] **TSK-010** `[BE]` `src/lib/api-response.ts`: type `ApiResponse<T>`, hàm `ok()` và `fail()` theo [development conventions](../contributing/conventions.md). `src/types/index.ts`: `Role`, `BookingStatus`, `PaymentStatus`, `PropertyType`, `AmenityType`. *(Estimate: 1h · Priority: Urgent · Blocking BE)*

- [x] **TSK-011** `[FE]` Khung layout chung: `src/components/common/Navbar.tsx` + `Footer.tsx` (placeholder, chưa cần login state). *(Estimate: 1.5h · Priority: High · có thể làm song song TSK-007)*

---

# TRACK A — AUTH · USER · ADMIN

### INFRA làm trước

- [x] **TSK-012** `[INFRA]` Prisma schema model `User` (id, email, passwordHash, fullName, phone, role ENUM, status, provider, emailVerified, createdAt, updatedAt) + migration `create_users`. Expose type `UserRole = "GUEST" | "HOST" | "ADMIN"` trong `src/types/index.ts`. *(Estimate: 1h · Priority: Urgent · Blocking TSK-013, TSK-014)*

- [x] **TSK-013** `[INFRA]` `src/lib/auth.ts`: NextAuth v5 config — Credentials provider (bcryptjs verify, lookup user từ Prisma), Google OAuth provider (auto-provision user mới, merge nếu email đã tồn tại), callbacks `jwt` + `session` đính kèm `role` và `id`, augment `src/types/next-auth.d.ts`. *(Estimate: 2.5h · Priority: Urgent · Blocking TSK-014, TSK-015, TSK-020)*

- [x] **TSK-014** `[INFRA]` `middleware.ts` bảo vệ route theo role: `/host/**` → HOST/ADMIN, `/admin/**` → ADMIN, `/bookings/**` + `/properties/[id]/book/**` → phải đăng nhập; redirect về `/login` nếu không đủ điều kiện. *(Estimate: 1h · Priority: Urgent · Blocking FE auth pages)*

### BE làm tiếp

- [x] **TSK-015** `[BE]` `src/schemas/auth.schema.ts`: `registerSchema` (email, password min 8 ký tự, fullName), `loginSchema`. `src/app/api/auth/[...nextauth]/route.ts` (NextAuth handler). `src/app/api/auth/register/route.ts`: validate Zod → check email duplicate → bcrypt hash → tạo User GUEST. *(Estimate: 2h · Priority: Urgent · Blocking TSK-016)*

- [x] **TSK-016** `[BE]` Email OTP khi đăng ký: gọi `src/lib/email.ts` (do INFRA cung cấp ở TSK-031), lưu OTP + TTL 10 phút vào bảng `verification_tokens` (thêm model vào schema qua INFRA), `POST /api/auth/verify-otp` để xác minh. *(Estimate: 2h · Priority: Medium · phụ thuộc TSK-031)*

- [x] **TSK-017** `[BE]` Admin Route Handlers `src/app/api/admin/`: stats tổng quan (tổng users, active hosts, bookings hôm nay, platform revenue từ Prisma aggregation), danh sách booking toàn hệ thống (search theo mã/tên, filter status, pagination). `PATCH /api/admin/users/[id]/status` (lock/unlock). *(Estimate: 3h · Priority: Medium · phụ thuộc TSK-034, TSK-035)*

### FE làm tiếp

- [x] **TSK-018** `[FE]` `src/app/(auth)/login/page.tsx`: form React Hook Form + Zod `loginSchema`, gọi `signIn("credentials")`, hiển thị lỗi inline. Nút "Đăng nhập bằng Google" gọi `signIn("google")`. *(Estimate: 2h · Priority: High · phụ thuộc TSK-013)*

- [x] **TSK-019** `[FE]` `src/app/(auth)/register/page.tsx`: form RHF + Zod `registerSchema`, POST `/api/auth/register`, redirect sang `/verify-email` sau khi thành công. Trang `/verify-email`: nhập OTP 6 số. *(Estimate: 2h · Priority: High · phụ thuộc TSK-015)*

  Frontend implementation complete: accessible registration/OTP fields, safe English errors, pending-state guards, and login navigation after verification. Runtime SMTP/account creation remains unverified. The backend creates the account before sending email; delivery failure can leave an unverified account, and no resend endpoint exists. Do not treat this as end-to-end email acceptance.

- [x] **TSK-020** `[FE]` Hoàn thiện `Navbar.tsx` với session: đã login → Avatar + dropdown (Profile / My Bookings / Host Dashboard / Logout); chưa login → nút Login / Register. Dùng `useSession()` cho Client Component. *(Estimate: 1.5h · Priority: Medium · phụ thuộc TSK-013)*

- [x] **TSK-021** `[FE]` `src/app/(admin)/admin/page.tsx` + components: Stats Cards (4 chỉ số), bảng booking recent với search + filter status + pagination. Gọi `/api/admin/stats` và `/api/admin/bookings` bằng React Query. *(Estimate: 2.5h · Priority: Medium · phụ thuộc TSK-017)*

  English normalization follow-up (2026-10-17): static UI copy is now English across the scoped public/search/property, guest booking/payment, host/admin, layout and footer sources. My Trips is the consistent navigation label. Destination/address labels use display-only transliteration; destination query values, Unicode typing, stored descriptions, listing names, host/guest names and dynamic amenity content remain unchanged. English/VND indicators are informational, not working locale selectors. No backend/product feature completion is implied.

  Source-backed FE acceptance audit: TSK-011 shared layout and TSK-029 reusable PropertyCard exist (actual card path: `components/property/PropertyCard.tsx`); TSK-018/019 forms/API integration are implemented as noted above. TSK-020 remains partial without profile/avatar functionality. Earlier findings for TSK-021/028/030/031/032/045 require separate acceptance review after concurrent changes; this reconciliation does not certify those flows. Current TSK-043 loads property data through `getProperty`, previews promo codes through `/api/discounts/validate`, posts bookings and redirects to VNPay. Current TSK-044 posts return verification, polls payment status every two seconds and redirects after a resolved database status. It also falls back to the URL response code before polling resolves and renders a hardcoded CONFIRMED label; this is not authoritative confirmation or proof of email delivery. Current TSK-046 is an authenticated, ownership-checked Prisma-backed booking detail page with stay, host, pricing and payment information, but does not display guest details or a review form. Runtime payment/DB behavior, TSK-047 reviews and TSK-051 end-to-end acceptance remain unverified. Existing roadmap checkboxes are deliberately not promoted by this copy pass.

---

# TRACK B — PROPERTY · SEARCH · HOST

### INFRA làm trước

- [x] **TSK-022** `[INFRA]` Prisma schema models: `Property`, `PropertyImage`, `Amenity`, `PropertyAmenity`. Property fields: title, description, type ENUM, city, address, pricePerNight, cleaningFee, maxGuests, bedrooms, beds, bathrooms, ratingAvg, status ENUM, hostId → relation User. Migration `create_properties`. *(Estimate: 2h · Priority: Urgent · Blocking TSK-023)*

- [x] **TSK-023** `[INFRA]` `src/lib/cloudinary.ts`: `uploadImage(buffer, folder)` → trả `{ url, publicId }`, `deleteImage(publicId)`. Feature flag `UPLOAD_USE_CLOUDINARY` — nếu false, lưu file vào `public/uploads/` và trả local URL. *(Estimate: 2h · Priority: High · Blocking TSK-024)*

### BE làm tiếp

- [x] **TSK-024** `[BE]` `src/schemas/property.schema.ts`. `src/services/property.service.ts` + Route Handlers `src/app/api/properties/`:
    - `GET /api/properties` — public listing (chỉ ACTIVE, có filter cơ bản)
    - `GET /api/properties/[id]` — public detail kèm images + amenities + ratingAvg
    - `POST /api/properties` — tạo mới (HOST only, kiểm tra session)
    - `PATCH /api/properties/[id]` — cập nhật (HOST owner hoặc ADMIN)
    - `DELETE /api/properties/[id]` — archive sang INACTIVE
    
    Không trả Prisma model trực tiếp; map qua response type bỏ field nhạy cảm. *(Estimate: 3h · Priority: Urgent · Blocking TSK-025, TSK-026)*

- [x] **TSK-025** `[BE]` `src/app/api/properties/[id]/images/route.ts`: `POST` upload ảnh (multipart/form-data → gọi `cloudinary.ts`), `DELETE` xoá ảnh theo publicId, `PATCH` set ảnh cover. Validate đuôi file (JPEG/PNG) và kích thước. *(Estimate: 2h · Priority: High · phụ thuộc TSK-023)*

- [x] **TSK-026** `[BE]` `src/app/api/search/route.ts` + `src/services/search.service.ts`:
    - Query params: `location`, `checkIn`, `checkOut`, `guests`, `minPrice`, `maxPrice`, `type`, `bedrooms`, `amenities[]`, `minRating`, `sort` (price-asc/price-desc/rating-desc), `page`, `limit`
    - **Bắt buộc:** loại trừ property có booking CONFIRMED/PENDING_PAYMENT trùng khoảng ngày bằng Prisma subquery
    - Trả `{ properties, total, page, totalPages }`
    *(Estimate: 3.5h · Priority: Urgent · Blocking TSK-027)*

- [x] **TSK-027** `[BE]` Host API `src/app/api/host/`: stats (tổng booking của host, tổng revenue, số property đang ACTIVE), danh sách property của host, danh sách booking requests theo từng property. *(Estimate: 2.5h · Priority: High · phụ thuộc TSK-034)*

### FE làm tiếp

- [x] **TSK-028** `[FE]` `src/app/(public)/page.tsx` (Server Component): fetch featured properties trực tiếp từ Prisma (hoặc `/api/properties?featured=true`). Layout: Search Box nằm ngang 4 ô trên Hero Banner → dọc trên mobile; Popular Destinations (5 thành phố); Featured Properties (grid card); Popular Categories. *(Estimate: 2.5h · Priority: Urgent · phụ thuộc TSK-024)*

- [x] **TSK-029** `[FE]` `src/components/common/PropertyCard.tsx`: ảnh tỷ lệ 4:3 bo góc, badge loại hình, tên, rating + số review, giá/đêm. Tái sử dụng ở Homepage và Search Results. *(Estimate: 1.5h · Priority: Urgent · phụ thuộc TSK-028)*

- [x] **TSK-030** `[FE]` `src/app/(public)/search/page.tsx` (Server Component + `searchParams`): layout 2 cột desktop (Filter sidebar 3/12 + Property list 9/12). Filter sidebar (giá, loại hình, phòng ngủ, tiện nghi, rating) thay đổi URL params → page re-render. Sort dropdown. Pagination bằng Link `?page=N`. Responsive: filter sidebar collapse thành bottom sheet trên mobile. *(Estimate: 3h · Priority: Urgent · phụ thuộc TSK-026, TSK-029)*

- [x] **TSK-031** `[FE]` `src/app/(public)/properties/[id]/page.tsx` (Server Component): gallery ảnh (main + thumbnail grid 2x2, carousel vuốt ngang trên mobile), mô tả, tiện nghi, danh sách review. `AvailabilityChecker` (Client Component, React Query gọi `/api/bookings/check-availability`). Price Box (sticky bên phải desktop → sticky bottom bar mobile, nút Reserve → navigate sang booking page). *(Estimate: 3h · Priority: Urgent · phụ thuộc TSK-024, TSK-026)*

- [x] **TSK-032** `[FE]` `src/app/(host)/host/page.tsx` + components: Stats Cards (revenue, bookings, property count), Property List (card với nút Edit/Archive + modal Add Property form), Booking Requests (card mỗi request có tên khách, ngày, status badge, nút Cancel). Gọi `/api/host/` bằng React Query. *(Estimate: 3h · Priority: High · phụ thuộc TSK-027)*

---

# TRACK C — BOOKING · PAYMENT · REVIEW · NOTIFICATION

### INFRA làm trước

- [x] **TSK-033** `[INFRA]` Prisma schema models:
    - `Booking`: id, propertyId, guestId, checkInDate, checkOutDate, guests, nightlyPrice, cleaningFee, serviceFee, subtotalPrice, discountCodeId?, discountAmount, totalPrice, status ENUM, cancelledAt?, createdAt, updatedAt
    - `DiscountCode`: id, code unique, type ENUM (PERCENT/FIXED), value, cap?, minimumAmount, startDate, endDate, usageLimit?, usedCount, isActive, createdAt
    - Migration `create_bookings_and_discounts`.
    *(Estimate: 1.5h · Priority: Urgent · Blocking TSK-036, TSK-037)*

- [x] **TSK-034** `[INFRA]` Prisma schema model `Payment`: id, bookingId unique, amount, currency (default "VND"), paymentMethod, status ENUM, providerTxnRef?, providerTransactionNo?, rawResponse Json?, paidAt?, createdAt. Migration `create_payments`. *(Estimate: 1h · Priority: Urgent · Blocking TSK-039)*

- [x] **TSK-035** `[INFRA]` Prisma schema model `Review`: id, bookingId unique, propertyId, guestId, rating Int (1-5), comment, createdAt, updatedAt. Migration `create_reviews`. *(Estimate: 0.5h · Priority: Medium · Blocking TSK-043)*

- [x] **TSK-036** `[INFRA]` `src/lib/vnpay.ts`:
    - `buildPaymentUrl(params)` — build URL redirect sang VNPay: sort params theo alphabet, nối chuỗi query, ký HMAC-SHA512 với `VNPAY_HASH_SECRET`, append `vnp_SecureHash`
    - `verifyIpn(query)` — tách `vnp_SecureHash` ra, verify lại hash, so sánh `vnp_Amount`
    - `verifyReturn(query)` — tương tự, chỉ dùng cho UX (không làm source of truth)
    - Đọc config từ env: `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_PAY_URL`, `VNPAY_RETURN_URL`, `VNPAY_IPN_URL`
    *(Estimate: 2.5h · Priority: High · Blocking TSK-039, TSK-040)*

- [x] **TSK-037** `[INFRA]` `src/lib/email.ts` (Nodemailer Gmail SMTP): `sendOtpEmail(to, otp)`, `sendBookingConfirmed(to, bookingDetails)`, `sendBookingCancelled(to, bookingDetails)` — HTML template inline. Config từ env: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`. *(Estimate: 2h · Priority: Medium · Blocking TSK-016, TSK-040)*

### BE làm tiếp

- [x] **TSK-038** `[BE]` `src/services/booking.service.ts`:
    - `checkOverlap(propertyId, checkIn, checkOut)` — Prisma query tìm booking PENDING_PAYMENT/CONFIRMED trùng ngày
    - `calculatePrice(property, checkIn, checkOut)` → `{ nightlyPrice, nights, cleaningFee, serviceFee, subtotalPrice, totalPrice }`
    - `createBooking(data, session)` — gọi checkOverlap → tính giá → validate + snapshot discount → tạo Booking PENDING_PAYMENT + Payment PENDING trong transaction
    - `cancelBooking(bookingId, userId)` — kiểm tra ownership + state hợp lệ → cập nhật CANCELLED
    *(Estimate: 3h · Priority: Urgent · Blocking TSK-039, TSK-040)*

- [x] **TSK-039** `[BE]` Booking Route Handlers `src/app/api/bookings/`:
    - `POST /api/bookings/check-availability` — gọi `checkOverlap`, trả `ERR_ROOM_NOT_AVAILABLE` nếu trùng
    - `POST /api/bookings` — gọi `createBooking` → gọi `vnpay.buildPaymentUrl()` → trả `{ bookingId, vnpayUrl }`
    - `GET /api/bookings` — danh sách booking của user đang login, filter by status
    - `GET /api/bookings/[id]` — detail booking (kiểm tra ownership hoặc ADMIN)
    - `PATCH /api/bookings/[id]/cancel` — gọi `cancelBooking`
    *(Estimate: 2.5h · Priority: Urgent · phụ thuộc TSK-036, TSK-038)*

- [x] **TSK-040** `[BE]` `src/services/discount.service.ts` + Route Handler:
    - `validateDiscount(code, subtotal)` — check active, trong thời hạn, usedCount < usageLimit, subtotal >= minimumAmount → tính `discountAmount` (PERCENT: `min(value% × subtotal, cap)`, FIXED: `min(value, subtotal)`)
    - `POST /api/discounts/validate` — preview discount, không tăng usedCount
    *(Estimate: 2h · Priority: High · phụ thuộc TSK-033)*

- [x] **TSK-041** `[BE]` Payment Route Handlers:
    - `GET /api/payments/vnpay/ipn` — verify checksum (`vnpay.verifyIpn`), verify amount khớp với Payment record, idempotent update: payment SUCCESS/FAILED + booking CONFIRMED/CANCELLED + tăng `discountCode.usedCount` (nếu có) trong một Prisma transaction, gọi `email.sendBookingConfirmed` sau success; trả `{ RspCode: "00", Message: "OK" }` cho VNPay
    - `GET /api/payments/bookings/[bookingId]/status` — trả payment status để FE polling
    *(Estimate: 3h · Priority: High · phụ thuộc TSK-036, TSK-037, TSK-038)*

- [x] **TSK-042** `[BE]` `src/services/review.service.ts` + Route Handlers:
    - `POST /api/reviews` — chỉ cho phép khi booking COMPLETED + booking chưa có review + user là guest của booking → tạo Review → cập nhật `property.ratingAvg` (AVG query)
    - `GET /api/properties/[id]/reviews` — danh sách review kèm tên guest, rating, comment, createdAt
    *(Estimate: 2h · Priority: Medium · phụ thuộc TSK-035)*

### FE làm tiếp

- [x] **TSK-043** `[FE]` `src/app/(guest)/properties/[id]/book/page.tsx` + `src/components/booking/BookingForm.tsx` (Client Component):
    - Hiển thị tên property, check-in/check-out, số khách (nhận từ URL params)
    - Bảng giá: giá/đêm × số đêm, cleaning fee, service fee, tổng trước discount
    - Promo code: input + nút Apply → `useMutation` gọi `POST /api/discounts/validate` → hiển thị dòng giảm giá nếu hợp lệ, báo lỗi nếu không
    - Nút "Thanh toán qua VNPay" → `useMutation` gọi `POST /api/bookings` → `window.location.href = vnpayUrl`
    *(Estimate: 3h · Priority: Urgent · phụ thuộc TSK-039, TSK-040)*

- [x] **TSK-044** `[FE]` `src/app/(guest)/payments/vnpay/return/page.tsx` (Client Component): lấy `bookingId` từ URL query params, polling `GET /api/payments/bookings/[id]/status` mỗi 2 giây bằng `useQuery` với `refetchInterval`, hiển thị skeleton "Đang xác minh thanh toán...", redirect sang `/bookings` sau khi payment SUCCESS hoặc FAILED. *(Estimate: 1.5h · Priority: Medium · phụ thuộc TSK-041)*

- [x] **TSK-045** `[FE]` `src/app/(guest)/bookings/page.tsx`: Tabs (Upcoming / Pending / Completed / Cancelled) dùng shadcn Tabs, mỗi tab gọi `GET /api/bookings?status=...` bằng React Query. Booking card: ảnh property, tên, ngày, số khách, status badge, nút View Detail + Cancel (confirm dialog trước khi cancel). *(Estimate: 2.5h · Priority: High · phụ thuộc TSK-039)*

- [x] **TSK-046** `[FE]` `src/app/(guest)/bookings/[id]/page.tsx` (Server Component): chi tiết booking — mã booking, tên property (link), tên guest, ngày check-in/check-out, số khách, bảng giá breakdown (nightly × nights, cleaning fee, service fee, discount nếu có, total), payment status badge, booking status badge. *(Estimate: 1.5h · Priority: High · phụ thuộc TSK-039)*

- [ ] **TSK-047** `[FE]` Tích hợp review vào UI: trên trang `/bookings/[id]` nếu booking COMPLETED và chưa có review → hiển thị form đánh giá (rating 1-5 sao + textarea comment, submit gọi `POST /api/reviews`). Trên trang `/properties/[id]` hiển thị danh sách review (rating, comment, tên guest, ngày) gọi `GET /api/properties/[id]/reviews`. *(Estimate: 2.5h · Priority: Medium · phụ thuộc TSK-042)*

---

# INTEGRATION & TESTING
> **INFRA** phụ trách setup testing framework và CI. **BE** viết unit/integration test cho service và API. **FE** viết E2E test cho luồng chính.

- [ ] **TSK-048** `[INFRA]` Setup testing: cài Jest + ts-jest cho unit test, Playwright cho E2E. Tạo `jest.config.ts`, `playwright.config.ts`. Cấu hình test database (biến `DATABASE_URL_TEST` trong `.env.example`). *(Estimate: 1.5h · Priority: High)*

- [ ] **TSK-049** `[BE]` Unit tests (Jest) cho service layer: `booking.service` (overlap check — trùng, không trùng, edge case cùng ngày), `discount.service` (PERCENT/FIXED, expired, over-limit, under-minimum), `vnpay` (HMAC build và verify — valid, tampered amount, wrong hash). *(Estimate: 3h · Priority: High · phụ thuộc TSK-048)*

- [ ] **TSK-050** `[BE]` Integration tests cho Route Handlers quan trọng (dùng test DB): `POST /api/bookings` (tạo thành công, trùng ngày), `GET /api/payments/vnpay/ipn` (IPN thành công, IPN duplicate, sai amount, sai checksum). *(Estimate: 3h · Priority: High · phụ thuộc TSK-048)*

- [ ] **TSK-051** `[FE]` E2E test Playwright: luồng chính Search → Property Detail → Check Availability → Booking Page → (mock VNPay IPN) → My Bookings CONFIRMED → Viết Review. *(Estimate: 3h · Priority: Medium · phụ thuộc TSK-048)*

- [ ] **TSK-052** `[INFRA]` `Dockerfile` production (multi-stage: `node:20-alpine` build → `node:20-alpine` runtime, chạy `prisma generate` trong build stage). Verify `docker compose up -d --build` chạy full stack. *(Estimate: 1.5h · Priority: High)*

- [ ] **TSK-053** `[INFRA]` `.github/workflows/ci.yml`: trigger trên PR vào `dev` — `pnpm install` → `pnpm typecheck` → `pnpm lint` → `pnpm test` (unit) → build check `pnpm build`. *(Estimate: 1h · Priority: Medium)*

- [ ] **TSK-054** `[INFRA · BE · FE]` Review chéo cuối: INFRA kiểm tra `.env.example` đủ biến, không có credential trong source; BE kiểm tra không có Prisma model trả trực tiếp ra API, không có `catch` rỗng; FE kiểm tra không có `console.log` trong code, loading/error state đầy đủ. *(Estimate: 2h · Priority: High)*

- [ ] **TSK-055** `[INFRA]` Cập nhật README: hướng dẫn setup local (clone → `.env.local` → `docker compose up -d db` → `pnpm prisma migrate dev` → `pnpm dev`), screenshot các trang chính. *(Estimate: 1h · Priority: Low)*

---

# Project Done Checklist

- [ ] `pnpm dev` chạy được sau `docker compose up -d db` + `pnpm prisma migrate dev`.
- [ ] Đăng ký tài khoản mới, nhận OTP email, xác minh thành công.
- [ ] Đăng nhập bằng Credentials và Google OAuth, `role` đúng trong session.
- [ ] `middleware.ts` chặn đúng route theo role — Guest vào `/admin` bị redirect.
- [ ] Search property theo địa điểm + ngày + số khách, filter + sort + pagination hoạt động.
- [ ] Check availability: từ chối đúng nếu trùng ngày booking CONFIRMED/PENDING_PAYMENT.
- [ ] Flow đặt phòng: Booking Page → nhập promo code → thanh toán VNPay → IPN verified → booking CONFIRMED → redirect My Bookings.
- [ ] VNPay IPN: idempotent (gọi 2 lần không bị double-confirm), verify checksum + amount, không xác nhận từ return URL.
- [ ] Guest cancel booking hợp lệ (PENDING_PAYMENT hoặc CONFIRMED → CANCELLED).
- [ ] Sau booking COMPLETED, guest viết được review, hiển thị trên property detail với rating cập nhật.
- [ ] Host xem được danh sách property và booking requests trên Host Dashboard.
- [ ] Admin xem được dashboard tổng quan và danh sách booking toàn hệ thống.
- [ ] Email OTP đăng ký và email booking CONFIRMED/CANCELLED được gửi đúng.
- [ ] `docker compose up -d --build` chạy full stack không lỗi.
- [ ] CI pipeline (typecheck + lint + test) pass trên mọi PR vào `dev`.

---

# Post-MVP (Optional)

- [ ] Wishlist — lưu property yêu thích (thêm model `Wishlist`, UI icon tim).
- [ ] Cache `ratingAvg` bằng Redis hoặc Postgres materialized view thay vì AVG query mỗi lần.
- [ ] MoMo / ZaloPay — abstraction `PaymentProvider` interface, thêm implementation mới.
- [ ] Refund flow — hoàn tiền qua VNPay Refund API khi cancel sau confirmed.
- [ ] Real-time notification (Pusher hoặc SSE) thay vì chỉ email.
- [ ] Rate limiting cho `/api/auth/` chống brute-force (middleware + Redis counter).
- [ ] Admin export báo cáo CSV booking theo tháng.
- [ ] Tự động huỷ booking PENDING_PAYMENT quá 15 phút (Vercel Cron hoặc BullMQ).
