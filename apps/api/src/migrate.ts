import 'dotenv/config';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from './db/schema.js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

await migrate(db, { migrationsFolder: join(__dirname, '../../../drizzle') });
console.log('Migrations complete');
