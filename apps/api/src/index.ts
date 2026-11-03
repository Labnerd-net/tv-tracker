import app from './app.js';
import { getDb } from './db/client.js';
import { deleteExpiredDemoUsers } from './db/dbUserFunctions.js';
import { DEMO_EMAIL_DOMAIN, DEMO_TTL_MS } from './demo/seedShows.js';
import logger from './utils/logger.js';
import type { Bindings } from './utils/bindings.js';

export default {
  fetch: app.fetch,
  // Cron trigger: purge expired demo users (their shows cascade-delete).
  async scheduled(_controller: ScheduledController, env: Bindings, ctx: ExecutionContext) {
    ctx.waitUntil(
      deleteExpiredDemoUsers(getDb(env.TV_DB), DEMO_EMAIL_DOMAIN, new Date(Date.now() - DEMO_TTL_MS))
        .then(rows => logger.info({ deleted: rows.length }, 'demo cleanup complete'))
        .catch(e => logger.error({ err: e }, 'demo cleanup failed')),
    );
  },
};
