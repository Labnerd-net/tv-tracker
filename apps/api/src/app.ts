import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { clientURLs } from './utils/envVars.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/user.js';
import { logger } from './utils/middleware.js';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: clientURLs,
    allowHeaders: ['Content-Type'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
);
app.use(prettyJSON());
app.use(logger);

app.get('/', c => c.text('Welcome to TV Tracker!'));
app.notFound(c => c.json({ message: 'Not Found', ok: false }, 404));
app.get('/health', c => c.json({ status: 'UP' }));

// Chain .route() calls so TypeScript captures the full route schema for RPC type inference
const routes = app
  .route('/api/auth', authRoutes)
  .route('/api/admin', adminRoutes)
  .route('/api/user', userRoutes);

export default routes;
export type AppType = typeof routes;
