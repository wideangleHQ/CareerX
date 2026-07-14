import { useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';

export function useAuthExchange() {
  const { exchange } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const exchangeToken = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await exchange();
      setIsSuccess(true);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Token exchange failed');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    exchangeToken,
    isLoading,
    error,
    isSuccess,
  };
}

export default useAuthExchange;