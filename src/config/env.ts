import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string(),
  LOKI_HOST: z.string().url(),
  JWT_SECRET: z.string().min(10),
  ADMIN_SECRET: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables ❌");
  console.error(_env.error.format());
  process.exit(1);
}

export const env = _env.data;
