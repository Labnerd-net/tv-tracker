import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const sqliteFile = process.env.DB_FILE_NAME || 'file:data/local.db';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: sqliteFile,
  },
});
