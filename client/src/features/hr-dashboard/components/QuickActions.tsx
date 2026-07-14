'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  Calendar,
  BarChart3,
  FileSignature,
  Bell,
} from 'lucide-react';

const actions = [
  { label: 'Create Opportunity', href: '/opportunities', icon: Briefcase, color: 'text-primary bg-green-50' },
  { label: 'View Candidates', href: '/candidates', icon: Users, color: 'text-blue-600 bg-blue-50' },
  { label: 'Generate Slots', href: '/interviews/slots', icon: Calendar, color: 'text-amber-600 bg-amber-50' },
  { label: 'Reports', href: '/reports', icon: BarChart3, color: 'text-purple-600 bg-purple-50' },
  { label: 'Offers', href: '/offers', icon: FileSignature, color: 'text-emerald-600 bg-emerald-50' },
  { label: 'Notifications', href: '/settings', icon: Bell, color: 'text-red-500 bg-red-50' },
];

export function QuickActions() {
  return (
    <Card className="border-neutral-200">
      <CardHeader className="border-b p-6 bg-neutral-50/20">
        <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
        <p className="text-xs text-muted-foreground">Jump to key recruiter workflows.</p>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-xl border border-neutral-100 p-4 hover:bg-neutral-50 transition-colors cursor-pointer group"
            >
              <div className={`p-2.5 rounded-lg ${action.color} transition-transform group-hover:scale-105`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-neutral-700 text-center">{action.label}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
