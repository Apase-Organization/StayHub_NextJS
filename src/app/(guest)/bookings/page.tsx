"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  Loader2,
  Building2,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { displayPlace } from "@/lib/auth-ui";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

interface BookingItem {
  id: string;
  propertyId: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalPrice: number;
  status: "PENDING_PAYMENT" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  property: {
    id: string;
    title: string;
    city: string;
    type: string;
    images: { imageUrl: string; isCover: boolean }[];
  };
  payment?: {
    status: string;
  } | null;
}

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<string>("CONFIRMED");
  const [cancelTargetId, setCancelTargetId] = React.useState<string | null>(
    null
  );

  // Fetch bookings with React Query
  const {
    data: bookings = [],
    isLoading,
    error,
  } = useQuery<BookingItem[]>({
    queryKey: ["userBookings", activeTab],
    queryFn: async () => {
      const url =
        activeTab === "ALL"
          ? "/api/bookings"
          : `/api/bookings?status=${activeTab}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Unable to load bookings");
      }
      const json = await res.json();
      return json.data || [];
    },
  });

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bookings/${id}/cancel`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Unable to cancel booking");
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userBookings"] });
      setCancelTargetId(null);
    },
  });

  const getStatusBadge = (status: BookingItem["status"]) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
            <CheckCircle2 className="mr-1 size-3.5" /> Upcoming (Confirmed)
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My Trips
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage and track all your stays and bookings with StayHub.
          </p>
        </div>
        <Button asChild>
          <Link href="/search">
            <Search className="mr-2 size-4" />
            Explore stays
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full min-w-0 gap-6"
      >
        <TabsList className="flex w-full overflow-x-auto sm:grid sm:grid-cols-4 max-w-xl">
          <TabsTrigger value="CONFIRMED" className="shrink-0 sm:shrink px-3">
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="PENDING_PAYMENT" className="shrink-0 sm:shrink px-3">
            Pending
          </TabsTrigger>
          <TabsTrigger value="COMPLETED" className="shrink-0 sm:shrink px-3">
            Completed
          </TabsTrigger>
          <TabsTrigger value="CANCELLED" className="shrink-0 sm:shrink px-3">
            Cancelled
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="focus-visible:outline-none">
          {isLoading ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading bookings...
              </p>
            </div>
          ) : error ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center">
              <AlertCircle className="size-10 text-destructive" />
              <p className="font-semibold text-destructive">
                Unable to load bookings.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ["userBookings"] })
                }
              >
                Try again
              </Button>
            </div>
          ) : bookings.filter((booking) => booking.status === activeTab)
              .length === 0 ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Calendar className="size-8" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">
                No bookings found
              </h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                You have no bookings in this category. Start planning your next
                getaway!
              </p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/search">Find a stay</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bookings
                .filter((booking) => booking.status === activeTab)
                .map((booking) => {
                  const cover =
                    booking.property.images.find((i) => i.isCover)?.imageUrl ||
                    booking.property.images[0]?.imageUrl ||
                    "/placeholder-room.jpg";

                  const canCancel =
                    booking.status === "CONFIRMED" ||
                    booking.status === "PENDING_PAYMENT";

                  return (
                    <div
                      key={booking.id}
                      className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
                    >
                      {/* Property Image & Status */}
                      <div className="relative aspect-[16/10] w-full bg-muted">
                        <Image
                          src={cover}
                          alt={booking.property.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-3 right-3">
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex min-w-0 flex-1 flex-col p-5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
                          <Building2 className="size-3.5" />
                          <span>{booking.property.type}</span>
                        </div>

                        <h3 className="mt-1 line-clamp-1 font-bold text-foreground">
                          <Link
                            href={`/properties/${booking.property.id}`}
                            className="hover:underline"
                          >
                            {booking.property.title}
                          </Link>
                        </h3>

                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3.5 shrink-0" />
                          <span className="min-w-0 break-words">
                            {displayPlace(booking.property.city)}
                          </span>
                        </p>

                        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3 text-xs space-y-1.5">
                          <div className="flex flex-wrap gap-1 justify-between">
                            <span className="text-muted-foreground">
                              Dates:
                            </span>
                            <span className="font-semibold text-foreground">
                              {formatDate(booking.checkInDate)} →{" "}
                              {formatDate(booking.checkOutDate)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 justify-between">
                            <span className="text-muted-foreground">
                              Guests:
                            </span>
                            <span className="font-semibold text-foreground">
                              {booking.guests}{" "}
                              {booking.guests === 1 ? "guest" : "guests"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 justify-between border-t border-border pt-1.5 text-sm">
                            <span className="font-medium text-foreground">
                              Total:
                            </span>
                            <span className="min-w-0 break-words font-bold text-primary">
                              {formatPrice(Number(booking.totalPrice))}
                            </span>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="mt-5 flex flex-wrap gap-2 pt-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                          >
                            <Link href={`/bookings/${booking.id}`}>
                              <Eye className="mr-1.5 size-3.5" /> Details
                            </Link>
                          </Button>

                          {canCancel && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="text-xs"
                              onClick={() => setCancelTargetId(booking.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={Boolean(cancelTargetId)}
        onOpenChange={(open) => !open && setCancelTargetId(null)}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cancel booking?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? The property will
              become available for other guests to book.
            </DialogDescription>
          </DialogHeader>

          {cancelMutation.isError && (
            <p className="text-xs text-destructive">
              {cancelMutation.error instanceof Error
                ? cancelMutation.error.message
                : "Unable to cancel booking."}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCancelTargetId(null)}
              disabled={cancelMutation.isPending}
            >
              Keep booking
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                cancelTargetId && cancelMutation.mutate(cancelTargetId)
              }
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Cancelling...
                </>
              ) : (
                "Confirm cancellation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
