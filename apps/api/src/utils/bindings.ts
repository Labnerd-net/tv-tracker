export type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  ENVIRONMENT?: string;
  CLIENT_URL?: string;
  JWT_ALGORITHM?: string;
  ACCESS_TOKEN_EXPIRY_MINUTES?: string;
  JWT_EXPIRATION_DAYS?: string;
  BCRYPT_SALT_ROUNDS?: string;
  LOG_LEVEL?: string;
};
