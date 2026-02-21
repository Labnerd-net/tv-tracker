import { eq } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { users } from './schema.js';
import logger from '../utils/logger.js';
import type {
  ProfileData,
  UserData,
  UserDbData,
} from '@shared/types/tv-tracker.js';

// ------------------------------------------------------------------
// Return all users
// ------------------------------------------------------------------
export async function returnUsers(db: LibSQLDatabase): Promise<UserDbData[]> {
  logger.debug('returnUsers');
  try {
    return await db.select().from(users);
  } catch (e) {
    logger.error({ err: e }, 'returnUsers failed');
    throw e;
  }
}

// ------------------------------------------------------------------
// Return user by Email
// ------------------------------------------------------------------
export async function returnUserByEmail(db: LibSQLDatabase, email: string): Promise<UserDbData[]> {
  logger.debug({ email }, 'returnUserByEmail');
  try {
    return await db.select().from(users).where(eq(users.email, email));
  } catch (e) {
    logger.error({ err: e }, 'returnUserByEmail failed');
    throw e;
  }
}

// ------------------------------------------------------------------
// Return user by Id
// ------------------------------------------------------------------
export async function returnUserById(db: LibSQLDatabase, userId: string): Promise<UserDbData[]> {
  logger.debug({ userId }, 'returnUserById');
  try {
    const userIdNumber = Number(userId);
    return await db.select().from(users).where(eq(users.userId, userIdNumber));
  } catch (e) {
    logger.error({ err: e }, 'returnUserById failed');
    throw e;
  }
}

// ------------------------------------------------------------------
// Add user
// ------------------------------------------------------------------
export async function addUser(db: LibSQLDatabase, user: UserData): Promise<ProfileData[]> {
  logger.debug({ email: user.email }, 'addUser');
  try {
    return await db
      .insert(users)
      .values({
        email: user.email,
        displayName: user.displayName,
        passwordHash: user.passwordHash,
        roles: user.roles,
      })
      .returning({
        userId: users.userId,
        email: users.email,
        displayName: users.displayName,
        roles: users.roles,
      });
  } catch (e) {
    logger.error({ err: e }, 'addUser failed');
    throw e;
  }
}

// ------------------------------------------------------------------
// Update refresh token hash + expiry for a user
// ------------------------------------------------------------------
export async function updateRefreshToken(db: LibSQLDatabase, userId: number, hash: string, expiresAt: Date) {
  logger.debug({ userId }, 'updateRefreshToken');
  try {
    return await db
      .update(users)
      .set({ refreshTokenHash: hash, refreshTokenExpiresAt: expiresAt })
      .where(eq(users.userId, userId));
  } catch (e) {
    logger.error({ err: e }, 'updateRefreshToken failed');
    throw e;
  }
}

// ------------------------------------------------------------------
// Clear refresh token on logout
// ------------------------------------------------------------------
export async function clearRefreshToken(db: LibSQLDatabase, userId: number) {
  logger.debug({ userId }, 'clearRefreshToken');
  try {
    return await db
      .update(users)
      .set({ refreshTokenHash: null, refreshTokenExpiresAt: null })
      .where(eq(users.userId, userId));
  } catch (e) {
    logger.error({ err: e }, 'clearRefreshToken failed');
    throw e;
  }
}

// ------------------------------------------------------------------
// Return user by refresh token hash
// ------------------------------------------------------------------
export async function returnUserByRefreshTokenHash(db: LibSQLDatabase, hash: string): Promise<UserDbData[]> {
  logger.debug('returnUserByRefreshTokenHash');
  try {
    return await db.select().from(users).where(eq(users.refreshTokenHash, hash));
  } catch (e) {
    logger.error({ err: e }, 'returnUserByRefreshTokenHash failed');
    throw e;
  }
}

// ------------------------------------------------------------------
// Delete user by Id
// ------------------------------------------------------------------
export async function deleteUserById(db: LibSQLDatabase, userId: string) {
  logger.debug({ userId }, 'deleteUserById');
  try {
    const userIdNumber = Number(userId);
    return await db.delete(users).where(eq(users.userId, userIdNumber));
  } catch (e) {
    logger.error({ err: e }, 'deleteUserById failed');
    throw e;
  }
}
