"use client";

import Link from "next/link";
import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { verifyOtpSchema } from "@/schemas/auth.schema";
import { authResponseSucceeded } from "@/lib/auth-ui";
import { Button } from "@/components/ui/button";

function VerifyForm() {
  const params = useSearchParams();
  const router = useRouter();
  const busy = useRef(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof verifyOtpSchema>>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email: params.get("email") ?? "", otp: "" },
  });
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
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">Verify your email</h1>
      <p className="mt-2">
        Enter the six-digit code from your email. Codes expire after 10 minutes.
      </p>
      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            aria-invalid={!!errors.email}
            aria-describedby="email-error"
            className="mt-1 w-full rounded-md border p-2"
          />
          <p id="email-error" className="text-sm text-destructive">
            {errors.email?.message}
          </p>
        </div>
        <div>
          <label htmlFor="otp">Verification code</label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            {...register("otp")}
            aria-invalid={!!errors.otp}
            aria-describedby="otp-error"
            className="mt-1 w-full rounded-md border p-2"
          />
          <p id="otp-error" className="text-sm text-destructive">
            {errors.otp?.message}
          </p>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Verifying…" : "Verify email"}
        </Button>
      </form>
      <p className="mt-4">
        <Link href="/login" className="underline">
          Back to login
        </Link>
      </p>
      <p className="mt-2 text-sm">
        No code? Check your spam folder or contact support. Resending codes is
        not currently available.
      </p>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p role="status">Loading verification form…</p>}>
      <VerifyForm />
    </Suspense>
  );
}
