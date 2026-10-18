"use client";

import * as React from "react";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  UploadCloud,
  Trash2,
  Star,
  ImageIcon,
  Save,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface HostImage {
  id: string;
  url: string;
  isCover: boolean;
  publicId?: string;
}

export interface HostPropertyItem {
  id: string;
  title: string;
  description?: string;
  city: string;
  address: string;
  pricePerNight: number;
  cleaningFee: number;
  maxGuests: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  type: string;
  status: "ACTIVE" | "INACTIVE";
  ratingAvg: number;
  images: HostImage[];
}

interface EditPropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: HostPropertyItem | null;
  onSuccessToast: (msg: string) => void;
}

export function EditPropertyModal({
  open,
  onOpenChange,
  property,
  onSuccessToast,
}: EditPropertyModalProps) {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = React.useState<"info" | "images">("info");

  // Form State
  const [formData, setFormData] = React.useState({
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
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  // Images State
  const [images, setImages] = React.useState<HostImage[]>([]);
  const [isUploadingImages, setIsUploadingImages] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync state when property prop changes
  React.useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || "",
        description: property.description || "",
        type: property.type || "HOMESTAY",
        city: property.city || "",
        address: property.address || "",
        pricePerNight: property.pricePerNight || 0,
        cleaningFee: property.cleaningFee || 0,
        maxGuests: property.maxGuests || 1,
        bedrooms: property.bedrooms ?? 1,
        beds: property.beds ?? 1,
        bathrooms: property.bathrooms ?? 1,
        status: property.status || "ACTIVE",
      });
      setImages(property.images || []);
      setUploadError(null);
    }
  }, [property]);

  // Mutation: Update Property Info
  const updateInfoMutation = useMutation({
    mutationFn: async () => {
      if (!property) return;
      const res = await fetch(`/api/properties/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Không thể cập nhật chỗ ở");
      }
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hostProperties"] });
      queryClient.invalidateQueries({ queryKey: ["hostStats"] });
      onOpenChange(false);
      onSuccessToast("Cập nhật thông tin chỗ ở thành công!");
    },
    onError: (err: Error) => {
      onSuccessToast(err.message || "Lỗi khi cập nhật");
    },
  });

  // Action: Upload more images
  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!property || !e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setIsUploadingImages(true);
    setUploadError(null);

    try {
      const imgFormData = new FormData();
      files.forEach((f) => imgFormData.append("files", f));

      const res = await fetch(`/api/properties/${property.id}/images`, {
        method: "POST",
        body: imgFormData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Lỗi khi tải ảnh lên Cloudinary");
      }

      const uploaded = Array.isArray(json.data) ? json.data : [json.data];
      const newImgItems: HostImage[] = uploaded.map((item: { id: string; imageUrl?: string; url?: string; isCover: boolean; publicId?: string }) => ({
        id: item.id,
        url: item.imageUrl || item.url || "",
        isCover: item.isCover,
        publicId: item.publicId,
      }));

      setImages((prev) => [...prev, ...newImgItems]);
      queryClient.invalidateQueries({ queryKey: ["hostProperties"] });
      onSuccessToast(`Đã tải thêm ${newImgItems.length} ảnh lên Cloudinary!`);
    } catch (err: unknown) {
      const error = err as Error;
      setUploadError(error.message || "Lỗi tải ảnh");
      onSuccessToast(error.message || "Không thể tải ảnh");
    } finally {
      setIsUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Action: Set cover image
  const handleSetCover = async (imageId: string) => {
    if (!property) return;
    try {
      const res = await fetch(`/api/properties/${property.id}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Lỗi khi đặt ảnh bìa");
      }

      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          isCover: img.id === imageId,
        }))
      );
      queryClient.invalidateQueries({ queryKey: ["hostProperties"] });
      onSuccessToast("Đã đặt làm ảnh bìa chính!");
    } catch (err: unknown) {
      const error = err as Error;
      onSuccessToast(error.message || "Không thể đặt ảnh bìa");
    }
  };

  // Action: Delete image
  const handleDeleteImage = async (imageId: string) => {
    if (!property) return;
    try {
      const res = await fetch(
        `/api/properties/${property.id}/images?imageId=${imageId}`,
        { method: "DELETE" }
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Lỗi khi xoá ảnh");
      }

      setImages((prev) => {
        const remaining = prev.filter((img) => img.id !== imageId);
        // if deleted image was cover, promote first remaining to cover
        if (remaining.length > 0 && !remaining.some((img) => img.isCover)) {
          remaining[0].isCover = true;
        }
        return remaining;
      });

      queryClient.invalidateQueries({ queryKey: ["hostProperties"] });
      onSuccessToast("Đã xoá ảnh thành công!");
    } catch (err: unknown) {
      const error = err as Error;
      onSuccessToast(error.message || "Không thể xoá ảnh");
    }
  };

  if (!property) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            <DialogTitle className="text-lg font-bold">
              Chỉnh sửa chỗ ở: {property.title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Cập nhật thông tin chi tiết, giá cả và quản lý ảnh trên Cloudinary.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "info" | "images")}
          className="w-full mt-2"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info" className="text-xs font-bold">
              Thông tin chỗ ở & Giá
            </TabsTrigger>
            <TabsTrigger value="images" className="text-xs font-bold">
              Hình ảnh ({images.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: THÔNG TIN CHỖ Ở */}
          <TabsContent value="info" className="space-y-4 pt-3 text-xs">
            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                Tiêu đề chỗ ở <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                Mô tả chi tiết <span className="text-destructive">*</span>
              </label>
              <textarea
                rows={4}
                className="w-full rounded-md border border-border bg-transparent p-2.5 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-primary outline-none"
                placeholder="Mô tả không gian, tiện ích, vị trí..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Loại hình
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
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
                  Thành phố <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "ACTIVE" | "INACTIVE",
                    })
                  }
                  className="w-full rounded-md border border-border bg-card p-2 text-xs text-foreground outline-none"
                >
                  <option value="ACTIVE">Hoạt động (Đón khách)</option>
                  <option value="INACTIVE">Tạm ngưng (Lưu trữ)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                Địa chỉ chi tiết <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Giá mỗi đêm (VND) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  min={0}
                  value={formData.pricePerNight}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
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
                  min={0}
                  value={formData.cleaningFee}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
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
                  min={1}
                  value={formData.maxGuests}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
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
                  min={0}
                  value={formData.bedrooms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bedrooms: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Số giường
                </label>
                <Input
                  type="number"
                  min={1}
                  value={formData.beds}
                  onChange={(e) =>
                    setFormData({ ...formData, beds: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Phòng tắm
                </label>
                <Input
                  type="number"
                  min={1}
                  value={formData.bathrooms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bathrooms: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={updateInfoMutation.isPending}
              >
                Huỷ
              </Button>
              <Button
                type="button"
                onClick={() => updateInfoMutation.mutate()}
                disabled={
                  updateInfoMutation.isPending ||
                  !formData.title.trim() ||
                  !formData.address.trim()
                }
              >
                {updateInfoMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="mr-1.5 size-4" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* TAB 2: QUẢN LÝ ẢNH CLOUDINARY */}
          <TabsContent value="images" className="space-y-4 pt-3 text-xs">
            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-5 text-center cursor-pointer bg-muted/20 hover:bg-muted/30"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={handleUploadFiles}
                disabled={isUploadingImages}
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {isUploadingImages ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <UploadCloud className="size-5" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-xs">
                    {isUploadingImages
                      ? "Đang tải ảnh lên Cloudinary..."
                      : "Nhấn để tải thêm ảnh lên Cloudinary"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Hỗ trợ tải nhiều ảnh cùng lúc (JPG, PNG, WebP)
                  </p>
                </div>
              </div>
            </div>

            {uploadError && (
              <p className="text-xs text-destructive">{uploadError}</p>
            )}

            {/* Existing Images Gallery */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                  <ImageIcon className="size-4 text-primary" />
                  Danh sách ảnh hiện tại ({images.length})
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Nhấp vào sao để đổi ảnh bìa chính
                </span>
              </div>

              {images.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-xs">
                  Chỗ ở này chưa có hình ảnh nào. Hãy tải ảnh lên để thu hút khách đặt phòng!
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 group bg-muted ${
                        img.isCover
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border"
                      }`}
                    >
                      <Image
                        src={img.url}
                        alt="Property image"
                        fill
                        className="object-cover"
                      />

                      {/* Top Overlay controls */}
                      <div className="absolute inset-x-0 top-0 p-1.5 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
                        <button
                          type="button"
                          onClick={() => handleSetCover(img.id)}
                          className={`p-1 rounded-full transition-colors ${
                            img.isCover
                              ? "bg-amber-400 text-slate-900 shadow-xs"
                              : "bg-black/50 text-white hover:text-amber-300"
                          }`}
                          title={img.isCover ? "Ảnh bìa chính" : "Đặt làm ảnh bìa chính"}
                        >
                          <Star className="size-3.5 fill-current" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img.id)}
                          className="p-1 rounded-full bg-black/50 text-white hover:bg-destructive hover:text-white transition-colors"
                          title="Xoá ảnh này"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      {/* Cover Badge */}
                      {img.isCover && (
                        <div className="absolute bottom-1.5 left-1.5">
                          <Badge className="text-[9px] bg-primary text-primary-foreground font-bold px-1.5 py-0.5">
                            Ảnh bìa chính
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Đóng
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
