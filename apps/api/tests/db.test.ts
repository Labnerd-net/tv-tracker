import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import {
  returnUsers,
  returnUserByEmail,
  returnUserById,
  addUser,
  updateRefreshToken,
  clearRefreshToken,
  returnUserByRefreshTokenHash,
  deleteUserById,
} from '../src/db/dbUserFunctions.js';
import {
  returnAllShows,
  returnOneShowId,
  returnOneShowTvMazeId,
  addOneShow,
  updateOneShow,
  deleteOneShowId,
} from '../src/db/dbShowFunctions.js';
import type TvMazeData from '../src/tvmaze.js';

let db: LibSQLDatabase;

const CREATE_USERS = `
  CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    roles TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL,
    refresh_token_hash TEXT UNIQUE,
    refresh_token_expires_at INTEGER
  )
`;

const CREATE_TV_SHOWS = `
  CREATE TABLE IF NOT EXISTS tv_shows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    title TEXT NOT NULL,
    tvmaze_id INTEGER NOT NULL,
    platform TEXT,
    status TEXT,
    schedule_day TEXT,
    schedule_time TEXT,
    prev_episode TEXT,
    next_episode TEXT,
    image_link TEXT
  )
`;

// Minimal stub that satisfies what addOneShow / updateOneShow read from TvMazeData
function makeShowStub(overrides: Partial<typeof fakeShow> = {}) {
  const fakeShow = {
    title: 'Test Show',
    tvMazeId: 42,
    platform: 'HBO',
    status: 'Running',
    scheduleDays: ['Monday'],
    scheduleTime: '21:00',
    prevEpisode: '',
    nextEpisode: '',
    imageLink: 'http://example.com/img.jpg',
    ...overrides,
  };
  return fakeShow as unknown as TvMazeData;
}

beforeAll(async () => {
  const client = createClient({ url: ':memory:' });
  db = drizzle(client);
  await client.execute(CREATE_USERS);
  await client.execute(CREATE_TV_SHOWS);
});

// ------------------------------------------------------------------
// User functions
// ------------------------------------------------------------------

describe('addUser / returnUsers', () => {
  it('inserts a user and returns it in returnUsers', async () => {
    await addUser(db, {
      userId: 0,
      email: 'a@test.com',
      displayName: 'Alice',
      passwordHash: 'hash-a',
      roles: ['user'],
    });
    const all = await returnUsers(db);
    expect(all.length).toBeGreaterThanOrEqual(1);
    expect(all.some(u => u.email === 'a@test.com')).toBe(true);
  });
});

describe('returnUserByEmail', () => {
  it('finds an existing user by email', async () => {
    const result = await returnUserByEmail(db, 'a@test.com');
    expect(result).toHaveLength(1);
    expect(result[0].displayName).toBe('Alice');
  });

  it('returns empty array for unknown email', async () => {
    const result = await returnUserByEmail(db, 'nobody@test.com');
    expect(result).toHaveLength(0);
  });
});

describe('returnUserById', () => {
  it('finds an existing user by id', async () => {
    const [user] = await returnUserByEmail(db, 'a@test.com');
    const result = await returnUserById(db, String(user.userId));
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('a@test.com');
  });

  it('returns empty array for unknown id', async () => {
    const result = await returnUserById(db, '9999');
    expect(result).toHaveLength(0);
  });
});

describe('updateRefreshToken / returnUserByRefreshTokenHash / clearRefreshToken', () => {
  it('stores a hash and retrieves the user by it', async () => {
    const [user] = await returnUserByEmail(db, 'a@test.com');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await updateRefreshToken(db, user.userId, 'deadbeef', expiresAt);

    const found = await returnUserByRefreshTokenHash(db, 'deadbeef');
    expect(found).toHaveLength(1);
    expect(found[0].email).toBe('a@test.com');
    expect(found[0].refreshTokenHash).toBe('deadbeef');
  });

  it('returns empty array for unknown hash', async () => {
    const result = await returnUserByRefreshTokenHash(db, 'nope');
    expect(result).toHaveLength(0);
  });

  it('nulls the hash and expiry on clearRefreshToken', async () => {
    const [user] = await returnUserByEmail(db, 'a@test.com');
    await clearRefreshToken(db, user.userId);

    const result = await returnUserByRefreshTokenHash(db, 'deadbeef');
    expect(result).toHaveLength(0);

    const updated = await returnUserById(db, String(user.userId));
    expect(updated[0].refreshTokenHash).toBeNull();
    expect(updated[0].refreshTokenExpiresAt).toBeNull();
  });
});

