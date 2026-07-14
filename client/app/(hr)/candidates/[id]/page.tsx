'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { CandidateProfile } from '@/src/features/hr-candidates/components/CandidateProfile';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CandidateDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/candidates">
          <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-black cursor-pointer">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Candidates
          </Button>
        </Link>
      </div>
      <CandidateProfile candidateId={id} />
    </div>
  );
}
