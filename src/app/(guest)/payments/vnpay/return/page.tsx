"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Calendar, Home, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

function ReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // BookingId is passed either via bookingId query or vnp_TxnRef
  const bookingId =
    searchParams.get("bookingId") || searchParams.get("vnp_TxnRef") || "";
  const amountStr = searchParams.get("vnp_Amount") || "0";
  const amount = parseInt(amountStr, 10) / 100;
  const responseCode = searchParams.get("vnp_ResponseCode");

  // Step 1: Initial verify call
  React.useEffect(() => {
    if (!bookingId) return;

    const query: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      query[key] = val;
    });

    fetch("/api/payments/vnpay/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    }).catch(() => {
      // Ignore initial verify errors; polling status will reflect DB state
    });
  }, [searchParams, bookingId]);

  // Step 2: Polling booking payment status every 2 seconds via useQuery
  const { data: paymentInfo, isLoading } = useQuery({
    queryKey: ["paymentStatus", bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const res = await fetch(`/api/payments/bookings/${bookingId}/status`);
      if (!res.ok) throw new Error("Unable to check payment status");
      const json = await res.json();
      return json.data as {
        status: "PENDING" | "SUCCESS" | "FAILED";
        bookingStatus: string;
      };
    },
    enabled: Boolean(bookingId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "SUCCESS" || status === "FAILED") {
        return false; // Stop polling once resolved
      }
      return 2000; // Poll every 2 seconds
    },
  });

  const paymentStatus = paymentInfo?.status;
  const isSuccess =
    paymentStatus === "SUCCESS" ||
    (paymentStatus === undefined && responseCode === "00");
  const isResolving = !paymentStatus && !responseCode && isLoading;

  // Auto redirect countdown after status is resolved
  const [countdown, setCountdown] = React.useState(5);
  React.useEffect(() => {
    if (paymentStatus === "SUCCESS" || paymentStatus === "FAILED") {
      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            router.push("/bookings");
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [paymentStatus, router]);

  if (isResolving) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-12 text-center shadow-xl space-y-4">
          <Loader2 className="mx-auto size-12 animate-spin text-primary" />
          <h2 className="text-xl font-bold text-foreground">
            Verifying payment...
          </h2>
          <p className="text-sm text-muted-foreground">
            We are syncing the payment result with VNPay. Please keep this page
            open.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-xl space-y-6">
        {isSuccess ? (
          <>
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="size-9" />
            </div>

            <div>
              <span className="inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">
                Transaction successful
              </span>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">
                Payment complete!
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Thank you for choosing StayHub. Check My Trips for your latest
                booking status.
              </p>
            </div>

            {/* Transaction Receipt Card */}
            <div className="rounded-2xl border border-border bg-muted/30 p-4 text-left space-y-2.5 text-xs">
              <div className="flex flex-wrap items-baseline gap-2 justify-between">
                <span className="text-muted-foreground shrink-0">Booking ID:</span>
                <span className="font-mono font-bold text-foreground break-all text-right">
                  {bookingId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment gateway:</span>
                <span className="font-semibold text-foreground">
                  VNPay Sandbox
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Booking status:</span>
                <span className="font-semibold text-emerald-600">
                  CONFIRMED
                </span>
              </div>
              {amount > 0 && (
                <div className="flex justify-between border-t border-border pt-2 text-sm">
                  <span className="font-bold text-foreground">
                    Payment amount:
                  </span>
                  <span className="font-black text-primary">
                    {formatPrice(amount)}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Redirecting to My Trips in{" "}
              <span className="font-bold text-foreground">{countdown}</span>{" "}
              seconds...
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button asChild className="flex-1">
                <Link href="/bookings">
                  <Calendar className="mr-2 size-4" />
                  View My Trips
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">
                  <Home className="mr-2 size-4" />
                  Back to home
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <XCircle className="size-9" />
            </div>

            <div>
              <span className="inline-block rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive">
                Transaction incomplete
              </span>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">
                Payment unsuccessful
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                The transaction was cancelled or an error occurred while
                processing your payment through VNPay.
              </p>
            </div>

            {bookingId && (
              <div className="rounded-2xl border border-border bg-muted/30 p-4 text-left space-y-2 text-xs">
                <div className="flex flex-wrap items-baseline gap-2 justify-between">
                  <span className="text-muted-foreground shrink-0">Booking ID:</span>
                  <span className="font-mono font-bold text-foreground break-all text-right">
                    {bookingId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    VNPay response code:
                  </span>
                  <span className="font-semibold text-destructive">
                    {responseCode || "Error"}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button asChild className="flex-1">
                <Link href="/bookings">
                  <Calendar className="mr-2 size-4" />
                  Back to My Trips
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">
                  <Home className="mr-2 size-4" />
                  Back to home
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VNPayReturnPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <ReturnContent />
    </React.Suspense>
  );
}
