'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface WeeklyRepeatToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function WeeklyRepeatToggle({ checked, onChange }: WeeklyRepeatToggleProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border p-3 bg-neutral-50/50">
      <Checkbox
        id="weekly-repeat"
        checked={checked}
        onCheckedChange={(val) => onChange(!!val)}
      />
      <div className="grid gap-0.5 leading-none">
        <Label htmlFor="weekly-repeat" className="text-sm font-semibold cursor-pointer">
          Weekly Repeat Template
        </Label>
        <p className="text-[11px] text-muted-foreground">
          Repeat these slots weekly on the selected days of the week.
        </p>
      </div>
    </div>
  );
}
export default WeeklyRepeatToggle;
