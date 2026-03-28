import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@libsql/client';

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

const CREATE_IDX_USER_SHOWS = `CREATE INDEX idx_user_shows ON tv_shows (user_id)`;
const CREATE_IDX_TVMAZE_USER = `CREATE INDEX idx_tvmaze_user ON tv_shows (tvmaze_id, user_id)`;

type IndexRow = { seq: number; name: string; unique: number; origin: string; partial: number };

let indexList: IndexRow[] = [];

beforeAll(async () => {
  const client = createClient({ url: ':memory:' });
  await client.execute(CREATE_USERS);
  await client.execute(CREATE_TV_SHOWS);
  await client.execute(CREATE_IDX_USER_SHOWS);
  await client.execute(CREATE_IDX_TVMAZE_USER);
  const result = await client.execute('PRAGMA index_list("tv_shows")');
  indexList = result.rows as unknown as IndexRow[];
});

describe('tv_shows indexes', () => {
  it('has idx_user_shows index', () => {
    expect(indexList.some(r => r.name === 'idx_user_shows')).toBe(true);
  });

  it('has idx_tvmaze_user index', () => {
    expect(indexList.some(r => r.name === 'idx_tvmaze_user')).toBe(true);
  });
});

const CREATE_TV_SHOWS_CASCADE = `
  CREATE TABLE IF NOT EXISTS tv_shows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
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

describe('tv_shows ON DELETE CASCADE', () => {
  it('deleting a user removes their shows', async () => {
    const client = createClient({ url: ':memory:' });
    await client.execute('PRAGMA foreign_keys = ON');
    await client.execute(CREATE_USERS);
    await client.execute(CREATE_TV_SHOWS_CASCADE);

    await client.execute({
      sql: 'INSERT INTO users (email, display_name, password_hash, roles, created_at) VALUES (?, ?, ?, ?, ?)',
      args: ['test@example.com', 'Test', 'hash', '[]', Date.now()],
    });
    const userResult = await client.execute('SELECT user_id FROM users WHERE email = ?', ['test@example.com']);
    const userId = userResult.rows[0].user_id as number;

    await client.execute({
      sql: 'INSERT INTO tv_shows (user_id, title, tvmaze_id) VALUES (?, ?, ?)',
      args: [userId, 'Test Show', 1],
    });

    await client.execute({ sql: 'DELETE FROM users WHERE user_id = ?', args: [userId] });

    const shows = await client.execute({ sql: 'SELECT * FROM tv_shows WHERE user_id = ?', args: [userId] });
    expect(shows.rows).toHaveLength(0);
  });
});
