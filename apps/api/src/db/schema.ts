import 'dotenv/config';
import { int, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { drizzle } from 'drizzle-orm/libsql';
import { relations } from 'drizzle-orm';
import type { Role } from '@shared/types/tv-tracker.js';

const sqliteFile = process.env.DB_FILE_NAME || 'file:data/local.db';

export const users = sqliteTable('users', {
  userId: int('user_id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  roles: text('roles', { mode: 'json' }).$type<Role[]>().notNull().default([]),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  refreshTokenHash: text('refresh_token_hash').unique(),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
});

export const tvShows = sqliteTable('tv_shows', {
  showId: int('id').primaryKey({ autoIncrement: true }),
  userId: int('user_id').notNull().references(() => users.userId),
  title: text('title').notNull(),
  tvMazeId: int('tvmaze_id').notNull(),
  platform: text('platform'),
  status: text('status'),
  scheduleDay: text('schedule_day', { mode: 'json' }).$type<string[]>(),
  scheduleTime: text('schedule_time'),
  prevEpisode: text('prev_episode'),
  nextEpisode: text('next_episode'),
  imageLink: text('image_link'),
});

export const db = drizzle(sqliteFile);

// ------------------------------------------------------------------
// Relation helpers
// ------------------------------------------------------------------
export const usersRelations = relations(users, ({ many }) => ({
  tvShows: many(tvShows),
}));

export const showRelations = relations(tvShows, ({ one }) => ({
  user: one(users, {
    fields: [tvShows.userId],
    references: [users.userId],
  }),
}));