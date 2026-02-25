import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware';
import {
  startDraft,
  makePick,
  getDraftState,
  getAvailableCategoriesForParticipant,
  getPickedMovieIds,
  getCurrentPicker,
} from '../services/draft.service';
import { isParticipant, getDraftRoom } from '../services/room.service';

const draft = new Hono();

draft.use('*', authMiddleware);

const makePickSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  movieId: z.number().int().positive('Valid movie ID is required'),
  movieTitle: z.string().min(1, 'Movie title is required'),
  moviePosterUrl: z.string().url().nullable().optional(),
  movieYear: z.number().int().nullable().optional(),
});

/**
 * Get draft state for a room
 * GET /draft/:roomId
 */
draft.get('/:roomId', async (c) => {
  const roomId = c.req.param('roomId');
  const userId = c.get('userId');

  const userIsParticipant = await isParticipant(roomId, userId);
  if (!userIsParticipant) {
    throw new HTTPException(403, {
      message: 'You are not a participant in this draft',
    });
  }

  const state = await getDraftState(roomId);
  if (!state) {
    throw new HTTPException(404, { message: 'Room not found' });
  }

  const room = await getDraftRoom(roomId);
  if (!room) {
    throw new HTTPException(404, { message: 'Room not found' });
  }

  const currentPicker = getCurrentPicker(room.currentTurn, room.participants);

  const userParticipant = room.participants.find((p) => p.userId === userId);

  return c.json({
    draft: {
      ...state,
      currentPicker: currentPicker
        ? {
            participantId: currentPicker.participantId,
            participantName: currentPicker.participantName,
            roundNumber: currentPicker.roundNumber,
            isCurrentUser: userParticipant?.id === currentPicker.participantId,
          }
        : null,
      participants: room.participants.map((p) => ({
        id: p.id,
        participantId: p.id,
        userId: p.userId,
        name: p.user.name,
        draftPosition: p.draftPosition,
        isCurrentUser: p.userId === userId,
      })),
      categories: room.categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        order: cat.order,
      })),
    },
  });
});

/**
 * Start a draft
 * POST /draft/:roomId/start
 */
draft.post('/:roomId/start', async (c) => {
  const roomId = c.req.param('roomId');
  const userId = c.get('userId');

  try {
    const state = await startDraft(roomId, userId);
    return c.json({ draft: state });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Room not found') {
        throw new HTTPException(404, { message: error.message });
      }
      if (error.message === 'Only the room creator can start the draft') {
        throw new HTTPException(403, { message: error.message });
      }
      throw new HTTPException(400, { message: error.message });
    }
    throw error;
  }
});

/**
 * Make a pick
 * POST /draft/:roomId/pick
 */
draft.post('/:roomId/pick', zValidator('json', makePickSchema), async (c) => {
  const roomId = c.req.param('roomId');
  const userId = c.get('userId');
  const data = c.req.valid('json');

  const room = await getDraftRoom(roomId);
  if (!room) {
    throw new HTTPException(404, { message: 'Room not found' });
  }

  const participant = room.participants.find((p) => p.userId === userId);
  if (!participant) {
    throw new HTTPException(403, {
      message: 'You are not a participant in this draft',
    });
  }

  try {
    const pick = await makePick({
      roomId,
      participantId: participant.id,
      categoryId: data.categoryId,
      movieId: data.movieId,
      movieTitle: data.movieTitle,
      moviePosterUrl: data.moviePosterUrl,
      movieYear: data.movieYear,
    });

    return c.json({ pick }, 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Room not found') {
        throw new HTTPException(404, { message: error.message });
      }
      if (error.message === 'It is not your turn to pick') {
        throw new HTTPException(403, { message: error.message });
      }
      throw new HTTPException(400, { message: error.message });
    }
    throw error;
  }
});

/**
 * Get available categories for the current user
 * GET /draft/:roomId/available-categories
 */
draft.get('/:roomId/available-categories', async (c) => {
  const roomId = c.req.param('roomId');
  const userId = c.get('userId');

  const room = await getDraftRoom(roomId);
  if (!room) {
    throw new HTTPException(404, { message: 'Room not found' });
  }

  const participant = room.participants.find((p) => p.userId === userId);
  if (!participant) {
    throw new HTTPException(403, {
      message: 'You are not a participant in this draft',
    });
  }

  const categories = await getAvailableCategoriesForParticipant(
    roomId,
    participant.id,
  );

  return c.json({ categories });
});

/**
 * Get already picked movie IDs (to filter search results)
 * GET /draft/:roomId/picked-movies
 */
draft.get('/:roomId/picked-movies', async (c) => {
  const roomId = c.req.param('roomId');
  const userId = c.get('userId');

  const userIsParticipant = await isParticipant(roomId, userId);
  if (!userIsParticipant) {
    throw new HTTPException(403, {
      message: 'You are not a participant in this draft',
    });
  }

  const movieIds = await getPickedMovieIds(roomId);

  return c.json({ pickedMovieIds: movieIds });
});

export { draft as draftRoutes };
