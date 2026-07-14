'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { interviewsApi } from '@/src/api/interviews';
import { departmentsApi } from '@/src/api/departments';
import { useAuth } from '@/src/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeeklyRepeatToggle } from './WeeklyRepeatToggle';
import { Loader2, Plus, Trash, Calendar, Clock } from 'lucide-react';

interface BulkSlotFormProps {
  onSuccess?: () => void;
}

export function BulkSlotForm({ onSuccess }: BulkSlotFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [departmentId, setDepartmentId] = useState<string>('ANY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [times, setTimes] = useState<string[]>(['09:00', '10:00']);
  const [newTime, setNewTime] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]); // Default Mon-Fri

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.getAll,
  });

  const generateMutation = useMutation({
    mutationFn: (payload: any) => interviewsApi.bulkGenerate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      if (onSuccess) onSuccess();
    },
  });

  const handleDayToggle = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleAddTime = () => {
    if (!newTime || times.includes(newTime)) return;
    setTimes((prev) => [...prev, newTime].sort());
    setNewTime('');
  };

  const handleRemoveTime = (time: string) => {
    setTimes((prev) => prev.filter((t) => t !== time));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!startDate || !endDate || times.length === 0 || daysOfWeek.length === 0) return;

    generateMutation.mutate({
      hrId: user.sub,
      departmentId: departmentId === 'ANY' ? undefined : departmentId,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      times: times.map((t) => `${t}:00`), // Send as HH:MM:SS
      daysOfWeek,
      isRecurring,
    });
  };

  const weekdays = [
    { label: 'Sun', value: 0 },
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date From */}
        <div className="flex flex-col gap-1.5">
          <Label className="font-semibold text-black">Start Date</Label>
          <div className="relative">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
        </div>

        {/* Date To */}
        <div className="flex flex-col gap-1.5">
          <Label className="font-semibold text-black">End Date</Label>
          <div className="relative">
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
        </div>
      </div>

      {/* Target Department */}
      <div className="flex flex-col gap-1.5">
        <Label className="font-semibold text-black">Target Department</Label>
        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Any Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ANY">Any Department</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Day Selector */}
      <div className="flex flex-col gap-1.5">
        <Label className="font-semibold text-black flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-neutral-400" /> Active Weekdays
        </Label>
        <div className="flex flex-wrap gap-3 mt-1.5">
          {weekdays.map((day) => (
            <label key={day.value} className="flex items-center gap-1.5 text-xs text-black cursor-pointer font-medium">
              <Checkbox
                checked={daysOfWeek.includes(day.value)}
                onCheckedChange={() => handleDayToggle(day.value)}
              />
              {day.label}
            </label>
          ))}
        </div>
      </div>

      {/* Time slots tags list */}
      <div className="flex flex-col gap-1.5 border rounded-lg p-3 bg-neutral-50/30">
        <Label className="font-semibold text-black flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-neutral-400" /> Interview Times
        </Label>

        <div className="flex flex-wrap gap-2 mt-2">
          {times.map((time) => (
            <div key={time} className="flex items-center gap-1.5 bg-white border rounded-full px-2.5 py-1 text-xs">
              <span className="font-semibold text-neutral-700">{time}</span>
              <button
                type="button"
                onClick={() => handleRemoveTime(time)}
                className="text-neutral-400 hover:text-red-500 cursor-pointer"
              >
                <Trash className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Add new time slot */}
        <div className="flex gap-2 mt-3 max-w-[200px]">
          <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="h-8" />
          <Button type="button" size="xs" variant="outline" onClick={handleAddTime} className="cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Weekly Repeat */}
      <WeeklyRepeatToggle checked={isRecurring} onChange={setIsRecurring} />

      {generateMutation.isError && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 p-2.5 rounded-lg">
          Failed to generate slots. Please verify input date range.
        </p>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full font-semibold cursor-pointer"
        disabled={generateMutation.isPending || !startDate || !endDate || times.length === 0}
      >
        {generateMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Slots...
          </>
        ) : (
          'Generate Slots'
        )}
      </Button>
    </form>
  );
}
export default BulkSlotForm;
