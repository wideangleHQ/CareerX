'use client';

import React from 'react';
import { BulkSlotForm } from '@/src/features/hr-interviews/components/BulkSlotForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function SlotsPage() {
  const router = useRouter();

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card className="border-neutral-200">
        <CardHeader className="border-b p-6 bg-neutral-50/20">
          <CardTitle className="text-lg font-bold">Generate Slots</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <BulkSlotForm onSuccess={() => router.push('/interviews')} />
        </CardContent>
      </Card>
    </div>
  );
}
