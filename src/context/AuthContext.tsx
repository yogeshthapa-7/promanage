import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiCall, clearTokenRefreshSubscribers, isTokenExpired } from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: {
    email: string;
    name: string;
    role: 'admin' | 'user';
    employeeId?: number;
    departmentCode?: number;
    userName?: string;
  } | null;
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

function toStringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toNumberValue(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && !isNaN(Number(value))) return Number(value);
  return undefined;
}



export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [loading, setLoading] = useState(true);

   const logout = useCallback(() => {
     setIsAuthenticated(false);
     setUser(null);
     localStorage.removeItem('auth');
     localStorage.removeItem('token');
     clearTokenRefreshSubscribers();
   }, []);

  // Initialize Auth State on Mount and listen for auth-expired events
  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
    };
    window.addEventListener('auth-expired', handleAuthExpired);

    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as StoredAuth;
        const token = parsed.token || localStorage.getItem('token');

        if (token && !isTokenExpired(token)) {
          localStorage.setItem('token', token);
          setIsAuthenticated(Boolean(parsed.isAuthenticated));
          setUser(parsed.user ?? null);
        } else {
          logout();
        }
      } catch {
        logout();
      }
    }
    setLoading(false);

    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, [logout]);

  const login = async (identifier: string, password: string) => {
  try {
    // 1. Prepare Payload
    const loginPayload = {
      ClientCode: CLIENT_CODE,
      Username: identifier,
      Password: password,
    };

    // DEBUG: Check console to ensure none of these fields are empty/undefined
    console.log('Sending Login Payload:', loginPayload);

    if (!CLIENT_CODE) {
      console.warn('WARNING: CLIENT_CODE is empty! Check VITE_CLIENT_CODE in your .env file.');
    }

    // 2. Make Request
    const loginRes = await fetch(AUTH_LOGIN_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(loginPayload),
    });

    // 3. Handle Errors with fallback text reading
    if (!loginRes.ok) {
      // Read raw text first in case response isn't JSON
      const rawErrorText = await loginRes.text();
      console.error(`Login Failed (${loginRes.status} ${loginRes.statusText}):`, rawErrorText);

      let errJson: Record<string, unknown> | null = null;
      try {
        errJson = JSON.parse(rawErrorText);
      } catch {
        // Response was plain text or HTML
      }

      const validationErrors = (errJson?.errors && typeof errJson.errors === 'object')
        ? Object.values(errJson.errors).flat().join(', ') 
        : null;

      return {
        success: false,
        error:
          validationErrors ||
          (errJson?.message as string) ||
          (errJson?.Message as string) ||
          rawErrorText ||
          `Login failed with status ${loginRes.status}`,
      };
    }

    // 4. Parse Token on Success
    const loginData = await loginRes.json();
    console.log('Login Response:', loginData);

    const token =
      loginData?.token ||
      loginData?.Token ||
      loginData?.Data?.token ||
      loginData?.data?.token ||
      loginData?.Data?.Token;

    if (!token || typeof token !== 'string') {
      return { success: false, error: 'Authentication succeeded, but no token was returned by server.' };
    }

    // Save token to localStorage immediately
    localStorage.setItem('token', token);

    // 5. Fetch User Info using the new token directly
    const userRes = await apiCall(GET_USER_INFO_URL);
    if (!userRes.ok) {
      logout();
      return { success: false, error: `Failed to fetch profile (${userRes.status})` };
    }

    const userData = await userRes.json().catch(() => null);
    if (!userData) {
      logout();
      return { success: false, error: 'Invalid profile response' };
    }

    const userPayload = ((userData.Data ?? userData.data ?? userData) as Record<string, unknown>) || {};
    const employeeInfo = ((userPayload.EmployeeInfo as Record<string, unknown>) || {}) as Record<string, unknown>;

    const mappedUser: AuthContextType['user'] = {
      email:
        toStringValue(userPayload.email) ||
        toStringValue(userPayload.UserName) ||
        toStringValue(userPayload.userName) ||
        identifier,
      name:
        toStringValue(userPayload.FullName) ||
        toStringValue(employeeInfo.Fullname) ||
        toStringValue(userPayload.fullName) ||
        identifier,
      role: toStringValue(userPayload.UserGroupCode) === 'SA' ? 'admin' : 'user',
      employeeId: toNumberValue(userPayload.EmployeeID) ?? toNumberValue(employeeInfo.EmployeeInfoID),
      departmentCode: toNumberValue(employeeInfo.DepartmentID) ?? toNumberValue(userPayload.departmentCode),
      userName: toStringValue(userPayload.UserName) || toStringValue(userPayload.userName),
    };

    localStorage.setItem(
      'auth',
      JSON.stringify({ isAuthenticated: true, user: mappedUser, token })
    );

    setIsAuthenticated(true);
    setUser(mappedUser);

    return { success: true };
  } catch (err) {
    logout();
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error during login',
    };
  }
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