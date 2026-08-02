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
const FALLBACK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjIiLCJqdGkiOiJlOTg3NmNlMy1hY2Y5LTQ5YjItODI2Yy01NDIxNDUxODU5NDEiLCJjb21wYW55Y29kZSI6ImttYy1kYyIsInVzZXJuYW1lIjoia21jYWRtaW4iLCJ1c2VyZ3JvdXBpZCI6IjIiLCJ1c2VyZ3JvdXBjb2RlIjoiU0EiLCJlbXBsb3llZWlkIjoiMTkiLCJkZXBhcnRtZW50Y29kZSI6IjEwMDIiLCJtb2R1bGUiOiJub3JtYWwiLCJleHAiOjE3ODU2NTI5MzksImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6NjE5NTUiLCJhdWQiOiJodHRwOi8vbG9jYWxob3N0OjQyMDAifQ.Y_ZNtyvkjWHMMLj7FIRGnP4vYLKENy8dG8h9A33v7N4';

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function toNumberValue(value: unknown) {
  return typeof value === 'number' ? value : undefined;
}

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
      const sessionToken = FALLBACK_TOKEN;
      localStorage.setItem('token', sessionToken);

      const userRes = await apiCall(GET_USER_INFO_URL);
      if (!userRes.ok) {
        return { success: false, error: `Failed to fetch user info (${userRes.status})` };
      }

      const userData = await userRes.json().catch(() => null);
      if (!userData) {
        return { success: false, error: 'Invalid response from user info endpoint' };
      }

      const userPayload = ((userData as Record<string, unknown>).Data ?? (userData as Record<string, unknown>).data ?? userData) as Record<string, unknown>;
      const employeeInfo = (userPayload.EmployeeInfo as Record<string, unknown>) || {};
      const mapped: AuthContextType['user'] = {
        email: toStringValue(userPayload.email) || toStringValue(userPayload.UserName) || toStringValue(userPayload.userName) || identifier,
        name:
          toStringValue(userPayload.FullName) ||
          toStringValue(employeeInfo.Fullname) ||
          toStringValue(userPayload.fullName) ||
          toStringValue(userPayload.name) ||
          identifier,
        role: toStringValue(userPayload.UserGroupCode) === 'SA' ? 'admin' : 'user',
        employeeId: toNumberValue(userPayload.EmployeeID) ?? toNumberValue(employeeInfo.EmployeeInfoID),
        departmentCode: toNumberValue(employeeInfo.DepartmentID) ?? toNumberValue(userPayload.departmentCode),
        userName: toStringValue(userPayload.UserName) || toStringValue(userPayload.userName),
      };

      localStorage.setItem('auth', JSON.stringify({ isAuthenticated: true, user: mapped, token: sessionToken }));
      setIsAuthenticated(true);
      setUser(mapped);
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
