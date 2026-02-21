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
    allowHeaders: ['Content-Type', 'Authorization'],
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

app.route('/api/auth', authRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/user', userRoutes);

export default app;
