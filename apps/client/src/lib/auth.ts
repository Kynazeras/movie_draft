const API_BASE = 'http://localhost:3000';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  error: {
    message: string;
    status: number;
  };
}

class AuthService {
  private tokenKey = 'token';
  private userKey = 'user';

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error?.message || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    this.setSession(data);
    return data;
  }

  async register(
    email: string,
    password: string,
    name?: string,
  ): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, username: name }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error?.message || 'Registration failed');
    }

    const data: AuthResponse = await response.json();
    this.setSession(data);
    return data;
  }

  async logout(): Promise<void> {
    const token = this.getToken();

    if (token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout API error:', error);
      }
    }

    this.clearSession();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): User | null {
    const userJson = localStorage.getItem(this.userKey);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private setSession(data: AuthResponse): void {
    localStorage.setItem(this.tokenKey, data.token);
    localStorage.setItem(this.userKey, JSON.stringify(data.user));
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
}

export const authService = new AuthService();
