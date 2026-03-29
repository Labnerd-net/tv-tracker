import * as dbShowFunctions from '../db/dbShowFunctions.js';
import { db } from '../db/client.js';
import logger from './logger.js';
import type TvMazeData from '../tvmaze.js';

const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [5_000, 15_000] as const;
const MAX_QUEUE_DEPTH = 100;

type EpisodeUpdateJob = {
  showData: TvMazeData;
  showId: number;
  attemptsRemaining: number;
};

let inflightCount = 0;

async function runJob(job: EpisodeUpdateJob, attemptNumber: number): Promise<void> {
  try {
    const { next, prev } = await job.showData.updateEpisodes();
    await dbShowFunctions.updateShowEpisodes(db, job.showId, next, prev);
    logger.info({ showId: job.showId }, 'episode update succeeded');
    inflightCount--;
  } catch (e) {
    logger.warn({ showId: job.showId, attempt: attemptNumber, err: e }, 'episode update attempt failed');
    if (job.attemptsRemaining > 1) {
      job.attemptsRemaining--;
      setTimeout(() => runJob(job, attemptNumber + 1), BACKOFF_MS[attemptNumber]);
    } else {
      logger.error({ showId: job.showId, err: e }, 'episode update failed after all retries');
      inflightCount--;
    }
  }
}

export function enqueueEpisodeUpdate(showData: TvMazeData, showId: number): void {
  if (inflightCount >= MAX_QUEUE_DEPTH) {
    logger.warn({ showId }, 'job queue full, dropping episode update job');
    return;
  }
  inflightCount++;
  runJob({ showData, showId, attemptsRemaining: MAX_ATTEMPTS }, 0);
}

// Exported for test isolation only — do not call in production code
export function _resetForTesting(): void {
  inflightCount = 0;
}
