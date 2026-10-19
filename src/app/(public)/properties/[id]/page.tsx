import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Star,
  MapPin,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  Building2,
  MessageSquare,
} from "lucide-react";

import { getProperty } from "@/services/property.service";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AvailabilityChecker } from "@/components/property/AvailabilityChecker";
import { PropertyHostActions } from "@/components/property";
import { displayPlace } from "@/lib/auth-ui";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils";

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { id } = await params;

  // 1. Fetch real property from Prisma
  const property = await getProperty(id);
  if (!property) {
    notFound();
  }

  // 2. Fetch real reviews for this property from DB
  let reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    guest: { fullName: string };
  }> = [];

  try {
    reviews = await prisma.review.findMany({
      where: { propertyId: id },
      include: { guest: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    reviews = [];
  }

  const galleryImages =
    property.images.length > 0
      ? property.images.map((i) => i.url)
      : ["/placeholder-room.jpg"];

  const session = await auth();
  const isOwner = Boolean(
    session?.user?.id &&
      (session.user.id === property.host?.id || session.user.role === "ADMIN")
  );

  const hostPropertyForEdit = {
    id: property.id,
    title: property.title,
    description: property.description || "",
    city: property.city,
    address: property.address,
    pricePerNight: property.pricePerNight,
    cleaningFee: property.cleaningFee,
    maxGuests: property.maxGuests,
    bedrooms: property.bedrooms ?? 1,
    beds: property.beds ?? 1,
    bathrooms: property.bathrooms ?? 1,
    type: property.type,
    status: (property.status === "INACTIVE" ? "INACTIVE" : "ACTIVE") as
      | "ACTIVE"
      | "INACTIVE",
    ratingAvg: property.ratingAvg,
    images: property.images.map((img) => ({
      id: img.id,
      url: img.url,
      isCover: img.isCover,
      publicId: img.publicId ?? undefined,
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 lg:pb-8 sm:px-6 lg:px-8">
      {/* 1. Breadcrumbs & Host Actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          <span>Về kết quả tìm kiếm</span>
        </Link>

        {isOwner && <PropertyHostActions property={hostPropertyForEdit} />}
      </div>

      {/* 2. Title & Metadata */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          {property.title}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-foreground">
          <div className="flex items-center gap-1 font-bold">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            <span>
              {property.ratingAvg > 0 ? property.ratingAvg.toFixed(1) : "Mới"}
            </span>
            <span className="font-normal text-muted-foreground underline">
              ({reviews.length} đánh giá)
            </span>
          </div>

          <span className="text-muted-foreground">·</span>

          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-4 text-primary shrink-0" />
            <span>
              {displayPlace(property.address)}, {displayPlace(property.city)}
            </span>
          </div>

          <span className="text-muted-foreground">·</span>

          <div className="flex items-center gap-1 font-semibold text-primary">
            <Building2 className="size-4" />
            <span>{property.type}</span>
          </div>
        </div>
      </div>

      {/* 3. 5-Photo Gallery Grid & Mobile Carousel (TSK-031) */}
      <section className="mt-6 flex md:grid md:grid-cols-4 gap-2.5 overflow-x-auto md:overflow-hidden rounded-2xl h-[280px] sm:h-[360px] lg:h-[460px] snap-x snap-mandatory scrollbar-none">
        {/* Main Large Image (2 cols on md) */}
        <div className="relative shrink-0 md:shrink w-[85vw] sm:w-[70vw] md:w-auto md:col-span-2 size-full overflow-hidden bg-muted snap-center rounded-xl md:rounded-none">
          <Image
            src={galleryImages[0]}
            alt={property.title}
            fill
            priority
            className="size-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>

        {/* 4 Small Images (2 cols, 2 rows on desktop; horizontal swipe on mobile) */}
        <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-2.5 size-full">
          {galleryImages.slice(1, 5).map((img, idx) => (
            <div
              key={idx}
              className="relative size-full overflow-hidden bg-muted"
            >
              <Image
                src={img}
                alt={`${property.title} - ảnh ${idx + 2}`}
                fill
                sizes="25vw"
                className="size-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          ))}
        </div>

        {/* Mobile-only additional slides */}
        {galleryImages.slice(1, 5).map((img, idx) => (
          <div
            key={`mobile-${idx}`}
            className="relative shrink-0 md:hidden w-[75vw] sm:w-[60vw] size-full overflow-hidden bg-muted snap-center rounded-xl"
          >
            <Image
              src={img}
              alt={`${property.title} - ảnh ${idx + 2}`}
              fill
              sizes="75vw"
              className="size-full object-cover"
            />
          </div>
        ))}
      </section>

      {/* 4. Main Content: Left Column (Details) & Right Column (Availability & Booking) */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column (Details) */}
        <div className="min-w-0 lg:col-span-2 space-y-8">
          {/* Host Profile & Room Specs */}
          <div className="flex items-center justify-between border-b border-border pb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Toàn bộ chỗ ở · Chủ nhà {property.host.fullName}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tối đa {property.maxGuests} khách · {property.bedrooms} phòng
                ngủ · {property.beds} giường · {property.bathrooms} phòng tắm
              </p>
            </div>

            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl border-2 border-primary/20 shadow-xs">
              {property.host.fullName[0] || "H"}
            </div>
          </div>

          {/* Highlights */}
          <div className="space-y-4 border-b border-border pb-6">
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Trải nghiệm nhận phòng tiện lợi
                </h3>
                <p className="text-xs text-muted-foreground">
                  Quy trình check-in tự động hoặc hỗ trợ nhanh từ chủ nhà.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Bảo vệ StayCover
                </h3>
                <p className="text-xs text-muted-foreground">
                  Bảo đảm hoàn tiền và hỗ trợ đổi phòng nếu thông tin không đúng
                  thực tế.
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border-b border-border pb-6">
            <h2 className="text-lg font-bold text-foreground mb-3">
              Mô tả về chỗ ở này
            </h2>
            <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Amenities Grid */}
          <div className="border-b border-border pb-6">
            <h2 className="text-lg font-bold text-foreground mb-4">
              Nơi này có những gì cho bạn (Tiện nghi)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {property.amenities.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 text-sm text-foreground"
                >
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews Section (TSK-031 / TSK-047) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-foreground">
                Đánh giá từ khách du lịch
              </h2>
              <span className="text-sm text-muted-foreground">
                ({reviews.length})
              </span>
            </div>

            {reviews.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                <MessageSquare className="size-6 mx-auto mb-2 opacity-50" />
                Chưa có đánh giá nào cho chỗ ở này. Hãy là vị khách đầu tiên
                trải nghiệm!
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-xl border border-border bg-card p-4 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {rev.guest.fullName[0] || "U"}
                        </div>
                        <span className="font-semibold text-sm text-foreground">
                          {rev.guest.fullName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold">{rev.rating}</span>
                        <span className="text-muted-foreground ml-2">
                          {formatDate(rev.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs sm:text-sm text-foreground/85 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky AvailabilityChecker & Price Box (TSK-031) */}
        <div className="min-w-0 lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <AvailabilityChecker
              propertyId={property.id}
              pricePerNight={property.pricePerNight}
              cleaningFee={property.cleaningFee}
              maxGuests={property.maxGuests}
              ratingAvg={property.ratingAvg}
              reviewCount={reviews.length}
            />
          </div>
        </div>
      </div>

      {/* Mobile Sticky Booking Bar (TSK-031) */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-md p-3.5 px-4 flex items-center justify-between lg:hidden shadow-xl">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-foreground">
              {formatPrice(property.pricePerNight)}
            </span>
            <span className="text-xs text-muted-foreground">/ đêm</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-foreground">
              {property.ratingAvg > 0 ? property.ratingAvg.toFixed(1) : "Mới"}
            </span>
            <span>({reviews.length} đánh giá)</span>
          </div>
        </div>
        <Button asChild className="font-bold text-sm px-6 shadow-md">
          <Link href={`/properties/${property.id}/book`}>Đặt phòng</Link>
        </Button>
      </div>
    </div>
  );
}
