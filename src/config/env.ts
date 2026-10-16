import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  CLIENT_URL: z.string().default("http://localhost:3000"),
  
  // Email (SMTP) Configuration - Exact Keys
  EMAIL_HOST: z.string().default("smtp.hostinger.com"),
  EMAIL_PORT: z.coerce.number().default(465),
  EMAIL_USER: z.string().optional().default("info@geisil.com"),
  EMAIL_PASS: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional(),
  SMTP_KYC_USER: z.string().optional(),
  SMTP_KYC_PASS: z.string().optional(),

  // SMS Gateway Configuration
  SMS_LINK: z.string().default("https://api.mylogin.co.in"),
  SMS_KEY: z.string().optional().default(""),
  SMS_CLIENT_ID: z.string().optional().default(""),
  SMS_SENDER_ID: z.string().default("GEISIL"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:", parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsedEnv.data;
