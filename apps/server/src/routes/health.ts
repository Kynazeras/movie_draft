import { Hono } from 'hono';
import { prisma } from '@movie-draft/prisma-client';

const health = new Hono();

/**
 * Health check endpoint
 * GET /health
 */
health.get('/', async (c) => {
  const checks: Record<string, 'ok' | 'error'> = {
    server: 'ok',
    database: 'error',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch (error) {
    console.error('[Health] Database check failed:', error);
    checks.database = 'error';
  }

  const allHealthy = Object.values(checks).every((status) => status === 'ok');

  return c.json(
    {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    },
    allHealthy ? 200 : 503,
  );
});

/**
 * Simple ping endpoint
 * GET /health/ping
 */
health.get('/ping', (c) => {
  return c.text('pong');
});

export { health as healthRoutes };
