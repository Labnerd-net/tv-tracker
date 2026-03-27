import { Hono } from 'hono';
import { returnUsers } from '../db/dbUserFunctions.js';
import { db } from '../db/client.js';
import { ok, err } from '../utils/response.js';
import type { JwtData } from '@shared/types/tv-tracker.js';
import { authMiddleware, requireRole } from '../utils/middleware.js';
import { apiRateLimit } from '../utils/rateLimiter.js';
import logger from '../utils/logger.js';

type Variables = {
  jwtPayload: JwtData;
};

const admin = new Hono<{ Variables: Variables }>()
  .use(apiRateLimit)
  .use(authMiddleware)
  // Return all users' details
  .get('/users', requireRole('admin'), async c => {
    try {
      const allUserProfiles = await returnUsers(db);
      return c.json(ok({ allUserProfiles }));
    } catch (e: unknown) {
      logger.error({ err: e }, 'Unexpected error in admin route');
      return c.json(err('An unexpected error occurred'), 500);
    }
  });

export default admin;
