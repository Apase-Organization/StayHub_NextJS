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
import { formatPrice, formatDate } from "@/lib/utils";

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
  const [cancelTargetId, setCancelTargetId] = React.useState<string | null>(null);

  // Fetch bookings with React Query
  const { data: bookings = [], isLoading, error } = useQuery<BookingItem[]>({
    queryKey: ["userBookings", activeTab],
    queryFn: async () => {
      const url =
        activeTab === "ALL"
          ? "/api/bookings"
          : `/api/bookings?status=${activeTab}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Không thể tải danh sách đặt phòng");
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
        throw new Error(json.message || "Huỷ đơn đặt phòng không thành công");
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
            <CheckCircle2 className="mr-1 size-3.5" /> Sắp tới (Đã xác nhận)
          </Badge>
        );
      case "PENDING_PAYMENT":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">
            <Clock className="mr-1 size-3.5" /> Chờ thanh toán
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold">
            <CheckCircle2 className="mr-1 size-3.5" /> Hoàn thành
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold">
            <XCircle className="mr-1 size-3.5" /> Đã huỷ
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
            Chuyến đi của tôi (My Bookings)
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý và theo dõi toàn bộ các kỳ nghỉ và đơn đặt phòng của bạn tại StayHub.
          </p>
        </div>
        <Button asChild>
          <Link href="/search">
            <Search className="mr-2 size-4" />
            Khám phá chỗ ở mới
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="CONFIRMED">Sắp tới</TabsTrigger>
          <TabsTrigger value="PENDING_PAYMENT">Chờ xử lý</TabsTrigger>
          <TabsTrigger value="COMPLETED">Đã hoàn thành</TabsTrigger>
          <TabsTrigger value="CANCELLED">Đã huỷ</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="focus-visible:outline-none">
          {isLoading ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Đang tải danh sách đặt phòng...
              </p>
            </div>
          ) : error ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center">
              <AlertCircle className="size-10 text-destructive" />
              <p className="font-semibold text-destructive">
                Không thể tải danh sách đơn đặt phòng.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["userBookings"] })}
              >
                Thử lại
              </Button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Calendar className="size-8" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">
                Không tìm thấy đơn đặt phòng nào
              </h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Bạn chưa có đơn đặt phòng nào trong mục này. Hãy bắt đầu lên kế hoạch cho kỳ nghỉ tuyệt vời tiếp theo!
              </p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/search">Tìm nơi lưu trú</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bookings.map((booking) => {
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
                    className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
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
                    <div className="flex flex-1 flex-col p-5">
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
                        <MapPin className="size-3.5" />
                        {booking.property.city}
                      </p>

                      <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3 text-xs space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Thời gian:</span>
                          <span className="font-semibold text-foreground">
                            {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Số lượng:</span>
                          <span className="font-semibold text-foreground">
                            {booking.guests} khách
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-1.5 text-sm">
                          <span className="font-medium text-foreground">Tổng giá:</span>
                          <span className="font-bold text-primary">
                            {formatPrice(Number(booking.totalPrice))}
                          </span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="mt-5 flex gap-2 pt-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                        >
                          <Link href={`/bookings/${booking.id}`}>
                            <Eye className="mr-1.5 size-3.5" /> Chi tiết
                          </Link>
                        </Button>

                        {canCancel && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="text-xs"
                            onClick={() => setCancelTargetId(booking.id)}
                          >
                            Huỷ phòng
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận huỷ đặt phòng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn huỷ đơn đặt phòng này không? Sau khi huỷ, chỗ ở sẽ được mở lại cho khách khác đặt.
            </DialogDescription>
          </DialogHeader>

          {cancelMutation.isError && (
            <p className="text-xs text-destructive">
              {cancelMutation.error instanceof Error
                ? cancelMutation.error.message
                : "Không thể huỷ đơn đặt phòng."}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCancelTargetId(null)}
              disabled={cancelMutation.isPending}
            >
              Giữ lại đơn
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelTargetId && cancelMutation.mutate(cancelTargetId)}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Đang huỷ...
                </>
              ) : (
                "Đồng ý huỷ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
