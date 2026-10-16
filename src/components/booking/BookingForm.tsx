"use client";

import * as React from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import {
  Star,
  ShieldCheck,
  CreditCard,
  QrCode,
  Lock,
  AlertCircle,
  Tag,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { displayPlace } from "@/lib/auth-ui";

export interface BookingFormProperty {
  id: string;
  title: string;
  city: string;
  address: string;
  pricePerNight: number;
  cleaningFee: number;
  ratingAvg: number;
  images: { url: string }[];
}

interface BookingFormProps {
  property: BookingFormProperty;
  checkIn: string;
  checkOut: string;
  guests: number;
}

export function BookingForm({
  property,
  checkIn,
  checkOut,
  guests,
}: BookingFormProps) {
  const { data: session } = useSession();

  const [promoCodeInput, setPromoCodeInput] = React.useState("");
  const [appliedPromo, setAppliedPromo] = React.useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [promoError, setPromoError] = React.useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = React.useState<
    "VNPAY_QR" | "VNPAY_CARD"
  >("VNPAY_QR");
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Calculate pricing breakdown
  const nights = React.useMemo(() => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 1;
  }, [checkIn, checkOut]);

  const basePrice = property.pricePerNight * nights;
  const serviceFee = Math.round(basePrice * 0.1);
  const subtotalPrice = basePrice + property.cleaningFee + serviceFee;
  const discountAmount = appliedPromo?.discountAmount ?? 0;
  const totalPrice = Math.max(0, subtotalPrice - discountAmount);

  // Validate Promo Code Mutation
  const validatePromoMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), subtotal: subtotalPrice }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "This promo code is invalid or has expired"
        );
      }
      return data.data as { code: string; discountAmount: number };
    },
    onSuccess: (data) => {
      setAppliedPromo(data);
      setPromoError(null);
    },
    onError: (err: Error) => {
      setPromoError(err.message);
      setAppliedPromo(null);
    },
  });

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) {
      setPromoError("Please enter a promo code");
      return;
    }
    validatePromoMutation.mutate(promoCodeInput.trim());
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoError(null);
  };

  // Create Booking & Redirect VNPay Mutation
  const createBookingMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          checkIn,
          checkOut,
          guests,
          discountCode: appliedPromo?.code || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Unable to create your booking");
      }
      return data.data as { bookingId: string; vnpayUrl: string };
    },
    onSuccess: (data) => {
      if (data.vnpayUrl) {
        window.location.href = data.vnpayUrl;
      } else {
        setSubmitError("No payment link was received from VNPay.");
      }
    },
    onError: (err: Error) => {
      setSubmitError(err.message || "Unable to create a payment request.");
    },
  });

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
      {/* Cột trái: Form thông tin & Phương thức thanh toán (7/12) */}
      <div className="flex flex-col gap-8 lg:col-span-7">
        {/* Guest Summary Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground">
            1. Guest details
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Full name
              </label>
              <Input
                readOnly
                value={session?.user?.name || "Guest"}
                className="mt-1 bg-muted/40 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Receipt email
              </label>
              <Input
                readOnly
                value={session?.user?.email || ""}
                className="mt-1 bg-muted/40 font-medium"
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            These details are synced from your signed-in account.
          </p>
        </div>

        {/* Payment Methods */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              2. Payment method
            </h2>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="size-3.5 text-primary" />
              <span>SSL secured</span>
            </div>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            Pay securely through the VNPay Sandbox payment gateway.
          </p>

          <div className="mt-4 space-y-3">
            <label
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                paymentMethod === "VNPAY_QR"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-border/80"
              }`}
              onClick={() => setPaymentMethod("VNPAY_QR")}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "VNPAY_QR"}
                  onChange={() => setPaymentMethod("VNPAY_QR")}
                  className="size-4 text-primary focus:ring-primary"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      VNPay QR / Banking app
                    </span>
                    <Badge
                      variant="outline"
                      className="border-primary/30 text-primary text-[10px]"
                    >
                      Recommended
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Scan a QR code using your banking app or VNPAY wallet
                  </p>
                </div>
              </div>
              <QrCode className="size-6 text-primary" />
            </label>

            <label
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                paymentMethod === "VNPAY_CARD"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-border/80"
              }`}
              onClick={() => setPaymentMethod("VNPAY_CARD")}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "VNPAY_CARD"}
                  onChange={() => setPaymentMethod("VNPAY_CARD")}
                  className="size-4 text-primary focus:ring-primary"
                />
                <div>
                  <span className="font-semibold text-foreground">
                    Domestic ATM / International card
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Visa, Mastercard, JCB or domestic ATM card
                  </p>
                </div>
              </div>
              <CreditCard className="size-6 text-muted-foreground" />
            </label>
          </div>
        </div>

        {/* Cancellation & Protection Policy */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="size-6 shrink-0 text-primary" />
            <div className="text-sm">
              <h4 className="font-semibold text-foreground">
                Cancellation policy & StayCover
              </h4>
              <p className="mt-1 text-muted-foreground leading-relaxed">
                Cancel for free at least 48 hours before check-in. StayCover
                protection applies throughout your stay.
              </p>
            </div>
          </div>
        </div>

        {submitError && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <Button
          size="lg"
          className="w-full text-base font-bold shadow-md hover:shadow-lg transition-all"
          disabled={createBookingMutation.isPending}
          onClick={() => createBookingMutation.mutate()}
        >
          {createBookingMutation.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-5 animate-spin" />
              Redirecting to VNPay...
            </span>
          ) : (
            `Confirm & Pay ${formatPrice(totalPrice)}`
          )}
        </Button>
      </div>

      {/* Cột phải: Price Breakdown & Property summary (5/12) */}
      <div className="lg:col-span-5">
        <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-sm">
          {/* Property Card Header */}
          <div className="flex gap-4 pb-6 border-b border-border">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
              <Image
                src={property.images[0]?.url || "/placeholder-room.jpg"}
                alt={property.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-foreground">
                  {property.ratingAvg.toFixed(1)}
                </span>
                <span>• {displayPlace(property.city)}</span>
              </div>
              <h3 className="mt-1 truncate font-semibold text-foreground">
                {property.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {displayPlace(property.address)}
              </p>
            </div>
          </div>

          {/* Booking Period */}
          <div className="py-4 border-b border-border space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dates:</span>
              <span className="font-medium text-foreground">
                {checkIn} → {checkOut} ({nights} nights)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Guests:</span>
              <span className="font-medium text-foreground">
                {guests} guests
              </span>
            </div>
          </div>

          {/* Promo Code Box */}
          <div className="py-4 border-b border-border">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Tag className="size-3.5" /> Promo code / Voucher
            </label>
            {appliedPromo ? (
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                      Code: {appliedPromo.code}
                    </p>
                    <p className="text-xs text-emerald-600">
                      Save {formatPrice(appliedPromo.discountAmount)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePromo}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <Input
                  placeholder="Enter code (e.g. STAYWELCOME)"
                  value={promoCodeInput}
                  onChange={(e) =>
                    setPromoCodeInput(e.target.value.toUpperCase())
                  }
                  className="uppercase text-sm"
                />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={validatePromoMutation.isPending}
                >
                  {validatePromoMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              </form>
            )}
            {promoError && (
              <p className="mt-2 text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3.5" />
                {promoError}
              </p>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="py-4 space-y-2.5 text-sm">
            <h4 className="font-semibold text-foreground mb-3">
              Price breakdown
            </h4>
            <div className="flex justify-between text-muted-foreground">
              <span>
                {formatPrice(property.pricePerNight)} × {nights} nights
              </span>
              <span className="font-medium text-foreground">
                {formatPrice(basePrice)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Cleaning fee</span>
              <span className="font-medium text-foreground">
                {formatPrice(property.cleaningFee)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>StayHub service fee (10%)</span>
              <span className="font-medium text-foreground">
                {formatPrice(serviceFee)}
              </span>
            </div>

            {appliedPromo && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Voucher discount ({appliedPromo.code})</span>
                <span>-{formatPrice(appliedPromo.discountAmount)}</span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="pt-4 border-t border-border flex items-baseline justify-between">
            <div>
              <span className="text-base font-bold text-foreground">
                Total payment
              </span>
              <p className="text-xs text-muted-foreground">
                Includes taxes and fees
              </p>
            </div>
            <span className="text-2xl font-extrabold text-primary">
              {formatPrice(totalPrice)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
