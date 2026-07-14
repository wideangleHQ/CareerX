'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function HRError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-6 bg-white border border-neutral-200 rounded-xl max-w-md mx-auto my-12 shadow-sm">
      <div className="rounded-full bg-red-50 p-3.5 text-red-600">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-black mt-4">Something went wrong!</h2>
      <p className="text-sm text-neutral-500 mt-2">
        An error occurred in this workspace module.
      </p>
      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={reset} className="cursor-pointer">
          Try Again
        </Button>
        <Button onClick={() => (window.location.href = '/dashboard')} className="cursor-pointer">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
