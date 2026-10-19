"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, AlertCircle, Loader2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

interface AvailabilityCheckerProps {
  propertyId: string;
  pricePerNight: number;
  cleaningFee: number;
  maxGuests: number;
  ratingAvg: number;
}

export function AvailabilityChecker({
  propertyId,
  pricePerNight,
  cleaningFee,
  maxGuests,
  ratingAvg,
}: AvailabilityCheckerProps) {
  const router = useRouter();

  // Tomorrow & 3 days later defaults
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(threeDaysLater.getDate() + 4);

  const [checkIn, setCheckIn] = React.useState(
    tomorrow.toISOString().split("T")[0]
  );
  const [checkOut, setCheckOut] = React.useState(
    threeDaysLater.toISOString().split("T")[0]
  );
  const [guests, setGuests] = React.useState(2);
  const [isAvailable, setIsAvailable] = React.useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const nights = React.useMemo(() => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 1;
  }, [checkIn, checkOut]);

  const basePrice = pricePerNight * nights;
  const serviceFee = Math.round(basePrice * 0.1);
  const totalPrice = basePrice + cleaningFee + serviceFee;

  // React Query mutation to check availability
  const checkMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);
      const res = await fetch("/api/bookings/check-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, checkIn, checkOut }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Chỗ ở không còn trống trong khoảng ngày này"
        );
      }
      return data;
    },
    onSuccess: () => {
      setIsAvailable(true);
      setErrorMessage(null);
    },
    onError: (err: Error) => {
      setIsAvailable(false);
      setErrorMessage(err.message);
    },
  });

  const handleDateChange = (type: "in" | "out", val: string) => {
    setIsAvailable(null);
    setErrorMessage(null);
    if (type === "in") setCheckIn(val);
    else setCheckOut(val);
  };

  const handleReserve = () => {
    const url = `/properties/${propertyId}/book?checkIn=${encodeURIComponent(
      checkIn
    )}&checkOut=${encodeURIComponent(checkOut)}&guests=${guests}&nights=${nights}`;
    router.push(url);
  };

  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-lg">
      {/* Price Header */}
      <div className="flex flex-wrap gap-2 items-baseline justify-between pb-4 border-b border-border">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-foreground">
            {formatPrice(pricePerNight)}
          </span>
          <span className="text-xs text-muted-foreground">/ đêm</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          <span>{ratingAvg.toFixed(1)}</span>
        </div>
      </div>

      {/* Date & Guest Selectors */}
      <div className="mt-4 rounded-xl border border-border bg-muted/20 overflow-hidden divide-y divide-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 divide-y sm:divide-y-0 divide-border">
          <div className="p-2.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Nhận phòng
            </label>
            <Input
              type="date"
              value={checkIn}
              onChange={(e) => handleDateChange("in", e.target.value)}
              className="mt-0.5 h-7 border-0 bg-transparent p-0 text-xs font-semibold focus-visible:ring-0"
            />
          </div>
          <div className="p-2.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Trả phòng
            </label>
            <Input
              type="date"
              value={checkOut}
              onChange={(e) => handleDateChange("out", e.target.value)}
              className="mt-0.5 h-7 border-0 bg-transparent p-0 text-xs font-semibold focus-visible:ring-0"
            />
          </div>
        </div>
        <div className="p-2.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Khách (Tối đa {maxGuests})
          </label>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-foreground">
              {guests} người lớn & trẻ em
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="size-6 p-0 text-xs"
                disabled={guests <= 1}
                onClick={() => setGuests(guests - 1)}
              >
                -
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="size-6 p-0 text-xs"
                disabled={guests >= maxGuests}
                onClick={() => setGuests(guests + 1)}
              >
                +
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Availability Status Banner */}
      {isAvailable === true && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2.5 text-xs font-medium text-emerald-600 border border-emerald-500/20">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Chỗ ở còn trống trong khoảng ngày này!</span>
        </div>
      )}

      {errorMessage && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive border border-destructive/20">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Buttons */}
      <div className="mt-4 space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full text-xs font-semibold"
          disabled={checkMutation.isPending}
          onClick={() => checkMutation.mutate()}
        >
          {checkMutation.isPending ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="size-3.5 animate-spin" /> Đang kiểm tra
              phòng...
            </span>
          ) : (
            "Kiểm tra tình trạng trống"
          )}
        </Button>

        <Button
          type="button"
          size="lg"
          className="w-full font-bold shadow-md hover:shadow-lg transition-all"
          disabled={isAvailable === false}
          onClick={handleReserve}
        >
          Đặt phòng ngay
        </Button>
      </div>

      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Bạn sẽ chưa bị trừ tiền ở bước này.
      </p>

      {/* Price breakdown */}
      <div className="mt-4 space-y-2 border-t border-border pt-4 text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>
            {formatPrice(pricePerNight)} × {nights} đêm
          </span>
          <span className="font-medium text-foreground">
            {formatPrice(basePrice)}
          </span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Phí vệ sinh</span>
          <span className="font-medium text-foreground">
            {formatPrice(cleaningFee)}
          </span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Phí dịch vụ StayHub (10%)</span>
          <span className="font-medium text-foreground">
            {formatPrice(serviceFee)}
          </span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-foreground">
          <span>Tổng trước thuế</span>
          <span className="text-primary">{formatPrice(totalPrice)}</span>
        </div>
      </div>
    </div>
  );
}
