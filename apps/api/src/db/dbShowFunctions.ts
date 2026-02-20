import { eq, and } from 'drizzle-orm';
import { tvShows, db } from './schema.js';
import TvMazeData from '../tvmaze.js';
import logger from '../utils/logger.js';
import type { ShowData } from '@shared/types/tv-tracker.js';

export async function returnAllShows(userId: number): Promise<ShowData[]> {
  logger.debug({ userId }, 'returnAllShows');
  try {
    return await db.select().from(tvShows).where(eq(tvShows.userId, userId));
  } catch (e) {
    logger.error({ err: e }, 'returnAllShows failed');
    throw e;
  }
}

export async function returnOneShowId(showId: string, userId: number): Promise<ShowData[]> {
  logger.debug({ showId, userId }, 'returnOneShowId');
  try {
    const showIdNumber = Number(showId);
    return await db.select().from(tvShows)
      .where(and(eq(tvShows.showId, showIdNumber), eq(tvShows.userId, userId)));
  } catch (e) {
    logger.error({ err: e }, 'returnOneShowId failed');
    throw e;
  }
}

export async function deleteOneShowId(showId: string, userId: number) {
  logger.debug({ showId, userId }, 'deleteOneShowId');
  try {
    const showIdNumber = Number(showId);
    return await db.delete(tvShows)
      .where(and(eq(tvShows.showId, showIdNumber), eq(tvShows.userId, userId)));
  } catch (e) {
    logger.error({ err: e }, 'deleteOneShowId failed');
    throw e;
  }
}

export async function returnOneShowTvMazeId(tvMazeId: string, userId: number): Promise<ShowData[]> {
  logger.debug({ tvMazeId, userId }, 'returnOneShowTvMazeId');
  try {
    const tvMazeIdNumber = Number(tvMazeId);
    return await db.select().from(tvShows)
      .where(and(eq(tvShows.tvMazeId, tvMazeIdNumber), eq(tvShows.userId, userId)));
  } catch (e) {
    logger.error({ err: e }, 'returnOneShowTvMazeId failed');
    throw e;
  }
}

export async function addOneShow(showData: TvMazeData, userId: number) {
  logger.debug({ tvMazeId: showData.tvMazeId, userId }, 'addOneShow');
  try {
    return await db.insert(tvShows).values({
      userId,
      title: showData.title,
      tvMazeId: showData.tvMazeId,
      platform: showData.platform,
      status: showData.status,
      scheduleDay: showData.scheduleDays,
      scheduleTime: showData.scheduleTime,
      prevEpisode: showData.prevEpisode,
      nextEpisode: showData.nextEpisode,
      imageLink: showData.imageLink,
    });
  } catch (e) {
    logger.error({ err: e }, 'addOneShow failed');
    throw e;
  }
}

export async function updateOneShow(showData: TvMazeData, showId: string, userId: number) {
  logger.debug({ showId, userId }, 'updateOneShow');
  try {
    const showIdNumber = Number(showId);
    return await db.update(tvShows)
      .set({
        title: showData.title,
        tvMazeId: showData.tvMazeId,
        platform: showData.platform,
        status: showData.status,
        scheduleDay: showData.scheduleDays,
        scheduleTime: showData.scheduleTime,
        prevEpisode: showData.prevEpisode,
        nextEpisode: showData.nextEpisode,
        imageLink: showData.imageLink,
      })
      .where(and(eq(tvShows.showId, showIdNumber), eq(tvShows.userId, userId)));
  } catch (e) {
    logger.error({ err: e }, 'updateOneShow failed');
    throw e;
  }
}
