'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@/src/api/types';
import { authApi } from '@/src/api/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  exchange: () => Promise<User>;
  refreshUser: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const refreshUser = async () => {
    try {
      const me = await authApi.me();
      setUser(me);
      setError(null);
    } catch (err: any) {
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const isPublic = path.startsWith('/apply') 
          || path.startsWith('/book-interview')
          || path.startsWith('/auth/exchange');
        if (isPublic) {
          setIsLoading(false);
          return;
        }
      }

      try {
        setIsLoading(true);
        const me = await authApi.me();
        setUser(me);
        setError(null);
      } catch (err: any) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const exchange = async (): Promise<User> => {
    try {
      setIsLoading(true);
      setError(null);
      queryClient.clear();
      await authApi.exchange();
      const me = await authApi.me();
      setUser(me);
      return me;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Authentication exchange failed';
      setError(msg);
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authApi.logout();
      setUser(null);
      setError(null);
      queryClient.clear();
      if (typeof window !== 'undefined') {
        const loginUrl = process.env.NEXT_PUBLIC_PERFORMX_LOGIN_URL ?? 'http://localhost:4001/login';
        window.location.href = loginUrl;
      }
    } catch (err: any) {
      console.error('Logout error:', err);
      setUser(null);
      queryClient.clear();
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    exchange,
    refreshUser,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/src/config/queryClient';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};
