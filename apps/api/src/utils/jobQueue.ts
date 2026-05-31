import type { DrizzleD1Database } from '../db/client.js';
import * as dbShowFunctions from '../db/dbShowFunctions.js';
import logger from './logger.js';
import type TvMazeData from '../tvmaze.js';

export function scheduleEpisodeUpdate(
  ctx: ExecutionContext,
  db: DrizzleD1Database,
  showData: TvMazeData,
  showId: number,
): void {
  ctx.waitUntil(
    showData
      .updateEpisodes()
      .then(({ next, prev }) => dbShowFunctions.updateShowEpisodes(db, showId, next, prev))
      .then(() => logger.info({ showId }, 'episode update succeeded'))
      .catch(e => logger.error({ showId, err: e }, 'episode update failed')),
  );
}
