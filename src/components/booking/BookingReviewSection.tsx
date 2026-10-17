"use client";

import * as React from "react";
import { Star, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string | Date;
}

interface BookingReviewSectionProps {
  bookingId: string;
  bookingStatus: string;
  checkOutDate: string | Date;
  initialReview?: ReviewData | null;
}

export function BookingReviewSection({
  bookingId,
  bookingStatus,
  checkOutDate,
  initialReview,
}: BookingReviewSectionProps) {
  const [review, setReview] = React.useState<ReviewData | null>(
    initialReview || null
  );
  const [rating, setRating] = React.useState(5);
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);
  const [comment, setComment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const now = new Date();
  const isTripFinished =
    bookingStatus === "COMPLETED" ||
    (bookingStatus === "CONFIRMED" && new Date(checkOutDate) <= now);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Không thể gửi đánh giá");
      }

      setReview(data.data);
      setSuccessMsg("Cảm ơn bạn đã gửi đánh giá cho kỳ nghỉ này!");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi gửi đánh giá. Vui lòng thử lại sau."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Case 1: Đã có đánh giá
  if (review) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="size-5 text-emerald-600" />
          <h3 className="text-base font-bold text-foreground">
            Đánh giá của bạn về kỳ nghỉ
          </h3>
        </div>
        <div className="flex items-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`size-4 ${
                star <= review.rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30"
              }`}
            />
          ))}
          <span className="ml-2 text-sm font-semibold text-foreground">
            {review.rating}/5
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            {new Date(review.createdAt).toLocaleDateString("vi-VN")}
          </span>
        </div>
        {review.comment && (
          <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl p-3 mt-2 border border-border/50">
            {review.comment}
          </p>
        )}
      </div>
    );
  }

  // Case 2: Booking bị hủy
  if (bookingStatus === "CANCELLED") {
    return null;
  }

  // Case 3: Chuyến đi chưa kết thúc
  if (!isTripFinished) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 sm:p-6 text-center">
        <MessageSquare className="size-6 text-muted-foreground mx-auto mb-2 opacity-60" />
        <h4 className="text-sm font-semibold text-foreground">
          Đánh giá kỳ nghỉ
        </h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          Bạn có thể chia sẻ trải nghiệm và đánh giá chỗ ở sau khi hoàn tất kỳ
          nghỉ vào ngày{" "}
          <span className="font-medium text-foreground">
            {new Date(checkOutDate).toLocaleDateString("vi-VN")}
          </span>
          .
        </p>
      </div>
    );
  }

  // Case 4: Đủ điều kiện và chưa đánh giá -> Hiển thị Form
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="size-5 text-primary" />
        <h3 className="text-base font-bold text-foreground">
          Đánh giá trải nghiệm kỳ nghỉ của bạn
        </h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Nhận xét của bạn sẽ giúp những vị khách khác và giúp chủ nhà nâng cao chất
        lượng phục vụ.
      </p>

      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 border border-emerald-500/20">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive border border-destructive/20">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">
            Bạn đánh giá kỳ nghỉ này mấy sao?
          </label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = star <= (hoverRating ?? rating);
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 rounded-lg hover:bg-muted transition-colors focus:outline-none"
                  aria-label={`${star} sao`}
                >
                  <Star
                    className={`size-6 transition-all ${
                      active
                        ? "fill-amber-400 text-amber-400 scale-110"
                        : "text-muted-foreground/40 hover:text-amber-400"
                    }`}
                  />
                </button>
              );
            })}
            <span className="text-sm font-semibold text-foreground ml-2">
              {hoverRating ?? rating}/5 sao
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="review-comment"
            className="text-xs font-semibold text-foreground mb-1.5 block"
          >
            Nhận xét chi tiết (tùy chọn)
          </label>
          <textarea
            id="review-comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ về độ sạch sẽ, tiện nghi, vị trí hoặc sự hỗ trợ từ chủ nhà..."
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "Đang gửi đánh giá..." : "Gửi đánh giá"}
        </Button>
      </form>
    </div>
  );
}
