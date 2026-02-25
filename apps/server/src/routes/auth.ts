import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { registerSchema, loginSchema, AuthResponse } from '@movie-draft/shared';
import {
  createUser,
  authenticateUser,
  generateToken,
  createSession,
  deleteSession,
  getUserById,
} from '../services/auth.service';
import { authMiddleware } from '../middleware';

const auth = new Hono();

/**
 * Register a new user
 * POST /auth/register
 */
auth.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, name } = c.req.valid('json');

  try {
    const user = await createUser(email, password, name);
    const token = generateToken(user);

    await createSession(user.id, token);

    const response: AuthResponse = {
      user,
      token,
    };

    return c.json(response, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      throw new HTTPException(409, {
        message: 'User with this email already exists',
      });
    }
    throw error;
  }
});

/**
 * Login with email and password
 * POST /auth/login
 */
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const user = await authenticateUser(email, password);

  if (!user) {
    throw new HTTPException(401, { message: 'Invalid email or password' });
  }

  const token = generateToken(user);

  await createSession(user.id, token);

  const response: AuthResponse = {
    user,
    token,
  };

  return c.json(response);
});

/**
 * Logout (invalidate token)
 * POST /auth/logout
 */
auth.post('/logout', authMiddleware, async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.slice(7);

  if (token) {
    await deleteSession(token);
  }

  return c.json({ message: 'Logged out successfully' });
});

/**
 * Get current user
 * GET /auth/me
 */
auth.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const user = await getUserById(userId);

  if (!user) {
    throw new HTTPException(404, { message: 'User not found' });
  }

  return c.json({ user });
});

/**
 * Refresh token
 * POST /auth/refresh
 */
auth.post('/refresh', authMiddleware, async (c) => {
  const user = c.get('user');
  const oldToken = c.req.header('Authorization')?.slice(7);

  const newToken = generateToken(user);

  if (oldToken) {
    await deleteSession(oldToken);
  }
  await createSession(user.id, newToken);

  return c.json({ token: newToken });
});

export { auth as authRoutes };
