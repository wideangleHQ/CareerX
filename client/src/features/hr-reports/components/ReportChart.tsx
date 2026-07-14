'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ChartDataPoint {
  label: string;
  value: number;
  total?: number;
}

interface ReportChartProps {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  loading?: boolean;
}

export function ReportChart({ title, subtitle, data, loading }: ReportChartProps) {
  const maxValue = data.length > 0 ? Math.max(...data.map((d) => d.value), 1) : 1;

  return (
    <Card className="border-neutral-200 shadow-none">
      <CardHeader className="p-6 border-b bg-neutral-50/10">
        <CardTitle className="text-base font-bold">{title}</CardTitle>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">No data available for this range.</p>
        ) : (
          <div className="space-y-4">
            {data.map((item, idx) => {
              const percentage = (item.value / maxValue) * 100;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-neutral-700">{item.label}</span>
                    <span className="text-black">
                      {item.value} {item.total !== undefined ? `/ ${item.total}` : ''}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
export default ReportChart;
