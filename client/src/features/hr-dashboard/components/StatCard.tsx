import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
}

export function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card className="border-neutral-200 hover:border-primary/20 transition-colors">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{title}</p>
            <p className="text-2xl font-bold text-neutral-900">{value}</p>
          </div>
          {icon && <div className="rounded-lg bg-primary/5 p-2.5 shrink-0">{icon}</div>}
        </div>
        {description && <p className="text-[11px] text-muted-foreground mt-2 truncate">{description}</p>}
      </CardContent>
    </Card>
  );
}
export default StatCard;
