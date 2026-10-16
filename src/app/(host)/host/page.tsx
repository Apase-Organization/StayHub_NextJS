"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Calendar,
  DollarSign,
  PlusCircle,
  CheckCircle2,
  LayoutDashboard,
  Home,
  Loader2,
  Eye,
  Archive,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatPrice, formatDate } from "@/lib/utils";

interface HostStats {
  totalBookings: number;
  totalRevenue: number;
  activeProperties: number;
}

interface HostProperty {
  id: string;
  title: string;
  city: string;
  address: string;
  pricePerNight: number;
  cleaningFee: number;
  maxGuests: number;
  type: string;
  status: "ACTIVE" | "INACTIVE";
  ratingAvg: number;
  images: { id: string; url: string; isCover: boolean }[];
}

interface HostBooking {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalPrice: number;
  status: "PENDING_PAYMENT" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  property: { id: string; title: string; city: string };
  guest: { id: string; fullName: string; email: string };
  payment?: { status: string } | null;
}

export default function HostDashboardPage() {
  const queryClient = useQueryClient();
  const [activeMenu, setActiveMenu] = React.useState<
    "dashboard" | "properties" | "requests"
  >("dashboard");
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Form State for Add Property Modal
  const [newProp, setNewProp] = React.useState({
    title: "",
    description: "",
    type: "HOMESTAY",
    city: "Hà Nội",
    address: "",
    pricePerNight: 850000,
    cleaningFee: 100000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery<HostStats>({
    queryKey: ["hostStats"],
    queryFn: async () => {
      const res = await fetch("/api/host/stats");
      if (!res.ok) throw new Error("Lỗi khi tải thống kê host");
      const json = await res.json();
      return json.data;
    },
  });

  const { data: properties = [], isLoading: propsLoading } = useQuery<
    HostProperty[]
  >({
    queryKey: ["hostProperties"],
    queryFn: async () => {
      const res = await fetch("/api/host/properties");
      if (!res.ok) throw new Error("Lỗi khi tải danh sách phòng của bạn");
      const json = await res.json();
      return json.data || [];
    },
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<
    HostBooking[]
  >({
    queryKey: ["hostBookings"],
    queryFn: async () => {
      const res = await fetch("/api/host/bookings");
      if (!res.ok) throw new Error("Lỗi khi tải danh sách yêu cầu đặt phòng");
      const json = await res.json();
      return json.data || [];
    },
  });

  // Mutations
  const addPropertyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProp),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Không thể tạo chỗ ở mới");
      }
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hostProperties"] });
      queryClient.invalidateQueries({ queryKey: ["hostStats"] });
      setIsAddModalOpen(false);
      showToast("Tạo chỗ ở mới thành công!");
      setNewProp({
        title: "",
        description: "",
        type: "HOMESTAY",
        city: "Hà Nội",
        address: "",
        pricePerNight: 850000,
        cleaningFee: 100000,
        maxGuests: 4,
        bedrooms: 2,
        beds: 2,
        bathrooms: 1,
      });
    },
    onError: (err: Error) => {
      showToast(err.message);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (propId: string) => {
      const res = await fetch(`/api/properties/${propId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Lỗi lưu trữ chỗ ở");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hostProperties"] });
      queryClient.invalidateQueries({ queryKey: ["hostStats"] });
      showToast("Đã lưu trữ chỗ ở thành công.");
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message || "Huỷ đơn thất bại");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hostBookings"] });
      queryClient.invalidateQueries({ queryKey: ["hostStats"] });
      showToast("Đã cập nhật trạng thái đơn đặt phòng.");
    },
  });

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-72px)] bg-muted/20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 text-white px-5 py-3 shadow-xl text-sm flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Host Left Sidebar (TSK-032) */}
      <aside className="w-full lg:w-64 shrink-0 border-r border-border bg-card p-4 lg:p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-6 border-b border-border">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
              <Home className="size-6" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h2 className="text-sm font-bold text-foreground truncate">
                Cổng quản lý Host
              </h2>
              <Badge
                variant="secondary"
                className="text-[10px] bg-primary/10 text-primary font-bold"
              >
                Đối tác StayHub
              </Badge>
            </div>
          </div>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full rounded-xl font-bold shadow-sm"
          >
            <PlusCircle className="size-4 mr-2" />
            Đăng chỗ ở mới
          </Button>

          <nav className="space-y-1.5 text-xs font-semibold">
            {[
              { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
              { id: "properties", label: "Chỗ ở của tôi", icon: Building2 },
              { id: "requests", label: "Đơn đặt phòng", icon: Calendar },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id as never)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="min-w-0 flex-1 p-4 sm:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {activeMenu === "dashboard" && "Bảng điều khiển Host"}
              {activeMenu === "properties" && "Quản lý chỗ ở của bạn"}
              {activeMenu === "requests" && "Yêu cầu & Đơn đặt phòng"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Theo dõi doanh thu, lịch trình nhận khách và quản lý danh sách
              phòng cho thuê.
            </p>
          </div>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            size="sm"
            className="md:hidden"
          >
            <PlusCircle className="size-4 mr-1.5" /> Thêm chỗ ở
          </Button>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center gap-1.5 p-1 rounded-xl bg-card border border-border mb-6 overflow-x-auto text-xs font-semibold">
          {[
            { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
            { id: "properties", label: "Chỗ ở", icon: Building2 },
            { id: "requests", label: "Đơn đặt", icon: Calendar },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id as never)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* KPI Stats Cards (TSK-032) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Doanh thu thu về
              </span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <DollarSign className="size-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-foreground">
              {statsLoading ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : (
                formatPrice(stats?.totalRevenue ?? 0)
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Đã tất toán qua VNPay
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Lượt đặt phòng
              </span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Calendar className="size-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-foreground">
              {statsLoading ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : (
                (stats?.totalBookings ?? 0)
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Tổng lượt đặt mọi thời điểm
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Chỗ ở đang hoạt động
              </span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <Building2 className="size-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-foreground">
              {statsLoading ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : (
                (stats?.activeProperties ?? 0)
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Sẵn sàng đón khách
            </p>
          </div>
        </div>

        {/* Section 1: Dashboard overview or Properties */}
        {(activeMenu === "dashboard" || activeMenu === "properties") && (
          <div className="space-y-4 mb-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                Danh sách chỗ ở ({properties.length})
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
              >
                <PlusCircle className="size-3.5 mr-1.5" /> Thêm mới
              </Button>
            </div>

            {propsLoading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : properties.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                <p className="text-sm text-muted-foreground">
                  Bạn chưa có chỗ ở nào. Hãy đăng tin ngay để bắt đầu đón khách!
                </p>
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-4"
                  size="sm"
                >
                  Tạo chỗ ở đầu tiên
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {properties.map((prop) => (
                  <div
                    key={prop.id}
                    className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs flex flex-col"
                  >
                    <div className="relative aspect-[16/10] bg-muted w-full">
                      <Image
                        src={prop.images[0]?.url || "/placeholder-room.jpg"}
                        alt={prop.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2.5 right-2.5">
                        <Badge
                          variant={
                            prop.status === "ACTIVE" ? "default" : "secondary"
                          }
                        >
                          {prop.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-primary">
                          {prop.type} · {prop.city}
                        </span>
                        <h3 className="font-bold text-sm text-foreground line-clamp-1 mt-0.5">
                          {prop.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {prop.maxGuests} khách ·{" "}
                          {formatPrice(prop.pricePerNight)}/đêm
                        </p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-border">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                        >
                          <Link href={`/properties/${prop.id}`}>
                            <Eye className="size-3.5 mr-1" /> Xem
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground hover:text-destructive"
                          onClick={() => archiveMutation.mutate(prop.id)}
                          disabled={archiveMutation.isPending}
                        >
                          <Archive className="size-3.5 mr-1" /> Lưu trữ
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 2: Booking Requests */}
        {(activeMenu === "dashboard" || activeMenu === "requests") && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">
              Yêu cầu đặt phòng gần đây ({bookings.length})
            </h2>

            {bookingsLoading ? (
              <div className="flex min-h-[160px] items-center justify-center">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                Chưa có yêu cầu đặt phòng nào gần đây.
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs divide-y divide-border">
                {bookings.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          {req.guest.fullName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({req.guest.email})
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {req.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Chỗ ở:{" "}
                        <span className="font-semibold text-foreground">
                          {req.property.title}
                        </span>{" "}
                        • {formatDate(req.checkInDate)} →{" "}
                        {formatDate(req.checkOutDate)} ({req.guests} khách)
                      </p>
                    </div>

                    <div className="flex items-center gap-3 justify-between sm:justify-end">
                      <span className="font-bold text-primary text-sm">
                        {formatPrice(Number(req.totalPrice))}
                      </span>
                      {req.status === "CONFIRMED" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-xs"
                          onClick={() => cancelBookingMutation.mutate(req.id)}
                          disabled={cancelBookingMutation.isPending}
                        >
                          Huỷ đơn
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Add Property (TSK-032) */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Đăng thông tin chỗ ở mới</DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết về căn hộ hoặc nhà của bạn để hiển thị cho
              du khách trên StayHub.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                Tiêu đề chỗ ở
              </label>
              <Input
                placeholder="VD: Căn hộ Studio view hồ Tây lãng mạn"
                value={newProp.title}
                onChange={(e) =>
                  setNewProp({ ...newProp, title: e.target.value })
                }
              />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                Mô tả chi tiết
              </label>
              <textarea
                rows={3}
                className="w-full rounded-md border border-border bg-transparent p-2 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-primary outline-none"
                placeholder="Mô tả không gian, tiện ích, vị trí và trải nghiệm..."
                value={newProp.description}
                onChange={(e) =>
                  setNewProp({ ...newProp, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Loại hình
                </label>
                <select
                  value={newProp.type}
                  onChange={(e) =>
                    setNewProp({ ...newProp, type: e.target.value })
                  }
                  className="w-full rounded-md border border-border bg-card p-2 text-xs text-foreground outline-none"
                >
                  <option value="HOMESTAY">Homestay</option>
                  <option value="APARTMENT">Căn hộ</option>
                  <option value="VILLA">Biệt thự</option>
                  <option value="HOUSE">Nhà nguyên căn</option>
                  <option value="HOTEL_ROOM">Khách sạn</option>
                  <option value="RESORT">Resort</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Thành phố
                </label>
                <Input
                  value={newProp.city}
                  onChange={(e) =>
                    setNewProp({ ...newProp, city: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                Địa chỉ chi tiết
              </label>
              <Input
                placeholder="VD: 123 Đường Yên Phụ, Ba Đình, Hà Nội"
                value={newProp.address}
                onChange={(e) =>
                  setNewProp({ ...newProp, address: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Giá mỗi đêm (VND)
                </label>
                <Input
                  type="number"
                  value={newProp.pricePerNight}
                  onChange={(e) =>
                    setNewProp({
                      ...newProp,
                      pricePerNight: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Phí dọn dẹp (VND)
                </label>
                <Input
                  type="number"
                  value={newProp.cleaningFee}
                  onChange={(e) =>
                    setNewProp({
                      ...newProp,
                      cleaningFee: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Khách tối đa
                </label>
                <Input
                  type="number"
                  value={newProp.maxGuests}
                  onChange={(e) =>
                    setNewProp({
                      ...newProp,
                      maxGuests: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Phòng ngủ
                </label>
                <Input
                  type="number"
                  value={newProp.bedrooms}
                  onChange={(e) =>
                    setNewProp({ ...newProp, bedrooms: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Số giường
                </label>
                <Input
                  type="number"
                  value={newProp.beds}
                  onChange={(e) =>
                    setNewProp({ ...newProp, beds: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Phòng tắm
                </label>
                <Input
                  type="number"
                  value={newProp.bathrooms}
                  onChange={(e) =>
                    setNewProp({
                      ...newProp,
                      bathrooms: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={addPropertyMutation.isPending}
            >
              Huỷ
            </Button>
            <Button
              onClick={() => addPropertyMutation.mutate()}
              disabled={
                addPropertyMutation.isPending ||
                !newProp.title ||
                !newProp.address
              }
            >
              {addPropertyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Đang tạo...
                </>
              ) : (
                "Xác nhận tạo chỗ ở"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
