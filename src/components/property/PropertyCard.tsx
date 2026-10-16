"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Heart } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { displayPlace } from "@/lib/auth-ui";

export interface PropertyCardData {
  id: string;
  title: string;
  city: string;
  propertyType?: string;
  type?: string;
  ratingAvg?: number;
  rating?: number;
  reviewCount?: number;
  pricePerNight: number;
  maxGuests?: number;
  bedrooms?: number;
  bathrooms?: number;
  isSuperhost?: boolean;
  images: Array<string | { url?: string; imageUrl?: string }>;
}

interface PropertyCardProps {
  property: PropertyCardData;
  className?: string;
}

export function PropertyCard({ property, className }: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [activeImageIdx, setActiveImageIdx] = React.useState(0);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const imageUrls = React.useMemo(() => {
    if (!property.images || property.images.length === 0) {
      return ["/placeholder-room.jpg"];
    }
    return property.images.map((img) => {
      if (typeof img === "string") return img;
      return img.url || img.imageUrl || "/placeholder-room.jpg";
    });
  }, [property.images]);

  const ratingVal = (property.ratingAvg ?? property.rating ?? 4.8).toFixed(1);
  const reviewsCount = property.reviewCount ?? 12;
  const pType = property.type || property.propertyType || "HOMESTAY";

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        className
      )}
    >
      {/* 1. Image Container with Carousel Dots & Favorite Button */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Link href={`/properties/${property.id}`} className="block size-full">
          <Image
            src={imageUrls[activeImageIdx] || imageUrls[0]}
            alt={property.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            priority={false}
          />
        </Link>

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={
            isFavorite ? "Remove from favorites" : "Save to favorites"
          }
          className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-black/25 backdrop-blur-md transition-all hover:scale-110 active:scale-95"
        >
          <Heart
            className={cn(
              "size-5 transition-colors",
              isFavorite
                ? "fill-[#ff4d4d] text-[#ff4d4d]"
                : "text-white fill-none stroke-[2]"
            )}
          />
        </button>

        {/* Superhost Badge */}
        {property.isSuperhost && (
          <div className="absolute left-3 top-3 z-10">
            <Badge
              variant="secondary"
              className="bg-card/90 font-semibold text-foreground backdrop-blur-md shadow-xs text-xs"
            >
              Superhost
            </Badge>
          </div>
        )}

        {/* Carousel Image Indicator Dots */}
        {imageUrls.length > 1 && (
          <div className="absolute bottom-2.5 inset-x-0 z-10 flex justify-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            {imageUrls.slice(0, 5).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveImageIdx(idx);
                }}
                aria-label={`View image ${idx + 1}`}
                className={cn(
                  "size-1.5 rounded-full transition-all",
                  activeImageIdx === idx
                    ? "w-4 bg-white"
                    : "bg-white/60 hover:bg-white"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* 2. Property Metadata */}
      <Link
        href={`/properties/${property.id}`}
        className="flex flex-1 flex-col p-4"
      >
        {/* City and Rating */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
            {displayPlace(property.city)} · {pType}
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-foreground shrink-0">
            <Star className="size-3.5 fill-[#f59e0b] text-[#f59e0b]" />
            <span>{ratingVal}</span>
            <span className="text-muted-foreground">({reviewsCount})</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-1.5 line-clamp-1 text-base font-semibold text-foreground transition-colors group-hover:text-primary">
          {property.title}
        </h3>

        {/* Room Specs */}
        <p className="mt-1 text-xs text-muted-foreground">
          {property.maxGuests || 2} khách · {property.bedrooms || 1} phòng ngủ ·{" "}
          {property.bathrooms || 1} phòng tắm
        </p>

        {/* Price & Night */}
        <div className="mt-4 flex flex-wrap gap-2 items-baseline justify-between border-t border-border pt-3">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-foreground">
              {formatPrice(property.pricePerNight)}
            </span>
            <span className="text-xs text-muted-foreground">/ đêm</span>
          </div>

          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            Huỷ miễn phí trong 48h
          </span>
        </div>
      </Link>
    </div>
  );
}
