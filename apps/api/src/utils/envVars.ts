import 'dotenv/config';
import type { AlgorithmTypes } from 'hono/jwt';

const sqliteFile = process.env.DB_FILE_NAME || 'file:data/local.db';
export const dbUrl = sqliteFile;

const localClientURLs = ['http://localhost:4173', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080'];
const envClientURLs = process.env.CLIENT_URL?.split(",");
export const clientURLs = envClientURLs || localClientURLs;

export const serverPort = Number(process.env.SERVER_PORT) || 3000;

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
export const jwtSecret = process.env.JWT_SECRET;
export const jwtAlgorithm = (process.env.JWT_ALGORITHM || 'HS256') as AlgorithmTypes;

const accessTokenExpiryMinutes = Number(process.env.ACCESS_TOKEN_EXPIRY_MINUTES) || 15;
export const refreshTokenExpiryDays = Number(process.env.JWT_EXPIRATION_DAYS) || 7;

// Helper: access token exp claim (seconds since epoch)
export function getAccessTokenExpirationSeconds(): number {
  return Math.floor(Date.now() / 1000) + accessTokenExpiryMinutes * 60;
}

// Backward-compat alias used by existing call sites
export const getJwtExpirationSeconds = getAccessTokenExpirationSeconds;

// Helper: refresh token expiry as a Date
export function getRefreshTokenExpirationDate(): Date {
  return new Date(Date.now() + refreshTokenExpiryDays * 24 * 60 * 60 * 1000);
}

export const isProduction = process.env.NODE_ENV === 'production';

export const bcryptSaltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

export const logLevel = process.env.LOG_LEVEL ?? 'info';

// Optional. If set, only the user registering with this email receives admin role.
// If unset, no user is auto-promoted to admin.
export const adminEmail: string | undefined = process.env.ADMIN_EMAIL || undefined;
