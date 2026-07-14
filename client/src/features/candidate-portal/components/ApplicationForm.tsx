'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { candidateApplicationSchema, type CandidateApplicationData } from '../schemas/application.schema';
import { useSubmitApplication } from '../hooks/useSubmitApplication';
import { DepartmentSelect } from './DepartmentSelect';
import { ResumeUpload } from './ResumeUpload';
import { InterviewSlotPicker } from './InterviewSlotPicker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubmissionSuccess } from './SubmissionSuccess';
import { Loader2 } from 'lucide-react';

export function ApplicationForm() {
  const submitMutation = useSubmitApplication();
  const [successData, setSuccessData] = useState<any | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CandidateApplicationData>({
    resolver: zodResolver(candidateApplicationSchema),
    defaultValues: {
      fullName: '',
      email: '',
      mobileNumber: '',
      whatsappNumber: '',
      departmentId: '',
      slotId: '',
      resume: null,
      selfDescription: '',
    },
  });

  const selectedDepartmentId = watch('departmentId');

  const onSubmit = async (data: CandidateApplicationData) => {
    try {
      const res = await submitMutation.mutateAsync(data);
      setSuccessData({
        candidate: res.candidate,
        application: res.application,
        slotId: data.slotId,
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (successData) {
    return <SubmissionSuccess data={successData} />;
  }

  return (
    <Card className="w-full max-w-2xl border-neutral-200">
      <CardHeader className="space-y-1 bg-neutral-50/50 border-b p-6">
        <CardTitle className="text-2xl font-bold text-black">Job Application</CardTitle>
        <CardDescription className="text-neutral-500">
          Apply for an open role and schedule your interview.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* General Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-black">Full Name</label>
              <Input
                {...register('fullName')}
                placeholder="John Doe"
                className={errors.fullName ? 'border-destructive ring-destructive/20' : ''}
              />
              {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-black">Email Address</label>
              <Input
                type="email"
                {...register('email')}
                placeholder="john@example.com"
                className={errors.email ? 'border-destructive ring-destructive/20' : ''}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-black">Mobile Number</label>
              <Input
                {...register('mobileNumber')}
                placeholder="+919999999999"
                className={errors.mobileNumber ? 'border-destructive ring-destructive/20' : ''}
              />
              {errors.mobileNumber && (
                <p className="text-xs text-red-500">{errors.mobileNumber.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-black">WhatsApp Number (Optional)</label>
              <Input
                {...register('whatsappNumber')}
                placeholder="+919999999999"
                className={errors.whatsappNumber ? 'border-destructive ring-destructive/20' : ''}
              />
              {errors.whatsappNumber && (
                <p className="text-xs text-red-500">{errors.whatsappNumber.message}</p>
              )}
            </div>
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
                  setValue('slotId', ''); // Reset slot selection on department change
                }}
                error={errors.departmentId?.message}
              />
            )}
          />

          {/* Resume Upload */}
          <Controller
            name="resume"
            control={control}
            render={({ field }) => (
              <ResumeUpload
                value={field.value}
                onChange={field.onChange}
                error={errors.resume?.message as string}
              />
            )}
          />

          {/* Self Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-black">Brief Introduction</label>
            <Textarea
              {...register('selfDescription')}
              placeholder="Tell us about your professional background and why you are a good fit for this role..."
              rows={4}
              className={errors.selfDescription ? 'border-destructive ring-destructive/20' : ''}
            />
            {errors.selfDescription && (
              <p className="text-xs text-red-500">{errors.selfDescription.message}</p>
            )}
          </div>

          {/* Interview Slot Picker */}
          {selectedDepartmentId && (
            <Controller
              name="slotId"
              control={control}
              render={({ field }) => (
                <InterviewSlotPicker
                  departmentId={selectedDepartmentId}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.slotId?.message}
                />
              )}
            />
          )}

          {/* Error Message */}
          {submitMutation.isError && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg p-3">
              {(submitMutation.error as any).message || 'Failed to submit application. Please try again.'}
            </p>
          )}

          {/* Submit Action */}
          <Button
            type="submit"
            className="w-full h-10 font-semibold cursor-pointer"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Application...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
export default ApplicationForm;
