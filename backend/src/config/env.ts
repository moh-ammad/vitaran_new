import { existsSync } from "node:fs";
import { z } from "zod";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z
    .string()
    .min(32, "must be at least 32 characters")
    .optional(),
  JWT_EXPIRES_IN_HOURS: z.coerce.number().int().positive().default(8),
  SCHOOL_JWT_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(365),
  PASSWORD_ENCRYPTION_KEY: z
    .string()
    .min(32, "must be at least 32 characters")
    .optional(),
  ADMIN_EMAIL: z.email().toLowerCase().optional(),
  ADMIN_PASSWORD: z.string().min(1).optional(),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:3000"),
});

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT?.trim() || undefined,
  DATABASE_URL: process.env.DATABASE_URL?.trim() || undefined,
  JWT_SECRET: process.env.JWT_SECRET?.trim() || undefined,
  JWT_EXPIRES_IN_HOURS: process.env.JWT_EXPIRES_IN_HOURS?.trim() || undefined,
  SCHOOL_JWT_EXPIRES_IN_DAYS:
    process.env.SCHOOL_JWT_EXPIRES_IN_DAYS?.trim() || undefined,
  PASSWORD_ENCRYPTION_KEY: process.env.PASSWORD_ENCRYPTION_KEY?.trim() || undefined,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL?.trim() || undefined,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || undefined,
  CORS_ORIGIN: process.env.CORS_ORIGIN?.trim() || undefined,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("\n");

  console.error(`Invalid environment configuration:\n${details}`);
  process.exit(1);
}

export const env = parsed.data;

export function getCorsOrigins(): string[] {
  return env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}
