import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import {
  createDraftRoomSchema,
  updateDraftRoomSchema,
} from '@movie-draft/shared';
import { authMiddleware } from '../middleware';
import {
  createDraftRoom,
  getDraftRoom,
  getDraftRoomByInviteCode,
  updateDraftRoom,
  deleteDraftRoom,
  joinDraftRoom,
  leaveDraftRoom,
  isParticipant,
  isRoomCreator,
} from '../services/room.service';

const rooms = new Hono();

rooms.use('*', authMiddleware);

/**
 * Create a new draft room
 * POST /rooms
 */
rooms.post('/', zValidator('json', createDraftRoomSchema), async (c) => {
  const userId = c.get('userId');
  const data = c.req.valid('json');

  const room = await createDraftRoom(userId, data);

  return c.json({ room }, 201);
});

/**
 * Join a draft room by invite code
 * POST /rooms/join/:code
 * NOTE: This route must come BEFORE /:id routes to avoid matching "join" as an :id
 */
rooms.post('/join/:code', async (c) => {
  const inviteCode = c.req.param('code');
  const userId = c.get('userId');

  const room = await getDraftRoomByInviteCode(inviteCode);
  if (!room) {
    throw new HTTPException(404, { message: 'Invalid invite code' });
  }

  const alreadyParticipant = await isParticipant(room.id, userId);
  if (alreadyParticipant) {
    return c.json({ room, message: 'You are already in this room' });
  }

  if (room.status !== 'WAITING') {
    throw new HTTPException(400, {
      message: 'Cannot join room after draft has started',
    });
  }

  const updatedRoom = await joinDraftRoom(room.id, userId);

  return c.json({ room: updatedRoom });
});

/**
 * Get a draft room by invite code
 * GET /rooms/invite/:code
 * NOTE: This route must come BEFORE /:id routes to avoid matching "invite" as an :id
 */
rooms.get('/invite/:code', async (c) => {
  const inviteCode = c.req.param('code');
  const userId = c.get('userId');

  const room = await getDraftRoomByInviteCode(inviteCode);

  if (!room) {
    throw new HTTPException(404, { message: 'Room not found' });
  }

  const userIsParticipant = await isParticipant(room.id, userId);

  return c.json({
    room,
    isParticipant: userIsParticipant,
    isCreator: room.creator.id === userId,
  });
});

/**
 * Get a draft room by ID
 * GET /rooms/:id
 */
rooms.get('/:id', async (c) => {
  const roomId = c.req.param('id');
  const userId = c.get('userId');

  const room = await getDraftRoom(roomId);

  if (!room) {
    throw new HTTPException(404, { message: 'Room not found' });
  }

  const userIsParticipant = await isParticipant(roomId, userId);

  return c.json({
    room,
    isParticipant: userIsParticipant,
    isCreator: room.creator.id === userId,
  });
});

/**
 * Update a draft room
 * PATCH /rooms/:id
 */
rooms.patch('/:id', zValidator('json', updateDraftRoomSchema), async (c) => {
  const roomId = c.req.param('id');
  const userId = c.get('userId');
  const data = c.req.valid('json');

  const isCreator = await isRoomCreator(roomId, userId);
  if (!isCreator) {
    throw new HTTPException(403, {
      message: 'Only the room creator can update the room',
    });
  }

  const room = await getDraftRoom(roomId);
  if (!room) {
    throw new HTTPException(404, { message: 'Room not found' });
  }

  if (room.status !== 'WAITING') {
    throw new HTTPException(400, {
      message: 'Cannot update room after draft has started',
    });
  }

  const updatedRoom = await updateDraftRoom(roomId, data);

  return c.json({ room: updatedRoom });
});

/**
 * Delete a draft room
 * DELETE /rooms/:id
 */
rooms.delete('/:id', async (c) => {
  const roomId = c.req.param('id');
  const userId = c.get('userId');

  const isCreator = await isRoomCreator(roomId, userId);
  if (!isCreator) {
    throw new HTTPException(403, {
      message: 'Only the room creator can delete the room',
    });
  }

  await deleteDraftRoom(roomId);

  return c.json({ message: 'Room deleted successfully' });
});

/**
 * Join a draft room
 * POST /rooms/:id/join
 */
rooms.post('/:id/join', async (c) => {
  const roomId = c.req.param('id');
  const userId = c.get('userId');

  const room = await getDraftRoom(roomId);
  if (!room) {
    throw new HTTPException(404, { message: 'Room not found' });
  }

  const alreadyParticipant = await isParticipant(roomId, userId);
  if (alreadyParticipant) {
    throw new HTTPException(400, { message: 'You are already in this room' });
  }

  if (room.status !== 'WAITING') {
    throw new HTTPException(400, {
      message: 'Cannot join room after draft has started',
    });
  }

  const updatedRoom = await joinDraftRoom(roomId, userId);

  return c.json({ room: updatedRoom });
});

/**
 * Leave a draft room
 * POST /rooms/:id/leave
 */
rooms.post('/:id/leave', async (c) => {
  const roomId = c.req.param('id');
  const userId = c.get('userId');

  const room = await getDraftRoom(roomId);
  if (!room) {
    throw new HTTPException(404, { message: 'Room not found' });
  }

  const userIsParticipant = await isParticipant(roomId, userId);
  if (!userIsParticipant) {
    throw new HTTPException(400, { message: 'You are not in this room' });
  }

  if (room.creator.id === userId) {
    throw new HTTPException(400, {
      message: 'Room creator cannot leave. Delete the room instead.',
    });
  }

  if (room.status !== 'WAITING') {
    throw new HTTPException(400, {
      message: 'Cannot leave room after draft has started',
    });
  }

  await leaveDraftRoom(roomId, userId);

  return c.json({ message: 'Left room successfully' });
});

export { rooms as roomRoutes };
