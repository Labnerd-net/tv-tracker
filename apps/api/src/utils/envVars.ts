import type { AlgorithmTypes } from 'hono/jwt';
import type { Bindings } from './bindings.js';

export function jwtSecret(env: Bindings): string {
  return env.JWT_SECRET;
}

export function jwtAlgorithm(env: Bindings): AlgorithmTypes {
  return (env.JWT_ALGORITHM ?? 'HS256') as AlgorithmTypes;
}

export function bcryptSaltRounds(env: Bindings): number {
  return Number(env.BCRYPT_SALT_ROUNDS) || 10;
}

export function isProduction(env: Bindings): boolean {
  return env.ENVIRONMENT === 'production';
}

export function accessTokenExpiryMinutes(env: Bindings): number {
  return Number(env.ACCESS_TOKEN_EXPIRY_MINUTES) || 15;
}

export function refreshTokenExpiryDays(env: Bindings): number {
  return Number(env.JWT_EXPIRATION_DAYS) || 7;
}

export function getAccessTokenExpirationSeconds(env: Bindings): number {
  return Math.floor(Date.now() / 1000) + accessTokenExpiryMinutes(env) * 60;
}

export function getRefreshTokenExpirationDate(env: Bindings): Date {
  return new Date(Date.now() + refreshTokenExpiryDays(env) * 24 * 60 * 60 * 1000);
}

export function getAllowedOrigins(env: Bindings): string[] {
  if (env.CLIENT_URL) return env.CLIENT_URL.split(',');
  return ['http://localhost:8787'];
}
