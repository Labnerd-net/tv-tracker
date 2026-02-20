import { eq, and } from 'drizzle-orm';
import { users, db } from './schema.js';
import logger from '../utils/logger.js';
import type {
  ProfileData,
  UserData,
  UserDbData,
} from '@shared/types/tv-tracker.js';

// ------------------------------------------------------------------
// Return all users
// ------------------------------------------------------------------
export async function returnUsers(): Promise<UserDbData[]> {
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
export async function returnUserByEmail(email: string): Promise<UserDbData[]> {
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
export async function returnUserById(userId: string): Promise<UserDbData[]> {
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
export async function addUser(user: UserData): Promise<ProfileData[]> {
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
// Delete user by Id
// ------------------------------------------------------------------
export async function deleteUserById(userId: string) {
  logger.debug({ userId }, 'deleteUserById');
  try {
    const userIdNumber = Number(userId);
    return await db.delete(users).where(eq(users.userId, userIdNumber));
  } catch (e) {
    logger.error({ err: e }, 'deleteUserById failed');
    throw e;
  }
}
