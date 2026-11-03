import type { DrizzleD1Database } from '../db/client.js';
import * as dbShowFunctions from '../db/dbShowFunctions.js';
import logger from './logger.js';
import TvMazeData from '../tvmaze.js';
import { tvMazeShowBodySchema } from '../schemas/show.js';
import { TV_MAZE_API_BASE } from '@shared/constants/tvmaze.js';

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

// Best-effort refresh of episode dates for seeded demo shows. Never rejects: failures are
// logged and leave the snapshot values in place. The caller decides how long to wait for it.
export async function refreshDemoShows(
  db: DrizzleD1Database,
  shows: { showId: number; tvMazeId: number }[],
): Promise<void> {
  const results = await Promise.allSettled(shows.map(async ({ showId, tvMazeId }) => {
    const res = await fetch(
      `${TV_MAZE_API_BASE}/shows/${tvMazeId}?embed[]=nextepisode&embed[]=previousepisode`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) throw new Error(`TVMaze status ${res.status}`);
    const text = await res.text();
    if (text.length > 1_000_000) throw new Error('TVMaze response too large');
    const parsed = tvMazeShowBodySchema.safeParse(JSON.parse(text));
    if (!parsed.success) throw new Error('Invalid TVMaze response');
    const { next, prev } = await new TvMazeData(parsed.data).updateEpisodes();
    await dbShowFunctions.updateShowEpisodes(db, showId, next, prev);
  }));
  const failed = results.filter(r => r.status === 'rejected').length;
  if (failed > 0) logger.warn({ failed, total: results.length }, 'demo refresh had failures');
}
