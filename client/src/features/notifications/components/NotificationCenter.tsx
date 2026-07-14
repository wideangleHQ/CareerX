'use client';

import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle2, Circle, Clock, Info, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function NotificationCenter() {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const { notifications, meta, isLoading, markRead, markAllRead, isMarking } = useNotifications({
    unreadOnly: filter === 'UNREAD',
    page: 1,
    limit: 20,
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'WARNING': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'ERROR': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'INFO':
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black flex items-center gap-2">
            <Bell className="h-6 w-6 text-neutral-500" /> Notifications
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Stay updated with system activities, applications, and scheduling alerts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-neutral-100 p-1 rounded-lg">
            <Button
              variant={filter === 'ALL' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('ALL')}
              className={`h-8 text-xs cursor-pointer ${filter === 'ALL' ? 'shadow-sm' : 'text-neutral-600'}`}
            >
              All
            </Button>
            <Button
              variant={filter === 'UNREAD' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('UNREAD')}
              className={`h-8 text-xs cursor-pointer ${filter === 'UNREAD' ? 'shadow-sm' : 'text-neutral-600'}`}
            >
              Unread
              {meta?.unreadCount ? (
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px] bg-red-100 text-red-700 hover:bg-red-100">
                  {meta.unreadCount}
                </Badge>
              ) : null}
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead()}
            disabled={isMarking || meta?.unreadCount === 0}
            className="cursor-pointer h-10"
          >
            Mark All as Read
          </Button>
        </div>
      </div>

      <Card className="border-neutral-200 shadow-none">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-24">
              <Bell className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-neutral-900">You're all caught up!</h3>
              <p className="text-xs text-neutral-500 mt-1">There are no new notifications to display.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 sm:p-6 flex gap-4 transition-colors ${notif.is_read ? 'bg-white' : 'bg-primary/5'}`}
                >
                  <div className="shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className={`text-sm ${notif.is_read ? 'font-medium text-neutral-700' : 'font-bold text-neutral-900'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-medium whitespace-nowrap">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={`text-sm ${notif.is_read ? 'text-neutral-500' : 'text-neutral-700'}`}>
                      {notif.message}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="shrink-0 flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markRead(notif.id)}
                        disabled={isMarking}
                        className="h-8 w-8 text-neutral-400 hover:text-primary cursor-pointer rounded-full"
                        title="Mark as read"
                      >
                        <Circle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
