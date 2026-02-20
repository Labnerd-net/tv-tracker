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
import type { TvMazeShow } from '@shared/types/tvmaze.js';

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
    const found = await dbUserFunctions.returnUserById(userIdString);
    if (!found || found.length !== 1) {
      return c.json(err('User not found', 404));
    }
    const profile: ProfileData = {
      userId: found[0].userId,
      email: found[0].email,
      displayName: found[0].displayName,
      roles: found[0].roles,
    };
    return c.json(ok(profile));
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json(err(e.message, 500));
    }
    logger.error({ err: e }, 'Unexpected error in user route');
    return c.json(err('An unexpected error occurred', 500));
  }
});

// Return all tvshows for the authenticated user
user.get('/tvshows', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = Number(payload.sub);
    const shows = await dbShowFunctions.returnAllShows(userId);
    return c.json(ok(shows));
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
    const userId = Number(payload.sub);
    const shows = await dbShowFunctions.returnOneShowId(showId, userId);
    if (!shows || shows.length === 0) {
      return c.json(err('Show not found', 404));
    }
    return c.json(ok(shows[0]));
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json(err(e.message, 500));
    }
    logger.error({ err: e }, 'Unexpected error in user route');
    return c.json(err('An unexpected error occurred', 500));
  }
});

// Add a new tvshow from a full TvMazeShow body
user.post('/tvshow', async (c) => {
  try {
    const body = await c.req.json();
    if (!body || typeof body.id !== 'number') {
      return c.json(err('Missing or invalid show id in request body', 400));
    }
    const tvMazeId = String(body.id);
    const payload = c.get('jwtPayload');
    const userId = Number(payload.sub);
    const existing = await dbShowFunctions.returnOneShowTvMazeId(tvMazeId, userId);
    if (existing && existing.length > 0) {
      return c.json(ok({ status: 'exists' }));
    }
    const showData = new TvMazeData(body as TvMazeShow);
    await showData.updateEpisodes();
    await dbShowFunctions.addOneShow(showData, userId);
    return c.json(ok({ status: 'added' }));
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json(err(e.message, 500));
    }
    logger.error({ err: e }, 'Unexpected error in user route');
    return c.json(err('An unexpected error occurred', 500));
  }
});

// Add a new tvshow by TvMaze ID (fetches data from TVMaze)
user.post('/tvshow/:id', async (c) => {
  const tvMazeId: string = c.req.param('id');
  try {
    const payload = c.get('jwtPayload');
    const userId = Number(payload.sub);
    const existing = await dbShowFunctions.returnOneShowTvMazeId(tvMazeId, userId);
    if (existing && existing.length > 0) {
      return c.json(ok({ status: 'exists' }));
    }
    const response = await fetch(`${tvMazeAPI}/shows/${tvMazeId}`);
    if (!response.ok) {
      return c.json(err(`TvMaze response status: ${response.status}`, 502));
    }
    const showDataJson = await response.json();
    const showData = new TvMazeData(showDataJson);
    await showData.updateEpisodes();
    await dbShowFunctions.addOneShow(showData, userId);
    return c.json(ok({ status: 'added' }));
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json(err(e.message, 500));
    }
    logger.error({ err: e }, 'Unexpected error in user route');
    return c.json(err('An unexpected error occurred', 500));
  }
});

// Update a tvshow by ID (re-fetches data from TvMaze)
user.patch('/tvshow/:id', async (c) => {
  const showId = c.req.param('id');
  try {
    const payload = c.get('jwtPayload');
    const userId = Number(payload.sub);
    const existing = await dbShowFunctions.returnOneShowId(showId, userId);
    if (!existing || existing.length === 0) {
      return c.json(err(`Show with id=${showId} not found`, 404));
    }
    const response = await fetch(`${tvMazeAPI}/shows/${existing[0].tvMazeId}`);
    if (!response.ok) {
      return c.json(err(`TvMaze response status: ${response.status}`, 502));
    }
    const showDataJson = await response.json();
    const showData = new TvMazeData(showDataJson);
    await showData.updateEpisodes();
    await dbShowFunctions.updateOneShow(showData, showId, userId);
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
    const userId = Number(payload.sub);
    const result = await dbShowFunctions.deleteOneShowId(showId, userId);
    if (result.rowsAffected === 0) {
      return c.json(err('Show not found', 404));
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
