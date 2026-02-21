import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import * as bcrypt from 'bcryptjs';
import { zValidator } from '@hono/zod-validator';
import * as dbUserFunctions from '../db/dbUserFunctions.js';
import { ok, err } from '../utils/response.js';
import type { JwtData, Role, UserData } from '@shared/types/tv-tracker.js';
import {
  bcryptSaltRounds,
  jwtAlgorithm,
  getJwtExpirationSeconds,
  jwtSecret,
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
      exp: getJwtExpirationSeconds(),
    };
    const token = await sign(payload, jwtSecret, jwtAlgorithm);
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
      exp: getJwtExpirationSeconds(),
    };
    const token = await sign(payload, jwtSecret, jwtAlgorithm);
    return c.json(ok({ token }));
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json(err(e.message), 500);
    }
    logger.error({ err: e }, 'Unexpected error in auth route');
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
