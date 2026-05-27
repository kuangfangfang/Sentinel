import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/auth';
import { getToken, setToken } from '../api/client';
import type { UserDto } from '../types';

export const ROLE_CASEWORKER = 'Caseworker';
export const ROLE_COMPLAINANT = 'Complainant';

interface AuthContextValue {
  user: UserDto | null;
  loading: boolean;
  isAuthenticated: boolean;
  isCaseworker: boolean;
  isComplainant: boolean;
  login: (email: string, password: string) => Promise<UserDto>;
  register: (fullName: string, email: string, password: string) => Promise<UserDto>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await authApi.me();
        if (active) setUser(me);
      } catch {
        setToken(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();
    const onUnauthorized = () => setUser(null);
    window.addEventListener('sentinel:unauthorized', onUnauthorized);
    return () => {
      active = false;
      window.removeEventListener('sentinel:unauthorized', onUnauthorized);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    const res = await authApi.register(fullName, email, password);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* logout is best-effort; the token is cleared regardless */
    }
    setToken(null);
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: !!user,
    isCaseworker: !!user?.roles.includes(ROLE_CASEWORKER),
    isComplainant: !!user?.roles.includes(ROLE_COMPLAINANT),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