describe('deleteUserById', () => {
  it('removes the user', async () => {
    await addUser(db, {
      userId: 0,
      email: 'delete-me@test.com',
      displayName: 'Gone',
      passwordHash: 'h',
      roles: ['user'],
    });
    const [user] = await returnUserByEmail(db, 'delete-me@test.com');
    await deleteUserById(db, String(user.userId));
    const result = await returnUserByEmail(db, 'delete-me@test.com');
    expect(result).toHaveLength(0);
  });
});

// ------------------------------------------------------------------
// Show functions
// ------------------------------------------------------------------

describe('addOneShow / returnAllShows', () => {
  it('inserts a show and returns it for the correct user', async () => {
    const [user] = await returnUserByEmail(db, 'a@test.com');
    await addOneShow(db, makeShowStub(), user.userId);
    const shows = await returnAllShows(db, user.userId);
    expect(shows.length).toBeGreaterThanOrEqual(1);
    expect(shows.some(s => s.title === 'Test Show')).toBe(true);
  });

  it('returns empty array for a different user', async () => {
    const shows = await returnAllShows(db, 9999);
    expect(shows).toHaveLength(0);
  });
});

describe('returnOneShowTvMazeId', () => {
  it('finds a show by tvMazeId and userId', async () => {
    const [user] = await returnUserByEmail(db, 'a@test.com');
    const result = await returnOneShowTvMazeId(db, '42', user.userId);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].tvMazeId).toBe(42);
  });

  it('returns empty for wrong userId', async () => {
    const result = await returnOneShowTvMazeId(db, '42', 9999);
    expect(result).toHaveLength(0);
  });
});

describe('returnOneShowId', () => {
  it('finds a show by showId and userId', async () => {
    const [user] = await returnUserByEmail(db, 'a@test.com');
    const shows = await returnAllShows(db, user.userId);
    const showId = String(shows[0].showId);
    const result = await returnOneShowId(db, showId, user.userId);
    expect(result).toHaveLength(1);
    expect(result[0].showId).toBe(shows[0].showId);
  });

  it('returns empty for wrong userId', async () => {
    const [user] = await returnUserByEmail(db, 'a@test.com');
    const shows = await returnAllShows(db, user.userId);
    const result = await returnOneShowId(db, String(shows[0].showId), 9999);
    expect(result).toHaveLength(0);
  });
});

describe('updateOneShow', () => {
  it('updates show fields', async () => {
    const [user] = await returnUserByEmail(db, 'a@test.com');
    const shows = await returnAllShows(db, user.userId);
    const showId = String(shows[0].showId);
    await updateOneShow(db, makeShowStub({ title: 'Updated Show', status: 'Ended' }), showId, user.userId);
    const [updated] = await returnOneShowId(db, showId, user.userId);
    expect(updated.title).toBe('Updated Show');
    expect(updated.status).toBe('Ended');
  });
});

describe('deleteOneShowId', () => {
  it('removes the show and returns rowsAffected=1', async () => {
    const [user] = await returnUserByEmail(db, 'a@test.com');
    const shows = await returnAllShows(db, user.userId);
    const showId = String(shows[0].showId);
    const result = await deleteOneShowId(db, showId, user.userId);
    expect(result.rowsAffected).toBe(1);
    const remaining = await returnOneShowId(db, showId, user.userId);
    expect(remaining).toHaveLength(0);
  });

  it('returns rowsAffected=0 for unknown show', async () => {
    const result = await deleteOneShowId(db, '9999', 9999);
    expect(result.rowsAffected).toBe(0);
  });
});
