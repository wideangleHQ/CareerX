'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { reportsApi } from '@/src/api/reports';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Loader2 } from 'lucide-react';

interface ExportDialogProps {
  departmentId?: string;
  startDate?: string;
  endDate?: string;
}

export function ExportDialog({ departmentId, startDate, endDate }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<'APPLICATIONS' | 'INTERVIEWS'>('APPLICATIONS');
  const [format, setFormat] = useState<'EXCEL' | 'CSV'>('EXCEL');

  const exportMutation = useMutation({
    mutationFn: async () => {
      const blob = await reportsApi.exportReport({
        report_type: reportType,
        format,
        department_id: departmentId === 'ALL' ? undefined : departmentId,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `${reportType}_Report_${Date.now()}.${format === 'EXCEL' ? 'xlsx' : 'csv'}`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="cursor-pointer font-semibold">
          <Download className="mr-1.5 h-4 w-4" /> Export Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Export Directory</DialogTitle>
          <DialogDescription>
            Download candidate lists or interview slot histories.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {/* Report Type */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-neutral-500">Report Scope</span>
            <Select value={reportType} onValueChange={(val: any) => setReportType(val)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Applications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APPLICATIONS">Applications List</SelectItem>
                <SelectItem value="INTERVIEWS">Interview Slots</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Format */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-neutral-500">Output Format</span>
            <Select value={format} onValueChange={(val: any) => setFormat(val)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Excel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXCEL">Excel Spreadsheet (.xlsx)</SelectItem>
                <SelectItem value="CSV">CSV Format (.csv)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {exportMutation.isError && (
            <p className="text-[11px] text-red-500 bg-red-50 border border-red-100 p-2 rounded-lg">
              Failed to compile download.
            </p>
          )}

          <Button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="w-full font-semibold cursor-pointer"
          >
            {exportMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Downloading...
              </>
            ) : (
              'Download File'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export default ExportDialog;
