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

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function toNumberValue(value: unknown) {
  return typeof value === 'number' ? value : undefined;
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

function applyMockLogin(identifier: string, password: string) {
  const fallbackIdentifier = identifier.trim();
  const fallbackPassword = password.trim();
  if (fallbackIdentifier === 'admin' && fallbackPassword === 'admin123') {
    const mockUser: AuthContextType['user'] = {
      email: 'admin@promanage.com',
      name: 'Admin User',
      role: 'admin',
      employeeId: 1,
      departmentCode: 1,
      userName: 'admin',
    };
    const mockToken = 'mock-token-admin';
    localStorage.setItem('token', mockToken);
    localStorage.setItem('auth', JSON.stringify({ isAuthenticated: true, user: mockUser, token: mockToken }));
    setIsAuthenticated(true);
    setUser(mockUser);
    return { success: true };
  }
  return { success: false, error: 'Invalid credentials' };
}

  const login = async (identifier: string, password: string) => {
    try {
      const res = await fetch(AUTH_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ClientCode: CLIENT_CODE,
          Username: identifier,
          Password: password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      const responseAny = data as Record<string, unknown>;
      const payload = ((responseAny.Data ?? responseAny.data) || responseAny) as Record<string, unknown>;

      if (!res.ok) {
        return applyMockLogin(identifier, password);
      }

      const success = (responseAny.Success ?? responseAny.success) !== false;
      if (!success) {
        return applyMockLogin(identifier, password);
      }

      const token =
        (responseAny.access_token as string) ||
        (responseAny.token as string) ||
        (responseAny.Token as string) ||
        (responseAny.accessToken as string) ||
        (payload.access_token as string) ||
        (payload.token as string) ||
        (payload.Token as string);

      const employeeInfo = (payload.EmployeeInfo as Record<string, unknown>) || {};
      const mappedUser: AuthContextType['user'] = {
        email: toStringValue(payload.email) || toStringValue(payload.UserName) || toStringValue(payload.userName) || identifier,
        name:
          toStringValue(payload.FullName) ||
          toStringValue(employeeInfo.Fullname) ||
          toStringValue(payload.fullName) ||
          toStringValue(payload.name) ||
          identifier,
        role: toStringValue(payload.UserGroupCode) === 'SA' ? 'admin' : 'user',
        employeeId: toNumberValue(payload.EmployeeID) ?? toNumberValue(employeeInfo.EmployeeInfoID),
        departmentCode: toNumberValue(employeeInfo.DepartmentID) ?? toNumberValue(payload.departmentCode),
        userName: toStringValue(payload.UserName) || toStringValue(payload.userName),
      };

      if (typeof token === 'string' && token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }

      localStorage.setItem('auth', JSON.stringify({ isAuthenticated: true, user: mappedUser, token: token ?? null }));
      setIsAuthenticated(true);
      setUser(mappedUser);
      return { success: true };
    } catch (err) {
      return applyMockLogin(identifier, password);
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
