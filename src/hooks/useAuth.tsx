import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthState } from '../types';
import { getMe, logout as logoutApi } from '../lib/auth';

interface AuthContextType extends AuthState {
  loading: boolean;
  setAuth: (auth: AuthState) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [auth, setAuthState] = useState<AuthState>({
    token: null,
    usuario: null,
    tenant: null,
  });

  useEffect(() => {
    getMe().then((data) => {
      if (data) setAuthState(data);
      setLoading(false);
    });
  }, []);

  function setAuth(data: AuthState) {
    setAuthState(data);
  }

  async function logout() {
    await logoutApi();
    setAuthState({ token: null, usuario: null, tenant: null });
  }

  return (
    <AuthContext.Provider value={{ ...auth, loading, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
