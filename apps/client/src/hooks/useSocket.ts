import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { authService } from '../lib/auth';

const SOCKET_URL = 'http: 

 
interface ServerToClientEvents {
  'room:user-joined': (data: { userId: string; username: string; participantCount: number }) => void;
  'room:user-left': (data: { userId: string; username: string; participantCount: number }) => void;
  'draft:started': (data: { roomId: string; currentTurn: number; currentPlayerId: string }) => void;
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
  'error': (data: { message: string }) => void;
}

 
interface ClientToServerEvents {
  'room:join': (roomId: string) => void;
  'room:leave': (roomId: string) => void;
  'draft:sync-request': (roomId: string) => void;
}

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface UseSocketOptions {
  roomId: string;
  onUserJoined?: (data: { userId: string; username: string; participantCount: number }) => void;
  onUserLeft?: (data: { userId: string; username: string; participantCount: number }) => void;
  onDraftStarted?: (data: { roomId: string; currentTurn: number; currentPlayerId: string }) => void;
  onPickMade?: (data: {
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
  onTurnChanged?: (data: {
    currentTurn: number;
    currentPlayerId: string;
    currentPlayerName: string;
    roundNumber: number;
  }) => void;
  onDraftCompleted?: (data: { roomId: string; completedAt: string }) => void;
  onError?: (data: { message: string }) => void;
}

export function useSocket(options: UseSocketOptions) {
  const {
    roomId,
    onUserJoined,
    onUserLeft,
    onDraftStarted,
    onPickMade,
    onTurnChanged,
    onDraftCompleted,
    onError,
  } = options;

  const socketRef = useRef<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

   
  useEffect(() => {
    const token = authService.getToken();
    if (!token || !roomId) return;

     
    const socket: TypedSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

     
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('room:join', roomId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

     
    socket.on('room:user-joined', (data) => {
      onUserJoined?.(data);
    });

    socket.on('room:user-left', (data) => {
      onUserLeft?.(data);
    });

     
    socket.on('draft:started', (data) => {
      onDraftStarted?.(data);
    });

    socket.on('draft:pick-made', (data) => {
      onPickMade?.(data);
    });

    socket.on('draft:turn-changed', (data) => {
      onTurnChanged?.(data);
    });

    socket.on('draft:completed', (data) => {
      onDraftCompleted?.(data);
    });

     
    socket.on('error', (data) => {
      onError?.(data);
    });

     
    return () => {
      socket.emit('room:leave', roomId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);  

   
  const requestSync = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('draft:sync-request', roomId);
    }
  }, [roomId]);

  return {
    isConnected,
    requestSync,
  };
}
