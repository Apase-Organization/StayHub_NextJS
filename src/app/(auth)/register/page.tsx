"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus } from "lucide-react";
import { registerSchema } from "@/schemas/auth.schema";
import { authResponseSucceeded } from "@/lib/auth-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const busy = useRef(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });
  const submit = handleSubmit(async (values) => {
    if (busy.current) return;
    busy.current = true;
    setError("");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok || !authResponseSucceeded(body)) {
        setError(
          response.status === 409
            ? "This email is already registered. Log in or verify your email if you have a code."
            : "Registration could not be completed. If you received a code, verify your email; otherwise contact support before trying again."
        );
        return;
      }
      router.push(
        `/verify-email?${new URLSearchParams({ email: values.email })}`
      );
    } catch {
      setError("Unable to connect. Check your inbox before trying again.");
    } finally {
      busy.current = false;
    }
  });
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-card border border-border bg-card p-6 sm:p-8 shadow-sm text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserPlus className="size-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
          Create your StayHub account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign up to book verified stays and manage your reservations.
        </p>

        <form onSubmit={submit} noValidate className="mt-6 space-y-4 text-left">
          {(["fullName", "email", "password"] as const).map((name) => (
            <div key={name} className="space-y-1.5">
              <label
                htmlFor={name}
                className="text-sm font-medium text-foreground"
              >
                {name === "fullName"
                  ? "Full name"
                  : name === "email"
                    ? "Email"
                    : "Password"}
              </label>
              <Input
                id={name}
                type={
                  name === "password"
                    ? "password"
                    : name === "email"
                      ? "email"
                      : "text"
                }
                autoComplete={
                  name === "fullName"
                    ? "name"
                    : name === "password"
                      ? "new-password"
                      : "email"
                }
                {...register(name)}
                aria-invalid={!!errors[name]}
                aria-describedby={errors[name] ? `${name}-error` : undefined}
                className="h-10 rounded-xl"
              />
              {errors[name] && (
                <p id={`${name}-error`} className="text-xs text-destructive">
                  {errors[name]?.message}
                </p>
              )}
            </div>
          ))}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating account…" : "Register"}
          </Button>
        </form>

        <div className="mt-6 flex flex-col gap-3">
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Back to home</Link>
          </Button>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              Already registered?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary hover:underline"
              >
                Log in
              </Link>
            </p>
            <p>
              <Link
                href="/verify-email"
                className="text-muted-foreground underline hover:text-foreground"
              >
                Have a verification code? Verify your email
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
