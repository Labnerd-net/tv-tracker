import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import { createMiddleware } from 'hono/factory';
import type { Context, Next } from 'hono';
import type { JwtData, Role } from '@shared/types/tv-tracker.js';
import type { Bindings } from './bindings.js';
import { err } from './response.js';
import pinoLogger from './logger.js';
import { jwtSecret, jwtAlgorithm } from './envVars.js';
import { jwtDataSchema } from '../schemas/auth.js';

export const requestLogger = createMiddleware(async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  pinoLogger.info({ method: c.req.method, path: c.req.path, status: c.res.status, duration: ms });
});

export const authMiddleware = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
  const token = getCookie(c, 'accessToken');
  if (!token) {
    return c.json(err('Unauthorized'), 401);
  }
  try {
    const payload = await verify(token, jwtSecret(c.env), jwtAlgorithm(c.env));
    const parsed = jwtDataSchema.safeParse(payload);
    if (!parsed.success) {
      return c.json(err('Unauthorized'), 401);
    }
    c.set('jwtPayload', parsed.data);
  } catch {
    return c.json(err('Unauthorized'), 401);
  }
  await next();
});

export const requireRole = (role: Role) => {
  return async (c: Context, next: Next) => {
    const payload: JwtData = c.get('jwtPayload');
    if (!payload || !payload.roles.includes(role)) {
      return c.json(err('Forbidden'), 403);
    }
    await next();
  };
};
