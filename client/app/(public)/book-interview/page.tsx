'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DepartmentSelect } from '@/src/features/candidate-portal/components/DepartmentSelect';
import { InterviewSlotPicker } from '@/src/features/candidate-portal/components/InterviewSlotPicker';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { interviewsApi } from '@/src/api/interviews';
import { Loader2, CheckCircle } from 'lucide-react';

const bookSchema = z.object({
  applicationId: z.string().uuid('Please enter a valid Application ID'),
  departmentId: z.string().uuid('Please select a department'),
  slotId: z.string().uuid('Please select an interview slot'),
});

type BookFormData = z.infer<typeof bookSchema>;

export default function BookInterviewPage() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      applicationId: '',
      departmentId: '',
      slotId: '',
    },
  });

  const selectedDeptId = watch('departmentId');

  const onSubmit = async (data: BookFormData) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await interviewsApi.book({
        applicationId: data.applicationId,
        slotId: data.slotId,
      });
      if (res.success) {
        setSuccess(true);
      } else {
        setError('Failed to book interview slot.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Booking failed. Verify your Application ID.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md border-neutral-200 text-center p-6">
        <CardContent className="space-y-4 pt-6 flex flex-col items-center">
          <CheckCircle className="h-12 w-12 text-primary" />
          <h2 className="text-xl font-bold text-black">Slot Booked Successfully!</h2>
          <p className="text-sm text-neutral-500">
            Your interview slot has been reserved. You will receive an invitation email shortly.
          </p>
          <Button onClick={() => window.location.reload()} className="w-full mt-4 cursor-pointer">
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-neutral-200">
      <CardHeader className="space-y-1 bg-neutral-50/50 border-b p-6">
        <CardTitle className="text-xl font-bold text-black">Schedule Interview</CardTitle>
        <CardDescription className="text-neutral-500">
          Enter your Application ID to select and schedule your slot.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Application ID */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-black">Application ID (UUID)</label>
            <Input
              {...register('applicationId')}
              placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className={errors.applicationId ? 'border-destructive ring-destructive/20' : ''}
            />
            {errors.applicationId && (
              <p className="text-xs text-red-500">{errors.applicationId.message}</p>
            )}
          </div>

          {/* Department Select */}
          <Controller
            name="departmentId"
            control={control}
            render={({ field }) => (
              <DepartmentSelect
                value={field.value}
                onChange={(val) => {
                  field.onChange(val);
                  setValue('slotId', ''); // Reset slot when department changes
                }}
                error={errors.departmentId?.message}
              />
            )}
          />

          {/* Slot picker */}
          {selectedDeptId && (
            <Controller
              name="slotId"
              control={control}
              render={({ field }) => (
                <InterviewSlotPicker
                  departmentId={selectedDeptId}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.slotId?.message}
                />
              )}
            />
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg p-3">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full font-semibold cursor-pointer"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling...
              </>
            ) : (
              'Confirm Interview Slot'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
