import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useGetCurrentUser, type User } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null | undefined;
  isLoading: boolean;
  login: (token: string) => void;
  logout: (redirectUrl?: string) => void;
  refetchUser: () => void;
  isAuthenticated: boolean;
  isLocked: boolean;
  lock: () => void;
  unlock: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_UNLOCK_KEY = 'lms_session_unlocked';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(localStorage.getItem('lms_token'));
  // Session is locked by default on every new tab/browser open
  // It only becomes unlocked after the user enters their passkey (or if they have no passkey)
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const alreadyUnlocked = sessionStorage.getItem(SESSION_UNLOCK_KEY) === 'true';
    return !alreadyUnlocked;
  });

  // We removed the fetch monkey-patch because it causes a race condition on mobile where React Query 
  // executes before the patch applies. The token is now automatically injected directly inside custom-fetch.ts.

  const { data: user, isLoading, error } = useGetCurrentUser({
    query: {
      queryKey: ['/api/auth/me'],
      enabled: !!token,
      retry: false,
    }
  });

  // Clear token if me endpoint explicitly rejects it (invalid token)
  // We check for 401/403 to prevent wiping the token during transient network drops (like switching apps on mobile)
  useEffect(() => {
    if (error && token) {
      const status = (error as any)?.status;
      if (status === 401 || status === 403) {
        logout();
      }
    }
  }, [error]);

  // Once we know whether the user has a passkey, decide whether to lock or auto-unlock
  useEffect(() => {
    if (!user) return;
    const alreadyUnlocked = sessionStorage.getItem(SESSION_UNLOCK_KEY) === 'true';
    if (alreadyUnlocked) {
      setIsLocked(false);
      return;
    }
    // If user has no passkey, unlock automatically
    if (!(user as any).hasPasskey) {
      setIsLocked(false);
      sessionStorage.setItem(SESSION_UNLOCK_KEY, 'true');
    }
    // If they do have a passkey and session is not unlocked, keep locked (show lock screen)
  }, [user]);

  const login = (newToken: string) => {
    localStorage.setItem('lms_token', newToken);
    setToken(newToken);
    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    // Mark session as unlocked on fresh login — they just proved their identity
    sessionStorage.setItem(SESSION_UNLOCK_KEY, 'true');
    setIsLocked(false);
  };

  const logout = useCallback((redirectUrl?: string | unknown) => {
    const finalUrl = typeof redirectUrl === 'string' ? redirectUrl : '/';
    localStorage.removeItem('lms_token');
    sessionStorage.removeItem(SESSION_UNLOCK_KEY);
    setToken(null);
    setIsLocked(true);
    queryClient.setQueryData(['/api/auth/me'], null);
    queryClient.clear();
    // Force a hard reload to the home page or specified url.
    // This solves the issue of white screens from stale lazy-loaded chunks (Vercel chunk loading errors)
    window.location.href = finalUrl;
  }, [queryClient]);

  const lock = useCallback(() => {
    sessionStorage.removeItem(SESSION_UNLOCK_KEY);
    setIsLocked(true);
  }, []);

  const unlock = useCallback(() => {
    sessionStorage.setItem(SESSION_UNLOCK_KEY, 'true');
    setIsLocked(false);
  }, []);

  const refetchUser = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading: isLoading && !!token,
      login,
      logout,
      refetchUser,
      isAuthenticated: !!user,
      isLocked,
      lock,
      unlock,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
