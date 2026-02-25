import { prisma } from '@movie-draft/prisma-client';
import { UpdateUserInput } from '@movie-draft/shared';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface UserDraftSummary {
  id: string;
  name: string;
  status: string;
  createdAt: Date;
  participantCount: number;
  categoryCount: number;
  isCreator: boolean;
}

export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
}

export async function updateUserProfile(
  userId: string,
  data: UpdateUserInput,
): Promise<UserProfile> {
  return prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      avatarUrl: data.avatarUrl,
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
}

export async function getUserDraftHistory(
  userId: string,
): Promise<UserDraftSummary[]> {
  const participations = await prisma.participant.findMany({
    where: { userId },
    include: {
      room: {
        include: {
          _count: {
            select: {
              participants: true,
              categories: true,
            },
          },
        },
      },
    },
    orderBy: {
      room: {
        createdAt: 'desc',
      },
    },
  });

  return participations.map((p) => ({
    id: p.room.id,
    name: p.room.name,
    status: p.room.status,
    createdAt: p.room.createdAt,
    participantCount: p.room._count.participants,
    categoryCount: p.room._count.categories,
    isCreator: p.room.creatorId === userId,
  }));
}

export async function getUserStats(userId: string) {
  const [totalDrafts, totalPicks, createdRooms] = await Promise.all([
    prisma.participant.count({ where: { userId } }),
    prisma.pick.count({
      where: {
        participant: { userId },
      },
    }),
    prisma.draftRoom.count({ where: { creatorId: userId } }),
  ]);

  return {
    totalDrafts,
    totalPicks,
    createdRooms,
  };
}
