import { drizzle } from 'drizzle-orm/libsql';
import { dbUrl } from '../utils/envVars.js';

export const db = drizzle(dbUrl);

// Enable FK enforcement — must be set per-connection in SQLite.
// libsql serializes operations so this runs before any query.
void db.$client.execute('PRAGMA foreign_keys = ON');
