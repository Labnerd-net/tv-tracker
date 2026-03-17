import { drizzle } from 'drizzle-orm/libsql';
import { dbUrl } from '../utils/envVars.js';

export const db = drizzle(dbUrl);
