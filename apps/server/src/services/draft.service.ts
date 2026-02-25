import { prisma } from '@movie-draft/prisma-client';
import { DraftStatus } from '@prisma/client';
import { emitToRoom } from '../socket';

export interface DraftState {
  roomId: string;
  status: DraftStatus;
  currentTurn: number;
  currentRound: number;
  totalRounds: number;
  participantOrder: string[];
  picks: DraftPick[];
}

export interface DraftPick {
  id: string;
  participantId: string;
  participantName: string;
  categoryId: string;
  categoryName: string;
  movieId: number;
  movieTitle: string;
  moviePosterUrl: string | null;
  movieYear: number | null;
  pickNumber: number;
}

export interface MakePickInput {
  roomId: string;
  participantId: string;
  categoryId: string;
  movieId: number;
  movieTitle: string;
  moviePosterUrl?: string | null;
  movieYear?: number | null;
}

export function calculateSnakeDraftPosition(
  pickNumber: number,
  participantCount: number,
): { participantIndex: number; roundNumber: number } {
  const roundNumber = Math.floor(pickNumber / participantCount) + 1;
  const positionInRound = pickNumber % participantCount;

  const isReverseRound = roundNumber % 2 === 0;
  const participantIndex = isReverseRound
    ? participantCount - 1 - positionInRound
    : positionInRound;

  return { participantIndex, roundNumber };
}

export function getCurrentPicker(
  currentTurn: number,
  participants: {
    id: string;
    draftPosition: number;
    user: { name: string | null };
  }[],
): {
  participantId: string;
  participantName: string;
  roundNumber: number;
} | null {
  if (participants.length === 0) return null;

  const { participantIndex, roundNumber } = calculateSnakeDraftPosition(
    currentTurn,
    participants.length,
  );

  const participant = participants.find(
    (p) => p.draftPosition === participantIndex,
  );
  if (!participant) return null;

  return {
    participantId: participant.id,
    participantName: participant.user.name || 'Unknown',
    roundNumber,
  };
}

export async function startDraft(
  roomId: string,
  userId: string,
): Promise<DraftState> {
  const room = await prisma.draftRoom.findUnique({
    where: { id: roomId },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { draftPosition: 'asc' },
      },
      categories: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!room) {
    throw new Error('Room not found');
  }

  if (room.creatorId !== userId) {
    throw new Error('Only the room creator can start the draft');
  }

  if (room.status !== 'WAITING') {
    throw new Error('Draft has already started or completed');
  }

  if (room.participants.length < 2) {
    throw new Error('Need at least 2 participants to start a draft');
  }

  if (room.categories.length === 0) {
    throw new Error('Need at least 1 category to start a draft');
  }

  const updatedRoom = await prisma.draftRoom.update({
    where: { id: roomId },
    data: {
      status: 'IN_PROGRESS',
      currentTurn: 0,
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { draftPosition: 'asc' },
      },
      categories: {
        orderBy: { order: 'asc' },
      },
    },
  });

  const currentPicker = getCurrentPicker(0, updatedRoom.participants);

  emitToRoom(roomId, 'draft:started', {
    roomId,
    currentTurn: 0,
    currentPlayerId: currentPicker?.participantId || '',
  });

  if (currentPicker) {
    emitToRoom(roomId, 'draft:turn-changed', {
      currentTurn: 0,
      currentPlayerId: currentPicker.participantId,
      currentPlayerName: currentPicker.participantName,
      roundNumber: currentPicker.roundNumber,
    });
  }

  return {
    roomId,
    status: 'IN_PROGRESS',
    currentTurn: 0,
    currentRound: 1,
    totalRounds: updatedRoom.categories.length,
    participantOrder: updatedRoom.participants.map((p) => p.id),
    picks: [],
  };
}

