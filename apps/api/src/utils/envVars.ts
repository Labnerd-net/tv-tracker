import type { AlgorithmTypes } from 'hono/jwt';

export const dbOption = process.env.DB_TYPE?.toLocaleLowerCase() || 'sqlite';

const sqliteFile = process.env.DB_FILE_NAME || 'file:data/local.db';
export const dbUrl = sqliteFile;

const localClientURLs = ['http://localhost:4173', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080'];
const envClientURLs = process.env.CLIENT_URL?.split(",");
export const clientURL = envClientURLs || localClientURLs;

export const serverPort = Number(process.env.SERVER_PORT) || 3000;

export const jwtSecret = process.env.JWT_SECRET || 'super‑secret‑change‑me';
export const jwtAlgorithm = (process.env.JWT_ALGORITHM || 'HS256') as AlgorithmTypes;
export const jwtExpirationDays = Number(process.env.JWT_EXPIRATION_DAYS) || 7;

// Helper function to calculate JWT expiration (call this when creating tokens)
export function getJwtExpirationSeconds(): number {
  return Math.floor(Date.now() / 1000) + jwtExpirationDays * 24 * 60 * 60;
}

export const bcryptSaltRounds = Number(process.env.JWT_SALT_ROUNDS) || 10;

export const logLevel = process.env.LOG_LEVEL ?? 'info';
