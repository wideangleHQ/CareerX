'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interviewsApi } from '@/src/api/interviews';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Calendar, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/src/lib/utils';
import { formatSlotTime } from '@/src/lib/slot-time';

interface SlotCalendarProps {
  onDateSelect?: (dateStr: string | undefined) => void;
  selectedDate?: string;
}

export function SlotCalendar({ onDateSelect, selectedDate }: SlotCalendarProps) {
  const queryClient = useQueryClient();

  const { data: slotsRes, isLoading } = useQuery({
    queryKey: ['slots'],
    queryFn: () => interviewsApi.findAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => interviewsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });

  const slots = slotsRes?.data || [];

  // Group slots by date
  const groupedSlots = slots.reduce<Record<string, typeof slots>>((acc, slot) => {
    const dateKey = String(slot.slotDate).split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedSlots).sort();

  const formatTime = (timeStr: string) => formatSlotTime(timeStr);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'EEE, MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  const handleDateClick = (dateStr: string) => {
    if (onDateSelect) {
      onDateSelect(selectedDate === dateStr ? undefined : dateStr);
    }
  };

  return (
    <Card className="border-neutral-200 shadow-none h-full flex flex-col">
      <CardHeader className="bg-neutral-50/30 border-b p-4 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-bold text-neutral-800 flex items-center gap-2 min-w-0">
            <Calendar className="h-4 w-4 text-neutral-500 shrink-0" /> Slot Directory
          </CardTitle>
          <div className="flex gap-2 text-[10px] font-semibold tracking-wider uppercase shrink-0">
            <span className="flex items-center gap-1 text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Booked
            </span>
            <span className="flex items-center gap-1 text-neutral-500 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-200">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span> Available
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-auto custom-scrollbar bg-neutral-50/10">
        {isLoading ? (
          <div className="flex h-full min-h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]">
            <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
              <Calendar className="h-6 w-6 text-neutral-400" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">No slots scheduled</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
              Generate slots using the tools above to enable candidate bookings.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {sortedDates.map((dateStr) => {
              const isSelected = selectedDate === dateStr;
              return (
                <div key={dateStr} className="group">
                  {/* Date Header / Filter Button */}
                  <div 
                    onClick={() => handleDateClick(dateStr)}
                    className={cn(
                      "flex items-center justify-between p-3 cursor-pointer transition-colors border-l-2",
                      isSelected 
                        ? "bg-primary/5 border-l-primary" 
                        : "bg-white border-l-transparent hover:bg-neutral-50"
                    )}
                  >
                    <h4 className={cn("text-sm font-bold min-w-0 truncate", isSelected ? "text-primary" : "text-neutral-700")}>
                      {formatDate(dateStr)}
                    </h4>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="bg-neutral-100 text-[10px] whitespace-nowrap">
                        {groupedSlots[dateStr].length} Slots
                      </Badge>
                      <ChevronRight className={cn(
                        "h-4 w-4 text-neutral-400 transition-transform",
                        isSelected && "rotate-90 text-primary"
                      )} />
                    </div>
                  </div>

                  {/* Slots List (Expandable or always visible. We will keep it visible but visually nested) */}
                  <div className={cn(
                    "bg-neutral-50/50 px-4 py-3 border-b border-neutral-100",
                    !isSelected && selectedDate ? "hidden" : "block"
                  )}>
                    {/* Max 2 columns: this panel is only 5/12 wide on desktop, so 3
                        columns left ~120px per chip and the badge overlapped the
                        delete button. */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {groupedSlots[dateStr].map((slot) => (
                        <div
                          key={slot.id}
                          className={cn(
                            "flex items-center justify-between gap-2 border rounded-lg p-2.5 transition-shadow bg-white",
                            slot.isBooked ? "border-green-200/60 shadow-sm" : "border-neutral-200 hover:shadow-sm"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Clock className={cn("h-3.5 w-3.5 shrink-0", slot.isBooked ? "text-green-500" : "text-neutral-400")} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-neutral-900 leading-none whitespace-nowrap">
                                {formatTime(slot.slotTime)}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-1 truncate">
                                {slot.department?.name || 'Any Dept'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {slot.isBooked ? (
                              <Badge variant="default" className="text-[9px] px-1.5 bg-green-50 text-green-700 border border-green-200 shadow-none hover:bg-green-100">
                                Booked
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[9px] px-1.5 bg-neutral-100 text-neutral-500 border border-neutral-200 shadow-none hover:bg-neutral-200">
                                Available
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deleteMutation.isPending || slot.isBooked}
                              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(slot.id); }}
                              className={cn(
                                "h-6 w-6 rounded-full",
                                slot.isBooked 
                                  ? "opacity-30 cursor-not-allowed" 
                                  : "text-neutral-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                              )}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
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
export default SlotCalendar;
