import { eq } from 'drizzle-orm';
import { tvShows, db } from './schema.js';
import TvMazeData from '../tvmaze.js';

export async function returnAllShows() {
  console.log('Inside returnAllShows dbFunction');
  try {
    return await db.select().from(tvShows);
  } catch (e) {
    console.log(e);
  }
}

export async function returnOneShowId(showId: string) {
  console.log(`Inside returnOneShowId dbFunction: returning ${showId}`);
  try {
    const showIdNumber = Number(showId);
    return await db.select().from(tvShows)
      .where(eq(tvShows.id, showIdNumber));
  } catch (e) {
    console.log(e);
  }
}

export async function deleteOneShowId(showId: string) {
  console.log(`Inside deleteOneShowId dbFunction: deleting ${showId}`);
  try {
    const showIdNumber = Number(showId);
    return await db.delete(tvShows)
      .where(eq(tvShows.id, showIdNumber));
  } catch (e) {
    console.log(e);
  }
}

export async function returnOneTvMazeId(tvMazeId: string) {
  console.log(`Inside returnOneTvMazeId dbFunction: returning ${tvMazeId}`);
  try {
    const tvMazeIdNumber = Number(tvMazeId);
    return await db.select().from(tvShows)
      .where(eq(tvShows.tvMazeId, tvMazeIdNumber));
  } catch (e) {
    console.log(e);
  }
}

export async function addOneShow(showData: TvMazeData) {
  console.log('Inside addOneShow dbFunction');
  try {
    return await db.insert(tvShows)
    .values({
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
    console.log(e);
  }
}

export async function updateOneShow(showData: TvMazeData, showId: string) {
  console.log(`Inside updateOneShow dbFunction: updating ${showId}`);
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
      .where(eq(tvShows.id, showIdNumber));
  } catch (e) {
    console.log(e);
  }
}
