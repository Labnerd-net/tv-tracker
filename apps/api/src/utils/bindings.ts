// Hono context bindings type. Includes the core Workers bindings (TV_DB,
// JWT_SECRET, ENVIRONMENT) generated in worker-configuration.d.ts, plus
// optional runtime vars not declared in wrangler.jsonc.
export type Bindings = {
  TV_DB: D1Database;
  JWT_SECRET: string;
  ENVIRONMENT?: string;
  CLIENT_URL?: string;
  JWT_ALGORITHM?: string;
  ACCESS_TOKEN_EXPIRY_MINUTES?: string;
  JWT_EXPIRATION_DAYS?: string;
  BCRYPT_SALT_ROUNDS?: string;
  LOG_LEVEL?: string;
};
