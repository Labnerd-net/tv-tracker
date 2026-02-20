import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import TvMazeData from './tvmaze.js';
import { clientURLs, serverPort } from './utils/envVars.js';
import * as dbShowFunctions from './db/dbShowFunctions.js';
import * as dbUserFunctions from './db/dbUserFunctions.js';
import { hashPassword, verifyPassword, authMiddleware, signJwt } from './utils/auth.js';

const tvMazeAPI = 'https://api.tvmaze.com';

// Router Setup:
const app = new Hono();
app.use('*', cors({
  origin: clientURLs,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

app.get('/', (c) => c.text('TV Tracker API'));
app.use(prettyJSON());
app.notFound((c) => c.json({ message: 'Not Found', ok: false }, 404));

const api = new Hono();

// Return all tvshows
api.get('/tvshows', async (c) => {
  try {
    let returnValue = await dbShowFunctions.returnAllShows();
    if (!returnValue) {
      throw new Error(`No shows in the DB`);
    }
    console.log(returnValue)
    return c.json(returnValue);
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json({ status: 'error', err: e.message }, 500);
    }
    console.error('An unexpected error occurred:', e);
  } 
});

// Return a specific tvshow by ID
api.get('/tvshow/:id', async (c) => {
  const showId: string = c.req.param('id');
  try {
    let returnValue = await dbShowFunctions.returnOneShowId(showId);
    if (!returnValue || !returnValue[0].tvMazeId) {
      throw new Error(`The show with ShowId=${showId} has not been found in the DB`);
    }
    console.log(returnValue[0])
    return c.json(returnValue[0]);
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json({ status: 'error', err: e.message }, 500);
    }
    console.error('An unexpected error occurred:', e);
  } 
});

// Add a new tvshow
api.post('/tvshow/:id', async (c) => {
  const tvMazeId: string = c.req.param('id');
  try {
    const existing = await dbShowFunctions.returnOneTvMazeId(tvMazeId);
    if (existing && existing.length > 0) {
      return c.json({ status: 'exists' });
    }
    const response = await fetch(`${tvMazeAPI}/shows/${tvMazeId}`);
    if (!response.ok) {
      throw new Error(`tvMaze Response status: ${response.status}`);
    }
    const showDataJson = await response.json();
    const showData = new TvMazeData(showDataJson);
    await showData.updateEpisodes();
    console.log(showData);
    const result = await dbShowFunctions.addOneShow(showData);
    if (!result) {
      throw new Error(`Could not add show with TvMazeId=${tvMazeId}`);
    }
    return c.json({ status: 'added' });
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json({ status: 'error', err: e.message }, 500);
    }
    console.error('An unexpected error occurred:', e);
  } 
});

// Add a new tvshow
api.post('/tvshow', async (c) => {
  const body = await c.req.json()
  const tvMazeId = body.id;
  try {
    let returnValue1 = await dbShowFunctions.returnOneTvMazeId(tvMazeId);
    if (returnValue1 !== undefined && returnValue1.length != 0) {
      return c.json({ status: 'exists' });
    }
    const showData = new TvMazeData(body);
    await showData.updateEpisodes();
    console.log(showData);
    let returnValue2 = await dbShowFunctions.addOneShow(showData);
    if (!returnValue2) {
      throw new Error(`Could not add show with TvMazeId=${tvMazeId}`);
    }
    return c.json({ status: 'added' });
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json({ status: 'error', err: e.message }, 500);
    }
    console.error('An unexpected error occurred:', e);
  } 
});

// Update a tvshow by ID
api.patch('/tvshow/:id', async (c) => {
  const showId = c.req.param('id');
  try {
    let returnValue1 = await dbShowFunctions.returnOneShowId(showId);
    if (!returnValue1 || !returnValue1[0].tvMazeId) {
      throw new Error(`The show with ShowId=${showId} has not been found in the DB`);
    }
    const response = await fetch(`${tvMazeAPI}/shows/${returnValue1[0].tvMazeId}`);
    if (!response.ok) {
      throw new Error(`tvMaze Response status: ${response.status}`);
    }
    const showDataJson = await response.json();
    const showData = new TvMazeData(showDataJson);
    await showData.updateEpisodes();
    console.log(showData);
    let returnValue2 = await dbShowFunctions.updateOneShow(showData, showId);
    if (!returnValue2) {
      throw new Error(`Could not update show with ShowId=${showId}`);
    }
    return c.json({ status: 'updated' });
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json({ status: 'error', err: e.message }, 500);
    }
    console.error('An unexpected error occurred:', e);
  } 
});

// Delete a tvshow by ID
api.delete('/tvshow/:id', async (c) => {
  const showId = c.req.param('id');
  try {
    let returnValue = await dbShowFunctions.deleteOneShowId(showId);
    if (!returnValue) {
      throw new Error(`Could not delete show with ShowId=${showId}`);
    }
    return c.json({ status: 'deleted' });
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json({ status: 'error', err: e.message }, 500);
    }
    console.error('An unexpected error occurred:', e);
  } 
});

const auth = new Hono();

// Register a new user
auth.post('/register', async (c) => {
  const { email, password } = await c.req.json();
  try {
    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400);
    }
    const existing = await dbUserFunctions.returnUserByEmail(email);
    if (existing && existing.length > 0) {
      return c.json({ error: 'User already exists' }, 409);
    }
    const passwordHash = await hashPassword(password);
    const result = await dbUserFunctions.addUser(email, passwordHash);
    if (!result || !(result.length > 0)) {
      throw new Error(`Could not add new user with email=${email}`);
    }
    const token = signJwt(result[0].id);
    return c.json({ token });
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json({ status: 'error', err: e.message }, 500);
    }
    console.error('An unexpected error occurred:', e);
  }
});

// Log in an existing user
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  try {
    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400);
    }
    const user = await dbUserFunctions.returnUserByEmail(email);
    if (!user || user.length === 0) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    const isValid = await verifyPassword(password, user[0].passwordHash);
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    const token = signJwt(user[0].userId);
    return c.json({ token });
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json({ status: 'error', err: e.message }, 500);
    }
    console.error('An unexpected error occurred:', e);
  }
});

// Show user info
auth.get('/:userId', authMiddleware, async (c) => {
  const userId: string = c.req.param('userId');
  try {
    const user = await dbUserFunctions.returnUserById(userId);
    if (!user || user.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }
    return c.json({ id: user[0].userId, email: user[0].email });
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json({ status: 'error', err: e.message }, 500);
    }
    console.error('An unexpected error occurred:', e);
  }
});

// Delete a user by ID
auth.delete('/:userId', async (c) => {
  const userId = c.req.param('userId');
  try {
    const returnValue = await dbUserFunctions.deleteUserById(userId);
    if (!returnValue) {
      throw new Error(`Could not delete user with userId=${userId}`);
    }
    return c.json({ status: 'deleted' });
  } catch (e: unknown) {
    if (e instanceof Error) {
      return c.json({ status: 'error', err: e.message }, 500);
    }
    console.error('An unexpected error occurred:', e);
  } 
});

api.route('/auth', auth);

app.route('/api', api);

serve({
  fetch: app.fetch,
  hostname: '0.0.0.0', // Listen on all network interfaces
  port: serverPort,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
});
