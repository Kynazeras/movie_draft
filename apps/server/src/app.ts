import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware';
import {
  healthRoutes,
  authRoutes,
  userRoutes,
  roomRoutes,
  categoryRoutes,
  movieRoutes,
  draftRoutes,
} from './routes';

const app = new Hono();

app.use('*', secureHeaders());

app.use(
  '*',
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
  }),
);

if (config.isDev) {
  app.use('*', logger());
}

app.route('/health', healthRoutes);
app.route('/auth', authRoutes);
app.route('/users', userRoutes);
app.route('/rooms', roomRoutes);
app.route('/rooms', categoryRoutes);
app.route('/movies', movieRoutes);
app.route('/draft', draftRoutes);

app.get('/', (c) => {
  return c.json({
    name: 'Movie Draft API',
    version: '1.0.0',
    environment: config.nodeEnv,
  });
});

app.notFound(notFoundHandler);
app.onError(errorHandler);

export { app };
