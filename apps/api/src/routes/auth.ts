import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { getCookie, setCookie } from 'hono/cookie';
import * as bcrypt from 'bcryptjs';
import { zValidator } from '@hono/zod-validator';
import * as dbUserFunctions from '../db/dbUserFunctions.js';
import { getDb } from '../db/client.js';
import { ok, err } from '../utils/response.js';
import {
  generateRefreshToken,
  hashString,
  setAuthCookies,
  clearAuthCookies,
  AUTH_COOKIE_PATH,
  API_COOKIE_PATH,
} from '../utils/auth.js';
import type { JwtData, Role, UserData } from '@shared/types/tv-tracker.js';
import {
  jwtAlgorithm,
  jwtSecret,
  bcryptSaltRounds,
  isProduction,
  getAccessTokenExpirationSeconds,
  getRefreshTokenExpirationDate,
} from '../utils/envVars.js';
import { authMiddleware } from '../utils/middleware.js';
import logger from '../utils/logger.js';
import { loginSchema, registrationSchema } from '../schemas/auth.js';
import { validationHook } from '../utils/validationHook.js';
import type { Bindings } from '../utils/bindings.js';

type Variables = {
  jwtPayload: JwtData;
};

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  .post('/register', zValidator('json', registrationSchema, validationHook), async c => {
    try {
      const db = getDb(c.env.DB);
      const { email, password, displayName } = c.req.valid('json');

      const existing = await dbUserFunctions.returnUserByEmail(db, email);
      if (existing?.length) {
        return c.json(err('User already exists'), 409);
      }
      const passwordHash = await bcrypt.hash(password, bcryptSaltRounds(c.env));
      const roles: Role[] = ['user'];
      const user = { email, passwordHash, roles, displayName } as UserData;
      const result = await dbUserFunctions.addUser(db, user);
      if (!result || !(result.length > 0)) {
        throw new Error(`Could not add new user with email=${email}`);
      }
      const payload = {
        sub: result[0].userId,
        email: result[0].email,
        displayName: result[0].displayName,
        roles: result[0].roles,
        exp: getAccessTokenExpirationSeconds(c.env),
      };
      const token = await sign(payload, jwtSecret(c.env), jwtAlgorithm(c.env));

      const { raw, hash } = await generateRefreshToken();
      const expiresAt = getRefreshTokenExpirationDate(c.env);
      await dbUserFunctions.updateRefreshToken(db, result[0].userId, hash, expiresAt);
      setAuthCookies(c, { accessToken: token, refreshToken: raw });

      return c.json(ok({}));
    } catch (e: unknown) {
      logger.error({ err: e }, 'Unexpected error in register route');
      return c.json(err('An unexpected error occurred'), 500);
    }
  })
  .post('/login', zValidator('json', loginSchema, validationHook), async c => {
    try {
      const db = getDb(c.env.DB);
      const { email, password } = c.req.valid('json');

      const user = await dbUserFunctions.returnUserByEmail(db, email);
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
        exp: getAccessTokenExpirationSeconds(c.env),
      };
      const token = await sign(payload, jwtSecret(c.env), jwtAlgorithm(c.env));

      const { raw, hash } = await generateRefreshToken();
      const expiresAt = getRefreshTokenExpirationDate(c.env);
      await dbUserFunctions.updateRefreshToken(db, user[0].userId, hash, expiresAt);
      setAuthCookies(c, { accessToken: token, refreshToken: raw });

      return c.json(ok({}));
    } catch (e: unknown) {
      logger.error({ err: e }, 'Unexpected error in login route');
      return c.json(err('An unexpected error occurred'), 500);
    }
  })
  .post('/refresh', async c => {
    try {
      const db = getDb(c.env.DB);
      const raw = getCookie(c, 'refreshToken');
      if (!raw) {
        return c.json(err('Missing refresh token'), 401);
      }

      const hash = await hashString(raw);
      const users = await dbUserFunctions.returnUserByRefreshTokenHash(db, hash);
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
        exp: getAccessTokenExpirationSeconds(c.env),
      };
      const token = await sign(payload, jwtSecret(c.env), jwtAlgorithm(c.env));

      const { raw: newRaw, hash: newHash } = await generateRefreshToken();
      const expiresAt = getRefreshTokenExpirationDate(c.env);
      await dbUserFunctions.updateRefreshToken(db, user.userId, newHash, expiresAt);
      setAuthCookies(c, { accessToken: token, refreshToken: newRaw });

      return c.json(ok({}));
    } catch (e: unknown) {
      logger.error({ err: e }, 'Unexpected error in refresh route');
      return c.json(err('An unexpected error occurred'), 500);
    }
  })
  .post('/logout', authMiddleware, async c => {
    try {
      const db = getDb(c.env.DB);
      const payload = c.get('jwtPayload');
      await dbUserFunctions.clearRefreshToken(db, payload.sub);
      clearAuthCookies(c);
      return c.json(ok({ status: 'logged out' }));
    } catch (e: unknown) {
      logger.error({ err: e }, 'Unexpected error in logout route');
      return c.json(err('An unexpected error occurred'), 500);
    }
  })
  .delete('/deleteUser', authMiddleware, async c => {
    try {
      const db = getDb(c.env.DB);
      const payload = c.get('jwtPayload');
      const userIdString = String(payload.sub);
      const user = await dbUserFunctions.returnUserById(db, userIdString);
      if (!user || user.length === 0) {
        return c.json(err('User not found'), 404);
      }
      await dbUserFunctions.clearRefreshToken(db, payload.sub);
      const returnValue = await dbUserFunctions.deleteUserById(db, userIdString);
      if (!returnValue) {
        return c.json(err('User not found'), 404);
      }
      const isProd = isProduction(c.env);
      setCookie(c, 'refreshToken', '', {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'None' : 'Lax',
        maxAge: 0,
        path: AUTH_COOKIE_PATH,
      });
      setCookie(c, 'accessToken', '', {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'None' : 'Lax',
        maxAge: 0,
        path: API_COOKIE_PATH,
      });
      return c.json(ok({ status: 'deleted' }));
    } catch (e: unknown) {
      logger.error({ err: e }, 'Unexpected error in deleteUser route');
      return c.json(err('An unexpected error occurred'), 500);
    }
  });

export default auth;
