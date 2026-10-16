"use client";

import * as React from "react";
import { SlidersHorizontal, ChevronDown, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { displayPlace } from "@/lib/auth-ui";

export interface FilterState {
  priceRange: [number, number];
  propertyTypes: string[];
  amenities: string[];
  sortBy: string;
}

interface FilterToolbarProps {
  totalResults: number;
  locationName: string;
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onClearAll: () => void;
}

const PROPERTY_TYPES = [
  { id: "APARTMENT", label: "Premium apartment" },
  { id: "VILLA", label: "Entire villa" },
  { id: "HOUSE", label: "Entire house" },
  { id: "STUDIO", label: "Studio apartment" },
];

const COMMON_AMENITIES = [
  "Bể bơi vô cực riêng",
  "Hồ bơi tầng thượng 360 độ",
  "Wifi tốc độ cao (150 Mbps)",
  "Bàn làm việc chuyên dụng",
  "Bếp nấu đầy đủ dụng cụ",
  "Máy giặt & sấy đồ",
  "Bãi đỗ ô tô miễn phí",
  "Bồn tắm massage Jacuzzi",
  "Ban công ngắm biển trọn vẹn",
  "Lối đi thẳng ra bãi biển riêng",
];

const AMENITY_LABELS: Record<string, string> = Object.fromEntries(
  COMMON_AMENITIES.map((value, index) => [
    value,
    [
      "Private infinity pool",
      "360-degree rooftop pool",
      "High-speed Wi-Fi (150 Mbps)",
      "Dedicated workspace",
      "Fully equipped kitchen",
      "Washer & dryer",
      "Free parking",
      "Jacuzzi bathtub",
      "Ocean-view balcony",
      "Direct private beach access",
    ][index],
  ])
);

const SORT_OPTIONS = [
  { id: "recommended", label: "Recommended" },
  { id: "price_asc", label: "Price: low to high" },
  { id: "price_desc", label: "Price: high to low" },
  { id: "rating", label: "Top rated" },
];

export function FilterToolbar({
  totalResults,
  locationName,
  filters,
  onFilterChange,
  onClearAll,
}: FilterToolbarProps) {
  const [openDropdown, setOpenDropdown] = React.useState<
    "price" | "type" | "amenity" | "sort" | null
  >(null);

  // Active filter chip count
  const activeChips: { type: string; id: string; label: string }[] = [];

  if (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000000) {
    activeChips.push({
      type: "price",
      id: "price",
      label: `${(filters.priceRange[0] / 1000).toLocaleString("vi-VN")}k - ${(filters.priceRange[1] / 1000).toLocaleString("vi-VN")}k`,
    });
  }

  filters.propertyTypes.forEach((t) => {
    const found = PROPERTY_TYPES.find((item) => item.id === t);
    if (found) {
      activeChips.push({ type: "type", id: t, label: found.label });
    }
  });

  filters.amenities.forEach((a) => {
    activeChips.push({ type: "amenity", id: a, label: AMENITY_LABELS[a] ?? a });
  });

  const removeChip = (chip: { type: string; id: string }) => {
    if (chip.type === "price") {
      onFilterChange({ ...filters, priceRange: [0, 5000000] });
    } else if (chip.type === "type") {
      onFilterChange({
        ...filters,
        propertyTypes: filters.propertyTypes.filter((t) => t !== chip.id),
      });
    } else if (chip.type === "amenity") {
      onFilterChange({
        ...filters,
        amenities: filters.amenities.filter((a) => a !== chip.id),
      });
    }
  };

  return (
    <div className="w-full border-b border-border bg-card py-4 sticky top-[72px] z-30 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top: Results Title & Quick Filter Popovers */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Result Title */}
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              {totalResults} stays{" "}
              {locationName ? `in ${displayPlace(locationName)}` : "found"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Listed prices include taxes and platform service fees
            </p>
          </div>

          {/* Filter Popover Buttons */}
          <div className="flex flex-wrap items-center gap-2 relative">
            {/* 1. Price Filter Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(openDropdown === "price" ? null : "price")
                }
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                  filters.priceRange[0] > 0 || filters.priceRange[1] < 5000000
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                <span>Price range</span>
                <ChevronDown className="size-3.5" />
              </button>

              {openDropdown === "price" && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-border bg-card p-4 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
                  <p className="text-xs font-bold text-foreground mb-3">
                    Price per night
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>
                        {filters.priceRange[0].toLocaleString("vi-VN")}₫
                      </span>
                      <span>-</span>
                      <span>
                        {filters.priceRange[1].toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                    <input
                      type="range"
                      min={500000}
                      max={5000000}
                      step={200000}
                      value={filters.priceRange[1]}
                      onChange={(e) =>
                        onFilterChange({
                          ...filters,
                          priceRange: [
                            filters.priceRange[0],
                            parseInt(e.target.value),
                          ],
                        })
                      }
                      className="w-full accent-primary cursor-pointer"
                    />
                    <div className="flex justify-between pt-2 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onFilterChange({
                            ...filters,
                            priceRange: [0, 5000000],
                          })
                        }
                      >
                        Reset
                      </Button>
                      <Button size="sm" onClick={() => setOpenDropdown(null)}>
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Property Type Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(openDropdown === "type" ? null : "type")
                }
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                  filters.propertyTypes.length > 0
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                <span>Property type</span>
                {filters.propertyTypes.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="size-4 p-0 text-[10px] flex items-center justify-center rounded-full"
                  >
                    {filters.propertyTypes.length}
                  </Badge>
                )}
                <ChevronDown className="size-3.5" />
              </button>

              {openDropdown === "type" && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-border bg-card p-4 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
                  <p className="text-xs font-bold text-foreground mb-3">
                    Choose property types
                  </p>
                  <div className="space-y-2.5">
                    {PROPERTY_TYPES.map((type) => {
                      const isChecked = filters.propertyTypes.includes(type.id);
                      return (
                        <label
                          key={type.id}
                          className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer hover:text-primary transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const newTypes = isChecked
                                ? filters.propertyTypes.filter(
                                    (t) => t !== type.id
                                  )
                                : [...filters.propertyTypes, type.id];
                              onFilterChange({
                                ...filters,
                                propertyTypes: newTypes,
                              });
                            }}
                            className="size-4 rounded border-border accent-primary cursor-pointer"
                          />
                          <span>{type.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-2 border-t border-border flex justify-end">
                    <Button size="sm" onClick={() => setOpenDropdown(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Amenities Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(openDropdown === "amenity" ? null : "amenity")
                }
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                  filters.amenities.length > 0
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                <span>Amenities</span>
                {filters.amenities.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="size-4 p-0 text-[10px] flex items-center justify-center rounded-full"
                  >
                    {filters.amenities.length}
                  </Badge>
                )}
                <ChevronDown className="size-3.5" />
              </button>

              {openDropdown === "amenity" && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-border bg-card p-4 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
                  <p className="text-xs font-bold text-foreground mb-3">
                    Popular amenities
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {COMMON_AMENITIES.map((amenity) => {
                      const isChecked = filters.amenities.includes(amenity);
                      return (
                        <label
                          key={amenity}
                          className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer hover:text-primary transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const newAmenities = isChecked
                                ? filters.amenities.filter((a) => a !== amenity)
                                : [...filters.amenities, amenity];
                              onFilterChange({
                                ...filters,
                                amenities: newAmenities,
                              });
                            }}
                            className="size-4 rounded border-border accent-primary cursor-pointer"
                          />
                          <span className="truncate">
                            {AMENITY_LABELS[amenity]}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-2 border-t border-border flex justify-end">
                    <Button size="sm" onClick={() => setOpenDropdown(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Sort By Dropdown (Recommended) */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(openDropdown === "sort" ? null : "sort")
                }
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-all"
              >
                <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                <span>
                  {SORT_OPTIONS.find((s) => s.id === filters.sortBy)?.label ||
                    "Recommended"}
                </span>
                <ChevronDown className="size-3.5" />
              </button>

              {openDropdown === "sort" && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-border bg-card p-2 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onFilterChange({ ...filters, sortBy: opt.id });
                        setOpenDropdown(null);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs text-left transition-colors ${
                        filters.sortBy === opt.id
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom: Active Filter Chips & Clear All Button (Matching Figure 5.9 & Table 5.6) */}
        {activeChips.length > 0 && (
          <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-3 border-t border-border">
            <span className="text-xs font-semibold text-muted-foreground mr-1">
              Filtering by:
            </span>

            {activeChips.map((chip) => (
              <span
                key={`${chip.type}-${chip.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              >
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={() => removeChip(chip)}
                  aria-label={`Remove filter ${chip.label}`}
                  className="rounded-full hover:bg-primary/20 p-0.5"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}

            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1 text-xs font-semibold text-destructive hover:underline ml-2"
            >
              <RotateCcw className="size-3" />
              <span>Clear all filters</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
