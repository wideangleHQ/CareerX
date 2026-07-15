'use client';

import React, { useEffect, useRef } from 'react';
import { useAuthExchange } from '../hooks/useAuthExchange';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppConfig } from '@/src/config/app';

const PERFORMX_LOGIN_URL = AppConfig.performxLoginUrl;

/**
 * ExchangeHandler
 *
 * Minimal loading UI for the PerformX → CareerX SSO handshake.
 * Calls exchangeToken() once on mount (guarded against StrictMode double-fire).
 * Retry resets the in-flight guard inside useAuthExchange and fires again.
 */
export default function ExchangeHandler() {
  const { exchangeToken, isLoading, error } = useAuthExchange();
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    void exchangeToken();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-md text-center">

        {isLoading && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <h1 className="text-xl font-semibold text-black">Signing you in</h1>
            <p className="text-sm text-muted-foreground">
              Authorising your CareerX workspace session…
            </p>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-red-50 p-3 text-red-600">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-semibold text-black">Authentication Failed</h1>
            <p className="text-sm text-red-500 bg-red-50/50 border border-red-100 rounded-lg p-3">
              {error}
            </p>
            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={() => void exchangeToken()}>
                Retry
              </Button>
              <Button onClick={() => { window.location.href = PERFORMX_LOGIN_URL; }}>
                Back to PerformX
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
