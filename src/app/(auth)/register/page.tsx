"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerSchema } from "@/schemas/auth.schema";
import { authResponseSucceeded } from "@/lib/auth-ui";
import { Button } from "@/components/ui/button";

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
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">Create your StayHub account</h1>
      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        {(["fullName", "email", "password"] as const).map((name) => (
          <div key={name}>
            <label htmlFor={name}>
              {name === "fullName"
                ? "Full name"
                : name === "email"
                  ? "Email"
                  : "Password"}
            </label>
            <input
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
              className="mt-1 w-full rounded-md border p-2"
            />
            {errors[name] && (
              <p id={`${name}-error`} className="text-sm text-destructive">
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Register"}
        </Button>
      </form>
      <p className="mt-4">
        Already registered?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
      <p className="mt-2">
        <Link href="/verify-email" className="underline">
          Verify your email
        </Link>
      </p>
    </main>
  );
}
