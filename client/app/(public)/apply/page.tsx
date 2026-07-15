import React from 'react';
import { ApplicationForm } from '@/src/features/candidate-portal/components/ApplicationForm';

export const metadata = {
  title: 'Apply for Open Roles | CareerX Portal',
};

export default function ApplyPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-neutral-50/40 w-full min-h-[calc(100vh-4rem)]">
      <ApplicationForm />
    </div>
  );
}
