import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import {
  ChevronLeft,
  MapPin,
  Building2,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  XCircle,
  Tag,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { displayPlace } from "@/lib/auth-ui";
import { syncCompletedBookings } from "@/services/booking.service";
import { BookingReviewSection } from "@/components/booking/BookingReviewSection";

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({
  params,
}: BookingDetailPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  await syncCompletedBookings();

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      property: {
        include: {
          images: { orderBy: { displayOrder: "asc" } },
          host: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
        },
      },
      guest: { select: { id: true, fullName: true, email: true, phone: true } },
      payment: true,
      discountCode: true,
      review: true,
    },
  });

  if (!booking) {
    notFound();
  }

  // Check authorization
  if (session.user.role !== "ADMIN" && booking.guestId !== session.user.id) {
    notFound();
  }

  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(booking.checkOutDate).getTime() -
        new Date(booking.checkInDate).getTime()) /
        (1000 * 3600 * 24)
    )
  );

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
            <CheckCircle2 className="mr-1 size-3.5" /> Confirmed
          </Badge>
        );
      case "PENDING_PAYMENT":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">
            <Clock className="mr-1 size-3.5" /> Pending payment
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold">
            <CheckCircle2 className="mr-1 size-3.5" /> Completed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold">
            <XCircle className="mr-1 size-3.5" /> Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status?: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
            Paid via VNPay
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">
            Unpaid
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold">
            Payment failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status || "Not created"}</Badge>;
    }
  };

  const coverImage =
    booking.property.images.find((img) => img.isCover)?.imageUrl ||
    booking.property.images[0]?.imageUrl ||
    "/placeholder-room.jpg";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Navigation */}
      <div className="mb-6 flex flex-wrap gap-3 items-center justify-between">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back to My Trips
        </Link>
        <div className="flex items-center gap-2">
          {getBookingStatusBadge(booking.status)}
          {getPaymentStatusBadge(booking.payment?.status)}
        </div>
      </div>

      {/* Main Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Booking Details #{booking.id.slice(-8).toUpperCase()}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Booking ID: <span className="font-mono text-xs">{booking.id}</span> •
          Created: {new Date(booking.createdAt).toLocaleString("en-US")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Property & Reservation details (7/12) */}
        <div className="min-w-0 space-y-6 lg:col-span-7">
          {/* Property Card */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="relative aspect-[16/9] w-full bg-muted">
              <Image
                src={coverImage}
                alt={booking.property.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                <Building2 className="size-3.5" />
                <span>{booking.property.type}</span>
              </div>
              <h2 className="mt-1 text-xl font-bold text-foreground">
                <Link
                  href={`/properties/${booking.property.id}`}
                  className="hover:underline"
                >
                  {booking.property.title}
                </Link>
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                {displayPlace(booking.property.address)},{" "}
                {displayPlace(booking.property.city)}
              </p>
            </div>
          </div>

          {/* Dates & Guests */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-foreground">Stay details</h3>
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-muted/20 p-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider block font-medium">
                  Check-in
                </span>
                <span className="mt-1 block font-bold text-foreground">
                  {formatDate(booking.checkInDate)}
                </span>
                <span className="text-xs text-muted-foreground">
                  After 14:00
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider block font-medium">
                  Check-out
                </span>
                <span className="mt-1 block font-bold text-foreground">
                  {formatDate(booking.checkOutDate)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Before 12:00
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-2">
              <span className="text-muted-foreground">Length of stay:</span>
              <span className="font-semibold text-foreground">
                {nights} nights
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Guests:</span>
              <span className="font-semibold text-foreground">
                {booking.guests} guests
              </span>
            </div>
          </div>

          {/* Host Info */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-bold text-foreground">Host details</h3>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                {booking.property.host.fullName[0] || "H"}
              </div>
              <div>
                <h4 className="font-semibold text-foreground">
                  {booking.property.host.fullName}
                </h4>
                <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="size-3.5" />
                    {booking.property.host.email}
                  </span>
                  {booking.property.host.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="size-3.5" />
                      {booking.property.host.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Guest Review Section (TSK-047) */}
          <BookingReviewSection
            bookingId={booking.id}
            bookingStatus={booking.status}
            checkOutDate={booking.checkOutDate}
            initialReview={booking.review}
          />
        </div>

        {/* Right Column: Pricing & Payment Breakdown (5/12) */}
        <div className="min-w-0 space-y-6 lg:col-span-5">
          <div className="lg:sticky lg:top-24 rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Price Breakdown
            </h3>

            <div className="space-y-3 text-sm pb-4 border-b border-border">
              <div className="flex justify-between text-muted-foreground">
                <span>
                  {formatPrice(Number(booking.nightlyPrice))} × {nights} nights
                </span>
                <span className="font-medium text-foreground">
                  {formatPrice(Number(booking.nightlyPrice) * nights)}
                </span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Cleaning fee</span>
                <span className="font-medium text-foreground">
                  {formatPrice(Number(booking.cleaningFee))}
                </span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>StayHub service fee</span>
                <span className="font-medium text-foreground">
                  {formatPrice(Number(booking.serviceFee))}
                </span>
              </div>

              {Number(booking.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="size-3.5" /> Discount
                    {booking.discountCode
                      ? ` (${booking.discountCode.code})`
                      : ""}
                  </span>
                  <span>-{formatPrice(Number(booking.discountAmount))}</span>
                </div>
              )}
            </div>

            <div className="pt-4 flex flex-wrap gap-2 items-baseline justify-between border-b border-border pb-4">
              <div>
                <span className="text-base font-bold text-foreground">
                  Total payment
                </span>
                <p className="text-xs text-muted-foreground">
                  Includes VAT and fees
                </p>
              </div>
              <span className="text-2xl font-extrabold text-primary">
                {formatPrice(Number(booking.totalPrice))}
              </span>
            </div>

            {/* Payment Details */}
            <div className="pt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment method:</span>
                <span className="font-semibold text-foreground">
                  {booking.payment?.paymentMethod || "VNPay"}
                </span>
              </div>
              {booking.payment?.providerTxnRef && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    VNPay reference:
                  </span>
                  <span className="font-mono text-foreground font-semibold">
                    {booking.payment.providerTxnRef}
                  </span>
                </div>
              )}
              {booking.payment?.paidAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid at:</span>
                  <span className="text-foreground">
                    {new Date(booking.payment.paidAt).toLocaleString("en-US")}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href={`/properties/${booking.property.id}`}>
                  View property
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/bookings">Back to My Trips</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
