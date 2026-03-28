import { createHash, randomUUID } from 'node:crypto';
import { setCookie } from 'hono/cookie';
import type { Context } from 'hono';
import { isProduction, refreshTokenExpiryDays, accessTokenExpiryMinutes } from './envVars.js';

export const AUTH_COOKIE_PATH = '/api/auth';
export const API_COOKIE_PATH = '/api';

export function generateRefreshToken(): { raw: string; hash: string } {
  const raw = randomUUID();
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export function setAuthCookies(c: Context, tokens: { accessToken: string; refreshToken: string }): void {
  setCookie(c, 'refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax',
    maxAge: refreshTokenExpiryDays * 24 * 60 * 60,
    path: AUTH_COOKIE_PATH,
  });
  setCookie(c, 'accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax',
    maxAge: accessTokenExpiryMinutes * 60,
    path: API_COOKIE_PATH,
  });
}
