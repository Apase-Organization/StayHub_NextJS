"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const PROPERTY_TYPES = [
  { id: "APARTMENT", label: "Căn hộ cao cấp" },
  { id: "VILLA", label: "Biệt thự nguyên căn" },
  { id: "HOUSE", label: "Nhà phố riêng tư" },
  { id: "HOMESTAY", label: "Homestay ấm cúng" },
  { id: "HOTEL_ROOM", label: "Phòng khách sạn" },
  { id: "RESORT", label: "Resort nghỉ dưỡng" },
];

interface SearchFilterSidebarProps {
  mode?: "desktop" | "mobile" | "both";
}

export function SearchFilterSidebar({
  mode = "both",
}: SearchFilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local state initialized from searchParams
  const [minPrice, setMinPrice] = React.useState(
    searchParams.get("minPrice") || ""
  );
  const [maxPrice, setMaxPrice] = React.useState(
    searchParams.get("maxPrice") || ""
  );
  const [selectedType, setSelectedType] = React.useState(
    searchParams.get("type") || ""
  );
  const [bedrooms, setBedrooms] = React.useState(
    searchParams.get("bedrooms") || ""
  );
  const [minRating, setMinRating] = React.useState(
    searchParams.get("minRating") || ""
  );
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  // Sync with searchParams
  React.useEffect(() => {
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
    setSelectedType(searchParams.get("type") || "");
    setBedrooms(searchParams.get("bedrooms") || "");
    setMinRating(searchParams.get("minRating") || "");
  }, [searchParams]);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");

    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");

    if (selectedType) params.set("type", selectedType);
    else params.delete("type");

    if (bedrooms) params.set("bedrooms", bedrooms);
    else params.delete("bedrooms");

    if (minRating) params.set("minRating", minRating);
    else params.delete("minRating");

    params.set("page", "1"); // reset page on filter change

    router.push(`${pathname}?${params.toString()}`);
    setIsMobileOpen(false);
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("type");
    params.delete("bedrooms");
    params.delete("minRating");
    params.set("page", "1");

    setMinPrice("");
    setMaxPrice("");
    setSelectedType("");
    setBedrooms("");
    setMinRating("");

    router.push(`${pathname}?${params.toString()}`);
    setIsMobileOpen(false);
  };

  const hasActiveFilters = Boolean(
    minPrice || maxPrice || selectedType || bedrooms || minRating
  );

  const filterContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h3 className="font-bold text-foreground flex items-center gap-2 text-base">
          <SlidersHorizontal className="size-4" /> Bộ lọc tìm kiếm
        </h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
          >
            <RotateCcw className="mr-1 size-3" /> Xoá lọc
          </Button>
        )}
      </div>

      {/* Khoảng giá (VND) */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
          Khoảng giá mỗi đêm (VND)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-muted-foreground">Tối thiểu</span>
            <Input
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="mt-1 text-xs"
            />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground">Tối đa</span>
            <Input
              type="number"
              placeholder="10.000.000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="mt-1 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Loại hình lưu trú */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
          Loại hình chỗ ở
        </label>
        <div className="space-y-1.5">
          {PROPERTY_TYPES.map((t) => (
            <label
              key={t.id}
              className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer hover:text-primary transition-colors py-1"
            >
              <input
                type="radio"
                name="propType"
                checked={selectedType === t.id}
                onChange={() =>
                  setSelectedType(selectedType === t.id ? "" : t.id)
                }
                className="size-4 rounded border-border text-primary focus:ring-primary"
              />
              <span>{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Phòng ngủ */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
          Số phòng ngủ tối thiểu
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {["", "1", "2", "3+"].map((val) => {
            const actualVal = val === "3+" ? "3" : val;
            const isSelected = bedrooms === actualVal;
            return (
              <Button
                key={val || "any"}
                type="button"
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className="text-xs h-8"
                onClick={() => setBedrooms(actualVal)}
              >
                {val || "Bất kỳ"}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Đánh giá tối thiểu */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
          Đánh giá trung bình
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { val: "", label: "Tất cả" },
            { val: "4", label: "4.0★ +" },
            { val: "4.5", label: "4.5★ +" },
          ].map((item) => (
            <Button
              key={item.val}
              type="button"
              variant={minRating === item.val ? "default" : "outline"}
              size="sm"
              className="text-xs h-8"
              onClick={() => setMinRating(item.val)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2">
        <Button onClick={applyFilters} className="w-full text-xs font-bold">
          Áp dụng bộ lọc
        </Button>
      </div>
    </div>
  );

  const renderDesktop = mode === "desktop" || mode === "both";
  const renderMobile = mode === "mobile" || mode === "both";

  return (
    <>
      {/* Desktop Sidebar (3/12) */}
      {renderDesktop && (
        <div
          className={
            mode === "desktop"
              ? "rounded-2xl border border-border bg-card p-5 shadow-sm"
              : "hidden lg:block rounded-2xl border border-border bg-card p-5 shadow-sm"
          }
        >
          {filterContent}
        </div>
      )}

      {/* Mobile Filter Button & Dialog Bottom Sheet */}
      {renderMobile && (
        <div className={mode === "mobile" ? "lg:hidden" : "lg:hidden"}>
          <Dialog open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="size-4" />
                Bộ lọc
                {hasActiveFilters && (
                  <Badge className="size-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                    !
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Bộ lọc tìm kiếm chỗ ở</DialogTitle>
              </DialogHeader>
              <div className="py-2">{filterContent}</div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </>
  );
}
