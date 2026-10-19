import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Headphones,
  CreditCard,
  Award,
} from "lucide-react";

import { HeroSearchBar } from "@/components/property/HeroSearchBar";
import { PropertyCard } from "@/components/property/PropertyCard";
import { POPULAR_DESTINATIONS, MOCK_PROPERTIES } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { displayPlace } from "@/lib/auth-ui";
import { listProperties } from "@/services/property.service";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  const isHostOrAdmin =
    session?.user?.role === "HOST" || session?.user?.role === "ADMIN";

  // Fetch real properties from database using Prisma service (TSK-028)
  let properties: Awaited<ReturnType<typeof listProperties>>["properties"] = [];
  try {
    const res = await listProperties({}, 1, 8);
    properties = res.properties;
  } catch {
    properties = [];
  }

  const displayProperties =
    properties.length > 0
      ? properties
      : (MOCK_PROPERTIES as unknown as typeof properties);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 py-20 px-4 sm:px-6 lg:px-8">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1920&q=80"
            alt="Hero Background"
            fill
            priority
            className="size-full object-cover opacity-40 brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md shadow-sm">
            <Sparkles className="size-3.5 text-amber-400" />
            <span>Nền tảng homestay & biệt thự nghỉ dưỡng hàng đầu</span>
          </div>

          {/* Heading */}
          <h1 className="mt-6 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Khám phá kỳ nghỉ hoàn hảo của bạn
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-slate-200">
            Trải nghiệm các homestay duyên dáng, căn hộ cao cấp và biệt thự ven
            biển trên khắp Việt Nam. Thanh toán an toàn qua cổng VNPay.
          </p>

          {/* Search Bar Pill */}
          <div className="mt-8">
            <HeroSearchBar />
          </div>
        </div>
      </section>

      {/* 2. Popular Destinations Section (TSK-028: Popular Destinations 5+ thành phố) */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Award className="size-4" />
              <span>Khám phá Việt Nam</span>
            </div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-foreground">
              Điểm đến nổi bật (Popular Destinations)
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Các thành phố du lịch được yêu thích nhất với hàng trăm chỗ ở lý
              tưởng
            </p>
          </div>

          <Button
            asChild
            variant="ghost"
            className="mt-4 sm:mt-0 font-semibold text-primary"
          >
            <Link href="/search" className="flex items-center gap-1">
              Xem tất cả điểm đến
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>

        {/* Destination Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          {POPULAR_DESTINATIONS.map((dest) => (
            <Link
              key={dest.id}
              href={`/search?location=${encodeURIComponent(dest.name)}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                <Image
                  src={dest.image}
                  alt={displayPlace(dest.name)}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12.5vw"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-3 bottom-3 text-white">
                  <h3 className="text-base font-bold leading-tight">
                    {displayPlace(dest.name)}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-200">
                    {dest.propertiesCount} chỗ ở
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Properties Section (TSK-028) */}
      <section className="bg-muted/40 py-16 px-4 sm:px-6 lg:px-8 border-y border-border">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Gợi ý hàng đầu
              </p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-foreground">
                Chỗ ở nổi bật (Featured Properties)
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Được đánh giá cao và đặt nhiều nhất bởi cộng đồng du lịch
                StayHub
              </p>
            </div>

            <Button asChild variant="outline" className="mt-4 sm:mt-0">
              <Link href="/search">Xem thêm chỗ ở</Link>
            </Button>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. StayHub Trust Pillars */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Du lịch an tâm cùng StayHub
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Bảo vệ toàn diện, thanh toán an toàn và hỗ trợ tận tình trong mỗi
            chuyến đi
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card shadow-xs">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="size-7" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-foreground">
              Bảo vệ StayCover
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Cam kết chỗ ở chính xác như hình ảnh mô tả. Đảm bảo hoàn tiền hoặc
              đổi phòng nếu có vấn đề.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card shadow-xs">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <CreditCard className="size-7" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-foreground">
              Cổng thanh toán VNPay
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Giao dịch trực tuyến nhanh chóng, bảo mật qua QR-Code và thẻ ngân
              hàng Việt Nam.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card shadow-xs">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
              <Headphones className="size-7" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-foreground">
              Hỗ trợ khách hàng 24/7
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Đội ngũ tư vấn luôn sẵn sàng giải đáp thắc mắc và hỗ trợ nhận
              phòng bất cứ lúc nào.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Become a Host Banner (Hidden for GUEST / unauthenticated visitors) */}
      {isHostOrAdmin && (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 w-full">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 sm:p-14 text-white shadow-xl">
            <div className="relative z-10 max-w-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Cộng tác cùng StayHub
              </span>
              <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold leading-tight">
                Bạn có phòng hoặc nhà muốn cho thuê?
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                Gia nhập mạng lưới Host của StayHub để tiếp cận hàng triệu du
                khách và quản lý doanh thu dễ dàng.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-primary text-white hover:bg-primary/90 font-bold px-7"
                >
                  <Link href="/host">Trở thành Host ngay</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 font-bold px-7"
                >
                  <Link href="/host">Tìm hiểu thêm</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
