import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string; name: string; role: 'admin' | 'user'; employeeId?: number; departmentCode?: number; userName?: string } | null;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

interface StoredAuth {
  isAuthenticated: boolean;
  user: AuthContextType['user'];
  token?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
const CLIENT_CODE = import.meta.env.VITE_CLIENT_CODE || '';
const AUTH_LOGIN_URL = `${API_BASE}/Authenticate/Login`;
const GET_USER_INFO_URL = `${API_BASE}/GetLoggedInUserInfo`;

async function apiCall(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  return fetch(url, { ...options, headers });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as StoredAuth;
        if (parsed.token) {
          localStorage.setItem('token', parsed.token);
        }
        setIsAuthenticated(Boolean(parsed.isAuthenticated));
        setUser(parsed.user ?? null);
      } catch {
        localStorage.removeItem('auth');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const res = await fetch(AUTH_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ClientCode: CLIENT_CODE,
          Username: identifier,
          Password: password,
          FCMToken: '',
          DeviceID: '',
          ParkingVendorInfoID: 0,
          ParkingVendorCode: '',
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        let message = `Login failed (${res.status})`;
        try {
          const err = JSON.parse(text);
          message = err.message || err.error || err.description || message;
        } catch {
          if (text) message = text;
        }
        return { success: false, error: message };
      }

      const data = await res.json().catch(() => ({}));
      const token =
        (data as Record<string, unknown>).access_token ||
        (data as Record<string, unknown>).token ||
        (data as Record<string, unknown>).Token ||
        (data as Record<string, unknown>).accessToken;

      const user: AuthContextType['user'] = {
        email: identifier,
        name: identifier,
        role: 'admin',
      };

      const sessionToken = typeof token === 'string' && token ? token : import.meta.env.VITE_BEARER_TOKEN;
      if (sessionToken) {
        localStorage.setItem('token', sessionToken);
      }

      try {
        const userRes = await apiCall(GET_USER_INFO_URL);
        if (userRes.ok) {
          const userData = await userRes.json().catch(() => null);
          if (userData) {
            const mapped: AuthContextType['user'] = {
              email: userData.email || userData.userName || identifier,
              name: userData.name || userData.fullName || identifier,
              role: (userData.role as 'admin' | 'user') || 'admin',
              employeeId: userData.employeeId,
              departmentCode: userData.departmentCode,
              userName: userData.userName,
            };
            localStorage.setItem('auth', JSON.stringify({ isAuthenticated: true, user: mapped, token: sessionToken ?? null }));
            setIsAuthenticated(true);
            setUser(mapped);
            return { success: true };
          }
        }
      } catch {
        // fallback to basic user if user info cannot be fetched
      }

      localStorage.setItem('auth', JSON.stringify({ isAuthenticated: true, user, token: sessionToken ?? null }));
      setIsAuthenticated(true);
      setUser(user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Network error' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('auth');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
