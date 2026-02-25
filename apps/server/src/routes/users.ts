import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { updateUserSchema } from '@movie-draft/shared';
import { authMiddleware } from '../middleware';
import {
  getUserProfile,
  updateUserProfile,
  getUserDraftHistory,
  getUserStats,
} from '../services/user.service';

const users = new Hono();

users.use('*', authMiddleware);

/**
 * Get current user's profile
 * GET /users/me
 */
users.get('/me', async (c) => {
  const userId = c.get('userId');
  const profile = await getUserProfile(userId);

  if (!profile) {
    throw new HTTPException(404, { message: 'User not found' });
  }

  return c.json({ user: profile });
});

/**
 * Update current user's profile
 * PATCH /users/me
 */
users.patch('/me', zValidator('json', updateUserSchema), async (c) => {
  const userId = c.get('userId');
  const data = c.req.valid('json');

  const profile = await updateUserProfile(userId, data);

  return c.json({ user: profile });
});

/**
 * Get current user's draft history
 * GET /users/me/drafts
 */
users.get('/me/drafts', async (c) => {
  const userId = c.get('userId');
  const drafts = await getUserDraftHistory(userId);

  return c.json({ drafts });
});

/**
 * Get current user's statistics
 * GET /users/me/stats
 */
users.get('/me/stats', async (c) => {
  const userId = c.get('userId');
  const stats = await getUserStats(userId);

  return c.json({ stats });
});

/**
 * Get another user's public profile
 * GET /users/:id
 */
users.get('/:id', async (c) => {
  const userId = c.req.param('id');
  const profile = await getUserProfile(userId);

  if (!profile) {
    throw new HTTPException(404, { message: 'User not found' });
  }

  return c.json({
    user: {
      id: profile.id,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
    },
  });
});

export { users as userRoutes };
