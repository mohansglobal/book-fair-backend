import { z } from "zod";

/**
 * Normalizes phone numbers by stripping whitespace, hyphens, and leading country code (91).
 * E.g., "+91 98765-43210" -> "9876543210"
 */
export const normalizePhoneNumber = (rawNumber?: string): string | undefined => {
  if (!rawNumber) return undefined;
  const digits = rawNumber.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  return digits;
};



export const registerUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters long"),
    number: z
      .string()
      .trim()
      .min(6, "Number must be at least 6 characters long"),
    gmail: z
      .string()
      .trim()
      .email("Invalid email/gmail address")
      .toLowerCase()
      .optional()
      .or(z.literal("")),
    email: z
      .string()
      .trim()
      .email("Invalid email/gmail address")
      .toLowerCase()
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long")
      .optional(),
  })
  .transform((data) => {
    const rawEmail = data.gmail || data.email;
    const resolvedGmail = rawEmail && rawEmail.trim() !== "" ? rawEmail.trim().toLowerCase() : undefined;
    const resolvedNumber = normalizePhoneNumber(data.number) || data.number.trim();

    return {
      name: data.name,
      number: resolvedNumber,
      gmail: resolvedGmail,
      password: data.password,
    };
  });

export type RegisterUserInput = z.infer<typeof registerUserSchema>;

export const sendOtpSchema = z
  .object({
    number: z.string().trim().min(6, "Number must be at least 6 characters long").optional(),
    gmail: z
      .string()
      .trim()
      .email("Invalid email/gmail address")
      .toLowerCase()
      .optional()
      .or(z.literal("")),
    email: z
      .string()
      .trim()
      .email("Invalid email/gmail address")
      .toLowerCase()
      .optional()
      .or(z.literal("")),
  })
  .transform((data) => {
    const rawEmail = data.gmail || data.email;
    const resolvedGmail = rawEmail && rawEmail.trim() !== "" ? rawEmail.trim().toLowerCase() : undefined;
    const resolvedNumber = normalizePhoneNumber(data.number);

    return {
      number: resolvedNumber,
      gmail: resolvedGmail,
    };
  })
  .refine((data) => Boolean(data.number || data.gmail), {
    message: "Either mobile number or email must be provided to send OTP",
  });

export type SendOtpInput = z.infer<typeof sendOtpSchema>;

export const verifyOtpSchema = z
  .object({
    number: z.string().trim().min(6, "Number must be at least 6 characters long").optional(),
    gmail: z
      .string()
      .trim()
      .email("Invalid email/gmail address")
      .toLowerCase()
      .optional()
      .or(z.literal("")),
    email: z
      .string()
      .trim()
      .email("Invalid email/gmail address")
      .toLowerCase()
      .optional()
      .or(z.literal("")),
    otp: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
  })
  .transform((data) => {
    const rawEmail = data.gmail || data.email;
    const resolvedGmail = rawEmail && rawEmail.trim() !== "" ? rawEmail.trim().toLowerCase() : undefined;
    const resolvedNumber = normalizePhoneNumber(data.number);

    return {
      number: resolvedNumber,
      gmail: resolvedGmail,
      otp: data.otp,
    };
  })
  .refine((data) => Boolean(data.number || data.gmail), {
    message: "Either mobile number or email must be provided to verify OTP",
  });

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const loginUserSchema = z
  .object({
    number: z.string().trim().min(6, "Number must be at least 6 characters long").optional(),
    gmail: z
      .string()
      .trim()
      .email("Invalid email/gmail address")
      .toLowerCase()
      .optional()
      .or(z.literal("")),
    email: z
      .string()
      .trim()
      .email("Invalid email/gmail address")
      .toLowerCase()
      .optional()
      .or(z.literal("")),
    password: z.string().min(1, "Password is required"),
  })
  .transform((data) => {
    const rawEmail = data.gmail || data.email;
    const resolvedGmail = rawEmail && rawEmail.trim() !== "" ? rawEmail.trim().toLowerCase() : undefined;
    const resolvedNumber = normalizePhoneNumber(data.number);

    return {
      number: resolvedNumber,
      gmail: resolvedGmail,
      password: data.password,
    };
  })
  .refine((data) => Boolean(data.number || data.gmail), {
    message: "Either mobile number or email must be provided to login",
  });

export type LoginUserInput = z.infer<typeof loginUserSchema>;
