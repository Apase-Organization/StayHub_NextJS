"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  LayoutDashboard,
  Home,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Shield,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatPrice, formatDate } from "@/lib/utils";

interface AdminStats {
  totalUsers: number;
  activeHosts: number;
  bookingsToday: number;
  platformRevenue: number;
}

interface AdminBooking {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalPrice: number;
  status: "PENDING_PAYMENT" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  property: { id: string; title: string };
  guest: { id: string; fullName: string; email: string };
  payment?: { status: string; paymentMethod: string } | null;
}

interface AdminBookingsResponse {
  bookings: AdminBooking[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || session?.user?.role !== "ADMIN") {
      router.replace("/");
    }
  }, [status, session, router]);

  const [activeTab, setActiveTab] = React.useState<"dashboard" | "bookings">(
    "dashboard"
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [page, setPage] = React.useState(1);

  const isAdmin = status === "authenticated" && session?.user?.role === "ADMIN";

  // 1. Fetch Stats via React Query (TSK-021)
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Không thể tải thống kê Admin");
      const json = await res.json();
      return json.data;
    },
    enabled: isAdmin,
  });

  // 2. Fetch Bookings via React Query (TSK-021)
  const { data: bookingsData, isLoading: bookingsLoading } =
    useQuery<AdminBookingsResponse>({
      queryKey: ["adminBookings", page, searchQuery, statusFilter],
      queryFn: async () => {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "10");
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        if (statusFilter) params.set("status", statusFilter);

        const res = await fetch(`/api/admin/bookings?${params.toString()}`);
        if (!res.ok) throw new Error("Không thể tải danh sách đơn đặt phòng");
        const json = await res.json();
        return json.data;
      },
      enabled: isAdmin,
    });

  const bookings = bookingsData?.bookings || [];
  const total = bookingsData?.total || 0;
  const totalPages = bookingsData?.totalPages || 1;

  const getStatusBadge = (status: AdminBooking["status"]) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
            <CheckCircle2 className="mr-1 size-3" /> CONFIRMED
          </Badge>
        );
      case "PENDING_PAYMENT":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">
            <Clock className="mr-1 size-3" /> PENDING
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold">
            COMPLETED
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold">
            <XCircle className="mr-1 size-3" /> CANCELLED
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-muted/20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-72px)] bg-muted/20">
      {/* 1. Admin Left Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-card p-6 hidden lg:flex lg:flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-6 border-b border-border">
            <div className="flex size-11 items-center justify-center rounded-xl bg-slate-900 text-white font-black text-sm">
              <Shield className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Quản trị viên StayHub
              </h2>
              <Badge
                variant="outline"
                className="text-[10px] text-primary border-primary/30"
              >
                Super Admin
              </Badge>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-semibold">
            {[
              {
                id: "dashboard",
                label: "Tổng quan hệ thống",
                icon: LayoutDashboard,
              },
              {
                id: "bookings",
                label: "Đơn đặt phòng toàn sàn",
                icon: Calendar,
              },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as never);
                    setPage(1);
                  }}
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

        <div className="pt-6 border-t border-border">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full text-xs"
          >
            <Link href="/">
              <Home className="mr-2 size-4" /> Về Trang chủ
            </Link>
          </Button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="min-w-0 flex-1 p-4 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Admin Portal · Quản trị hệ thống
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi các chỉ số KPI, lưu lượng giao dịch và quản lý các đơn đặt
            phòng trên toàn nền tảng.
          </p>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex lg:hidden items-center gap-1.5 p-1 rounded-xl bg-card border border-border mb-6 text-xs font-semibold">
          {[
            {
              id: "dashboard",
              label: "Tổng quan hệ thống",
              icon: LayoutDashboard,
            },
            { id: "bookings", label: "Đơn đặt phòng", icon: Calendar },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as never);
                  setPage(1);
                }}
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

        {/* 4 KPI Cards (TSK-021) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-5 mb-8">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Tổng người dùng
              </span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="size-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-foreground">
              {statsLoading ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : (
                (stats?.totalUsers ?? 0)
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Khách & Chủ nhà
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Host đang hoạt động
              </span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <Building2 className="size-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-foreground">
              {statsLoading ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : (
                (stats?.activeHosts ?? 0)
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Tài khoản Host ACTIVE
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Đơn đặt hôm nay
              </span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Calendar className="size-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-foreground">
              {statsLoading ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : (
                (stats?.bookingsToday ?? 0)
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Khởi tạo trong ngày
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Tổng doanh thu sàn
              </span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <DollarSign className="size-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-foreground">
              {statsLoading ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : (
                formatPrice(stats?.platformRevenue ?? 0)
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Giao dịch VNPay thành công
            </p>
          </div>
        </div>

        {/* Recent Bookings Table with Search, Filter & Pagination (TSK-021) */}
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="p-5 border-b border-border flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Danh sách Đơn đặt phòng toàn hệ thống
              </h2>
              <p className="text-xs text-muted-foreground">
                Tổng cộng {total} giao dịch được ghi nhận trên nền tảng.
              </p>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-48 sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo mã, tên, email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8 text-xs h-9"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="max-w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground outline-none h-9"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
                <option value="PENDING_PAYMENT">
                  Chờ thanh toán (PENDING)
                </option>
                <option value="COMPLETED">Hoàn tất (COMPLETED)</option>
                <option value="CANCELLED">Đã huỷ (CANCELLED)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-xs">
              <thead className="bg-muted/40 uppercase font-semibold text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-3">Mã đơn</th>
                  <th className="px-5 py-3">Chỗ ở</th>
                  <th className="px-5 py-3">Khách đặt</th>
                  <th className="px-5 py-3">Lịch trình</th>
                  <th className="px-5 py-3">Tổng tiền</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookingsLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-muted-foreground"
                    >
                      <Loader2 className="size-6 animate-spin mx-auto mb-2 text-primary" />
                      Đang tải danh sách đơn đặt phòng...
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-muted-foreground"
                    >
                      Không tìm thấy giao dịch nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono font-medium text-foreground">
                        #{b.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-foreground max-w-[200px] truncate">
                        {b.property.title}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-foreground">
                          {b.guest.fullName}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {b.guest.email}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {formatDate(b.checkInDate)} →{" "}
                        {formatDate(b.checkOutDate)}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-primary">
                        {formatPrice(Number(b.totalPrice))}
                      </td>
                      <td className="px-5 py-3.5">
                        {getStatusBadge(b.status)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                        >
                          <Link href={`/bookings/${b.id}`}>
                            <Eye className="size-3.5 mr-1" /> Xem
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls (TSK-021) */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex flex-wrap gap-3 items-center justify-between text-xs text-muted-foreground">
              <span>
                Hiển thị trang {page} trên tổng {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="size-3.5 mr-1" /> Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Sau <ChevronRight className="size-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
