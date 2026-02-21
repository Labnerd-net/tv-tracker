import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { zValidator } from '@hono/zod-validator';
import * as dbUserFunctions from '../db/dbUserFunctions.js';
import { ok, err } from '../utils/response.js';
import { generateRefreshToken } from '../utils/auth.js';
import type { JwtData, Role, UserData } from '@shared/types/tv-tracker.js';
import {
  bcryptSaltRounds,
  jwtAlgorithm,
  getAccessTokenExpirationSeconds,
  getRefreshTokenExpirationDate,
  refreshTokenExpiryDays,
  jwtSecret,
  isProduction,
} from '../utils/envVars.js';
import { authMiddleware } from '../utils/middleware.js';
import { authRateLimit } from '../utils/rateLimiter.js';
import logger from '../utils/logger.js';
import { loginSchema, registrationSchema } from '../schemas/auth.js';

type Variables = {
  jwtPayload: JwtData;
};

const auth = new Hono<{ Variables: Variables }>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validationHook = (result: any, c: any) => {
  if (!result.success) {
    return c.json(err(result.error.issues[0].message), 400);
  }
};

function setRefreshCookie(c: any, raw: string) {
  setCookie(c, 'refreshToken', raw, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax',
    maxAge: refreshTokenExpiryDays * 24 * 60 * 60,
    path: '/api/auth',
  });
}

// Register a new user
auth.post('/register', authRateLimit, zValidator('json', registrationSchema, validationHook), async c => {
  try {
    const { email, password, displayName } = c.req.valid('json');

    const existing = await dbUserFunctions.returnUserByEmail(email);
    if (existing?.length) {
      return c.json(err('User already exists'), 409);
    }
    const passwordHash = await bcrypt.hash(password, bcryptSaltRounds);
    const totalUsers = await dbUserFunctions.returnUsers();
    const roles: Role[] = totalUsers.length === 0 ? ['user', 'admin'] : ['user'];
    const user = { email, passwordHash, roles, displayName } as UserData;
    const result = await dbUserFunctions.addUser(user);
    if (!result || !(result.length > 0)) {
      throw new Error(`Could not add new user with email=${email}`);
    }
    const payload = {
      sub: result[0].userId,
      email: result[0].email,
      displayName: result[0].displayName,
      roles: result[0].roles,
      exp: getAccessTokenExpirationSeconds(),
    };
    const token = await sign(payload, jwtSecret, jwtAlgorithm);

    const { raw, hash } = generateRefreshToken();
    const expiresAt = getRefreshTokenExpirationDate();
    await dbUserFunctions.updateRefreshToken(result[0].userId, hash, expiresAt);
    setRefreshCookie(c, raw);

    return c.json(ok({ token }));
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json(err(e.message), 500);
    }
    logger.error({ err: e }, 'Unexpected error in auth route');
    return c.json(err('An unexpected error occurred'), 500);
  }
});

// Log in an existing user
auth.post('/login', authRateLimit, zValidator('json', loginSchema, validationHook), async c => {
  try {
    const { email, password } = c.req.valid('json');

    const user = await dbUserFunctions.returnUserByEmail(email);
    if (!user || user.length === 0) {
      return c.json(err('Invalid credentials'), 401);
    }
    const isValid = await bcrypt.compare(password, user[0].passwordHash);
    if (!isValid) return c.json(err('Invalid credentials'), 401);
    const payload = {
      sub: user[0].userId,
      email: user[0].email,
      displayName: user[0].displayName,
      roles: user[0].roles,
      exp: getAccessTokenExpirationSeconds(),
    };
    const token = await sign(payload, jwtSecret, jwtAlgorithm);

    const { raw, hash } = generateRefreshToken();
    const expiresAt = getRefreshTokenExpirationDate();
    await dbUserFunctions.updateRefreshToken(user[0].userId, hash, expiresAt);
    setRefreshCookie(c, raw);

    return c.json(ok({ token }));
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json(err(e.message), 500);
    }
    logger.error({ err: e }, 'Unexpected error in auth route');
    return c.json(err('An unexpected error occurred'), 500);
  }
});

// Refresh access token using the httpOnly cookie
auth.post('/refresh', async c => {
  try {
    const raw = getCookie(c, 'refreshToken');
    if (!raw) {
      return c.json(err('Missing refresh token'), 401);
    }

    const hash = createHash('sha256').update(raw).digest('hex');
    const users = await dbUserFunctions.returnUserByRefreshTokenHash(hash);
    if (!users || users.length === 0) {
      return c.json(err('Invalid refresh token'), 401);
    }
    const user = users[0];

    if (!user.refreshTokenExpiresAt || user.refreshTokenExpiresAt < new Date()) {
      return c.json(err('Refresh token expired'), 401);
    }

    const payload = {
      sub: user.userId,
      email: user.email,
      displayName: user.displayName,
      roles: user.roles,
      exp: getAccessTokenExpirationSeconds(),
    };
    const token = await sign(payload, jwtSecret, jwtAlgorithm);

    const { raw: newRaw, hash: newHash } = generateRefreshToken();
    const expiresAt = getRefreshTokenExpirationDate();
    await dbUserFunctions.updateRefreshToken(user.userId, newHash, expiresAt);
    setRefreshCookie(c, newRaw);

    return c.json(ok({ token }));
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json(err(e.message), 500);
    }
    logger.error({ err: e }, 'Unexpected error in refresh route');
    return c.json(err('An unexpected error occurred'), 500);
  }
});

// Logout — clear refresh token cookie and DB record
auth.post('/logout', authMiddleware, async c => {
  try {
    const payload = c.get('jwtPayload');
    await dbUserFunctions.clearRefreshToken(payload.sub);
    deleteCookie(c, 'refreshToken', { path: '/api/auth' });
    return c.json(ok({ status: 'logged out' }));
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json(err(e.message), 500);
    }
    logger.error({ err: e }, 'Unexpected error in logout route');
    return c.json(err('An unexpected error occurred'), 500);
  }
});

// Delete a user by ID
auth.delete('/deleteUser', authMiddleware, async c => {
  try {
    const payload = c.get('jwtPayload');
    const userIdNumber = String(payload.sub);
    const user = await dbUserFunctions.returnUserById(userIdNumber);
    if (!user || user.length === 0) {
      return c.json(err('User not found'), 404);
    }
    const returnValue = await dbUserFunctions.deleteUserById(userIdNumber);
    if (!returnValue) {
      return c.json(err('User not found'), 404);
    }
    return c.json(ok({ status: 'deleted' }));
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json(err(e.message), 500);
    }
    logger.error({ err: e }, 'Unexpected error in auth route');
    return c.json(err('An unexpected error occurred'), 500);
  }
});

export default auth;
