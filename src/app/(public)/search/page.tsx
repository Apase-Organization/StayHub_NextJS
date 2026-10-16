import Link from "next/link";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

import { searchProperties } from "@/services/search.service";
import { PropertyCard } from "@/components/property/PropertyCard";
import { SearchFilterSidebar } from "@/components/property/SearchFilterSidebar";
import { Button } from "@/components/ui/button";
import { MOCK_PROPERTIES } from "@/lib/mock-data";

interface SearchPageProps {
  searchParams: Promise<{
    location?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    minPrice?: string;
    maxPrice?: string;
    type?:
      "APARTMENT" | "HOUSE" | "VILLA" | "HOTEL_ROOM" | "HOMESTAY" | "RESORT";
    bedrooms?: string;
    minRating?: string;
    sort?: "price-asc" | "price-desc" | "rating-desc";
    page?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = 9;

  let properties: Awaited<ReturnType<typeof searchProperties>>["properties"] =
    [];
  let total = 0;
  let totalPages = 1;

  try {
    const res = await searchProperties({
      location: params.location,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      guests: params.guests ? parseInt(params.guests, 10) : undefined,
      minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
      type: params.type,
      bedrooms: params.bedrooms ? parseInt(params.bedrooms, 10) : undefined,
      minRating: params.minRating ? parseFloat(params.minRating) : undefined,
      sort: params.sort,
      page,
      limit,
    });

    properties = res.properties;
    total = res.total;
    totalPages = res.totalPages;
  } catch {
    properties = [];
    total = 0;
    totalPages = 1;
  }

  // Fallback to mock data if DB empty
  if (total === 0 && !params.location && !params.type && !params.minPrice) {
    properties = MOCK_PROPERTIES as unknown as typeof properties;
    total = MOCK_PROPERTIES.length;
    totalPages = Math.ceil(total / limit);
  }

  // Helper to build pagination links
  const createPageUrl = (targetPage: number) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v && k !== "page") p.set(k, v);
    });
    p.set("page", targetPage.toString());
    return `/search?${p.toString()}`;
  };

  const createSortUrl = (sortVal: string) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v && k !== "sort") p.set(k, v);
    });
    if (sortVal) p.set("sort", sortVal);
    p.set("page", "1");
    return `/search?${p.toString()}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Info */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {params.location
              ? `Chỗ ở tại "${params.location}"`
              : "Khám phá tất cả chỗ ở"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tìm thấy <span className="font-bold text-foreground">{total}</span>{" "}
            kết quả phù hợp với tiêu chí của bạn.
          </p>
        </div>

        {/* Sort Controls & Mobile Filter Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          <SearchFilterSidebar mode="mobile" />

          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1 text-xs">
            <span className="px-2 text-muted-foreground font-medium hidden sm:inline">
              Sắp xếp:
            </span>
            <Link
              href={createSortUrl("")}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                !params.sort
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Phù hợp
            </Link>
            <Link
              href={createSortUrl("price-asc")}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                params.sort === "price-asc"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Giá tăng dần
            </Link>
            <Link
              href={createSortUrl("rating-desc")}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                params.sort === "rating-desc"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Đánh giá cao
            </Link>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid (3/12 Sidebar + 9/12 Listing) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Sidebar 3/12 Desktop */}
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-24">
            <SearchFilterSidebar mode="desktop" />
          </div>
        </aside>

        {/* Property List 9/12 */}
        <main className="min-w-0 lg:col-span-9">
          {properties.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Search className="size-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">
                Không tìm thấy chỗ ở phù hợp
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Hãy thử nới lỏng khoảng giá, thay đổi loại hình phòng hoặc chọn
                địa điểm khác.
              </p>
              <div className="mt-6">
                <Button asChild variant="outline">
                  <Link href="/search">Xoá toàn bộ bộ lọc</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>

              {/* Pagination with Links */}
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-6 border-t border-border">
                  {page > 1 ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={createPageUrl(page - 1)}>
                        <ChevronLeft className="mr-1 size-4" /> Trang trước
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <ChevronLeft className="mr-1 size-4" /> Trang trước
                    </Button>
                  )}

                  <span className="px-3 text-xs font-semibold text-muted-foreground">
                    Trang {page} / {totalPages}
                  </span>

                  {page < totalPages ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={createPageUrl(page + 1)}>
                        Trang sau <ChevronRight className="ml-1 size-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      Trang sau <ChevronRight className="ml-1 size-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
