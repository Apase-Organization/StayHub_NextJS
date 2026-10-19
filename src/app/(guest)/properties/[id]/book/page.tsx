import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { auth } from "@/lib/auth";
import { getProperty } from "@/services/property.service";
import { BookingForm } from "@/components/booking/BookingForm";

interface BookPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    checkIn?: string;
    checkOut?: string;
    guests?: string;
  }>;
}

export default async function BookPropertyPage({
  params,
  searchParams,
}: BookPageProps) {
  const { id } = await params;
  const { checkIn, checkOut, guests } = await searchParams;

  const session = await auth();
  if (!session?.user) {
    const bookingParams = new URLSearchParams();
    if (checkIn) bookingParams.set("checkIn", checkIn);
    if (checkOut) bookingParams.set("checkOut", checkOut);
    if (guests) bookingParams.set("guests", guests);
    const query = bookingParams.toString();
    const callbackUrl = `/properties/${id}/book${query ? `?${query}` : ""}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const property = await getProperty(id);
  if (!property) {
    notFound();
  }

  // Defaults if params omitted
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);

  const effectiveCheckIn = checkIn || tomorrow.toISOString().split("T")[0];
  const effectiveCheckOut =
    checkOut || threeDaysLater.toISOString().split("T")[0];
  const effectiveGuests = Math.min(
    property.maxGuests,
    Math.max(1, parseInt(guests || "2", 10))
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 1. Header Back Button */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/properties/${property.id}`}
          className="flex size-9 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Confirm & Pay
          </h1>
          <p className="text-sm text-muted-foreground">
            Please review your stay details before proceeding to payment.
          </p>
        </div>
      </div>

      <BookingForm
        property={{
          id: property.id,
          title: property.title,
          city: property.city,
          address: property.address,
          pricePerNight: property.pricePerNight,
          cleaningFee: property.cleaningFee,
          ratingAvg: property.ratingAvg,
          reviewCount: property.reviewCount,
          images: property.images.map((img) => ({ url: img.url })),
        }}
        checkIn={effectiveCheckIn}
        checkOut={effectiveCheckOut}
        guests={effectiveGuests}
      />
    </div>
  );
}
