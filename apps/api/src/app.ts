import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import type { Bindings } from './utils/bindings.js';
import { getAllowedOrigins } from './utils/envVars.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/user.js';
import { requestLogger } from './utils/middleware.js';

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const allowed = getAllowedOrigins(c.env);
      return allowed.includes(origin) ? origin : allowed[0];
    },
    allowHeaders: ['Content-Type'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }),
);
app.use(prettyJSON());
app.use(requestLogger);

app.get('/', c => c.text('Welcome to TV Tracker!'));
app.notFound(c => c.json({ message: 'Not Found', ok: false }, 404));
app.get('/health', c => c.json({ status: 'UP' }));

const routes = app
  .route('/api/auth', authRoutes)
  .route('/api/admin', adminRoutes)
  .route('/api/user', userRoutes);

export default routes;
export type AppType = typeof routes;
