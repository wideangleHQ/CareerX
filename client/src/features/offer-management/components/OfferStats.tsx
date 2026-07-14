import React from 'react';
import { useOfferStats } from '../hooks/useOffers';
import {
  FileText,
  CheckCircle,
  XCircle,
  Send,
  Clock,
  UserCheck,
  CalendarCheck,
  CalendarDays,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function OfferStats() {
  const { data: res, isLoading } = useOfferStats();
  const stats = res?.data;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-4 rounded-xl border shadow-sm space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    { title: 'Released', value: stats?.RELEASED || 0, icon: <Send className="h-5 w-5 text-blue-500" />, bg: 'bg-blue-50' },
    { title: 'Accepted', value: stats?.ACCEPTED || 0, icon: <CheckCircle className="h-5 w-5 text-green-500" />, bg: 'bg-green-50' },
    { title: 'Declined', value: stats?.DECLINED || 0, icon: <XCircle className="h-5 w-5 text-red-500" />, bg: 'bg-red-50' },
    { title: 'Expired', value: stats?.EXPIRED || 0, icon: <Clock className="h-5 w-5 text-orange-500" />, bg: 'bg-orange-50' },
    { title: 'Draft', value: stats?.DRAFT || 0, icon: <FileText className="h-5 w-5 text-neutral-500" />, bg: 'bg-neutral-50' },
    { title: 'Joined', value: stats?.JOINED || 0, icon: <UserCheck className="h-5 w-5 text-emerald-500" />, bg: 'bg-emerald-50' },
    { title: 'Joining Today', value: stats?.joiningToday || 0, icon: <CalendarCheck className="h-5 w-5 text-primary" />, bg: 'bg-green-50' },
    { title: 'Joining This Week', value: stats?.joiningThisWeek || 0, icon: <CalendarDays className="h-5 w-5 text-primary" />, bg: 'bg-green-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat, i) => (
        <div key={i} className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-500">{stat.title}</p>
            <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
          </div>
          <div className={`p-3 rounded-full ${stat.bg}`}>
            {stat.icon}
          </div>
        </div>
      ))}
    </div>
  );
}
