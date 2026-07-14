'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/src/api/reports';
import { ReportFilters } from '@/src/features/hr-reports/components/ReportFilters';
import { ReportChart } from '@/src/features/hr-reports/components/ReportChart';
import { ExportDialog } from '@/src/features/hr-reports/components/ExportDialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/src/features/hr-applications/components/StatusBadge';
import { BarChart3, Loader2, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const [departmentId, setDepartmentId] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: appsRes, isLoading: appsLoading } = useQuery({
    queryKey: ['report-applications', departmentId, startDate, endDate],
    queryFn: () =>
      reportsApi.getApplicationsReport({
        department_id: departmentId === 'ALL' ? undefined : departmentId,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      }),
  });

  const { data: slotsRes, isLoading: slotsLoading } = useQuery({
    queryKey: ['report-interviews', departmentId, startDate, endDate],
    queryFn: () =>
      reportsApi.getInterviewsReport({
        department_id: departmentId === 'ALL' ? undefined : departmentId,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      }),
  });

  const appData = (appsRes as any)?.data || [];
  const slotData = (slotsRes as any)?.data || [];

  // Compute stats
  const statusCounts = appData.reduce((acc: any, app: any) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  const applicationChartData = [
    { label: 'New', value: statusCounts.NEW || 0 },
    { label: 'Slot Booked', value: statusCounts.SLOT_BOOKED || 0 },
    { label: 'Interviewed', value: statusCounts.INTERVIEWED || 0 },
    { label: 'Selected', value: statusCounts.SELECTED || 0 },
    { label: 'Rejected', value: statusCounts.REJECTED || 0 },
  ];

  const totalSlots = slotData.length;
  const bookedSlots = slotData.filter((s: any) => s.is_booked).length;
  const availableSlots = totalSlots - bookedSlots;

  const interviewChartData = [
    { label: 'Total Slots', value: totalSlots },
    { label: 'Booked Slots', value: bookedSlots },
    { label: 'Available Slots', value: availableSlots },
  ];

  const handleClearFilters = () => {
    setDepartmentId('ALL');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-black flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-neutral-500" /> Analytical Reports
          </h1>
          <p className="text-xs text-muted-foreground">
            Recruitment pipeline visualizations and file exports.
          </p>
        </div>
        <ExportDialog departmentId={departmentId} startDate={startDate} endDate={endDate} />
      </div>

      <ReportFilters
        departmentId={departmentId}
        onDepartmentIdChange={setDepartmentId}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onClear={handleClearFilters}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReportChart
          title="Applications Breakdown"
          subtitle="Count of candidate applications by status"
          data={applicationChartData}
          loading={appsLoading}
        />
        <ReportChart
          title="Interview Slots Booking"
          subtitle="Statistics of configured interview slots"
          data={interviewChartData}
          loading={slotsLoading}
        />
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications report preview */}
        <Card className="border-neutral-200 shadow-none">
          <CardHeader className="p-6 border-b bg-neutral-50/10">
            <CardTitle className="text-sm font-bold">Applications Log (Recent)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {appsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : appData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No applications found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appData.slice(0, 5).map((app: any) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-semibold text-black">{app.application_code}</TableCell>
                      <TableCell>{app.candidate?.full_name}</TableCell>
                      <TableCell>
                        <StatusBadge status={app.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Interview slots preview */}
        <Card className="border-neutral-200 shadow-none">
          <CardHeader className="p-6 border-b bg-neutral-50/10">
            <CardTitle className="text-sm font-bold">Slots Log (Recent)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {slotsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : slotData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No slots found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slotData.slice(0, 5).map((slot: any) => (
                    <TableRow key={slot.id}>
                      <TableCell className="text-xs font-medium text-black">
                        {new Date(slot.slot_date).toLocaleDateString()} at{' '}
                        {new Date(slot.slot_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell>{slot.department?.name || 'Any'}</TableCell>
                      <TableCell>
                        {slot.is_booked ? (
                          <Badge variant="default" className="text-[9px] bg-green-50 text-green-700 border-green-200">Booked</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px] bg-neutral-50 text-neutral-500 border-neutral-200">Available</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
