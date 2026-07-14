'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { interviewsApi } from '@/src/api/interviews';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export function TodayInterviewsTable() {
  const todayStr = new Date().toISOString().split('T')[0];

  const { data: slotsRes, isLoading } = useQuery({
    queryKey: ['today-interviews'],
    queryFn: () =>
      interviewsApi.findAll({
        startDate: todayStr,
        endDate: todayStr,
        isBooked: true,
      }),
  });

  const slots = slotsRes?.data || [];

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  return (
    <Card className="border-neutral-200">
      <CardHeader className="border-b p-6 bg-neutral-50/20">
        <CardTitle className="text-base font-bold">Today's Interviews</CardTitle>
        <p className="text-xs text-muted-foreground">List of interviews scheduled for today.</p>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No interviews scheduled for today.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Interviewer (HR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slots.map((slot) => (
                <TableRow key={slot.id}>
                  <TableCell className="font-medium text-black">
                    {formatTime(slot.slot_time)}
                  </TableCell>
                  <TableCell>
                    {/* Assuming slot details has slot_assignment and application in production */}
                    Candidate ID: {slot.hr_id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>{slot.department?.name || 'General'}</TableCell>
                  <TableCell>{slot.hr?.full_name || 'HR Employee'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
export default TodayInterviewsTable;
