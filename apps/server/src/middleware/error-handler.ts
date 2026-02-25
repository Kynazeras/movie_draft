import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { config } from '../config';

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

/**
 * Global error handler middleware for Hono
 */
export const errorHandler = async (err: Error | HTTPException, c: Context) => {
  console.error('[Error]', err);

  if (err instanceof HTTPException) {
    return c.json(
      {
        error: {
          message: err.message,
          status: err.status,
        },
      },
      err.status,
    );
  }

  const status = 500;
  const message = config.isDev ? err.message : 'Internal Server Error';

  return c.json(
    {
      error: {
        message,
        status,
        ...(config.isDev && { stack: err.stack }),
      },
    },
    status,
  );
};

/**
 * Request logger middleware
 */
export const requestLogger = async (c: Context, next: Next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  console.log(`[${method}] ${path} - ${status} (${duration}ms)`);
};

/**
 * Not found handler
 */
export const notFoundHandler = (c: Context) => {
  return c.json(
    {
      error: {
        message: 'Not Found',
        status: 404,
        path: c.req.path,
      },
    },
    404,
  );
};
