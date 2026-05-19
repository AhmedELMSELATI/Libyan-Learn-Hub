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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(localStorage.getItem('lms_token'));

  // Monkey-patch fetch to automatically inject the token for all API calls
  // This ensures the generated Orval client works transparently
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const currentToken = localStorage.getItem('lms_token');
      if (currentToken) {
        init = init || {};
        init.headers = {
          ...init.headers,
          'Authorization': `Bearer ${currentToken}`
        };
      }
      return originalFetch(input, init);
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const { data: user, isLoading, error } = useGetCurrentUser({
    query: {
      queryKey: ['/api/auth/me'],
      enabled: !!token,
      retry: false,
    }
  });

  // Clear token if me endpoint fails (invalid token)
  useEffect(() => {
    if (error && token) {
      logout();
    }
  }, [error]);

  const login = (newToken: string) => {
    localStorage.setItem('lms_token', newToken);
    setToken(newToken);
    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
  };

  const logout = useCallback((redirectUrl?: string | unknown) => {
    const finalUrl = typeof redirectUrl === 'string' ? redirectUrl : '/';
    localStorage.removeItem('lms_token');
    setToken(null);
    queryClient.setQueryData(['/api/auth/me'], null);
    queryClient.clear();
    // Force a hard reload to the home page or specified url. 
    // This solves the issue of white screens from stale lazy-loaded chunks (Vercel chunk loading errors)
    window.location.href = finalUrl;
  }, [queryClient]);

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
      isAuthenticated: !!user 
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
