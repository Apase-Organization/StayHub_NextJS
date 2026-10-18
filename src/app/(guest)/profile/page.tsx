"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Mail,
  Phone,
  Shield,
  KeyRound,
  Lock,
  Camera,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building2,
  ExternalLink,
  Loader2,
  Eye,
  EyeOff,
  Home,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";

interface UserProfileData {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: "GUEST" | "HOST" | "ADMIN";
  status: "ACTIVE" | "LOCKED";
  provider: "LOCAL" | "GOOGLE";
  emailVerified: string | null;
  createdAt: string;
  isGoogleUser: boolean;
  stats: {
    totalBookings: number;
    totalProperties: number;
    totalReviews: number;
  };
}

export default function ProfilePage() {
  const { status, update: updateSession } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Redirect unauthenticated
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/profile");
    }
  }, [status, router]);

  // Toast notification state
  const [toastMessage, setToastMessage] = React.useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Profile data query
  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<UserProfileData>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const res = await fetch("/api/user/profile");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Lỗi khi tải thông tin hồ sơ");
      }
      return json.data;
    },
    enabled: status === "authenticated",
    retry: 1,
  });

  // Edit Profile Form state
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [email, setEmail] = React.useState("");

  // Sync form when profile data loads
  React.useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setPhone(profile.phone || "");
      setBio(profile.bio || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  // Avatar Upload state
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);

  // Password Form state
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Mutation: Update Profile Details
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, string> = {
        fullName,
        phone,
        bio,
      };
      if (!profile?.isGoogleUser) {
        payload.email = email;
      }

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Cập nhật hồ sơ thất bại");
      }
      return json.data;
    },
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      showToast("Cập nhật thông tin hồ sơ thành công!", "success");
      updateSession({ name: updatedData.fullName });
    },
    onError: (err: Error) => {
      showToast(err.message || "Lỗi khi cập nhật hồ sơ", "error");
    },
  });

  // Mutation: Change Password
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 6) {
        throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("Mật khẩu xác nhận không khớp");
      }

      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Đổi mật khẩu thất bại");
      }
      return json;
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Đã đổi mật khẩu thành công!", "success");
    },
    onError: (err: Error) => {
      showToast(err.message || "Không thể đổi mật khẩu", "error");
    },
  });

  // Handle Avatar File Upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Vui lòng chọn file hình ảnh (JPG, PNG, WEBP)", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Kích thước file ảnh không được quá 5MB", "error");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Lỗi khi tải ảnh đại diện");
      }

      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      showToast("Cập nhật ảnh đại diện thành công!", "success");
      updateSession({ image: json.data.avatarUrl });
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || "Lỗi tải ảnh đại diện", "error");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-xs font-semibold text-muted-foreground">
            Đang tải thông tin hồ sơ...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <AlertCircle className="mx-auto size-10 text-destructive mb-3" />
        <h2 className="text-xl font-bold">Không thể tải thông tin hồ sơ</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {error?.message || "Vui lòng thử lại sau hoặc đăng nhập lại tài khoản."}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Thử lại
          </Button>
          <Button size="sm" onClick={() => router.push("/login")}>
            Đăng nhập lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-muted/20 py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-xl px-5 py-3 shadow-xl text-sm flex items-center gap-2 border animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === "success"
              ? "bg-slate-900 text-white border-slate-700"
              : "bg-destructive text-white border-destructive"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="size-4 text-emerald-400" />
          ) : (
            <AlertCircle className="size-4 text-white" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
                <Home className="size-3.5" />
                <span>Trang chủ</span>
              </Link>
              <ChevronRight className="size-3" />
              <span className="text-foreground font-medium">Hồ sơ cá nhân</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Hồ sơ & Tài khoản của bạn
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Quản lý thông tin định danh, hình ảnh đại diện và cài đặt bảo mật StayHub.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
              <Link href="/bookings">
                <Calendar className="size-3.5" />
                <span>Chuyến đi của tôi</span>
              </Link>
            </Button>
            {profile.role === "HOST" && (
              <Button asChild size="sm" className="gap-1.5 text-xs font-bold">
                <Link href="/host">
                  <Building2 className="size-3.5" />
                  <span>Cổng quản lý Host</span>
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Main Grid: Left Profile Card & Right Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 1. Left Sidebar: User Card & Quick Stats */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-20 bg-linear-to-r from-primary/10 via-primary/5 to-transparent" />

              {/* Avatar with Upload button */}
              <div className="relative mt-2 mb-4 group">
                <div className="size-28 sm:size-32 rounded-full overflow-hidden border-4 border-card shadow-md bg-muted relative">
                  {profile.avatarUrl ? (
                    <Image
                      src={profile.avatarUrl}
                      alt={profile.fullName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center bg-primary/10 text-primary text-3xl font-black">
                      {profile.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-[11px] font-semibold gap-1 z-10">
                      <Loader2 className="size-5 animate-spin" />
                      <span>Đang tải...</span>
                    </div>
                  )}
                </div>

                {/* Upload camera badge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  title="Thay đổi ảnh đại diện (Cloudinary)"
                  className="absolute bottom-1 right-1 size-9 rounded-full bg-primary text-primary-foreground shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                >
                  <Camera className="size-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              {/* User Info */}
              <h2 className="text-lg font-bold text-foreground line-clamp-1">
                {profile.fullName}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 break-all">
                {profile.email}
              </p>

              {/* Badges */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                <Badge
                  variant={profile.role === "ADMIN" ? "destructive" : profile.role === "HOST" ? "default" : "secondary"}
                  className="text-[11px] font-bold"
                >
                  {profile.role === "ADMIN" ? "Quản trị viên" : profile.role === "HOST" ? "Chủ nhà (Host)" : "Khách du lịch"}
                </Badge>

                {profile.isGoogleUser ? (
                  <Badge variant="outline" className="text-[11px] gap-1 font-semibold border-amber-500/30 text-amber-600 bg-amber-500/10">
                    <svg className="size-3" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google Login</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[11px] font-semibold">
                    Tài khoản nội bộ
                  </Badge>
                )}
              </div>

              {/* Bio summary */}
              {profile.bio && (
                <p className="mt-4 text-xs text-muted-foreground italic bg-muted/40 p-3 rounded-xl w-full border border-border/50 text-left">
                  &ldquo;{profile.bio}&rdquo;
                </p>
              )}

              {/* Stats Box */}
              <div className="mt-6 w-full pt-5 border-t border-border grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-muted/40 p-3 border border-border/50">
                  <span className="block text-xl font-extrabold text-foreground">
                    {profile.stats.totalBookings}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Chuyến đi đã đặt
                  </span>
                </div>

                <div className="rounded-xl bg-muted/40 p-3 border border-border/50">
                  <span className="block text-xl font-extrabold text-foreground">
                    {profile.role === "HOST" || profile.role === "ADMIN"
                      ? profile.stats.totalProperties
                      : profile.stats.totalReviews}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {profile.role === "HOST" || profile.role === "ADMIN"
                      ? "Chỗ ở quản lý"
                      : "Đánh giá đã viết"}
                  </span>
                </div>
              </div>

              <div className="mt-4 text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                <span>Tham gia từ {formatDate(profile.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* 2. Right: Tabs for Editing Information and Security Settings */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
              <Tabs defaultValue="info" className="w-full">
                <div className="border-b border-border px-6 pt-4">
                  <TabsList className="bg-muted/60 p-1">
                    <TabsTrigger value="info" className="text-xs font-semibold gap-1.5">
                      <User className="size-3.5" />
                      <span>Thông tin cá nhân</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="text-xs font-semibold gap-1.5">
                      <Shield className="size-3.5" />
                      <span>Bảo mật & Mật khẩu</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Tab 1: Edit Profile Information */}
                <TabsContent value="info" className="p-6 space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Thông tin cơ bản
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Cập nhật thông tin chi tiết để chủ nhà và khách có thể liên lạc với bạn dễ dàng.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1.5">
                        Họ và tên <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Nhập họ và tên đầy đủ"
                          className="pl-9 text-xs"
                        />
                        <User className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Email address */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-foreground">
                          Địa chỉ Email
                        </label>
                        {profile.isGoogleUser && (
                          <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                            <Lock className="size-3" />
                            Được quản lý bởi Google
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={profile.isGoogleUser}
                          placeholder="name@example.com"
                          className={`pl-9 text-xs ${
                            profile.isGoogleUser
                              ? "bg-muted/60 cursor-not-allowed opacity-80"
                              : ""
                          }`}
                        />
                        <Mail className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {/* Google note */}
                      {profile.isGoogleUser ? (
                        <p className="text-[11px] text-amber-600/90 mt-1.5 flex items-center gap-1.5 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                          <AlertCircle className="size-3.5 shrink-0" />
                          <span>
                            Tài khoản được liên kết trực tiếp với Google. Bạn không thể đổi địa chỉ email của tài khoản này tại StayHub.
                          </span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Email dùng để nhận thông báo đặt phòng và liên hệ từ StayHub.
                        </p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1.5">
                        Số điện thoại
                      </label>
                      <div className="relative">
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="VD: 0912345678"
                          className="pl-9 text-xs"
                        />
                        <Phone className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Dùng để nhận cuộc gọi hỗ trợ từ chủ nhà hoặc điều phối viên.
                      </p>
                    </div>

                    {/* Bio */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-foreground">
                          Giới thiệu bản thân
                        </label>
                        <span className="text-[11px] text-muted-foreground">
                          {bio.length}/500
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        maxLength={500}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Chia sẻ một chút về phong cách du lịch của bạn, nơi bạn từng đến hoặc sở thích..."
                        className="w-full rounded-md border border-border bg-transparent p-3 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-primary outline-none"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFullName(profile.fullName || "");
                        setPhone(profile.phone || "");
                        setBio(profile.bio || "");
                        setEmail(profile.email || "");
                      }}
                      disabled={updateProfileMutation.isPending}
                    >
                      Khôi phục
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => updateProfileMutation.mutate()}
                      disabled={updateProfileMutation.isPending || !fullName.trim()}
                      className="font-bold min-w-28"
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin mr-2" />
                          Đang lưu...
                        </>
                      ) : (
                        "Lưu thay đổi"
                      )}
                    </Button>
                  </div>
                </TabsContent>

                {/* Tab 2: Security & Password Settings */}
                <TabsContent value="security" className="p-6 space-y-6">
                  {profile.isGoogleUser ? (
                    /* Google User View: Dedicated Protected Security Card */
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
                          <svg className="size-6" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-foreground">
                            Tài khoản liên kết Google
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Bạn đã đăng nhập vào StayHub thông qua tài khoản Google (<strong className="text-foreground">{profile.email}</strong>). Mật khẩu, bảo mật 2 lớp (2FA) và phương thức khôi phục tài khoản của bạn được quản lý và bảo vệ bởi Google.
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-card p-4 border border-border text-xs space-y-2">
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                          <Lock className="size-4 text-amber-500" />
                          <span>Chính sách đổi mật khẩu StayHub</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          Vì bạn không sử dụng mật khẩu nội bộ StayHub, bạn <strong>không thể đổi mật khẩu hoặc email</strong> tại đây. Nếu muốn đổi mật khẩu Google hoặc kiểm tra lịch sử đăng nhập bảo mật, vui lòng truy cập trang quản lý tài khoản Google của bạn.
                        </p>
                        <div className="pt-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1.5"
                          >
                            <a
                              href="https://myaccount.google.com/security"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span>Mở Cài đặt bảo mật Google</span>
                              <ExternalLink className="size-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Local User View: Change Password Form */
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-bold text-foreground">
                          Đổi mật khẩu tài khoản
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Đảm bảo mật khẩu của bạn có ít nhất 6 ký tự để bảo vệ tài khoản an toàn.
                        </p>
                      </div>

                      <div className="space-y-4 max-w-md">
                        {/* Current Password */}
                        <div>
                          <label className="text-xs font-semibold text-foreground block mb-1.5">
                            Mật khẩu hiện tại <span className="text-destructive">*</span>
                          </label>
                          <div className="relative">
                            <Input
                              type={showCurrentPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder="Nhập mật khẩu đang dùng"
                              className="pl-9 pr-10 text-xs"
                            />
                            <KeyRound className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword((prev) => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="size-4" />
                              ) : (
                                <Eye className="size-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* New Password */}
                        <div>
                          <label className="text-xs font-semibold text-foreground block mb-1.5">
                            Mật khẩu mới <span className="text-destructive">*</span>
                          </label>
                          <div className="relative">
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Tối thiểu 6 ký tự"
                              className="pl-9 pr-10 text-xs"
                            />
                            <Lock className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword((prev) => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showNewPassword ? (
                                <EyeOff className="size-4" />
                              ) : (
                                <Eye className="size-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Confirm New Password */}
                        <div>
                          <label className="text-xs font-semibold text-foreground block mb-1.5">
                            Xác nhận mật khẩu mới <span className="text-destructive">*</span>
                          </label>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Nhập lại mật khẩu mới"
                              className="pl-9 pr-10 text-xs"
                            />
                            <Lock className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="size-4" />
                              ) : (
                                <Eye className="size-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Submit Password Change */}
                      <div className="pt-4 border-t border-border flex items-center justify-start gap-3">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => changePasswordMutation.mutate()}
                          disabled={
                            changePasswordMutation.isPending ||
                            !currentPassword ||
                            !newPassword ||
                            !confirmPassword
                          }
                          className="font-bold min-w-36"
                        >
                          {changePasswordMutation.isPending ? (
                            <>
                              <Loader2 className="size-4 animate-spin mr-2" />
                              Đang cập nhật...
                            </>
                          ) : (
                            "Cập nhật mật khẩu"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
