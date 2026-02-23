import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import { createMiddleware } from 'hono/factory';
import type { Context, Next } from 'hono';
import { jwtAlgorithm, jwtSecret } from '../utils/envVars.js';
import type { JwtData, Role } from '@shared/types/tv-tracker.js';
import { err } from './response.js';
import pinoLogger from './logger.js';

export const logger = createMiddleware(async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  pinoLogger.info({ method: c.req.method, path: c.req.path, status: c.res.status, duration: ms });
});

// Middleware for routes requiring login
export const authMiddleware = createMiddleware(async (c, next) => {
  const token = getCookie(c, 'accessToken');
  if (!token) {
    return c.json(err('Unauthorized'), 401);
  }
  try {
    const payload = await verify(token, jwtSecret, jwtAlgorithm);
    c.set('jwtPayload', payload as unknown as JwtData);
  } catch {
    return c.json(err('Unauthorized'), 401);
  }
  await next();
});

// Middleware for routes requiring a specific role
export const requireRole = (role: Role) => {
  return async (c: Context, next: Next) => {
    const payload: JwtData = c.get('jwtPayload');
    if (!payload || !payload.roles.includes(role)) {
      return c.json(err('Forbidden', 403));
    }
    await next();
  };
};
