"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";
import { verifyOtpSchema } from "@/schemas/auth.schema";
import { authResponseSucceeded } from "@/lib/auth-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function VerifyForm() {
  const params = useSearchParams();
  const router = useRouter();
  const busy = useRef(false);
  const [error, setError] = useState("");
  const [resendStatus, setResendStatus] = useState<{
    loading: boolean;
    success?: string;
    error?: string;
  }>({ loading: false });
  const [cooldown, setCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof verifyOtpSchema>>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email: params.get("email") ?? "", otp: "" },
  });

  // Countdown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    const email = getValues("email")?.trim();
    if (!email) {
      setResendStatus({ loading: false, error: "Please enter your email above first." });
      return;
    }

    setResendStatus({ loading: true });
    setError("");

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setResendStatus({
          loading: false,
          error: data.message || "Failed to resend code. Please try again later.",
        });
        return;
      }

      setResendStatus({
        loading: false,
        success: "A new verification code has been sent to your email.",
      });
      setCooldown(60);
    } catch {
      setResendStatus({
        loading: false,
        error: "Unable to connect. Please try again.",
      });
    }
  };

  const submit = handleSubmit(async (values) => {
    if (busy.current) return;
    busy.current = true;
    setError("");
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok || !authResponseSucceeded(body)) {
        setError(
          response.status === 400
            ? "The code is invalid or expired. Check your email and try again."
            : "Unable to verify this email. Check your details or contact support."
        );
        return;
      }
      router.replace("/login?verified=1");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      busy.current = false;
    }
  });

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-card border border-border bg-card p-6 sm:p-8 shadow-sm text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="size-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
          Verify your email
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the six-digit code sent to your email. Codes expire after 10
          minutes.
        </p>

        <form onSubmit={submit} noValidate className="mt-6 space-y-4 text-left">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              aria-invalid={!!errors.email}
              aria-describedby="email-error"
              className="h-10 rounded-xl"
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-destructive">
                {errors.email?.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="otp"
                className="text-sm font-medium text-foreground"
              >
                Verification code
              </label>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resendStatus.loading}
                className="text-xs font-semibold text-primary hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {resendStatus.loading
                  ? "Sending…"
                  : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Resend code"}
              </button>
            </div>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              {...register("otp")}
              aria-invalid={!!errors.otp}
              aria-describedby="otp-error"
              placeholder="123456"
              className="h-10 rounded-xl text-center font-mono text-base tracking-widest"
            />
            {errors.otp && (
              <p id="otp-error" className="text-xs text-destructive">
                {errors.otp?.message}
              </p>
            )}
          </div>

          {resendStatus.success && (
            <p className="text-xs font-medium text-emerald-600 bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/20">
              {resendStatus.success}
            </p>
          )}

          {resendStatus.error && (
            <p className="text-xs font-medium text-destructive bg-destructive/10 rounded-lg p-2 border border-destructive/20">
              {resendStatus.error}
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Verifying…" : "Verify email"}
          </Button>
        </form>

        <div className="mt-6 flex flex-col gap-3">
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Back to login</Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            No code? Check your spam folder or click &ldquo;Resend code&rdquo; above.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p role="status">Loading verification form…</p>}>
      <VerifyForm />
    </Suspense>
  );
}
