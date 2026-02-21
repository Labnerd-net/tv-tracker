import { Hono } from 'hono';
import { returnUsers } from '../db/dbUserFunctions.js';
import { db } from '../db/schema.js';
import { ok, err } from '../utils/response.js';
import type {
  JwtData,
  ProfileData,
} from '@shared/types/tv-tracker.js';
import { authMiddleware, requireRole } from '../utils/middleware.js';
import logger from '../utils/logger.js';

type Variables = {
  jwtPayload: JwtData;
};

const admin = new Hono<{ Variables: Variables }>();
admin.use(authMiddleware);

// Return all users' details
admin.get('/users', requireRole('admin'), async c => {
  try {
    const allUsers = await returnUsers(db);
    const allUserProfiles: ProfileData[] = allUsers;
    return c.json(ok({ allUserProfiles }));
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json(err(e.message, 500));
    }
    logger.error({ err: e }, 'Unexpected error in admin route');
    return c.json(err('An unexpected error occurred', 500));
  }
});

export default admin;
