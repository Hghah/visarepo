import { z } from 'zod';

const bool = z.enum(['true', 'false', '1', '0']).transform((v) => v === 'true' || v === '1');

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a postgres:// connection string' }),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  /** Comma-separated list of origins allowed to call the API from a browser. */
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(300),
  /**
   * Shared secret the web server sends in `x-internal-token`. Its requests skip the per-IP rate limit,
   * since every visitor's page is fetched from the same server address. Leave unset to rate-limit everything.
   */
  INTERNAL_API_TOKEN: z.string().min(16, 'INTERNAL_API_TOKEN must be at least 16 characters').optional(),
  SWAGGER_ENABLED: bool.default(true),
  LOG_LEVEL: z.enum(['error', 'warn', 'log', 'debug', 'verbose']).default('log'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
