import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { verifyToken, getUserById, AuthUser } from '../services/auth.service';

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
    userId: string;
  }
}

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, {
      message: 'Missing or invalid authorization header',
    });
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    throw new HTTPException(401, { message: 'Invalid or expired token' });
  }

  const user = await getUserById(payload.userId);

  if (!user) {
    throw new HTTPException(401, { message: 'User not found' });
  }

  c.set('user', user);
  c.set('userId', user.id);

  await next();
};

export const optionalAuthMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    if (payload) {
      const user = await getUserById(payload.userId);
      if (user) {
        c.set('user', user);
        c.set('userId', user.id);
      }
    }
  }

  await next();
};
