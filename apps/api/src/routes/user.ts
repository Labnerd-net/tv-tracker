import { Hono } from 'hono';
import * as dbUserFunctions from '../db/dbUserFunctions.js';
import * as dbShowFunctions from '../db/dbShowFunctions.js';
import { ok, err } from '../utils/response.js';
import type {
  JwtData,
  ProfileData,
} from '@shared/types/tv-tracker.js';
import { authMiddleware } from '../utils/middleware.js';
import logger from '../utils/logger.js';
import TvMazeData from '../tvmaze.js';

const tvMazeAPI = 'https://api.tvmaze.com';

type Variables = {
  jwtPayload: JwtData;
};

const user = new Hono<{ Variables: Variables }>();
user.use(authMiddleware);

// Show user info
user.get('/profile', async c => {
  try {
    const payload = c.get('jwtPayload');
    const userIdString = String(payload.sub);
    const user = await dbUserFunctions.returnUserById(userIdString);
    if (!user || user.length !== 1) {
      return c.json(err('User not found', 404));
    }
    const profile: ProfileData = user[0];
    return c.json(ok(profile));
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json(err(e.message, 500));
    }
    logger.error({ err: e }, 'Unexpected error in user route');
    return c.json(err('An unexpected error occurred', 500));
  }
});

// Return all tvshows
user.get('/tvshows', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userIdString = String(payload.sub);
    const user = await dbUserFunctions.returnUserById(userIdString);
    if (!user || user.length !== 1) {
      return c.json(err('User not found', 404));
    }
    let returnValue = await dbShowFunctions.returnAllShows();
    if (!returnValue) {
      return c.json(err('No shows for user', 404));
    }
    return c.json(ok(returnValue));
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json(err(e.message, 500));
    }
    logger.error({ err: e }, 'Unexpected error in user route');
    return c.json(err('An unexpected error occurred', 500));
  }
});

// Return a specific tvshow by ID
user.get('/tvshow/:id', async (c) => {
  const showId: string = c.req.param('id');
  try {
    const payload = c.get('jwtPayload');
    const userIdString = String(payload.sub);
    const user = await dbUserFunctions.returnUserById(userIdString);
    if (!user || user.length !== 1) {
      return c.json(err('User not found', 404));
    }
    let returnValue = await dbShowFunctions.returnOneShowId(showId);
    if (!returnValue || !returnValue[0].tvMazeId) {
      return c.json(err('Show not found', 404));
    }
    return c.json(ok(returnValue[0]));
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json(err(e.message, 500));
    }
    logger.error({ err: e }, 'Unexpected error in user route');
    return c.json(err('An unexpected error occurred', 500));
  }
});

// Add a new tvshow
user.post('/tvshow/:id', async (c) => {
  const tvMazeId: string = c.req.param('id');
  try {
    const payload = c.get('jwtPayload');
    const userIdString = String(payload.sub);
    const user = await dbUserFunctions.returnUserById(userIdString);
    if (!user || user.length !== 1) {
      return c.json(err('User not found', 404));
    }
    const existing = await dbShowFunctions.returnOneTvMazeId(tvMazeId);
    if (existing && existing.length > 0) {
      return c.json(ok({ status: 'exists' }));
    }
    const response = await fetch(`${tvMazeAPI}/shows/${tvMazeId}`);
    if (!response.ok) {
      return c.json(err(`tvMaze Response status: ${response.status}`, 404));
    }
    const showDataJson = await response.json();
    const showData = new TvMazeData(showDataJson);
    await showData.updateEpisodes();
    console.log(showData);
    const result = await dbShowFunctions.addOneShow(showData);
    if (!result) {
      return c.json(err(`Could not add show with TvMazeId=${tvMazeId}`, 404));
    }
    return c.json(ok({ status: 'added' }));
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json(err(e.message, 500));
    }
    logger.error({ err: e }, 'Unexpected error in user route');
    return c.json(err('An unexpected error occurred', 500));
  }
});

// Add a new tvshow
user.post('/tvshow', async (c) => {
  const body = await c.req.json()
  const tvMazeId = body.id;
  try {
    const payload = c.get('jwtPayload');
    const userIdString = String(payload.sub);
    const user = await dbUserFunctions.returnUserById(userIdString);
    if (!user || user.length !== 1) {
      return c.json(err('User not found', 404));
    }
    let returnValue1 = await dbShowFunctions.returnOneTvMazeId(tvMazeId);
    if (returnValue1 !== undefined && returnValue1.length != 0) {
      return c.json(ok({ status: 'exists' }));
    }
    const showData = new TvMazeData(body);
    await showData.updateEpisodes();
    console.log(showData);
    let returnValue2 = await dbShowFunctions.addOneShow(showData);
    if (!returnValue2) {
      return c.json(err(`Could not add show with TvMazeId=${tvMazeId}`, 404));
    }
    return c.json(ok({ status: 'added' }));
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json(err(e.message, 500));
    }
    logger.error({ err: e }, 'Unexpected error in user route');
    return c.json(err('An unexpected error occurred', 500));
  }
});

// Update a tvshow by ID
user.patch('/tvshow/:id', async (c) => {
  const showId = c.req.param('id');
  try {
    const payload = c.get('jwtPayload');
    const userIdString = String(payload.sub);
    const user = await dbUserFunctions.returnUserById(userIdString);
    if (!user || user.length !== 1) {
      return c.json(err('User not found', 404));
    }
    let returnValue1 = await dbShowFunctions.returnOneShowId(showId);
    if (!returnValue1 || !returnValue1[0].tvMazeId) {
      return c.json(err(`The show with ShowId=${showId} has not been found in the DB`, 404));
    }
    const response = await fetch(`${tvMazeAPI}/shows/${returnValue1[0].tvMazeId}`);
    if (!response.ok) {
      return c.json(err(`tvMaze Response status: ${response.status}`, 404));
    }
    const showDataJson = await response.json();
    const showData = new TvMazeData(showDataJson);
    await showData.updateEpisodes();
    console.log(showData);
    let returnValue2 = await dbShowFunctions.updateOneShow(showData, showId);
    if (!returnValue2) {
      return c.json(err(`Could not update show with ShowId=${showId}`, 404));
    }
    return c.json(ok({ status: 'updated' }));
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json(err(e.message, 500));
    }
    logger.error({ err: e }, 'Unexpected error in user route');
    return c.json(err('An unexpected error occurred', 500));
  }
});

// Delete a tvshow by ID
user.delete('/tvshow/:id', async (c) => {
  const showId = c.req.param('id');
  try {
    const payload = c.get('jwtPayload');
    const userIdString = String(payload.sub);
    const user = await dbUserFunctions.returnUserById(userIdString);
    if (!user || user.length !== 1) {
      return c.json(err('User not found', 404));
    }
    let returnValue = await dbShowFunctions.deleteOneShowId(showId);
    if (!returnValue) {
      return c.json(err('No show found', 404));
    }
    return c.json(ok({ status: 'deleted' }));
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json(err(e.message, 500));
    }
    logger.error({ err: e }, 'Unexpected error in user route');
    return c.json(err('An unexpected error occurred', 500));
  }
});

export default user;
