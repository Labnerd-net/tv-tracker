import 'dotenv/config';
import { serve } from '@hono/node-server';
import app from './app.js';
import { serverPort } from './utils/envVars.js';
import pinoLogger from './utils/logger.js';

serve(
  {
    fetch: app.fetch,
    hostname: '0.0.0.0',
    port: serverPort,
  },
  info => {
    pinoLogger.info(
      { port: info.port, dbHost: process.env.DB_HOST ?? 'localhost' },
      'Server started'
    );
  }
);
