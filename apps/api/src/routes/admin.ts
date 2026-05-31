import { Hono } from 'hono';
import { returnUsers } from '../db/dbUserFunctions.js';
import { getDb } from '../db/client.js';
import { ok, err } from '../utils/response.js';
import type { JwtData } from '@shared/types/tv-tracker.js';
import { authMiddleware, requireRole } from '../utils/middleware.js';
import logger from '../utils/logger.js';
import type { Bindings } from '../utils/bindings.js';

type Variables = {
  jwtPayload: JwtData;
};

const admin = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  .use(authMiddleware)
  .get('/users', requireRole('admin'), async c => {
    try {
      const db = getDb(c.env.DB);
      const allUserProfiles = await returnUsers(db);
      return c.json(ok({ allUserProfiles }));
    } catch (e: unknown) {
      logger.error({ err: e }, 'Unexpected error in admin route');
      return c.json(err('An unexpected error occurred'), 500);
    }
  });

export default admin;
