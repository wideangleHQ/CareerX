'use client';

import React, { useState } from 'react';
import { InterviewStats } from './InterviewStats';
import { SlotCalendar } from './SlotCalendar';
import { UpcomingInterviewsList } from './UpcomingInterviewsList';
import { SlotGeneratorDialog } from './SlotGeneratorDialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export function InterviewWorkspace() {
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['slots'] });
    setTimeout(() => setIsRefreshing(false), 500); // UI feedback
  };

  return (
    <div className="space-y-6">
      {/* Header & Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-black tracking-tight">Interview Management</h1>
          <p className="text-sm text-muted-foreground">Manage interview schedules, availability, and upcoming sessions.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="cursor-pointer bg-white text-neutral-600 hover:text-neutral-900"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="cursor-pointer bg-white text-neutral-600 hover:text-neutral-900 hidden sm:flex">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <SlotGeneratorDialog />
        </div>
      </div>

      {/* Statistics */}
      <InterviewStats />

      {/* Main Content Split: Calendar & Upcoming Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-280px)] min-h-[600px]">
        {/* Left: Enhanced Slot Calendar (Interactive Directory) */}
        <div className="lg:col-span-5 h-full">
          <SlotCalendar 
            onDateSelect={setSelectedDate} 
            selectedDate={selectedDate} 
          />
        </div>

        {/* Right: Upcoming Interviews List */}
        <div className="lg:col-span-7 h-full">
          <UpcomingInterviewsList dateFilter={selectedDate} />
        </div>
      </div>
    </div>
  );
}