export async function makePick(input: MakePickInput): Promise<DraftPick> {
  const {
    roomId,
    participantId,
    categoryId,
    movieId,
    movieTitle,
    moviePosterUrl,
    movieYear,
  } = input;

  const room = await prisma.draftRoom.findUnique({
    where: { id: roomId },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { draftPosition: 'asc' },
      },
      categories: {
        orderBy: { order: 'asc' },
      },
      picks: true,
    },
  });

  if (!room) {
    throw new Error('Room not found');
  }

  if (room.status !== 'IN_PROGRESS') {
    throw new Error('Draft is not in progress');
  }

  const currentPicker = getCurrentPicker(room.currentTurn, room.participants);
  if (!currentPicker || currentPicker.participantId !== participantId) {
    throw new Error('It is not your turn to pick');
  }

  const category = room.categories.find((c) => c.id === categoryId);
  if (!category) {
    throw new Error('Category not found');
  }

  const existingPickForCategory = room.picks.find(
    (p) => p.participantId === participantId && p.categoryId === categoryId,
  );
  if (existingPickForCategory) {
    throw new Error('You have already made a pick for this category');
  }

  const existingMoviePick = room.picks.find((p) => p.tmdbMovieId === movieId);
  if (existingMoviePick) {
    throw new Error('This movie has already been picked');
  }

  const totalPicksNeeded = room.participants.length * room.categories.length;
  const newPickNumber = room.currentTurn;
  const isLastPick = newPickNumber >= totalPicksNeeded - 1;

  const pick = await prisma.pick.create({
    data: {
      roomId,
      participantId,
      categoryId,
      tmdbMovieId: movieId,
      movieTitle,
      moviePosterUrl: moviePosterUrl || null,
      movieYear: movieYear || null,
      pickNumber: newPickNumber,
    },
    include: {
      participant: {
        include: {
          user: { select: { name: true } },
        },
      },
      category: true,
    },
  });

  emitToRoom(roomId, 'draft:pick-made', {
    pickId: pick.id,
    participantId: pick.participantId,
    participantName: pick.participant.user.name || 'Unknown',
    categoryId: pick.categoryId,
    categoryName: pick.category.name,
    movieId: pick.tmdbMovieId,
    movieTitle: pick.movieTitle,
    moviePosterUrl: pick.moviePosterUrl,
    pickNumber: pick.pickNumber,
  });

  if (isLastPick) {
    await prisma.draftRoom.update({
      where: { id: roomId },
      data: {
        status: 'COMPLETED',
        currentTurn: room.currentTurn + 1,
      },
    });

    emitToRoom(roomId, 'draft:completed', {
      roomId,
      completedAt: new Date().toISOString(),
    });
  } else {
    const nextTurn = room.currentTurn + 1;
    await prisma.draftRoom.update({
      where: { id: roomId },
      data: { currentTurn: nextTurn },
    });

    const nextPicker = getCurrentPicker(nextTurn, room.participants);
    if (nextPicker) {
      emitToRoom(roomId, 'draft:turn-changed', {
        currentTurn: nextTurn,
        currentPlayerId: nextPicker.participantId,
        currentPlayerName: nextPicker.participantName,
        roundNumber: nextPicker.roundNumber,
      });
    }
  }

  return {
    id: pick.id,
    participantId: pick.participantId,
    participantName: pick.participant.user.name || 'Unknown',
    categoryId: pick.categoryId,
    categoryName: pick.category.name,
    movieId: pick.tmdbMovieId,
    movieTitle: pick.movieTitle,
    moviePosterUrl: pick.moviePosterUrl,
    movieYear: pick.movieYear,
    pickNumber: pick.pickNumber,
  };
}

export async function getDraftState(
  roomId: string,
): Promise<DraftState | null> {
  const room = await prisma.draftRoom.findUnique({
    where: { id: roomId },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { draftPosition: 'asc' },
      },
      categories: {
        orderBy: { order: 'asc' },
      },
      picks: {
        include: {
          participant: {
            include: {
              user: { select: { name: true } },
            },
          },
          category: true,
        },
        orderBy: { pickNumber: 'asc' },
      },
    },
  });

  if (!room) return null;

  const currentPicker = getCurrentPicker(room.currentTurn, room.participants);

  return {
    roomId: room.id,
    status: room.status,
    currentTurn: room.currentTurn,
    currentRound: currentPicker?.roundNumber || 1,
    totalRounds: room.categories.length,
    participantOrder: room.participants.map((p) => p.id),
    picks: room.picks.map((p) => ({
      id: p.id,
      participantId: p.participantId,
      participantName: p.participant.user.name || 'Unknown',
      categoryId: p.categoryId,
      categoryName: p.category.name,
      movieId: p.tmdbMovieId,
      movieTitle: p.movieTitle,
      moviePosterUrl: p.moviePosterUrl,
      movieYear: p.movieYear,
      pickNumber: p.pickNumber,
    })),
  };
}

export async function getAvailableCategoriesForParticipant(
  roomId: string,
  participantId: string,
): Promise<{ id: string; name: string; order: number }[]> {
  const room = await prisma.draftRoom.findUnique({
    where: { id: roomId },
    include: {
      categories: { orderBy: { order: 'asc' } },
      picks: { where: { participantId } },
    },
  });

  if (!room) return [];

  const pickedCategoryIds = new Set(room.picks.map((p) => p.categoryId));

  return room.categories
    .filter((c) => !pickedCategoryIds.has(c.id))
    .map((c) => ({ id: c.id, name: c.name, order: c.order }));
}

export async function getPickedMovieIds(roomId: string): Promise<number[]> {
  const picks = await prisma.pick.findMany({
    where: { roomId },
    select: { tmdbMovieId: true },
  });

  return picks.map((p) => p.tmdbMovieId);
}
