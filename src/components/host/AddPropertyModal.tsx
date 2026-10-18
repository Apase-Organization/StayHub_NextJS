"use client";

import * as React from "react";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  UploadCloud,
  X,
  ImageIcon,
  Star,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface AddPropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccessToast: (msg: string) => void;
}

export function AddPropertyModal({
  open,
  onOpenChange,
  onSuccessToast,
}: AddPropertyModalProps) {
  const queryClient = useQueryClient();

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
  });

  // Images state
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [coverIndex, setCoverIndex] = React.useState<number>(0);
  const [uploadStepText, setUploadStepText] = React.useState<string | null>(
    null
  );

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const previewsRef = React.useRef(previews);
  React.useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  // Retained previews must stay live when another photo is added or removed.
  React.useEffect(() => {
    return () => {
      previewsRef.current.forEach((p) => URL.revokeObjectURL(p));
    };
  }, []);

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const validFiles = files.filter((f) =>
      ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(f.type)
    );

    if (validFiles.length < files.length) {
      onSuccessToast(
        "Một số file không đúng định dạng (chỉ hỗ trợ JPG, PNG, WebP)"
      );
    }

    const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    if (coverIndex === index) {
      setCoverIndex(0);
    } else if (coverIndex > index) {
      setCoverIndex((prev) => prev - 1);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      setUploadStepText("Đang tạo thông tin chỗ ở...");

      // 1. Tạo property trong database
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Không thể tạo chỗ ở mới");
      }

      const createdProperty = json.data;
      let imagesUploaded = selectedFiles.length === 0;

      // 2. Tải ảnh lên Cloudinary nếu có chọn ảnh
      if (selectedFiles.length > 0) {
        setUploadStepText(
          `Đang tải ${selectedFiles.length} hình ảnh lên Cloudinary...`
        );

        // Đưa ảnh cover lên đầu danh sách upload để tự động thành cover
        const reorderedFiles = [...selectedFiles];
        if (coverIndex > 0 && coverIndex < reorderedFiles.length) {
          const [coverFile] = reorderedFiles.splice(coverIndex, 1);
          reorderedFiles.unshift(coverFile);
        }

        const imgFormData = new FormData();
        reorderedFiles.forEach((file) => imgFormData.append("files", file));

        try {
          const imgRes = await fetch(
            `/api/properties/${createdProperty.id}/images`,
            { method: "POST", body: imgFormData }
          );
          const imgJson = await imgRes.json();
          imagesUploaded = imgRes.ok && imgJson.success === true;
        } catch {
          // The property already exists. Do not invite a duplicate creation retry.
          imagesUploaded = false;
        }
      }

      return { createdProperty, imagesUploaded };
    },
    onSuccess: ({ imagesUploaded }) => {
      queryClient.invalidateQueries({ queryKey: ["hostProperties"] });
      queryClient.invalidateQueries({ queryKey: ["hostStats"] });
      onOpenChange(false);
      onSuccessToast(
        !imagesUploaded
          ? "Đã tạo chỗ ở, nhưng tải ảnh thất bại. Mở Chỉnh sửa chỗ ở để kiểm tra và tải lại ảnh."
          : selectedFiles.length > 0
            ? "Đăng chỗ ở mới và tải ảnh lên Cloudinary thành công!"
            : "Đăng chỗ ở mới thành công!"
      );

      // Reset form
      setFormData({
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
      previews.forEach((p) => URL.revokeObjectURL(p));
      setSelectedFiles([]);
      setPreviews([]);
      setCoverIndex(0);
      setUploadStepText(null);
    },
    onError: (err: Error) => {
      setUploadStepText(null);
      onSuccessToast(err.message || "Đã xảy ra lỗi khi tạo chỗ ở");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Đăng thông tin chỗ ở mới
          </DialogTitle>
          <DialogDescription className="text-xs">
            Điền thông tin và tải ảnh thực tế lên Cloudinary để hiển thị cho du
            khách trên StayHub.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Section 1: Thông tin cơ bản */}
          <div>
            <label className="font-semibold text-muted-foreground block mb-1">
              Tiêu đề chỗ ở <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="VD: Căn hộ Studio view hồ Tây lãng mạn"
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
              rows={3}
              className="w-full rounded-md border border-border bg-transparent p-2.5 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-primary outline-none"
              placeholder="Mô tả không gian, tiện ích, vị trí và trải nghiệm..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                <option value="APARTMENT">Căn hộ (Apartment)</option>
                <option value="VILLA">Biệt thự (Villa)</option>
                <option value="HOUSE">Nhà nguyên căn (House)</option>
                <option value="HOTEL_ROOM">Khách sạn (Hotel Room)</option>
                <option value="RESORT">Khu nghỉ dưỡng (Resort)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                Thành phố / Tỉnh <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder="VD: Hà Nội, Đà Nẵng, TP.HCM..."
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-muted-foreground block mb-1">
              Địa chỉ chi tiết <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="VD: 123 Đường Yên Phụ, Ba Đình, Hà Nội"
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

          {/* Section 2: Upload ảnh Cloudinary */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                <ImageIcon className="size-4 text-primary" />
                Hình ảnh chỗ ở (Cloudinary)
              </label>
              <span className="text-[11px] text-muted-foreground">
                Đã chọn {selectedFiles.length} ảnh
              </span>
            </div>

            {/* Upload Dropzone */}
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
                onChange={handleFilesSelect}
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UploadCloud className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-xs">
                    Nhấn vào đây để tải ảnh lên Cloudinary
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Hỗ trợ định dạng JPG, PNG, WebP (Tối đa 10MB/ảnh)
                  </p>
                </div>
              </div>
            </div>

            {/* Image Previews */}
            {previews.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] text-muted-foreground mb-2">
                  <span className="font-semibold text-foreground">Gợi ý:</span>{" "}
                  Bấm vào biểu tượng ngôi sao để chọn ảnh làm ảnh bìa chính
                  (Cover).
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {previews.map((previewUrl, index) => {
                    const isCover = coverIndex === index;
                    return (
                      <div
                        key={index}
                        className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 group bg-muted ${
                          isCover
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border"
                        }`}
                      >
                        <Image
                          src={previewUrl}
                          alt={`Preview ${index}`}
                          fill
                          className="object-cover"
                        />

                        {/* Top action bar on preview */}
                        <div className="absolute inset-x-0 top-0 p-1 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCoverIndex(index);
                            }}
                            className={`p-1 rounded-full transition-colors ${
                              isCover
                                ? "bg-amber-400 text-slate-900 shadow-sm"
                                : "bg-black/40 text-white hover:text-amber-300"
                            }`}
                            title={
                              isCover ? "Ảnh bìa chính" : "Đặt làm ảnh bìa"
                            }
                          >
                            <Star className="size-3 fill-current" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(index);
                            }}
                            className="p-1 rounded-full bg-black/40 text-white hover:bg-destructive hover:text-white transition-colors"
                            title="Xoá ảnh này"
                          >
                            <X className="size-3" />
                          </button>
                        </div>

                        {/* Cover label */}
                        {isCover && (
                          <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground font-bold text-[9px] px-1.5 py-0.5 rounded shadow-xs">
                            Ảnh bìa
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {uploadStepText && (
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-2.5 flex items-center gap-2 text-xs text-primary font-medium">
            <Loader2 className="size-4 animate-spin shrink-0" />
            <span>{uploadStepText}</span>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            Huỷ
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={
              createMutation.isPending ||
              !formData.title.trim() ||
              !formData.address.trim() ||
              !formData.description.trim()
            }
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {uploadStepText || "Đang xử lý..."}
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-1.5 size-4" />
                Xác nhận tạo chỗ ở
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
