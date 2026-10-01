import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  ENCRYPTION_KEY: z.string().min(32, "ENCRYPTION_KEY must be at least 32 characters"),
  DELIVERY_CODE_PEPPER: z.string().min(16, "DELIVERY_CODE_PEPPER must be at least 16 characters"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DEMO_MODE: z.preprocess((val) => val === "true" || val === "1" || val === true, z.boolean()).default(true),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env;

export function getEnv(): Env {
  if (parsedEnv) return parsedEnv;

  const result = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    DELIVERY_CODE_PEPPER: process.env.DELIVERY_CODE_PEPPER,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    DEMO_MODE: process.env.DEMO_MODE,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  parsedEnv = result.data;
  return parsedEnv;
}
