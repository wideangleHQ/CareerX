import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function SuccessPage() {
  return (
    <div className="text-center space-y-4 bg-white border border-neutral-200 rounded-xl p-8 max-w-md w-full shadow-sm flex flex-col items-center">
      <CheckCircle className="h-12 w-12 text-primary" />
      <h1 className="text-xl font-bold text-black">Application Registered</h1>
      <p className="text-sm text-neutral-500">
        Your application has been submitted and your interview slot has been booked.
      </p>
      <Link href="/apply" className="w-full pt-2">
        <Button className="w-full cursor-pointer">Back to Job Portal</Button>
      </Link>
    </div>
  );
}
