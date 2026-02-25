import { authService } from './auth';

const API_BASE = 'http: 

export interface DraftSummary {
  id: string;
  name: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  participantCount: number;
  categoryCount: number;
  isCreator: boolean;
  inviteCode?: string;
}

export interface DraftRoom {
  id: string;
  name: string;
  inviteCode: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  currentTurn: number;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  participants: Array<{
    id: string;
    userId: string;
    draftPosition: number;
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
  }>;
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
  movieYear?: number | null;
  pickNumber: number;
}

export interface DraftState {
  roomId: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  currentTurn: number;
  currentRound: number;
  totalRounds: number;
  picks: DraftPick[];
  currentPicker: {
    participantId: string;
    participantName: string;
    roundNumber: number;
    isCurrentUser: boolean;
  } | null;
  participants: Array<{
    id: string;
    participantId: string;
    userId: string;
    name: string;
    draftPosition: number;
    isCurrentUser: boolean;
  }>;
  categories: Array<{
    id: string;
    name: string;
    order: number;
  }>;
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = authService.getToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
     
    authService.logout();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  return response;
}

export const api = {
   
  async getMyDrafts(): Promise<DraftSummary[]> {
    const response = await fetchWithAuth(`${API_BASE}/users/me/drafts`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch drafts');
    }

    const data = await response.json();
    return data.drafts;
  },

   
  async createRoom(name: string): Promise<DraftRoom> {
    const response = await fetchWithAuth(`${API_BASE}/rooms`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create room');
    }

    const data = await response.json();
    return data.room;
  },

  async getRoom(roomId: string): Promise<DraftRoom> {
    const response = await fetchWithAuth(`${API_BASE}/rooms/${roomId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch room');
    }

    const data = await response.json();
    return data.room;
  },

  async joinRoomByCode(inviteCode: string): Promise<DraftRoom> {
    const response = await fetchWithAuth(`${API_BASE}/rooms/join/${inviteCode}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to join room');
    }

    const data = await response.json();
    return data.room;
  },

  async getRoomByInviteCode(inviteCode: string): Promise<DraftRoom> {
    const response = await fetchWithAuth(`${API_BASE}/rooms/invite/${inviteCode}`);

    if (!response.ok) {
      throw new Error('Invalid invite code');
    }

    const data = await response.json();
    return data.room;
  },

   
  async addCategories(roomId: string, categories: { name: string }[]): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE}/rooms/${roomId}/categories/bulk`, {
      method: 'POST',
      body: JSON.stringify({ categories }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to add categories');
    }
  },

   
  async startDraft(roomId: string): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE}/draft/${roomId}/start`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to start draft');
    }
  },

  async getDraftState(roomId: string): Promise<DraftState> {
    const response = await fetchWithAuth(`${API_BASE}/draft/${roomId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch draft state');
    }

    const data = await response.json();
    return data.draft;
  },

  async makePick(roomId: string, pick: {
    categoryId: string;
    movieId: number;
    movieTitle: string;
    moviePosterUrl?: string | null;
    movieYear?: number | null;
  }): Promise<DraftPick> {
    const response = await fetchWithAuth(`${API_BASE}/draft/${roomId}/pick`, {
      method: 'POST',
      body: JSON.stringify(pick),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to make pick');
    }

    const data = await response.json();
    return data.pick;
  },

   
  async searchMovies(query: string, page = 1): Promise<any> {
    const response = await fetchWithAuth(
      `${API_BASE}/movies/search?q=${encodeURIComponent(query)}&page=${page}`
    );

    if (!response.ok) {
      throw new Error('Failed to search movies');
    }

    return response.json();
  },

  async getPopularMovies(page = 1): Promise<any> {
    const response = await fetchWithAuth(`${API_BASE}/movies/lists/popular?page=${page}`);

    if (!response.ok) {
      throw new Error('Failed to fetch popular movies');
    }

    return response.json();
  },
};
