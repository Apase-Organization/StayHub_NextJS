import { z } from "zod";

export const registerSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(8, "Use at least 8 characters."),
  fullName: z.string().trim().min(1, "Enter your full name."),
});

export const loginSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1, "Enter your password."),
});

export const verifyOtpSchema = z.object({
  email: z.email().toLowerCase(),
  otp: z.string().regex(/^\d{6}$/, "Enter the six-digit code."),
});
