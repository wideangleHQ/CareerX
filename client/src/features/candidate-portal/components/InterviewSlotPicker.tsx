'use client';

import React, { useState } from 'react';
import { useAvailableSlots } from '../hooks/useAvailableSlots';
import { cn } from '@/src/lib/utils';
import { Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface InterviewSlotPickerProps {
  departmentId: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function InterviewSlotPicker({ departmentId, value, onChange, error }: InterviewSlotPickerProps) {
  const { data: slots = [], isLoading, error: queryError } = useAvailableSlots(departmentId);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Group slots by date
  const groupedSlots = slots.reduce<Record<string, typeof slots>>((acc, slot) => {
    const dateKey = slot.slot_date.split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(slot);
    return acc;
  }, {});

  const dates = Object.keys(groupedSlots).sort();

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    onChange(''); // Reset selected slot when date changes
  };

  const formatTime = (timeStr: string) => {
    try {
      // timeStr might be "1970-01-01T10:00:00.000Z" or similar from DB
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'EEE, MMM dd');
    } catch {
      return dateStr;
    }
  };

  if (!departmentId) {
    return (
      <div className="rounded-lg border border-neutral-100 bg-neutral-50/50 p-4 text-center text-xs text-muted-foreground">
        Select a department first to see available interview slots.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 animate-pulse">
        <div className="h-4 w-32 rounded bg-neutral-200" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-10 rounded-lg bg-neutral-100" />
          <div className="h-10 rounded-lg bg-neutral-100" />
          <div className="h-10 rounded-lg bg-neutral-100" />
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50/30 p-4 text-xs text-amber-700">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
        <div>
          <p className="font-semibold">No Available Interview Slots</p>
          <p className="mt-0.5 opacity-90">
            There are no booking slots currently configured for this department. Please contact HR or apply anyway and we will reach out.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-semibold text-black">Schedule Your Interview</label>

      {/* Date list */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <CalendarIcon className="h-3.5 w-3.5" /> Select Date
        </span>
        <div className="flex flex-wrap gap-2">
          {dates.map((dateStr) => {
            const isSelected = selectedDate === dateStr;
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => handleDateSelect(dateStr)}
                className={cn(
                  "border text-xs rounded-lg px-3 py-2 transition-all cursor-pointer font-medium",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground font-semibold"
                    : "border-neutral-200 bg-white hover:bg-neutral-50"
                )}
              >
                {formatDate(dateStr)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div className="flex flex-col gap-1.5 animate-fadeIn">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Select Time Slot
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {groupedSlots[selectedDate].map((slot) => {
              const isSelected = value === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => onChange(slot.id)}
                  className={cn(
                    "border text-xs rounded-lg py-2 text-center transition-all cursor-pointer font-medium",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary border-2"
                      : "border-neutral-200 bg-white hover:bg-neutral-50"
                  )}
                >
                  {formatTime(slot.slot_time)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
export default InterviewSlotPicker;
