import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verify } from 'jsonwebtoken';
import { config } from '../config';

export interface ServerToClientEvents {
  'room:user-joined': (data: {
    userId: string;
    username: string;
    participantCount: number;
  }) => void;
  'room:user-left': (data: {
    userId: string;
    username: string;
    participantCount: number;
  }) => void;

  'draft:started': (data: {
    roomId: string;
    currentTurn: number;
    currentPlayerId: string;
  }) => void;
  'draft:pick-made': (data: {
    pickId: string;
    participantId: string;
    participantName: string;
    categoryId: string;
    categoryName: string;
    movieId: number;
    movieTitle: string;
    moviePosterUrl: string | null;
    pickNumber: number;
  }) => void;
  'draft:turn-changed': (data: {
    currentTurn: number;
    currentPlayerId: string;
    currentPlayerName: string;
    roundNumber: number;
  }) => void;
  'draft:completed': (data: { roomId: string; completedAt: string }) => void;

  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'room:join': (roomId: string) => void;
  'room:leave': (roomId: string) => void;

  'draft:sync-request': (roomId: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  email: string;
}

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

let io: SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> | null = null;

export function initializeSocketIO(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.cors.origin,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket, next) => {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = verify(token, config.auth.secret) as {
        userId: string;
        email: string;
      };
      socket.data.userId = payload.userId;
      socket.data.email = payload.email;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AppSocket) => {
    console.log(`[Socket] User connected: ${socket.data.userId}`);

    socket.on('room:join', (roomId: string) => {
      socket.join(`room:${roomId}`);
      console.log(`[Socket] User ${socket.data.userId} joined room ${roomId}`);
    });

    socket.on('room:leave', (roomId: string) => {
      socket.leave(`room:${roomId}`);
      console.log(`[Socket] User ${socket.data.userId} left room ${roomId}`);
    });

    socket.on('draft:sync-request', (roomId: string) => {
      console.log(
        `[Socket] Sync requested for room ${roomId} by user ${socket.data.userId}`,
      );
    });

    socket.on('disconnect', (reason) => {
      console.log(
        `[Socket] User disconnected: ${socket.data.userId} (${reason})`,
      );
    });
  });

  console.log('[Socket] Socket.io initialized');
  return io;
}

export function getIO(): SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

export function emitToRoom(
  roomId: string,
  event: keyof ServerToClientEvents,

  data: any,
): void {
  if (!io) {
    console.warn('[Socket] Cannot emit - Socket.io not initialized');
    return;
  }
  io.to(`room:${roomId}`).emit(event, data);
}

export function emitToUser(
  userId: string,
  event: keyof ServerToClientEvents,

  data: any,
): void {
  if (!io) {
    console.warn('[Socket] Cannot emit - Socket.io not initialized');
    return;
  }
  const sockets = io.sockets.sockets;
  sockets.forEach((socket) => {
    if (socket.data.userId === userId) {
      socket.emit(event, data);
    }
  });
}
