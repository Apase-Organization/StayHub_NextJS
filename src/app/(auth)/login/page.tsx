"use client";

import { Suspense, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginSchema } from "@/schemas/auth.schema";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, LogIn } from "lucide-react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

function OAuthErrorMessage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (!error)
    return searchParams.get("verified") === "1" ? (
      <p role="status">Email verified. You can now log in.</p>
    ) : null;

  let message = "Unable to log in. Please try again.";
  if (error === "AccessDenied") {
    message =
      "Access was denied. Your account may be restricted or Google access may not be enabled. Contact support.";
  } else if (error === "Configuration") {
    message = "Login is temporarily unavailable. Please contact support.";
  } else if (error === "OAuthCallbackError") {
    message = "Unable to connect with Google. Please try again.";
  }

  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-left text-xs text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export default function LoginPage() {
  const busy = useRef(false);
  const [error, setError] = useState("");
  const [googleBusy, setGoogleBusy] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });
  const submit = handleSubmit(async (values) => {
    if (busy.current) return;
    busy.current = true;
    setError("");
    try {
      const result = await signIn("credentials", {
        ...values,
        redirect: false,
        callbackUrl: "/",
      });
      if (!result || result.error)
        setError(
          "Unable to log in. Check your credentials and verify your email."
        );
      else window.location.assign("/");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      busy.current = false;
    }
  });
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-card border border-border bg-card p-8 shadow-sm text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LogIn className="size-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
          Log in to StayHub
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Log in with your email or Google account.
        </p>

        <div className="mt-4">
          <Suspense fallback={null}>
            <OAuthErrorMessage />
          </Suspense>
        </div>

        <form onSubmit={submit} noValidate className="mt-6 space-y-4 text-left">
          {(["email", "password"] as const).map((name) => (
            <div key={name}>
              <label htmlFor={name}>
                {name === "email" ? "Email" : "Password"}
              </label>
              <input
                id={name}
                type={name}
                autoComplete={
                  name === "password" ? "current-password" : "email"
                }
                {...register(name)}
                aria-invalid={!!errors[name]}
                aria-describedby={`${name}-error`}
                className="mt-1 w-full rounded-md border p-2"
              />
              <p id={`${name}-error`} className="text-sm text-destructive">
                {errors[name]?.message}
              </p>
            </div>
          ))}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || googleBusy}
            className="w-full"
          >
            {isSubmitting ? "Logging in…" : "Log in"}
          </Button>
        </form>
        <div className="mt-6 flex flex-col gap-3">
          <Button
            className="w-full"
            disabled={isSubmitting || googleBusy}
            onClick={async () => {
              if (busy.current) return;
              busy.current = true;
              setGoogleBusy(true);
              try {
                await signIn("google", { callbackUrl: "/" });
              } catch {
                setError("Unable to connect with Google. Please try again.");
              } finally {
                busy.current = false;
                setGoogleBusy(false);
              }
            }}
          >
            Continue with Google
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Back to home</Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            New to StayHub?{" "}
            <Link
              href="/register"
              className="font-semibold text-primary hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
