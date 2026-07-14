import React from 'react';
import Link from 'next/link';
import { Briefcase } from 'lucide-react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50/40 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white h-16 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-black text-lg select-none">
          <div className="rounded bg-primary text-primary-foreground p-1.5">
            <Briefcase className="h-4 w-4" />
          </div>
          <span>CareerX Portal</span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>
    </div>
  );
}
