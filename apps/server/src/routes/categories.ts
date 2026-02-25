import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
} from '@movie-draft/shared';
import { authMiddleware } from '../middleware';
import {
  getDraftRoom,
  isParticipant,
  isRoomCreator,
} from '../services/room.service';
import {
  createCategory,
  getCategory,
  getRoomCategories,
  updateCategory,
  deleteCategory,
  reorderCategories,
  createCategories,
} from '../services/category.service';

const categories = new Hono();

categories.use('*', authMiddleware);

const bulkCreateSchema = z.object({
  categories: z.array(z.object({ name: z.string().min(1).max(200) })).min(1),
});

/**
 * Get all categories for a room
 * GET /rooms/:roomId/categories
 */
categories.get('/:roomId/categories', async (c) => {
  const roomId = c.req.param('roomId');
  const userId = c.get('userId');

  const room = await getDraftRoom(roomId);
  if (!room) {
    throw new HTTPException(404, { message: 'Room not found' });
  }

  const roomCategories = await getRoomCategories(roomId);

  return c.json({ categories: roomCategories });
});

/**
 * Create a new category
 * POST /rooms/:roomId/categories
 */
categories.post(
  '/:roomId/categories',
  zValidator('json', createCategorySchema),
  async (c) => {
    const roomId = c.req.param('roomId');
    const userId = c.get('userId');
    const data = c.req.valid('json');

    const room = await getDraftRoom(roomId);
    if (!room) {
      throw new HTTPException(404, { message: 'Room not found' });
    }

    if (room.creator.id !== userId) {
      throw new HTTPException(403, {
        message: 'Only the room creator can add categories',
      });
    }

    if (room.status !== 'WAITING') {
      throw new HTTPException(400, {
        message: 'Cannot add categories after draft has started',
      });
    }

    const category = await createCategory(roomId, data);

    return c.json({ category }, 201);
  },
);

/**
 * Bulk create categories
 * POST /rooms/:roomId/categories/bulk
 */
categories.post(
  '/:roomId/categories/bulk',
  zValidator('json', bulkCreateSchema),
  async (c) => {
    const roomId = c.req.param('roomId');
    const userId = c.get('userId');
    const { categories: categoryList } = c.req.valid('json');

    const room = await getDraftRoom(roomId);
    if (!room) {
      throw new HTTPException(404, { message: 'Room not found' });
    }

    if (room.creator.id !== userId) {
      throw new HTTPException(403, {
        message: 'Only the room creator can add categories',
      });
    }

    if (room.status !== 'WAITING') {
      throw new HTTPException(400, {
        message: 'Cannot add categories after draft has started',
      });
    }

    const createdCategories = await createCategories(roomId, categoryList);

    return c.json({ categories: createdCategories }, 201);
  },
);

/**
 * Update a category
 * PATCH /rooms/:roomId/categories/:categoryId
 */
categories.patch(
  '/:roomId/categories/:categoryId',
  zValidator('json', updateCategorySchema),
  async (c) => {
    const roomId = c.req.param('roomId');
    const categoryId = c.req.param('categoryId');
    const userId = c.get('userId');
    const data = c.req.valid('json');

    const room = await getDraftRoom(roomId);
    if (!room) {
      throw new HTTPException(404, { message: 'Room not found' });
    }

    if (room.creator.id !== userId) {
      throw new HTTPException(403, {
        message: 'Only the room creator can update categories',
      });
    }

    if (room.status !== 'WAITING') {
      throw new HTTPException(400, {
        message: 'Cannot update categories after draft has started',
      });
    }

    const category = await getCategory(categoryId);
    if (!category || category.roomId !== roomId) {
      throw new HTTPException(404, { message: 'Category not found' });
    }

    const updatedCategory = await updateCategory(categoryId, data);

    return c.json({ category: updatedCategory });
  },
);

/**
 * Delete a category
 * DELETE /rooms/:roomId/categories/:categoryId
 */
categories.delete('/:roomId/categories/:categoryId', async (c) => {
  const roomId = c.req.param('roomId');
  const categoryId = c.req.param('categoryId');
  const userId = c.get('userId');

  const room = await getDraftRoom(roomId);
  if (!room) {
    throw new HTTPException(404, { message: 'Room not found' });
  }

  if (room.creator.id !== userId) {
    throw new HTTPException(403, {
      message: 'Only the room creator can delete categories',
    });
  }

  if (room.status !== 'WAITING') {
    throw new HTTPException(400, {
      message: 'Cannot delete categories after draft has started',
    });
  }

  const category = await getCategory(categoryId);
  if (!category || category.roomId !== roomId) {
    throw new HTTPException(404, { message: 'Category not found' });
  }

  await deleteCategory(categoryId);

  return c.json({ message: 'Category deleted successfully' });
});

/**
 * Reorder categories
 * POST /rooms/:roomId/categories/reorder
 */
categories.post(
  '/:roomId/categories/reorder',
  zValidator('json', reorderCategoriesSchema),
  async (c) => {
    const roomId = c.req.param('roomId');
    const userId = c.get('userId');
    const { categoryIds } = c.req.valid('json');

    const room = await getDraftRoom(roomId);
    if (!room) {
      throw new HTTPException(404, { message: 'Room not found' });
    }

    if (room.creator.id !== userId) {
      throw new HTTPException(403, {
        message: 'Only the room creator can reorder categories',
      });
    }

    if (room.status !== 'WAITING') {
      throw new HTTPException(400, {
        message: 'Cannot reorder categories after draft has started',
      });
    }

    const updatedCategories = await reorderCategories(roomId, categoryIds);

    return c.json({ categories: updatedCategories });
  },
);

export { categories as categoryRoutes };
