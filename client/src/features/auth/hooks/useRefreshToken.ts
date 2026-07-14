import { useAuth } from '@/src/context/AuthContext';
import { useState } from 'react';

export function useRefreshToken() {
  const { refreshUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshToken = async () => {
    setIsRefreshing(true);
    try {
      await refreshUser();
    } catch (err) {
      console.error('Refresh token failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    refreshToken,
    isRefreshing,
  };
}
