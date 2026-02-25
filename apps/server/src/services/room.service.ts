import { prisma, DraftStatus } from '@movie-draft/prisma-client';
import {
  CreateDraftRoomInput,
  UpdateDraftRoomInput,
} from '@movie-draft/shared';
import { randomBytes } from 'crypto';

export interface DraftRoomDetail {
  id: string;
  name: string;
  inviteCode: string;
  status: DraftStatus;
  currentTurn: number;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
  creator: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  participants: Array<{
    id: string;
    userId: string;
    draftPosition: number;
    joinedAt: Date;
    user: {
      id: string;
      name: string | null;
      avatarUrl: string | null;
    };
  }>;
  categories: Array<{
    id: string;
    name: string;
    order: number;
    createdAt: Date;
    roomId: string;
  }>;
  _count: {
    picks: number;
  };
}

/**
 * Generate a unique invite code
 */
function generateInviteCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Create a new draft room
 */
export async function createDraftRoom(
  creatorId: string,
  data: CreateDraftRoomInput,
): Promise<DraftRoomDetail> {
  const inviteCode = generateInviteCode();

  const room = await prisma.draftRoom.create({
    data: {
      name: data.name,
      inviteCode,
      creatorId,

      participants: {
        create: {
          userId: creatorId,
          draftPosition: 0,
        },
      },
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          draftPosition: 'asc',
        },
      },
      categories: {
        orderBy: {
          order: 'asc',
        },
      },
      _count: {
        select: {
          picks: true,
        },
      },
    },
  });

  return room;
}

/**
 * Get a draft room by ID
 */
export async function getDraftRoom(
  roomId: string,
): Promise<DraftRoomDetail | null> {
  return prisma.draftRoom.findUnique({
    where: { id: roomId },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          draftPosition: 'asc',
        },
      },
      categories: {
        orderBy: {
          order: 'asc',
        },
      },
      _count: {
        select: {
          picks: true,
        },
      },
    },
  });
}

/**
 * Get a draft room by invite code
 */
export async function getDraftRoomByInviteCode(
  inviteCode: string,
): Promise<DraftRoomDetail | null> {
  return prisma.draftRoom.findUnique({
    where: { inviteCode },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          draftPosition: 'asc',
        },
      },
      categories: {
        orderBy: {
          order: 'asc',
        },
      },
      _count: {
        select: {
          picks: true,
        },
      },
    },
  });
}

/**
 * Update a draft room
 */
export async function updateDraftRoom(
  roomId: string,
  data: UpdateDraftRoomInput,
): Promise<DraftRoomDetail> {
  return prisma.draftRoom.update({
    where: { id: roomId },
    data: {
      name: data.name,
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          draftPosition: 'asc',
        },
      },
      categories: {
        orderBy: {
          order: 'asc',
        },
      },
      _count: {
        select: {
          picks: true,
        },
      },
    },
  });
}

/**
 * Delete a draft room
 */
export async function deleteDraftRoom(roomId: string): Promise<void> {
  await prisma.draftRoom.delete({
    where: { id: roomId },
  });
}

/**
 * Join a draft room
 */
export async function joinDraftRoom(
  roomId: string,
  userId: string,
): Promise<DraftRoomDetail> {
  const participantCount = await prisma.participant.count({
    where: { roomId },
  });

  await prisma.participant.create({
    data: {
      roomId,
      userId,
      draftPosition: participantCount,
    },
  });

  return getDraftRoom(roomId) as Promise<DraftRoomDetail>;
}

/**
 * Leave a draft room
 */
export async function leaveDraftRoom(
  roomId: string,
  userId: string,
): Promise<void> {
  await prisma.participant.deleteMany({
    where: {
      roomId,
      userId,
    },
  });

  const remaining = await prisma.participant.findMany({
    where: { roomId },
    orderBy: { draftPosition: 'asc' },
  });

  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].draftPosition !== i) {
      await prisma.participant.update({
        where: { id: remaining[i].id },
        data: { draftPosition: i },
      });
    }
  }
}

/**
 * Check if user is a participant in the room
 */
export async function isParticipant(
  roomId: string,
  userId: string,
): Promise<boolean> {
  const participant = await prisma.participant.findUnique({
    where: {
      userId_roomId: {
        userId,
        roomId,
      },
    },
  });
  return !!participant;
}

/**
 * Check if user is the room creator
 */
export async function isRoomCreator(
  roomId: string,
  userId: string,
): Promise<boolean> {
  const room = await prisma.draftRoom.findUnique({
    where: { id: roomId },
    select: { creatorId: true },
  });
  return room?.creatorId === userId;
}

/**
 * Update draft room status
 */
export async function updateRoomStatus(
  roomId: string,
  status: DraftStatus,
): Promise<void> {
  await prisma.draftRoom.update({
    where: { id: roomId },
    data: { status },
  });
}

/**
 * Reorder participants (change draft positions)
 */
export async function reorderParticipants(
  roomId: string,
  participantIds: string[],
): Promise<void> {
  for (let i = 0; i < participantIds.length; i++) {
    await prisma.participant.update({
      where: { id: participantIds[i] },
      data: { draftPosition: i },
    });
  }
}
