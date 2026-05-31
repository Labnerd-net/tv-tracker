import { setCookie, deleteCookie } from 'hono/cookie';
import type { Context, Env } from 'hono';
import type { Bindings } from './bindings.js';

type WithBindings = Env & { Bindings: Bindings };
import { isProduction, refreshTokenExpiryDays, accessTokenExpiryMinutes } from './envVars.js';

export const AUTH_COOKIE_PATH = '/api/auth';
export const API_COOKIE_PATH = '/api';

export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateRefreshToken(): Promise<{ raw: string; hash: string }> {
  const raw = crypto.randomUUID();
  const hash = await hashString(raw);
  return { raw, hash };
}

export function setAuthCookies<E extends WithBindings>(
  c: Context<E>,
  tokens: { accessToken: string; refreshToken: string },
): void {
  const isProd = isProduction(c.env);
  setCookie(c, 'refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax',
    maxAge: refreshTokenExpiryDays(c.env) * 24 * 60 * 60,
    path: AUTH_COOKIE_PATH,
  });
  setCookie(c, 'accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax',
    maxAge: accessTokenExpiryMinutes(c.env) * 60,
    path: API_COOKIE_PATH,
  });
}

export function clearAuthCookies<E extends WithBindings>(c: Context<E>): void {
  deleteCookie(c, 'refreshToken', { path: AUTH_COOKIE_PATH });
  deleteCookie(c, 'accessToken', { path: API_COOKIE_PATH });
}
